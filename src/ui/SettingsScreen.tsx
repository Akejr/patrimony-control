import { useState } from 'react';
import { Button, Card, ScreenContainer } from './components';
import { useStore } from '../state/store';
import type { AppState } from '../domain/types';
import { buildSummary } from '../sync/summary';
import { pushSummaryToGist } from '../sync/gist';

const inputClasses =
  'w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-background placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none';

const labelClasses =
  'font-label-md text-label-md font-semibold text-on-surface-variant';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; message: string }
  | { kind: 'error'; message: string };

/**
 * Tela de Ajustes: configura a sincronização do resumo do patrimônio com um
 * GitHub Gist, para alimentar o widget (Scriptable) no iPhone. O token e o ID
 * do gist ficam apenas no Local_Storage deste dispositivo.
 */
export default function SettingsScreen() {
  const sync = useStore((s) => s.sync);
  const setSyncConfig = useStore((s) => s.setSyncConfig);
  const accounts = useStore((s) => s.accounts);
  const snapshots = useStore((s) => s.snapshots);
  const currentRates = useStore((s) => s.currentRates);

  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function handleSyncNow() {
    setStatus({ kind: 'loading' });
    const appState: AppState = { accounts, snapshots, currentRates };
    const result = await pushSummaryToGist(sync, buildSummary(appState));
    setStatus(
      result.ok
        ? { kind: 'ok', message: 'Resumo sincronizado com sucesso.' }
        : { kind: 'error', message: result.error },
    );
  }

  return (
    <ScreenContainer
      title="Ajustes"
      subtitle="Sincronize o resumo para o widget do iPhone."
    >
      <Card className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary">widgets</span>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Publica apenas o <strong>total</strong> e as variações num gist
          secreto do GitHub. O widget (Scriptable) lê esse gist. Token e ID
          ficam só neste aparelho.
        </p>
      </Card>

      <Card>
        <div className="flex flex-col gap-stack-lg">
          {/* Habilitar */}
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className={labelClasses}>Sincronização automática</span>
            <input
              type="checkbox"
              className="h-6 w-6 rounded-lg text-primary focus:ring-primary/30 border-outline-variant"
              checked={sync.enabled}
              onChange={(e) => setSyncConfig({ enabled: e.target.checked })}
            />
          </label>

          {/* Gist ID */}
          <div className="flex flex-col gap-2">
            <label className={labelClasses} htmlFor="gist-id">
              ID do Gist
            </label>
            <input
              id="gist-id"
              className={inputClasses}
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="ex.: 3f9a2b1c4d5e6f..."
              value={sync.gistId}
              onChange={(e) => setSyncConfig({ gistId: e.target.value.trim() })}
            />
          </div>

          {/* Token */}
          <div className="flex flex-col gap-2">
            <label className={labelClasses} htmlFor="gist-token">
              Token do GitHub (escopo gist)
            </label>
            <input
              id="gist-token"
              className={inputClasses}
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="github_pat_..."
              value={sync.token}
              onChange={(e) => setSyncConfig({ token: e.target.value.trim() })}
            />
            <p className="font-label-sm text-label-sm text-on-surface-variant normal-case tracking-normal">
              Fica salvo apenas neste dispositivo. Use um token fine-grained só
              com permissão de Gists.
            </p>
          </div>

          {/* Nome do arquivo */}
          <div className="flex flex-col gap-2">
            <label className={labelClasses} htmlFor="gist-file">
              Arquivo no gist
            </label>
            <input
              id="gist-file"
              className={inputClasses}
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={sync.filename}
              onChange={(e) => setSyncConfig({ filename: e.target.value.trim() })}
            />
          </div>

          <Button
            type="button"
            variant="primary"
            className="w-full"
            disabled={status.kind === 'loading'}
            onClick={handleSyncNow}
          >
            <span className="material-symbols-outlined text-[20px]">sync</span>
            {status.kind === 'loading' ? 'Sincronizando...' : 'Sincronizar agora'}
          </Button>

          {status.kind === 'ok' && (
            <p
              className="flex items-center justify-center gap-1 font-label-md text-label-md font-semibold text-secondary"
              role="status"
            >
              <span className="material-symbols-outlined text-[18px]">
                check_circle
              </span>
              {status.message}
            </p>
          )}
          {status.kind === 'error' && (
            <p className="font-label-md text-label-md text-error" role="alert">
              {status.message}
            </p>
          )}
        </div>
      </Card>
    </ScreenContainer>
  );
}

import { useStore } from '../state/store';
import type { AppState } from '../domain/types';
import { buildSummary } from './summary';
import { pushSummaryToGist } from './gist';

/**
 * Ativa a sincronização automática do resumo do patrimônio com o gist.
 *
 * Observa mudanças relevantes no estado (contas, snapshots, taxas) e, quando
 * a sincronização está habilitada e configurada, publica o resumo no gist
 * com um pequeno atraso (debounce) para agrupar mudanças em sequência.
 *
 * Deve ser chamada uma única vez, na inicialização da aplicação.
 */
export function startAutoSync(): void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedulePush = () => {
    const { sync } = useStore.getState();
    if (!sync.enabled || !sync.gistId || !sync.token) return;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const state = useStore.getState();
      const appState: AppState = {
        accounts: state.accounts,
        snapshots: state.snapshots,
        currentRates: state.currentRates,
      };
      void pushSummaryToGist(state.sync, buildSummary(appState)).then((result) => {
        if (!result.ok) {
          console.warn('[sync] Sincronização automática falhou:', result.error);
        }
      });
    }, 2000);
  };

  // Dispara quando os dados que compõem o resumo mudam.
  useStore.subscribe((state, prev) => {
    const changed =
      state.accounts !== prev.accounts ||
      state.snapshots !== prev.snapshots ||
      state.currentRates !== prev.currentRates ||
      state.sync !== prev.sync;
    if (changed) schedulePush();
  });
}

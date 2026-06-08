import type { SyncConfig } from './config';
import type { PatrimonySummary } from './summary';

/** Resultado de uma operação de sincronização. */
export type SyncResult = { ok: true } | { ok: false; error: string };

/**
 * Publica (PATCH) o resumo do patrimônio no gist configurado, gravando o JSON
 * no arquivo indicado. Requer token com escopo `gist`.
 */
export async function pushSummaryToGist(
  config: SyncConfig,
  summary: PatrimonySummary,
): Promise<SyncResult> {
  if (!config.gistId || !config.token) {
    return { ok: false, error: 'Configure o ID do gist e o token nos Ajustes.' };
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${config.gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [config.filename]: { content: JSON.stringify(summary, null, 2) },
        },
      }),
    });

    if (!response.ok) {
      const detail =
        response.status === 401
          ? 'token inválido ou sem permissão (escopo gist).'
          : response.status === 404
            ? 'gist não encontrado (verifique o ID).'
            : `HTTP ${response.status}.`;
      return { ok: false, error: `Falha ao sincronizar: ${detail}` };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `Erro de rede ao sincronizar: ${(error as Error).message}`,
    };
  }
}

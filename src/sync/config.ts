/**
 * Configuração de sincronização do resumo do patrimônio para um GitHub Gist.
 *
 * O token e o ID do gist ficam APENAS no Local_Storage do dispositivo
 * (digitados pelo usuário nos Ajustes) — nunca no código-fonte público.
 */
export interface SyncConfig {
  /** Sincronização automática habilitada. */
  enabled: boolean;
  /** ID do gist (secret) onde o resumo é gravado. */
  gistId: string;
  /** Token do GitHub com escopo `gist` (somente neste dispositivo). */
  token: string;
  /** Nome do arquivo dentro do gist. */
  filename: string;
}

/** Chave dedicada para a config de sync (separada do AppState). */
export const SYNC_STORAGE_KEY = 'patrimony-control:sync:v1';

/** Config padrão: desabilitada, sem credenciais. */
export function defaultSyncConfig(): SyncConfig {
  return {
    enabled: false,
    gistId: '',
    token: '',
    filename: 'patrimonio.json',
  };
}

/** Carrega a config de sync do Local_Storage (ou o padrão). */
export function loadSyncConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_STORAGE_KEY);
    if (raw === null) return defaultSyncConfig();
    return { ...defaultSyncConfig(), ...(JSON.parse(raw) as Partial<SyncConfig>) };
  } catch (error) {
    console.warn('[sync] Falha ao carregar config de sync. Usando padrão.', error);
    return defaultSyncConfig();
  }
}

/** Persiste a config de sync no Local_Storage. */
export function saveSyncConfig(config: SyncConfig): void {
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('[sync] Falha ao salvar config de sync.', error);
  }
}

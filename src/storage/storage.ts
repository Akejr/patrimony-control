import type { AppState } from '../domain/types';
import { STORAGE_KEY, defaultState } from './schema';

/**
 * Carrega o AppState do Local_Storage.
 *
 * Retorna o estado default quando:
 *  - não há dados persistidos (primeira execução);
 *  - o conteúdo está corrompido/ilegível (erro de parsing);
 *  - o Local_Storage não está disponível.
 *
 * (Req. 6.2)
 */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return defaultState();
    }
    return JSON.parse(raw) as AppState;
  } catch (error) {
    console.warn(
      `[storage] Falha ao carregar o estado de "${STORAGE_KEY}". Usando estado default.`,
      error,
    );
    return defaultState();
  }
}

/**
 * Serializa o AppState completo em JSON e o persiste no Local_Storage
 * sob a chave única STORAGE_KEY. (Req. 6.1)
 */
export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn(
      `[storage] Falha ao salvar o estado em "${STORAGE_KEY}".`,
      error,
    );
  }
}

import type { AppState } from '../domain/types';

/**
 * Chave única do Local_Storage sob a qual todo o AppState é serializado.
 * O sufixo de versão (`v1`) permite migrações futuras sem colisão.
 * (Req. 6.1)
 */
export const STORAGE_KEY = 'patrimony-control:v1';

/**
 * Cria um estado default da aplicação: sem contas, sem snapshots e com
 * Taxas_Atuais iniciais sugeridas (Kz é sempre base = 1, portanto só
 * armazenamos BRL e EUR).
 *
 * Retorna sempre um objeto novo para evitar mutação compartilhada de estado.
 * (Req. 6.2)
 */
export function defaultState(): AppState {
  return {
    accounts: [],
    snapshots: [],
    currentRates: {
      BRL: 225,
      EUR: 1320,
    },
  };
}

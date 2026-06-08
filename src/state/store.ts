import { create } from 'zustand';
import type {
  Account,
  AppState,
  BalancesByAccount,
  CurrencyCode,
  ExchangeRates,
  WeeklySnapshot,
} from '../domain/types';
import {
  isSupportedCurrency,
  isValidAccountName,
  isValidRate,
} from '../domain/validation';
import { toMondayKey } from '../domain/dateUtils';
import { loadState, saveState } from '../storage/storage';
import {
  type SyncConfig,
  loadSyncConfig,
  saveSyncConfig,
} from '../sync/config';

/**
 * Resultado de uma ação que pode falhar por validação de input.
 * (Req. 1.4, 1.2, 5.4)
 */
export type Result = { ok: true } | { ok: false; error: string };

/**
 * Mensagens de erro de validação, alinhadas ao Tratamento de Erros do design.
 */
const ERROR_NAME_REQUIRED = 'O nome é obrigatório.';
const ERROR_CURRENCY_UNSUPPORTED = 'A moeda selecionada não é suportada.';
const ERROR_RATE_POSITIVE = 'A taxa deve ser maior que zero.';

/**
 * Ações expostas pela store. Cada mutação atualiza o estado em memória e
 * persiste imediatamente via `saveState`.
 */
export interface StoreActions {
  addAccount(name: string, currency: CurrencyCode): Result;
  editAccount(
    id: string,
    changes: Partial<Pick<Account, 'name' | 'currency'>>,
  ): Result;
  deleteAccount(id: string): void;
  upsertWeeklySnapshot(date: Date, balances: BalancesByAccount): void;
  updateRate(currency: 'BRL' | 'EUR', rate: number): Result;
  setDisplayCurrency(currency: CurrencyCode): void;
  /** Atualiza a configuração de sincronização (persistida à parte). */
  setSyncConfig(changes: Partial<SyncConfig>): void;
}

/**
 * Estado completo da store: campos do domínio (`AppState`) mais o estado de
 * UI `displayCurrency` (moeda de exibição selecionada, padrão Kwanza).
 */
export interface StoreState extends AppState, StoreActions {
  displayCurrency: CurrencyCode;
  /** Configuração de sincronização do widget (token/gist). */
  sync: SyncConfig;
}

/**
 * Extrai apenas os campos de domínio (`AppState`) a partir do estado da store
 * para persistência, descartando ações e estado de UI.
 */
function toAppState(state: StoreState): AppState {
  return {
    accounts: state.accounts,
    snapshots: state.snapshots,
    currentRates: state.currentRates,
  };
}

// Estado inicial de domínio carregado do Local_Storage na inicialização.
// (Req. 6.2)
const initialAppState: AppState = loadState();
// Config de sync carregada de chave dedicada (separada do AppState).
const initialSyncConfig: SyncConfig = loadSyncConfig();

export const useStore = create<StoreState>((set) => ({
  // Estado de domínio inicial (carregado do Local_Storage).
  accounts: initialAppState.accounts,
  snapshots: initialAppState.snapshots,
  currentRates: initialAppState.currentRates,

  // Estado de UI: moeda de exibição (primária = Kwanza).
  displayCurrency: 'KZ',

  // Config de sincronização (widget).
  sync: initialSyncConfig,

  // --- Gestão de Contas (Req. 1.x) ---

  addAccount(name, currency) {
    if (!isValidAccountName(name)) {
      return { ok: false, error: ERROR_NAME_REQUIRED };
    }
    if (!isSupportedCurrency(currency)) {
      return { ok: false, error: ERROR_CURRENCY_UNSUPPORTED };
    }

    const account: Account = {
      id: crypto.randomUUID(),
      name: name.trim(),
      currency,
    };

    set((state) => {
      const next = { ...state, accounts: [...state.accounts, account] };
      saveState(toAppState(next));
      return { accounts: next.accounts };
    });

    return { ok: true };
  },

  editAccount(id, changes) {
    if (changes.name !== undefined && !isValidAccountName(changes.name)) {
      return { ok: false, error: ERROR_NAME_REQUIRED };
    }
    if (
      changes.currency !== undefined &&
      !isSupportedCurrency(changes.currency)
    ) {
      return { ok: false, error: ERROR_CURRENCY_UNSUPPORTED };
    }

    set((state) => {
      const accounts = state.accounts.map((account) =>
        account.id === id
          ? {
              ...account,
              ...(changes.name !== undefined
                ? { name: changes.name.trim() }
                : {}),
              ...(changes.currency !== undefined
                ? { currency: changes.currency }
                : {}),
            }
          : account,
      );
      const next = { ...state, accounts };
      saveState(toAppState(next));
      return { accounts };
    });

    return { ok: true };
  },

  deleteAccount(id) {
    set((state) => {
      const accounts = state.accounts.filter((account) => account.id !== id);
      const next = { ...state, accounts };
      saveState(toAppState(next));
      return { accounts };
    });
  },

  // --- Registro Semanal de Saldos (Req. 2.x) ---

  upsertWeeklySnapshot(date, balances) {
    set((state) => {
      const mondayDate = toMondayKey(date);
      const existingIndex = state.snapshots.findIndex(
        (snapshot) => snapshot.mondayDate === mondayDate,
      );

      let snapshots: WeeklySnapshot[];
      if (existingIndex >= 0) {
        // Atualiza o snapshot existente da semana, evitando duplicação.
        // (Req. 2.4)
        snapshots = state.snapshots.map((snapshot, index) =>
          index === existingIndex
            ? {
                ...snapshot,
                balances: { ...balances },
                rates: { ...state.currentRates },
              }
            : snapshot,
        );
      } else {
        // Cria um novo snapshot capturando as Taxas_Atuais vigentes.
        // (Req. 2.2)
        const snapshot: WeeklySnapshot = {
          mondayDate,
          balances: { ...balances },
          rates: { ...state.currentRates },
        };
        snapshots = [...state.snapshots, snapshot];
      }

      // Mantém os snapshots ordenados por data de segunda-feira.
      snapshots.sort((a, b) => a.mondayDate.localeCompare(b.mondayDate));

      const next = { ...state, snapshots };
      saveState(toAppState(next));
      return { snapshots };
    });
  },

  // --- Gestão de Taxas de Câmbio (Req. 5.x) ---

  updateRate(currency, rate) {
    if (!isValidRate(rate)) {
      return { ok: false, error: ERROR_RATE_POSITIVE };
    }

    set((state) => {
      const currentRates: ExchangeRates = {
        ...state.currentRates,
        [currency]: rate,
      };
      const next = { ...state, currentRates };
      saveState(toAppState(next));
      return { currentRates };
    });

    return { ok: true };
  },

  // --- Estado de UI ---

  setDisplayCurrency(currency) {
    set({ displayCurrency: currency });
  },

  // --- Configuração de sincronização (widget) ---

  setSyncConfig(changes) {
    set((state) => {
      const sync: SyncConfig = { ...state.sync, ...changes };
      saveSyncConfig(sync);
      return { sync };
    });
  },
}));

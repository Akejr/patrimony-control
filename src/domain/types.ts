export type CurrencyCode = 'KZ' | 'BRL' | 'EUR';

export interface Account {
  id: string;            // gerado (uuid); não é campo de domínio editável
  name: string;          // obrigatório, não-vazio
  currency: CurrencyCode;
}

// Taxas em Kwanzas por 1 unidade da moeda. A taxa do Kwanza é sempre 1.
export interface ExchangeRates {
  BRL: number;           // quantos Kz equivalem a 1 R$
  EUR: number;           // quantos Kz equivalem a 1 EUR
}

// Saldo por conta dentro de um snapshot
export type BalancesByAccount = Record<string /* accountId */, number>;

export interface WeeklySnapshot {
  mondayDate: string;        // chave ISO 'YYYY-MM-DD' da segunda-feira
  balances: BalancesByAccount;
  rates: ExchangeRates;      // taxas vigentes no momento da criação
}

export interface AppState {
  accounts: Account[];
  snapshots: WeeklySnapshot[];   // ordenados por mondayDate
  currentRates: ExchangeRates;   // Taxas_Atuais editáveis
}

export type Variation =
  | { available: true; percent: number }
  | { available: false };

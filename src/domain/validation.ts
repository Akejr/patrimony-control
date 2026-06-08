import type { CurrencyCode } from './types';

// Moedas suportadas pela aplicação. O Kwanza (KZ) é a moeda base.
const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = ['KZ', 'BRL', 'EUR'];

// Valida o nome de uma conta: rejeita vazio ou composto somente por espaços.
export function isValidAccountName(name: string): boolean {
  return name.trim().length > 0;
}

// Type guard: aceita apenas KZ, BRL ou EUR como moeda suportada.
export function isSupportedCurrency(code: string): code is CurrencyCode {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

// Valida uma taxa de câmbio: verdadeiro somente se for um número finito maior que zero.
export function isValidRate(rate: number): boolean {
  return Number.isFinite(rate) && rate > 0;
}

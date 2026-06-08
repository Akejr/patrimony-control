import type { CurrencyCode, ExchangeRates } from './types';

/**
 * Converte um valor de uma moeda para a Moeda_Base (Kwanzas) usando as taxas fornecidas.
 *
 * Regra:
 *  - toBase(x, 'KZ', r)  = x          (a taxa do Kwanza é sempre 1)
 *  - toBase(x, 'BRL', r) = x * r.BRL
 *  - toBase(x, 'EUR', r) = x * r.EUR
 *
 * @param amount   Valor expresso em `currency`.
 * @param currency Moeda de origem do valor.
 * @param rates    Taxas em Kwanzas por 1 unidade da moeda.
 * @returns        Valor equivalente em Kwanzas.
 */
export function toBase(
  amount: number,
  currency: CurrencyCode,
  rates: ExchangeRates
): number {
  switch (currency) {
    case 'KZ':
      return amount;
    case 'BRL':
      return amount * rates.BRL;
    case 'EUR':
      return amount * rates.EUR;
  }
}

/**
 * Converte um valor em Kwanzas para a moeda de exibição alvo.
 *
 * Regra:
 *  - fromBase(y, 'KZ', r)  = y          (a taxa do Kwanza é sempre 1)
 *  - fromBase(y, 'BRL', r) = y / r.BRL
 *  - fromBase(y, 'EUR', r) = y / r.EUR
 *
 * @param amountKz Valor expresso em Kwanzas (Moeda_Base).
 * @param target   Moeda de exibição alvo.
 * @param rates    Taxas em Kwanzas por 1 unidade da moeda.
 * @returns        Valor equivalente na moeda `target`.
 */
export function fromBase(
  amountKz: number,
  target: CurrencyCode,
  rates: ExchangeRates
): number {
  switch (target) {
    case 'KZ':
      return amountKz;
    case 'BRL':
      return amountKz / rates.BRL;
    case 'EUR':
      return amountKz / rates.EUR;
  }
}

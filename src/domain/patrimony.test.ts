import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

import { totalInBase, currentTotal, variation, variationSign } from './patrimony';
import { toMondayKey, previousMondayKey } from './dateUtils';
import type {
  Account,
  AppState,
  BalancesByAccount,
  CurrencyCode,
  ExchangeRates,
  WeeklySnapshot,
} from './types';

const NUM_RUNS = 100;

// ---------------------------------------------------------------------------
// Geradores (arbitraries) auxiliares
// ---------------------------------------------------------------------------

const currencyArb: fc.Arbitrary<CurrencyCode> = fc.constantFrom('KZ', 'BRL', 'EUR');

// Taxas estritamente positivas e finitas, em faixa razoável.
const ratesArb: fc.Arbitrary<ExchangeRates> = fc.record({
  BRL: fc.double({ min: 0.0001, max: 10000, noNaN: true, noDefaultInfinity: true }),
  EUR: fc.double({ min: 0.0001, max: 10000, noNaN: true, noDefaultInfinity: true }),
});

// Valor monetário finito em faixa razoável.
const amountArb = fc.double({
  min: -1_000_000_000,
  max: 1_000_000_000,
  noNaN: true,
  noDefaultInfinity: true,
});

// Valor monetário estritamente positivo (para garantir total anterior > 0).
const positiveAmountArb = fc.double({
  min: 1,
  max: 1_000_000_000,
  noNaN: true,
  noDefaultInfinity: true,
});

/**
 * Gera um conjunto de contas (com ids únicos por índice) e os saldos
 * correspondentes para um snapshot.
 */
function accountsWithBalancesArb(
  balanceArb: fc.Arbitrary<number>
): fc.Arbitrary<{ accounts: Account[]; balances: BalancesByAccount }> {
  return fc
    .array(fc.record({ name: fc.string(), currency: currencyArb, balance: balanceArb }), {
      minLength: 1,
      maxLength: 8,
    })
    .map((entries) => {
      const accounts: Account[] = [];
      const balances: BalancesByAccount = {};
      entries.forEach((entry, index) => {
        const id = `acc-${index}`;
        accounts.push({ id, name: entry.name, currency: entry.currency });
        balances[id] = entry.balance;
      });
      return { accounts, balances };
    });
}

// Compara dois números com tolerância relativa, para absorver ruído de ponto
// flutuante quando os totais têm grande magnitude.
function expectApproxEqual(actual: number, expected: number): void {
  const tolerance = 1e-6 * Math.max(1, Math.abs(actual), Math.abs(expected));
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

// Aplica a regra de conversão da especificação diretamente (independente de
// toBase) para evitar circularidade no teste da Property 11.
function convertBySpec(amount: number, currency: CurrencyCode, rates: ExchangeRates): number {
  switch (currency) {
    case 'KZ':
      return amount;
    case 'BRL':
      return amount * rates.BRL;
    case 'EUR':
      return amount * rates.EUR;
  }
}

// ---------------------------------------------------------------------------
// Property 11: Patrimônio total é a soma dos saldos convertidos para a base
// ---------------------------------------------------------------------------

describe('totalInBase', () => {
  // Feature: patrimony-control-pwa, Property 11: Patrimônio total é a soma dos
  // saldos convertidos para a base
  it('Property 11: é igual à soma de cada saldo convertido para Kwanzas', () => {
    fc.assert(
      fc.property(accountsWithBalancesArb(amountArb), ratesArb, ({ accounts, balances }, rates) => {
        const expected = accounts.reduce(
          (sum, account) => sum + convertBySpec(balances[account.id] ?? 0, account.currency, rates),
          0
        );
        expectApproxEqual(totalInBase(accounts, balances, rates), expected);
      }),
      { numRuns: NUM_RUNS }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13: Cálculo da variação percentual
// Property 14: Isolamento do efeito cambial
// ---------------------------------------------------------------------------

/**
 * Constrói um AppState com dois snapshots: um corrente (segunda-feira mais
 * recente) e um anterior (`weeksBack` semanas antes), ambos com saldos
 * positivos para garantir total anterior > 0.
 */
function twoSnapshotStateArb(weeksBack: number): fc.Arbitrary<AppState> {
  return fc
    .record({
      base: accountsWithBalancesArb(positiveAmountArb),
      currentBalanceFactors: fc.array(positiveAmountArb, { minLength: 8, maxLength: 8 }),
      anchorDate: fc.date({
        min: new Date('2000-01-01T00:00:00.000Z'),
        max: new Date('2035-12-31T00:00:00.000Z'),
      }),
      currentRates: ratesArb,
      previousRates: ratesArb,
      liveRates: ratesArb,
    })
    .map(({ base, currentBalanceFactors, anchorDate, currentRates, previousRates, liveRates }) => {
      const { accounts, balances: previousBalances } = base;

      // Saldos do snapshot corrente: positivos e independentes dos anteriores.
      const currentBalances: BalancesByAccount = {};
      accounts.forEach((account, index) => {
        currentBalances[account.id] = currentBalanceFactors[index] ?? 1;
      });

      const currentKey = toMondayKey(anchorDate);
      const previousKey = previousMondayKey(currentKey, weeksBack);

      const currentSnapshot: WeeklySnapshot = {
        mondayDate: currentKey,
        balances: currentBalances,
        rates: currentRates,
      };
      const previousSnapshot: WeeklySnapshot = {
        mondayDate: previousKey,
        balances: previousBalances,
        rates: previousRates,
      };

      return {
        accounts,
        snapshots: [previousSnapshot, currentSnapshot],
        currentRates: liveRates,
      } satisfies AppState;
    });
}

describe('variation', () => {
  for (const weeksBack of [1, 4]) {
    const label = weeksBack === 1 ? 'semanal' : 'mensal';

    // Feature: patrimony-control-pwa, Property 13: Cálculo da variação percentual
    it(`Property 13: variação ${label} (weeksBack=${weeksBack}) = ((atual - anterior) / anterior) * 100`, () => {
      fc.assert(
        fc.property(twoSnapshotStateArb(weeksBack), (state) => {
          const [previous, current] = state.snapshots;
          const currentTotalKz = totalInBase(state.accounts, current.balances, current.rates);
          const previousTotalKz = totalInBase(state.accounts, previous.balances, previous.rates);
          fc.pre(previousTotalKz > 0);

          const expectedPercent = ((currentTotalKz - previousTotalKz) / previousTotalKz) * 100;
          const result = variation(state, weeksBack);

          expect(result.available).toBe(true);
          if (result.available) {
            expectApproxEqual(result.percent, expectedPercent);
          }
        }),
        { numRuns: NUM_RUNS }
      );
    });

    // Feature: patrimony-control-pwa, Property 14: Isolamento do efeito cambial
    it(`Property 14: alterar currentRates não altera a variação ${label} (weeksBack=${weeksBack})`, () => {
      fc.assert(
        fc.property(twoSnapshotStateArb(weeksBack), ratesArb, (state, newCurrentRates) => {
          const [previous] = state.snapshots;
          const previousTotalKz = totalInBase(state.accounts, previous.balances, previous.rates);
          fc.pre(previousTotalKz > 0);

          const before = variation(state, weeksBack);

          // Muta as Taxas_Atuais (efeito cambial "ao vivo") após o cálculo.
          state.currentRates = newCurrentRates;
          const after = variation(state, weeksBack);

          expect(before.available).toBe(true);
          expect(after.available).toBe(true);
          if (before.available && after.available) {
            expect(after.percent).toBe(before.percent);
          }
        }),
        { numRuns: NUM_RUNS }
      );
    });
  }
});

// ---------------------------------------------------------------------------
// Property 15: Sinal da variação determina a indicação visual
// ---------------------------------------------------------------------------

describe('variationSign', () => {
  // Feature: patrimony-control-pwa, Property 15: Sinal da variação determina a
  // indicação visual
  it('Property 15: positivo sse percent > 0, negativo sse percent < 0, neutro em 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e9, max: 1e9, noNaN: true, noDefaultInfinity: true }),
        (percent) => {
          const sign = variationSign(percent);
          if (percent > 0) {
            expect(sign).toBe('positive');
          } else if (percent < 0) {
            expect(sign).toBe('negative');
          } else {
            expect(sign).toBe('neutral');
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });

  it('Property 15: caso de borda em zero é neutro', () => {
    expect(variationSign(0)).toBe('neutral');
  });
});

// Mantém `currentTotal` referenciada para alinhamento com o escopo da tarefa
// (smoke check de que retorna 0 sem snapshots).
describe('currentTotal', () => {
  it('retorna 0 quando não há snapshots', () => {
    const state: AppState = { accounts: [], snapshots: [], currentRates: { BRL: 1, EUR: 1 } };
    expect(currentTotal(state)).toBe(0);
  });
});

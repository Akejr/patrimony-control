import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { loadState, saveState } from './storage';
import type {
  AppState,
  Account,
  CurrencyCode,
  ExchangeRates,
  WeeklySnapshot,
} from '../domain/types';

// Gerador de código de moeda suportado.
const currencyArb: fc.Arbitrary<CurrencyCode> = fc.constantFrom<CurrencyCode>(
  'KZ',
  'BRL',
  'EUR',
);

// Gerador de taxas de câmbio positivas.
const ratesArb: fc.Arbitrary<ExchangeRates> = fc.record({
  BRL: fc.double({ min: 1e-3, max: 1e6, noNaN: true, noDefaultInfinity: true }),
  EUR: fc.double({ min: 1e-3, max: 1e6, noNaN: true, noDefaultInfinity: true }),
});

// Gerador de conta com id/name/currency.
const accountArb: fc.Arbitrary<Account> = fc.record({
  id: fc.uuid(),
  name: fc.string(),
  currency: currencyArb,
});

// Gerador de chave de segunda-feira no formato ISO 'YYYY-MM-DD'.
const mondayDateArb: fc.Arbitrary<string> = fc
  .date({ min: new Date('2000-01-01'), max: new Date('2100-12-31') })
  .map((d) => d.toISOString().slice(0, 10));

// Gerador de saldos por conta (chaves arbitrárias -> valores numéricos finitos).
// Normaliza -0 para 0 porque JSON.stringify/parse converte -0 em 0, e toEqual
// distingue -0 de 0, o que quebraria o round-trip sem ser um bug de produção.
const balancesArb = fc.dictionary(
  fc.string(),
  fc
    .double({ min: -1e12, max: 1e12, noNaN: true, noDefaultInfinity: true })
    .map((v) => (Object.is(v, -0) ? 0 : v)),
);

// Gerador de snapshot semanal.
const snapshotArb: fc.Arbitrary<WeeklySnapshot> = fc.record({
  mondayDate: mondayDateArb,
  balances: balancesArb,
  rates: ratesArb,
});

// Gerador de AppState válido completo.
const appStateArb: fc.Arbitrary<AppState> = fc.record({
  accounts: fc.array(accountArb, { maxLength: 10 }),
  snapshots: fc.array(snapshotArb, { maxLength: 10 }),
  currentRates: ratesArb,
});

describe('storage round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Feature: patrimony-control-pwa, Property 18: Round-trip de persistência do estado da aplicação
  // Para qualquer estado válido da aplicação (contas, snapshots e taxas), salvá-lo no
  // Local_Storage e recarregá-lo produz um estado equivalente ao original.
  // Validates: Requirements 6.2
  it('Property 18: saveState then loadState returns a state deeply equal to the original', () => {
    fc.assert(
      fc.property(appStateArb, (state) => {
        localStorage.clear();
        saveState(state);
        const loaded = loadState();
        expect(loaded).toEqual(state);
      }),
      { numRuns: 100 },
    );
  });
});

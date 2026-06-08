import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';

import { useStore } from './store';
import { loadState } from '../storage/storage';
import { toMondayKey } from '../domain/dateUtils';
import type { BalancesByAccount } from '../domain/types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Reseta o ambiente entre execuções: limpa o Local_Storage e devolve a store
 * ao estado default conhecido. A store inicializa a partir de `loadState()` no
 * carregamento do módulo, portanto precisamos zerá-la explicitamente.
 */
function reset(): void {
  localStorage.clear();
  useStore.setState({
    accounts: [],
    snapshots: [],
    currentRates: { BRL: 225, EUR: 1320 },
  });
}

// Gerador de taxa positiva válida (rate > 0).
const positiveRateArb = fc.double({
  min: 1e-3,
  max: 1e6,
  noNaN: true,
  noDefaultInfinity: true,
});

// Gerador de saldos por conta: chaves arbitrárias -> valores numéricos finitos.
// Normaliza -0 para 0, pois a serialização JSON (round-trip via Local_Storage)
// não preserva o zero negativo e isso não representa um saldo distinto.
const balancesArb: fc.Arbitrary<BalancesByAccount> = fc.dictionary(
  fc.string(),
  fc
    .double({ min: -1e12, max: 1e12, noNaN: true, noDefaultInfinity: true })
    .map((v) => (Object.is(v, -0) ? 0 : v)),
);

// Gerador de data arbitrária dentro de um intervalo razoável.
const dateArb = fc.date({
  min: new Date('2000-01-01T00:00:00Z'),
  max: new Date('2100-12-31T00:00:00Z'),
});

describe('store snapshots e taxas (property-based)', () => {
  beforeEach(() => {
    reset();
  });

  // Feature: patrimony-control-pwa, Property 7: Round-trip de persistência do snapshot semanal
  // Para qualquer snapshot semanal com saldos arbitrários, persisti-lo e lê-lo de volta
  // produz os mesmos saldos associados à mesma data de segunda-feira.
  // Validates: Requirements 2.1
  it('Property 7: upsertWeeklySnapshot persiste os saldos sob a chave da segunda-feira', () => {
    fc.assert(
      fc.property(dateArb, balancesArb, (date, balances) => {
        reset();
        useStore.getState().upsertWeeklySnapshot(date, balances);

        const mondayKey = toMondayKey(date);
        const persisted = loadState();
        const snapshot = persisted.snapshots.find(
          (s) => s.mondayDate === mondayKey,
        );

        expect(snapshot).toBeDefined();
        expect(snapshot?.mondayDate).toBe(mondayKey);
        expect(snapshot?.balances).toEqual(balances);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: patrimony-control-pwa, Property 8: Snapshot captura as taxas vigentes
  // Para qualquer estado com Taxas_Atuais definidas, ao criar um snapshot as taxas
  // armazenadas no snapshot são iguais às Taxas_Atuais no momento da criação.
  // Validates: Requirements 2.2
  it('Property 8: o snapshot criado armazena as Taxas_Atuais vigentes', () => {
    fc.assert(
      fc.property(
        positiveRateArb,
        positiveRateArb,
        dateArb,
        balancesArb,
        (brl, eur, date, balances) => {
          reset();
          const store = useStore.getState();

          // Define as Taxas_Atuais vigentes antes de criar o snapshot.
          expect(store.updateRate('BRL', brl)).toEqual({ ok: true });
          expect(store.updateRate('EUR', eur)).toEqual({ ok: true });

          // Captura as Taxas_Atuais no momento da criação.
          const ratesAtCreation = { ...useStore.getState().currentRates };
          store.upsertWeeklySnapshot(date, balances);

          const mondayKey = toMondayKey(date);
          const snapshot = useStore
            .getState()
            .snapshots.find((s) => s.mondayDate === mondayKey);

          expect(snapshot).toBeDefined();
          expect(snapshot?.rates).toEqual(ratesAtCreation);
          expect(snapshot?.rates).toEqual({ BRL: brl, EUR: eur });
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: patrimony-control-pwa, Property 10: Não há snapshots duplicados para a mesma semana
  // Para qualquer sequência de criações de snapshot para datas da mesma semana, existe no
  // máximo um snapshot por chave de segunda-feira, contendo os últimos saldos informados.
  // Validates: Requirements 2.4
  it('Property 10: múltiplos upserts na mesma semana não duplicam e mantêm os últimos saldos', () => {
    // Gera uma data-base e uma sequência não-vazia de (offsetDias em [0,6], saldos).
    const sameWeekEntriesArb = fc
      .tuple(
        dateArb,
        fc.array(
          fc.record({ offset: fc.integer({ min: 0, max: 6 }), balances: balancesArb }),
          { minLength: 1, maxLength: 7 },
        ),
      )
      .map(([base, entries]) => {
        // Normaliza a base para a segunda-feira (meia-noite UTC) da semana.
        const mondayKey = toMondayKey(base);
        const mondayMillis = new Date(mondayKey).getTime();
        const dated = entries.map((e) => ({
          date: new Date(mondayMillis + e.offset * MS_PER_DAY),
          balances: e.balances,
        }));
        return { mondayKey, dated };
      });

    fc.assert(
      fc.property(sameWeekEntriesArb, ({ mondayKey, dated }) => {
        reset();
        const store = useStore.getState();

        for (const entry of dated) {
          store.upsertWeeklySnapshot(entry.date, entry.balances);
        }

        const persisted = loadState();
        // Todas as datas pertencem à mesma semana -> uma única chave.
        const matching = persisted.snapshots.filter(
          (s) => s.mondayDate === mondayKey,
        );
        expect(matching).toHaveLength(1);
        expect(persisted.snapshots).toHaveLength(1);

        // O snapshot contém os últimos saldos informados.
        const lastBalances = dated[dated.length - 1].balances;
        expect(matching[0].balances).toEqual(lastBalances);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: patrimony-control-pwa, Property 16: Round-trip de persistência de taxa
  // Para qualquer taxa válida (maior que zero) atribuída a R$ ou EUR, persistir e ler de
  // volta retorna o mesmo valor.
  // Validates: Requirements 5.2
  it('Property 16: updateRate persiste a taxa e lê-la de volta retorna o mesmo valor', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'BRL' | 'EUR'>('BRL', 'EUR'),
        positiveRateArb,
        (currency, rate) => {
          reset();
          const result = useStore.getState().updateRate(currency, rate);
          expect(result).toEqual({ ok: true });

          const persisted = loadState();
          expect(persisted.currentRates[currency]).toBe(rate);
        },
      ),
      { numRuns: 100 },
    );
  });
});

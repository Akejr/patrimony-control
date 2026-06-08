import { describe, it, expect } from 'vitest';
import { currentTotal, variation } from './patrimony';
import type { Account, AppState, ExchangeRates, WeeklySnapshot } from './types';

// Testes unitários (exemplos/edge cases) para a camada de domínio de patrimônio.
//
// Cobrem:
//  - Total zero quando não há snapshot (Req. 3.4)
//  - Variação semanal indisponível sem snapshot da semana anterior (Req. 4.4)
//  - Variação mensal indisponível sem snapshot de quatro semanas antes (Req. 4.5)
//  - Variação indisponível quando o total anterior é zero (evita divisão por zero)

const rates: ExchangeRates = { BRL: 225, EUR: 1320 };

const accounts: Account[] = [
  { id: 'a1', name: 'Conta KZ', currency: 'KZ' },
  { id: 'a2', name: 'Conta EUR', currency: 'EUR' },
];

function makeSnapshot(
  mondayDate: string,
  balances: WeeklySnapshot['balances'],
  snapshotRates: ExchangeRates = rates
): WeeklySnapshot {
  return { mondayDate, balances, rates: snapshotRates };
}

describe('currentTotal — casos de borda', () => {
  // Req. 3.4: IF não existe nenhum Registro_Semanal, THEN o Patrimônio_Total é zero.
  it('retorna 0 quando state.snapshots está vazio', () => {
    const state: AppState = {
      accounts,
      snapshots: [],
      currentRates: rates,
    };

    expect(currentTotal(state)).toBe(0);
  });

  it('retorna 0 quando não há snapshots mesmo sem contas cadastradas', () => {
    const state: AppState = {
      accounts: [],
      snapshots: [],
      currentRates: rates,
    };

    expect(currentTotal(state)).toBe(0);
  });
});

describe('variation — casos de borda (indisponível)', () => {
  // Req. 4.4: IF o Registro_Semanal da segunda-feira anterior não existe,
  // THEN a Variação_Semanal é indisponível.
  it('variação semanal (weeksBack=1) é indisponível sem snapshot da semana anterior', () => {
    // Existe apenas o snapshot corrente; não há o da segunda-feira anterior.
    const current = makeSnapshot('2025-06-09', { a1: 1_000_000, a2: 2_000 });
    const state: AppState = {
      accounts,
      snapshots: [current],
      currentRates: rates,
    };

    expect(variation(state, 1)).toEqual({ available: false });
  });

  // Req. 4.5: IF o Registro_Semanal de quatro semanas antes não existe,
  // THEN a Variação_Mensal é indisponível.
  it('variação mensal (weeksBack=4) é indisponível sem snapshot de quatro semanas antes', () => {
    // Há o corrente e o da semana anterior, mas não o de 4 semanas antes.
    const current = makeSnapshot('2025-06-09', { a1: 1_000_000, a2: 2_000 });
    const lastWeek = makeSnapshot('2025-06-02', { a1: 900_000, a2: 1_800 });
    const state: AppState = {
      accounts,
      snapshots: [lastWeek, current],
      currentRates: rates,
    };

    expect(variation(state, 4)).toEqual({ available: false });
  });

  it('variação é indisponível quando não há nenhum snapshot', () => {
    const state: AppState = {
      accounts,
      snapshots: [],
      currentRates: rates,
    };

    expect(variation(state, 1)).toEqual({ available: false });
    expect(variation(state, 4)).toEqual({ available: false });
  });

  // Evita divisão por zero (Infinity/NaN): total anterior zero => indisponível.
  it('variação é indisponível quando o total do snapshot anterior é zero', () => {
    const current = makeSnapshot('2025-06-09', { a1: 1_000_000, a2: 2_000 });
    // Snapshot anterior com saldos zerados => total anterior = 0.
    const lastWeek = makeSnapshot('2025-06-02', { a1: 0, a2: 0 });
    const state: AppState = {
      accounts,
      snapshots: [lastWeek, current],
      currentRates: rates,
    };

    expect(variation(state, 1)).toEqual({ available: false });
  });
});

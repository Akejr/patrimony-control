// Cálculos de patrimônio e variações (domínio puro).
//
// Estas funções não acessam armazenamento nem dependem de efeitos colaterais:
// recebem o estado/insumos e retornam valores calculados, facilitando testes
// baseados em propriedades.

import type {
  Account,
  AppState,
  BalancesByAccount,
  ExchangeRates,
  Variation,
  WeeklySnapshot,
} from './types';
import { toBase } from './currency';
import { previousMondayKey } from './dateUtils';

/**
 * Soma dos saldos de todas as contas convertidos para a Moeda_Base (Kwanzas)
 * usando as taxas indicadas.
 *
 * Cada conta tem sua moeda própria; o saldo correspondente em `balances` é
 * convertido para Kwanzas via `toBase`. Contas sem saldo registrado contam
 * como zero.
 *
 * @param accounts contas cadastradas
 * @param balances saldos por conta (accountId -> valor na moeda da conta)
 * @param rates    taxas de câmbio aplicadas na conversão
 * @returns        patrimônio total em Kwanzas
 * @see Requisito 3.1
 */
export function totalInBase(
  accounts: Account[],
  balances: BalancesByAccount,
  rates: ExchangeRates
): number {
  return accounts.reduce((sum, account) => {
    const amount = balances[account.id] ?? 0;
    return sum + toBase(amount, account.currency, rates);
  }, 0);
}

/**
 * Retorna o snapshot mais recente (maior `mondayDate`), ou `undefined` quando
 * não houver snapshots. Não assume que `snapshots` esteja ordenado.
 */
function mostRecentSnapshot(
  snapshots: WeeklySnapshot[]
): WeeklySnapshot | undefined {
  if (snapshots.length === 0) return undefined;
  return snapshots.reduce((latest, current) =>
    current.mondayDate > latest.mondayDate ? current : latest
  );
}

/**
 * Patrimônio total do snapshot mais recente, usando as Taxas_Atuais
 * (`state.currentRates`) para uma visão "ao vivo" dos saldos mais recentes.
 *
 * Se não houver nenhum snapshot, retorna 0.
 *
 * @param state estado da aplicação
 * @returns     patrimônio total em Kwanzas (0 quando não há snapshots)
 * @see Requisitos 3.1, 3.4
 */
export function currentTotal(state: AppState): number {
  const latest = mostRecentSnapshot(state.snapshots);
  if (!latest) return 0;
  return totalInBase(state.accounts, latest.balances, state.currentRates);
}

/**
 * Variação percentual entre o snapshot corrente (mais recente) e o snapshot de
 * `weeksBack` semanas antes.
 *
 * O total de cada snapshot é calculado com as taxas ARMAZENADAS no próprio
 * snapshot (`snapshot.rates`), isolando o efeito cambial: alterações
 * posteriores nas Taxas_Atuais não afetam variações históricas.
 *
 * Fórmula: `((totalCorrente − totalAnterior) / totalAnterior) * 100`.
 *
 * Retorna `{ available: false }` quando:
 *  - não há snapshot corrente; ou
 *  - não existe snapshot de comparação para `weeksBack` semanas antes; ou
 *  - o total anterior é zero (evita divisão por zero -> Infinity/NaN).
 *
 * @param state     estado da aplicação
 * @param weeksBack número de semanas a recuar (1 = semanal, 4 = mensal)
 * @returns         variação percentual ou indisponível
 * @see Requisitos 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function variation(state: AppState, weeksBack: number): Variation {
  const current = mostRecentSnapshot(state.snapshots);
  if (!current) return { available: false };

  const previousKey = previousMondayKey(current.mondayDate, weeksBack);
  const previous = state.snapshots.find((s) => s.mondayDate === previousKey);
  if (!previous) return { available: false };

  const currentTotalKz = totalInBase(
    state.accounts,
    current.balances,
    current.rates
  );
  const previousTotalKz = totalInBase(
    state.accounts,
    previous.balances,
    previous.rates
  );

  if (previousTotalKz === 0) return { available: false };

  const percent = ((currentTotalKz - previousTotalKz) / previousTotalKz) * 100;
  return { available: true, percent };
}

/**
 * Classifica o sinal de uma variação percentual para indicação visual.
 *
 * @param percent valor percentual da variação
 * @returns 'positive' se > 0, 'negative' se < 0, caso contrário 'neutral'
 * @see Requisitos 4.6, 4.7
 */
export function variationSign(
  percent: number
): 'positive' | 'negative' | 'neutral' {
  if (percent > 0) return 'positive';
  if (percent < 0) return 'negative';
  return 'neutral';
}

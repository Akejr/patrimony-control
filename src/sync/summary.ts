import type { AppState } from '../domain/types';
import { currentTotal, variation } from '../domain/patrimony';

/**
 * Resumo do patrimônio publicado para o widget. Contém apenas o agregado
 * (total em Kwanzas, variações e taxas), sem nomes ou detalhes de contas.
 */
export interface PatrimonySummary {
  /** Patrimônio total na moeda base (Kwanzas). */
  totalKz: number;
  /** Variação percentual semanal, ou null se indisponível. */
  weeklyPct: number | null;
  /** Variação percentual mensal, ou null se indisponível. */
  monthlyPct: number | null;
  /** Taxas atuais (Kz por 1 unidade) para o widget converter, se quiser. */
  rates: { BRL: number; EUR: number };
  /** Momento da geração do resumo (ISO 8601). */
  updatedAt: string;
}

/**
 * Monta o resumo do patrimônio a partir do estado atual da aplicação.
 * As variações usam as taxas armazenadas em cada snapshot (efeito cambial
 * isolado), conforme o domínio.
 */
export function buildSummary(state: AppState): PatrimonySummary {
  const weekly = variation(state, 1);
  const monthly = variation(state, 4);
  return {
    totalKz: currentTotal(state),
    weeklyPct: weekly.available ? weekly.percent : null,
    monthlyPct: monthly.available ? monthly.percent : null,
    rates: { BRL: state.currentRates.BRL, EUR: state.currentRates.EUR },
    updatedAt: new Date().toISOString(),
  };
}

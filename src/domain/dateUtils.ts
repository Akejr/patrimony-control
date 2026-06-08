// Utilidades de data para indexação dos snapshots semanais.
//
// Todas as operações usam aritmética baseada em UTC para evitar desvios de
// fuso horário (timezone drift). As chaves de snapshot são strings ISO no
// formato 'YYYY-MM-DD' que representam sempre uma segunda-feira.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Formata um instante (em milissegundos UTC) como string ISO 'YYYY-MM-DD',
 * usando os componentes de data em UTC.
 */
function formatUtcDateKey(utcMillis: number): string {
  const d = new Date(utcMillis);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Normaliza qualquer data para a segunda-feira (00:00 UTC) da mesma semana.
 *
 * Usa os componentes de data em UTC para construir um instante à meia-noite
 * UTC e calcular o dia da semana, garantindo:
 *  - o resultado é sempre uma segunda-feira;
 *  - idempotência: re-normalizar uma chave já normalizada (lida via
 *    `new Date('YYYY-MM-DD')`, que é interpretada como meia-noite UTC) produz
 *    a mesma chave.
 *
 * @param date data arbitrária a ser normalizada
 * @returns string ISO 'YYYY-MM-DD' da segunda-feira correspondente
 */
export function toMondayKey(date: Date): string {
  // Constrói a meia-noite UTC do dia indicado pelos componentes UTC da data.
  const utcMidnight = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  // getUTCDay: 0 = domingo, 1 = segunda, ..., 6 = sábado.
  const dayOfWeek = new Date(utcMidnight).getUTCDay();
  // Quantos dias recuar até a segunda-feira da mesma semana.
  // Segunda(1) -> 0; Domingo(0) -> 6; Sábado(6) -> 5.
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const mondayMillis = utcMidnight - daysSinceMonday * MS_PER_DAY;
  return formatUtcDateKey(mondayMillis);
}

/**
 * Retorna a chave da segunda-feira `weeksBack` semanas antes de uma chave dada.
 *
 * A chave de entrada é interpretada como meia-noite UTC (formato 'YYYY-MM-DD')
 * e o resultado é re-normalizado para garantir que continue sendo uma
 * segunda-feira válida mesmo que a entrada já seja uma segunda-feira.
 *
 * @param mondayKey chave ISO 'YYYY-MM-DD' (esperada como segunda-feira)
 * @param weeksBack número de semanas a recuar (>= 0)
 * @returns string ISO 'YYYY-MM-DD' da segunda-feira resultante
 */
export function previousMondayKey(mondayKey: string, weeksBack: number): string {
  // 'YYYY-MM-DD' é interpretado pelo construtor de Date como meia-noite UTC.
  const baseMillis = new Date(mondayKey).getTime();
  const targetMillis = baseMillis - weeksBack * 7 * MS_PER_DAY;
  // Re-normaliza para assegurar que o resultado seja uma segunda-feira.
  return toMondayKey(new Date(targetMillis));
}

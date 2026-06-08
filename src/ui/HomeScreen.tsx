import { CurrencySelector } from './components';
import { useStore } from '../state/store';
import type {
  Account,
  AppState,
  CurrencyCode,
  Variation,
  WeeklySnapshot,
} from '../domain/types';
import { fromBase, toBase } from '../domain/currency';
import { currentTotal, variation, variationSign } from '../domain/patrimony';

/** Símbolos curtos por moeda para exibição. */
const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  KZ: 'Kz',
  BRL: 'R$',
  EUR: 'EUR',
};

/** Formata um valor monetário no locale pt com o símbolo da moeda. */
function formatCurrency(amount: number, currency: CurrencyCode): string {
  const formatted = new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${CURRENCY_SYMBOLS[currency]} ${formatted}`;
}

/** Formata uma variação percentual com sinal explícito (ex.: +3,20%). */
function formatPercent(percent: number): string {
  const formatted = new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(percent);
  return `${formatted}%`;
}

/** Retorna o snapshot mais recente (maior mondayDate), ou undefined. */
function mostRecentSnapshot(
  snapshots: WeeklySnapshot[],
): WeeklySnapshot | undefined {
  if (snapshots.length === 0) return undefined;
  return snapshots.reduce((latest, current) =>
    current.mondayDate > latest.mondayDate ? current : latest,
  );
}

interface VariationBadgeProps {
  value: Variation;
  /** Sufixo de período exibido (ex.: "no último mês"). */
  periodLabel: string;
}

/** Badge de variação com cor e ícone conforme o sinal. (Req. 4.6, 4.7) */
function VariationBadge({ value, periodLabel }: VariationBadgeProps) {
  if (!value.available) {
    return (
      <div className="inline-flex items-center gap-1 bg-surface-container border border-outline-variant text-on-surface-variant font-label-sm text-label-sm px-3 py-1.5 rounded-full w-fit">
        <span className="material-symbols-outlined text-[16px]">remove</span>
        <span>Indisponível {periodLabel}</span>
      </div>
    );
  }

  const sign = variationSign(value.percent);
  const styles =
    sign === 'positive'
      ? 'bg-secondary-container/20 border-secondary-container text-on-secondary-container'
      : sign === 'negative'
        ? 'bg-error-container/40 border-error-container text-on-error-container'
        : 'bg-surface-container border-outline-variant text-on-surface-variant';
  const icon =
    sign === 'positive'
      ? 'trending_up'
      : sign === 'negative'
        ? 'trending_down'
        : 'trending_flat';

  return (
    <div
      className={`inline-flex items-center gap-1 border font-label-sm text-label-sm px-3 py-1.5 rounded-full w-fit ${styles}`}
    >
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      <span>
        {formatPercent(value.percent)} {periodLabel}
      </span>
    </div>
  );
}

interface AccountCardProps {
  account: Account;
  /** Valor da conta na moeda de exibição. */
  valueDisplay: number;
  /** Participação no patrimônio total (0..1). */
  share: number;
  displayCurrency: CurrencyCode;
  /** Alterna a cor da barra para variar visualmente entre os cards. */
  index: number;
}

/** Card de uma conta: nome, saldo e barra de proporção do total. */
function AccountCard({
  account,
  valueDisplay,
  share,
  displayCurrency,
  index,
}: AccountCardProps) {
  const barColor = index % 2 === 0 ? 'bg-primary' : 'bg-secondary';
  const pct = Math.max(0, Math.min(100, share * 100));

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg flex flex-col gap-stack-sm transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider truncate">
          {account.name}
        </h3>
        <span className="material-symbols-outlined text-outline-variant">
          account_balance_wallet
        </span>
      </div>
      <p className="font-numeric-data text-[28px] leading-tight text-on-background">
        {formatCurrency(valueDisplay, displayCurrency)}
      </p>
      <div className="flex items-center justify-between mt-3 gap-3">
        <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
          {pct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

/**
 * Tela inicial: Patrimônio_Total em destaque (Kz primário, seletor R$/EUR),
 * badges de variação semanal e mensal, e um card por conta com o respectivo
 * saldo e participação no total. (Req. 3.2, 3.3, 4.4, 4.5, 4.6, 4.7)
 */
export default function HomeScreen() {
  const accounts = useStore((s) => s.accounts);
  const snapshots = useStore((s) => s.snapshots);
  const currentRates = useStore((s) => s.currentRates);
  const displayCurrency = useStore((s) => s.displayCurrency);
  const setDisplayCurrency = useStore((s) => s.setDisplayCurrency);

  const appState: AppState = { accounts, snapshots, currentRates };

  // Patrimônio_Total em Kwanzas (base), convertido para a moeda de exibição.
  const totalKz = currentTotal(appState);
  const totalDisplay = fromBase(totalKz, displayCurrency, currentRates);

  // Variações usando as taxas armazenadas em cada snapshot. (Req. 4.1, 4.2)
  const weekly = variation(appState, 1);
  const monthly = variation(appState, 4);

  // Saldos mais recentes por conta para os cards.
  const latest = mostRecentSnapshot(snapshots);

  return (
    <div className="flex flex-col gap-12 w-full">
      {/* Hero: Patrimônio Total */}
      <section className="flex flex-col gap-stack-md pt-6">
        <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
          Patrimônio Total
        </h2>
        <h1 className="font-display text-[40px] leading-tight text-on-background">
          {formatCurrency(totalDisplay, displayCurrency)}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <VariationBadge value={weekly} periodLabel="na última semana" />
          <VariationBadge value={monthly} periodLabel="no último mês" />
        </div>
        <div className="mt-2">
          <CurrencySelector
            value={displayCurrency}
            onChange={setDisplayCurrency}
          />
        </div>
      </section>

      {/* Cards por conta */}
      {accounts.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Nenhuma conta cadastrada ainda. Adicione contas na aba Contas para
            ver os saldos aqui.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {accounts.map((account, index) => {
            const balance = latest?.balances[account.id] ?? 0;
            const valueKz = toBase(balance, account.currency, currentRates);
            const valueDisplay = fromBase(
              valueKz,
              displayCurrency,
              currentRates,
            );
            const share = totalKz > 0 ? valueKz / totalKz : 0;
            return (
              <AccountCard
                key={account.id}
                account={account}
                valueDisplay={valueDisplay}
                share={share}
                displayCurrency={displayCurrency}
                index={index}
              />
            );
          })}
        </section>
      )}
    </div>
  );
}

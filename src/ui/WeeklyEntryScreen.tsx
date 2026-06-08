import { useMemo, useState } from 'react';
import { Button, Card, ScreenContainer } from './components';
import { useStore } from '../state/store';
import { toMondayKey } from '../domain/dateUtils';
import type { BalancesByAccount, CurrencyCode } from '../domain/types';

/** Rótulos curtos de exibição por moeda. */
const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  KZ: 'Kz',
  BRL: 'R$',
  EUR: 'EUR',
};

/** Formata uma chave ISO 'YYYY-MM-DD' numa data legível em português. */
function formatMondayLabel(mondayKey: string): string {
  const date = new Date(mondayKey);
  try {
    return new Intl.DateTimeFormat('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return mondayKey;
  }
}

/** Constrói os valores iniciais (string) a partir do snapshot da semana. */
function buildInitialValues(
  accountIds: string[],
  existingBalances: BalancesByAccount | undefined,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const id of accountIds) {
    const balance = existingBalances?.[id];
    values[id] = balance !== undefined ? String(balance) : '';
  }
  return values;
}

/**
 * Tela de Registro Semanal: um campo de saldo por conta para a segunda-feira
 * corrente. Pré-carrega o snapshot existente (atualização em vez de duplicação,
 * Req. 2.4) e persiste via upsertWeeklySnapshot. (Req. 2.1, 2.5)
 */
export default function WeeklyEntryScreen() {
  const accounts = useStore((state) => state.accounts);
  const snapshots = useStore((state) => state.snapshots);
  const upsertWeeklySnapshot = useStore((state) => state.upsertWeeklySnapshot);

  const mondayKey = useMemo(() => toMondayKey(new Date()), []);
  const mondayLabel = useMemo(() => formatMondayLabel(mondayKey), [mondayKey]);

  const existingSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.mondayDate === mondayKey),
    [snapshots, mondayKey],
  );

  const accountIds = useMemo(() => accounts.map((a) => a.id), [accounts]);

  const [values, setValues] = useState<Record<string, string>>(() =>
    buildInitialValues(accountIds, existingSnapshot?.balances),
  );
  const [saved, setSaved] = useState(false);

  function handleChange(accountId: string, raw: string) {
    setValues((prev) => ({ ...prev, [accountId]: raw }));
    setSaved(false);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const balances: BalancesByAccount = {};
    for (const account of accounts) {
      const raw = values[account.id]?.trim() ?? '';
      const parsed = raw === '' ? 0 : Number(raw.replace(',', '.'));
      balances[account.id] = Number.isFinite(parsed) ? parsed : 0;
    }
    upsertWeeklySnapshot(new Date(), balances);
    setSaved(true);
  }

  return (
    <ScreenContainer
      title="Registro"
      subtitle="Lance o saldo de cada conta nesta segunda-feira."
    >
      <Card className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">
          calendar_month
        </span>
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Semana de
          </span>
          <span className="font-body-lg text-body-lg font-semibold text-on-background capitalize">
            {mondayLabel}
          </span>
        </div>
      </Card>

      {accounts.length === 0 ? (
        <Card>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Nenhuma conta cadastrada. Adicione contas na aba Contas para
            registrar os saldos semanais.
          </p>
        </Card>
      ) : (
        <Card>
          <form className="flex flex-col gap-stack-lg" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-stack-lg">
              {accounts.map((account) => (
                <div className="flex flex-col gap-2" key={account.id}>
                  <label
                    className="font-label-md text-label-md font-semibold text-on-surface-variant"
                    htmlFor={`balance-${account.id}`}
                  >
                    {account.name}
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <input
                      id={`balance-${account.id}`}
                      className="flex-1 bg-transparent py-3 font-numeric-data text-[20px] text-on-background outline-none border-0 focus:ring-0 p-0"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      placeholder="0"
                      value={values[account.id] ?? ''}
                      onChange={(e) => handleChange(account.id, e.target.value)}
                    />
                    <span className="font-label-md text-label-md font-semibold text-on-surface-variant">
                      {CURRENCY_LABELS[account.currency]}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" variant="primary" className="w-full">
              <span className="material-symbols-outlined text-[20px]">
                {existingSnapshot ? 'save' : 'check'}
              </span>
              {existingSnapshot ? 'Atualizar saldos' : 'Salvar saldos'}
            </Button>

            {saved && (
              <p
                className="flex items-center justify-center gap-1 font-label-md text-label-md font-semibold text-secondary"
                role="status"
              >
                <span className="material-symbols-outlined text-[18px]">
                  check_circle
                </span>
                Saldos registrados para esta segunda-feira.
              </p>
            )}
          </form>
        </Card>
      )}
    </ScreenContainer>
  );
}

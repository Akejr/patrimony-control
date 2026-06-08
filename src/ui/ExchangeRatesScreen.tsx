import { useState } from 'react';
import { Button, Card, ScreenContainer } from './components';
import { useStore } from '../state/store';

type RateCurrency = 'BRL' | 'EUR';

interface RateFieldConfig {
  currency: RateCurrency;
  label: string;
  hint: string;
}

const FIELDS: RateFieldConfig[] = [
  { currency: 'BRL', label: '1 R$ (Real)', hint: 'Quantos Kz equivalem a 1 R$.' },
  { currency: 'EUR', label: '1 EUR (Euro)', hint: 'Quantos Kz equivalem a 1 EUR.' },
];

/**
 * Tela de Câmbio: edita as Taxas_Atuais de R$ e EUR (em Kwanzas). Valida que
 * cada taxa seja maior que zero. (Req. 5.1, 5.2, 5.4)
 */
export default function ExchangeRatesScreen() {
  const currentRates = useStore((state) => state.currentRates);
  const updateRate = useStore((state) => state.updateRate);

  const [drafts, setDrafts] = useState<Record<RateCurrency, string>>({
    BRL: String(currentRates.BRL),
    EUR: String(currentRates.EUR),
  });
  const [errors, setErrors] = useState<Record<RateCurrency, string | null>>({
    BRL: null,
    EUR: null,
  });
  const [savedCurrency, setSavedCurrency] = useState<RateCurrency | null>(null);

  function handleChange(currency: RateCurrency, value: string) {
    setDrafts((prev) => ({ ...prev, [currency]: value }));
    setErrors((prev) => ({ ...prev, [currency]: null }));
    setSavedCurrency(null);
  }

  function commit(currency: RateCurrency) {
    const rate = Number(drafts[currency].replace(',', '.'));
    const result = updateRate(currency, rate);
    if (!result.ok) {
      setErrors((prev) => ({ ...prev, [currency]: result.error }));
      setSavedCurrency(null);
      return;
    }
    setErrors((prev) => ({ ...prev, [currency]: null }));
    setSavedCurrency(currency);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    FIELDS.forEach((field) => commit(field.currency));
  }

  return (
    <ScreenContainer
      title="Câmbio"
      subtitle="Mantenha as taxas atualizadas para as conversões."
    >
      <Card className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary">info</span>
        <p className="font-body-md text-body-md text-on-surface-variant">
          O Kwanza (Kz) é a moeda base, com taxa fixa igual a 1. Informe quantos
          Kwanzas equivalem a uma unidade de cada moeda.
        </p>
      </Card>

      <form className="flex flex-col gap-gutter" onSubmit={handleSubmit} noValidate>
        <Card>
          <div className="flex flex-col gap-stack-lg">
            {FIELDS.map((field) => {
              const error = errors[field.currency];
              const inputId = `rate-${field.currency}`;
              return (
                <div className="flex flex-col gap-2" key={field.currency}>
                  <label
                    className="font-label-md text-label-md font-semibold text-on-surface-variant"
                    htmlFor={inputId}
                  >
                    {field.label}
                  </label>
                  <div
                    className={`flex items-center gap-2 rounded-xl border bg-surface-container-low px-4 focus-within:ring-2 focus-within:ring-primary/20 ${
                      error
                        ? 'border-error'
                        : 'border-outline-variant focus-within:border-primary'
                    }`}
                  >
                    <input
                      id={inputId}
                      className="flex-1 bg-transparent py-3 font-numeric-data text-[20px] text-on-background outline-none border-0 focus:ring-0 p-0"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={drafts[field.currency]}
                      onChange={(event) =>
                        handleChange(field.currency, event.target.value)
                      }
                      onBlur={() => commit(field.currency)}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${inputId}-error` : undefined}
                    />
                    <span className="font-label-md text-label-md font-semibold text-on-surface-variant">
                      Kz
                    </span>
                  </div>
                  {error ? (
                    <p
                      id={`${inputId}-error`}
                      className="font-label-md text-label-md text-error"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : (
                    <p className="font-label-sm text-label-sm text-on-surface-variant normal-case tracking-normal">
                      {field.hint}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <Button type="submit" variant="primary" className="w-full mt-stack-lg">
            <span className="material-symbols-outlined text-[20px]">save</span>
            Salvar taxas
          </Button>

          {savedCurrency && (
            <p
              className="flex items-center justify-center gap-1 font-label-md text-label-md font-semibold text-secondary mt-stack-md"
              role="status"
            >
              <span className="material-symbols-outlined text-[18px]">
                check_circle
              </span>
              Taxa atualizada.
            </p>
          )}
        </Card>
      </form>
    </ScreenContainer>
  );
}

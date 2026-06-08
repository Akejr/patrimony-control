import type { CurrencyCode } from '../../domain/types';

interface CurrencySelectorProps {
  /** Moeda atualmente selecionada. */
  value: CurrencyCode;
  /** Callback disparado ao selecionar outra moeda. */
  onChange: (currency: CurrencyCode) => void;
}

/** Rótulos curtos de exibição por moeda. */
const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  KZ: 'Kz',
  BRL: 'R$',
  EUR: 'EUR',
};

const CURRENCIES: CurrencyCode[] = ['KZ', 'BRL', 'EUR'];

/**
 * Controle segmentado (Material 3) para alternar a moeda de exibição.
 * (Req. 3.3)
 */
export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  return (
    <div
      className="inline-flex bg-surface-container-high rounded-full p-1 gap-1"
      role="group"
      aria-label="Moeda de exibição"
    >
      {CURRENCIES.map((currency) => {
        const selected = currency === value;
        return (
          <button
            key={currency}
            type="button"
            className={`rounded-full px-4 py-1.5 font-label-md text-label-md font-semibold transition-all min-h-[36px] ${
              selected
                ? 'bg-surface-container-lowest text-on-background shadow-sm'
                : 'text-on-surface-variant hover:text-on-background'
            }`}
            aria-pressed={selected}
            onClick={() => onChange(currency)}
          >
            {CURRENCY_LABELS[currency]}
          </button>
        );
      })}
    </div>
  );
}

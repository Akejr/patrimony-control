/** Identificadores das abas de navegação. */
export type TabKey = 'home' | 'accounts' | 'entry' | 'rates';

interface TabDefinition {
  key: TabKey;
  label: string;
  /** Nome do ícone Material Symbols. */
  icon: string;
}

/** Abas da navegação inferior, na ordem definida no design. */
export const TABS: TabDefinition[] = [
  { key: 'home', label: 'Início', icon: 'dashboard' },
  { key: 'accounts', label: 'Contas', icon: 'account_balance' },
  { key: 'entry', label: 'Registro', icon: 'edit_calendar' },
  { key: 'rates', label: 'Câmbio', icon: 'currency_exchange' },
];

interface BottomNavProps {
  /** Aba atualmente ativa. */
  active: TabKey;
  /** Callback ao trocar de aba. */
  onChange: (tab: TabKey) => void;
}

/**
 * Navegação inferior por abas, fixada na base da tela e respeitando o
 * safe-area-inset inferior do iPhone. Estilo Material 3. (Req. 7.3)
 */
export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 w-full flex justify-around items-center h-16 pb-safe bg-surface border-t border-outline-variant z-50"
      aria-label="Navegação principal"
    >
      {TABS.map((tab) => {
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform duration-150 ${
              selected
                ? 'text-primary font-semibold'
                : 'text-on-surface-variant hover:text-primary-container transition-colors'
            }`}
            aria-current={selected ? 'page' : undefined}
            onClick={() => onChange(tab.key)}
          >
            <span
              className={`material-symbols-outlined mb-1 ${selected ? 'is-filled' : ''}`}
            >
              {tab.icon}
            </span>
            <span className="font-label-sm text-[10px] leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

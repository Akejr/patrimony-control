import { useState } from 'react';
import { BottomNav, type TabKey } from './ui/components';
import HomeScreen from './ui/HomeScreen';
import AccountsScreen from './ui/AccountsScreen';
import WeeklyEntryScreen from './ui/WeeklyEntryScreen';
import ExchangeRatesScreen from './ui/ExchangeRatesScreen';

/**
 * Raiz da aplicação: tela ativa + navegação inferior por abas (Início, Contas,
 * Registro, Câmbio). A seleção da aba é mantida em estado local — não há
 * necessidade de roteador para um app de quatro telas.
 *
 * O conteúdo respeita as safe areas do iPhone: padding superior pelo
 * safe-area-inset-top (status bar/notch) e padding inferior que combina a
 * altura da navegação com o safe-area-inset-bottom (home indicator).
 */
function App() {
  const [tab, setTab] = useState<TabKey>('home');

  return (
    <div className="bg-surface-container-lowest text-on-background min-h-screen flex flex-col font-body-md antialiased">
      <main
        className="flex-grow flex flex-col gap-12 max-w-[1200px] mx-auto w-full"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
          paddingLeft: 'calc(env(safe-area-inset-left) + 16px)',
          paddingRight: 'calc(env(safe-area-inset-right) + 16px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)',
        }}
      >
        {tab === 'home' && <HomeScreen />}
        {tab === 'accounts' && <AccountsScreen />}
        {tab === 'entry' && <WeeklyEntryScreen />}
        {tab === 'rates' && <ExchangeRatesScreen />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default App;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Importar a store na inicialização garante que `loadState()` seja executado
// (carregando os dados persistidos do Local_Storage). (Req. 6.2)
import './state/store';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

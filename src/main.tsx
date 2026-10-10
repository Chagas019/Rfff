import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FavoritesProvider } from './hooks/useFavorites';
import { ToastProvider } from './hooks/useToast';
import '@fontsource/big-shoulders-display/700';
import '@fontsource/big-shoulders-display/800';
import '@fontsource/big-shoulders-display/900';
import '@fontsource-variable/oswald';
import '@fontsource/titillium-web/400';
import '@fontsource/titillium-web/600';
import '@fontsource/titillium-web/700';
import '@fontsource/jetbrains-mono/400';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FavoritesProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </FavoritesProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

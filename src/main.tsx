import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FavoritesProvider } from './hooks/useFavorites';
import { ToastProvider } from './hooks/useToast';
import { EventThemeProvider } from './hooks/useEventTheme';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FavoritesProvider>
        <ToastProvider>
          <EventThemeProvider>
            <App />
          </EventThemeProvider>
        </ToastProvider>
      </FavoritesProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

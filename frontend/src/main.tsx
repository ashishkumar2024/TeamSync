import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { OrgProvider } from './hooks/useOrg';
import './styles.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrgProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </OrgProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);


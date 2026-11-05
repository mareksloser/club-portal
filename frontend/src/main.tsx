import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ApiProvider } from './app/ApiContext';
import { createApiClient } from './api';
import { router } from './app/router';
import { keys } from './app/queries';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const api = createApiClient();

// Signed out elsewhere (another device, an admin) or the session expired:
// the page falls back to what anonymous visitors see.
api.onSessionEnded(() => {
  queryClient.removeQueries({ queryKey: keys.directory });
  void queryClient.invalidateQueries({ queryKey: keys.dashboard });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiProvider client={api}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ApiProvider>
  </React.StrictMode>,
);

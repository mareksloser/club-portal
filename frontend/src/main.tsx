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

// Signed out elsewhere (another device, an admin) or the session expired: drop what the
// signed-in user saw and send them to the login, instead of a half signed-in page.
api.onSessionEnded(() => {
  queryClient.setQueryData(keys.dashboard, null);
  const { pathname, href } = router.state.location;
  if (pathname !== '/login' && pathname !== '/auth/callback') {
    void router.navigate({ to: '/login', search: { redirect: href }, replace: true });
  }
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

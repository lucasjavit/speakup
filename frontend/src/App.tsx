import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes';
import { ErrorProvider } from '@/components/providers';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <RouterProvider router={router} />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </ErrorProvider>
    </QueryClientProvider>
  );
}

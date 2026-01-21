import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes';
import { ErrorProvider } from '@/components/providers';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <RouterProvider router={router} />
      </ErrorProvider>
    </QueryClientProvider>
  );
}

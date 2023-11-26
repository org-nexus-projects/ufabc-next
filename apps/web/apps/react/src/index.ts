import { QueryClient } from '@tanstack/react-query';

import('./bootstrap');

export {};

declare global {
  interface Window {
    queryClient: QueryClient;
    Toaster: {
      success: (message: string) => void;
      error: (message: string) => void;
    };
  }
}

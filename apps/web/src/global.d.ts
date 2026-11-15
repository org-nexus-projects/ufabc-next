import type { QueryClient } from '@tanstack/query-core';
import type { ElMessage } from 'element-plus';

declare global {
  interface Window {
    Toaster: typeof ElMessage;
    queryClient: QueryClient;
  }
}

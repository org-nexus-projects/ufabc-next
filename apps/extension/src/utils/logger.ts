import { createBrowserLogger } from '@next/logger/browser';

export const logger = createBrowserLogger(
  import.meta.env.DEV ? 'dev' : 'production',
  {
    axiomDataset: import.meta.env.VITE_AXIOM_DATASET,
    axiomToken: import.meta.env.VITE_AXIOM_TOKEN,
    level: import.meta.env.VITE_LOG_LEVEL,
  }
);

import { createBrowserLogger } from '@next/logger/browser'

export const logger = createBrowserLogger(
  import.meta.env.VITE_APP_ENV === 'production' ? 'production' : 'dev',
  {
    level: import.meta.env.VITE_LOG_LEVEL,
    axiomDataset: import.meta.env.VITE_AXIOM_DATASET,
    axiomToken: import.meta.env.VITE_AXIOM_TOKEN,
  },
)

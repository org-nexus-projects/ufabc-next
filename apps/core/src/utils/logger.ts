import { createServerLogger } from '@next/logger/server'

const env = process.env.NODE_ENV === 'production' ? 'production' : 'dev'

export const logger = createServerLogger(env, process.env.LOG_LEVEL)

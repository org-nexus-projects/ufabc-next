import type { FastifyRequest, preHandlerAsyncHookHandler } from 'fastify';

import { InvalidInternalToken } from '@/errors/custom-errors.js';

export const validateInternalTokenAuthHook: preHandlerAsyncHookHandler = async (request: FastifyRequest) => {
    const internalToken = request.headers['x-internal-token'] as string;

    if (!internalToken || internalToken !== request.server.config.INTERNAL_TOKEN) {
        request.log.warn(
            { ip: request.ip },
            'Invalid or missing x-internal-token header'
        );

        throw new InvalidInternalToken();
    }
};

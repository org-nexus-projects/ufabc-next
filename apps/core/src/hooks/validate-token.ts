import type { FastifyReply, FastifyRequest, preHandlerAsyncHookHandler } from 'fastify';

export const validateInternalTokenAuthHook: preHandlerAsyncHookHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const internalToken = request.headers['x-internal-token'] as string;

    if (!internalToken || internalToken !== request.server.config.INTERNAL_TOKEN) {
        request.log.warn(
            { ip: request.ip },
            'Invalid or missing x-internal-token header'
        );

        return reply.unauthorized(
            'Invalid or missing x-internal-token header'
        );
    }
};

// TODO: update once i finish the FE
// @ts-nocheck
import type { onSendAsyncHookHandler } from 'fastify';

// need to use this
export const addUserRa: onSendAsyncHookHandler = function (
  request,
  reply,
  payload,
) {
  Object.assign(request.query, {
    ra: request.user?.ra,
  });

  if (Array.isArray(request.body)) {
    payload.forEach((param) => {
      Object.assign(param, { user: request.user?.ra });
    });
  } else {
    payload = { ra: request.user?.ra };
  }
};

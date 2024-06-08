import { authenticate } from "@/hooks/authenticate.js";
import { AccountHandler } from "./account.handlers.js";
import {
  completeUserSchema,
  confirmUserSchema,
  disableUserAccountSchema,
  loginFacebookSchema,
  removeUserDeviceSchema,
  resendEmailSchema,
  setUserDeviceSchema,
  usersInfoSchema,
} from "./account.schema.js";
import type { FastifyInstance } from "fastify";

// eslint-disable-next-line require-await
export async function accountRoutes(app: FastifyInstance) {
  const nextAccountHandler = new AccountHandler();

  app.post(
    "/confirm",
    { schema: confirmUserSchema },
    nextAccountHandler.confirmNextUser,
  );
  app.put<{ Body: { email: string; ra: number } }>(
    "/complete",
    { schema: completeUserSchema, onRequest: [authenticate] },
    nextAccountHandler.completeNextUser,
  );
  app.post(
    "/resend",
    { schema: resendEmailSchema, onRequest: [authenticate] },
    nextAccountHandler.resendNextEmail,
  );
  app.get(
    "/info",
    { schema: usersInfoSchema, onRequest: [authenticate] },
    nextAccountHandler.nextUserInfo,
  );

  app.delete(
    "/remove",
    { schema: disableUserAccountSchema, onRequest: [authenticate] },
    nextAccountHandler.disableUserAccount,
  );

  app.post<{
    Body: {
      deviceId: string;
      token: string;
    };
  }>(
    "/devices",
    { schema: setUserDeviceSchema, onRequest: [authenticate] },
    nextAccountHandler.setUserDevice,
  );
  app.delete<{ Params: { deviceId: string } }>(
    "/devices/:deviceId",
    { schema: removeUserDeviceSchema, onRequest: [authenticate] },
    nextAccountHandler.removeUserDevice,
  );

  app.get(
    "/facebook",
    { schema: loginFacebookSchema },
    nextAccountHandler.loginFacebook,
  );
}
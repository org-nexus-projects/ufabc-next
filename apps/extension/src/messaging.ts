import { defineExtensionMessaging } from '@webext-core/messaging';
import type { Cookies } from 'wxt/browser';

interface ProtocolMap {
  getToken({ action, pageURL }: { action: 'getToken', pageURL: string }): Cookies.Cookie | null;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();

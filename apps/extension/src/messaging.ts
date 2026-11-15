import { defineExtensionMessaging } from '@webext-core/messaging';
import type { Cookies } from 'wxt/browser';

type ProtocolMap = {
  getToken: (data: {
    action: 'getToken';
    pageURL: string;
  }) => Cookies.Cookie | null;
  getTokenMatricula: (data: {
    action: 'getTokenMatricula';
    pageURL: string;
  }) => Cookies.Cookie | null;
  getTokenMoodle: (data: {
    action: 'getTokenMoodle';
    pageURL: string;
  }) => Cookies.Cookie | null;
};

const messaging = defineExtensionMessaging<ProtocolMap>();

export const sendMessage = messaging.sendMessage.bind(messaging);
export const onMessage = messaging.onMessage.bind(messaging);

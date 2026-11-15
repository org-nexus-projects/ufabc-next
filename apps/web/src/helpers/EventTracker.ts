import type { User } from '@next/services';
import mixpanel from 'mixpanel-browser';

import { logger } from '@/utils/logger';

import type { WebEvent } from './WebEvent';

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN ?? '';

class EventTracker {
  private initialized = false;

  public init() {
    if (!MIXPANEL_TOKEN) {
      logger.warn('Mixpanel token not found or invalid. Tracking disabled.');
      return;
    }

    mixpanel.init(MIXPANEL_TOKEN, {
      debug: import.meta.env.VITE_APP_ENV === 'local',
      persistence: 'localStorage',
      track_pageview: false,
    });
    this.initialized = true;
  }

  public track(event: WebEvent, params?: Record<string, unknown>) {
    if (!this.initialized) {
      return;
    }

    const distinctId: unknown = mixpanel.get_distinct_id();
    const eventParams = {
      distinct_id: distinctId ?? null,
      page_url: typeof window === 'undefined' ? null : window.location.href,
      timestamp: new Date().toISOString(),
      ...params,
    };

    mixpanel.track(event, eventParams);
  }

  public setUserProperties(userData: User) {
    if (!this.initialized) {
      return;
    }

    const { _id: userId, oauth, email, createdAt, ra } = userData;

    mixpanel.identify(String(ra));

    const userProperties = {
      $created: createdAt,
      $email: email,
      $id: userId,
      oauth,
      ra,
      userId,
    };

    mixpanel.people.set(userProperties);
  }

  public reset() {
    mixpanel.reset();
    this.initialized = false;
  }
}

export const eventTracker = new EventTracker();

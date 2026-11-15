import { onMessage } from '@/messaging';

export default defineBackground(() => {
	const sessionStorage = browser.storage.session as typeof browser.storage.session & {
		setAccessLevel?: (options: {
			accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS';
		}) => Promise<void>;
	};

	void sessionStorage.setAccessLevel?.({
		accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
	});

  onMessage('getToken', async ({ data }) => {
    const url = new URL(data.pageURL)
    const cookie = await browser.cookies.get({
      name: 'JSESSIONID',
      url: url.href
    })

     if (!cookie) {
      throw new Error('Session cookie not found');
    }

    return cookie
  })

  onMessage('getTokenMatricula', async ({ data }) => {
    const url = new URL(data.pageURL)
    const cookie = await browser.cookies.get({
      name: '_matricula_sig_rails_session',
      url: url.origin
    });

    if (!cookie) {
      throw new Error('Session cookie not found');
    }

    return cookie;
  });

  onMessage("getTokenMoodle", async ({ data }) => {
    const url = new URL(data.pageURL);
    const cookie = await browser.cookies.get({
      name: "MoodleSession",
      url: url.origin,
    });
    return cookie;
  });
});

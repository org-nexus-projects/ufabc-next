import { onMessage } from "@/messaging";

export default defineBackground(() => {
	// @ts-expect-error: setAccessLevel not typed
	browser.storage.session.setAccessLevel({
		accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
	});

  onMessage('getToken', async ({ data }) => {
    const url = new URL(data.pageURL)
    const cookie = await browser.cookies.get({
      url: url.href,
      name: 'JSESSIONID'
    })

     if (!cookie) {
      throw new Error('Session cookie not found');
    }

    return cookie
  })

  onMessage('getTokenMatricula', async ({ data }) => {
    const url = new URL(data.pageURL)
    const cookie = await browser.cookies.get({
      url: url.origin,
      name: '_matricula_sig_rails_session'
    });

    if (!cookie) {
      throw new Error('Session cookie not found');
    }

    return cookie;
  });

  onMessage("getTokenMoodle", async ({ data }) => {
    const url = new URL(data.pageURL);
    const cookie = await browser.cookies.get({
      url: url.origin,
      name: "MoodleSession",
    });
    return cookie;
  });
});

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
    return cookie
  })
});

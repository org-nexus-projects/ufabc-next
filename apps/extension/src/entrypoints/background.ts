export default defineBackground(() => {
	// @ts-expect-error: setAccessLevel not typed
	browser.storage.session.setAccessLevel({
		accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
	});

  browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log((message))
    if (message.action === "getToken") {
      // Get the JSESSIONID cookie from the domain
      const cookie = await browser.cookies.getAll({
        url: "https://sig.ufabc.edu.br",
        // name: "JSESSIONID"
      })
      sendResponse(cookie)
      console.log(cookie)
      return sendResponse(cookie);
    }
  });
});

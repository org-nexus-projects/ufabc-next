export default defineBackground(() => {
	// @ts-expect-error: setAccessLevel not typed
	browser.storage.session.setAccessLevel({
		accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
	});
});

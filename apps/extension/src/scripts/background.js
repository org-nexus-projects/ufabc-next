chrome.runtime.onMessageExternal.addListener(
  function (request, sender, sendResponse) {
    if (request.method == 'storage') {
      chrome.storage.local.get(request.key, function (item) {
        item = item || {};
        sendResponse(item[request.key]);
      });
    }

    return true;
  },
);

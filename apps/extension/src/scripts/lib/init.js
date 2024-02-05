import Utils from '../helpers/utils'

xdLocalStorage.init(
  {
    /* required */
    iframeUrl: Utils.getExtensionUrl('/pages/iframe.html'),
    //an option function to be called right after the iframe was loaded and ready for action
    initCallback: function () {
      console.log(Utils.getExtensionUrl(''))
      console.log('Got iframe ready');
    }
  }
)
import $ from 'jquery'
import Axios from 'axios'

module.exports = new (function (){
  const EXTENSION_ID = 'gphjopenfpnlnffmhhhhdiecgdcopmhk'

  var getChromeUrl = function (url) {
    return getExtensionUrl(url);
  };

  var fetchChromeUrl = async function(url, cb) {
    return Axios.get(getChromeUrl(url)) 
  }

  var injectDiv = async function(link, el) {
    let resp = await fetchChromeUrl(link)
    const data = resp.data

    var div = document.createElement('div');
    div.innerHTML = data;

    if(el) {
      let parent = el.parentNode
      parent.insertBefore(div, el.nextSibling)
    } else {
      document.body.appendChild(div)  
    }
  }

  var injectStyle = function(link) {
    var s = document.createElement("link");
      s.href = getExtensionUrl(link);
      s.type = "text/css";
      s.rel = "stylesheet";
      document.head.appendChild(s); 
  }

  var injectScript = function (link) {
    var s = document.createElement('script');
      s.src = getExtensionUrl(link);
      (document.head || document.documentElement).appendChild(s);
  }

  function getExtensionUrl(link){
    return 'chrome-extension://' + EXTENSION_ID + '/' + link.replace(/^\//, '')
  }

  var getFile = async function (link) {
    return (await Axios.get(getChromeUrl(link))).data
  }
  
  return {
    getChromeUrl: getChromeUrl,
    injectScript: injectScript,
    injectDiv: injectDiv,
    injectStyle: injectStyle,
    fetchChromeUrl: fetchChromeUrl,
    getFile: getFile,
    EXTENSION_ID
  }
})();
import $ from 'jquery'

module.exports = new (function (){
  var getChromeUrl = function (url) {
    return chrome.extension.getURL(url);
  };

  var fetchChromeUrl = function(url, cb) {
    $.get(getChromeUrl(url), function(data, resp) {
      cb(data);
    })
  }

  var injectDiv = function(link) {
    fetchChromeUrl(link, function(data) {
      var div = document.createElement('div');
          div.innerHTML = data;
          document.body.appendChild(div); 
    })
  }

  var injectStyle = function(link) {
    var s = document.createElement("link");
      s.href = chrome.extension.getURL(link);
      s.type = "text/css";
      s.rel = "stylesheet";
      document.head.appendChild(s); 
  }

  var injectScript = function (link) {
    var s = document.createElement('script');
      s.src = chrome.extension.getURL(link);
      (document.head || document.documentElement).appendChild(s);
  }
  
  return {
    getChromeUrl: getChromeUrl,
    injectScript: injectScript,
    injectDiv: injectDiv,
    injectStyle: injectStyle,
    fetchChromeUrl: fetchChromeUrl
  }
})();
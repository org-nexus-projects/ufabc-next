// https://crx.dam.io/ext/gphjopenfpnlnffmhhhhdiecgdcopmhk.html
// add extension id to window
const isBrowser = typeof chrome != "undefined" && !!chrome.storage;
// var script = document.createElement('script');
// const extension_id = isBrowser ? chrome.i18n.getMessage("@@extension_id") : null;
// script.innerHTML = `extension_id = "${extension_id}"`;
// (document.head || document.documentElement).appendChild(script)

import $ from "jquery";
import _ from "lodash";

import matriculaUtils from "../utils/Matricula";
import { setupStorage } from "../utils/setupStorage";

import Utils from "../utils/extensionUtils";

// CSS imports
import "element-ui/lib/theme-chalk/index.css";

let matricula_url;

if (process.env.NODE_ENV == "production") {
  matricula_url = [
    "matricula.ufabc.edu.br/matricula",
    "ufabc-matricula.cdd.naoseiprogramar.com.br/snapshot",
    "api.ufabcnext.com/snapshot",
  ];
} else {
  matricula_url = [
    "matricula.ufabc.edu.br/matricula",
    "api.ufabcnext.com/snapshot",
    "api.ufabcnext.com/snapshot/backup.html",
    "ufabc-matricula.cdd.naoseiprogramar.com.br/snapshot",
    "ufabc-matricula.cdd.naoseiprogramar.com.br/snapshot/backup.html",
    "ufabc-matricula-test.cdd.naoseiprogramar.com.br/snapshot",
    "ufabc-matricula-test.cdd.naoseiprogramar.com.br/snapshot/backup.html",
    "locahost:8011/snapshot",
    "locahost:8011/snapshot/backup.html",
    "https://sig.ufabc.edu.br/sigaa/portais/discente/discente.jsf"
  ];
}

if (!isBrowser) {
  console.log("Not running on browser!");
  load();
} else {
  window.addEventListener("load", load);
}

async function load() {
  const currentUrl = document.location.href;
  // add cross-domain local storage
  Utils.injectScript("lib/xdLocalStorage.min.js");
  Utils.injectIframe("pages/iframe.html");
  Utils.injectScript("lib/init.js");

  setupStorage();
  require("./contentScriptSigaa"); 

  if (matricula_url.some((url) => currentUrl.indexOf(url) != -1))  { // esse if quer dizer que a url deu match pois é diferente a -1  
    // update teachers locally
    setTimeout(async () => {
      let lastUpdate = null;
      try {
        lastUpdate = await Utils.storage.getItem("ufabc-extension-last");
      } catch (err) {
        lastUpdate = Date.now();
      } finally {
        matriculaUtils.updateProfessors(lastUpdate);
      }

      // this is the main vue app
      // i.e, where all the filters live
      const anchor = document.createElement("div"); // filtros da tela de matriculas 
      anchor.setAttribute("id", "app");
      $("#meio").prepend(anchor);

      //inject styles
      Utils.injectStyle("styles/main.css");

      // manda as informacoes para o servidor
      matriculaUtils.sendAlunoData();

      // load vue app modal
      const modal = document.createElement("div");
      modal.setAttribute("id", "modal");
      modal.setAttribute("data-app", true);
      document.body.append(modal);

      // load vue app teacherReview
      const teacherReview = document.createElement("div");
      teacherReview.setAttribute("id", "teacherReview");
      teacherReview.setAttribute("data-app", true);
      document.body.append(teacherReview);

      // load vue app review subjects
      const reviewSubject = document.createElement("div");
      reviewSubject.setAttribute("id", "review-subject");
      reviewSubject.setAttribute("data-app", true);
      document.body.append(reviewSubject);

      // inject Vue app
      Utils.injectScript("scripts/main.js");
    }, 1500);
  }
}

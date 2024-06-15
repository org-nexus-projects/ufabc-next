import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import Utils from '../utils/extensionUtils';
const loading = require('../images/loading.svg');
const logoWhite = require('../images/logo-white.svg');
const errorSVG = require('../images/error.svg');

Utils.injectStyle('styles/portal.css');

const errorToast = Toastify({
  text: `
    <div style="width: 228px; display: flex; align-items: end; margin-right: 12px;">
      <img style="margin-right: 16px;" width="32" height="32" src="${errorSVG}" />
        Não foi possível salvar seus dados, recarregue a página e aguarde.
    </div>`,
  duration: -1,
  close: true,
  gravity: 'top',
  position: 'right',
  className: 'toast-error-container',
  escapeMarkup: false,
  style: {
    background: '#E74C3C;',
  },
});

const redirectToast = (studentname) =>
  Toastify({
    text: `
    <div class='toast-loading-text' style='width: 250px'>
      <img src=${logoWhite} width="120" style="margin-bottom: 8px" />
      <p style="padding-bottom: 8px;">${studentname} Acesse suas notas!</p>\n\n
      <b>Clique no menu Ensino > consultar minhas notas</b>
    </div>`,
    gravity: 'bottom',
    position: 'right',
    duration: 5000,
    style: {
      background:
        'linear-gradient(to right, #2E7EED, rgba(46, 126, 237, 0.5));',
    },
    escapeMarkup: false,
  });

const processingToast = Toastify({
  text: `
      <div class='toast-loading-text' style='width: 250px'>
        <img src=${logoWhite} width="120" style="margin-bottom: 8px" />
        <p style="padding-bottom: 8px;">Atualizando suas informações...</p>\n\n
        <b>NÃO SAIA DESSA PÁGINA,</b>
        <p>apenas aguarde, no máx. 5 min 🙏</p>
      </div>`,
  duration: -1,
  close: false,
  gravity: 'bottom',
  position: 'right',
  className: 'toast-loading',
  escapeMarkup: false,
  avatar: loading,
  style: {
    background: 'linear-gradient(to right, #2E7EED, rgba(46, 126, 237, 0.5));',
  },
});

module.exports = {
  errorToast,
  redirectToast,
  processingToast,
};

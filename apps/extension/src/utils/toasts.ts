import toast from 'toastify-js';

import errorImg from '@/public/error.svg';
import loading from '@/public/loading.svg';
import logoWhite from '@/public/logo-white.svg';

export const successToast = toast({
  close: false,
  duration: 5000,
  escapeMarkup: false,
  gravity: 'bottom',
  position: 'right',
  style: {
    background: '#E74C3C;',
  },
  text: `
      <div class='toast-loading-text' style='width: 250px'>
        <img src=${logoWhite} width="120" style="margin-bottom: 8px" />
        <p>Obrigado por utilizar o UFABC next 💙</p>
        <p style="padding-bottom: 8px; font-weight: 700;">Sincronizado com sucesso! 📋✅</p>\n\n
      </div>`,
});

export const processingToast = toast({
  avatar: loading,
  className: 'toast-loading',
  close: false,
  duration: -1,
  escapeMarkup: false,
  gravity: 'bottom',
  position: 'right',
  style: {
    background: 'linear-gradient(to right, #2E7EED, rgba(46, 126, 237, 0.5));',
  },
  text: `
      <div class='toast-loading-text' style='width: 250px'>
        <img src=${logoWhite} width="120" style="margin-bottom: 8px" />
        <p style="padding-bottom: 8px;">Atualizando suas informações...</p>\n\n
        <b>NÃO SAIA DESSA PÁGINA,</b>
        <p>apenas aguarde, no máx. 5 min 🙏</p>
      </div>`,
});

export const errorToast = toast({
  className: 'toast-error-container',
  close: true,
  duration: -1,
  escapeMarkup: false,
  gravity: 'bottom',
  position: 'right',
  style: {
    background: '#E74C3C;',
  },
  text: `
    <div style="width: 228px; display: flex; align-items: end; margin-right: 12px;">
      <img style="margin-right: 16px;" width="32" height="32" src=${errorImg} />
        Não foi possível salvar seus dados, recarregue a página e aguarde.
    </div>`,
});

export function scrappingErrorToast(msg: string) {
  return toast({
    className: 'toast-error-container',
    close: true,
    duration: -1,
    escapeMarkup: false,
    gravity: 'bottom',
    position: 'right',
    style: {
      background: '#E74C3C;',
    },
    text: `
    <div style="width: 228px; display: flex; align-items: end; margin-right: 12px;">
      <img style="margin-right: 16px;" width="32" height="32" src=${errorImg} />
        ${msg}
    </div>`,
  });
}

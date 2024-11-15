import toast from "toastify-js";

export const successToast = toast({
  text: `
      <div class='toast-loading-text' style='width: 250px'>
        <img src="/logo-white.svg" width="120" style="margin-bottom: 8px" />
        <p>Obrigado por utilizar o UFABC next 💙</p>
        <p style="padding-bottom: 8px; font-weight: 700;">Sincronizado com sucesso! 📋✅</p>\n\n
      </div>`,
  duration: 5000,
  close: false,
  gravity: 'bottom',
  position: 'right',
  escapeMarkup: false,
  style: {
    background: '#E74C3C;',
  },
})

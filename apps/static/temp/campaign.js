import { createApp, computed, nextTick, ref } from './assets/vendor/vue.esm-browser.prod.js';
import { formatLeadPhone, normalizeLeadPhone } from './phone.js';

const details = [
  { key: 'manga', label: 'Manga', title: 'Limited edition, X/30', text: 'Cada uma das 30 peças recebe o seu próprio número na manga. A sua não se repete em nenhuma outra camiseta.' },
  { key: 'gola', label: 'Gola', title: 'A etiqueta Nexus.', text: 'A gola, o encontro com os ombros e a etiqueta tecida da Nexus, vistos de perto.' },
  { key: 'malha', label: 'Malha', title: 'Malhão 280g.', text: 'Malhão 100% algodão, encorpado e com gramatura de 280 g/m². Repare na superfície e nas dobras: é essa estrutura que sustenta o corte boxy.' },
  { key: 'silk', label: 'Estampa', title: 'A identidade, impressa.', text: 'O mascote "Nextzitos" em azul, aplicado em silk sobre o tecido claro. O humor fica por conta da estampa.' }
];
export function useCampaign({ waitlistEndpoint = '' } = {}) {
  const view = ref('back');
  const detail = ref(0);
  const leadName = ref('');
  const leadPhone = ref('');
  const leadError = ref('');
  const leadSent = ref(false);
  const leadSubmitting = ref(false);
  const current = computed(() => details[detail.value]);
  const leadThanks = computed(() => {
    const first = leadName.value.trim().split(/\s+/)[0];
    return first ? `Você está na lista, ${first}.` : 'Você está na lista.';
  });

  function onTabKey(event) {
    const keys = {
      ArrowRight: (detail.value + 1) % details.length,
      ArrowDown: (detail.value + 1) % details.length,
      ArrowLeft: (detail.value + details.length - 1) % details.length,
      ArrowUp: (detail.value + details.length - 1) % details.length,
      Home: 0,
      End: details.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    detail.value = keys[event.key];
    event.currentTarget.querySelectorAll('[role="tab"]')[detail.value].focus();
  }

  async function onLeadPhone(event) {
    const input = event.target;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    let before = raw.slice(0, caret).replace(/\D/g, '').length;
    let digits = raw.replace(/\D/g, '');
    const previous = leadPhone.value.replace(/\D/g, '');
    // Preserve editing across the mask's separators and pasted country codes.
    if (digits === previous && event.inputType === 'deleteContentBackward' && before > 0) {
      digits = digits.slice(0, before - 1) + digits.slice(before);
      before--;
    } else if (digits === previous && event.inputType === 'deleteContentForward') {
      digits = digits.slice(0, before) + digits.slice(before + 1);
    }
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) before = Math.max(0, before - 2);
    const formatted = formatLeadPhone(digits);
    let position = 0;
    let seen = 0;
    while (position < formatted.length && seen < before) {
      if (/\d/.test(formatted[position])) seen++;
      position++;
    }
    if (caret === raw.length) position = formatted.length;
    leadPhone.value = formatted;
    leadError.value = '';
    await nextTick();
    // Also restore the mask when an edit leaves the reactive value unchanged.
    input.value = formatted;
    if (input.ownerDocument.activeElement === input) input.setSelectionRange(position, position);
  }

  async function onLeadSubmit() {
    if (leadSubmitting.value) return;
    const whatsapp = normalizeLeadPhone(leadPhone.value);
    if (!whatsapp) {
      leadError.value = 'Confira seu WhatsApp com DDD.';
      globalThis.document?.getElementById('lead-phone')?.focus();
      return;
    }
    if (!waitlistEndpoint) {
      leadError.value = 'A lista ainda não abriu. Volte em breve para se cadastrar.';
      return;
    }
    leadSubmitting.value = true;
    leadError.value = '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(waitlistEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ nome: leadName.value.trim(), whatsapp, consent: true }),
        signal: controller.signal,
        redirect: 'follow',
      });
      if (!response.ok || (await response.json())?.ok !== true) throw new Error('submit_failed');
      leadSent.value = true;
    } catch {
      leadError.value = 'Não conseguimos confirmar seu cadastro. Tente novamente em instantes.';
    } finally {
      clearTimeout(timeout);
      leadSubmitting.value = false;
    }
  }

  return { view, detail, current, leadName, leadPhone, leadError, leadSent,
    leadSubmitting, leadThanks, onTabKey, onLeadPhone, onLeadSubmit };
}

if (typeof document !== 'undefined') {
  createApp({ setup: () => useCampaign(window.NEXT_SHIRT_CONFIG) }).mount('.htf');
}

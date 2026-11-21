// Configuração pública: URL que recebe POST e confirma a inscrição com { ok: true }.
// Vazio mantém o formulário indisponível, sem simular cadastros.
// TODO(camiseta): concluir o endpoint de cadastro e a integração com a planilha
// Excel para os leads selecionados antes de ativar waitlistEndpoint.
// FUTURO(camiseta): avaliar integração com o Communications para enviar uma
// confirmação pelo WhatsApp após cada inscrição gravada com sucesso.
window.NEXT_SHIRT_CONFIG = Object.freeze({ waitlistEndpoint: '' });

type RespostaSimulada = (
  url: string,
  opcoes?: { headers?: Headers }
) => Promise<unknown>;

export const simulacaoOfetch: { resposta: RespostaSimulada | undefined } = {
  resposta: undefined,
};

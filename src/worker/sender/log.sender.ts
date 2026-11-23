// src/worker/sender/log.sender.ts - versão VPS
import type { IValidade } from '../../types/validade.types.js';
import type { EnviadorAlerta, ResultadoEnvio } from './sender.interface.js';
import { workerLogger } from '../logger.js';

export class LogSender implements EnviadorAlerta {
  canal = 'log-vps';

  async enviar(pendente: IValidade): Promise<ResultadoEnvio> {
    // Simula o que o WhatsApp faria, mas só loga
    workerLogger.info('SIMULACAO_ENVIO', {
      id: String(pendente._id),
      produto: (pendente.produto as any)?.nome ?? pendente.produto,
      vence_em: pendente.data.data_iso,
      dias_antecedencia: pendente.alerta.dias_antecedencia,
      ultimo_envio_em: pendente.alerta.ultimo_envio_em,
      canal: this.canal,
      // Quando ligar o WhatsApp, aqui vai o numero e o texto
      // numero: pendente.contato?.telefone,
      // texto: `Alerta: ${pendente.produto} vence em ${pendente.data.data_iso}`
    });
    return { sucesso: true, canal: this.canal, mensagemId: `sim-${pendente._id}` };
  }
}
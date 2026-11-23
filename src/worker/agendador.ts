// src/worker/agendador.ts
import { workerLogger } from './logger.js';

export function proximoEnvio(hora: number, minuto: number, agora = new Date()): Date {
  const proximo = new Date(agora);
  proximo.setHours(hora, minuto, 0, 0);

  // Se já passou das 19:00 de hoje, joga pra amanhã
  if (proximo <= agora) {
    proximo.setDate(proximo.getDate() + 1);
  }
  return proximo;
}

export function iniciarAgendador(
  hora: number,
  minuto: number,
  fn: () => Promise<void>
) {
  const agendar = () => {
    const proximo = proximoEnvio(hora, minuto);
    const msAteProximo = proximo.getTime() - Date.now();

    workerLogger.info('AGENDADO_PROXIMO_ENVIO', {
      proximo: proximo.toISOString(),
      proximo_br: proximo.toLocaleString('pt-BR'),
    });

    setTimeout(async () => {
      try {
        await fn();
      } catch (erro: any) {
        workerLogger.erro('ERRO_CICLO_AGENDADO', { erro: erro?.message ?? String(erro) });
      } finally {
        agendar(); // <-- sempre reagenda, mesmo com erro
      }
    }, msAteProximo);
  };

  agendar();
}
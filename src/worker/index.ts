// src/worker/index.ts
//INICIAR o WORKER: npm run worker

// src/worker/index.ts
import 'dotenv/config';
import mongoose from 'mongoose';
import { rodarCicloAlertas } from './validade.worker.js';
import { iniciarAgendador } from './agendador.js';
import { LogSender } from './sender/log.sender.js';
import { workerLogger } from './logger.js';

const HORA_ENVIO = Number(process.env.HORA_ENVIO);
const MINUTO_ENVIO = Number(process.env.MINUTO_ENVIO);

if (Number.isNaN(HORA_ENVIO) || Number.isNaN(MINUTO_ENVIO)) {
  throw new Error('HORA_ENVIO e MINUTO_ENVIO devem ser definidos no ecosystem.config.cjs');
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI não definida no .env');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  workerLogger.info('WORKER_INICIADO', {
    horaEnvio: `${HORA_ENVIO}:${String(MINUTO_ENVIO).padStart(2, '0')}`,
    sender: 'LogSender',
  });

  const sender = new LogSender();

  iniciarAgendador(HORA_ENVIO, MINUTO_ENVIO, async () => {
    const resultado = await rodarCicloAlertas(sender);
    workerLogger.ciclo(resultado);
  });
}

main().catch((e) => {
  workerLogger.erro('WORKER_FATAL', { erro: e.message });
  process.exit(1);
});
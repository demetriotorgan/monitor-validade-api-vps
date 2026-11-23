// Logger que escreve no console E no arquivo, pra VPS
import fs from 'node:fs';
import path from 'node:path';

const LOG_DIR = process.env.WORKER_LOG_DIR ?? 'logs';
const LOG_FILE = path.join(LOG_DIR, 'worker.log');
const ERRO_FILE = path.join(LOG_DIR, 'worker-erros.log');

function garantirPasta() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function linha(nivel: string, msg: string, dados?: any) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${nivel}] ${msg}`;
  const completa = dados ? `${base} ${JSON.stringify(dados)}` : base;
  return completa;
}

export const workerLogger = {
  info(msg: string, dados?: any) {
    garantirPasta();
    const l = linha('INFO', msg, dados);
    console.log(l);
    fs.appendFileSync(LOG_FILE, l + '\n');
  },
  erro(msg: string, dados?: any) {
    garantirPasta();
    const l = linha('ERRO', msg, dados);
    console.error(l);
    fs.appendFileSync(LOG_FILE, l + '\n');
    fs.appendFileSync(ERRO_FILE, l + '\n');
  },
  ciclo(resultado: any) {
    garantirPasta();
    const l = linha('CICLO', 'Ciclo finalizado', resultado);
    console.log(l);
    fs.appendFileSync(LOG_FILE, l + '\n');
  }
};
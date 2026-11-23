// src/services/validade.worker.service.ts
// Única fonte da verdade - controller e worker usam esse arquivo
import { isValidObjectId } from 'mongoose';
import { ValidadeModel } from '../models/Validade.js';
import { calcularStatusValidade } from '../validade-lifecycle/calculo/calculo.js';
import { AppError } from '../erros/app-error.js';

export async function confirmarEnvioAlertaService(id: string) {
  if (!isValidObjectId(id)) {
    throw new AppError('ID da validade inválido.', 400, 'ID_INVALIDO');
  }

  const validade = await ValidadeModel.findById(id).lean();
  if (!validade) {
    throw new AppError('Registro de validade não encontrado.', 404, 'NAO_ENCONTRADO');
  }

  const statusReal = calcularStatusValidade(
    validade.data.data_iso,
    validade.alerta.dias_antecedencia
  );

  if (statusReal !== 'alerta') {
    throw new AppError(
      `Não é possível confirmar envio de alerta para uma validade com status real "${statusReal}". Apenas validades em "alerta" podem receber confirmação de envio.`,
      400,
      'TRANSICAO_PROIBIDA'
    );
  }

  const atualizado = await ValidadeModel.findByIdAndUpdate(
    id,
    { 'alerta.ultimo_envio_em': new Date() },
    { returnDocument: 'after', runValidators: true }
  );

  if (!atualizado) {
    throw new AppError('Registro de validade não encontrado.', 404, 'NAO_ENCONTRADO');
  }

  return atualizado;
}
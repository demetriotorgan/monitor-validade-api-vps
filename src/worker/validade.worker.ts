// src/worker/validade.worker.ts
import { ValidadeModel } from '../models/Validade.js';
import { buscarAlertasPendentes } from '../validade-lifecycle/orquestrador/camada3-alertas.js';
import { calcularStatusValidade } from '../validade-lifecycle/calculo/calculo.js';
import { isValidObjectId } from 'mongoose';
import { AppError } from '../erros/app-error.js';
import type { EnviadorAlerta } from './sender/sender.interface.js';
import { workerLogger } from './logger.js';
import { confirmarEnvioAlertaService } from '../services/validade.worker.service.js';

export interface ResultadoRodada {
    total: number;
    enviados: number;
    falhas: number;
    pulados: number;
    data_referencia: string;
}

export async function rodarCicloAlertas(sender: EnviadorAlerta): Promise<ResultadoRodada> {
    const { pendentes, data_referencia } = await buscarAlertasPendentes();

    let enviados = 0;
    let falhas = 0;
    let pulados = 0;

    for (const pendente of pendentes) {
        try {
             if (!isValidObjectId(pendente._id)) {
                throw new AppError('ID da validade inválido.', 400, 'ID_INVALIDO');
            }
            
            const statusReal = calcularStatusValidade(
                pendente.data.data_iso,
                pendente.alerta.dias_antecedencia
            );

            if (statusReal !== 'alerta') {
                pulados++;
                workerLogger.info('PULADO_STATUS_MUDOU', {
                    id: String(pendente._id),
                    produto: pendente.produto,
                    statusReal,
                });
                continue;
            }

            const resultado = await sender.enviar(pendente);
            if (!resultado.sucesso) {
                falhas++;
                workerLogger.erro('FALHA_ENVIO', { id: String(pendente._id), erro: resultado.erro });
                continue;
            }          

            // ✅ Agora usa o MESMO serviço do controller, não duplica regra
            await confirmarEnvioAlertaService(String(pendente._id));
            enviados++;
        } catch (erro: any) {
            falhas++;
            workerLogger.erro('ERRO_ITEM', {
                id: String(pendente._id),
                erro: erro?.message ?? String(erro),
                codigo: erro?.codigo,
            });
        }
    }

    return { total: pendentes.length, enviados, falhas, pulados, data_referencia };
}
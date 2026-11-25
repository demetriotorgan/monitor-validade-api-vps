import { NextFunction, Request, Response } from "express";
import { buscarAlertasPendentes } from "../validade-lifecycle/orquestrador/camada3-alertas.js";
import { ResultadoListaAlertas } from "../types/status.type.js";
import { AppError } from "../erros/app-error.js";
import { confirmarEnvioAlertaService } from "../services/validade.worker.service.js";

//Controller fino: só chama Camada 3, não decide, não filtra no banco.
// A decisão de quem é alerta está toda em camada3-alertas.ts
export async function listarAlertasPendentes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { pendentes, data_referencia, quantidade }: ResultadoListaAlertas =
      await buscarAlertasPendentes();

    // Boletim vazio não é erro.
    // O worker vai decidir se envia "Nenhuma prioridade hoje" ou nem envia.
    res.status(200).json({
      sucesso: true,
      dados: pendentes,
      data_referencia,
      quantidade,
    });
  } catch (erro) {
    if (erro instanceof AppError) {
      next(erro);
      return;
    }

    next(
      new AppError(
        'Erro interno ao listar alertas pendentes.',
        500,
        'ERRO_LISTAR_ALERTAS'
      )
    );
  }
}

export async function confirmarEnvioAlerta(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Express 5 pode vir como array se a rota tiver /:id/:id
    // Se vier array, é erro de rota, não de dado
    if (Array.isArray(id)) {
      throw new AppError('ID da validade inválido.', 400, 'ID_INVALIDO');
    }

    const atualizado = await confirmarEnvioAlertaService(id);
    res.status(200).json({
      sucesso: true,
      mensagem: 'Envio de alerta confirmado.',
      dados: atualizado,
    });
  } catch (erro) {
    if (erro instanceof AppError) return next(erro);
    next(new AppError('Erro interno ao confirmar envio de alerta.', 500, 'ERRO_CONFIRMAR_ENVIO'));
  }
}
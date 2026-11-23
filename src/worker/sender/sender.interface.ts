// Interface congelada - qualquer sender tem que respeitar isso
import type { IValidade } from '../../types/validade.types.js';

export interface ResultadoEnvio {
  sucesso: boolean;
  canal: string;
  mensagemId?: string;
  erro?: string;
}

export interface EnviadorAlerta {
  canal: string;
  enviar(pendente: IValidade): Promise<ResultadoEnvio>;
}
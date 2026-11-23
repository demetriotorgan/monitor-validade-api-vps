import { IValidade } from "./validade.types.js";

export type StatusValidade = 'espera' | 'alerta' | 'vencido' | 'encerrado';

export interface ResultadoListaAlertas {
  pendentes: IValidade[];
  data_referencia: string; // yyyy-MM-dd - hoje em Brasília
  quantidade: number;
}


// utils/validade.utils.ts
import { parseISO, startOfDay, isBefore, isEqual, differenceInCalendarDays, subDays, isAfter } from 'date-fns';
import { IValidade, IValidadeComStatus} from '../types/validade.types.js';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { calcularDiasRestantes, obterHojeBrasilia, TIMEZONE_BRASILIA } from '../validade-lifecycle/tempo/tempo.js';
import { StatusValidade } from '../types/status.type.js';

/**
 * Calcula o status inicial de uma validade com base na data de vencimento
 * e nos dias de antecedência configurados no alerta.
 */

// RF-14: Usado só no controller, para dar a mensagem certa
// Retorna true se data > hoje
export function isDataValidadeFutura(dataIso: string): boolean {
  const hoje = obterHojeBrasilia();
  const dataValidade = startOfDay(parseISO(dataIso));
  return isAfter(dataValidade, hoje);
}

// RF-13 / RF-14: Só calcula, não lança erro
export function calcularStatusValidade(dataIso: string, diasAntecedencia: number): StatusValidade {
  const hoje = obterHojeBrasilia();
  const dataValidade = startOfDay(parseISO(dataIso));


  // DECISÃO #1: Só é vencido se já passou de hoje. Hoje ainda é alerta.  
  if (isBefore(dataValidade, hoje)) {
    return 'vencido';
  }

  const diasRestantes = differenceInCalendarDays(dataValidade, hoje);

  // RF-13: 
   // Se diasRestantes == 0, cai aqui: 0 <= antecedencia (se antecedencia > 0) -> alerta
  // Se antecedencia == 0, 0 <= 0 também é alerta, mas isso é tratado no dentro_do_periodo
  
  if (diasRestantes <= diasAntecedencia) {
    return 'alerta';
  }

  return 'espera';
};

// RF-19: data_inicio_alerta = data_validade - dias_alerta
export function calcularDataInicioAlerta(dataIso: string, diasAntecedencia: number): string {
  const hoje = obterHojeBrasilia();
  const dataValidade = startOfDay(parseISO(dataIso));
  const inicioTeorico = subDays(dataValidade, diasAntecedencia);
  // RF-19: Retorna no mesmo formato YYYY-MM-DD do data_iso, sem converter para UTC
   const inicioEfetivo = isBefore(inicioTeorico, hoje) ? hoje : inicioTeorico;
  return format(inicioEfetivo, 'yyyy-MM-dd');
};

function calcularDentroDoPeriodoAlerta(validade: IValidade): boolean {
  if (validade.validade === 'encerrado') return false;

  const hoje = obterHojeBrasilia();
  const dataValidade = startOfDay(parseISO(validade.data.data_iso));
  const diasAntecedencia = validade.alerta?.dias_antecedencia ?? 0;

  if (diasAntecedencia <= 0) return false;

  // DECISÃO #1 aqui também: se já venceu (data < hoje), não está mais em alerta
  // Se vence hoje (data == hoje), AINDA está em alerta
  if (isBefore(dataValidade, hoje)) {
    return false;
  }

  // DECISÃO #2 aqui também: usa o início EFETIVO, não o teórico
  const inicioAlertaStr = calcularDataInicioAlerta(validade.data.data_iso, diasAntecedencia);
  const inicioAlerta = startOfDay(parseISO(inicioAlertaStr));

  // Dentro do período: inicioEfetivo <= hoje <= dataValidade  
  const depoisOuIgualInicio =
    isAfter(hoje, inicioAlerta) || isEqual(hoje, inicioAlerta);
  const ateDataValidade =
    isBefore(hoje, dataValidade) || isEqual(hoje, dataValidade);

  return depoisOuIgualInicio && ateDataValidade;
};


export function formatarValidadeComStatus(validade: IValidade): IValidadeComStatus {
  // Só ENCERRADO é histórico congelado. É decisão humana.
  // VENCIDO agora recalcula todo dia, porque é só conta de tempo.
  const ehHistoricoCongelado = 
    validade.validade === 'encerrado';

  const validadeCalculada = ehHistoricoCongelado
    ? validade.validade
    : calcularStatusValidade(validade.data.data_iso, validade.alerta.dias_antecedencia);

  // VENCE_HOJE é calculado na hora, não é salvo no banco.
  // Encerrado nunca é vence hoje.
  const venceHoje: boolean = validade.validade !== 'encerrado' && calcularDiasRestantes(validade.data.data_iso) === 0;
    

  return {
    ...validade,
    validade: validadeCalculada,
    dentro_do_periodo_alerta: calcularDentroDoPeriodoAlerta(validade),
    data_inicio_alerta: calcularDataInicioAlerta(
      validade.data.data_iso,
      validade.alerta.dias_antecedencia
    ),
    venceHoje
  };
};
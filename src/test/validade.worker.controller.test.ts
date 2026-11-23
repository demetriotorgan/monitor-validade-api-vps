// src/test/validade.worker.controller.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { confirmarEnvioAlerta, listarAlertasPendentes } from '../controllers/validade.worker.controller.js';
import { ValidadeModel } from '../models/Validade.js';

// ============================================================
// mockRes TEM QUE ESTAR AQUI, ANTES DE QUALQUER test()
// ============================================================
function mockRes() {
  const res: any = {};
  res.statusCode = 0;
  res.body = null;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: any) => {
    res.body = payload;
    return res;
  };
  return res;
}

function mockNext() {
  let erroCapturado: any = null;
  const next = (err?: any) => { erroCapturado = err ?? null; };
  return { next, getErro: () => erroCapturado };
}

function dataIsoDiasDepois(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function dataIsoDiasAntes(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function fakeValidade(overrides: any = {}) {
  return {
    _id: '691e1a2b3c4d5e6f7a8b9c0d',
    produto: 'Leite',
    data: { data_iso: dataIsoDiasDepois(2) },
    alerta: { dias_antecedencia: 5, ultimo_envio_em: null },
    validade: 'alerta',
    ...overrides,
  };
}
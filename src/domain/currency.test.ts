import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { toBase, fromBase } from './currency';
import type { CurrencyCode, ExchangeRates } from './types';

describe('currency conversion', () => {
  // Feature: patrimony-control-pwa, Property 12: Round-trip de conversão de moeda
  // Para qualquer valor em Kwanzas e qualquer taxa positiva, converter para R$ ou EUR
  // e depois de volta para Kwanzas reproduz o valor original (a menos de erro de ponto flutuante).
  // Validates: Requirements 3.3
  it('Property 12: round-trip conversion reproduces the original Kz amount (BRL and EUR)', () => {
    fc.assert(
      fc.property(
        // Valor em Kwanzas
        fc.double({ min: -1e12, max: 1e12, noNaN: true, noDefaultInfinity: true }),
        // Taxas positivas para BRL e EUR
        fc.double({ min: 1e-3, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1e-3, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        fc.constantFrom<CurrencyCode>('BRL', 'EUR'),
        (amountKz, brl, eur, target) => {
          const rates: ExchangeRates = { BRL: brl, EUR: eur };

          // fromBase depois toBase deve reproduzir o valor original em Kz.
          const roundTrip = toBase(fromBase(amountKz, target, rates), target, rates);

          // Tolerância relativa para erro de ponto flutuante.
          const tolerance = Math.max(1, Math.abs(amountKz)) * 1e-9;
          expect(Math.abs(roundTrip - amountKz)).toBeLessThanOrEqual(tolerance);
        }
      ),
      { numRuns: 100 }
    );
  });
});

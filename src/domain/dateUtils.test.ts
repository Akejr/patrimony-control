import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { toMondayKey } from './dateUtils';

// Feature: patrimony-control-pwa, Property 9: Chave do snapshot é sempre uma
// segunda-feira e é idempotente
//
// Para qualquer data, a chave gerada para o snapshot corresponde a uma
// segunda-feira, e normalizar uma chave já normalizada produz a mesma chave.
//
// Validates: Requirements 2.3
describe('toMondayKey — Property 9', () => {
  it('retorna sempre uma segunda-feira e é idempotente', () => {
    fc.assert(
      fc.property(
        fc.date({
          min: new Date('1970-01-01T00:00:00.000Z'),
          max: new Date('2100-12-31T00:00:00.000Z'),
          noInvalidDate: true,
        }),
        (date) => {
        const key = toMondayKey(date);

        // A chave deve corresponder a uma segunda-feira.
        // 'YYYY-MM-DD' é interpretado pelo construtor de Date como meia-noite UTC.
        expect(new Date(key).getUTCDay()).toBe(1);

        // Idempotência: re-normalizar uma chave já normalizada produz a mesma chave.
        expect(toMondayKey(new Date(key))).toBe(key);
      }
      ),
      { numRuns: 100 }
    );
  });
});

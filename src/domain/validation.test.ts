import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isSupportedCurrency, isValidAccountName, isValidRate } from './validation';

const SUPPORTED = ['KZ', 'BRL', 'EUR'];

describe('validation properties', () => {
  // Feature: patrimony-control-pwa, Property 2: Somente moedas suportadas são aceitas
  // Para qualquer código de moeda, isSupportedCurrency retorna true se e somente se
  // a moeda for uma de KZ, BRL ou EUR.
  it('Property 2: somente moedas suportadas são aceitas', () => {
    fc.assert(
      fc.property(fc.string(), (code) => {
        expect(isSupportedCurrency(code)).toBe(SUPPORTED.includes(code));
      }),
      { numRuns: 100 }
    );
  });

  // Feature: patrimony-control-pwa, Property 3: Nomes em branco são rejeitados
  // Para qualquer string composta inteiramente de espaços (ou vazia),
  // isValidAccountName retorna false.
  it('Property 3: nomes em branco ou vazios são rejeitados', () => {
    const whitespace = fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v'));
    fc.assert(
      fc.property(whitespace, (name) => {
        expect(isValidAccountName(name)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: patrimony-control-pwa, Property 17: Taxas não positivas são rejeitadas
  // Para qualquer número <= 0 (ou não finito), isValidRate retorna false;
  // para qualquer número > 0 finito, retorna true.
  it('Property 17: taxas não positivas (ou não finitas) são rejeitadas', () => {
    fc.assert(
      fc.property(fc.double({ noNaN: false }), (rate) => {
        const expected = Number.isFinite(rate) && rate > 0;
        expect(isValidRate(rate)).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});

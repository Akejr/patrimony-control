import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { useStore } from './store';
import { loadState } from '../storage/storage';
import type { CurrencyCode, ExchangeRates } from '../domain/types';

// Taxas iniciais padrão usadas para reset (espelham schema.defaultState).
const DEFAULT_RATES: ExchangeRates = { BRL: 225, EUR: 1320 };

// Gerador de código de moeda suportado.
const currencyArb: fc.Arbitrary<CurrencyCode> = fc.constantFrom<CurrencyCode>(
  'KZ',
  'BRL',
  'EUR',
);

// Gerador de nome de conta VÁLIDO: não-vazio após trim.
const validNameArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((s) => s.trim().length > 0);

// Gerador de conta de input (nome válido + moeda suportada).
const accountInputArb = fc.record({
  name: validNameArb,
  currency: currencyArb,
});

/**
 * Reinicia o estado da store e o Local_Storage para um estado limpo.
 * Limpa o localStorage E reseta o estado em memória da store, pois a store é
 * inicializada a partir de loadState() apenas no carregamento do módulo.
 */
function resetState(): void {
  localStorage.clear();
  useStore.setState({
    accounts: [],
    snapshots: [],
    currentRates: { ...DEFAULT_RATES },
  });
}

describe('store account actions (property-based)', () => {
  beforeEach(() => {
    resetState();
  });

  // Feature: patrimony-control-pwa, Property 1: Round-trip de persistência de conta
  // Para toda conta válida (nome não-vazio e moeda suportada), adicioná-la deve
  // resultar em sua presença ao ler as contas do Local_Storage, com nome (trimmed)
  // e moeda preservados.
  // Validates: Requirements 1.1
  it('Property 1: addAccount persists a valid account retrievable from state and loadState', () => {
    fc.assert(
      fc.property(accountInputArb, ({ name, currency }) => {
        resetState();

        const result = useStore.getState().addAccount(name, currency);
        expect(result.ok).toBe(true);

        const expectedName = name.trim();

        // Presente no estado em memória.
        const inState = useStore
          .getState()
          .accounts.find((a) => a.name === expectedName && a.currency === currency);
        expect(inState).toBeDefined();

        // Presente via round-trip no Local_Storage.
        const persisted = loadState().accounts.find(
          (a) => a.id === inState!.id,
        );
        expect(persisted).toBeDefined();
        expect(persisted!.name).toBe(expectedName);
        expect(persisted!.currency).toBe(currency);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: patrimony-control-pwa, Property 4: Exclusão remove a conta
  // Para qualquer conjunto de contas e qualquer conta nele contida, excluí-la
  // resulta em sua ausência ao ler do Local_Storage.
  // Validates: Requirements 1.5
  it('Property 4: deleteAccount removes the account from state and loadState', () => {
    fc.assert(
      fc.property(
        fc.array(accountInputArb, { minLength: 1, maxLength: 10 }),
        fc.nat(),
        (inputs, index) => {
          resetState();

          for (const { name, currency } of inputs) {
            useStore.getState().addAccount(name, currency);
          }

          const accounts = useStore.getState().accounts;
          const target = accounts[index % accounts.length];

          useStore.getState().deleteAccount(target.id);

          // Ausente do estado em memória.
          expect(
            useStore.getState().accounts.some((a) => a.id === target.id),
          ).toBe(false);

          // Ausente do Local_Storage.
          expect(loadState().accounts.some((a) => a.id === target.id)).toBe(
            false,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: patrimony-control-pwa, Property 5: Edição persiste alterações
  // Para qualquer conta existente e qualquer edição válida de nome e/ou moeda,
  // ler a conta de volta retorna exatamente os valores editados.
  // Validates: Requirements 1.6
  it('Property 5: editAccount persists edited name and currency', () => {
    fc.assert(
      fc.property(
        accountInputArb,
        validNameArb,
        currencyArb,
        (initial, newName, newCurrency) => {
          resetState();

          useStore.getState().addAccount(initial.name, initial.currency);
          const id = useStore.getState().accounts[0].id;

          const result = useStore
            .getState()
            .editAccount(id, { name: newName, currency: newCurrency });
          expect(result.ok).toBe(true);

          const expectedName = newName.trim();

          // Estado em memória reflete a edição.
          const edited = useStore
            .getState()
            .accounts.find((a) => a.id === id);
          expect(edited).toBeDefined();
          expect(edited!.name).toBe(expectedName);
          expect(edited!.currency).toBe(newCurrency);

          // Local_Storage reflete a edição.
          const persisted = loadState().accounts.find((a) => a.id === id);
          expect(persisted).toBeDefined();
          expect(persisted!.name).toBe(expectedName);
          expect(persisted!.currency).toBe(newCurrency);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: patrimony-control-pwa, Property 6: A lista contém todas as contas persistidas
  // Para qualquer conjunto de contas válidas persistidas, a lista exibida contém
  // todas elas.
  // Validates: Requirements 1.7
  it('Property 6: accounts list contains every added account', () => {
    fc.assert(
      fc.property(
        fc.array(accountInputArb, { minLength: 1, maxLength: 15 }),
        (inputs) => {
          resetState();

          for (const { name, currency } of inputs) {
            useStore.getState().addAccount(name, currency);
          }

          const accounts = useStore.getState().accounts;
          // Uma conta por input adicionado.
          expect(accounts).toHaveLength(inputs.length);

          // Cada input está representado por uma conta distinta (nome trimmed + moeda).
          const remaining = [...accounts];
          for (const { name, currency } of inputs) {
            const expectedName = name.trim();
            const matchIndex = remaining.findIndex(
              (a) => a.name === expectedName && a.currency === currency,
            );
            expect(matchIndex).toBeGreaterThanOrEqual(0);
            remaining.splice(matchIndex, 1);
          }

          // A lista persistida também contém todas as contas.
          const persisted = loadState().accounts;
          expect(persisted).toHaveLength(inputs.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

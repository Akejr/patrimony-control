# Implementation Plan: Patrimony Control PWA

## Overview

A implementação segue uma arquitetura em camadas (domínio puro → persistência → estado → UI), em **React + Vite + TypeScript**, com persistência em `localStorage` e empacotamento PWA via `vite-plugin-pwa`. As tarefas começam pelo scaffold do projeto e pelos tipos de domínio, avançam pelas funções puras (datas, validações, conversões, cálculos), depois pela persistência e pela store, e terminam com a UI e a configuração PWA, garantindo que cada etapa seja integrada à anterior sem código órfão. Os testes baseados em propriedades (fast-check) acompanham cada módulo de domínio para validar as propriedades de correção definidas no design.

## Tasks

- [x] 1. Inicializar projeto e tipos de domínio
  - [x] 1.1 Configurar scaffold React + Vite + TypeScript
    - Inicializar projeto Vite com template `react-ts`
    - Adicionar dependências: `zustand`, `vite-plugin-pwa`; devDependencies: `vitest`, `fast-check`
    - Configurar `vitest` (scripts de teste com execução única) e estrutura de pastas `src/domain`, `src/storage`, `src/state`, `src/ui`, `src/pwa`
    - _Requisitos: 6.3, 7.1_

  - [x] 1.2 Definir tipos de domínio
    - Criar `src/domain/types.ts` com `CurrencyCode`, `Account`, `ExchangeRates`, `BalancesByAccount`, `WeeklySnapshot`, `AppState`, `Variation`
    - _Requisitos: 1.3, 5.1_

- [x] 2. Implementar utilidades de data e validações
  - [x] 2.1 Implementar `dateUtils.ts`
    - Criar `src/domain/dateUtils.ts` com `toMondayKey(date)` (normaliza para a segunda-feira, ISO `YYYY-MM-DD`) e `previousMondayKey(mondayKey, weeksBack)`
    - _Requisitos: 2.3_

  - [x]* 2.2 Escrever teste de propriedade para normalização de datas
    - **Property 9: Chave do snapshot é sempre uma segunda-feira e é idempotente**
    - **Validates: Requirements 2.3**

  - [x] 2.3 Implementar `validation.ts`
    - Criar `src/domain/validation.ts` com `isValidAccountName`, `isSupportedCurrency`, `isValidRate`
    - _Requisitos: 1.2, 1.4, 5.4_

  - [x]* 2.4 Escrever testes de propriedade para validações
    - **Property 2: Somente moedas suportadas são aceitas**
    - **Property 3: Nomes em branco são rejeitados**
    - **Property 17: Taxas não positivas são rejeitadas**
    - **Validates: Requirements 1.2, 1.4, 5.4**

- [x] 3. Implementar conversão de moeda e cálculos de patrimônio
  - [x] 3.1 Implementar `currency.ts`
    - Criar `src/domain/currency.ts` com `toBase(amount, currency, rates)` e `fromBase(amountKz, target, rates)`
    - Regra: `toBase(x,'KZ',r)=x`, `toBase(x,'BRL',r)=x*r.BRL`, `fromBase(y,'BRL',r)=y/r.BRL`
    - _Requisitos: 3.1, 3.3_

  - [x]* 3.2 Escrever teste de propriedade para conversão de moeda
    - **Property 12: Round-trip de conversão de moeda**
    - **Validates: Requirements 3.3**

  - [x] 3.3 Implementar `patrimony.ts`
    - Criar `src/domain/patrimony.ts` com `totalInBase`, `currentTotal` (retorna 0 sem snapshots), `variation` (usa taxas armazenadas em cada snapshot; trata total anterior zero como indisponível) e `variationSign`
    - _Requisitos: 3.1, 3.4, 4.1, 4.2, 4.3, 4.6, 4.7_

  - [x]* 3.4 Escrever testes de propriedade para patrimônio e variações
    - **Property 11: Patrimônio total é a soma dos saldos convertidos para a base**
    - **Property 13: Cálculo da variação percentual**
    - **Property 14: Isolamento do efeito cambial**
    - **Property 15: Sinal da variação determina a indicação visual**
    - **Validates: Requirements 3.1, 4.1, 4.2, 4.3, 4.6, 4.7**

  - [x]* 3.5 Escrever testes unitários para casos de borda do patrimônio
    - Total zero quando não há snapshot (3.4); variação indisponível (4.4, 4.5)
    - _Requisitos: 3.4, 4.4, 4.5_

- [x] 4. Checkpoint — Validar camada de domínio
  - Garanta que todos os testes passem; pergunte ao usuário caso surjam dúvidas.

- [x] 5. Implementar camada de persistência
  - [x] 5.1 Implementar `schema.ts` e `storage.ts`
    - Criar `src/storage/schema.ts` (chave `patrimony-control:v1`, estado default) e `src/storage/storage.ts` com `loadState()` (estado default quando vazio/corrompido) e `saveState(state)` serializando o `AppState` completo em JSON
    - _Requisitos: 6.1, 6.2_

  - [x]* 5.2 Escrever teste de propriedade para round-trip do estado
    - **Property 18: Round-trip de persistência do estado da aplicação**
    - **Validates: Requirements 6.2**

- [x] 6. Implementar camada de estado (store)
  - [x] 6.1 Implementar `store.ts`
    - Criar `src/state/store.ts` (Zustand) com `addAccount`, `editAccount`, `deleteAccount`, `upsertWeeklySnapshot`, `updateRate`, `setDisplayCurrency`
    - Validar nome/moeda em `addAccount`/`editAccount`; validar `rate > 0` em `updateRate`; normalizar data e capturar `currentRates` em `upsertWeeklySnapshot`; persistir via `saveState` em cada mutação; carregar via `loadState` na inicialização
    - _Requisitos: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.4, 2.5, 5.2, 5.3, 6.2_

  - [x]* 6.2 Escrever testes de propriedade para ações de conta na store
    - **Property 1: Round-trip de persistência de conta**
    - **Property 4: Exclusão remove a conta**
    - **Property 5: Edição persiste alterações**
    - **Property 6: A lista contém todas as contas persistidas**
    - **Validates: Requirements 1.1, 1.5, 1.6, 1.7**

  - [x]* 6.3 Escrever testes de propriedade para snapshots e taxas na store
    - **Property 7: Round-trip de persistência do snapshot semanal**
    - **Property 8: Snapshot captura as taxas vigentes**
    - **Property 10: Não há snapshots duplicados para a mesma semana**
    - **Property 16: Round-trip de persistência de taxa**
    - **Validates: Requirements 2.1, 2.2, 2.4, 5.2**

- [x] 7. Checkpoint — Validar persistência e estado
  - Garanta que todos os testes passem; pergunte ao usuário caso surjam dúvidas.

- [x] 8. Implementar componentes de UI
  - [x] 8.1 Criar layout base, navegação e componentes reutilizáveis
    - Criar `src/App.tsx`, `src/main.tsx` (chama `loadState` na inicialização), navegação inferior por abas (Início, Contas, Registro, Taxas) e `src/ui/components/` (estilo branco/finanças, safe-area insets)
    - _Requisitos: 6.2, 7.3_

  - [x] 8.2 Implementar `AccountsScreen`
    - Criar `src/ui/AccountsScreen.tsx` com lista de contas, criar/editar/excluir (nome + seletor de moeda), exibindo mensagens de erro de validação
    - _Requisitos: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7_

  - [x] 8.3 Implementar `WeeklyEntryScreen`
    - Criar `src/ui/WeeklyEntryScreen.tsx` com um campo de saldo por conta para a segunda-feira corrente, pré-carregando valores do snapshot existente; chama `upsertWeeklySnapshot`
    - _Requisitos: 2.1, 2.4, 2.5_

  - [x] 8.4 Implementar `ExchangeRatesScreen`
    - Criar `src/ui/ExchangeRatesScreen.tsx` para editar as Taxas_Atuais de R$ e EUR, com validação `> 0` e mensagem de erro
    - _Requisitos: 5.1, 5.2, 5.4_

  - [x] 8.5 Implementar `HomeScreen`
    - Criar `src/ui/HomeScreen.tsx` exibindo Patrimônio_Total (Kz primário, seletor R$/EUR), Variação_Semanal e Variação_Mensal com indicação visual positiva/negativa e rótulo "Indisponível"
    - _Requisitos: 3.2, 3.3, 4.4, 4.5, 4.6, 4.7_

- [x] 9. Configurar PWA
  - [x] 9.1 Adicionar manifest, service worker e metatags iOS
    - Configurar `vite-plugin-pwa` (manifest `standalone`, cores brancas, ícones 192/512, `apple-touch-icon`, precache do app shell) e metatags iOS em `index.html` (`apple-mobile-web-app-capable`, `viewport-fit=cover`)
    - _Requisitos: 7.1, 7.2, 7.3_

  - [x]* 9.2 Escrever testes unitários para validade do manifest e registro do service worker
    - Verificar campos obrigatórios do manifest e registro do service worker
    - _Requisitos: 7.1, 7.2_

- [x] 10. Checkpoint final — Garantir que todos os testes passem
  - Garanta que todos os testes passem; pergunte ao usuário caso surjam dúvidas.

## Notes

- Tarefas marcadas com `*` são opcionais (testes) e podem ser puladas para um MVP mais rápido.
- Cada tarefa referencia requisitos específicos para rastreabilidade.
- Os checkpoints garantem validação incremental.
- Os testes de propriedade validam as propriedades de correção universais (mínimo de 100 iterações por propriedade, formato: **Feature: patrimony-control-pwa, Property {número}: {texto}**).
- Itens não testáveis automaticamente (operar sem backend 6.3, estética da UI 7.3) são verificados por revisão.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.3", "3.1"] },
    { "id": 3, "tasks": ["2.2", "2.4", "3.2", "3.3"] },
    { "id": 4, "tasks": ["3.4", "3.5", "5.1"] },
    { "id": 5, "tasks": ["5.2", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "8.1", "9.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.4", "8.5", "9.2"] }
  ]
}
```

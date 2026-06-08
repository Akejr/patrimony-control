# Documento de Design

## Visão Geral

O **Patrimony Control PWA** é uma aplicação web progressiva construída com **React + Vite + TypeScript**, otimizada para iPhone, com interface limpa, branca e moderna no estilo de aplicativos financeiros. Toda a persistência ocorre localmente via **Local Storage**, sem qualquer backend ou serviço remoto.

O Kwanza (Kz) é a moeda base. O usuário cadastra contas (nome + moeda) e, a cada segunda-feira, registra os saldos de cada conta. Cada registro semanal (snapshot) é indexado pela data da segunda-feira da semana e armazena tanto os saldos por conta quanto as taxas de câmbio vigentes naquele momento. A tela inicial apresenta o patrimônio total (em Kz como visualização primária, alternável para R$ e EUR) e as variações percentuais semanal e mensal, com indicação visual de positivo/negativo e estado "indisponível" quando o snapshot de comparação não existe.

### Princípios de Design

- **Local-first**: nenhuma chamada de rede para dados; tudo no `localStorage`.
- **Camadas separadas**: domínio puro (cálculos, validações) isolado da UI e da camada de persistência, facilitando testes baseados em propriedades.
- **Snapshots imutáveis**: cada snapshot guarda as taxas de câmbio do momento, permitindo isolar o efeito cambial da variação real do patrimônio.
- **Mobile-first/iPhone**: layout adaptado a telas de iPhone, com áreas de toque amplas e safe-area insets.

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                         UI (React)                        │
│  HomeScreen · AccountsScreen · WeeklyEntryScreen ·        │
│  ExchangeRatesScreen                                      │
└───────────────┬──────────────────────────┬───────────────┘
                │ hooks (useStore)          │
┌───────────────▼──────────────────────────▼───────────────┐
│                     Camada de Domínio                     │
│  patrimony.ts (cálculo total/variação) · validation.ts ·  │
│  dateUtils.ts (normalização para segunda-feira)           │
└───────────────┬───────────────────────────────────────────┘
                │
┌───────────────▼───────────────────────────────────────────┐
│              Camada de Persistência (Repository)           │
│  storage.ts — serialização/deserialização Local Storage    │
└────────────────────────────────────────────────────────────┘
```

### Stack Tecnológica

- **React 18** + **TypeScript** + **Vite**.
- **vite-plugin-pwa** (Workbox) para manifest e service worker.
- **Zustand** (ou Context + reducer) como store leve em memória, sincronizada com `localStorage`.
- **Vitest** + **fast-check** para testes unitários e baseados em propriedades.

### Estrutura de Pastas

```
src/
  domain/
    types.ts          // tipos de domínio
    dateUtils.ts      // normalização de datas (segunda-feira)
    validation.ts     // validações de input
    patrimony.ts      // cálculo de patrimônio e variações
    currency.ts       // conversão entre moedas
  storage/
    storage.ts        // repositório Local Storage (load/save)
    schema.ts         // versão e chaves de armazenamento
  state/
    store.ts          // store global (Zustand)
  ui/
    HomeScreen.tsx
    AccountsScreen.tsx
    WeeklyEntryScreen.tsx
    ExchangeRatesScreen.tsx
    components/        // componentes reutilizáveis
  pwa/
    manifest.webmanifest
    sw registration (via vite-plugin-pwa)
  main.tsx
  App.tsx
```

## Componentes e Interfaces

### Camada de Domínio

#### `types.ts`

```typescript
export type CurrencyCode = 'KZ' | 'BRL' | 'EUR';

export interface Account {
  id: string;            // gerado (uuid); não é campo de domínio editável
  name: string;          // obrigatório, não-vazio
  currency: CurrencyCode;
}

// Taxas em Kwanzas por 1 unidade da moeda. A taxa do Kwanza é sempre 1.
export interface ExchangeRates {
  BRL: number;           // quantos Kz equivalem a 1 R$
  EUR: number;           // quantos Kz equivalem a 1 EUR
}

// Saldo por conta dentro de um snapshot
export type BalancesByAccount = Record<string /* accountId */, number>;

export interface WeeklySnapshot {
  mondayDate: string;        // chave ISO 'YYYY-MM-DD' da segunda-feira
  balances: BalancesByAccount;
  rates: ExchangeRates;      // taxas vigentes no momento da criação
}

export interface AppState {
  accounts: Account[];
  snapshots: WeeklySnapshot[];   // ordenados por mondayDate
  currentRates: ExchangeRates;   // Taxas_Atuais editáveis
}

export type Variation =
  | { available: true; percent: number }
  | { available: false };
```

#### `dateUtils.ts`

```typescript
// Normaliza qualquer data para a segunda-feira (00:00) da mesma semana.
// Retorna string ISO 'YYYY-MM-DD'.
export function toMondayKey(date: Date): string;

// Retorna a chave da segunda-feira N semanas antes de uma chave dada.
export function previousMondayKey(mondayKey: string, weeksBack: number): string;
```

A normalização garante: para qualquer data, `toMondayKey` retorna sempre uma segunda-feira, e `toMondayKey(toMondayKey(d) como Date)` é idempotente. Isso sustenta a indexação consistente dos snapshots (Req. 2.3) e a não-duplicação (Req. 2.4).

#### `validation.ts`

```typescript
export function isValidAccountName(name: string): boolean; // false se vazio/somente espaços
export function isSupportedCurrency(code: string): code is CurrencyCode;
export function isValidRate(rate: number): boolean;        // true somente se rate > 0
```

#### `currency.ts`

```typescript
// Converte um valor de uma moeda para Kwanzas usando as taxas fornecidas.
export function toBase(amount: number, currency: CurrencyCode, rates: ExchangeRates): number;

// Converte um valor em Kwanzas para a moeda de exibição alvo.
export function fromBase(amountKz: number, target: CurrencyCode, rates: ExchangeRates): number;
```

Regra: `toBase(x, 'KZ', r) = x`; `toBase(x, 'BRL', r) = x * r.BRL`; `fromBase(y, 'BRL', r) = y / r.BRL`.

#### `patrimony.ts`

```typescript
// Soma dos saldos convertidos para a Moeda_Base usando as taxas indicadas.
export function totalInBase(
  accounts: Account[],
  balances: BalancesByAccount,
  rates: ExchangeRates
): number;

// Patrimônio total do snapshot mais recente, usando as Taxas_Atuais (visão ao vivo).
export function currentTotal(state: AppState): number;

// Variação percentual entre o snapshot corrente e o de `weeksBack` semanas antes,
// usando as taxas ARMAZENADAS em cada snapshot (isola câmbio).
export function variation(state: AppState, weeksBack: number): Variation;

// Classifica o sinal da variação para indicação visual.
export function variationSign(percent: number): 'positive' | 'negative' | 'neutral';
```

Detalhes:
- `currentTotal` usa `currentRates` aplicadas aos saldos do snapshot mais recente. Se não houver snapshots, retorna `0` (Req. 3.4).
- `variation` calcula o total de cada snapshot com as taxas próprias de cada snapshot (`snapshot.rates`), garantindo que mudanças posteriores nas Taxas_Atuais não afetem variações históricas (Req. 4.3). Fórmula: `((totalCorrente − totalAnterior) / totalAnterior) * 100`. Se o snapshot de comparação não existir, retorna `{ available: false }` (Req. 4.4, 4.5).

### Camada de Persistência

#### `storage.ts`

```typescript
const STORAGE_KEY = 'patrimony-control:v1';

export function loadState(): AppState;   // retorna estado default se vazio
export function saveState(state: AppState): void;
```

- Serializa o `AppState` completo em JSON sob uma única chave do `localStorage` (Req. 6.1).
- `loadState` é chamado na inicialização da aplicação (Req. 6.2); retorna um estado default (sem contas, sem snapshots, taxas iniciais sugeridas) quando não há dados.
- Round-trip garantido: `loadState(saveState(s)) ≡ s` para qualquer estado válido (Req. 6.2).

### Camada de Estado (`store.ts`)

A store expõe ações que atualizam o estado em memória e persistem imediatamente:

```typescript
interface StoreActions {
  addAccount(name: string, currency: CurrencyCode): Result;
  editAccount(id: string, changes: Partial<Pick<Account, 'name' | 'currency'>>): Result;
  deleteAccount(id: string): void;
  upsertWeeklySnapshot(date: Date, balances: BalancesByAccount): void; // cria ou atualiza
  updateRate(currency: 'BRL' | 'EUR', rate: number): Result;
  setDisplayCurrency(currency: CurrencyCode): void; // estado de UI
}

type Result = { ok: true } | { ok: false; error: string };
```

- `addAccount`/`editAccount` validam o nome (Req. 1.4) e a moeda (Req. 1.2) antes de persistir.
- `upsertWeeklySnapshot` normaliza a data para a segunda-feira e, se já existir snapshot para aquela chave, atualiza-o em vez de duplicar (Req. 2.4); captura as `currentRates` no snapshot (Req. 2.2).
- `updateRate` valida `rate > 0` (Req. 5.4) antes de persistir.

### Camada de UI

- **HomeScreen**: exibe o Patrimônio_Total (Kz primário, seletor para R$/EUR), Variação_Semanal e Variação_Mensal com cores/ícones de positivo (verde) e negativo (vermelho), e rótulo "Indisponível" quando aplicável.
- **AccountsScreen**: lista de contas, criar/editar/excluir (nome + moeda).
- **WeeklyEntryScreen**: formulário com um campo de saldo por conta para a segunda-feira corrente; pré-carrega valores se já houver snapshot da semana.
- **ExchangeRatesScreen**: edição das Taxas_Atuais de R$ e EUR.

#### Diretrizes Visuais (iPhone, estilo finanças)

- Fundo branco, tipografia sem serifa, espaçamento generoso, cantos arredondados, sombras sutis.
- Número do patrimônio em destaque grande no topo.
- Respeito a `safe-area-inset` e viewport `viewport-fit=cover`.
- Navegação inferior por abas (Início, Contas, Registro, Taxas).

### PWA

- **Manifest** (`manifest.webmanifest`): `name`, `short_name`, `display: standalone`, `background_color`/`theme_color` brancos, ícones 192/512 e `apple-touch-icon` (Req. 7.1).
- **Service worker** via `vite-plugin-pwa` com estratégia de precache do app shell para carregamento offline (Req. 7.2).
- Metatags iOS: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`.

## Modelos de Dados

Persistência sob a chave `patrimony-control:v1`:

```json
{
  "accounts": [
    { "id": "a1", "name": "Conta BAI", "currency": "KZ" },
    { "id": "a2", "name": "Poupança", "currency": "EUR" }
  ],
  "snapshots": [
    {
      "mondayDate": "2025-06-02",
      "balances": { "a1": 1500000, "a2": 3000 },
      "rates": { "BRL": 225, "EUR": 1320 }
    }
  ],
  "currentRates": { "BRL": 230, "EUR": 1350 }
}
```

## Tratamento de Erros

- **Nome de conta inválido**: `addAccount`/`editAccount` retornam `{ ok: false, error: 'O nome é obrigatório.' }` e a UI exibe a mensagem sem alterar o estado (Req. 1.4).
- **Moeda inválida**: rejeitada na validação; a UI só oferece as três opções, mas a camada de domínio também protege (Req. 1.2).
- **Taxa inválida (≤ 0)**: `updateRate` retorna `{ ok: false, error: 'A taxa deve ser maior que zero.' }` (Req. 5.4).
- **Divisão por zero na variação**: quando o total anterior é zero, a variação é tratada como indisponível para evitar `Infinity`/`NaN`.
- **Local Storage indisponível/corrompido**: `loadState` captura erros de parsing e retorna o estado default, registrando aviso no console.
- **Sem snapshots**: total exibido como zero; variações indisponíveis.

## Estratégia de Testes

Abordagem dupla:
- **Testes unitários (exemplos/edge cases)**: estrutura dos modelos (1.3, 5.1), visualização primária em Kz (3.2), total zero sem snapshot (3.4), variação indisponível (4.4, 4.5), persistência usando `localStorage` (6.1), validade do manifest e registro do service worker (7.1, 7.2).
- **Testes baseados em propriedades (fast-check)**: cálculos, validações e round-trips de persistência, com mínimo de **100 iterações** por propriedade.

Cada teste de propriedade referencia a propriedade do design no formato:
**Feature: patrimony-control-pwa, Property {número}: {texto}**

Itens não testáveis automaticamente (operar sem backend 6.3, estética da UI 7.3) são verificados por revisão.

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas do sistema — essencialmente, uma declaração formal sobre o que o sistema deve fazer. As propriedades servem de ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*

### Property 1: Round-trip de persistência de conta

*Para toda* conta válida (nome não-vazio e moeda suportada), adicioná-la deve resultar em sua presença ao ler as contas do Local_Storage, com nome e moeda preservados.

**Validates: Requirements 1.1**

### Property 2: Somente moedas suportadas são aceitas

*Para qualquer* código de moeda, o cadastro/edição é aceito se e somente se a moeda for uma de Kz, R$ ou EUR.

**Validates: Requirements 1.2**

### Property 3: Nomes em branco são rejeitados

*Para qualquer* string composta inteiramente de espaços (ou vazia), tentar cadastrar uma conta com esse nome deve ser rejeitado e o conjunto de contas deve permanecer inalterado.

**Validates: Requirements 1.4**

### Property 4: Exclusão remove a conta

*Para qualquer* conjunto de contas e qualquer conta nele contida, excluí-la resulta em sua ausência ao ler do Local_Storage.

**Validates: Requirements 1.5**

### Property 5: Edição persiste alterações

*Para qualquer* conta existente e qualquer edição válida de nome e/ou moeda, ler a conta de volta retorna exatamente os valores editados.

**Validates: Requirements 1.6**

### Property 6: A lista contém todas as contas persistidas

*Para qualquer* conjunto de contas válidas persistidas, a lista exibida contém todas elas.

**Validates: Requirements 1.7**

### Property 7: Round-trip de persistência do snapshot semanal

*Para qualquer* snapshot semanal com saldos arbitrários, persisti-lo e lê-lo de volta produz os mesmos saldos associados à mesma data de segunda-feira.

**Validates: Requirements 2.1**

### Property 8: Snapshot captura as taxas vigentes

*Para qualquer* estado com Taxas_Atuais definidas, ao criar um snapshot as taxas armazenadas no snapshot são iguais às Taxas_Atuais no momento da criação.

**Validates: Requirements 2.2**

### Property 9: Chave do snapshot é sempre uma segunda-feira e é idempotente

*Para qualquer* data, a chave gerada para o snapshot corresponde a uma segunda-feira, e normalizar uma chave já normalizada produz a mesma chave.

**Validates: Requirements 2.3**

### Property 10: Não há snapshots duplicados para a mesma semana

*Para qualquer* sequência de criações de snapshot para datas da mesma semana, existe no máximo um snapshot por chave de segunda-feira, contendo os últimos saldos informados.

**Validates: Requirements 2.4**

### Property 11: Patrimônio total é a soma dos saldos convertidos para a base

*Para qualquer* conjunto de contas, saldos e taxas, o patrimônio total em Kwanzas é igual à soma de cada saldo convertido para Kwanzas pela respectiva taxa.

**Validates: Requirements 3.1**

### Property 12: Round-trip de conversão de moeda

*Para qualquer* valor em Kwanzas e qualquer taxa positiva, converter para R$ ou EUR e depois de volta para Kwanzas reproduz o valor original (a menos de erro de ponto flutuante).

**Validates: Requirements 3.3**

### Property 13: Cálculo da variação percentual

*Para quaisquer* dois patrimônios totais com o anterior maior que zero, a variação calculada é igual a `((atual − anterior) / anterior) * 100`, aplicável tanto à variação semanal quanto à mensal (4 semanas antes).

**Validates: Requirements 4.1, 4.2**

### Property 14: Isolamento do efeito cambial

*Para qualquer* par de snapshots, a variação calculada usa as taxas armazenadas em cada snapshot; portanto alterar as Taxas_Atuais após a criação dos snapshots não altera o valor da variação.

**Validates: Requirements 4.3**

### Property 15: Sinal da variação determina a indicação visual

*Para qualquer* valor de variação, a classificação visual é "positiva" se e somente se o valor for maior que zero, e "negativa" se e somente se o valor for menor que zero.

**Validates: Requirements 4.6, 4.7**

### Property 16: Round-trip de persistência de taxa

*Para qualquer* taxa válida (maior que zero) atribuída a R$ ou EUR, persistir e ler de volta retorna o mesmo valor.

**Validates: Requirements 5.2**

### Property 17: Taxas não positivas são rejeitadas

*Para qualquer* valor menor ou igual a zero informado como taxa, o sistema rejeita o valor e as taxas permanecem inalteradas.

**Validates: Requirements 5.4**

### Property 18: Round-trip de persistência do estado da aplicação

*Para qualquer* estado válido da aplicação (contas, snapshots e taxas), salvá-lo no Local_Storage e recarregá-lo produz um estado equivalente ao original.

**Validates: Requirements 6.2**

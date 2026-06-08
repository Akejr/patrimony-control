# Documento de Requisitos

## Introdução

Este documento define os requisitos para o **Patrimony Control PWA**, um aplicativo web progressivo (PWA) instalável, otimizado para iPhone, focado no controlo de patrimônio/valor líquido pessoal. A aplicação possui interface limpa, branca e moderna, no estilo de aplicativos financeiros. Todos os dados são persistidos localmente no dispositivo (Local Storage), sem backend.

O usuário registra contas em diferentes moedas (Kwanza, Real e Euro) e, a cada segunda-feira, insere o valor atual de cada conta. A tela inicial apresenta o patrimônio total e a variação percentual (positiva ou negativa) em relação à semana anterior e ao mês anterior. O Kwanza (Kz) é a moeda base; os saldos podem ser visualizados em Kwanzas (primária), Reais e Euros, conforme taxas de câmbio editáveis pelo usuário. Cada registro semanal armazena as taxas de câmbio vigentes no momento, permitindo isolar o efeito cambial da variação real do patrimônio.

## Glossário

- **Sistema**: O aplicativo Patrimony Control PWA executado no navegador do dispositivo.
- **Conta**: Entidade financeira cadastrada pelo usuário, contendo nome e moeda.
- **Moeda_Suportada**: Uma das três moedas permitidas — Kwanza (Kz), Real (R$) ou Euro (EUR).
- **Moeda_Base**: O Kwanza (Kz), moeda de referência para cálculo do patrimônio total.
- **Registro_Semanal**: Conjunto de valores de saldo de todas as contas informados pelo usuário em uma segunda-feira específica, junto com as taxas de câmbio vigentes naquele momento.
- **Snapshot_Semanal**: Sinônimo de Registro_Semanal.
- **Taxa_De_Câmbio**: Valor que expressa quantos Kwanzas equivalem a uma unidade de outra Moeda_Suportada (ex.: 1 R$ = 225 Kz, 1 EUR = 1320 Kz).
- **Taxa_Atual**: Taxa_De_Câmbio editável pelo usuário, usada para conversão ao vivo dos saldos mais recentes.
- **Patrimônio_Total**: Soma dos saldos de todas as Contas convertidos para a Moeda_Base.
- **Variação_Semanal**: Diferença percentual do Patrimônio_Total em relação ao Registro_Semanal da segunda-feira anterior.
- **Variação_Mensal**: Diferença percentual do Patrimônio_Total em relação ao Registro_Semanal de quatro semanas antes.
- **Local_Storage**: Mecanismo de armazenamento persistente do navegador no dispositivo do usuário.
- **PWA**: Progressive Web App instalável no iPhone.

## Requisitos

### Requisito 1 — Gestão de Contas

**User Story:** Como usuário, quero cadastrar e gerir minhas contas financeiras, para organizar as fontes do meu patrimônio.

#### Critérios de Aceitação

1. WHEN o usuário submete o cadastro de uma nova Conta com nome e Moeda_Suportada, THE Sistema SHALL persistir a Conta no Local_Storage.
2. THE Sistema SHALL restringir a Moeda da Conta a uma das opções: Kwanza (Kz), Real (R$) ou Euro (EUR).
3. THE Sistema SHALL armazenar para cada Conta exatamente dois campos: nome e Moeda_Suportada.
4. IF o usuário submete o cadastro de uma Conta sem nome, THEN THE Sistema SHALL rejeitar o cadastro e exibir mensagem indicando que o nome é obrigatório.
5. WHEN o usuário solicita a exclusão de uma Conta, THE Sistema SHALL remover a Conta do Local_Storage.
6. WHEN o usuário edita o nome ou a Moeda_Suportada de uma Conta existente, THE Sistema SHALL persistir as alterações no Local_Storage.
7. THE Sistema SHALL exibir a lista de todas as Contas cadastradas.

### Requisito 2 — Registro Semanal de Saldos

**User Story:** Como usuário, quero inserir o valor atual de cada conta toda segunda-feira, para acompanhar a evolução do meu patrimônio ao longo do tempo.

#### Critérios de Aceitação

1. WHEN o usuário submete um Registro_Semanal com os saldos das Contas, THE Sistema SHALL persistir os saldos associados à data da segunda-feira correspondente no Local_Storage.
2. WHEN o usuário cria um Registro_Semanal, THE Sistema SHALL armazenar as Taxas_De_Câmbio vigentes no momento junto ao Registro_Semanal.
3. THE Sistema SHALL associar cada Registro_Semanal à data da segunda-feira a que se refere.
4. IF já existe um Registro_Semanal para a segunda-feira corrente, THEN THE Sistema SHALL permitir a atualização dos saldos desse Registro_Semanal existente em vez de criar um duplicado.
5. THE Sistema SHALL permitir a inserção de saldo para cada Conta cadastrada no Registro_Semanal.

### Requisito 3 — Cálculo e Exibição do Patrimônio Total

**User Story:** Como usuário, quero ver meu patrimônio total na tela inicial, para conhecer meu valor líquido atual.

#### Critérios de Aceitação

1. THE Sistema SHALL calcular o Patrimônio_Total como a soma dos saldos mais recentes de todas as Contas convertidos para a Moeda_Base usando as Taxas_Atuais.
2. THE Sistema SHALL exibir o Patrimônio_Total na tela inicial em Kwanzas (Kz) como visualização primária.
3. WHEN o usuário seleciona visualizar em Real (R$) ou Euro (EUR), THE Sistema SHALL exibir o Patrimônio_Total convertido para a moeda selecionada usando as Taxas_Atuais.
4. IF não existe nenhum Registro_Semanal, THEN THE Sistema SHALL exibir o Patrimônio_Total como zero.

### Requisito 4 — Variação Semanal e Mensal

**User Story:** Como usuário, quero ver a variação percentual do meu patrimônio em relação à semana e ao mês anteriores, para avaliar minha evolução financeira.

#### Critérios de Aceitação

1. THE Sistema SHALL calcular a Variação_Semanal como a diferença percentual entre o Patrimônio_Total do Registro_Semanal corrente e o Patrimônio_Total do Registro_Semanal da segunda-feira anterior.
2. THE Sistema SHALL calcular a Variação_Mensal como a diferença percentual entre o Patrimônio_Total do Registro_Semanal corrente e o Patrimônio_Total do Registro_Semanal de quatro semanas antes.
3. WHEN o Sistema calcula uma variação, THE Sistema SHALL utilizar as Taxas_De_Câmbio armazenadas em cada Registro_Semanal para isolar o efeito cambial da variação real do patrimônio.
4. IF o Registro_Semanal da segunda-feira anterior não existe, THEN THE Sistema SHALL exibir a Variação_Semanal como indisponível.
5. IF o Registro_Semanal de quatro semanas antes não existe, THEN THE Sistema SHALL exibir a Variação_Mensal como indisponível.
6. WHILE a Variação_Semanal ou a Variação_Mensal for positiva, THE Sistema SHALL apresentá-la com indicação visual positiva.
7. WHILE a Variação_Semanal ou a Variação_Mensal for negativa, THE Sistema SHALL apresentá-la com indicação visual negativa.

### Requisito 5 — Gestão de Taxas de Câmbio

**User Story:** Como usuário, quero editar as taxas de câmbio entre as moedas, para que as conversões reflitam os valores reais de mercado.

#### Critérios de Aceitação

1. THE Sistema SHALL armazenar uma Taxa_Atual para Real (R$) em Kwanzas e uma Taxa_Atual para Euro (EUR) em Kwanzas.
2. WHEN o usuário edita uma Taxa_Atual, THE Sistema SHALL persistir o novo valor no Local_Storage.
3. THE Sistema SHALL utilizar as Taxas_Atuais para a conversão ao vivo dos saldos mais recentes das Contas.
4. IF o usuário informa uma Taxa_De_Câmbio menor ou igual a zero, THEN THE Sistema SHALL rejeitar o valor e exibir mensagem indicando que a taxa deve ser maior que zero.

### Requisito 6 — Persistência Local

**User Story:** Como usuário, quero que meus dados fiquem salvos no dispositivo, para acessá-los sem conexão e sem servidor.

#### Critérios de Aceitação

1. THE Sistema SHALL persistir Contas, Registros_Semanais e Taxas_Atuais exclusivamente no Local_Storage do dispositivo.
2. WHEN o usuário reabre o Sistema, THE Sistema SHALL carregar os dados previamente persistidos do Local_Storage.
3. THE Sistema SHALL operar sem qualquer backend ou serviço remoto.

### Requisito 7 — PWA e Experiência iPhone

**User Story:** Como usuário de iPhone, quero instalar e usar o app como um aplicativo nativo, para uma experiência rápida e integrada.

#### Critérios de Aceitação

1. THE Sistema SHALL fornecer um manifesto de aplicativo web que permita a instalação como PWA no iPhone.
2. THE Sistema SHALL registrar um service worker que permita o carregamento da interface sem conexão de rede.
3. THE Sistema SHALL apresentar interface limpa, branca e moderna no estilo de aplicativos financeiros, otimizada para dimensões de tela do iPhone.

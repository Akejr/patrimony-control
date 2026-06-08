# Patrimony Control PWA

Aplicativo web progressivo (PWA) para controle de patrimônio pessoal, otimizado para iPhone. Interface limpa estilo app de finanças, com dados persistidos localmente no dispositivo (Local Storage) — sem backend.

**App online:** https://akejr.github.io/patrimony-control/

## Funcionalidades

- Patrimônio total com visualização em Kwanza (Kz, base), Real (R$) e Euro (EUR).
- Cadastro de contas (nome + moeda).
- Registro semanal de saldos (toda segunda-feira), com as taxas de câmbio do momento guardadas em cada registro.
- Variação percentual semanal e mensal, isolando o efeito cambial.
- Taxas de câmbio editáveis.
- Instalável como PWA, com suporte offline.

## Stack

React 18 + TypeScript + Vite · Zustand · Tailwind CSS (tema Material 3) · vite-plugin-pwa · Vitest + fast-check.

## Desenvolvimento

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm test         # testes (inclui property-based)
npm run build    # build de produção
npm run preview  # pré-visualização do build
```

## Deploy

O deploy é automático no GitHub Pages via GitHub Actions a cada push na branch `main` (workflow em `.github/workflows/deploy.yml`). O `base` do Vite é `/patrimony-control/` em produção.

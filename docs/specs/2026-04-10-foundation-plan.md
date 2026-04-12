# OrgBridge — Plano de Implementação
## Sub-projeto 1: Foundation
> Criado em: 10 de Abril de 2026
> Pré-requisito para todos os outros sub-projetos

---

## Objetivo

Estabelecer a base técnica completa do OrgBridge: monorepo configurado, banco de dados modelado, autenticação funcionando e landing page no ar. Ao final desta fase, qualquer desenvolvedor pode clonar o repositório, rodar um comando e ter o ambiente completo funcionando.

---

## Escopo

**Inclui:**
- Estrutura do monorepo (Next.js + API)
- Schema completo do banco de dados (Neon + Drizzle ORM)
- Sistema de autenticação (e-mail/senha + Google OAuth)
- Landing page pública (`orgbridge.net`)
- Deploy inicial (Vercel + Railway/Neon)
- Stripe — setup de produtos e planos
- Super-Admin Panel — estrutura base (autenticação isolada)
- CI/CD básico

**Não inclui (próximos sub-projetos):**
- News Feed, organograma, mensagens
- Integração Claude API
- Dashboard financeiro completo

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript 5.x |
| Estilo | Tailwind CSS 4 + shadcn/ui |
| ORM | Drizzle ORM |
| Banco | Neon (PostgreSQL serverless) |
| Cache / Sessions | Redis (Upstash) |
| Auth | NextAuth.js v5 (Auth.js) |
| Pagamentos | Stripe |
| E-mail | Resend |
| Deploy Frontend | Vercel |
| Deploy Backend | Vercel (API Routes no mesmo projeto) |
| Monitoramento | Sentry |

---

## Estrutura de Pastas

```
orgbridge/
├── apps/
│   ├── web/                  # app.orgbridge.net — produto principal
│   │   ├── app/              # Next.js App Router
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   ├── admin/                # admin.orgbridge.net — super-admin panel
│   │   ├── app/
│   │   ├── components/
│   │   └── package.json
│   └── landing/              # orgbridge.net — landing page
│       ├── app/
│       └── package.json
├── packages/
│   ├── db/                   # Schema Drizzle + client Neon (compartilhado)
│   │   ├── schema/
│   │   ├── migrations/
│   │   └── index.ts
│   ├── auth/                 # Configuração Auth.js (compartilhada)
│   ├── ui/                   # Componentes shadcn/ui compartilhados
│   ├── email/                # Templates Resend + funções de envio
│   └── config/               # Variáveis de ambiente tipadas (t3-env)
├── turbo.json                # Turborepo
├── package.json              # Root workspace
└── .env.example
```

---

## Schema do Banco de Dados

### Tabelas — Fase 1 (Foundation)

#### `users`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
email           text UNIQUE NOT NULL
password_hash   text                        -- null se OAuth
name            text NOT NULL
avatar_url      text
email_verified  boolean DEFAULT false
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

#### `accounts` (OAuth — Auth.js)
```sql
id                  uuid PRIMARY KEY
user_id             uuid REFERENCES users(id) ON DELETE CASCADE
provider            text NOT NULL            -- "google" | "microsoft"
provider_account_id text NOT NULL
access_token        text
refresh_token       text
expires_at          integer
UNIQUE(provider, provider_account_id)
```

#### `sessions` (Auth.js)
```sql
id            uuid PRIMARY KEY
session_token text UNIQUE NOT NULL
user_id       uuid REFERENCES users(id) ON DELETE CASCADE
expires       timestamptz NOT NULL
```

#### `networks`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
name         text NOT NULL
slug         text UNIQUE NOT NULL          -- ex: "techcorp"
logo_url     text
industry     text
country      text
state        text
city         text
description  text
type         text NOT NULL DEFAULT 'vertical'  -- 'vertical' | 'horizontal'
status       text NOT NULL DEFAULT 'active'    -- 'active' | 'suspended' | 'trial'
owner_id     uuid REFERENCES users(id)
created_at   timestamptz DEFAULT now()
updated_at   timestamptz DEFAULT now()
```

#### `network_members`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
network_id   uuid REFERENCES networks(id) ON DELETE CASCADE
user_id      uuid REFERENCES users(id) ON DELETE CASCADE
role         text NOT NULL DEFAULT 'member'  -- 'owner' | 'admin' | 'manager' | 'member'
status       text NOT NULL DEFAULT 'active'  -- 'active' | 'invited' | 'suspended'
invited_at   timestamptz
joined_at    timestamptz
UNIQUE(network_id, user_id)
```

#### `org_nodes`
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
network_id uuid REFERENCES networks(id) ON DELETE CASCADE
parent_id  uuid REFERENCES org_nodes(id)   -- null = raiz
name       text NOT NULL
level      integer NOT NULL DEFAULT 0
color      text
position   integer NOT NULL DEFAULT 0
created_at timestamptz DEFAULT now()
```

#### `invitations`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
network_id   uuid REFERENCES networks(id) ON DELETE CASCADE
email        text NOT NULL
role         text NOT NULL DEFAULT 'member'
org_node_id  uuid REFERENCES org_nodes(id)
token        text UNIQUE NOT NULL
expires_at   timestamptz NOT NULL
accepted_at  timestamptz
created_at   timestamptz DEFAULT now()
```

#### `subscriptions`
```sql
id                      uuid PRIMARY KEY DEFAULT gen_random_uuid()
network_id              uuid REFERENCES networks(id) ON DELETE CASCADE UNIQUE
stripe_customer_id      text UNIQUE
stripe_subscription_id  text UNIQUE
plan                    text NOT NULL DEFAULT 'free'  -- 'free'|'starter'|'business'|'enterprise'
status                  text NOT NULL                  -- Stripe status
current_period_start    timestamptz
current_period_end      timestamptz
cancel_at_period_end    boolean DEFAULT false
created_at              timestamptz DEFAULT now()
updated_at              timestamptz DEFAULT now()
```

#### `admin_users` (Super-Admin — tabela separada)
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
email        text UNIQUE NOT NULL
password_hash text NOT NULL
name         text NOT NULL
role         text NOT NULL DEFAULT 'support'  -- 'owner'|'support'|'developer'|'finance'
two_fa_secret text
two_fa_enabled boolean DEFAULT false
last_login_at  timestamptz
created_at   timestamptz DEFAULT now()
```

---

## Autenticação

### App Principal (`app.orgbridge.net`)
- **Auth.js v5** com dois provedores:
  - Credentials (e-mail + senha com bcrypt, salt rounds = 12)
  - Google OAuth
- Sessão via JWT (stateless) + cookie httpOnly
- Middleware Next.js protege todas as rotas `/app/**`
- Verificação de e-mail obrigatória antes do primeiro acesso

### Super-Admin (`admin.orgbridge.net`)
- Auth **completamente separada** da app principal
- Apenas credentials (sem OAuth)
- 2FA obrigatório (TOTP via `otplib`)
- IP allowlist configurável via variável de ambiente
- Sessão com expiração curta (4h)

---

## Fluxos de Autenticação

### Cadastro (novo usuário)
```
1. POST /api/auth/register
   → valida email + senha
   → bcrypt hash da senha
   → INSERT users
   → gera token de verificação
   → envia e-mail via Resend (template boas-vindas)
   → retorna 201

2. GET /auth/verify?token=xxx
   → valida token
   → UPDATE users SET email_verified = true
   → redireciona para /onboarding
```

### Login
```
1. POST /api/auth/signin (via Auth.js)
   → valida credenciais
   → cria sessão JWT
   → redireciona para /dashboard ou /onboarding
```

### Convite para rede
```
1. Admin insere e-mail → POST /api/networks/:id/invitations
   → INSERT invitations com token UUID
   → envia e-mail com link: /invite?token=xxx

2. Convidado clica no link
   → se não tem conta: fluxo de registro simplificado
   → se já tem conta: login automático
   → INSERT network_members
   → redireciona para o feed da rede
```

---

## Landing Page (`orgbridge.net`)

### Seções
1. **Hero** — headline, subheadline, CTA "Criar minha rede grátis"
2. **Problema** — 5 dores do mercado (comunicação fragmentada, hierarquia invisível, etc.)
3. **Solução** — 5 pilares do OrgBridge com ícones
4. **Como funciona** — 3 passos animados
5. **Features** — grid de funcionalidades principais com screenshots placeholder
6. **IA** — seção dedicada ao diferencial da IA integrada
7. **Planos** — tabela de preços (Free / Starter / Business / Enterprise)
8. **FAQ** — 8 perguntas frequentes
9. **CTA final** — "Comece grátis hoje"
10. **Footer** — links, termos, privacidade

### Stack da Landing
- Next.js 15 estático (export) ou SSG
- Tailwind CSS + Framer Motion para animações
- Fontes: Inter (corpo) + Syne ou Cal Sans (títulos)
- Tema: dark por padrão com toggle

---

## Stripe — Setup Inicial

### Produtos e Preços a criar no Stripe Dashboard
```
Produto: OrgBridge Starter
  Preço mensal:  BRL 79,00  (price_starter_monthly)
  Preço anual:   BRL 790,00 (price_starter_yearly)

Produto: OrgBridge Business
  Preço mensal:  BRL 249,00  (price_business_monthly)
  Preço anual:   BRL 2.490,00 (price_business_yearly)

Produto: OrgBridge Enterprise
  Preço: sob consulta (criado manualmente por cliente)
```

### Webhooks a configurar
```
customer.subscription.created   → INSERT/UPDATE subscriptions
customer.subscription.updated   → UPDATE subscriptions
customer.subscription.deleted   → UPDATE status = 'canceled'
invoice.payment_succeeded        → registrar pagamento
invoice.payment_failed           → alerta + e-mail para cliente
checkout.session.completed       → confirmar upgrade
```

---

## E-mails Transacionais (Resend)

Templates a criar na Fase 1:

| Template | Gatilho | Conteúdo |
|---|---|---|
| `welcome` | Cadastro | Boas-vindas + verificação de e-mail |
| `verify-email` | Cadastro | Link de confirmação |
| `invite-member` | Convite para rede | Link + nome da empresa |
| `password-reset` | "Esqueci senha" | Link de reset |
| `payment-failed` | Webhook Stripe | Aviso de pagamento falhado |

---

## Super-Admin Panel — Estrutura Base

### Rotas (Fase 1 — apenas estrutura)
```
/                     → redirect para /dashboard
/login                → login com 2FA
/dashboard            → visão geral (contadores placeholder)
/networks             → lista de redes (tabela paginada)
/networks/:id         → detalhe de uma rede
/users                → busca de usuários
/settings             → configurações do admin (troca de senha, 2FA)
```

### Componentes Base
- Layout com sidebar fixa + header com breadcrumb
- Tabela paginada com filtros (componente reutilizável)
- Card de métricas
- Badge de status (ativo, trial, suspenso)

---

## Variáveis de Ambiente

```bash
# Banco
DATABASE_URL=           # Neon connection string
DATABASE_URL_UNPOOLED=  # Para migrations

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=
EMAIL_FROM=noreply@orgbridge.net

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Sentry
SENTRY_DSN=

# Admin
ADMIN_ALLOWED_IPS=      # CSV de IPs liberados para o admin
ADMIN_JWT_SECRET=
```

---

## Ordem de Implementação

### Etapa 1 — Scaffolding (Dia 1–2)
- [ ] Inicializar monorepo com Turborepo + pnpm workspaces
- [ ] Criar apps: `web`, `admin`, `landing`
- [ ] Criar packages: `db`, `auth`, `ui`, `email`, `config`
- [ ] Configurar TypeScript path aliases
- [ ] Setup Tailwind + shadcn/ui em `packages/ui`
- [ ] `.env.example` com todas as variáveis
- [ ] `.gitignore`, `prettier`, `eslint`

### Etapa 2 — Banco de Dados (Dia 2–3)
- [ ] Instalar Drizzle ORM + neon-serverless driver
- [ ] Escrever schema completo em `packages/db/schema/`
- [ ] Configurar `drizzle.config.ts`
- [ ] Rodar primeira migration: `drizzle-kit push`
- [ ] Seed de dados de desenvolvimento (empresa + usuário admin teste)

### Etapa 3 — Autenticação do App Principal (Dia 3–5)
- [ ] Instalar e configurar Auth.js v5
- [ ] Provider: Credentials (e-mail + senha)
- [ ] Provider: Google OAuth
- [ ] Middleware de proteção de rotas
- [ ] Páginas: `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`
- [ ] Templates de e-mail: `welcome`, `verify-email`, `password-reset`
- [ ] Testes: login, logout, registro, OAuth flow

### Etapa 4 — Autenticação do Super-Admin (Dia 5–6)
- [ ] Auth separada em `apps/admin`
- [ ] Login com e-mail + senha + TOTP (2FA)
- [ ] Seed do primeiro admin user
- [ ] Layout base do admin (sidebar + header)
- [ ] Página `/networks` com lista paginada de redes
- [ ] Página `/users` com busca

### Etapa 5 — Landing Page (Dia 6–8)
- [ ] Todas as seções listadas acima
- [ ] Responsivo (mobile-first)
- [ ] Animações com Framer Motion
- [ ] Página `/pricing` com tabela de planos
- [ ] Páginas legais: `/privacy`, `/terms`
- [ ] SEO: meta tags, Open Graph, sitemap.xml

### Etapa 6 — Stripe (Dia 8–9)
- [ ] Instalar Stripe SDK
- [ ] Criar produtos e preços no dashboard Stripe
- [ ] Endpoint de checkout: `POST /api/billing/checkout`
- [ ] Endpoint de webhook: `POST /api/billing/webhook`
- [ ] Customer Portal: `POST /api/billing/portal`
- [ ] Sincronizar status de assinatura via webhooks
- [ ] Página de upgrade de plano no app

### Etapa 7 — Deploy e CI/CD (Dia 9–10)
- [ ] Configurar projetos no Vercel (web, admin, landing)
- [ ] Variáveis de ambiente no Vercel
- [ ] GitHub Actions: lint + typecheck + build em PRs
- [ ] Sentry configurado em todos os apps
- [ ] Health check endpoint: `GET /api/health`
- [ ] Domínios configurados no Vercel

---

## Critérios de Conclusão

A Fase 1 está concluída quando:

- [ ] `pnpm dev` sobe os 3 apps sem erro
- [ ] Novo usuário consegue se cadastrar, verificar e-mail e logar
- [ ] Google OAuth funcionando
- [ ] Convite por e-mail funciona de ponta a ponta
- [ ] Landing page acessível em produção com domínio correto
- [ ] Super-Admin consegue logar com 2FA e ver lista de redes
- [ ] Upgrade de plano via Stripe Checkout funcionando
- [ ] Webhook do Stripe atualizando status da assinatura
- [ ] Deploy automático no Vercel a cada push na `main`
- [ ] Sentry capturando erros em produção

---

*Próximo sub-projeto após conclusão: **Sub-projeto 2 — Core Product** (Registro da rede, organograma, News Feed)*

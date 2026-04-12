# OrgBridge — Brainstorming Geral do Produto
> Sessão de brainstorming — Abril 2026
> Baseado no PRD v1.0 + expansões com capacidades modernas de IA

---

## 1. Visão Revisada do Produto

OrgBridge é uma **rede social corporativa privada com IA integrada** — SaaS B2B que permite a qualquer empresa criar seu ambiente interno de comunicação estruturado por hierarquia organizacional real.

### O que mudou desde o PRD v1.0

O mercado de IA evoluiu significativamente. Em Abril de 2026, os modelos disponíveis (Claude Sonnet/Opus 4.x, GPT-4o, Gemini 2.x) suportam:
- **Contextos enormes** (200k+ tokens) — o organograma + histórico completo da empresa cabe no contexto
- **Agentes autônomos** com tool use — IA que *faz* coisas, não apenas *sugere*
- **Multimodalidade** — análise de imagens, documentos, vídeos
- **MCP (Model Context Protocol)** — padrão aberto para IA acessar dados externos
- **Raciocínio estendido** (Extended Thinking) — análises profundas com cadeia de pensamento
- **Prompt Caching** — contexto da empresa cacheado = respostas mais rápidas e baratas
- **Structured Outputs** — IA retorna JSON estruturado, não só texto
- **Voice APIs** — fala para texto e texto para fala de alta qualidade em tempo real

O OrgBridge deve incorporar essas capacidades como vantagem competitiva real, não só como "chat com IA".

---

## 1.1 Premissas de Adoção

Para que o OrgBridge gere valor real dentro de uma empresa, três premissas devem guiar tanto o produto quanto a jornada do cliente:

### Políticas Claras
Toda rede deve ter **diretrizes de uso explícitas (Code of Conduct)** — o que pode e não pode ser publicado, como tratar colegas, regras de confidencialidade e consequências para violações. O OrgBridge fornece:
- Template padrão de Code of Conduct editável pelo Environment Manager
- Aceite obrigatório pelo usuário no primeiro acesso
- Fluxo de denúncia de conteúdo impróprio (report + revisão pelo admin)
- Moderação assistida por IA (detecção de linguagem ofensiva, spam, conteúdo sensível)

### Engajamento da Liderança
A adoção de uma rede corporativa depende diretamente do **exemplo vindo de cima**. O produto deve incentivar ativamente a participação da liderança:
- Painel de engajamento mostrando atividade dos gestores vs. equipes (para o Environment Manager)
- IA que sugere ao líder conteúdos relevantes para postar (com base em contexto da área)
- Alertas automáticos quando uma área fica sem postagem da liderança por N dias
- "Leadership Score" — métrica visível internamente que gamifica o engajamento dos gestores
- Workflows automáticos: IA notifica gestor quando o engajamento da equipe cai

### Conteúdo Relevante
O feed deve ter propósito claro — não ser mais um lugar para scroll infinito. Os casos de uso prioritários são:
- **Reconhecimento de colaboradores** — kudos, conquistas, aniversários, metas batidas (com reações e visibilidade ampla)
- **Compartilhamento de documentos** — políticas, apresentações, manuais integrados ao Company Brain
- **Notícias da empresa** — comunicados oficiais, atualizações de diretoria, resultados de período
- IA classifica e destaca esses três tipos de conteúdo no feed (acima de posts genéricos)
- Templates prontos para cada tipo: post de reconhecimento, comunicado oficial, compartilhamento de doc

---

## 2. Arquitetura Expandida — Três Camadas de Produto

```
┌─────────────────────────────────────────────────────────────┐
│  SUPER-ADMIN PANEL (admin.orgbridge.net)                     │
│  Operadores do OrgBridge: gestão de clientes, financeiro    │
├─────────────────────────────────────────────────────────────┤
│  ORGBRIDGE PRODUCT (app.orgbridge.net)                       │
│  Rede corporativa: feed, organograma, IA, mensagens         │
├─────────────────────────────────────────────────────────────┤
│  LANDING PAGE (orgbridge.net)                                │
│  Marketing, planos, cadastro, blog                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Melhorias de IA — Capacidades Modernas

### 3.1 De Assistente para Agente

O PRD original descreve a IA como um assistente reativo (o usuário pergunta, a IA responde). O modelo atual do mercado vai além: **agentes autônomos** que tomam ações.

**O que muda no OrgBridge:**

| Antes (Assistente Passivo) | Agora (Agente Autônomo) |
|---|---|
| "Sugira uma pauta para a reunião" | IA gera pauta, cria o evento no calendário e envia convites automaticamente |
| "Resuma o feed de hoje" | IA envia resumo proativo por push/e-mail sem precisar ser acionada |
| "Quem sabe sobre X?" | IA conecta as pessoas enviando uma mensagem de apresentação |
| "Rascunhe um comunicado" | IA redige, aguarda aprovação e publica no horário certo |

**Implementação:** Usar o padrão de agentes da Anthropic (tool use + loop de raciocínio). Cada agente tem um conjunto de "ferramentas" (tools): postar, enviar mensagem, criar evento, consultar organograma, buscar no histórico.

### 3.2 OrgBridge Knowledge Base (RAG)

Todo conteúdo da rede (posts, mensagens, documentos, atas de reunião) alimenta um **banco vetorial** (pgvector ou Pinecone) que a IA consulta em tempo real.

**Casos de uso:**
- "O que foi decidido sobre o projeto Alpha?" → IA busca nas atas e posts relacionados
- "Me dê o histórico do cliente Acme" → IA agrega posts, mensagens e documentos
- "Quais são os processos de onboarding?" → IA consulta a base de conhecimento da empresa
- "Resuma tudo que aconteceu no último trimestre no setor comercial" → IA varre o histórico

**Componente: Company Brain**
Cada rede tem seu próprio "cérebro" — um índice vetorial isolado com todo o histórico. O contexto da empresa (organograma, missão, valores, membros) é **cacheado via Prompt Caching** da Anthropic para reduzir custos e latência.

### 3.3 Interface de Voz

APIs de voz em 2026 são maduras e de baixa latência. O OrgBridge pode adicionar:

- **Voice Posts** — gravar um post em áudio; IA transcreve e também gera versão texto
- **Voice Assistant** — falar com a IA ("Ei OrgBridge, agenda uma reunião com a equipe de marketing na sexta")
- **Voice-to-Meeting-Notes** — durante uma reunião, IA transcreve em tempo real e gera ata
- **Leitura de Feed** — IA narra o resumo do dia em áudio (útil para mobilidade)

**Stack:** OpenAI Whisper (transcrição) + ElevenLabs ou OpenAI TTS (síntese de voz) + WebRTC para captura em tempo real.

### 3.4 Multimodalidade

- **Análise de imagens em posts** — IA descreve imagens para acessibilidade, extrai texto de fotos de quadros brancos
- **Leitura de documentos** — upload de PDF/DOCX → IA extrai pontos principais, responde perguntas
- **Análise de prints** — compartilhar print de dashboard/relatório → IA interpreta e comenta
- **Geração de imagens** — IA cria imagens para posts e apresentações (DALL-E/Flux)

### 3.5 OrgBridge como MCP Server

**MCP (Model Context Protocol)** é o padrão aberto da Anthropic para que ferramentas de IA (Claude Desktop, IDEs, outros assistentes) acessem dados externos de forma padronizada.

Implementar OrgBridge como um servidor MCP permite:
- Acessar dados do OrgBridge diretamente do Claude Desktop
- Integração com outros produtos que suportam MCP
- Ecossistema de plugins de terceiros

**Ferramentas MCP expostas:**
```
get_feed(network_id, filters)
post_message(network_id, content, visibility)
get_org_chart(network_id)
search_knowledge_base(network_id, query)
get_members(network_id, filters)
create_event(network_id, participants, datetime)
```

### 3.6 IA Personalizada por Empresa (Company AI Persona)

Cada empresa pode configurar um **assistente com personalidade e nome próprios**:
- Nome: "Aria da Techcorp" em vez de "OrgBridge AI"
- Tom de voz definido: formal, descontraído, motivacional
- Conhecimento base: valores da empresa, processos, FAQs internas
- Foto/avatar personalizado

Isso aumenta o senso de pertencimento e diferencia o produto no mercado enterprise.

### 3.7 AI Workflows Automatizados

Editor visual (no-code) onde o Environment Manager cria automações:

```
SE  novo membro entra na rede
ENTÃO  IA envia mensagem de boas-vindas personalizada
        E  agenda call de 1:1 com o gestor direto
        E  cria checklist de onboarding
```

```
SE  engajamento de uma área cair > 30% em 7 dias
ENTÃO  IA alerta o gestor da área
        E  sugere 3 ações de engajamento
```

**Implementação:** Interface visual de workflow builder (similar ao Zapier/Make) + engine de execução baseada em eventos + agente IA para execução das ações.

### 3.8 Extended Thinking para Análises Profundas

Para análises estratégicas (clima organizacional, tendências de engajamento, recomendações de estrutura), usar o modo **Extended Thinking** do Claude Opus — o modelo "pensa profundamente" antes de responder, gerando análises muito mais ricas.

Aplicações:
- Relatório mensal de clima organizacional
- Análise de eficiência da estrutura hierárquica
- Recomendações de reorganização
- Previsão de churn de colaboradores (queda de engajamento como sinal)

---

## 4. Módulos do Produto (Revisados e Expandidos)

### 4.1 Módulo 1 — Registro da Rede (sem mudanças estruturais)
O fluxo de 3 passos do PRD original é sólido. Melhorias:
- **IA Assistida no Onboarding:** ao descrever a empresa, IA já sugere uma estrutura organizacional inicial
- **Import de Organograma:** upload de CSV/planilha ou integração com LinkedIn para importar estrutura existente
- **Templates de Setor:** indústrias comuns já têm templates de organograma pré-definidos (tech startup, agência, varejo, etc.)

### 4.2 Módulo 2 — News Feed (melhorias)
- **AI Feed Ranker:** algoritmo de relevância baseado em hierarquia + IA (não apenas cronológico)
- **Smart Digest:** IA compila o "morning briefing" personalizado para cada usuário
- **Thread Summarization:** IA resume discussões longas em 3 bullet points
- **Reaction inteligente:** além de "de acordo", reações contextuais (✅ feito, 🔥 urgente, 📌 importante)
- **Post Scheduling:** agendar posts para horário certo (IA sugere melhor horário por área)
- **Draft Mode:** salvar rascunhos com sugestão de completar depois

### 4.3 Módulo 3 — Perfil do Usuário (melhorias)
- **Skills Graph:** IA infere habilidades do usuário com base nas suas contribuições e posts
- **Expertise Score:** pontuação de expertise por área, visível para outros membros
- **AI Bio Generator:** IA gera biografia profissional com base no cargo e histórico
- **Availability Status:** status inteligente (em reunião, focado, disponível) sincronizado com calendário

### 4.4 Módulo 4 — Mensagens (melhorias)
- **AI Reply Suggestions:** IA sugere respostas rápidas baseadas no contexto
- **Smart Priority:** IA classifica mensagens por urgência e relevância
- **Translation in-line:** mensagens traduzidas automaticamente para o idioma do leitor (redes multinacionais)
- **Message Scheduling:** enviar mensagem no horário certo

### 4.5 Módulo 5 — Membros (melhorias)
- **Connection Suggestions:** IA sugere conexões estratégicas ("Você e Maria têm projetos em comum")
- **Expertise Search:** busca semântica por habilidade ("quem aqui sabe de Python?")
- **Team Builder:** IA monta equipe ideal para um projeto com base em skills e disponibilidade

### 4.6 Módulo 6 — Multi-Rede (sem mudanças)

### 4.7 Módulo 7 — Organograma Vivo (NEW)
Feature standalone dentro do produto:
- Visualização interativa em árvore e em mapa de bolhas
- Drill-down por área, exportável como PDF/PNG
- Histórico de mudanças: quem entrou, saiu, foi promovido
- IA analisa o organograma e sugere desequilíbrios (equipe muito grande, muitos níveis, etc.)

### 4.8 Módulo 8 — Company Brain (NEW)
Repositório central de conhecimento da empresa, alimentado automaticamente pela IA:
- Documentos, processos, políticas
- Atas de reuniões geradas automaticamente
- FAQs extraídas das perguntas mais comuns no chat
- Wiki colaborativa com versionamento
- Busca semântica em tudo

### 4.9 Módulo 9 — Projetos e Tarefas (NEW, Fase 2)
Mini gestão de projetos integrada à rede:
- Boards (Kanban) por projeto
- Tarefas atribuídas vinculadas ao organograma
- IA gera e distribui tarefas a partir de discussões no feed
- Progress tracking com relatórios automáticos

---

## 5. Super-Admin Panel (admin.orgbridge.net)

### 5.1 Visão Geral

Painel **exclusivo para a equipe OrgBridge** (operadores da plataforma). Acesso via URL separada, protegido por autenticação forte (2FA obrigatório, IPs permitidos).

**Audiência:** fundadores, time de operações, suporte, financeiro da OrgBridge.

### 5.2 Seções do Super-Admin

#### 5.2.1 Dashboard Operacional
- Total de redes ativas, usuários, posts nas últimas 24h/7d/30d
- Saúde da plataforma: uptime, latência da API, erros
- Crescimento: novas redes cadastradas, novos usuários
- Alertas: redes inativas, contas com pagamento falhado, uso excessivo de IA

#### 5.2.2 Gestão de Empresas (Networks)
Lista completa de todas as redes cadastradas:
- Nome, logo, plano contratado, data de cadastro
- Total de membros, posts, uso de IA (tokens consumidos)
- Status: ativa, trial, suspensa, cancelada
- Ações: ver detalhes, impersonar admin (com log de auditoria), suspender, exportar dados
- Filtros: por plano, por país, por setor, por status

**Tela de Detalhe de uma Empresa:**
- Dados gerais (nome, contato, domínio)
- Histórico de faturamento
- Uso de features (quais módulos estão sendo usados)
- Membros (quantidade, atividade média)
- Notas internas da equipe de suporte
- Timeline de eventos (criação, upgrades, downgrades, suporte)

#### 5.2.3 Gestão de Usuários
- Busca por e-mail em todas as redes
- Ver em quais redes um usuário está
- Resetar senha, bloquear conta
- Logs de acesso e atividade

#### 5.2.4 Suporte
- Fila de tickets (integrar com Intercom/Zendesk ou sistema próprio)
- Modo de impersonation: entrar como Environment Manager de uma empresa para debug
- Log de auditoria: toda impersonation registrada com timestamp, operador e justificativa

#### 5.2.5 Feature Flags
- Ativar/desativar features por empresa ou por plano
- Rollout gradual de novas features
- Empresas beta: lista de early adopters com acesso antecipado

#### 5.2.6 Infraestrutura e Uso
- Consumo de API de IA (tokens por empresa, custo estimado)
- Armazenamento de arquivos por empresa
- Workers e filas de background jobs
- Logs da aplicação filtrados por empresa

### 5.3 Controle de Acesso do Super-Admin
Roles internos:
- **Super Owner** — acesso total, incluindo financeiro e configurações de plano
- **Support Agent** — acesso a empresas e usuários, sem financeiro
- **Developer** — acesso a logs e infraestrutura, sem dados de usuários
- **Finance** — acesso apenas ao dashboard financeiro

---

## 6. Dashboard Financeiro

### 6.1 Integração com Stripe

Toda a gestão de pagamentos via **Stripe**:
- Stripe Checkout para upgrade/downgrade de planos
- Stripe Customer Portal para o cliente gerenciar cartão e assinatura
- Webhooks do Stripe para sincronizar status em tempo real

### 6.2 Métricas de Receita (Revenue Dashboard)

#### Métricas Principais
| Métrica | Descrição |
|---|---|
| **MRR** (Monthly Recurring Revenue) | Receita recorrente mensal total |
| **ARR** (Annual Recurring Revenue) | MRR × 12 |
| **New MRR** | Receita de novos clientes no mês |
| **Expansion MRR** | Receita de upgrades de plano |
| **Churn MRR** | Receita perdida por cancelamentos |
| **Contraction MRR** | Receita perdida por downgrades |
| **Net New MRR** | New + Expansion - Churn - Contraction |

#### Métricas de Cliente
| Métrica | Descrição |
|---|---|
| **Total de Clientes Pagantes** | Ativas com assinatura ativa |
| **Trial Conversion Rate** | % de trials que viraram pagantes |
| **Churn Rate** | % de clientes cancelando por mês |
| **LTV** (Lifetime Value) | Valor médio gerado por cliente |
| **CAC** (Customer Acquisition Cost) | Custo médio para adquirir um cliente |
| **LTV:CAC ratio** | Saúde do negócio (meta > 3:1) |
| **Payback Period** | Meses para recuperar CAC |

### 6.3 Visualizações do Dashboard Financeiro

- **Gráfico MRR ao longo do tempo** — linha com breakdown por plano
- **Waterfall MRR** — New + Expansion - Churn - Contraction = Net New MRR
- **Cohort Analysis** — retenção por coorte de mês de entrada
- **Distribuição por Plano** — pizza/donut de receita por Free/Starter/Business/Enterprise
- **Upcoming Renewals** — lista de clientes com renovação nos próximos 30 dias
- **At-risk Customers** — clientes com sinais de churn (baixo engajamento + plano próximo do vencimento)

### 6.4 Gestão de Planos e Assinaturas

- Ver todas as assinaturas ativas, paradas, em trial
- Upgrade/downgrade manual por conta de suporte
- Aplicar cupons e descontos
- Estender trials
- Configurar planos customizados (Enterprise)
- Histórico de todas as faturas

### 6.5 Alertas Financeiros

- Pagamento falhado → alerta imediato + e-mail automático para o cliente
- Trial expirando em 3 dias → gatilho de campanha de conversão
- Cliente sem acesso por 15 dias → alerta de risco de churn
- MRR caiu > 10% mês a mês → alerta para equipe

---

## 7. Melhorias de Produto não cobertas no PRD original

### 7.1 White-label (Enterprise)
Empresas grandes podem querer o OrgBridge com domínio próprio:
- `rede.empresa.com.br` em vez de `empresa.orgbridge.net`
- Logo e cores customizadas
- E-mails enviados pelo domínio do cliente
- Disponível apenas no plano Enterprise

### 7.2 Modo Offline / PWA
- App Web progressivo com service worker
- Leitura de feed e mensagens offline
- Sincronização quando volta a conexão
- Especialmente útil em mobile com sinal ruim

### 7.3 Analytics para Environment Manager
Dashboard de dados da própria empresa:
- Membros mais engajados e menos engajados
- Áreas com maior e menor atividade
- Posts com maior impacto
- Evolução do clima organizacional ao longo do tempo
- Relatórios exportáveis (PDF, CSV)

### 7.4 Integrações Nativas (Fase 3)
| Ferramenta | Tipo de Integração |
|---|---|
| Google Calendar | Sincronizar eventos/reuniões |
| Microsoft Outlook | Sincronizar calendário e e-mails |
| Google Drive | Anexar e visualizar documentos |
| Notion | Sincronizar pages como Company Brain |
| Slack/Teams | Espelhar posts do OrgBridge (migração) |
| Zapier/Make | Automações sem código |
| Jira/Linear | Vincular tarefas e projetos |

### 7.5 API Pública + Webhooks (Fase 3)
- REST API documentada (OpenAPI 3.0)
- Webhooks para eventos: novo post, novo membro, award enviado
- SDK JavaScript/Python
- Marketplace de integrações

### 7.6 Acessibilidade
- WCAG 2.1 AA compliance
- Alto contraste e modo daltônico
- Navegação por teclado
- Screen reader support
- Tamanhos de fonte ajustáveis

### 7.7 Internacionalização
- Interface em PT-BR, EN, ES no lançamento
- IA de tradução inline para redes multinacionais
- Fusos horários por membro

---

## 8. Stack Tecnológico Revisado

### 8.1 Mudanças em relação ao PRD v1.0

| Camada | PRD v1.0 | Brainstorm v2 | Justificativa |
|---|---|---|---|
| Backend | Node.js + Express ou Next.js | **Next.js 15 (App Router) + tRPC** | Type-safety end-to-end, melhor DX |
| ORM | Não especificado | **Drizzle ORM** | Leve, type-safe, melhor que Prisma para performance |
| Banco | PostgreSQL + Redis | **PostgreSQL + pgvector + Redis** | pgvector elimina Pinecone para MVP |
| IA Principal | Claude API | **Claude Sonnet 4.6 + Prompt Caching** | 90% mais barato com caching de contexto |
| IA Rápida | claude-haiku-4-5 | **claude-haiku-4-5-20251001** | Modelo mais recente |
| IA Profunda | Não especificado | **claude-opus-4-6 com Extended Thinking** | Para análises complexas |
| Voz | Whisper | **Whisper + OpenAI Realtime API** | Voice em tempo real |
| Auth | JWT + OAuth2 | **JWT + OAuth2 + Passkeys (WebAuthn)** | Passwordless para enterprise |
| Pagamentos | Não especificado | **Stripe (Billing + Customer Portal)** | Standard do mercado |
| E-mail | Resend ou SendGrid | **Resend** (mais simples, ótima DX) | |
| Monitoramento | Não especificado | **Sentry + PostHog + Grafana** | Erros + analytics + infra |
| Deploy | Vercel + Railway | **Vercel (frontend) + Railway (backend) + Neon (Postgres)** | Neon = Postgres serverless com branching |

### 8.2 Arquitetura de IA

```
┌─────────────────────────────────────────────────────────┐
│  AI LAYER                                                │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Assistente  │  │   Agentes    │  │  Knowledge   │  │
│  │  Contextual  │  │  Autônomos   │  │    Base      │  │
│  │              │  │              │  │   (RAG)      │  │
│  │ Claude 4.6   │  │ Tool Use +   │  │ pgvector +   │  │
│  │ + Caching    │  │ Loop Claude  │  │ Embeddings   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │    Voz       │  │  Analytics   │                     │
│  │              │  │     IA       │                     │
│  │  Whisper +   │  │  Extended    │                     │
│  │  TTS API     │  │  Thinking    │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Modelo de Dados Expandido

Novas entidades além das do PRD v1.0:

| Entidade | Campos Principais | Propósito |
|---|---|---|
| **Subscription** | network_id, stripe_subscription_id, plan, status, period_end | Assinatura Stripe por rede |
| **Invoice** | network_id, stripe_invoice_id, amount, status, pdf_url | Faturas |
| **AIUsage** | network_id, user_id, model, tokens_in, tokens_out, feature, cost | Controle de uso e custo de IA |
| **KnowledgeChunk** | network_id, source_type, source_id, embedding, content | RAG — chunks indexados |
| **AIConversation** | user_id, network_id, messages[], context_summary | Histórico de conversa com IA |
| **WorkflowRule** | network_id, trigger, conditions, actions, enabled | Automações AI Workflow |
| **WorkflowLog** | rule_id, triggered_at, status, result | Log de execução de workflows |
| **AuditLog** | actor_id, action, target_type, target_id, metadata, ip | Auditoria admin |
| **AdminUser** | email, role, 2fa_enabled, last_login | Usuários do Super-Admin |
| **FeatureFlag** | key, enabled_globally, network_ids[], plan_ids[] | Feature flags |
| **SupportNote** | network_id, admin_id, content, created_at | Notas internas de suporte |
| **VoicePost** | post_id, audio_url, transcript, duration | Posts em áudio |

---

## 10. Roadmap Revisado

### Fase 1 — MVP Core (Meses 1–3) — Sem mudanças estruturais
Manter o escopo do PRD v1.0. Adicionar:
- Stripe Billing desde o início (não deixar para depois)
- pgvector desde o início (infraestrutura de embeddings)
- Super-Admin Panel básico (lista de redes, gestão de usuários)
- Dashboard Financeiro básico (MRR, lista de assinaturas)

### Fase 2 — Engajamento e IA Avançada (Meses 4–6)
Conforme PRD v1.0, adicionar:
- Company Brain (RAG completo)
- AI Agents (agendamento, notificações proativas)
- Voice Posts
- Workflow Builder básico
- Super-Admin completo (feature flags, impersonation, analytics)
- Dashboard Financeiro completo (cohorts, waterfall MRR, alertas)

### Fase 3 — Enterprise e Ecossistema (Meses 7–12)
Conforme PRD v1.0, adicionar:
- White-label
- MCP Server (OrgBridge como servidor MCP)
- API Pública + Webhooks
- Extended Thinking para relatórios estratégicos
- Marketplace de integrações
- Compliance avançado (SOC 2, ISO 27001)

---

## 11. Perguntas em Aberto (Para Próximas Sessões)

1. **Pricing da IA:** O custo de IA será absorvido pelo plano ou cobrado por uso? (tokens consumidos vs. pacote fixo)
2. **Dados de IA e privacidade:** Como comunicar aos clientes que os dados NÃO são usados para treino?
3. **Company Brain — dados legados:** Como importar histórico de e-mails, Slack, WhatsApp para o Company Brain?
4. **Voice — compliance:** Gravações de áudio exigem consentimento explícito (LGPD). Como implementar?
5. **White-label — domínio custom:** Requer certificado TLS por cliente. Como automatizar via Let's Encrypt?
6. **Impersonation no Super-Admin:** Qual o fluxo de aprovação? Requer autorização prévia do cliente?
7. **MCP Server:** Publicar no diretório oficial de MCPs da Anthropic como estratégia de distribuição?
8. **Stripe vs. outros:** Stripe tem taxas altas no Brasil. Considerar Asaas/Iugu/Vindi para clientes BR?

---

*Brainstorming gerado em Abril de 2026 — Claude Code + Claude Sonnet 4.6*

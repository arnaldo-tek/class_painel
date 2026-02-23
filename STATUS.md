# Superclasse — Painel Admin/Professor — Status

Última atualização: 2026-02-22

---

## Funcionalidades Implementadas

### Autenticação & Acesso
- Login com Supabase Auth (admin, professor, colaborador)
- Permissões granulares por role (`AdminPermission`)
- Auto-cadastro de professor via `/cadastro-professor` (wizard 3 etapas com ViaCEP)
- Link "É professor? Cadastre-se aqui" na tela de login

### Dashboard
- Dashboard compartilhado (admin, professor, colaborador)

### Conteúdos
- **Cursos** — CRUD completo (admin, professor, colaborador)
- **Pacotes** — CRUD (admin, colaborador)
- **Editais** — CRUD (admin, colaborador)
- **Notícias** — CRUD (admin, colaborador)
- **Audio Cursos** — CRUD (admin, colaborador)

### Usuários (agrupados no menu lateral)
- **Professores** — Listagem com filtros (status, busca), cadastro via modal expandido (dados pessoais + endereço + banco + ViaCEP), auto-registro no Pagar.me na criação
- **Professores Detalhe** — Tabs: Dados, Cursos, Financeiro (saldo, transferências, registro de recebedor)
- **Alunos** — Listagem e gestão (admin, colaborador)
- **Colaboradores** — CRUD em modal (admin only)

### Vendas
- Listagem de vendas puxando do Pagar.me via edge function `payment-orders`
- Resumo financeiro (receita total, plataforma, professores)
- Vendas por professor com drill-down por curso
- Vendas por categoria com drill-down por curso
- Exportação para Excel
- **Cupons** — CRUD completo

### Categorias
- Categorias — CRUD
- Filtros — CRUD

### Outros Módulos
- **Comunidades** (admin, colaborador)
- **Documentos** (admin, colaborador)
- **Publicidade** (admin, colaborador)
- **Tutoriais** (admin, colaborador)
- **FAQ** (admin, colaborador)
- **Suporte** — Chamados de alunos + chamados de professores
- **Chat** (admin, professor)
- **Cards** (professor)
- **Perfil** — Meu perfil (professor)

---

## Edge Functions (Supabase)

### Já existiam
| Função | Descrição |
|--------|-----------|
| `payment-create-customer` | Cria customer no Pagar.me |
| `payment-checkout-card` | Checkout com cartão + split |
| `payment-checkout-pix` | Checkout com PIX + split |
| `payment-webhook` | Webhook do Pagar.me (atualiza movimentações) |

### Novas (migração Pagar.me)
| Função | Descrição |
|--------|-----------|
| `payment-orders` | Busca pedidos do Pagar.me (usado na tela de vendas) |
| `payment-register-recipient` | Registra professor como recebedor PF/PJ no Pagar.me |
| `payment-recipient-balance` | Consulta saldo do recebedor |
| `payment-recipient-details` | Consulta dados completos do recebedor |
| `payment-transfer` | Solicita transferência (usa proxy VPS para IP fixo) |
| `payment-subscription` | Cria/cancela assinaturas mensais com split |
| `register-professor` | Auto-cadastro público de professor (sem auth) |
| `manage-professor` | Cadastro de professor pelo admin (com auto-registro Pagar.me) |

### Tabela SQL criada
- `transferencias` — Histórico de transferências solicitadas

---

## Pendente / Bloqueado

### Bloqueio: Pagar.me IP Whitelist
- **Problema:** A API do Pagar.me exige IP na whitelist. Os IPs do Supabase Edge Functions não estão liberados.
- **Workaround atual:** `PAGARME_BASE_URL` aponta para o proxy GCP Cloud Run (IP já liberado).
- **Solução definitiva:** Obter acesso ao painel Pagar.me e liberar os IPs do Supabase, ou manter o proxy GCP/VPS.
- **Status:** Aguardando acesso ao painel Pagar.me do cliente.

### VPS Proxy (IP Fixo)
- Necessário para o endpoint `/transfers` caso os IPs do Supabase sejam liberados para os demais endpoints.
- Se mantiver o proxy GCP para tudo, a VPS não é necessária.

### Features "Em Breve" (Coming Soon)
| Feature | Role | Status |
|---------|------|--------|
| Flashcards | Professor | Marcado como "em breve" no menu |
| Mapas Mentais | Professor | Marcado como "em breve" no menu |
| Oportunidades | Professor | Marcado como "em breve" no menu |
| Mentorias | Professor | Marcado como "em breve" no menu |

---

## Variáveis de Ambiente

### Supabase Secrets (já configuradas)
- `PAGARME_API_KEY` — Chave secreta do Pagar.me
- `PAGARME_BASE_URL` — URL do proxy GCP (workaround IP whitelist)
- `TRANSFER_PROXY_URL` — URL da VPS para transferências (vazio por enquanto)

### Vercel (class_painel)
- Apenas variáveis do Supabase (URL + anon key) — sem segredos de pagamento

---

## Arquitetura de Pagamento

```
┌─────────────────────────────────────┐
│  class_painel (React/Vercel)        │
│  supabase.functions.invoke(...)     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Supabase Edge Functions            │
│  (payment-*, register-professor)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  GCP Cloud Run (proxy com IP fixo)  │
│  PAGARME_BASE_URL atual             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  api.pagar.me/core/v5               │
└─────────────────────────────────────┘
```

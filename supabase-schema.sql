-- ==============================================================================
-- AUREUM PRIVATE BANKING - SUPABASE POSTGRESQL SCHEMA & MIGRATIONS
-- ARQUITETURA CENTRALIZADA EM UM ÚNICO FLUXO FINANCEIRO
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABELAS DE REFERÊNCIA (CATEGORIAS, EMPRESAS, CENTROS DE CUSTO)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA', 'AMBOS')),
    cor TEXT DEFAULT '#fbbf24',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.companies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    documento TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cost_centers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    codigo TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. CONTAS BANCÁRIAS E SALDOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    banco TEXT NOT NULL,
    agencia TEXT NOT NULL,
    conta TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('CORRENTE', 'INVESTIMENTO', 'POUPANCA', 'PAYROLL')),
    saldo NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    logo_color TEXT DEFAULT '#fbbf24',
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. CARTÕES DE CRÉDITO
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.credit_cards (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    bandeira TEXT NOT NULL CHECK (bandeira IN ('VISA', 'MASTERCARD', 'AMEX', 'AUREUM_BLACK')),
    final_cartao TEXT NOT NULL,
    limite_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    limite_utilizado NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    fechamento_dia INTEGER NOT NULL CHECK (fechamento_dia BETWEEN 1 AND 31),
    vencimento_dia INTEGER NOT NULL CHECK (vencimento_dia BETWEEN 1 AND 31),
    cor_gradiente TEXT,
    categoria_card TEXT DEFAULT 'AUREUM BLACK',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. CARTEIRA DE CRÉDITO & CONTRATOS (FINANCIAMENTOS, EMPRÉSTIMOS, CARNÊS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.credit_contracts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('FINANCIAMENTO', 'EMPRESTIMO', 'CARNE', 'CONSORCIO')),
    instituicao TEXT NOT NULL,
    valor_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    valor_pago NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    valor_restante NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    parcelas_total INTEGER NOT NULL DEFAULT 1,
    parcelas_pagas INTEGER NOT NULL DEFAULT 0,
    valor_parcela_mensal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    taxa_juros_anual NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    cet_mensal NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    cet_anual NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    proximo_vencimento TEXT,
    categoria TEXT,
    status TEXT NOT NULL DEFAULT 'EM_DIA' CHECK (status IN ('EM_DIA', 'ATRASADO', 'LIQUIDADO')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.credit_contracts ADD COLUMN IF NOT EXISTS cet_mensal NUMERIC(5, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.credit_contracts ADD COLUMN IF NOT EXISTS cet_anual NUMERIC(5, 2) NOT NULL DEFAULT 0.00;

-- ==============================================================================
-- 6. ÚNICO FLUXO FINANCEIRO CENTRAL (TRANSACTIONS)
-- Todos os módulos (Cartões, Custos Fixos, Empréstimos, Bancos) convergem aqui.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
    descricao TEXT NOT NULL,
    valor NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (valor >= 0),
    data TEXT NOT NULL, -- Formato YYYY-MM-DD
    categoria TEXT NOT NULL,
    empresa TEXT DEFAULT 'Geral',
    centro_custo TEXT DEFAULT 'Diretoria',
    forma_pagamento TEXT DEFAULT 'PIX',
    origem_financeira TEXT NOT NULL CHECK (
        origem_financeira IN (
            'CONTA_BANCARIA', 'CARTAO_CREDITO', 'CUSTO_FIXO', 
            'FINANCIAMENTO', 'EMPRESTIMO', 'CARNE', 'CONSORCIO', 
            'IMPOSTO', 'INVESTIMENTO', 'OUTRO'
        )
    ),
    status TEXT NOT NULL CHECK (status IN ('PAGO', 'PENDENTE', 'AGENDADO', 'AGUARDANDO')),
    observacao TEXT,
    
    -- Relacionamentos com Outras Tabelas do Sistema
    cartao_detalhes JSONB,        -- { cartaoId, cartaoNome, parcelaAtual, parcelasTotal, melhorDiaCompra, diaVencimento }
    custo_fixo_detalhes JSONB,    -- { recorrencia, proximoVencimento, ativo }
    financiamento_detalhes JSONB, -- { instituicao, valorTotalContrato, parcelasTotal, parcelaAtual, taxaJurosAnual, contratoId }
    conta_bancaria_id TEXT REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    conta_bancaria_nome TEXT,
    
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. METAS FINANCEIRAS E NOTIFICAÇÕES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.financial_goals (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    valor_alvo NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    valor_atual NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    data_limite TEXT,
    cor_icone TEXT DEFAULT 'text-amber-400',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    data TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    tipo TEXT NOT NULL CHECK (tipo IN ('ALERTA', 'INFO', 'SUCESSO', 'DÍVIDA')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_transactions_data ON public.transactions(data DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_tipo ON public.transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_origem ON public.transactions(origem_financeira);
CREATE INDEX IF NOT EXISTS idx_transactions_categoria ON public.transactions(categoria);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_contracts_user ON public.credit_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON public.bank_accounts(user_id);

-- ==============================================================================
-- 9. VISÕES ANALÍTICAS (VIEWS) BASEADAS NO FLUXO FINANCEIRO CENTRAL
-- ==============================================================================

-- 9.1 Indicadores Consolidados de Saúde e Caixa
CREATE OR REPLACE VIEW public.vw_financial_kpis AS
SELECT
    COALESCE(SUM(CASE WHEN tipo = 'RECEITA' AND status = 'PAGO' THEN valor ELSE 0 END), 0) AS total_receita_paga,
    COALESCE(SUM(CASE WHEN tipo = 'DESPESA' AND status = 'PAGO' THEN valor ELSE 0 END), 0) AS total_despesa_paga,
    COALESCE(SUM(CASE WHEN tipo = 'RECEITA' AND status = 'PAGO' THEN valor ELSE -valor END), 0) AS saldo_liquido_pago,
    COALESCE(SUM(CASE WHEN tipo = 'DESPESA' AND status IN ('PENDENTE', 'AGENDADO') THEN valor ELSE 0 END), 0) AS despesa_pendente_futura,
    COUNT(*) AS total_lancamentos
FROM public.transactions;

-- 9.2 Gastos Consolidados por Categoria a partir do Fluxo Central
CREATE OR REPLACE VIEW public.vw_category_expenses AS
SELECT
    categoria,
    COUNT(*) AS quantidade_transacoes,
    SUM(valor) AS valor_total
FROM public.transactions
WHERE tipo = 'DESPESA'
GROUP BY categoria
ORDER BY valor_total DESC;

-- 9.3 Lançamentos por Cartão de Crédito
CREATE OR REPLACE VIEW public.vw_card_expenses AS
SELECT
    cartao_detalhes->>'cartaoId' AS cartao_id,
    cartao_detalhes->>'cartaoNome' AS cartao_nome,
    COUNT(*) AS total_transacoes,
    SUM(valor) AS valor_total,
    SUM(CASE WHEN status = 'PENDENTE' THEN valor ELSE 0 END) AS valor_fatura_aberta
FROM public.transactions
WHERE origem_financeira = 'CARTAO_CREDITO' AND cartao_detalhes IS NOT NULL
GROUP BY cartao_detalhes->>'cartaoId', cartao_detalhes->>'cartaoNome';

-- 9.4 Próximos Vencimentos
CREATE OR REPLACE VIEW public.vw_upcoming_dues AS
SELECT
    id,
    descricao,
    valor,
    data,
    categoria,
    origem_financeira,
    status
FROM public.transactions
WHERE status IN ('PENDENTE', 'AGENDADO')
ORDER BY data ASC;

-- ==============================================================================
-- 10. FUNÇÕES E TRIGGERS AUTOMÁTICOS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_bank_accounts_updated_at ON public.bank_accounts;
CREATE TRIGGER trg_bank_accounts_updated_at
    BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_credit_cards_updated_at ON public.credit_cards;
CREATE TRIGGER trg_credit_cards_updated_at
    BEFORE UPDATE ON public.credit_cards
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_credit_contracts_updated_at ON public.credit_contracts;
CREATE TRIGGER trg_credit_contracts_updated_at
    BEFORE UPDATE ON public.credit_contracts
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO MULTI-TENANT & DEMO
-- ==============================================================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Transações
DROP POLICY IF EXISTS "transactions_policy_all" ON public.transactions;
CREATE POLICY "transactions_policy_all" ON public.transactions
    FOR ALL USING (auth.role() = 'anon' OR auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.role() = 'anon' OR auth.uid() = user_id OR user_id IS NULL);

-- Contas Bancárias
DROP POLICY IF EXISTS "bank_accounts_policy_all" ON public.bank_accounts;
CREATE POLICY "bank_accounts_policy_all" ON public.bank_accounts
    FOR ALL USING (auth.role() = 'anon' OR auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.role() = 'anon' OR auth.uid() = user_id OR user_id IS NULL);

-- Cartões de Crédito
DROP POLICY IF EXISTS "credit_cards_policy_all" ON public.credit_cards;
CREATE POLICY "credit_cards_policy_all" ON public.credit_cards
    FOR ALL USING (auth.role() = 'anon' OR auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.role() = 'anon' OR auth.uid() = user_id OR user_id IS NULL);

-- Contratos de Crédito
DROP POLICY IF EXISTS "credit_contracts_policy_all" ON public.credit_contracts;
CREATE POLICY "credit_contracts_policy_all" ON public.credit_contracts
    FOR ALL USING (auth.role() = 'anon' OR auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.role() = 'anon' OR auth.uid() = user_id OR user_id IS NULL);

-- Metas
DROP POLICY IF EXISTS "financial_goals_policy_all" ON public.financial_goals;
CREATE POLICY "financial_goals_policy_all" ON public.financial_goals
    FOR ALL USING (auth.role() = 'anon' OR auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.role() = 'anon' OR auth.uid() = user_id OR user_id IS NULL);

-- Notificações
DROP POLICY IF EXISTS "notifications_policy_all" ON public.notifications;
CREATE POLICY "notifications_policy_all" ON public.notifications
    FOR ALL USING (auth.role() = 'anon' OR auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.role() = 'anon' OR auth.uid() = user_id OR user_id IS NULL);
-- Histórico da Central de Inteligência Financeira (IA executada somente sob demanda)
CREATE TABLE IF NOT EXISTS financial_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  analysis TEXT NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE financial_ai_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own financial analyses" ON financial_ai_analyses;
CREATE POLICY "Users manage own financial analyses" ON financial_ai_analyses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS financial_ai_analyses_user_created_idx
  ON financial_ai_analyses(user_id, created_at DESC);

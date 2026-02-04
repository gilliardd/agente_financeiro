-- =====================================================
-- FINBOT - Schema do Banco de Dados
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- TABELA: categories (Categorias de transações)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense', 'investment') NOT NULL,
    icon VARCHAR(50) DEFAULT 'circle',
    color VARCHAR(7) DEFAULT '#6B7280',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_category_name_type (name, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: transactions (Transações - receitas e despesas)
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description VARCHAR(500),
    category_id INT NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    source VARCHAR(50) DEFAULT 'manual',
    telegram_message_id BIGINT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency ENUM('daily', 'weekly', 'monthly', 'yearly'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_transactions_date (date),
    INDEX idx_transactions_type (type),
    INDEX idx_transactions_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: budgets (Orçamentos por categoria)
-- =====================================================
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    alert_threshold DECIMAL(5, 2) DEFAULT 80.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE KEY uk_budget_category_period (category_id, month, year),
    INDEX idx_budgets_period (year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: investments (Investimentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS investments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type ENUM('stocks', 'fixed_income', 'funds', 'crypto', 'real_estate', 'savings', 'other') NOT NULL,
    institution VARCHAR(200),
    ticker VARCHAR(20),
    quantity DECIMAL(18, 8),
    purchase_price DECIMAL(15, 2),
    current_price DECIMAL(15, 2),
    total_invested DECIMAL(15, 2) NOT NULL,
    current_value DECIMAL(15, 2),
    purchase_date DATE NOT NULL,
    maturity_date DATE,
    expected_return DECIMAL(8, 4),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_investments_type (type),
    INDEX idx_investments_date (purchase_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: investment_transactions (Movimentações de investimentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS investment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    investment_id INT NOT NULL,
    type ENUM('buy', 'sell', 'dividend', 'yield', 'withdrawal') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    quantity DECIMAL(18, 8),
    unit_price DECIMAL(15, 2),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE,
    INDEX idx_inv_trans_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: cash_accounts (Contas/Caixas)
-- =====================================================
CREATE TABLE IF NOT EXISTS cash_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('checking', 'savings', 'cash', 'credit_card', 'other') NOT NULL,
    institution VARCHAR(200),
    initial_balance DECIMAL(15, 2) DEFAULT 0,
    current_balance DECIMAL(15, 2) DEFAULT 0,
    credit_limit DECIMAL(15, 2),
    closing_day INT,
    due_day INT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: alerts (Alertas e notificações)
-- =====================================================
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('budget_warning', 'budget_exceeded', 'bill_due', 'goal_reached', 'investment_change') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    reference_id INT,
    reference_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    is_sent_telegram BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: settings (Configurações do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    description VARCHAR(500),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: savings_boxes (Caixinhas / Metas de poupança)
-- =====================================================
CREATE TABLE IF NOT EXISTS savings_boxes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    goal_amount DECIMAL(15, 2) DEFAULT 0,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    icon VARCHAR(50) DEFAULT 'piggy-bank',
    color VARCHAR(7) DEFAULT '#22C55E',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_savings_box_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: savings_box_transactions (Movimentações das caixinhas)
-- =====================================================
CREATE TABLE IF NOT EXISTS savings_box_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    savings_box_id INT NOT NULL,
    type ENUM('deposit', 'withdraw') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description VARCHAR(500),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (savings_box_id) REFERENCES savings_boxes(id) ON DELETE CASCADE,
    INDEX idx_savings_trans_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: bills (Contas a pagar / Lembretes de vencimento)
-- =====================================================
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    amount DECIMAL(15, 2) NOT NULL,
    due_day INT NOT NULL,
    category_id INT,
    is_recurring BOOLEAN DEFAULT TRUE,
    reminder_days_before INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    last_reminder_date DATE,
    last_paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_bills_due_day (due_day),
    INDEX idx_bills_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Categorias de DESPESAS padrão
INSERT IGNORE INTO categories (name, type, icon, color) VALUES
('Alimentacao', 'expense', 'utensils', '#EF4444'),
('Transporte', 'expense', 'car', '#F97316'),
('Moradia', 'expense', 'home', '#8B5CF6'),
('Saude', 'expense', 'heart', '#EC4899'),
('Educacao', 'expense', 'graduation-cap', '#06B6D4'),
('Lazer', 'expense', 'gamepad', '#10B981'),
('Vestuario', 'expense', 'shirt', '#6366F1'),
('Contas', 'expense', 'file-text', '#F59E0B'),
('Assinaturas', 'expense', 'repeat', '#14B8A6'),
('Outros', 'expense', 'more-horizontal', '#6B7280');

-- Categorias de RECEITAS padrão
INSERT IGNORE INTO categories (name, type, icon, color) VALUES
('Salario', 'income', 'briefcase', '#22C55E'),
('Freelance', 'income', 'laptop', '#3B82F6'),
('Investimentos', 'income', 'trending-up', '#8B5CF6'),
('Vendas', 'income', 'shopping-bag', '#F97316'),
('Outros', 'income', 'plus-circle', '#6B7280');

-- Categorias de INVESTIMENTOS padrão
INSERT IGNORE INTO categories (name, type, icon, color) VALUES
('Acoes', 'investment', 'bar-chart-2', '#3B82F6'),
('Renda Fixa', 'investment', 'lock', '#22C55E'),
('Fundos', 'investment', 'pie-chart', '#8B5CF6'),
('Criptomoedas', 'investment', 'bitcoin', '#F97316'),
('Imoveis', 'investment', 'building', '#6366F1'),
('Poupanca', 'investment', 'piggy-bank', '#10B981');

-- Conta padrão
INSERT IGNORE INTO cash_accounts (name, type, initial_balance, current_balance) VALUES
('Carteira', 'cash', 0, 0),
('Conta Principal', 'checking', 0, 0);

-- Configurações padrão
INSERT IGNORE INTO settings (`key`, value, description) VALUES
('telegram_chat_id', '', 'ID do chat do Telegram autorizado'),
('currency', 'BRL', 'Moeda padrao'),
('date_format', 'DD/MM/YYYY', 'Formato de data'),
('alert_budget_threshold', '80', 'Percentual para alerta de orcamento'),
('daily_summary', 'true', 'Enviar resumo diario'),
('weekly_report', 'true', 'Enviar relatorio semanal');

-- =====================================================
-- TABELA: monthly_budgets (Orcamentos mensais com regras)
-- =====================================================
CREATE TABLE IF NOT EXISTS monthly_budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL,
    rule ENUM('50-30-20', '60-20-20', '40-30-30', 'custom') NOT NULL DEFAULT '50-30-20',
    expected_income DECIMAL(15, 2) NOT NULL,
    custom_necessidades INT DEFAULT NULL,
    custom_estilo_vida INT DEFAULT NULL,
    custom_futuro INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_monthly_budget_period (year, month),
    INDEX idx_monthly_budgets_period (year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: monthly_budget_items (Itens dos orcamentos mensais)
-- =====================================================
CREATE TABLE IF NOT EXISTS monthly_budget_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    budget_id INT NOT NULL,
    category ENUM('necessidades', 'estilo_vida', 'futuro') NOT NULL,
    name VARCHAR(200) NOT NULL,
    planned_amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (budget_id) REFERENCES monthly_budgets(id) ON DELETE CASCADE,
    INDEX idx_budget_items_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

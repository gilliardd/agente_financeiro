-- Migration: Adiciona suporte a percentuais customizados em orcamentos
-- Data: 2026-02-04

-- Altera o ENUM para incluir 'custom'
ALTER TABLE monthly_budgets
MODIFY COLUMN rule ENUM('50-30-20', '60-20-20', '40-30-30', 'custom') NOT NULL DEFAULT '50-30-20';

-- Adiciona colunas para percentuais customizados
ALTER TABLE monthly_budgets
ADD COLUMN custom_necessidades INT DEFAULT NULL AFTER expected_income,
ADD COLUMN custom_estilo_vida INT DEFAULT NULL AFTER custom_necessidades,
ADD COLUMN custom_futuro INT DEFAULT NULL AFTER custom_estilo_vida;

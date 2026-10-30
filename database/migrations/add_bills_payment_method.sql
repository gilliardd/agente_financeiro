-- Migration: Adiciona forma de pagamento nas contas (boleto/conta ou cartao de credito)
-- Data: 2026-10-30

ALTER TABLE bills
ADD COLUMN payment_method ENUM('boleto', 'cartao') NOT NULL DEFAULT 'boleto' AFTER category_id;

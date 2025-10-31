-- Migration: Création de la table payment_transactions
-- Module: PaymentModule
-- Description: Historique des paiements (Stripe, PayPal, etc.)
-- Gestion: Transactions, remboursements, webhooks

-- Table: payment_transactions (transactions de paiement)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relation utilisateur (null pour paiement invité)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- ID de commande (référence externe, pas de FK car peut être dans autre module)
    order_id UUID NOT NULL,

    -- Montant
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',

    -- Méthode de paiement
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('card', 'apple_pay', 'google_pay', 'paypal', 'bank')),
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('stripe', 'paypal')),

    -- IDs du provider externe (Stripe ou PayPal)
    provider_transaction_id VARCHAR(255), -- Stripe: payment_intent_id, PayPal: order_id
    provider_customer_id VARCHAR(255),    -- Stripe: customer_id (pour cartes sauvegardées)

    -- Statut
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',        -- En attente
        'processing',     -- En cours
        'requires_action',-- Requiert action (3D Secure)
        'succeeded',      -- Paiement réussi
        'failed',         -- Paiement échoué
        'canceled',       -- Annulé
        'refunded',       -- Remboursé
        'disputed'        -- Litige
    )),

    failure_reason TEXT,           -- Raison de l'échec (message)
    failure_code VARCHAR(50),      -- Code d'erreur (ex: "card_declined")

    -- Métadonnées (JSON)
    -- Ex: { "last4": "4242", "brand": "visa", "exp_month": 12, "exp_year": 2025 }
    metadata JSONB,

    -- Remboursement
    refunded_amount DECIMAL(10,2) DEFAULT 0 CHECK (refunded_amount >= 0),
    is_refunded BOOLEAN DEFAULT false,

    -- Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,  -- Date de complétion (succeeded ou failed)
    refunded_at TIMESTAMP    -- Date du remboursement
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_transaction_id ON payment_transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- Index pour rechercher par provider + external ID (utile pour webhooks)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_combo
ON payment_transactions(provider, provider_transaction_id);

-- Trigger: mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_transactions_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Trigger: auto-set completed_at quand status change à succeeded/failed/canceled
CREATE OR REPLACE FUNCTION set_payment_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le statut passe à succeeded, failed ou canceled ET completed_at est null
    IF NEW.status IN ('succeeded', 'failed', 'canceled') AND NEW.completed_at IS NULL THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_payment_completed_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION set_payment_completed_at();

-- Vue: payment_stats (statistiques paiements)
CREATE OR REPLACE VIEW payment_stats AS
SELECT
    DATE(created_at) AS payment_date,
    status,
    payment_method,
    provider,
    COUNT(*) AS transaction_count,
    SUM(amount) AS total_amount,
    SUM(refunded_amount) AS total_refunded,
    SUM(amount - refunded_amount) AS net_amount,
    AVG(amount) AS avg_amount,
    COUNT(*) FILTER (WHERE is_refunded = true) AS refunded_count
FROM payment_transactions
GROUP BY DATE(created_at), status, payment_method, provider
ORDER BY payment_date DESC, status, payment_method;

-- Vue: payment_transactions_detailed (vue détaillée avec métadonnées extraites)
CREATE OR REPLACE VIEW payment_transactions_detailed AS
SELECT
    pt.id,
    pt.user_id,
    pt.order_id,
    pt.amount,
    pt.currency,
    pt.payment_method,
    pt.provider,
    pt.provider_transaction_id,
    pt.status,
    pt.failure_reason,
    pt.failure_code,

    -- Extraction des métadonnées JSON courantes
    pt.metadata->>'last4' AS card_last4,
    pt.metadata->>'brand' AS card_brand,
    pt.metadata->>'exp_month' AS card_exp_month,
    pt.metadata->>'exp_year' AS card_exp_year,

    pt.refunded_amount,
    pt.is_refunded,

    -- Montant net (après remboursement)
    (pt.amount - pt.refunded_amount) AS net_amount,

    -- Indicateurs booléens
    CASE WHEN pt.status = 'succeeded' THEN true ELSE false END AS is_successful,
    CASE WHEN pt.status = 'failed' THEN true ELSE false END AS is_failed,
    CASE WHEN pt.status IN ('succeeded', 'failed', 'canceled') THEN true ELSE false END AS is_completed,

    pt.created_at,
    pt.updated_at,
    pt.completed_at,
    pt.refunded_at,

    -- Durée de traitement (si complété)
    CASE
        WHEN pt.completed_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (pt.completed_at - pt.created_at))
        ELSE NULL
    END AS processing_duration_seconds

FROM payment_transactions pt;

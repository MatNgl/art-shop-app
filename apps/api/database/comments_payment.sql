-- Commentaires SQL pour les tables de paiement
-- Module: PaymentModule
-- Description: Documentation détaillée des colonnes payment_transactions

-- Table: payment_transactions
COMMENT ON TABLE payment_transactions IS 'Transactions de paiement (Stripe, PayPal, etc.) - Historique complet des paiements avec support des remboursements et webhooks';

COMMENT ON COLUMN payment_transactions.id IS 'Identifiant unique de la transaction (UUID)';
COMMENT ON COLUMN payment_transactions.user_id IS 'ID de l''utilisateur (NULL pour paiement invité) - Référence users(id) avec SET NULL si suppression';
COMMENT ON COLUMN payment_transactions.order_id IS 'ID de la commande associée (UUID) - Pas de FK car peut être dans autre module/service';

COMMENT ON COLUMN payment_transactions.amount IS 'Montant total du paiement en devise (ex: 99.99€) - DOIT être > 0';
COMMENT ON COLUMN payment_transactions.currency IS 'Code devise ISO 4217 (EUR, USD, GBP, etc.) - Par défaut EUR';

COMMENT ON COLUMN payment_transactions.payment_method IS 'Méthode de paiement utilisée: card (carte bancaire), apple_pay, google_pay, paypal, bank (virement)';
COMMENT ON COLUMN payment_transactions.provider IS 'Fournisseur de paiement: stripe ou paypal';

COMMENT ON COLUMN payment_transactions.provider_transaction_id IS 'ID de transaction externe du provider - Stripe: payment_intent_id (pi_xxx), PayPal: order_id';
COMMENT ON COLUMN payment_transactions.provider_customer_id IS 'ID client externe du provider - Stripe: customer_id (cus_xxx) pour cartes sauvegardées';

COMMENT ON COLUMN payment_transactions.status IS 'Statut de la transaction: pending (en attente), processing (en cours), requires_action (3D Secure requis), succeeded (réussi), failed (échoué), canceled (annulé), refunded (remboursé), disputed (litige/chargeback)';
COMMENT ON COLUMN payment_transactions.failure_reason IS 'Message d''erreur en cas d''échec (ex: "Your card was declined")';
COMMENT ON COLUMN payment_transactions.failure_code IS 'Code d''erreur technique (ex: card_declined, insufficient_funds, expired_card)';

COMMENT ON COLUMN payment_transactions.metadata IS 'Métadonnées JSON - Ex: {"last4":"4242","brand":"visa","exp_month":12,"exp_year":2025} pour cartes, ou données PayPal';

COMMENT ON COLUMN payment_transactions.refunded_amount IS 'Montant remboursé cumulé (0 si aucun remboursement) - DOIT être >= 0 et <= amount';
COMMENT ON COLUMN payment_transactions.is_refunded IS 'Indicateur booléen: true si remboursement effectué (total ou partiel)';

COMMENT ON COLUMN payment_transactions.created_at IS 'Date de création de la transaction (instant où le PaymentIntent est créé)';
COMMENT ON COLUMN payment_transactions.updated_at IS 'Date de dernière mise à jour (auto-incrémentée par trigger) - Utilisée pour tracer les changements de statut';
COMMENT ON COLUMN payment_transactions.completed_at IS 'Date de complétion (auto-remplie par trigger quand status passe à succeeded, failed ou canceled)';
COMMENT ON COLUMN payment_transactions.refunded_at IS 'Date du premier remboursement (NULL si jamais remboursé)';

-- Vue: payment_stats
COMMENT ON VIEW payment_stats IS 'Statistiques de paiement agrégées par jour/statut/méthode/provider - Utilisée pour tableaux de bord admin et rapports financiers';

-- Vue: payment_transactions_detailed
COMMENT ON VIEW payment_transactions_detailed IS 'Vue détaillée des transactions avec métadonnées extraites (last4, brand, exp) et champs calculés (net_amount, is_successful, processing_duration_seconds) - Utilisée pour affichage admin et exports';

-- Index
COMMENT ON INDEX idx_payment_transactions_user_id IS 'Index sur user_id pour recherches rapides des paiements d''un utilisateur';
COMMENT ON INDEX idx_payment_transactions_order_id IS 'Index sur order_id pour retrouver rapidement les paiements d''une commande';
COMMENT ON INDEX idx_payment_transactions_provider_transaction_id IS 'Index sur provider_transaction_id pour recherches rapides par ID externe (Stripe pi_xxx, PayPal order_id)';
COMMENT ON INDEX idx_payment_transactions_status IS 'Index sur status pour filtres rapides (ex: tous les succeeded, tous les pending)';
COMMENT ON INDEX idx_payment_transactions_created_at IS 'Index DESC sur created_at pour tri chronologique inverse (paiements récents en premier)';
COMMENT ON INDEX idx_payment_transactions_provider_combo IS 'Index composite (provider, provider_transaction_id) - Critique pour webhooks Stripe/PayPal qui cherchent par (stripe, pi_xxx)';

-- Triggers
COMMENT ON FUNCTION update_payment_transactions_updated_at() IS 'Fonction trigger: met à jour automatiquement updated_at à CURRENT_TIMESTAMP lors de chaque UPDATE';
COMMENT ON TRIGGER trigger_payment_transactions_updated_at ON payment_transactions IS 'Trigger BEFORE UPDATE: appelle update_payment_transactions_updated_at() pour auto-incrémenter updated_at';

COMMENT ON FUNCTION set_payment_completed_at() IS 'Fonction trigger: auto-remplit completed_at quand status change vers un état terminal (succeeded, failed, canceled)';
COMMENT ON TRIGGER trigger_set_payment_completed_at ON payment_transactions IS 'Trigger BEFORE UPDATE: appelle set_payment_completed_at() uniquement si status a changé (optimisation avec WHEN clause)';

-- Documentation métier
COMMENT ON CONSTRAINT payment_transactions_amount_check ON payment_transactions IS 'Contrainte: montant doit être strictement positif (> 0)';
COMMENT ON CONSTRAINT payment_transactions_payment_method_check ON payment_transactions IS 'Contrainte: payment_method doit être card, apple_pay, google_pay, paypal ou bank';
COMMENT ON CONSTRAINT payment_transactions_provider_check ON payment_transactions IS 'Contrainte: provider doit être stripe ou paypal';
COMMENT ON CONSTRAINT payment_transactions_status_check ON payment_transactions IS 'Contrainte: status doit être pending, processing, requires_action, succeeded, failed, canceled, refunded ou disputed';
COMMENT ON CONSTRAINT payment_transactions_refunded_amount_check ON payment_transactions IS 'Contrainte: refunded_amount doit être >= 0 (pas de remboursement négatif)';

-- Notes d'utilisation
-- 1. Workflow typique:
--    a) Frontend appelle POST /payment/create-intent → status = pending, provider_transaction_id rempli
--    b) Utilisateur confirme paiement (Stripe Elements) → webhook payment_intent.succeeded → status = succeeded, completed_at auto-rempli
--    c) Si 3D Secure requis → status = requires_action → utilisateur authentifie → succeeded
--    d) Si échec → status = failed, failure_reason/failure_code remplis, completed_at auto-rempli
--
-- 2. Remboursements:
--    a) Admin appelle POST /payment/:id/refund avec amount
--    b) Stripe traite le remboursement → refunded_amount incrémenté, is_refunded = true
--    c) Si remboursement total → status peut rester succeeded OU passer à refunded selon logique métier
--    d) refunded_at rempli à la date du premier remboursement
--
-- 3. Webhooks:
--    - POST /webhooks/stripe reçoit events Stripe (payment_intent.succeeded, charge.refunded, etc.)
--    - Signature vérifiée via STRIPE_WEBHOOK_SECRET (sécurité critique)
--    - Recherche transaction via idx_payment_transactions_provider_combo (provider='stripe', provider_transaction_id='pi_xxx')
--    - Met à jour status, metadata, completed_at selon event type
--
-- 4. Métadonnées (metadata JSONB):
--    - Stripe card: {last4, brand, exp_month, exp_year, funding, country}
--    - Apple Pay: {wallet: 'apple_pay', last4, brand}
--    - PayPal: {payer_email, payer_id, order_id}
--    - Recherche JSON: WHERE metadata->>'brand' = 'visa'
--
-- 5. Vue payment_transactions_detailed:
--    - card_last4, card_brand extraits de metadata->'last4' et metadata->'brand'
--    - net_amount = amount - refunded_amount
--    - is_successful, is_failed, is_completed (booléens calculés)
--    - processing_duration_seconds = durée entre created_at et completed_at
--
-- 6. Vue payment_stats:
--    - Agrégation par DATE(created_at), status, payment_method, provider
--    - transaction_count, total_amount, total_refunded, net_amount, avg_amount
--    - refunded_count = nombre de transactions avec is_refunded = true
--    - Utilisée pour dashboards admin (ex: "Revenus du jour", "Taux de succès par provider")

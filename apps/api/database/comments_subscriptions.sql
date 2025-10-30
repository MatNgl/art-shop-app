-- Comments pour les tables de subscriptions
-- À exécuter après les migrations

-- ======================
-- Table: subscription_plans
-- ======================

COMMENT ON TABLE subscription_plans IS 'Plans d''abonnement disponibles (boxes mensuelles)';

COMMENT ON COLUMN subscription_plans.id IS 'Identifiant unique du plan (UUID)';
COMMENT ON COLUMN subscription_plans.slug IS 'Slug unique en kebab-case pour URLs';
COMMENT ON COLUMN subscription_plans.name IS 'Nom commercial du plan';
COMMENT ON COLUMN subscription_plans.description IS 'Description détaillée du plan';
COMMENT ON COLUMN subscription_plans.monthly_price IS 'Prix mensuel en euros';
COMMENT ON COLUMN subscription_plans.annual_price IS 'Prix annuel en euros';
COMMENT ON COLUMN subscription_plans.months_offered_on_annual IS 'Nombre de mois offerts sur abonnement annuel';
COMMENT ON COLUMN subscription_plans.perks_short IS 'Liste courte des avantages (3-6 points pour affichage carte)';
COMMENT ON COLUMN subscription_plans.perks_full IS 'Liste complète des avantages (affichage détails)';
COMMENT ON COLUMN subscription_plans.loyalty_multiplier IS 'Multiplicateur de points fidélité (1.1, 1.2 ou 1.5)';
COMMENT ON COLUMN subscription_plans.monthly_points_cap IS 'Plafond de points gagnables par mois (0 = illimité)';
COMMENT ON COLUMN subscription_plans.visibility IS 'Visibilité du plan (public ou admin uniquement)';
COMMENT ON COLUMN subscription_plans.is_active IS 'Plan actif et vendable';
COMMENT ON COLUMN subscription_plans.deprecated IS 'Plan déprécié, plus vendable mais conservé pour historique';
COMMENT ON COLUMN subscription_plans.display_order IS 'Ordre d''affichage dans l''interface (ASC)';
COMMENT ON COLUMN subscription_plans.created_at IS 'Date de création du plan';
COMMENT ON COLUMN subscription_plans.updated_at IS 'Date de dernière modification';

-- ======================
-- Table: user_subscriptions
-- ======================

COMMENT ON TABLE user_subscriptions IS 'Abonnements actifs et historique des utilisateurs';

COMMENT ON COLUMN user_subscriptions.id IS 'Identifiant unique de l''abonnement (UUID)';
COMMENT ON COLUMN user_subscriptions.user_id IS 'Référence vers l''utilisateur abonné';
COMMENT ON COLUMN user_subscriptions.plan_id IS 'Référence vers le plan d''abonnement souscrit';
COMMENT ON COLUMN user_subscriptions.term IS 'Durée de l''abonnement (monthly ou annual)';
COMMENT ON COLUMN user_subscriptions.status IS 'Statut de l''abonnement (active, canceled, expired)';
COMMENT ON COLUMN user_subscriptions.started_at IS 'Date de début de l''abonnement initial';
COMMENT ON COLUMN user_subscriptions.current_period_start IS 'Date de début de la période en cours';
COMMENT ON COLUMN user_subscriptions.current_period_end IS 'Date de fin de la période en cours';
COMMENT ON COLUMN user_subscriptions.auto_renew IS 'Renouvellement automatique activé';
COMMENT ON COLUMN user_subscriptions.applied_multiplier IS 'Multiplicateur de points appliqué lors de la souscription';
COMMENT ON COLUMN user_subscriptions.canceled_at IS 'Date d''annulation de l''abonnement (null si actif)';
COMMENT ON COLUMN user_subscriptions.created_at IS 'Date de création de l''enregistrement';
COMMENT ON COLUMN user_subscriptions.updated_at IS 'Date de dernière modification';

-- Fix: Ajouter 'variant' à l'enum scope de promotions
-- Cette migration met à jour la contrainte CHECK pour inclure le nouveau scope 'variant'

-- Drop et recréer la contrainte avec 'variant' inclus
ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_scope_check CASCADE;

ALTER TABLE promotions ADD CONSTRAINT promotions_scope_check
CHECK (scope::text = ANY (ARRAY[
  'product'::character varying,
  'category'::character varying,
  'subcategory'::character varying,
  'site-wide'::character varying,
  'format'::character varying,
  'variant'::character varying,
  'cart'::character varying,
  'shipping'::character varying,
  'user-segment'::character varying,
  'buy-x-get-y'::character varying,
  'subscription'::character varying
]::text[]));

-- Vérifier que la contrainte a été mise à jour
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'promotions'::regclass AND conname = 'promotions_scope_check';

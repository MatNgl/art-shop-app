// FILE: src/app/shared/models/badge-theme.model.ts
export interface BadgeTheme {
  /** Identifiant stable (sert aussi de clé de stockage) */
  id: string;
  /** Libellé lisible (utile pour l’admin) */
  name: string;
  /** Classe CSS appliquant le dégradé, ex: 'avatar-grad-1' */
  className: string;
  /** Couleur primaire associée (peut servir pour icônes / accents) */
  primary: string;
}

export type AdminNotificationType =
  | 'out_of_stock'          // Articles en rupture
  | 'low_stock'             // Stock < 5
  | 'new_order'             // Nouvelle commande payée
  | 'new_subscription'      // Nouvel abonnement payé
  | 'pending_orders'        // Commandes en attente
  | 'box_to_prepare'        // Box mensuelles à préparer
  | 'payment_failed'        // Échec paiement abonnement
  | 'new_user';             // Nouveau compte créé

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  icon: string;
  color: string; // Tailwind color class

  // Données contextuelles
  relatedEntityId?: number | string;
  relatedEntityType?: 'product' | 'order' | 'subscription' | 'user' | 'box';
  actionUrl?: string; // URL de redirection

  // Métadonnées
  metadata?: {
    productName?: string;
    stockQuantity?: number;
    orderTotal?: number;
    orderItemCount?: number;
    userName?: string;
    boxMonth?: string;
    boxCount?: number;
  };

  createdAt: string;
  isRead: boolean;
  dismissedAt?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  bySeverity: {
    critical: number;
    warning: number;
    info: number;
  };
  byType: Record<AdminNotificationType, number>;
}

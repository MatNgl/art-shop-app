export interface AlertSettings {
  // Activation/désactivation par type
  enabledTypes: {
    out_of_stock: boolean;
    low_stock: boolean;
    new_order: boolean;
    new_subscription: boolean;
    pending_orders: boolean;
    box_to_prepare: boolean;
    payment_failed: boolean;
    new_user: boolean;
  };

  // Seuils configurables
  thresholds: {
    stockMinimum: number;        // Défaut: 5
    daysWithoutSale: number;     // Défaut: 30
    hoursOrderPending: number;   // Défaut: 48
  };

  // Options supplémentaires
  soundEnabled: boolean;         // Son pour alertes critiques
  emailNotifications: boolean;   // Envoi d'emails (futur)
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  enabledTypes: {
    out_of_stock: true,
    low_stock: true,
    new_order: true,
    new_subscription: true,
    pending_orders: true,
    box_to_prepare: true,
    payment_failed: true,
    new_user: true,
  },
  thresholds: {
    stockMinimum: 5,
    daysWithoutSale: 30,
    hoursOrderPending: 48,
  },
  soundEnabled: false,
  emailNotifications: false,
};

export type FidelityRewardType = 'shipping' | 'amount' | 'percent' | 'gift';

export interface FidelityReward {
  id: number;
  type: FidelityRewardType;
  pointsRequired: number;
  value: number; // Montant fixe (€) ou pourcentage (%)
  percentCap?: number; // Plafond en € pour type = 'percent'
  giftProductId?: number; // ID produit offert pour type = 'gift'
  label: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FidelitySettings {
  enabled: boolean;
  ratePerEuro: number; // Ex: 10 pts par €
  oneRewardPerOrder: boolean; // Toujours true dans le MVP
  multiplier?: number; // Pour abonnements futurs (non utilisé dans MVP)
}

export type FidelityLedgerEntryType = 'earn' | 'use' | 'adjust' | 'revoke';

export interface FidelityLedgerEntry {
  id: string;
  userId: number;
  orderId?: number;
  type: FidelityLedgerEntryType;
  points: number; // Positif pour earn/adjust positif, négatif pour use/revoke/adjust négatif
  createdAt: string;
  note?: string;
}

export interface FidelityAccount {
  userId: number;
  points: number;
  ledger: FidelityLedgerEntry[];
}

// Interface pour les ports futures (notifications)
export interface FidelityNotifierPort {
  notifyPointsEarned(userId: number, points: number, orderId: number): Promise<void>;
  notifyRewardUsed(userId: number, rewardId: number): Promise<void>;
}

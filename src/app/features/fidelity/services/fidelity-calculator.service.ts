import { Injectable } from '@angular/core';
import { FidelityReward } from '../models/fidelity.models';

export interface AppliedFidelityDiscount {
  amount?: number; // Montant fixe en €
  percent?: number; // Pourcentage de réduction
  cap?: number; // Plafond pour les réductions en %
  freeShipping?: boolean;
  giftProductId?: number;
}

@Injectable({ providedIn: 'root' })
export class FidelityCalculatorService {
  /**
   * Calcule le nombre de points pour un montant TTC après promotions, hors livraison.
   * Arrondi au nombre entier le plus proche.
   */
  pointsFor(amountTtcAfterDiscounts: number, ratePerEuro: number): number {
    if (amountTtcAfterDiscounts <= 0 || ratePerEuro <= 0) return 0;
    return Math.round(amountTtcAfterDiscounts * ratePerEuro);
  }

  /**
   * Applique une récompense fidélité à un panier.
   * Retourne l'objet discount à appliquer ou null si la récompense n'est pas applicable.
   */
  applyReward(
    reward: FidelityReward,
    cartSubtotalTtc: number
  ): AppliedFidelityDiscount | null {
    if (!reward.isActive) return null;
    if (cartSubtotalTtc <= 0) return null;

    switch (reward.type) {
      case 'shipping':
        return { freeShipping: true };

      case 'amount': {
        // Réduction fixe en €
        const discountAmount = Math.min(reward.value, cartSubtotalTtc);
        return { amount: discountAmount };
      }

      case 'percent': {
        // Réduction en % avec plafond optionnel
        const percentValue = reward.value;
        const rawDiscount = (cartSubtotalTtc * percentValue) / 100;
        const cappedDiscount = reward.percentCap
          ? Math.min(rawDiscount, reward.percentCap)
          : rawDiscount;
        const finalDiscount = Math.min(cappedDiscount, cartSubtotalTtc);

        return {
          percent: percentValue,
          cap: reward.percentCap,
          amount: +finalDiscount.toFixed(2),
        };
      }

      case 'gift': {
        // Produit offert
        if (!reward.giftProductId) return null;
        return { giftProductId: reward.giftProductId };
      }

      default:
        return null;
    }
  }

  /**
   * Calcule le montant final du panier après application d'une récompense fidélité.
   */
  calculateFinalAmount(
    cartSubtotalTtc: number,
    appliedDiscount: AppliedFidelityDiscount | null
  ): number {
    if (!appliedDiscount || !appliedDiscount.amount) return cartSubtotalTtc;
    const result = cartSubtotalTtc - appliedDiscount.amount;
    return Math.max(0, +result.toFixed(2));
  }

  /**
   * Trouve la prochaine récompense atteignable en fonction du solde actuel.
   */
  findNextReward(
    currentPoints: number,
    rewards: FidelityReward[]
  ): FidelityReward | null {
    const activeRewards = rewards
      .filter((r) => r.isActive && r.pointsRequired > currentPoints)
      .sort((a, b) => a.pointsRequired - b.pointsRequired);

    return activeRewards[0] ?? null;
  }

  /**
   * Trouve toutes les récompenses déjà atteintes (seuil <= points actuels).
   */
  findAvailableRewards(
    currentPoints: number,
    rewards: FidelityReward[]
  ): FidelityReward[] {
    return rewards
      .filter((r) => r.isActive && r.pointsRequired <= currentPoints)
      .sort((a, b) => b.pointsRequired - a.pointsRequired);
  }
}

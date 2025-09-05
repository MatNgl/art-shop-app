import { Injectable, inject } from '@angular/core';
import { CartStore } from '../../features/cart/services/cart-store';

export type DiscountType = 'percent' | 'fixed' | 'shipping_free';

export interface DiscountRule {
    code: string;              // ex: WELCOME10
    type: DiscountType;        // percent | fixed | shipping_free
    value?: number;            // % ou montant € (si fixed)
    minSubtotal?: number;      // sous-total minimum pour être éligible
    label: string;             // affichage humain
}

@Injectable({ providedIn: 'root' })
export class DiscountService {
    private cart = inject(CartStore);

    // Règles de démo (ajoute les tiennes ici)
    private rules: DiscountRule[] = [
        { code: 'WELCOME10', type: 'percent', value: 10, label: '-10% sur les articles' },
        { code: 'SAVE5', type: 'fixed', value: 5, label: '-5 € sur la commande', minSubtotal: 25 },
        { code: 'FREESHIP', type: 'shipping_free', label: 'Livraison offerte' },
    ];

    find(code: string): DiscountRule | undefined {
        const c = code.trim().toUpperCase();
        return this.rules.find(r => r.code === c);
    }

    /**
     * Calcule le montant de la remise (en €) selon la règle
     * @returns { amount: number, reason?: string }
     */
    computeAmount(rule: DiscountRule): { amount: number; reason?: string } {
        const subtotal = this.cart.subtotal();
        if (rule.minSubtotal && subtotal < rule.minSubtotal) {
            return { amount: 0, reason: `Minimum ${rule.minSubtotal.toFixed(2)} € d’achats.` };
        }

        if (rule.type === 'percent') {
            const pct = (rule.value ?? 0) / 100;
            return { amount: +(subtotal * pct).toFixed(2) };
        }

        if (rule.type === 'fixed') {
            return { amount: Math.min(rule.value ?? 0, subtotal) };
        }

        // shipping_free → la remise € se gère dans le composant (on met 0 ici)
        return { amount: 0 };
    }
}

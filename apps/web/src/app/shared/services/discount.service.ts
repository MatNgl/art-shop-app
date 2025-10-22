import { Injectable, inject } from '@angular/core';
import { CartStore } from '../../features/cart/services/cart-store';
import { CartPromotionEngine } from '../../features/promotions/services/cart-promotion-engine.service';
import { CartPromotionResult } from '../../features/promotions/models/promotion.model';

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
    private promotionEngine = inject(CartPromotionEngine);

    /**
     * Calcule toutes les promotions applicables au panier
     */
    async calculateCartPromotions(promoCode?: string): Promise<CartPromotionResult> {
        const items = this.cart.items();
        const subtotal = this.cart.subtotal();

        return await this.promotionEngine.calculateCartPromotions(items, subtotal, promoCode);
    }

    /**
     * Méthode legacy pour compatibilité avec l'ancien code
     * @deprecated Utiliser calculateCartPromotions() à la place
     */
    async find(code: string): Promise<DiscountRule | undefined> {
        const result = await this.calculateCartPromotions(code);

        const codePromo = result.appliedPromotions.find(p => p.promotion.code === code);
        if (!codePromo) {
            return undefined;
        }

        return {
            code: codePromo.promotion.code || '',
            type: codePromo.promotion.discountType === 'percentage' ? 'percent' : codePromo.promotion.discountType === 'free_shipping' ? 'shipping_free' : 'fixed',
            value: codePromo.promotion.discountValue,
            minSubtotal: codePromo.promotion.conditions?.minAmount,
            label: codePromo.message,
        };
    }

    /**
     * Méthode legacy pour compatibilité
     * @deprecated Utiliser calculateCartPromotions() à la place
     */
    computeAmount(rule: DiscountRule): { amount: number; reason?: string } {
        const subtotal = this.cart.subtotal();
        if (rule.minSubtotal && subtotal < rule.minSubtotal) {
            return { amount: 0, reason: `Minimum ${rule.minSubtotal.toFixed(2)} € d'achats.` };
        }

        if (rule.type === 'percent') {
            const pct = (rule.value ?? 0) / 100;
            return { amount: +(subtotal * pct).toFixed(2) };
        }

        if (rule.type === 'fixed') {
            return { amount: Math.min(rule.value ?? 0, subtotal) };
        }

        return { amount: 0 };
    }
}

import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartStore } from '../../services/cart-store';
import { AuthService } from '../../../auth/services/auth';
import { OrderStore } from '../../services/order-store';
import { Address } from '../../../auth/models/user.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Finaliser la commande</h1>

      @if (cart.empty()) {
      <div class="bg-white p-6 rounded-xl shadow">
        <p>Votre panier est vide.</p>
        <a class="text-primary-600 underline" routerLink="/">Retour à la boutique</a>
      </div>
      } @else {
      <div class="grid md:grid-cols-3 gap-6">
        <form
          class="md:col-span-2 bg-white p-6 rounded-xl shadow space-y-6"
          [formGroup]="form"
          (ngSubmit)="submit()"
        >
          <section>
            <h2 class="font-semibold mb-4">Informations de contact</h2>
            <div class="grid md:grid-cols-2 gap-4">
              <input class="input" placeholder="Prénom" formControlName="firstName" />
              <input class="input" placeholder="Nom" formControlName="lastName" />
            </div>
            <div class="grid md:grid-cols-2 gap-4 mt-4">
              <input class="input" placeholder="Email" formControlName="email" type="email" />
              <input class="input" placeholder="Téléphone (optionnel)" formControlName="phone" />
            </div>
          </section>

          <section>
            <h2 class="font-semibold mb-4">Adresse</h2>
            <div class="grid md:grid-cols-2 gap-4">
              <input class="input md:col-span-2" placeholder="Rue" formControlName="street" />
              <input class="input" placeholder="Ville" formControlName="city" />
              <input class="input" placeholder="Code postal" formControlName="zip" />
              <input class="input" placeholder="Pays" formControlName="country" />
            </div>
          </section>

          <section>
            <h2 class="font-semibold mb-4">Paiement (simulation)</h2>
            <div class="grid md:grid-cols-2 gap-4">
              <select class="input" formControlName="method">
                <option value="card">Carte</option>
                <option value="paypal">PayPal</option>
                <option value="bank">Virement</option>
              </select>
              <input
                class="input"
                placeholder="4 derniers chiffres (optionnel)"
                formControlName="last4"
                maxlength="4"
              />
            </div>
          </section>

          <button
            class="w-full py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            [disabled]="form.invalid || loading()"
          >
            {{ loading() ? 'Traitement...' : 'Payer et passer la commande' }}
          </button>
        </form>

        <aside class="bg-white p-6 rounded-xl shadow h-fit">
          <h2 class="font-semibold mb-4">Récapitulatif</h2>
          <ul class="divide-y">
            @for (it of cart.items(); track it.productId) {
            <li class="py-3 flex justify-between text-sm">
              <span>{{ it.title }} × {{ it.qty }}</span>
              <span>{{ it.unitPrice * it.qty | number : '1.2-2' }} €</span>
            </li>
            }
          </ul>
          <div class="mt-4 space-y-1 text-sm">
            <div class="flex justify-between">
              <span>Sous-total</span><span>{{ cart.totals().subtotal | number : '1.2-2' }} €</span>
            </div>
            <div class="flex justify-between">
              <span>Taxes</span><span>{{ cart.totals().taxes | number : '1.2-2' }} €</span>
            </div>
            <div class="border-t pt-2 font-semibold flex justify-between text-base">
              <span>Total</span><span>{{ cart.totals().total | number : '1.2-2' }} €</span>
            </div>
          </div>
        </aside>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .input {
        @apply w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600;
      }
    `,
  ],
})
export class CheckoutComponent {
  cart = inject(CartStore);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly orders = inject(OrderStore);
  private readonly router = inject(Router);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    street: ['', Validators.required],
    city: ['', Validators.required],
    zip: ['', Validators.required], // On garde "zip" côté formulaire
    country: ['', Validators.required],
    method: this.fb.nonNullable.control<'card' | 'paypal' | 'bank'>('card'),
    last4: [''],
  });

  constructor() {
    const u = this.auth.currentUser$();
    if (u) {
      const addr: Partial<Address> = u.address ?? {};
      this.form.patchValue({
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        email: u.email ?? '',
        phone: u.phone ?? '',
        street: addr.street ?? '',
        city: addr.city ?? '',
        // Ton modèle utilisateur a "postalCode" -> on l'injecte dans le champ "zip" du formulaire
        zip: addr.postalCode ?? '',
        country: addr.country ?? 'France',
      });
    }
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      const v = this.form.getRawValue();
      const order = await this.orders.placeOrder(
        {
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          phone: v.phone || undefined,
          // Le payload d'order utilise "zip" (côté checkout on garde ce nom)
          address: { street: v.street, city: v.city, zip: v.zip, country: v.country },
        },
        { method: v.method, last4: v.last4 || undefined }
      );

      this.router.navigate(['/cart/confirmation', order.id]);
    } catch (e) {
      console.error(e);
      alert('Échec du paiement (simulation).');
    } finally {
      this.loading.set(false);
    }
  }
}

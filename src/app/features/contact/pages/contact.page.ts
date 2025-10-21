import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="container mx-auto px-4 max-w-5xl">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Contactez-nous</h1>
          <p class="text-lg text-gray-600">
            Une question ? Une suggestion ? Notre équipe est là pour vous répondre.
          </p>
        </div>

        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Formulaire -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-lg shadow-sm p-8">
              <h2 class="text-2xl font-semibold text-gray-900 mb-6">Envoyez-nous un message</h2>

              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
                <!-- Nom & Email -->
                <div class="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      id="name"
                      type="text"
                      formControlName="name"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Jean Dupont"
                    />
                    @if (form.get('name')?.invalid && form.get('name')?.touched) {
                      <p class="mt-1 text-sm text-red-600">Le nom est requis</p>
                    }
                  </div>

                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      formControlName="email"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="jean@example.com"
                    />
                    @if (form.get('email')?.invalid && form.get('email')?.touched) {
                      <p class="mt-1 text-sm text-red-600">Email valide requis</p>
                    }
                  </div>
                </div>

                <!-- Sujet -->
                <div>
                  <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
                    Sujet *
                  </label>
                  <select
                    id="subject"
                    formControlName="subject"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="order">Question sur une commande</option>
                    <option value="product">Question sur un produit</option>
                    <option value="delivery">Livraison</option>
                    <option value="return">Retour / Remboursement</option>
                    <option value="technical">Problème technique</option>
                    <option value="partnership">Partenariat</option>
                    <option value="other">Autre</option>
                  </select>
                  @if (form.get('subject')?.invalid && form.get('subject')?.touched) {
                    <p class="mt-1 text-sm text-red-600">Veuillez sélectionner un sujet</p>
                  }
                </div>

                <!-- Message -->
                <div>
                  <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    formControlName="message"
                    rows="6"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Décrivez votre demande..."
                  ></textarea>
                  @if (form.get('message')?.invalid && form.get('message')?.touched) {
                    <p class="mt-1 text-sm text-red-600">Le message est requis (min. 10 caractères)</p>
                  }
                </div>

                <!-- Submit -->
                <div>
                  <button
                    type="submit"
                    [disabled]="form.invalid || loading()"
                    class="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    @if (loading()) {
                      <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                      Envoi en cours...
                    } @else {
                      <i class="fa-solid fa-paper-plane mr-2"></i>
                      Envoyer le message
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Informations -->
          <div class="space-y-6">
            <!-- Coordonnées -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Coordonnées</h3>
              <div class="space-y-4 text-sm text-gray-700">
                <div class="flex items-start gap-3">
                  <i class="fa-solid fa-envelope text-blue-600 mt-1"></i>
                  <div>
                    <p class="font-medium">Email</p>
                    <a href="mailto:contact@art-shop.com" class="text-blue-600 hover:underline">
                      contact&#64;art-shop.com
                    </a>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <i class="fa-solid fa-clock text-blue-600 mt-1"></i>
                  <div>
                    <p class="font-medium">Temps de réponse</p>
                    <p class="text-gray-600">Sous 24h ouvrées</p>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <i class="fa-solid fa-calendar text-blue-600 mt-1"></i>
                  <div>
                    <p class="font-medium">Disponibilité</p>
                    <p class="text-gray-600">Du lundi au vendredi, 9h - 18h</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- FAQ -->
            <div class="bg-blue-50 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Besoin d'aide rapide ?</h3>
              <p class="text-sm text-gray-700 mb-4">
                Consultez notre FAQ pour trouver rapidement une réponse à votre question.
              </p>
              <a
                routerLink="/legal/faq"
                class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Voir la FAQ
                <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            <!-- Réseaux sociaux -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Suivez-nous</h3>
              <div class="flex gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener"
                  class="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <i class="fa-brands fa-instagram"></i>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener"
                  class="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                  aria-label="Twitter / X"
                >
                  <i class="fa-brands fa-x-twitter"></i>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener"
                  class="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <i class="fa-brands fa-facebook-f"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class ContactPage {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  loading = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    try {
      // Simulation d'envoi
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Stocker le message (simulation)
      const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
      messages.push({
        ...this.form.value,
        date: new Date().toISOString(),
        id: Date.now(),
      });
      localStorage.setItem('contact_messages', JSON.stringify(messages));

      this.toast.success('Message envoyé avec succès ! Nous vous répondrons sous 24h.');
      this.form.reset();
    } catch (error) {
      this.toast.error('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      this.loading.set(false);
    }
  }
}

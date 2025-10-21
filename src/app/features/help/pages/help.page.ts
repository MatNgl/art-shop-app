import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="container mx-auto px-4 max-w-6xl">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Centre d'aide</h1>
          <p class="text-lg text-gray-600">
            Trouvez rapidement l'aide dont vous avez besoin
          </p>
        </div>

        <!-- Catégories d'aide -->
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <a
            routerLink="/legal/faq"
            class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
          >
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
              <i class="fa-solid fa-question-circle text-blue-600 text-2xl group-hover:text-white"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Questions Fréquentes</h2>
            <p class="text-gray-600 text-sm mb-4">
              Retrouvez les réponses aux questions les plus courantes sur nos produits et services.
            </p>
            <span class="text-blue-600 text-sm font-medium group-hover:underline">
              Voir la FAQ →
            </span>
          </a>

          <a
            routerLink="/legal/shipping"
            class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
          >
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
              <i class="fa-solid fa-truck text-green-600 text-2xl group-hover:text-white"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Livraison & Retours</h2>
            <p class="text-gray-600 text-sm mb-4">
              Informations sur les délais, tarifs de livraison et politique de retour.
            </p>
            <span class="text-blue-600 text-sm font-medium group-hover:underline">
              En savoir plus →
            </span>
          </a>

          <a
            routerLink="/contact"
            class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
          >
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
              <i class="fa-solid fa-envelope text-purple-600 text-2xl group-hover:text-white"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Nous Contacter</h2>
            <p class="text-gray-600 text-sm mb-4">
              Une question spécifique ? Contactez notre service client.
            </p>
            <span class="text-blue-600 text-sm font-medium group-hover:underline">
              Envoyer un message →
            </span>
          </a>

          <a
            routerLink="/profile/orders"
            class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
          >
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-600 transition-colors">
              <i class="fa-solid fa-box text-orange-600 text-2xl group-hover:text-white"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Mes Commandes</h2>
            <p class="text-gray-600 text-sm mb-4">
              Suivez vos commandes en cours et consultez votre historique.
            </p>
            <span class="text-blue-600 text-sm font-medium group-hover:underline">
              Voir mes commandes →
            </span>
          </a>

          <a
            routerLink="/profile"
            class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
          >
            <div class="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-600 transition-colors">
              <i class="fa-solid fa-user text-pink-600 text-2xl group-hover:text-white"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Mon Compte</h2>
            <p class="text-gray-600 text-sm mb-4">
              Gérez vos informations personnelles, adresses et préférences.
            </p>
            <span class="text-blue-600 text-sm font-medium group-hover:underline">
              Accéder à mon compte →
            </span>
          </a>

          <a
            routerLink="/legal/terms"
            class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
          >
            <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-600 transition-colors">
              <i class="fa-solid fa-file-lines text-gray-600 text-2xl group-hover:text-white"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Conditions Générales</h2>
            <p class="text-gray-600 text-sm mb-4">
              Consultez nos CGV, politique de confidentialité et mentions légales.
            </p>
            <span class="text-blue-600 text-sm font-medium group-hover:underline">
              Consulter →
            </span>
          </a>
        </div>

        <!-- Section contact rapide -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white text-center">
          <h2 class="text-2xl font-bold mb-4">Besoin d'une aide personnalisée ?</h2>
          <p class="mb-6 text-blue-100">
            Notre équipe est disponible du lundi au vendredi de 9h à 18h
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              routerLink="/contact"
              class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              <i class="fa-solid fa-envelope"></i>
              Nous contacter
            </a>
            <a
              href="mailto:contact@art-shop.com"
              class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors"
            >
              <i class="fa-solid fa-at"></i>
              contact&#64;art-shop.com
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class HelpPage {}

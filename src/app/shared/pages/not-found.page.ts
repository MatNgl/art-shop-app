import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div class="max-w-2xl w-full text-center">
        <!-- Illustration 404 -->
        <div class="mb-8">
          <h1 class="text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            404
          </h1>
        </div>

        <!-- Message -->
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Page introuvable</h2>
        <p class="text-lg text-gray-600 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <a
            routerLink="/"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i class="fa-solid fa-home"></i>
            Retour à l'accueil
          </a>
          <a
            routerLink="/catalog"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <i class="fa-solid fa-images"></i>
            Voir le catalogue
          </a>
        </div>

        <!-- Suggestions -->
        <div class="bg-white rounded-lg shadow-sm p-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-6">Peut-être cherchez-vous :</h3>
          <div class="grid sm:grid-cols-2 gap-4 text-left">
            <a
              routerLink="/catalog"
              class="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <i class="fa-solid fa-images text-blue-600 group-hover:text-white"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900">Catalogue</p>
                <p class="text-sm text-gray-600">Découvrir nos œuvres</p>
              </div>
            </a>

            <a
              routerLink="/promotions"
              class="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                <i class="fa-solid fa-tag text-green-600 group-hover:text-white"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900">Promotions</p>
                <p class="text-sm text-gray-600">Offres du moment</p>
              </div>
            </a>

            <a
              routerLink="/subscriptions"
              class="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                <i class="fa-solid fa-crown text-purple-600 group-hover:text-white"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900">Abonnements</p>
                <p class="text-sm text-gray-600">Nos formules</p>
              </div>
            </a>

            <a
              routerLink="/help"
              class="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                <i class="fa-solid fa-question-circle text-orange-600 group-hover:text-white"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900">Centre d'aide</p>
                <p class="text-sm text-gray-600">Besoin d'aide ?</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class NotFoundPage {}

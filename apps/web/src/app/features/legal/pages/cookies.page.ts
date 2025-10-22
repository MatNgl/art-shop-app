import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cookies-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="container mx-auto px-4 max-w-4xl">
        <div class="bg-white rounded-lg shadow-sm p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Politique Cookies</h1>
          <p class="text-sm text-gray-500 mb-8">Dernière mise à jour : {{ currentDate }}</p>

          <div class="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Qu'est-ce qu'un cookie ?</h2>
              <p class="text-gray-700 leading-relaxed">
                Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d'un site web.
                Il permet de mémoriser des informations sur votre navigation et d'améliorer votre expérience.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Types de cookies utilisés</h2>

              <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3">1. Cookies strictement nécessaires</h3>
              <p class="text-gray-700 leading-relaxed mb-2">
                <span class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                  Obligatoires
                </span>
              </p>
              <p class="text-gray-700 leading-relaxed">
                Ces cookies sont indispensables au fonctionnement du site. Ils permettent l'utilisation
                des fonctions essentielles comme le panier, l'authentification ou la sécurité.
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                <li>Session utilisateur</li>
                <li>Panier d'achat</li>
                <li>Sécurité et prévention de la fraude</li>
              </ul>

              <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3">2. Cookies de performance</h3>
              <p class="text-gray-700 leading-relaxed mb-2">
                <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  Avec consentement
                </span>
              </p>
              <p class="text-gray-700 leading-relaxed">
                Ils nous aident à comprendre comment les visiteurs utilisent le site en collectant
                des informations anonymes sur les pages visitées et les interactions.
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                <li>Google Analytics (analytique)</li>
                <li>Temps passé sur les pages</li>
                <li>Taux de rebond</li>
              </ul>

              <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3">3. Cookies fonctionnels</h3>
              <p class="text-gray-700 leading-relaxed mb-2">
                <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  Avec consentement
                </span>
              </p>
              <p class="text-gray-700 leading-relaxed">
                Ils permettent de mémoriser vos préférences pour améliorer votre confort de navigation.
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                <li>Langue préférée</li>
                <li>Préférences d'affichage</li>
                <li>Favoris et listes de souhaits</li>
              </ul>

              <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3">4. Cookies marketing</h3>
              <p class="text-gray-700 leading-relaxed mb-2">
                <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  Avec consentement
                </span>
              </p>
              <p class="text-gray-700 leading-relaxed">
                Utilisés pour diffuser des publicités pertinentes et mesurer l'efficacité des campagnes.
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                <li>Publicité ciblée</li>
                <li>Remarketing</li>
                <li>Réseaux sociaux (partage, like)</li>
              </ul>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Durée de conservation</h2>
              <div class="overflow-x-auto mt-4">
                <table class="min-w-full divide-y divide-gray-200 border">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Durée
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr>
                      <td class="px-4 py-3 text-sm text-gray-700">Session</td>
                      <td class="px-4 py-3 text-sm text-gray-700">Jusqu'à fermeture du navigateur</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-3 text-sm text-gray-700">Authentification</td>
                      <td class="px-4 py-3 text-sm text-gray-700">30 jours</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-3 text-sm text-gray-700">Analytique</td>
                      <td class="px-4 py-3 text-sm text-gray-700">13 mois maximum</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-3 text-sm text-gray-700">Marketing</td>
                      <td class="px-4 py-3 text-sm text-gray-700">13 mois maximum</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Gestion des cookies</h2>
              <p class="text-gray-700 leading-relaxed">
                Vous pouvez à tout moment modifier vos préférences de cookies :
              </p>

              <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3">Via votre navigateur</h3>
              <p class="text-gray-700 leading-relaxed mb-2">
                Tous les navigateurs permettent de gérer les cookies via leurs paramètres :
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-1">
                <li>
                  <strong>Chrome</strong> : Paramètres → Confidentialité et sécurité → Cookies
                </li>
                <li>
                  <strong>Firefox</strong> : Options → Vie privée et sécurité → Cookies
                </li>
                <li>
                  <strong>Safari</strong> : Préférences → Confidentialité → Cookies
                </li>
                <li>
                  <strong>Edge</strong> : Paramètres → Cookies et autorisations de site
                </li>
              </ul>

              <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <i class="fa-solid fa-exclamation-triangle text-yellow-400"></i>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-yellow-700">
                      <strong>Attention :</strong> Désactiver certains cookies peut affecter le
                      fonctionnement du site (panier, connexion, préférences).
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Cookies tiers</h2>
              <p class="text-gray-700 leading-relaxed">
                Certains cookies sont déposés par des services tiers que nous utilisons :
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li>
                  <strong>Google Analytics</strong> : statistiques de fréquentation
                  (<a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener"
                    class="text-blue-600 hover:underline"
                    >Politique de confidentialité</a
                  >)
                </li>
                <li>
                  <strong>Services de paiement</strong> : sécurisation des transactions
                </li>
                <li>
                  <strong>Réseaux sociaux</strong> : boutons de partage (avec consentement)
                </li>
              </ul>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Vos droits</h2>
              <p class="text-gray-700 leading-relaxed">
                Conformément au RGPD, vous bénéficiez d'un droit d'accès, de rectification et de
                suppression de vos données. Pour plus d'informations, consultez notre
                <a routerLink="/legal/privacy" class="text-blue-600 hover:underline"
                  >Politique de confidentialité</a
                >.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
              <p class="text-gray-700 leading-relaxed">
                Pour toute question sur les cookies :
              </p>
              <ul class="list-none text-gray-700 space-y-2 mt-4">
                <li>
                  📧 Email :
                  <a href="mailto:privacy@art-shop.com" class="text-blue-600 hover:underline"
                    >privacy&#64;art-shop.com</a
                  >
                </li>
                <li>
                  📝 Formulaire :
                  <a routerLink="/contact" class="text-blue-600 hover:underline">Page de contact</a>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class CookiesPage {
  currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

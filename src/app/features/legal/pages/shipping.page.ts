import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-shipping-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="container mx-auto px-4 max-w-4xl">
        <div class="bg-white rounded-lg shadow-sm p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Livraison & Retours</h1>
          <p class="text-gray-600 mb-8">
            Informations sur nos modes de livraison, délais et politique de retour.
          </p>

          <div class="space-y-8">
            <!-- Livraison -->
            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">
                <i class="fa-solid fa-truck text-blue-600 mr-2"></i>
                Livraison
              </h2>

              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Modes de livraison</h3>
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 border">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Destination
                          </th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Mode
                          </th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Délai
                          </th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tarif
                          </th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        <tr>
                          <td class="px-4 py-3 text-sm text-gray-700">France métropolitaine</td>
                          <td class="px-4 py-3 text-sm text-gray-700">Standard</td>
                          <td class="px-4 py-3 text-sm text-gray-700">3-5 jours ouvrés</td>
                          <td class="px-4 py-3 text-sm text-gray-700">4,90€ (Gratuit dès 50€)</td>
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm text-gray-700">France métropolitaine</td>
                          <td class="px-4 py-3 text-sm text-gray-700">Express</td>
                          <td class="px-4 py-3 text-sm text-gray-700">24-48h</td>
                          <td class="px-4 py-3 text-sm text-gray-700">9,90€</td>
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm text-gray-700">Union Européenne</td>
                          <td class="px-4 py-3 text-sm text-gray-700">Standard</td>
                          <td class="px-4 py-3 text-sm text-gray-700">5-10 jours ouvrés</td>
                          <td class="px-4 py-3 text-sm text-gray-700">12,90€</td>
                        </tr>
                        <tr>
                          <td class="px-4 py-3 text-sm text-gray-700">International</td>
                          <td class="px-4 py-3 text-sm text-gray-700">Standard</td>
                          <td class="px-4 py-3 text-sm text-gray-700">10-20 jours ouvrés</td>
                          <td class="px-4 py-3 text-sm text-gray-700">À partir de 19,90€</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Emballage</h3>
                  <p class="text-gray-700 leading-relaxed">
                    Toutes nos œuvres sont emballées avec le plus grand soin dans des emballages adaptés :
                  </p>
                  <ul class="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                    <li>Protection renforcée avec matériaux anti-chocs</li>
                    <li>Emballage cartonné rigide pour les impressions</li>
                    <li>Caisse en bois sur mesure pour les œuvres originales de grande valeur</li>
                    <li>Assurance incluse pour toutes les expéditions</li>
                  </ul>
                </div>

                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Suivi de commande</h3>
                  <p class="text-gray-700 leading-relaxed">
                    Dès l'expédition de votre commande, vous recevez un email avec :
                  </p>
                  <ul class="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                    <li>Un numéro de suivi (tracking)</li>
                    <li>Le nom du transporteur</li>
                    <li>Un lien de suivi en temps réel</li>
                    <li>La date de livraison estimée</li>
                  </ul>
                </div>

                <div class="bg-blue-50 p-4 rounded-lg">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">
                    <i class="fa-solid fa-info-circle text-blue-600 mr-2"></i>
                    Livraison offerte
                  </h3>
                  <p class="text-gray-700">
                    Profitez de la livraison gratuite en France métropolitaine pour toute commande
                    de 50€ ou plus !
                  </p>
                </div>
              </div>
            </section>

            <!-- Retours -->
            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">
                <i class="fa-solid fa-rotate-left text-blue-600 mr-2"></i>
                Retours & Remboursements
              </h2>

              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Droit de rétractation</h3>
                  <p class="text-gray-700 leading-relaxed">
                    Conformément à la loi, vous disposez de <strong>14 jours</strong> à compter de la
                    réception de votre commande pour exercer votre droit de rétractation, sans avoir à
                    justifier de motif.
                  </p>
                  <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                    <p class="text-sm text-yellow-700">
                      <strong>Exceptions :</strong> Les œuvres personnalisées ou créées sur mesure ne
                      peuvent faire l'objet d'un retour, sauf défaut de fabrication.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Procédure de retour</h3>
                  <ol class="list-decimal pl-6 text-gray-700 space-y-2">
                    <li>
                      Contactez-nous à
                      <a href="mailto:contact@art-shop.com" class="text-blue-600 hover:underline"
                        >contact@art-shop.com</a
                      >
                      avec votre numéro de commande
                    </li>
                    <li>Nous vous envoyons les instructions de retour et l'adresse d'expédition</li>
                    <li>Renvoyez le produit dans son emballage d'origine, en parfait état</li>
                    <li>Nous contrôlons le retour et validons le remboursement</li>
                    <li>Remboursement effectué sous 5 à 7 jours ouvrés</li>
                  </ol>
                </div>

                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Conditions de retour</h3>
                  <ul class="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Le produit doit être en parfait état de revente</li>
                    <li>Emballage d'origine intact</li>
                    <li>Tous les accessoires et documents fournis doivent être présents</li>
                    <li>Les frais de retour sont à la charge du client</li>
                  </ul>
                </div>

                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Produit endommagé ou défectueux</h3>
                  <p class="text-gray-700 leading-relaxed">
                    Si vous recevez un produit endommagé ou défectueux :
                  </p>
                  <ul class="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                    <li>Contactez-nous dans les <strong>48h</strong> suivant la réception</li>
                    <li>Envoyez-nous des photos du dommage</li>
                    <li>Nous prenons en charge les frais de retour</li>
                    <li>Remplacement ou remboursement intégral selon votre choix</li>
                  </ul>
                </div>
              </div>
            </section>

            <!-- FAQ Livraison -->
            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">
                <i class="fa-solid fa-question-circle text-blue-600 mr-2"></i>
                Questions fréquentes
              </h2>

              <div class="space-y-4">
                <div class="border-l-4 border-blue-600 pl-4">
                  <h3 class="font-semibold text-gray-900 mb-1">
                    Puis-je changer l'adresse de livraison après commande ?
                  </h3>
                  <p class="text-gray-700 text-sm">
                    Vous pouvez modifier l'adresse de livraison dans l'heure suivant la validation,
                    en nous contactant. Passé ce délai, la commande est en cours de préparation.
                  </p>
                </div>

                <div class="border-l-4 border-blue-600 pl-4">
                  <h3 class="font-semibold text-gray-900 mb-1">
                    Que faire si je suis absent à la livraison ?
                  </h3>
                  <p class="text-gray-700 text-sm">
                    Le transporteur laissera un avis de passage. Vous pourrez retirer votre colis dans
                    un point relais ou convenir d'une nouvelle date de livraison.
                  </p>
                </div>

                <div class="border-l-4 border-blue-600 pl-4">
                  <h3 class="font-semibold text-gray-900 mb-1">Livrez-vous en point relais ?</h3>
                  <p class="text-gray-700 text-sm">
                    Oui, cette option est disponible en France métropolitaine. Vous pourrez choisir votre
                    point relais lors de la validation de votre commande.
                  </p>
                </div>

                <div class="border-l-4 border-blue-600 pl-4">
                  <h3 class="font-semibold text-gray-900 mb-1">
                    Y a-t-il des frais de douane pour l'international ?
                  </h3>
                  <p class="text-gray-700 text-sm">
                    Pour les livraisons hors UE, des frais de douane peuvent s'appliquer selon la
                    destination. Ces frais sont à la charge du destinataire.
                  </p>
                </div>
              </div>
            </section>

            <!-- Contact -->
            <div class="bg-gray-50 p-6 rounded-lg">
              <h2 class="text-lg font-semibold text-gray-900 mb-2">Besoin d'aide ?</h2>
              <p class="text-gray-700 mb-4">
                Notre service client est à votre disposition pour toute question concernant la livraison
                ou les retours.
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <a
                  routerLink="/contact"
                  class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <i class="fa-solid fa-envelope"></i>
                  Nous contacter
                </a>
                <a
                  routerLink="/legal/faq"
                  class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <i class="fa-solid fa-question-circle"></i>
                  Voir la FAQ
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
export class ShippingPage {}

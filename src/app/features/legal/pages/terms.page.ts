import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="container mx-auto px-4 max-w-4xl">
        <div class="bg-white rounded-lg shadow-sm p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Conditions Générales de Vente</h1>
          <p class="text-sm text-gray-500 mb-8">Dernière mise à jour : {{ currentDate }}</p>

          <div class="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">1. Objet</h2>
              <p class="text-gray-700 leading-relaxed">
                Les présentes conditions générales de vente (CGV) régissent les relations contractuelles
                entre Art Shop, société fictive (ci-après "le Vendeur"), et toute personne physique ou morale
                souhaitant effectuer un achat sur le site art-shop.com (ci-après "l'Acheteur").
              </p>
              <p class="text-gray-700 leading-relaxed">
                Toute commande implique l'acceptation sans réserve des présentes CGV.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">2. Produits</h2>
              <p class="text-gray-700 leading-relaxed">
                Art Shop propose à la vente des œuvres d'art, dessins, impressions et produits dérivés.
                Les produits sont décrits avec la plus grande précision possible. Les photographies sont
                non contractuelles et les couleurs peuvent varier selon les écrans.
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-2">
                <li>Toutes les œuvres sont vendues avec certificat d'authenticité</li>
                <li>Les dimensions sont indiquées en centimètres (hauteur x largeur)</li>
                <li>Les formats disponibles sont précisés pour chaque produit</li>
                <li>Stock limité pour les éditions numérotées</li>
              </ul>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">3. Prix</h2>
              <p class="text-gray-700 leading-relaxed">
                Les prix sont indiqués en euros (€) toutes taxes comprises (TTC). Le Vendeur se réserve
                le droit de modifier ses prix à tout moment, étant entendu que le prix figurant au catalogue
                le jour de la commande sera le seul applicable à l'Acheteur.
              </p>
              <p class="text-gray-700 leading-relaxed">
                Les frais de livraison sont calculés en fonction du poids, des dimensions et de la destination.
                Ils sont indiqués avant la validation de la commande.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">4. Commande</h2>
              <p class="text-gray-700 leading-relaxed">
                L'Acheteur passe commande en ligne en suivant les étapes suivantes :
              </p>
              <ol class="list-decimal pl-6 text-gray-700 space-y-2">
                <li>Sélection des produits et ajout au panier</li>
                <li>Vérification du contenu du panier</li>
                <li>Identification ou création de compte</li>
                <li>Saisie de l'adresse de livraison</li>
                <li>Choix du mode de livraison</li>
                <li>Choix du mode de paiement</li>
                <li>Validation définitive de la commande</li>
              </ol>
              <p class="text-gray-700 leading-relaxed mt-4">
                Un email de confirmation est envoyé automatiquement après validation de la commande.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">5. Paiement</h2>
              <p class="text-gray-700 leading-relaxed">
                Le paiement s'effectue en ligne de manière sécurisée. Les moyens de paiement acceptés sont :
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-2">
                <li>Carte bancaire (Visa, Mastercard, American Express)</li>
                <li>PayPal</li>
                <li>Virement bancaire (sur demande pour les montants > 500€)</li>
              </ul>
              <p class="text-gray-700 leading-relaxed mt-4">
                Les paiements sont sécurisés par notre prestataire de paiement certifié PCI-DSS.
                Aucune donnée bancaire n'est conservée sur nos serveurs.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">6. Livraison</h2>
              <p class="text-gray-700 leading-relaxed">
                Les délais de livraison varient selon la destination et le mode de transport choisi :
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-2">
                <li>France métropolitaine : 3 à 5 jours ouvrés (standard) ou 24-48h (express)</li>
                <li>Union Européenne : 5 à 10 jours ouvrés</li>
                <li>International : 10 à 20 jours ouvrés</li>
              </ul>
              <p class="text-gray-700 leading-relaxed mt-4">
                Toutes les œuvres sont emballées avec soin. Un numéro de suivi est fourni pour chaque envoi.
                En cas de dommage à la réception, l'Acheteur dispose de 48h pour formuler une réclamation.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">7. Droit de rétractation</h2>
              <p class="text-gray-700 leading-relaxed">
                Conformément à la législation en vigueur, l'Acheteur dispose d'un délai de 14 jours
                à compter de la réception de sa commande pour exercer son droit de rétractation,
                sans avoir à justifier de motif.
              </p>
              <p class="text-gray-700 leading-relaxed">
                <strong>Exceptions :</strong> Les œuvres personnalisées, sur mesure ou créées spécifiquement
                à la demande de l'Acheteur ne peuvent faire l'objet d'un droit de rétractation.
              </p>
              <p class="text-gray-700 leading-relaxed">
                Le retour s'effectue aux frais de l'Acheteur. Les produits doivent être retournés dans
                leur emballage d'origine, en parfait état de revente.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">8. Garanties</h2>
              <p class="text-gray-700 leading-relaxed">
                Tous les produits vendus bénéficient de la garantie légale de conformité et de la garantie
                contre les vices cachés, conformément aux articles L217-4 et suivants du Code de la consommation.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">9. Programme de fidélité</h2>
              <p class="text-gray-700 leading-relaxed">
                Art Shop propose un programme de fidélité permettant de cumuler des points à chaque achat.
                Les conditions du programme sont détaillées dans l'espace client.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">10. Abonnements</h2>
              <p class="text-gray-700 leading-relaxed">
                Les abonnements proposés (Starter, Professional, Enterprise) sont sans engagement et
                résiliables à tout moment. Les conditions spécifiques de chaque formule sont détaillées
                sur la page
                <a routerLink="/subscriptions" class="text-blue-600 hover:underline">Abonnements</a>.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">11. Propriété intellectuelle</h2>
              <p class="text-gray-700 leading-relaxed">
                Tous les contenus présents sur le site (textes, images, logos, graphismes, etc.) sont
                la propriété exclusive d'Art Shop ou de ses partenaires et sont protégés par les lois
                sur la propriété intellectuelle.
              </p>
              <p class="text-gray-700 leading-relaxed">
                L'achat d'une œuvre confère un droit de propriété sur l'objet physique mais ne transfère
                pas les droits d'auteur. Toute reproduction, diffusion ou exploitation commerciale est interdite.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">12. Données personnelles</h2>
              <p class="text-gray-700 leading-relaxed">
                Les données personnelles collectées font l'objet d'un traitement informatique conforme au RGPD.
                Pour plus d'informations, consultez notre
                <a routerLink="/legal/privacy" class="text-blue-600 hover:underline"
                  >Politique de confidentialité</a
                >.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">13. Litiges</h2>
              <p class="text-gray-700 leading-relaxed">
                En cas de litige, une solution amiable sera recherchée en priorité. À défaut, le litige
                sera porté devant les tribunaux compétents.
              </p>
              <p class="text-gray-700 leading-relaxed">
                Conformément à la réglementation européenne, vous pouvez également recourir à la plateforme
                de règlement des litiges en ligne de l'UE :
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener"
                  class="text-blue-600 hover:underline"
                  >https://ec.europa.eu/consumers/odr</a
                >
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">14. Contact</h2>
              <p class="text-gray-700 leading-relaxed">
                Pour toute question concernant les présentes CGV, vous pouvez nous contacter :
              </p>
              <ul class="list-none text-gray-700 space-y-2 mt-4">
                <li>
                  📧 Email :
                  <a href="mailto:contact@art-shop.com" class="text-blue-600 hover:underline"
                    >contact&#64;art-shop.com</a
                  >
                </li>
                <li>
                  📝 Formulaire :
                  <a routerLink="/contact" class="text-blue-600 hover:underline">Page de contact</a>
                </li>
              </ul>
            </section>
          </div>

          <div class="mt-12 pt-6 border-t border-gray-200">
            <p class="text-sm text-gray-500 text-center">
              Ces conditions générales de vente sont régies par le droit français.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class TermsPage {
  currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

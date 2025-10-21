import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="container mx-auto px-4 max-w-4xl">
        <div class="bg-white rounded-lg shadow-sm p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Politique de Confidentialité</h1>
          <p class="text-sm text-gray-500 mb-8">Dernière mise à jour : {{ currentDate }}</p>

          <div class="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p class="text-gray-700 leading-relaxed">
                Art Shop accorde une grande importance à la protection de vos données personnelles.
                Cette politique de confidentialité vous informe sur la manière dont nous collectons,
                utilisons et protégeons vos informations conformément au Règlement Général sur la
                Protection des Données (RGPD).
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">2. Responsable du traitement</h2>
              <p class="text-gray-700 leading-relaxed">
                Le responsable du traitement des données est :
              </p>
              <div class="bg-gray-50 p-4 rounded-lg mt-4">
                <p class="text-gray-700"><strong>Art Shop</strong></p>
                <p class="text-gray-700">Email : contact&#64;art-shop.com</p>
                <p class="text-gray-700">Site web : www.art-shop.com</p>
              </div>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">
                3. Données collectées
              </h2>
              <p class="text-gray-700 leading-relaxed">
                Nous collectons les catégories de données suivantes :
              </p>

              <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3">3.1. Données d'identification</h3>
              <ul class="list-disc pl-6 text-gray-700 space-y-2">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone (optionnel)</li>
                <li>Mot de passe (chiffré)</li>
              </ul>

              <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3">3.2. Données de commande</h3>
              <ul class="list-disc pl-6 text-gray-700 space-y-2">
                <li>Adresse de livraison</li>
                <li>Adresse de facturation</li>
                <li>Historique des commandes</li>
                <li>Montants des transactions</li>
              </ul>

              <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3">3.3. Données de navigation</h3>
              <ul class="list-disc pl-6 text-gray-700 space-y-2">
                <li>Adresse IP</li>
                <li>Cookies (voir notre <a routerLink="/legal/cookies" class="text-blue-600 hover:underline">politique cookies</a>)</li>
                <li>Pages visitées et durée des sessions</li>
                <li>Appareil et navigateur utilisé</li>
              </ul>

              <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3">3.4. Données optionnelles</h3>
              <ul class="list-disc pl-6 text-gray-700 space-y-2">
                <li>Préférences de communication (newsletter)</li>
                <li>Liste de favoris</li>
                <li>Avis et commentaires</li>
                <li>Programme de fidélité</li>
              </ul>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">
                4. Finalités du traitement
              </h2>
              <p class="text-gray-700 leading-relaxed">
                Vos données sont collectées pour les finalités suivantes :
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li><strong>Gestion des commandes</strong> : traitement, expédition, facturation, SAV</li>
                <li><strong>Gestion du compte client</strong> : création et gestion de votre espace personnel</li>
                <li>
                  <strong>Communication</strong> : envoi d'emails transactionnels, newsletters (avec consentement)
                </li>
                <li><strong>Amélioration des services</strong> : analyse statistique, optimisation UX</li>
                <li><strong>Sécurité</strong> : prévention de la fraude, détection d'abus</li>
                <li><strong>Obligations légales</strong> : comptabilité, conformité fiscale</li>
                <li>
                  <strong>Marketing</strong> : personnalisation des offres, recommandations (avec consentement)
                </li>
              </ul>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">5. Base légale</h2>
              <p class="text-gray-700 leading-relaxed">Les traitements sont fondés sur :</p>
              <ul class="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li>
                  <strong>Exécution du contrat</strong> : traitement de vos commandes, livraison
                </li>
                <li>
                  <strong>Obligation légale</strong> : conservation des factures, déclarations fiscales
                </li>
                <li>
                  <strong>Consentement</strong> : newsletter, cookies marketing, communications promotionnelles
                </li>
                <li>
                  <strong>Intérêt légitime</strong> : amélioration des services, lutte contre la fraude
                </li>
              </ul>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">
                6. Destinataires des données
              </h2>
              <p class="text-gray-700 leading-relaxed">
                Vos données peuvent être transmises aux catégories de destinataires suivantes :
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li><strong>Personnel autorisé</strong> d'Art Shop</li>
                <li>
                  <strong>Prestataires de services</strong> : hébergement, paiement, livraison, emailing
                </li>
                <li><strong>Partenaires commerciaux</strong> : uniquement avec votre consentement explicite</li>
                <li><strong>Autorités</strong> : sur demande légale ou judiciaire</li>
              </ul>
              <p class="text-gray-700 leading-relaxed mt-4">
                Tous nos prestataires sont soumis à des obligations de confidentialité et de sécurité
                strictes par contrat.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">7. Durée de conservation</h2>
              <p class="text-gray-700 leading-relaxed">Les données sont conservées pour les durées suivantes :</p>
              <div class="overflow-x-auto mt-4">
                <table class="min-w-full divide-y divide-gray-200 border">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type de données
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Durée
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr>
                      <td class="px-4 py-3 text-sm text-gray-700">Compte client actif</td>
                      <td class="px-4 py-3 text-sm text-gray-700">Tant que le compte est actif</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-3 text-sm text-gray-700">Compte client inactif</td>
                      <td class="px-4 py-3 text-sm text-gray-700">3 ans après dernière activité</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-3 text-sm text-gray-700">Données de commande</td>
                      <td class="px-4 py-3 text-sm text-gray-700">10 ans (obligation comptable)</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-3 text-sm text-gray-700">Données de paiement</td>
                      <td class="px-4 py-3 text-sm text-gray-700">15 mois (lutte contre la fraude)</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-3 text-sm text-gray-700">Newsletter</td>
                      <td class="px-4 py-3 text-sm text-gray-700">Jusqu'à désinscription</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-3 text-sm text-gray-700">Cookies analytiques</td>
                      <td class="px-4 py-3 text-sm text-gray-700">13 mois maximum</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">8. Vos droits</h2>
              <p class="text-gray-700 leading-relaxed">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li>
                  <strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles
                </li>
                <li>
                  <strong>Droit de rectification</strong> : corriger des données inexactes ou incomplètes
                </li>
                <li>
                  <strong>Droit à l'effacement</strong> : supprimer vos données dans certaines conditions
                </li>
                <li>
                  <strong>Droit à la limitation</strong> : restreindre le traitement de vos données
                </li>
                <li>
                  <strong>Droit à la portabilité</strong> : récupérer vos données dans un format structuré
                </li>
                <li>
                  <strong>Droit d'opposition</strong> : vous opposer au traitement pour des raisons légitimes
                </li>
                <li>
                  <strong>Droit de retrait du consentement</strong> : à tout moment pour les traitements
                  basés sur le consentement
                </li>
              </ul>
              <p class="text-gray-700 leading-relaxed mt-4">
                Pour exercer vos droits, contactez-nous à :
                <a href="mailto:privacy@art-shop.com" class="text-blue-600 hover:underline"
                  >privacy&#64;art-shop.com</a
                >
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">9. Sécurité</h2>
              <p class="text-gray-700 leading-relaxed">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées :
              </p>
              <ul class="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li>Chiffrement SSL/TLS pour toutes les communications</li>
                <li>Mots de passe chiffrés avec algorithmes robustes (bcrypt)</li>
                <li>Hébergement sécurisé avec sauvegardes régulières</li>
                <li>Accès limité aux données (principe du moindre privilège)</li>
                <li>Audits de sécurité réguliers</li>
                <li>Formation du personnel à la protection des données</li>
              </ul>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">10. Cookies</h2>
              <p class="text-gray-700 leading-relaxed">
                Notre site utilise des cookies. Pour en savoir plus, consultez notre
                <a routerLink="/legal/cookies" class="text-blue-600 hover:underline">politique cookies</a>.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">11. Transferts internationaux</h2>
              <p class="text-gray-700 leading-relaxed">
                Vos données sont hébergées au sein de l'Union Européenne. En cas de transfert hors UE,
                nous garantissons un niveau de protection adéquat conformément au RGPD.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">12. Mineurs</h2>
              <p class="text-gray-700 leading-relaxed">
                Nos services ne sont pas destinés aux personnes de moins de 16 ans. Si vous êtes mineur,
                veuillez obtenir l'accord de vos parents avant de nous fournir des données personnelles.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">13. Modifications</h2>
              <p class="text-gray-700 leading-relaxed">
                Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment.
                Les modifications seront publiées sur cette page avec une nouvelle date de mise à jour.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">14. Réclamation</h2>
              <p class="text-gray-700 leading-relaxed">
                Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une
                réclamation auprès de la CNIL :
              </p>
              <div class="bg-gray-50 p-4 rounded-lg mt-4">
                <p class="text-gray-700"><strong>Commission Nationale de l'Informatique et des Libertés (CNIL)</strong></p>
                <p class="text-gray-700">3 Place de Fontenoy - TSA 80715</p>
                <p class="text-gray-700">75334 PARIS CEDEX 07</p>
                <p class="text-gray-700">
                  Site :
                  <a
                    href="https://www.cnil.fr"
                    target="_blank"
                    rel="noopener"
                    class="text-blue-600 hover:underline"
                    >www.cnil.fr</a
                  >
                </p>
              </div>
            </section>

            <section>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">15. Contact</h2>
              <p class="text-gray-700 leading-relaxed">
                Pour toute question relative à la protection de vos données personnelles :
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

          <div class="mt-12 pt-6 border-t border-gray-200">
            <p class="text-sm text-gray-500 text-center">
              Cette politique est conforme au RGPD (Règlement UE 2016/679).
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class PrivacyPage {
  currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

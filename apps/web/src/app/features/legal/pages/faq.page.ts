import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="container mx-auto px-4 max-w-4xl">
        <div class="bg-white rounded-lg shadow-sm p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Questions Fréquentes</h1>
          <p class="text-gray-600 mb-8">
            Trouvez rapidement les réponses à vos questions les plus courantes.
          </p>

          <!-- Filtres par catégorie -->
          <div class="flex flex-wrap gap-2 mb-8">
            <button
              *ngFor="let cat of categories"
              (click)="selectedCategory.set(cat)"
              [class.bg-blue-600]="selectedCategory() === cat"
              [class.text-white]="selectedCategory() === cat"
              [class.bg-gray-100]="selectedCategory() !== cat"
              [class.text-gray-700]="selectedCategory() !== cat"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700 hover:text-white"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Liste FAQ -->
          <div class="space-y-4">
            @for (item of filteredFaqs(); track item.question) {
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  (click)="toggle(item.question)"
                  class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span class="font-semibold text-gray-900">{{ item.question }}</span>
                  <i
                    class="fa-solid transition-transform"
                    [class.fa-chevron-down]="!isOpen(item.question)"
                    [class.fa-chevron-up]="isOpen(item.question)"
                  ></i>
                </button>
                @if (isOpen(item.question)) {
                  <div class="px-6 py-4 bg-gray-50 border-t">
                    <p class="text-gray-700 leading-relaxed" [innerHTML]="item.answer"></p>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Contact -->
          <div class="mt-12 p-6 bg-blue-50 rounded-lg">
            <h2 class="text-lg font-semibold text-gray-900 mb-2">Vous ne trouvez pas votre réponse ?</h2>
            <p class="text-gray-700 mb-4">
              Notre équipe est là pour vous aider. N'hésitez pas à nous contacter.
            </p>
            <a
              routerLink="/contact"
              class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i class="fa-solid fa-envelope"></i>
              Nous contacter
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class FaqPage {
  selectedCategory = signal<string>('Toutes');
  openItems = signal<Set<string>>(new Set());

  categories = ['Toutes', 'Commandes', 'Livraison', 'Paiement', 'Compte', 'Produits', 'Retours'];

  readonly faqs: FaqItem[] = [
    {
      category: 'Commandes',
      question: 'Comment passer une commande ?',
      answer:
        'Pour passer une commande, ajoutez les produits souhaités à votre panier, puis cliquez sur le panier en haut à droite. Vérifiez votre commande et cliquez sur "Procéder au paiement". Suivez ensuite les étapes pour renseigner vos informations de livraison et de paiement.',
    },
    {
      category: 'Commandes',
      question: 'Puis-je modifier ma commande après validation ?',
      answer:
        'Vous pouvez modifier votre commande dans un délai de 1 heure après validation en nous contactant à <a href="mailto:contact@art-shop.com" class="text-blue-600 hover:underline">contact@art-shop.com</a>. Passé ce délai, la commande est en cours de préparation et ne peut plus être modifiée.',
    },
    {
      category: 'Commandes',
      question: 'Comment suivre ma commande ?',
      answer:
        'Après expédition, vous recevrez un email avec un numéro de suivi. Vous pouvez également consulter l\'état de vos commandes dans votre espace client, rubrique <a routerLink="/profile/orders" class="text-blue-600 hover:underline">Mes commandes</a>.',
    },
    {
      category: 'Livraison',
      question: 'Quels sont les délais de livraison ?',
      answer:
        'Les délais varient selon votre localisation :<br>• France métropolitaine : 3 à 5 jours ouvrés (standard) ou 24-48h (express)<br>• Union Européenne : 5 à 10 jours ouvrés<br>• International : 10 à 20 jours ouvrés',
    },
    {
      category: 'Livraison',
      question: 'Quels sont les frais de livraison ?',
      answer:
        'Les frais de livraison sont calculés automatiquement en fonction du poids, des dimensions et de la destination. Ils sont affichés avant la validation de votre commande. Livraison gratuite en France métropolitaine dès 50€ d\'achat.',
    },
    {
      category: 'Livraison',
      question: 'Livrez-vous à l\'international ?',
      answer:
        'Oui, nous livrons dans le monde entier. Les frais et délais varient selon la destination. Les droits de douane éventuels sont à la charge du destinataire.',
    },
    {
      category: 'Paiement',
      question: 'Quels moyens de paiement acceptez-vous ?',
      answer:
        'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), PayPal et le virement bancaire (pour les montants supérieurs à 500€). Tous les paiements sont sécurisés.',
    },
    {
      category: 'Paiement',
      question: 'Mes données bancaires sont-elles sécurisées ?',
      answer:
        'Absolument. Nous utilisons un système de paiement sécurisé certifié PCI-DSS. Vos données bancaires ne transitent jamais par nos serveurs et sont directement traitées par notre prestataire de paiement.',
    },
    {
      category: 'Paiement',
      question: 'Puis-je payer en plusieurs fois ?',
      answer:
        'Le paiement en plusieurs fois est disponible pour les commandes de plus de 100€ via notre partenaire de paiement. L\'option vous sera proposée lors du paiement.',
    },
    {
      category: 'Compte',
      question: 'Dois-je créer un compte pour commander ?',
      answer:
        'Non, vous pouvez commander en tant qu\'invité. Cependant, créer un compte vous permet de suivre vos commandes, sauvegarder vos favoris, bénéficier du programme de fidélité et profiter d\'un paiement plus rapide.',
    },
    {
      category: 'Compte',
      question: 'Comment modifier mes informations personnelles ?',
      answer:
        'Connectez-vous à votre compte et accédez à <a routerLink="/profile" class="text-blue-600 hover:underline">Mon profil</a>. Vous pouvez y modifier vos informations personnelles, vos adresses et vos préférences.',
    },
    {
      category: 'Compte',
      question: 'J\'ai oublié mon mot de passe, que faire ?',
      answer:
        'Cliquez sur "Mot de passe oublié ?" sur la page de connexion. Entrez votre adresse email et vous recevrez un lien pour réinitialiser votre mot de passe.',
    },
    {
      category: 'Produits',
      question: 'Les produits sont-ils des œuvres originales ?',
      answer:
        'Nous proposons à la fois des œuvres originales uniques et des reproductions limitées. Chaque fiche produit précise s\'il s\'agit d\'une pièce unique, d\'une édition limitée ou d\'une reproduction. Toutes les œuvres sont accompagnées d\'un certificat d\'authenticité.',
    },
    {
      category: 'Produits',
      question: 'Les couleurs correspondent-elles exactement aux photos ?',
      answer:
        'Nous faisons de notre mieux pour que les photos soient fidèles à la réalité, mais les couleurs peuvent varier légèrement selon les écrans. Pour les œuvres originales, nous pouvons vous envoyer des photos supplémentaires sur demande.',
    },
    {
      category: 'Produits',
      question: 'Puis-je demander un format personnalisé ?',
      answer:
        'Oui, pour certaines reproductions. Contactez-nous à <a href="mailto:contact@art-shop.com" class="text-blue-600 hover:underline">contact@art-shop.com</a> avec votre demande et nous vous ferons un devis personnalisé.',
    },
    {
      category: 'Retours',
      question: 'Quelle est votre politique de retour ?',
      answer:
        'Vous disposez de 14 jours après réception pour retourner un produit non personnalisé. Les œuvres doivent être retournées dans leur emballage d\'origine, en parfait état. Les frais de retour sont à votre charge. Pour plus de détails, consultez nos <a routerLink="/legal/terms" class="text-blue-600 hover:underline">CGV</a>.',
    },
    {
      category: 'Retours',
      question: 'Comment faire un retour ?',
      answer:
        'Contactez notre service client à <a href="mailto:contact@art-shop.com" class="text-blue-600 hover:underline">contact@art-shop.com</a> en précisant votre numéro de commande. Nous vous enverrons les instructions de retour et l\'adresse d\'envoi.',
    },
    {
      category: 'Retours',
      question: 'Sous quel délai suis-je remboursé ?',
      answer:
        'Une fois le retour reçu et contrôlé, le remboursement est effectué sous 5 à 7 jours ouvrés sur votre moyen de paiement initial.',
    },
  ];

  filteredFaqs = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'Toutes') {
      return this.faqs;
    }
    return this.faqs.filter((f) => f.category === cat);
  });

  toggle(question: string): void {
    const current = new Set(this.openItems());
    if (current.has(question)) {
      current.delete(question);
    } else {
      current.add(question);
    }
    this.openItems.set(current);
  }

  isOpen(question: string): boolean {
    return this.openItems().has(question);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionPlan, SubscriptionTerm } from '../../models/subscription.model';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { KeyClickDirective } from '../../../../shared/directives/appKeyClick.directive';

@Component({
  selector: 'app-plan-detail-modal',
  standalone: true,
  imports: [CommonModule, PricePipe, KeyClickDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Détails de l'abonnement"
    >
      <!-- Overlay focusable + a11y: enter/space via appKeyClick -->
      <div
        class="absolute inset-0 bg-black/40"
        role="button"
        tabindex="0"
        aria-label="Fermer la fenêtre"
        appKeyClick
        (click)="closed.emit()"
      ></div>

      <div
        #panel
        class="relative z-10 w-[min(100%-1rem,760px)] rounded-2xl bg-white p-6 shadow-lg outline-none"
        tabindex="-1"
      >
        <header class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-semibold">{{ plan.name }}</h2>
            <p class="text-sm text-muted-foreground">{{ plan.description }}</p>
          </div>
          <button
            type="button"
            class="rounded-lg p-2 hover:bg-gray-100 focus:outline-none focus-visible:ring"
            aria-label="Fermer"
            (click)="closed.emit()"
          >
            ✕
          </button>
        </header>

        <div class="mt-4 grid gap-6 md:grid-cols-2">
          <section>
            <div *ngIf="term === 'monthly'; else annual" class="text-3xl font-bold">
              {{ plan.monthlyPrice | price }}
              <span class="text-sm text-muted-foreground">/mois</span>
            </div>
            <ng-template #annual>
              <div class="text-3xl font-bold">
                {{ plan.annualPrice | price }}
                <span class="text-sm text-muted-foreground">/an</span>
              </div>
              <p class="text-sm text-emerald-700 mt-1">
                ≈ {{ averageAnnualMonthlyPrice | price }} / mois
                <span *ngIf="plan.monthsOfferedOnAnnual > 0" class="ml-1">
                  — {{ 12 - plan.monthsOfferedOnAnnual }}/12 facturés
                </span>
              </p>
            </ng-template>

            <div
              class="mt-4 inline-flex items-center gap-2 rounded-xl border px-2 py-1"
              role="group"
              aria-label="Choisir la facturation"
            >
              <button
                class="px-3 py-1.5 rounded-lg focus:outline-none focus-visible:ring"
                [class.bg-gray-900]="term === 'monthly'"
                [class.text-white]="term === 'monthly'"
                (click)="termChange.emit('monthly')"
              >
                Mensuel
              </button>
              <button
                class="px-3 py-1.5 rounded-lg focus:outline-none focus-visible:ring"
                [class.bg-gray-900]="term === 'annual'"
                [class.text-white]="term === 'annual'"
                (click)="termChange.emit('annual')"
              >
                Annuel
              </button>
            </div>

            <div class="mt-3">
              <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                Multiplicateur fidélité x{{ plan.loyaltyMultiplier }}
              </span>
              <p class="mt-2 text-sm text-muted-foreground">
                Plafond points bonus / mois :
                <strong *ngIf="plan.monthlyPointsCap > 0">{{ plan.monthlyPointsCap }}</strong>
                <strong *ngIf="plan.monthlyPointsCap === 0">Illimité</strong>
              </p>
            </div>
          </section>

          <section>
            <h3 class="font-medium">Avantages inclus</h3>
            <ul class="mt-2 space-y-1 text-sm">
              <li *ngFor="let perk of plan.perksFull" class="flex items-start gap-2">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-gray-900"></span>
                <span>{{ perk }}</span>
              </li>
            </ul>

            <div class="mt-4">
              <h3 class="font-medium">FAQ rapide</h3>
              <ul class="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Un seul abonnement actif par compte.</li>
                <li>• Le multiplicateur s’applique aux nouvelles commandes (pas rétroactif).</li>
                <li>• Vous pouvez basculer vers un autre plan plus tard.</li>
              </ul>
            </div>
          </section>
        </div>

        <footer class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-xl border px-4 py-2 hover:bg-gray-50 focus:outline-none focus-visible:ring"
            (click)="closed.emit()"
          >
            Annuler
          </button>

          <!-- Étape 3 : Ajouter au panier -->
          <button
            type="button"
            class="rounded-xl bg-gray-900 text-white px-4 py-2 font-medium hover:opacity-90 focus:outline-none focus-visible:ring"
            (click)="addToCart.emit({ planId: plan.id, term })"
          >
            Ajouter au panier
          </button>
        </footer>
      </div>
    </div>
  `,
})
export class PlanDetailModalComponent implements OnInit {
  @Input({ required: true }) plan!: SubscriptionPlan;
  @Input({ required: true }) term!: SubscriptionTerm;
  @Input({ required: true }) averageAnnualMonthlyPrice!: number;

  // ⚠️ a11y : éviter un nom d’événement DOM natif
  @Output() closed = new EventEmitter<void>();
  @Output() termChange = new EventEmitter<SubscriptionTerm>();

  // Nouveau : CTA Panier
  @Output() addToCart = new EventEmitter<{ planId: number; term: SubscriptionTerm }>();

  @ViewChild('panel') panelRef!: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    setTimeout(() => this.panelRef?.nativeElement?.focus(), 0);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closed.emit();
  }
}

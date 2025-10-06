// src/app/features/admin/pages/edit-format.page.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormatFormComponent } from '../components/formats/format-form.component';
import { FormatService } from '../../catalog/services/format.service';
import type { PrintFormat } from '../../catalog/models/print-format.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-edit-format-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatFormComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      <!-- Header avec dégradé violet -->
      <div class="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 shadow-xl">
        <div class="max-w-5xl mx-auto px-6 py-8">
          <!-- Breadcrumb -->
          <nav class="text-sm text-purple-100 mb-4 flex items-center gap-2">
            <a
              routerLink="/admin/dashboard"
              class="hover:text-white transition-colors flex items-center gap-1"
            >
              <i class="fa-solid fa-home text-xs"></i>
              Dashboard
            </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <a routerLink="/admin/formats" class="hover:text-white transition-colors"> Formats </a>
            <i class="fa-solid fa-chevron-right text-xs"></i>
            <span class="text-white font-medium">Édition</span>
          </nav>

          <!-- Titre -->
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"
            >
              <i class="fa-solid fa-ruler-combined text-3xl text-white"></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white mb-1">
                Éditer : {{ format()?.name || 'Format' }}
              </h1>
              <p class="text-purple-100">Modifiez les informations du format</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu -->
      <div class="max-w-5xl mx-auto px-6 py-8" *ngIf="loaded(); else loadingTpl">
        <app-format-form
          *ngIf="format()"
          [initial]="format()"
          submitLabel="Mettre à jour"
          (save)="onSave($event)"
          (formCancel)="onCancel()"
        ></app-format-form>
      </div>

      <ng-template #loadingTpl>
        <div class="max-w-5xl mx-auto px-6 py-24 text-center text-gray-500">Chargement…</div>
      </ng-template>
    </div>
  `,
})
export class EditFormatPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(FormatService);
  private toast = inject(ToastService);

  format = signal<PrintFormat | null>(null);
  loaded = signal(false);

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.router.navigate(['/admin/formats']);
      return;
    }
    const f = await this.svc.getById(id);
    if (!f) {
      this.toast.error('Format introuvable');
      this.router.navigate(['/admin/formats']);
      return;
    }
    this.format.set(f);
    this.loaded.set(true);
  }

  async onSave(payload: Omit<PrintFormat, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const current = this.format();
    if (!current) return;
    try {
      const finalPayload = {
        ...payload,
        slug: payload.slug?.trim() || this.svc.slugify(payload.name),
      };
      await this.svc.update(current.id, finalPayload);
      this.toast.success('Format mis à jour');
      this.router.navigate(['/admin/formats']);
    } catch {
      this.toast.error('Mise à jour impossible');
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/formats']);
  }
}

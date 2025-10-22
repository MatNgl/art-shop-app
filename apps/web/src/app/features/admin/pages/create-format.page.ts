// src/app/features/admin/pages/create-format.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormatFormComponent } from '../components/formats/format-form.component';
import { FormatService } from '../../catalog/services/format.service';
import type { PrintFormat } from '../../catalog/models/print-format.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-create-format-page',
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
            <span class="text-white font-medium">Nouveau</span>
          </nav>

          <!-- Titre -->
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"
            >
              <i class="fa-solid fa-ruler-combined text-3xl text-white"></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white mb-1">Nouveau format</h1>
              <p class="text-purple-100">Ajoutez un format d'impression</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu -->
      <div class="max-w-5xl mx-auto px-6 py-8">
        <app-format-form
          [initial]="null"
          submitLabel="Créer"
          (save)="onSave($event)"
          (formCancel)="onCancel()"
        ></app-format-form>
      </div>
    </div>
  `,
})
export class CreateFormatPage {
  private svc = inject(FormatService);
  private toast = inject(ToastService);
  private router = inject(Router);

  async onSave(payload: Omit<PrintFormat, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const finalPayload = {
        ...payload,
        slug: payload.slug?.trim() || this.svc.slugify(payload.name),
      };
      await this.svc.create(finalPayload);
      this.toast.success('Format créé');
      this.router.navigate(['/admin/formats']);
    } catch {
      this.toast.error('Création impossible');
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/formats']);
  }
}

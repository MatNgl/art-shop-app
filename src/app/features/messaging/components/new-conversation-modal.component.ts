import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../auth/services/auth';
import { AdminMessagingService } from '../services/admin-messaging.service';

@Component({
  selector: 'app-new-conversation-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 z-40"
        role="button"
        tabindex="0"
        (click)="close()"
        (keydown.escape)="close()"
        (keydown.enter)="close()"
        aria-label="Fermer la modal"
      ></div>

      <!-- Modal -->
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white rounded-xl shadow-2xl w-full max-w-md"
            role="dialog"
            tabindex="0"
            (click)="$event.stopPropagation()"
            (keydown.enter)="$event.stopPropagation()"
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-bold text-gray-900">
                <i class="fa-solid fa-plus-circle text-blue-600 mr-2"></i>
                Nouvelle conversation
              </h2>
              <button
                (click)="close()"
                class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <!-- Form -->
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
              <!-- Participants -->
              <div>
                <div class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fa-solid fa-users mr-1"></i>
                  Sélectionner les participants
                </div>
                <div class="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  @if (availableAdmins().length === 0) {
                    <p class="text-sm text-gray-500 text-center py-4">
                      Aucun autre administrateur disponible
                    </p>
                  } @else {
                    @for (admin of availableAdmins(); track admin.id) {
                      <label
                        class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        [class.bg-blue-50]="selectedParticipants().includes(admin.id)"
                      >
                        <input
                          type="checkbox"
                          [value]="admin.id"
                          [checked]="selectedParticipants().includes(admin.id)"
                          (change)="toggleParticipant(admin.id, $event)"
                          class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div class="flex items-center gap-2 flex-1">
                          <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                            {{ getInitials(admin.firstName, admin.lastName) }}
                          </div>
                          <span class="text-sm text-gray-900">
                            {{ admin.firstName }} {{ admin.lastName }}
                          </span>
                        </div>
                      </label>
                    }
                  }
                </div>
                @if (selectedParticipants().length > 0) {
                  <p class="mt-2 text-xs text-gray-600">
                    {{ selectedParticipants().length }} participant(s) sélectionné(s)
                  </p>
                }
              </div>

              <!-- Initial message (optional) -->
              <div>
                <label for="conv-message" class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fa-solid fa-message mr-1"></i>
                  Premier message (optionnel)
                </label>
                <textarea
                  id="conv-message"
                  formControlName="initialMessage"
                  rows="3"
                  placeholder="Commencer la discussion..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  (click)="close()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  [disabled]="selectedParticipants().length === 0"
                  class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i class="fa-solid fa-check mr-2"></i>
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [],
})
export class NewConversationModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly messagingService = inject(AdminMessagingService);

  @Output() conversationCreated = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  isOpen = signal(false);
  selectedParticipants = signal<number[]>([]);
  availableAdmins = signal<{id: number; firstName: string; lastName: string; role: string}[]>([]);

  form = this.fb.group({
    initialMessage: [''],
  });

  constructor() {
    // Charger les admins au démarrage
    this.loadAdmins();
  }

  private async loadAdmins(): Promise<void> {
    try {
      const currentUserId = this.authService.currentUser$()?.id;
      const users = await this.authService.getAllUsers();
      const admins = users.filter(u => u.role === 'admin' && u.id !== currentUserId);
      this.availableAdmins.set(admins);
    } catch (error) {
      console.error('Erreur chargement admins:', error);
      this.availableAdmins.set([]);
    }
  }

  open(): void {
    this.isOpen.set(true);
    this.form.reset();
    this.selectedParticipants.set([]);
  }

  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
  }

  toggleParticipant(adminId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedParticipants.update(ids => [...ids, adminId]);
    } else {
      this.selectedParticipants.update(ids => ids.filter(id => id !== adminId));
    }
  }

  getInitials(firstName: string, lastName: string): string {
    return (firstName[0] + lastName[0]).toUpperCase();
  }

  onSubmit(): void {
    const participantIds = this.selectedParticipants();
    if (participantIds.length === 0) {
      return;
    }

    const values = this.form.value;
    const conversation = this.messagingService.createConversation(
      participantIds,
      values.initialMessage || undefined
    );

    this.conversationCreated.emit(conversation.id);
    this.close();
  }
}

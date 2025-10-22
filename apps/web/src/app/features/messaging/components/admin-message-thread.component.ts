import { Component, Input, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMessagingService } from '../services/admin-messaging.service';
import { AdminMessage } from '../models/admin-message.model';
import { AuthService } from '../../auth/services/auth';

@Component({
  selector: 'app-admin-message-thread',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-white">
      @if (currentConversationId()) {
        <!-- Header avec nom de la conversation -->
        <div class="flex-shrink-0 px-4 py-3 border-b bg-white">
          <h2 class="text-base font-semibold text-gray-900">
            {{ conversationTitle() }}
          </h2>
          @if (participantNames().length > 0) {
            <p class="text-xs text-gray-500 mt-0.5">
              {{ participantNames().join(', ') }}
            </p>
          }
        </div>

        <!-- Messages area -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3" #messagesContainer>
          @if (messages().length === 0) {
            <div class="flex items-center justify-center h-full text-gray-500">
              <div class="text-center">
                <i class="fa-solid fa-comments text-4xl mb-3 text-gray-300"></i>
                <p class="text-sm">Aucun message dans cette conversation</p>
                <p class="text-xs mt-1">Commencez la discussion ci-dessous</p>
              </div>
            </div>
          } @else {
            @for (message of messages(); track message.id) {
              <div
                class="flex gap-3"
                [class.flex-row-reverse]="isOwnMessage(message)"
              >
                <!-- Avatar -->
                <div
                  class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                  [class.bg-blue-600]="isOwnMessage(message)"
                  [class.bg-gray-600]="!isOwnMessage(message)"
                >
                  {{ getInitials(message.senderName) }}
                </div>

                <!-- Message bubble -->
                <div
                  class="flex-1 max-w-[70%]"
                  [class.items-end]="isOwnMessage(message)"
                >
                  <div
                    class="rounded-lg p-3"
                    [class.bg-blue-600]="isOwnMessage(message)"
                    [class.text-white]="isOwnMessage(message)"
                    [class.bg-gray-100]="!isOwnMessage(message)"
                    [class.text-gray-900]="!isOwnMessage(message)"
                  >
                    <!-- Sender name (only for others) -->
                    @if (!isOwnMessage(message)) {
                      <div class="text-xs font-semibold text-gray-700 mb-1">
                        {{ message.senderName }}
                      </div>
                    }

                    <!-- Content -->
                    <p class="text-sm whitespace-pre-wrap break-words">{{ message.content }}</p>

                    <!-- Timestamp & edited -->
                    <div
                      class="flex items-center gap-2 mt-1 text-xs"
                      [class.text-blue-200]="isOwnMessage(message)"
                      [class.text-gray-500]="!isOwnMessage(message)"
                    >
                      <span>{{ formatTime(message.createdAt) }}</span>
                      @if (message.isEdited) {
                        <span class="italic">(modifié)</span>
                      }
                    </div>
                  </div>

                  <!-- Actions (only for own messages) -->
                  @if (isOwnMessage(message) && !editingMessageId()) {
                    <div class="flex items-center justify-end gap-2 mt-1">
                      <button
                        (click)="startEdit(message)"
                        class="text-xs text-gray-500 hover:text-blue-600"
                        title="Modifier"
                      >
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button
                        (click)="deleteMessage(message.id)"
                        class="text-xs text-gray-500 hover:text-red-600"
                        title="Supprimer"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  }

                  <!-- Edit form -->
                  @if (editingMessageId() === message.id) {
                    <div class="mt-2 space-y-2">
                      <textarea
                        [(ngModel)]="editContent"
                        rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        placeholder="Modifier le message..."
                      ></textarea>
                      <div class="flex items-center justify-end gap-2">
                        <button
                          (click)="cancelEdit()"
                          class="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                        >
                          Annuler
                        </button>
                        <button
                          (click)="saveEdit()"
                          [disabled]="!editContent.trim()"
                          class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>

        <!-- Input area -->
        <div class="border-t p-4 bg-gray-50">
          <form (submit)="sendMessage($event)" class="flex gap-2">
            <textarea
              [(ngModel)]="newMessage"
              name="message"
              rows="2"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Tapez votre message..."
              (keydown.enter)="onEnter($event)"
            ></textarea>
            <button
              type="submit"
              [disabled]="!newMessage.trim()"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </form>
          <p class="text-xs text-gray-500 mt-2">
            <i class="fa-solid fa-info-circle mr-1"></i>
            Entrée pour envoyer, Maj+Entrée pour nouvelle ligne
          </p>
        </div>
      } @else {
        <!-- Empty state -->
        <div class="flex items-center justify-center h-full bg-gray-50">
          <div class="text-center text-gray-500">
            <i class="fa-solid fa-comments text-6xl mb-4 text-gray-300"></i>
            <p class="text-lg font-medium">Aucune conversation sélectionnée</p>
            <p class="text-sm mt-2">Sélectionnez une conversation ou créez-en une nouvelle</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
})
export class AdminMessageThreadComponent {
  private readonly messagingService = inject(AdminMessagingService);
  private readonly authService = inject(AuthService);

  private readonly _conversationId = signal<string | null>(null);
  readonly currentConversationId = this._conversationId.asReadonly();

  @Input() set conversationId(id: string | null) {
    this._conversationId.set(id);
    if (id) {
      this.messagingService.markConversationAsRead(id);
    }
  }

  messages = computed(() => {
    const id = this._conversationId();
    return id ? this.messagingService.getMessages(id) : [];
  });

  conversationTitle = computed(() => {
    const convId = this._conversationId();
    if (!convId) return '';
    const conversation = this.messagingService.getConversation(convId);
    if (!conversation) return '';
    return this.messagingService.getConversationDisplayTitle(conversation);
  });

  participantNames = computed(() => {
    // Pour les conversations 1-to-1, pas besoin d'afficher les participants en dessous du titre
    // car le titre est déjà le nom du participant
    return [];
  });

  newMessage = '';
  editingMessageId = signal<string | null>(null);
  editContent = '';

  constructor() {
    // Auto-scroll au dernier message
    effect(() => {
      if (this.messages().length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  isOwnMessage(message: AdminMessage): boolean {
    const currentUserId = this.authService.currentUser$()?.id;
    return message.senderId === currentUserId;
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatTime(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;

    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onEnter(event: Event): void {
    const kbEvent = event as KeyboardEvent;
    if (kbEvent.key === 'Enter' && !kbEvent.shiftKey) {
      kbEvent.preventDefault();
      const formEvent = new Event('submit');
      this.sendMessage(formEvent);
    }
  }

  sendMessage(event: Event): void {
    event.preventDefault();
    const content = this.newMessage.trim();
    const convId = this._conversationId();

    if (!content || !convId) return;

    this.messagingService.createMessage(convId, content);
    this.newMessage = '';
  }

  startEdit(message: AdminMessage): void {
    this.editingMessageId.set(message.id);
    this.editContent = message.content;
  }

  cancelEdit(): void {
    this.editingMessageId.set(null);
    this.editContent = '';
  }

  saveEdit(): void {
    const messageId = this.editingMessageId();
    const content = this.editContent.trim();

    if (messageId && content) {
      this.messagingService.editMessage(messageId, content);
      this.cancelEdit();
    }
  }

  deleteMessage(messageId: string): void {
    if (confirm('Voulez-vous vraiment supprimer ce message ?')) {
      this.messagingService.deleteMessage(messageId);
    }
  }

  private scrollToBottom(): void {
    const container = document.querySelector('app-admin-message-thread .overflow-y-auto');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}

import { Component, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMessagingService } from '../services/admin-messaging.service';
import { AdminConversation } from '../models/admin-message.model';

@Component({
  selector: 'app-admin-conversation-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-white border-r">
      <!-- Header -->
      <div class="p-3 border-b bg-gray-50">
        <div class="flex items-center gap-2 mb-2">
          <!-- Search -->
          <div class="relative flex-1">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              placeholder="Rechercher..."
              class="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            @if (searchQuery) {
              <button
                (click)="clearSearch()"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Effacer la recherche"
              >
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            }
          </div>

          <!-- Nouveau bouton -->
          <button
            (click)="onNewConversation()"
            class="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Nouvelle conversation"
          >
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>

      <!-- Conversations list -->
      <div class="flex-1 overflow-y-auto">
        @if (filteredConversations().length === 0) {
          <div class="p-8 text-center text-gray-500">
            @if (searchQuery) {
              <i class="fa-solid fa-search text-3xl mb-3 text-gray-300"></i>
              <p class="text-sm">Aucun résultat</p>
            } @else {
              <i class="fa-solid fa-inbox text-3xl mb-3 text-gray-300"></i>
              <p class="text-sm">Aucune conversation</p>
              <button
                (click)="onNewConversation()"
                class="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Créer une conversation
              </button>
            }
          </div>
        } @else {
          @for (conversation of filteredConversations(); track conversation.id) {
            <button
              (click)="selectConversation(conversation)"
              class="w-full p-4 border-b hover:bg-gray-50 transition-colors text-left"
              [class.bg-blue-50]="selectedConversationId() === conversation.id"
              [class.border-l-4]="selectedConversationId() === conversation.id"
              [class.border-l-blue-600]="selectedConversationId() === conversation.id"
            >
              <div class="flex items-start gap-3">
                <!-- Avatar/Icon -->
                <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  @if (conversation.participants.length === 2) {
                    <i class="fa-solid fa-user"></i>
                  } @else {
                    <i class="fa-solid fa-users"></i>
                  }
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-1 flex-1 min-w-0">
                      <h3 class="text-sm font-semibold text-gray-900 truncate">
                        {{ getConversationTitle(conversation) }}
                      </h3>
                      @if (conversation.isPinned) {
                        <i class="fa-solid fa-thumbtack text-blue-600 text-xs flex-shrink-0"></i>
                      }
                    </div>
                    @if (conversation.unreadCount > 0) {
                      <span class="flex-shrink-0 ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                        {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
                      </span>
                    }
                  </div>

                  @if (conversation.lastMessage) {
                    <p class="text-xs text-gray-600 truncate mb-1">
                      <span class="font-medium">{{ conversation.lastMessage.senderName }}:</span>
                      {{ conversation.lastMessage.content }}
                    </p>
                  }

                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">
                      {{ formatDate(conversation.lastMessageAt) }}
                    </span>
                    <!-- Actions menu -->
                    <button
                      (click)="openMenu(conversation.id, $event)"
                      class="p-1 hover:bg-gray-200 rounded"
                      title="Options"
                    >
                      <i class="fa-solid fa-ellipsis-vertical text-xs text-gray-400"></i>
                    </button>
                  </div>
                </div>
              </div>
            </button>
          }
        }
      </div>

      <!-- Context menu -->
      @if (menuConversationId()) {
        <div
          class="fixed inset-0 z-10"
          role="button"
          tabindex="0"
          (click)="closeMenu()"
          (keydown.escape)="closeMenu()"
          (keydown.enter)="closeMenu()"
          aria-label="Fermer le menu"
        ></div>
        <div
          class="absolute z-20 bg-white rounded-lg shadow-lg border py-1 min-w-[150px]"
          [style.top.px]="menuPosition().y"
          [style.left.px]="menuPosition().x"
        >
          <button
            (click)="togglePin(menuConversationId()!)"
            class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <i class="fa-solid" [class.fa-thumbtack]="!isMenuConversationPinned()" [class.fa-thumbtack-slash]="isMenuConversationPinned()"></i>
            {{ isMenuConversationPinned() ? 'Désépingler' : 'Épingler' }}
          </button>
          <button
            (click)="deleteConversation(menuConversationId()!)"
            class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <i class="fa-solid fa-trash"></i>
            Supprimer
          </button>
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
export class AdminConversationListComponent {
  private readonly messagingService = inject(AdminMessagingService);

  @Output() conversationSelected = new EventEmitter<string>();
  @Output() newConversation = new EventEmitter<void>();

  searchQuery = '';
  selectedConversationId = signal<string | null>(null);
  menuConversationId = signal<string | null>(null);
  menuPosition = signal({ x: 0, y: 0 });

  conversations = computed(() => this.messagingService.getUserConversations());

  filteredConversations = computed(() => {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.conversations();
    return this.messagingService.searchConversations(query);
  });

  onSearch(): void {
    // La recherche est déjà gérée par le computed
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  selectConversation(conversation: AdminConversation): void {
    this.selectedConversationId.set(conversation.id);
    this.conversationSelected.emit(conversation.id);
    this.closeMenu();
  }

  onNewConversation(): void {
    this.newConversation.emit();
  }

  openMenu(conversationId: string, event: Event): void {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.menuConversationId.set(conversationId);
    this.menuPosition.set({
      x: rect.left - 150,
      y: rect.bottom + 5,
    });
  }

  closeMenu(): void {
    this.menuConversationId.set(null);
  }

  isMenuConversationPinned(): boolean {
    const id = this.menuConversationId();
    if (!id) return false;
    const conversation = this.conversations().find(c => c.id === id);
    return conversation?.isPinned ?? false;
  }

  togglePin(conversationId: string): void {
    this.messagingService.togglePin(conversationId);
    this.closeMenu();
  }

  deleteConversation(conversationId: string): void {
    if (confirm('Voulez-vous vraiment supprimer cette conversation ? Tous les messages seront supprimés.')) {
      this.messagingService.deleteConversation(conversationId);
      if (this.selectedConversationId() === conversationId) {
        this.selectedConversationId.set(null);
        this.conversationSelected.emit('');
      }
    }
    this.closeMenu();
  }

  getConversationTitle(conversation: AdminConversation): string {
    return this.messagingService.getConversationDisplayTitle(conversation);
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }
}

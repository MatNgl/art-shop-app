import { Component, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminConversationListComponent } from '../components/admin-conversation-list.component';
import { AdminMessageThreadComponent } from '../components/admin-message-thread.component';
import { NewConversationModalComponent } from '../components/new-conversation-modal.component';

@Component({
  selector: 'app-messaging-page',
  standalone: true,
  imports: [
    CommonModule,
    AdminConversationListComponent,
    AdminMessageThreadComponent,
    NewConversationModalComponent,
  ],
  template: `
    <div class="flex bg-gray-50" style="height: calc(100vh - 4rem);">
      <!-- Colonne gauche: Liste conversations - TOUJOURS VISIBLE -->
      <div class="w-80 flex-shrink-0 border-r bg-white">
        <app-admin-conversation-list
          (conversationSelected)="onConversationSelected($event)"
          (newConversation)="openNewConversationModal()"
        />
      </div>

      <!-- Colonne droite: Thread messages -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <app-admin-message-thread
          [conversationId]="selectedConversationId()"
        />
      </div>
    </div>

    <!-- Modal nouvelle conversation -->
    <app-new-conversation-modal
      #newConversationModal
      (conversationCreated)="onConversationCreated($event)"
    />
  `,
  styles: [],
})
export class MessagingPage {
  @ViewChild('newConversationModal') newConversationModal!: NewConversationModalComponent;

  selectedConversationId = signal<string | null>(null);

  onConversationSelected(conversationId: string): void {
    this.selectedConversationId.set(conversationId);
  }

  openNewConversationModal(): void {
    this.newConversationModal.open();
  }

  onConversationCreated(conversationId: string): void {
    this.selectedConversationId.set(conversationId);
  }
}

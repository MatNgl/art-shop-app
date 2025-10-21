import { Injectable, inject, signal, computed } from '@angular/core';
import { AdminMessage, AdminConversation } from '../models/admin-message.model';
import { AuthService } from '../../auth/services/auth';

const CONVERSATIONS_KEY = 'admin_conversations';
const MESSAGES_KEY = 'admin_messages';

@Injectable({ providedIn: 'root' })
export class AdminMessagingService {
  private readonly authService = inject(AuthService);

  private readonly _conversations = signal<AdminConversation[]>(this.loadConversations());
  private readonly _messages = signal<AdminMessage[]>(this.loadMessages());

  readonly conversations = this._conversations.asReadonly();
  readonly messages = this._messages.asReadonly();

  readonly unreadCount = computed(() => {
    const currentUserId = this.authService.currentUser$()?.id;
    if (!currentUserId) return 0;

    return this._conversations()
      .filter(c => c.participants.includes(currentUserId))
      .reduce((sum, c) => sum + c.unreadCount, 0);
  });

  // ========== CONVERSATIONS ==========

  /**
   * Créer une conversation avec plusieurs participants (ou vérifier si elle existe déjà)
   * Ne permet pas de créer plusieurs conversations avec exactement les mêmes participants
   */
  createConversation(participantIds: number[], initialMessage?: string): AdminConversation {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) throw new Error('User not authenticated');

    // Construire la liste complète des participants (user actuel + sélectionnés)
    const allParticipants = [currentUser.id, ...participantIds.filter(id => id !== currentUser.id)]
      .sort((a, b) => a - b); // Trier pour faciliter la comparaison

    // Vérifier si une conversation avec exactement ces participants existe déjà
    const existing = this.findConversationWithParticipants(allParticipants);
    if (existing) {
      // Si elle existe, on la retourne (pas de doublon)
      return existing;
    }

    // Créer une nouvelle conversation
    const conversationId = this.generateId();
    const now = new Date().toISOString();

    const conversation: AdminConversation = {
      id: conversationId,
      participants: allParticipants,
      lastMessageAt: now,
      unreadCount: 0,
      isPinned: false,
      createdAt: now,
    };

    // Ajouter le message initial si fourni
    if (initialMessage && initialMessage.trim()) {
      const message = this.createMessage(conversationId, initialMessage.trim());
      conversation.lastMessage = message;
    }

    this._conversations.update(convs => [conversation, ...convs]);
    this.saveConversations();

    return conversation;
  }

  /**
   * Trouver une conversation existante avec exactement ces participants
   */
  findConversationWithParticipants(participantIds: number[]): AdminConversation | undefined {
    const sortedIds = [...participantIds].sort((a, b) => a - b);

    return this._conversations().find(c => {
      const convParticipants = [...c.participants].sort((a, b) => a - b);

      // Vérifier que les deux tableaux ont la même longueur et les mêmes éléments
      return convParticipants.length === sortedIds.length &&
        convParticipants.every((id, index) => id === sortedIds[index]);
    });
  }

  /**
   * Récupérer toutes les conversations de l'utilisateur courant
   */
  getUserConversations(): AdminConversation[] {
    const currentUserId = this.authService.currentUser$()?.id;
    if (!currentUserId) return [];

    return this._conversations()
      .filter(c => c.participants.includes(currentUserId))
      .sort((a, b) => {
        // Épinglées en premier
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Puis par date du dernier message
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
  }

  /**
   * Récupérer une conversation par ID
   */
  getConversation(conversationId: string): AdminConversation | undefined {
    return this._conversations().find(c => c.id === conversationId);
  }

  /**
   * Épingler/désépingler une conversation
   */
  togglePin(conversationId: string): void {
    this._conversations.update(convs =>
      convs.map(c =>
        c.id === conversationId ? { ...c, isPinned: !c.isPinned } : c
      )
    );
    this.saveConversations();
  }

  /**
   * Supprimer une conversation (et tous ses messages)
   */
  deleteConversation(conversationId: string): void {
    this._conversations.update(convs => convs.filter(c => c.id !== conversationId));
    this._messages.update(msgs => msgs.filter(m => m.conversationId !== conversationId));
    this.saveConversations();
    this.saveMessages();
  }

  /**
   * Marquer une conversation comme lue
   */
  markConversationAsRead(conversationId: string): void {
    this._conversations.update(convs =>
      convs.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
    this.saveConversations();
  }

  // ========== MESSAGES ==========

  /**
   * Créer un nouveau message
   */
  createMessage(conversationId: string, content: string): AdminMessage {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) throw new Error('User not authenticated');

    const now = new Date().toISOString();
    const message: AdminMessage = {
      id: this.generateId(),
      conversationId,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`,
      content,
      createdAt: now,
      isEdited: false,
    };

    this._messages.update(msgs => [...msgs, message]);
    this.saveMessages();

    // Mettre à jour la conversation
    this._conversations.update(convs =>
      convs.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: message,
            lastMessageAt: now,
            // Incrémenter unreadCount pour les autres participants
            unreadCount: c.participants.includes(currentUser.id) ? c.unreadCount : c.unreadCount + 1,
          };
        }
        return c;
      })
    );
    this.saveConversations();

    return message;
  }

  /**
   * Récupérer les messages d'une conversation
   */
  getMessages(conversationId: string): AdminMessage[] {
    return this._messages()
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Modifier un message
   */
  editMessage(messageId: string, newContent: string): void {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) return;

    this._messages.update(msgs =>
      msgs.map(m => {
        if (m.id === messageId && m.senderId === currentUser.id) {
          return {
            ...m,
            content: newContent,
            isEdited: true,
            editedAt: new Date().toISOString(),
          };
        }
        return m;
      })
    );
    this.saveMessages();

    // Mettre à jour lastMessage si c'est le dernier message
    this._conversations.update(convs =>
      convs.map(c => {
        if (c.lastMessage?.id === messageId) {
          const updatedMessage = this._messages().find(m => m.id === messageId);
          return updatedMessage ? { ...c, lastMessage: updatedMessage } : c;
        }
        return c;
      })
    );
    this.saveConversations();
  }

  /**
   * Supprimer un message
   */
  deleteMessage(messageId: string): void {
    const currentUser = this.authService.currentUser$();
    if (!currentUser) return;

    const message = this._messages().find(m => m.id === messageId);
    if (!message || message.senderId !== currentUser.id) return;

    this._messages.update(msgs => msgs.filter(m => m.id !== messageId));
    this.saveMessages();

    // Mettre à jour lastMessage si nécessaire
    this._conversations.update(convs =>
      convs.map(c => {
        if (c.lastMessage?.id === messageId) {
          const conversationMessages = this.getMessages(c.id);
          const newLastMessage = conversationMessages[conversationMessages.length - 1];
          return {
            ...c,
            lastMessage: newLastMessage,
            lastMessageAt: newLastMessage?.createdAt || c.createdAt,
          };
        }
        return c;
      })
    );
    this.saveConversations();
  }

  /**
   * Rechercher dans les messages
   */
  searchMessages(query: string): AdminMessage[] {
    const lowerQuery = query.toLowerCase();
    return this._messages().filter(m =>
      m.content.toLowerCase().includes(lowerQuery) ||
      m.senderName.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Rechercher dans les conversations
   */
  searchConversations(query: string): AdminConversation[] {
    const lowerQuery = query.toLowerCase();
    const currentUserId = this.authService.currentUser$()?.id;
    if (!currentUserId) return [];

    return this._conversations().filter(c =>
      c.participants.includes(currentUserId) &&
      (c.title?.toLowerCase().includes(lowerQuery) ||
        c.lastMessage?.content.toLowerCase().includes(lowerQuery) ||
        c.lastMessage?.senderName.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Obtenir le titre d'affichage d'une conversation
   * - Si titre personnalisé: l'utiliser
   * - Sinon: générer à partir des noms des autres participants (via messages ou IDs)
   */
  getConversationDisplayTitle(conversation: AdminConversation): string {
    const currentUserId = this.authService.currentUser$()?.id;
    if (!currentUserId) return conversation.title || 'Conversation';

    // Si un titre personnalisé existe, l'utiliser
    if (conversation.title) return conversation.title;

    // Récupérer les noms à partir des messages existants
    const messages = this.getMessages(conversation.id);
    const currentUser = this.authService.currentUser$();
    const currentUserName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '';

    const participantNames = new Set<string>();
    messages.forEach(m => {
      if (m.senderName !== currentUserName) {
        participantNames.add(m.senderName);
      }
    });

    const names = Array.from(participantNames);

    // Si on a trouvé des noms via les messages
    if (names.length > 0) {
      if (names.length === 1) {
        return names[0];
      } else if (names.length === 2) {
        return `${names[0]}, ${names[1]}`;
      } else {
        // 3+ participants: afficher les 2 premiers + "et X autre(s)"
        return `${names[0]}, ${names[1]} et ${names.length - 2} autre(s)`;
      }
    }

    // Si pas de messages (conversation nouvelle), afficher "Nouvelle conversation"
    // ou le nombre de participants
    const otherParticipantsCount = conversation.participants.length - 1;
    if (otherParticipantsCount === 1) {
      return 'Discussion';
    } else {
      return `Groupe (${otherParticipantsCount} participants)`;
    }
  }

  // ========== PRIVATE HELPERS ==========

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadConversations(): AdminConversation[] {
    try {
      const stored = localStorage.getItem(CONVERSATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveConversations(): void {
    try {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(this._conversations()));
    } catch (e) {
      console.error('Erreur sauvegarde conversations:', e);
    }
  }

  private loadMessages(): AdminMessage[] {
    try {
      const stored = localStorage.getItem(MESSAGES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveMessages(): void {
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(this._messages()));
    } catch (e) {
      console.error('Erreur sauvegarde messages:', e);
    }
  }
}

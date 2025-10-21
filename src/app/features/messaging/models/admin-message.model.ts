export interface AdminMessage {
  id: string;
  conversationId: string;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: string;
  isEdited: boolean;
  editedAt?: string;
}

export interface AdminConversation {
  id: string;
  title?: string;
  participants: number[]; // admin IDs (always 2 for 1-to-1 conversations)
  lastMessage?: AdminMessage;
  lastMessageAt: string;
  unreadCount: number;
  isPinned: boolean;
  createdAt: string;
}

export interface ConversationWithParticipantNames extends AdminConversation {
  participantNames: string[];
}

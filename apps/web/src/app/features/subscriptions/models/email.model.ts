export type EmailType =
  | 'subscription_confirmation'
  | 'subscription_canceled'
  | 'box_shipping_reminder'
  | 'payment_failed'
  | 'plan_changed';

export interface EmailTemplate {
  type: EmailType;
  subject: string;
  htmlBody: string;
  textBody: string;
  /** Liste des variables disponibles, par ex: {{userName}}, {{planName}} */
  variables: string[];
}

export interface EmailLog {
  id: string;
  userId: number;
  userEmail: string;
  type: EmailType;
  subject: string;
  sentAt: string;
  status: 'sent' | 'failed';
  error?: string;
  metadata?: Record<string, unknown>;
}

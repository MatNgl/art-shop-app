import { Injectable, signal } from '@angular/core';
import type { EmailTemplate, EmailLog, EmailType } from '../models/email.model';

const STORAGE_KEY_EMAIL_LOGS = 'subscription_email_logs';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private readonly _emailLogs = signal<EmailLog[]>(this.loadEmailLogs());

  readonly emailLogs = this._emailLogs.asReadonly();

  /**
   * Templates d'emails par défaut
   */
  private readonly templates: Record<EmailType, EmailTemplate> = {
    subscription_confirmation: {
      type: 'subscription_confirmation',
      subject: 'Bienvenue dans votre abonnement {{planName}} !',
      variables: ['userName', 'planName', 'multiplier', 'nextBillingDate'],
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8b5cf6;">Bienvenue {{userName}} !</h1>
          <p>Votre abonnement <strong>{{planName}}</strong> est maintenant actif.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Vos avantages :</h3>
            <ul>
              <li>Multiplicateur de fidélité : <strong>×{{multiplier}}</strong></li>
              <li>Prochaine facturation : <strong>{{nextBillingDate}}</strong></li>
            </ul>
          </div>
          <p>Merci de votre confiance !</p>
          <p style="color: #6b7280; font-size: 12px;">L'équipe Art Shop</p>
        </div>
      `,
      textBody: `
Bienvenue {{userName}} !

Votre abonnement {{planName}} est maintenant actif.

Vos avantages :
- Multiplicateur de fidélité : ×{{multiplier}}
- Prochaine facturation : {{nextBillingDate}}

Merci de votre confiance !
L'équipe Art Shop
      `,
    },

    subscription_canceled: {
      type: 'subscription_canceled',
      subject: 'Votre abonnement a été annulé',
      variables: ['userName', 'planName', 'endDate'],
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Abonnement annulé</h1>
          <p>Bonjour {{userName}},</p>
          <p>Votre abonnement <strong>{{planName}}</strong> a été annulé.</p>
          <p>Il restera actif jusqu'au <strong>{{endDate}}</strong>.</p>
          <p>Nous espérons vous revoir bientôt !</p>
          <p style="color: #6b7280; font-size: 12px;">L'équipe Art Shop</p>
        </div>
      `,
      textBody: `
Abonnement annulé

Bonjour {{userName}},

Votre abonnement {{planName}} a été annulé.
Il restera actif jusqu'au {{endDate}}.

Nous espérons vous revoir bientôt !
L'équipe Art Shop
      `,
    },

    box_shipping_reminder: {
      type: 'box_shipping_reminder',
      subject: 'Votre box mensuelle arrive bientôt !',
      variables: ['userName', 'planName', 'month', 'productCount'],
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8b5cf6;">📦 Votre box arrive !</h1>
          <p>Bonjour {{userName}},</p>
          <p>Votre box mensuelle <strong>{{planName}}</strong> pour le mois de <strong>{{month}}</strong> est en cours de préparation.</p>
          <p>Elle contient <strong>{{productCount}} produit(s)</strong> sélectionnés spécialement pour vous.</p>
          <p>Vous la recevrez prochainement !</p>
          <p style="color: #6b7280; font-size: 12px;">L'équipe Art Shop</p>
        </div>
      `,
      textBody: `
📦 Votre box arrive !

Bonjour {{userName}},

Votre box mensuelle {{planName}} pour le mois de {{month}} est en cours de préparation.
Elle contient {{productCount}} produit(s) sélectionnés spécialement pour vous.

Vous la recevrez prochainement !
L'équipe Art Shop
      `,
    },

    payment_failed: {
      type: 'payment_failed',
      subject: '⚠️ Échec du paiement de votre abonnement',
      variables: ['userName', 'planName', 'amount', 'retryDate'],
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">⚠️ Échec du paiement</h1>
          <p>Bonjour {{userName}},</p>
          <p>Le paiement de <strong>{{amount}}</strong> pour votre abonnement <strong>{{planName}}</strong> a échoué.</p>
          <p>Nous réessayerons automatiquement le <strong>{{retryDate}}</strong>.</p>
          <p>Si le problème persiste, veuillez mettre à jour vos informations de paiement dans votre compte.</p>
          <p style="color: #6b7280; font-size: 12px;">L'équipe Art Shop</p>
        </div>
      `,
      textBody: `
⚠️ Échec du paiement

Bonjour {{userName}},

Le paiement de {{amount}} pour votre abonnement {{planName}} a échoué.
Nous réessayerons automatiquement le {{retryDate}}.

Si le problème persiste, veuillez mettre à jour vos informations de paiement dans votre compte.
L'équipe Art Shop
      `,
    },

    plan_changed: {
      type: 'plan_changed',
      subject: "Votre plan d'abonnement a été modifié",
      variables: ['userName', 'oldPlanName', 'newPlanName', 'effectiveDate'],
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8b5cf6;">Plan modifié</h1>
          <p>Bonjour {{userName}},</p>
          <p>Votre plan d'abonnement a été modifié avec succès.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Ancien plan :</strong> {{oldPlanName}}</p>
            <p><strong>Nouveau plan :</strong> {{newPlanName}}</p>
            <p><strong>Effectif le :</strong> {{effectiveDate}}</p>
          </div>
          <p>Merci de votre confiance !</p>
          <p style="color: #6b7280; font-size: 12px;">L'équipe Art Shop</p>
        </div>
      `,
      textBody: `
Plan modifié

Bonjour {{userName}},

Votre plan d'abonnement a été modifié avec succès.

Ancien plan : {{oldPlanName}}
Nouveau plan : {{newPlanName}}
Effectif le : {{effectiveDate}}

Merci de votre confiance !
L'équipe Art Shop
      `,
    },
  };

  /**
   * Envoie un email (mock - enregistre dans les logs)
   */
  async sendEmail(
    userId: number,
    userEmail: string,
    type: EmailType,
    variables: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.templates[type];
      if (!template) {
        return { success: false, error: `Template ${type} introuvable` };
      }

      // Remplacer les variables dans le sujet
      let subject = template.subject;
      for (const [key, value] of Object.entries(variables)) {
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }

      // Simuler un délai d'envoi
      await this.delay(100);

      // Enregistrer dans les logs
      const log: EmailLog = {
        id: `email-${userId}-${Date.now()}`,
        userId,
        userEmail,
        type,
        subject,
        sentAt: new Date().toISOString(),
        status: 'sent',
        metadata: variables,
      };

      this._emailLogs.update((logs) => [log, ...logs]);
      this.saveEmailLogs();

      console.warn(`📧 Email envoyé : ${type} à ${userEmail}`);
      return { success: true };
    } catch (error) {
      console.error('Erreur envoi email', error);
      return { success: false, error: "Erreur lors de l'envoi" };
    }
  }

  /**
   * Récupère les logs d'emails pour un utilisateur
   */
  getLogsForUser(userId: number): EmailLog[] {
    return this._emailLogs().filter((log) => log.userId === userId);
  }

  /**
   * Récupère tous les logs d'emails
   */
  getAllLogs(): EmailLog[] {
    return this._emailLogs();
  }

  /**
   * Nettoie les logs de plus de 90 jours
   */
  cleanOldLogs(): void {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    this._emailLogs.update((logs) => logs.filter((log) => new Date(log.sentAt) > ninetyDaysAgo));
    this.saveEmailLogs();
  }

  // ========== PERSISTENCE ==========

  private loadEmailLogs(): EmailLog[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EMAIL_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveEmailLogs(): void {
    try {
      localStorage.setItem(STORAGE_KEY_EMAIL_LOGS, JSON.stringify(this._emailLogs()));
    } catch (e) {
      console.error('Erreur sauvegarde logs emails', e);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

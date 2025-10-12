import { Injectable } from '@angular/core';
import { Order, OrderItem } from '../../features/orders/models/order.model';

@Injectable({ providedIn: 'root' })
export class EmailService {
  /**
   * Génère un email HTML élégant de confirmation de commande
   * @param order La commande à confirmer
   * @returns Le HTML de l'email
   */
  generateOrderConfirmationEmail(order: Order): string {
    const itemsHtml = this.generateItemsHtml(order.items);
    const customerInfo = this.generateCustomerInfoHtml(order);

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de commande</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header p {
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .success-message {
      background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin-bottom: 30px;
    }
    .success-message h2 {
      color: #1a5f7a;
      font-size: 22px;
      margin-bottom: 8px;
    }
    .success-message p {
      color: #2c7a7b;
      font-size: 14px;
    }
    .order-number {
      background: #f7fafc;
      border-left: 4px solid #667eea;
      padding: 15px 20px;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    .order-number strong {
      color: #667eea;
      font-size: 18px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #f7fafc;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #4a5568;
      font-size: 14px;
    }
    .items-table td {
      padding: 15px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .item-title {
      font-weight: 600;
      color: #2d3748;
      font-size: 15px;
    }
    .item-variant {
      color: #718096;
      font-size: 13px;
      margin-top: 2px;
    }
    .item-qty {
      color: #718096;
      text-align: center;
    }
    .item-price {
      text-align: right;
      font-weight: 600;
      color: #2d3748;
    }
    .totals {
      background: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 15px;
    }
    .total-row.final {
      border-top: 2px solid #cbd5e0;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 20px;
      font-weight: 700;
      color: #667eea;
    }
    .customer-info {
      background: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .info-block {
      margin-bottom: 15px;
    }
    .info-block:last-child {
      margin-bottom: 0;
    }
    .info-label {
      font-weight: 600;
      color: #4a5568;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .info-value {
      color: #2d3748;
      font-size: 15px;
      line-height: 1.5;
    }
    .footer {
      background: #2d3748;
      color: white;
      padding: 30px;
      text-align: center;
    }
    .footer p {
      margin-bottom: 10px;
      opacity: 0.9;
    }
    .footer-links {
      margin-top: 15px;
    }
    .footer-links a {
      color: #90cdf4;
      text-decoration: none;
      margin: 0 10px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- En-tête avec gradient -->
    <div class="header">
      <div class="header-icon">🎨</div>
      <h1>Merci pour votre commande !</h1>
      <p>Nous sommes ravis de vous compter parmi nos clients</p>
    </div>

    <!-- Contenu principal -->
    <div class="content">
      <!-- Message de succès -->
      <div class="success-message">
        <h2>✨ Commande confirmée avec succès !</h2>
        <p>Vous allez recevoir un email de suivi dès l'expédition de vos articles.</p>
      </div>

      <!-- Numéro de commande -->
      <div class="order-number">
        <strong>Numéro de commande : ${order.id}</strong><br>
        <span style="color: #718096; font-size: 14px;">Date : ${this.formatDate(
          order.createdAt
        )}</span>
      </div>

      <!-- Articles commandés -->
      <h2 class="section-title">📦 Vos articles</h2>
      <table class="items-table">
        <thead>
          <tr>
            <th>Article</th>
            <th style="text-align: center; width: 80px;">Qté</th>
            <th style="text-align: right; width: 100px;">Prix</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Totaux -->
      <div class="totals">
        <div class="total-row">
          <span>Sous-total</span>
          <span>${this.formatPrice(order.subtotal)}</span>
        </div>
        <div class="total-row">
          <span>Frais de livraison</span>
          <span>${this.formatPrice(order.shipping)}</span>
        </div>
        <div class="total-row">
          <span>Taxes</span>
          <span>${this.formatPrice(order.taxes)}</span>
        </div>
        <div class="total-row final">
          <span>Total</span>
          <span>${this.formatPrice(order.total)}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Informations client -->
      <h2 class="section-title">👤 Informations de livraison</h2>
      ${customerInfo}

      <!-- Bouton d'action -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="#" class="cta-button">Suivre ma commande</a>
      </div>
    </div>

    <!-- Pied de page -->
    <div class="footer">
      <p>💜 Merci de faire confiance à notre boutique d'art !</p>
      <p style="font-size: 14px; opacity: 0.8;">
        Pour toute question, contactez-nous à support@artshop.com
      </p>
      <div class="footer-links">
        <a href="#">Mon compte</a> •
        <a href="#">Aide</a> •
        <a href="#">Retours</a>
      </div>
      <p style="font-size: 12px; margin-top: 20px; opacity: 0.7;">
        © ${new Date().getFullYear()} Art Shop. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Envoie l'email de confirmation (simulation pour le moment)
   * Dans un environnement de production, cela ferait appel à une API backend
   */
  async sendOrderConfirmationEmail(order: Order): Promise<void> {
    const emailHtml = this.generateOrderConfirmationEmail(order);

    // Simulation de l'envoi
    console.warn('📧 Email de confirmation généré pour:', order.customer.email);
    console.warn('HTML Email:', emailHtml);

    // Dans un environnement de production, vous appelleriez ici votre API backend
    // Exemple: await this.http.post('/api/emails/send', { to: order.customer.email, html: emailHtml }).toPromise();

    return Promise.resolve();
  }

  private generateItemsHtml(items: OrderItem[]): string {
    return items
      .map(
        (item) => `
      <tr>
        <td>
          <div class="item-title">${this.escapeHtml(item.title)}</div>
          ${
            item.variantLabel
              ? `<div class="item-variant">${this.escapeHtml(item.variantLabel)}</div>`
              : ''
          }
        </td>
        <td class="item-qty">${item.qty}</td>
        <td class="item-price">${this.formatPrice(item.unitPrice * item.qty)}</td>
      </tr>
    `
      )
      .join('');
  }

  private generateCustomerInfoHtml(order: Order): string {
    const { customer, payment } = order;

    return `
      <div class="customer-info">
        <div class="info-block">
          <div class="info-label">Nom</div>
          <div class="info-value">${this.escapeHtml(customer.firstName)} ${this.escapeHtml(
      customer.lastName
    )}</div>
        </div>

        <div class="info-block">
          <div class="info-label">Email</div>
          <div class="info-value">${this.escapeHtml(customer.email)}</div>
        </div>

        ${
          customer.phone
            ? `
        <div class="info-block">
          <div class="info-label">Téléphone</div>
          <div class="info-value">${this.escapeHtml(customer.phone)}</div>
        </div>
        `
            : ''
        }

        <div class="info-block">
          <div class="info-label">Adresse de livraison</div>
          <div class="info-value">
            ${this.escapeHtml(customer.address.street)}<br>
            ${this.escapeHtml(customer.address.zip)} ${this.escapeHtml(customer.address.city)}<br>
            ${this.escapeHtml(customer.address.country)}
          </div>
        </div>

        <div class="info-block">
          <div class="info-label">Mode de paiement</div>
          <div class="info-value">
            ${this.getPaymentMethodLabel(payment.method)}
            ${payment.last4 ? ` •••• ${payment.last4}` : ''}
            ${payment.brand ? ` (${payment.brand.toUpperCase()})` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  private formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getPaymentMethodLabel(method: 'card' | 'paypal' | 'bank'): string {
    const labels: Record<string, string> = {
      card: 'Carte bancaire',
      paypal: 'PayPal',
      bank: 'Virement bancaire',
    };
    return labels[method] || method;
  }
}

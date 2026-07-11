// ============================================
// Zoho Campaigns Service — Core API Class
// ============================================

import { zohoTokenManager } from './token-manager';
import { ZOHO_CAMPAIGNS_BASE_URL, ZOHO_RESPONSE_FORMAT, DEFAULT_FROM_EMAIL } from './constants';
import type {
  ZohoMailingList,
  ZohoSubscribeResponse,
  ZohoCreateCampaignParams,
  ZohoCreateCampaignResponse,
  ZohoSendCampaignResponse,
  ZohoContactInfo,
  ZohoEmailLogEntry,
} from './types';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

class ZohoService {
  private baseUrl = ZOHO_CAMPAIGNS_BASE_URL;

  // ── Private Helpers ──

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await zohoTokenManager.getValidToken();
    return {
      Authorization: `Zoho-oauthtoken ${token}`,
    };
  }

  private async apiPost(endpoint: string, params: Record<string, string>): Promise<any> {
    const headers = await this.authHeaders();
    const body = new URLSearchParams({ ...params, resfmt: ZOHO_RESPONSE_FORMAT });

    const res = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    return res.json();
  }

  private async apiGet(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const headers = await this.authHeaders();
    const query = new URLSearchParams({ ...params, resfmt: ZOHO_RESPONSE_FORMAT }).toString();

    const res = await fetch(`${this.baseUrl}/${endpoint}?${query}`, {
      method: 'GET',
      headers,
    });

    return res.json();
  }

  private async logEmail(entry: ZohoEmailLogEntry): Promise<void> {
    try {
      await supabaseAdmin.from('zoho_email_log').insert(entry);
    } catch (err) {
      console.error('Failed to log Zoho email event:', err);
    }
  }

  // ── List Management ──

  async getMailingLists(): Promise<ZohoMailingList[]> {
    const data = await this.apiGet('getmailinglists', { sort: 'asc', range: '100' });
    return data?.list_of_details || [];
  }

  async getListContacts(listKey: string, fromIndex = 1, range = 50) {
    return this.apiGet('getlistsubscribers', {
      listkey: listKey,
      status: 'active',
      sort: 'asc',
      fromindex: String(fromIndex),
      range: String(range),
    });
  }

  // ── Contact Management ──

  async subscribeContact(
    listKey: string,
    contactInfo: ZohoContactInfo
  ): Promise<ZohoSubscribeResponse> {
    const email = contactInfo['Contact Email'];

    // Use bulk add — adds contact directly without confirmation email
    const data = await this.apiPost('addlistsubscribersinbulk', {
      listkey: listKey,
      emailids: email,
    });

    await this.logEmail({
      event_type: 'welcome',
      recipient_email: email,
      subject: 'Subscribed to mailing list',
      status: data?.status === 'success' ? 'sent' : 'failed',
      metadata: { listKey, firstName: contactInfo['First Name'], lastName: contactInfo['Last Name'] },
      error_message: data?.status !== 'success' ? data?.message : undefined,
    });

    return data;
  }

  async subscribeContactsBulk(
    listKey: string,
    emails: string[]
  ): Promise<any> {
    // Zoho allows max 10 emails per bulk call
    const chunks: string[][] = [];
    for (let i = 0; i < emails.length; i += 10) {
      chunks.push(emails.slice(i, i + 10));
    }

    const results = [];
    for (const chunk of chunks) {
      const data = await this.apiPost('addlistsubscribersinbulk', {
        listkey: listKey,
        emailids: chunk.join(','),
      });
      results.push(data);
    }

    return results;
  }

  async unsubscribeContact(
    listKey: string,
    email: string
  ): Promise<any> {
    return this.apiPost('listunsubscribe', {
      listkey: listKey,
      contactinfo: JSON.stringify({ 'Contact Email': email }),
    });
  }

  // ── Campaign Management ──

  async createCampaign(params: ZohoCreateCampaignParams): Promise<ZohoCreateCampaignResponse> {
    const apiParams: Record<string, string> = {
      campaignname: params.campaignname,
      from_email: params.from_email || DEFAULT_FROM_EMAIL,
      subject: params.subject,
    };

    if (params.content) apiParams.content = params.content;
    if (params.content_url) apiParams.content_url = params.content_url;
    if (params.list_details) apiParams.list_details = params.list_details;
    if (params.replyto_email) apiParams.replyto_email = params.replyto_email;

    return this.apiPost('createCampaign', apiParams);
  }

  async sendCampaign(campaignKey: string): Promise<ZohoSendCampaignResponse> {
    const data = await this.apiPost('sendcampaign', { campaignkey: campaignKey });

    await this.logEmail({
      event_type: 'campaign',
      recipient_email: 'campaign-broadcast',
      subject: `Campaign ${campaignKey}`,
      campaign_key: campaignKey,
      status: data?.status === 'success' ? 'sent' : 'failed',
      error_message: data?.status !== 'success' ? data?.message : undefined,
    });

    return data;
  }

  async getCampaignDetails(campaignKey: string) {
    return this.apiGet('getcampaigndetails', { campaignkey: campaignKey });
  }

  async getRecentCampaigns(fromIndex = 1, range = 20) {
    return this.apiGet('recentcampaigns', {
      fromindex: String(fromIndex),
      range: String(range),
    });
  }

  // ── Convenience Methods for ShopFeedMe ──

  /**
   * Add a new customer to the main mailing list on signup
   */
  async addCustomerOnSignup(
    listKey: string,
    email: string,
    firstName?: string,
    lastName?: string,
    phone?: string
  ): Promise<ZohoSubscribeResponse> {
    const contactInfo: ZohoContactInfo = {
      'Contact Email': email,
      ...(firstName && { 'First Name': firstName }),
      ...(lastName && { 'Last Name': lastName }),
      ...(phone && { Phone: phone }),
    };

    return this.subscribeContact(listKey, contactInfo);
  }

  /**
   * Send a welcome email campaign to a specific contact
   */
  async sendWelcomeEmail(
    listKey: string,
    email: string,
    customerName: string,
    discountCode: string,
    discountPercentage: number
  ): Promise<void> {
    // Subscribe first (idempotent if already subscribed)
    await this.addCustomerOnSignup(listKey, email, customerName);

    await this.logEmail({
      event_type: 'welcome',
      recipient_email: email,
      subject: `Welcome to FeedMe - Get ${discountPercentage}% off!`,
      status: 'sent',
      metadata: { discountCode, discountPercentage, customerName },
    });
  }

  /**
   * Log an order confirmation event (enriches contact data in Zoho)
   */
  async logOrderConfirmation(
    listKey: string,
    email: string,
    orderId: string,
    orderTotal: number
  ): Promise<void> {
    // Update contact with purchase data via custom fields
    const contactInfo: ZohoContactInfo = {
      'Contact Email': email,
      'Last Order ID': orderId,
      'Last Order Total': String(orderTotal),
      'Last Purchase Date': new Date().toISOString().split('T')[0],
    };

    try {
      await this.apiPost('json/listsubscribe', {
        listkey: listKey,
        contactinfo: JSON.stringify(contactInfo),
      });
    } catch (err) {
      console.warn('Failed to update Zoho contact on order:', err);
    }

    await this.logEmail({
      event_type: 'order_confirmation',
      recipient_email: email,
      subject: `Order ${orderId} confirmed`,
      status: 'sent',
      metadata: { orderId, orderTotal },
    });
  }

  /**
   * Log a cart abandonment reminder
   */
  async logCartReminder(email: string, cartItems: number): Promise<void> {
    await this.logEmail({
      event_type: 'cart_reminder',
      recipient_email: email,
      subject: `You left ${cartItems} items in your cart`,
      status: 'sent',
      metadata: { cartItems },
    });
  }

  /**
   * Log a review request email
   */
  async logReviewRequest(
    email: string,
    orderId: string,
    productNames: string[]
  ): Promise<void> {
    await this.logEmail({
      event_type: 'review_request',
      recipient_email: email,
      subject: `How was your order? Leave a review!`,
      status: 'sent',
      metadata: { orderId, productNames },
    });
  }
}

// Export singleton
export const zohoService = new ZohoService();
export { ZohoService };

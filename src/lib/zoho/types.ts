// ============================================
// Zoho Campaigns API — TypeScript Types
// ============================================

// ── OAuth ──

export interface ZohoTokenResponse {
  access_token: string;
  refresh_token?: string; // Only present on initial authorization
  token_type: string;
  expires_in: number; // seconds (usually 3600)
  api_domain?: string;
  error?: string;
}

export interface ZohoStoredTokens {
  id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string; // ISO timestamp
  scopes: string | null;
  accounts_url: string;
  api_domain: string;
  created_at: string;
  updated_at: string;
}

// ── Mailing Lists ──

export interface ZohoMailingList {
  listkey: string;
  listname: string;
  total_contacts: number;
  open_count?: number;
  click_count?: number;
  created_time?: string;
}

export interface ZohoGetMailingListsResponse {
  status: string;
  code: number;
  message: string;
  list_of_details?: ZohoMailingList[];
}

// ── Contacts ──

export interface ZohoContactInfo {
  'Contact Email': string;
  'First Name'?: string;
  'Last Name'?: string;
  'Phone'?: string;
  'Company'?: string;
  [key: string]: string | undefined; // custom fields
}

export interface ZohoSubscribeResponse {
  status: string;
  code: number;
  message: string;
}

export interface ZohoUnsubscribeResponse {
  status: string;
  code: number;
  message: string;
}

// ── Campaigns ──

export interface ZohoCreateCampaignParams {
  campaignname: string;
  from_email: string;
  subject: string;
  content?: string;
  content_url?: string;
  list_details?: string; // JSON string of list key mappings
  replyto_email?: string;
  track_opens?: boolean;
  track_clicks?: boolean;
}

export interface ZohoCreateCampaignResponse {
  status: string;
  code: number;
  message: string;
  campaign_key?: string;
  campaign_name?: string;
}

export interface ZohoSendCampaignResponse {
  status: string;
  code: number;
  message: string;
}

export interface ZohoCampaignStats {
  campaign_key: string;
  campaign_name: string;
  total_sent?: number;
  total_opens?: number;
  total_clicks?: number;
  total_bounces?: number;
  total_unsubscribes?: number;
}

// ── Email Log ──

export type ZohoEmailEventType =
  | 'welcome'
  | 'cart_reminder'
  | 'order_confirmation'
  | 'review_request'
  | 'recommendation'
  | 'campaign';

export interface ZohoEmailLogEntry {
  event_type: ZohoEmailEventType;
  recipient_email: string;
  subject: string;
  campaign_key?: string;
  status: 'sent' | 'failed' | 'bounced';
  metadata?: Record<string, unknown>;
  error_message?: string;
}

// ── Service Options ──

export interface ZohoServiceConfig {
  accountsUrl?: string;
  campaignsBaseUrl?: string;
}

// ── Generic API Response ──

export interface ZohoApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

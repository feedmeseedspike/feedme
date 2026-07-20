// ============================================
// Zoho Integration Constants
// ============================================

// ── Zoho Account URLs (US region) ──
export const ZOHO_ACCOUNTS_URL =
  process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';

// ── Zoho Marketing Automation API base ──
export const ZOHO_MA_BASE_URL = 'https://marketingautomation.zoho.com/api/v1';

// ── OAuth Endpoints ──
export const ZOHO_AUTH_URL = `${ZOHO_ACCOUNTS_URL}/oauth/v2/auth`;
export const ZOHO_TOKEN_URL = `${ZOHO_ACCOUNTS_URL}/oauth/v2/token`;
export const ZOHO_REVOKE_URL = `${ZOHO_ACCOUNTS_URL}/oauth/v2/token/revoke`;

// ── Required OAuth Scopes ──
export const ZOHO_SCOPES = [
  'ZohoMarketingAutomation.lead.CREATE',
  'ZohoMarketingAutomation.lead.READ',
  'ZohoMarketingAutomation.lead.UPDATE',
  'ZohoMarketingAutomation.campaign.CREATE',
  'ZohoMarketingAutomation.campaign.READ',
  'ZohoMarketingAutomation.campaign.UPDATE',
].join(',');

// ── API Rate Limits ──
export const ZOHO_API_RATE_LIMIT = 500; // calls per 5 minutes
export const ZOHO_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

// ── Token Expiry Buffer ──
// Refresh the token 5 minutes before it actually expires
export const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

// ── Response Format ──
export const ZOHO_RESPONSE_FORMAT = 'JSON';

// ── Default Sender ──
export const DEFAULT_FROM_EMAIL =
  process.env.ZOHO_FROM_EMAIL || 'orders.feedmeafrica@gmail.com';
export const DEFAULT_FROM_NAME =
  process.env.ZOHO_FROM_NAME || 'FeedMe Africa';

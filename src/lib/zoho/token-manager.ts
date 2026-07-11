// ============================================
// Zoho Token Manager
// Handles token storage, retrieval, and auto-refresh
// ============================================

import { createClient } from '@supabase/supabase-js';
import {
  ZOHO_TOKEN_URL,
  ZOHO_REVOKE_URL,
  TOKEN_EXPIRY_BUFFER_MS,
} from './constants';
import type { ZohoTokenResponse, ZohoStoredTokens } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for server-side token management
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

class ZohoTokenManager {
  private cachedToken: ZohoStoredTokens | null = null;

  /**
   * Get a valid access token, refreshing if needed.
   * This is the main method all API calls should use.
   */
  async getValidToken(): Promise<string> {
    // 1. Try cached token first
    if (this.cachedToken && !this.isExpired(this.cachedToken)) {
      return this.cachedToken.access_token;
    }

    // 2. Fetch from database
    const stored = await this.getStoredTokens();
    if (!stored) {
      throw new Error(
        'No Zoho tokens found. Please connect your Zoho account first via /api/integrations/zoho/authorize'
      );
    }

    // 3. Check if token needs refresh
    if (this.isExpired(stored)) {
      const refreshed = await this.refreshAccessToken(stored);
      return refreshed.access_token;
    }

    // 4. Token is still valid
    this.cachedToken = stored;
    return stored.access_token;
  }

  /**
   * Check if the integration is connected
   */
  async isConnected(): Promise<boolean> {
    try {
      const stored = await this.getStoredTokens();
      return !!stored;
    } catch {
      return false;
    }
  }

  /**
   * Save tokens after initial OAuth authorization
   */
  async saveTokens(
    tokenData: ZohoTokenResponse,
    accountsUrl: string
  ): Promise<ZohoStoredTokens> {
    const expiresAt = new Date(
      Date.now() + tokenData.expires_in * 1000
    ).toISOString();

    const record = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token!,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: expiresAt,
      accounts_url: accountsUrl,
      api_domain: tokenData.api_domain || 'https://campaigns.zoho.com',
    };

    // Delete any existing row first (single-row pattern)
    await supabaseAdmin.from('zoho_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert the new tokens
    const { data, error } = await supabaseAdmin
      .from('zoho_tokens')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Failed to save Zoho tokens:', error);
      throw new Error(`Failed to save Zoho tokens: ${error.message}`);
    }

    this.cachedToken = data;
    return data;
  }

  /**
   * Revoke tokens and remove from storage (disconnect)
   */
  async revokeTokens(): Promise<void> {
    const stored = await this.getStoredTokens();
    if (!stored) return;

    // Revoke the refresh token at Zoho
    try {
      await fetch(ZOHO_REVOKE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: stored.refresh_token,
        }),
      });
    } catch (err) {
      console.warn('Failed to revoke Zoho token remotely:', err);
      // Continue with local cleanup even if remote revoke fails
    }

    // Delete from database
    const { error } = await supabaseAdmin
      .from('zoho_tokens')
      .delete()
      .eq('id', stored.id);

    if (error) {
      console.error('Failed to delete Zoho tokens:', error);
    }

    this.cachedToken = null;
  }

  // ── Private Methods ──

  /**
   * Fetch stored tokens from Supabase
   */
  private async getStoredTokens(): Promise<ZohoStoredTokens | null> {
    const { data, error } = await supabaseAdmin
      .from('zoho_tokens')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data as ZohoStoredTokens;
  }

  /**
   * Check if a token is expired (with buffer)
   */
  private isExpired(tokens: ZohoStoredTokens): boolean {
    const expiresAt = new Date(tokens.expires_at).getTime();
    return Date.now() >= expiresAt - TOKEN_EXPIRY_BUFFER_MS;
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(
    stored: ZohoStoredTokens
  ): Promise<ZohoStoredTokens> {
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        'ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET must be set in environment variables'
      );
    }

    const tokenUrl = `${stored.accounts_url}/oauth/v2/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: stored.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    const data: ZohoTokenResponse = await response.json();

    if (data.error) {
      console.error('Zoho token refresh failed:', data);
      throw new Error(`Zoho token refresh failed: ${data.error}`);
    }

    // Update the stored token (refresh_token stays the same)
    const newExpiresAt = new Date(
      Date.now() + data.expires_in * 1000
    ).toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('zoho_tokens')
      .update({
        access_token: data.access_token,
        expires_at: newExpiresAt,
      })
      .eq('id', stored.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update refreshed token:', error);
      throw new Error(`Failed to update refreshed token: ${error.message}`);
    }

    this.cachedToken = updated;
    return updated;
  }
}

// Export a singleton instance
export const zohoTokenManager = new ZohoTokenManager();
export { ZohoTokenManager };

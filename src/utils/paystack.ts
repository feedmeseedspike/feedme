import axios, { AxiosResponse } from "axios";

interface InitializeTransactionParams {
  email: string;
  amount: number;
  callback_url: string;
  metadata?: Record<string, unknown>;
}

interface CreateRecipientParams {
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
}

interface PaystackResponse {
  status: boolean;
  message: string;
  data: {
    access_code?: string;
    authorization_url?: string;
    reference?: string;
    status?: string;
    amount?: number;
    metadata?: Record<string, unknown>;
    recipient_code?: string;
  };
}

const paystack = {
  async initializeTransaction({
    email,
    amount,
    callback_url,
    metadata,
  }: InitializeTransactionParams): Promise<PaystackResponse> {
    try {
      const response: AxiosResponse<PaystackResponse> = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: amount * 100,
          callback_url,
          metadata,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'response' in error && typeof (error as any).response?.data?.message === 'string') {
        throw new Error(`Paystack initialization failed: ${(error as any).response.data.message}`);
      }
      if (error instanceof Error) {
        throw new Error(`Paystack initialization failed: ${error.message}`);
      }
      throw new Error('Paystack initialization failed: Unknown error');
    }
  },

  async verifyTransaction(reference: string): Promise<PaystackResponse> {
    try {
      const response: AxiosResponse<PaystackResponse> = await axios.get(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
          reference
        )}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'response' in error && typeof (error as any).response?.data?.message === 'string') {
        throw new Error(`Paystack verification failed: ${(error as any).response.data.message}`);
      }
      if (error instanceof Error) {
        throw new Error(`Paystack verification failed: ${error.message}`);
      }
      throw new Error('Paystack verification failed: Unknown error');
    }
  },

  async resolveBankAccount({
    account_number,
    bank_code,
  }: {
    account_number: string;
    bank_code: string;
  }): Promise<AxiosResponse> {
    try {
      const response: AxiosResponse = await axios.get(
        `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(
          account_number
        )}&bank_code=${encodeURIComponent(bank_code)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'response' in error && typeof (error as any).response?.data?.message === 'string') {
        throw new Error(`Bank account resolution failed: ${(error as any).response.data.message}`);
      }
      if (error instanceof Error) {
        throw new Error(`Bank account resolution failed: ${error.message}`);
      }
      throw new Error('Bank account resolution failed: Unknown error');
    }
  },

  async createRecipient({
    name,
    account_number,
    bank_code,
    currency = "NGN",
  }: CreateRecipientParams): Promise<PaystackResponse> {
    try {
      const response: AxiosResponse<PaystackResponse> = await axios.post(
        "https://api.paystack.co/transferrecipient",
        {
          type: "nuban",
          name,
          account_number,
          bank_code,
          currency,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'response' in error && typeof (error as any).response?.data?.message === 'string') {
        throw new Error(`Recipient creation failed: ${(error as any).response.data.message}`);
      }
      if (error instanceof Error) {
        throw new Error(`Recipient creation failed: ${error.message}`);
      }
      throw new Error('Recipient creation failed: Unknown error');
    }
  },

  async initiateTransfer({
    amount,
    recipient,
    reason,
  }: {
    amount: number;
    recipient: string;
    reason?: string;
  }): Promise<AxiosResponse> {
    try {
      const response: AxiosResponse = await axios.post(
        "https://api.paystack.co/transfer",
        {
          source: "balance",
          amount: amount * 100,
          recipient,
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'response' in error && typeof (error as any).response?.data?.message === 'string') {
        throw new Error(`Transfer initiation failed: ${(error as any).response.data.message}`);
      }
      if (error instanceof Error) {
        throw new Error(`Transfer initiation failed: ${error.message}`);
      }
      throw new Error('Transfer initiation failed: Unknown error');
    }
  },
};

export default paystack;

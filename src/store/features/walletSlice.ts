import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
  reference: string;
  paymentMethod: string;
}

interface WalletState {
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: 0,
  transactions: [],
  isLoading: false,
  error: null,
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      // Update balance based on transaction type
      if (action.payload.type === "credit") {
        state.balance += action.payload.amount;
      } else {
        state.balance -= action.payload.amount;
      }
    },
    updateTransactionStatus: (
      state,
      action: PayloadAction<{ id: string; status: Transaction["status"] }>
    ) => {
      const transaction = state.transactions.find(
        (t) => t.id === action.payload.id
      );
      if (transaction) {
        transaction.status = action.payload.status;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setBalance,
  setTransactions,
  addTransaction,
  updateTransactionStatus,
  setLoading,
  setError,
  clearError,
} = walletSlice.actions;

export default walletSlice.reducer;

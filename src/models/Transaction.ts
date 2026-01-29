import { Schema, model, models, Document, Types } from "mongoose";

interface ITransaction extends Document {
  userId: Types.ObjectId;
  walletId: Types.ObjectId;
  transactionId: string;
  amount: number;
  currency: string;
  paymentStatus: "pending" | "paid" | "failed";
  paymentGateway: string;
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    walletId: { type: Schema.Types.ObjectId, ref: "Wallet" },
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentGateway: { type: String, default: "paystack" },
    reference: { type: String, required: true },
  },
  { timestamps: true }
);

const Transaction =
  models.Transaction || model<ITransaction>("Transaction", transactionSchema);

export default Transaction;

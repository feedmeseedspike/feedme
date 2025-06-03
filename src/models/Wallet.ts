import { Schema, model, models, Document, Types } from "mongoose";

interface IWallet extends Document {
  userId: Types.ObjectId;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "NGN" },
  },
  { timestamps: true }
);

const Wallet = models.Wallet || model<IWallet>("Wallet", walletSchema);

export default Wallet;

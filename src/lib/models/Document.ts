import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface ISignature {
  _id?: mongoose.Types.ObjectId;
  savedSignatureId?: mongoose.Types.ObjectId;
  signatureData: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signedAt: Date;
}

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  originalUrl: string;
  signedUrl?: string;
  status: "UPLOADED" | "SIGNING" | "SIGNED" | "COMPLETED";
  verificationCode: string;
  fileSize?: number;
  pageCount?: number;
  signatures: ISignature[];
  createdAt: Date;
  updatedAt: Date;
}

const SignatureSchema = new Schema<ISignature>(
  {
    savedSignatureId: { type: Schema.Types.ObjectId, ref: "SavedSignature" },
    signatureData: { type: String, required: true },
    page: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    signedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const DocumentSchema = new Schema<IDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    originalUrl: { type: String, required: true },
    signedUrl: { type: String },
    status: {
      type: String,
      enum: ["UPLOADED", "SIGNING", "SIGNED", "COMPLETED"],
      default: "UPLOADED",
    },
    verificationCode: { type: String, unique: true, default: () => uuidv4() },
    fileSize: { type: Number },
    pageCount: { type: Number },
    signatures: { type: [SignatureSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

DocumentSchema.index({ userId: 1, createdAt: -1 });
DocumentSchema.index({ verificationCode: 1 });

const DocumentModel: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);

export default DocumentModel;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISavedSignature extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  signatureData: string;
  createdAt: Date;
}

const SavedSignatureSchema = new Schema<ISavedSignature>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    signatureData: { type: String, required: true },
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

const SavedSignature: Model<ISavedSignature> =
  mongoose.models.SavedSignature ||
  mongoose.model<ISavedSignature>("SavedSignature", SavedSignatureSchema);

export default SavedSignature;

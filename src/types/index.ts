export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

export interface DocumentWithUser {
  id: string;
  title: string;
  originalUrl: string;
  signedUrl: string | null;
  status: "UPLOADED" | "SIGNING" | "SIGNED" | "COMPLETED";
  verificationCode: string;
  fileSize: number | null;
  pageCount: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SignaturePosition {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signatureData: string;
  savedSignatureId?: string;
}

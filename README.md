# DocSign – Digital Signature & Document Management Platform

A production-oriented full-stack web application for uploading PDF documents, signing them electronically, managing document workflows, and verifying document authenticity.

**Live URL:** _Add after deployment_  
**API URL:** _Add after deployment_  
**Demo User:** viveklimbachiya999@gmail.com / (your password)
**Demo Admin:** admin@docsign.com / Admin@123

---

## Features Implemented

- **Authentication** – Register, login, logout with JWT in httpOnly cookies, password recovery via email
- **Document Upload** – PDF-only upload (max 20MB) with Cloudinary storage
- **PDF Preview** – In-browser PDF rendering via PDF.js canvas
- **Electronic Signature** – Draw (canvas) or type your signature, placed anywhere on any page
- **Reusable Signatures** – Save signatures for reuse across documents
- **PDF Signing** – Signature images embedded directly into PDF using pdf-lib
- **Download** – Download original or signed PDF
- **Document Management** – View, filter by status, delete documents
- **Verification System** – Every document gets a unique UUID verification code; public `/verify/{code}` page
- **Audit Trail** – All key actions logged (upload, sign, download, delete, login, etc.)
- **Admin Panel** – Stats dashboard, user list, document list, recent activity
- **Middleware Route Guards** – Unauthenticated users redirected to login; admin routes protected by role
- **AI Document Summary** – Google Gemini extracts and summarizes document content on the signing page
- **Drag-to-reposition Signatures** – Place signatures and drag them anywhere before finalizing
- **Search & Filter** – Live search by document name, filter by status
- **Copy Verification Link** – One-click clipboard copy of the public verify URL

---

## Technology Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | MongoDB via Mongoose |
| Auth | JWT + httpOnly cookies |
| File Storage | Cloudinary |
| PDF Processing | pdf-lib (signing), pdfjs-dist (preview) |
| Signature Canvas | react-signature-canvas |
| Email | Nodemailer (Gmail SMTP) |
| AI | Google Gemini API |
| Validation | Zod v4 |
| Deployment | Vercel |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free M0 cluster — no credit card needed)
- Cloudinary account (free tier)
- SMTP credentials (Gmail with App Password, or Mailtrap for dev)

### 1. Clone and install

```bash
git clone <repo-url>
cd docsign
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random string, keep secret |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g. http://localhost:3000) |
| `SMTP_*` | SMTP credentials for password reset emails |
| `CLOUDINARY_*` | Cloudinary cloud name, API key, API secret |

### 3. Database Setup

No migrations needed — Mongoose creates collections automatically on first write.

1. Create a free MongoDB Atlas cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user and whitelist your IP (or `0.0.0.0/0` for dev)
3. Copy the connection string into `MONGODB_URI` in your `.env`

That's it. Collections are created automatically.

### 4. Seed Admin User

```bash
npm run seed:admin
```

Creates `admin@docsign.com` / `Admin@123` with ADMIN role. If the user already exists it upgrades their role.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Required | Example |
|---|---|---|
| `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/docsign` |
| `JWT_SECRET` | Yes | `super-secret-32-char-string` |
| `JWT_EXPIRES_IN` | No | `7d` |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://docsign.vercel.app` |
| `SMTP_HOST` | Yes | `smtp.gmail.com` |
| `SMTP_PORT` | Yes | `587` |
| `SMTP_USER` | Yes | `your@gmail.com` |
| `SMTP_PASS` | Yes | `gmail-app-password` |
| `SMTP_FROM` | Yes | `DocSign <your@gmail.com>` |
| `CLOUDINARY_CLOUD_NAME` | Yes | `mycloud` |
| `CLOUDINARY_API_KEY` | Yes | `123456789` |
| `CLOUDINARY_API_SECRET` | Yes | `abc123xyz` |
| `GEMINI_API_KEY` | Yes | `your-gemini-api-key` |

---

## Architecture Overview

```
src/
├── app/
│   ├── (auth)/          # Login, register, forgot/reset password
│   ├── (dashboard)/     # Protected user pages
│   │   ├── dashboard/   # Document list
│   │   └── documents/[id]/sign/  # PDF signing flow
│   ├── admin/           # Admin-only panel
│   ├── verify/[code]/   # Public document verification (no auth)
│   └── api/             # All API routes
│       ├── auth/        # register, login, logout, forgot/reset
│       ├── documents/   # CRUD + upload + sign + download
│       ├── signatures/  # Saved signature management
│       ├── verify/      # Public verification endpoint
│       ├── audit/       # Audit log query
│       └── admin/       # Admin stats, users, documents
├── components/
│   ├── ui/              # Button, Input, Badge
│   ├── documents/       # Navbar, DocumentCard, UploadModal, PDFViewer
│   └── signature/       # SignatureCanvas (draw + type)
├── context/             # AuthContext (React Context)
├── lib/                 # prisma, auth (JWT), cloudinary, mailer, audit, response helpers
├── middleware.ts         # Route protection
└── types/               # Shared TypeScript types
```

---

## Database Design

### Collections

```
users              – email, password, name, role, resetToken, resetTokenExpiry
documents          – userId, title, originalUrl, signedUrl, status, verificationCode,
                     fileSize, signatures[] (embedded subdocuments)
saved_signatures   – userId, name, signatureData (base64 PNG)
audit_logs         – userId, documentId, action, metadata (Mixed), ipAddress, userAgent
```

### Design Decisions

- **Signatures are embedded** in the `documents` collection as a subdocument array. A document and its signatures are always fetched together — no joins needed.
- **`verificationCode`** is a UUID (v4) generated at upload time. Decoupled from `_id` to prevent sequential enumeration.
- **`audit_logs.metadata`** uses Mongoose `Mixed` type for flexible, action-specific context without schema changes. Different actions store different data.
- **MongoDB was chosen** because the core entity is a document (a PDF with embedded signatures) — this maps naturally to a document store. The audit log's variable metadata field benefits from schemaless flexibility.

---

## API Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login, set cookie |
| POST | `/api/auth/logout` | Auth | Clear cookie |
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| POST | `/api/auth/reset-password` | Public | Reset with token |
| GET | `/api/auth/me` | Auth | Current user |
| GET | `/api/documents` | Auth | List user's documents |
| POST | `/api/documents/upload` | Auth | Upload PDF |
| GET | `/api/documents/:id` | Auth | Get document + audit log |
| DELETE | `/api/documents/:id` | Auth | Delete document |
| POST | `/api/documents/:id/sign` | Auth | Embed signatures, finalize |
| GET | `/api/documents/:id/download` | Auth | Download signed PDF |
| GET | `/api/verify/:code` | Public | Verify document |
| GET | `/api/signatures` | Auth | List saved signatures |
| POST | `/api/signatures` | Auth | Save reusable signature |
| DELETE | `/api/signatures/:id` | Auth | Delete saved signature |
| GET | `/api/audit` | Auth | Query audit logs |
| GET | `/api/admin/stats` | Admin | Platform stats + activity |
| GET | `/api/admin/users` | Admin | All users |
| GET | `/api/admin/documents` | Admin | All documents |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add all environment variables
4. Set `MONGODB_URI` to your MongoDB Atlas connection string
5. Deploy — no migrations needed, Mongoose handles collection creation automatically

### Admin Setup

After deployment, run the seed script to create the admin user:

```bash
npm run seed:admin
# Creates: admin@docsign.com / Admin@123
```

---

## Assumptions Made

1. One signer per document (no multi-party signing workflow)
2. Signatures are embedded as PNG images into the PDF — not cryptographic PKI signatures
3. Verification proves the document was processed through this platform, not a cryptographic guarantee
4. File storage uses Cloudinary raw resource type (PDFs are not transformed)
5. Admin users must be seeded manually (no self-serve admin registration)
6. Password reset links expire after 1 hour

---

## Known Limitations

- No real-time collaboration (single user signs)
- Signature positions are in screen pixels, not PDF points — works correctly at the rendered scale
- No PDF form field support (signatures are image overlays only)
- Email delivery depends on SMTP configuration; falls back to console.log in dev

---

## Future Improvements

- Multi-party signing with ordered signing flow
- Cryptographic document hashing (SHA-256) stored at signing time for tamper detection
- Signature certificate with timestamp authority (TSA)
- Mobile touch support for signature drawing
- Document templates
- Webhook notifications on signing completion
- S3/R2 storage option as alternative to Cloudinary

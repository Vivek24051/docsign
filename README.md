# DocSign – Digital Signature & Document Management Platform

A production-oriented full-stack web application for uploading PDF documents, signing them electronically, managing document workflows, and publicly verifying document authenticity.

## 🔗 Links

- **Live Demo:** https://docsign-hkov.vercel.app
- **Repository:** https://github.com/Vivek24051/docsign

---

## 🚀 Overview

DocSign provides a complete document signing workflow:

1. User authentication
2. PDF document upload
3. In-browser PDF preview
4. Signature creation and placement
5. PDF signing and storage
6. Document management
7. Audit logging
8. Public document verification
9. Admin monitoring
10. AI-powered document summaries

The application was designed with a focus on authentication, document processing, authorization, auditability, and a clean separation between user and administrative workflows.

---

## ✨ Key Features

### 🔐 Authentication & Security

- User registration and login
- JWT authentication using `httpOnly` cookies
- Password recovery through email
- Middleware-based route protection
- Role-Based Access Control (RBAC)
- Protected admin routes

### 📄 Document Management

- PDF-only document uploads
- Maximum file size of 20MB
- Cloudinary-based document storage
- Document listing and filtering
- Document deletion
- Original and signed PDF downloads

### ✍️ Electronic Signatures

- Draw signatures using a canvas
- Type signatures
- Save reusable signatures
- Drag and reposition signatures before signing
- Embed signature images directly into PDFs using `pdf-lib`

### 🔎 Document Verification

Each uploaded document receives a unique UUID verification code.

Public verification is available through:

```text
/verify/{verification-code}
```

The verification workflow is available without authentication.

---

## 📋 Audit Trail

Important platform actions are recorded for traceability, including:

- Login
- Document upload
- Document signing
- Document download
- Document deletion
- Other document-related actions

Audit records can include action-specific metadata and request information.

---

## 👨‍💻 Admin Panel

The admin panel provides:

- Platform statistics
- User management
- Document management
- Recent activity
- Audit information

Administrative routes are protected using Role-Based Access Control.

---

## 🤖 AI Document Summary

Google Gemini is used to extract and summarize document content within the signing workflow.

---

## 🔍 Search & Filtering

- Live document search
- Status-based filtering
- Copy verification link to clipboard

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| UI | React.js + Tailwind CSS |
| Database | MongoDB + Mongoose |
| Authentication | JWT + httpOnly cookies |
| File Storage | Cloudinary |
| PDF Preview | PDF.js |
| PDF Processing | pdf-lib |
| Signature Input | react-signature-canvas |
| Email | Nodemailer |
| AI | Google Gemini API |
| Validation | Zod |
| Deployment | Vercel |

---

## 🏗️ Architecture

```text
                        ┌──────────────────┐
                        │     Browser      │
                        │   React / Next   │
                        └────────┬─────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   Next.js App    │
                        │  App Router/API  │
                        └────────┬─────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        ┌───────────┐      ┌────────────┐     ┌───────────┐
        │  MongoDB  │      │ Cloudinary │     │  Gemini   │
        │  Mongoose │      │   Storage  │     │    AI     │
        └───────────┘      └────────────┘     └───────────┘
              │
              ▼
        ┌─────────────┐
        │  Audit Logs │
        └─────────────┘
```

The application uses Next.js App Router for the frontend and API layer, with MongoDB/Mongoose handling persistent application data.

Cloudinary is used for PDF storage, PDF.js handles browser-side preview, and pdf-lib handles signature embedding into PDFs.

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot/reset-password/
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   └── documents/[id]/sign/
│   │
│   ├── admin/
│   │
│   ├── verify/[code]/
│   │
│   └── api/
│       ├── auth/
│       ├── documents/
│       ├── signatures/
│       ├── verify/
│       ├── audit/
│       └── admin/
│
├── components/
│   ├── ui/
│   ├── documents/
│   └── signature/
│
├── context/
│   └── AuthContext
│
├── lib/
│   ├── auth
│   ├── cloudinary
│   ├── mailer
│   ├── audit
│   └── response helpers
│
├── middleware.ts
│
└── types/
```

---

## 🗄️ Database Design

### Collections

```text
users
├── email
├── password
├── name
├── role
├── resetToken
└── resetTokenExpiry

documents
├── userId
├── title
├── originalUrl
├── signedUrl
├── status
├── verificationCode
├── fileSize
└── signatures[]

saved_signatures
├── userId
├── name
└── signatureData

audit_logs
├── userId
├── documentId
├── action
├── metadata
├── ipAddress
└── userAgent
```

### Design Decisions

#### Embedded Signatures

Signatures are embedded inside the documents collection because a document and its signatures are always retrieved together. This avoids an additional lookup for the core signing workflow.

#### UUID Verification Codes

Each document receives a UUID v4 verification code instead of exposing sequential database identifiers.

This keeps the public verification identifier decoupled from the document's database ID.

#### Flexible Audit Metadata

Audit log metadata uses a flexible structure because different actions can require different contextual information.

---

## 🔐 Authentication Flow

```text
User
 │
 ▼
Login
 │
 ▼
Credentials validated
 │
 ▼
JWT generated
 │
 ▼
httpOnly Cookie
 │
 ▼
Middleware
 │
 ├── User routes
 │
 └── Admin routes
        │
        ▼
    RBAC validation
```

JWT tokens are stored in httpOnly cookies rather than browser-accessible storage.

---

## 📄 Document Signing Flow

```text
Upload PDF
    │
    ▼
Cloudinary Storage
    │
    ▼
PDF Preview
    │
    ▼
Create / Select Signature
    │
    ▼
Position Signature
    │
    ▼
Submit Signing Request
    │
    ▼
pdf-lib embeds signature
    │
    ▼
Signed PDF stored
    │
    ▼
Verification Code
    │
    ▼
Public Verification
```

---

## 🔌 API Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Login and set cookie |
| POST | `/api/auth/logout` | Auth | Clear authentication cookie |
| POST | `/api/auth/forgot-password` | Public | Send password reset email |
| POST | `/api/auth/reset-password` | Public | Reset password |
| GET | `/api/auth/me` | Auth | Get current user |
| GET | `/api/documents` | Auth | List user's documents |
| POST | `/api/documents/upload` | Auth | Upload PDF |
| GET | `/api/documents/:id` | Auth | Get document |
| DELETE | `/api/documents/:id` | Auth | Delete document |
| POST | `/api/documents/:id/sign` | Auth | Sign and finalize document |
| GET | `/api/documents/:id/download` | Auth | Download signed PDF |
| GET | `/api/verify/:code` | Public | Verify document |
| GET | `/api/signatures` | Auth | List saved signatures |
| POST | `/api/signatures` | Auth | Save signature |
| DELETE | `/api/signatures/:id` | Auth | Delete saved signature |
| GET | `/api/audit` | Auth | Query audit logs |
| GET | `/api/admin/stats` | Admin | Platform statistics |
| GET | `/api/admin/users` | Admin | List users |
| GET | `/api/admin/documents` | Admin | List documents |

---

## ⚙️ Local Development

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- SMTP credentials

### 1. Clone the Repository

```bash
git clone https://github.com/Vivek24051/docsign.git
cd docsign
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the required values:

```env
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d

NEXT_PUBLIC_APP_URL=http://localhost:3000

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GEMINI_API_KEY=
```

### 3. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 4. Create the Admin Account

```bash
npm run seed:admin
```

This creates or upgrades the configured admin user with the `ADMIN` role.

---

## 🚀 Deployment

The application can be deployed to Vercel.

### Deployment Steps

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Configure all required environment variables.
4. Set `MONGODB_URI` to your MongoDB Atlas connection string.
5. Deploy.

MongoDB collections are created automatically through Mongoose when data is first written.

---

## ⚠️ Assumptions

- One signer per document
- Signatures are image overlays rather than cryptographic PKI signatures
- Verification confirms that the document was processed through the platform rather than providing cryptographic proof of authenticity
- PDFs are stored using Cloudinary raw resources
- Admin users are provisioned through the seed process
- Password reset links expire after one hour

---

## 🚧 Known Limitations

- No multi-party signing workflow
- No real-time collaboration
- Signature positioning is based on the rendered document scale
- No PDF form-field support
- Email delivery depends on SMTP configuration
- Development environments can fall back to console logging

---

## 🔮 Future Improvements

- Multi-party signing with ordered workflows
- SHA-256 document hashing for tamper detection
- Signature certificates with timestamp authority
- Improved mobile touch support
- Document templates
- Webhook notifications for signing completion
- S3/R2 storage as an alternative to Cloudinary

---

## 📌 Engineering Highlights

- JWT authentication using secure httpOnly cookies
- Middleware-based route protection
- Role-Based Access Control for administrative workflows
- PDF processing and signature embedding
- Public document verification
- Audit logging for important platform actions
- MongoDB document modeling with embedded signatures
- Cloudinary-based PDF storage
- AI-powered document summarization
- Server-side API architecture using Next.js App Router

---

## 📄 License

This project is intended for demonstration and portfolio purposes.

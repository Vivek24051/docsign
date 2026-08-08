# DocSign – Digital Signature & Document Management Platform

A production-oriented full-stack web application for uploading PDF documents, signing them electronically, managing document workflows, and publicly verifying document authenticity.

### 🔗 Links

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

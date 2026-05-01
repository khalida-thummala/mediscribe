# MediScribe — Healthcare Documentation Platform

**Production-grade AI-powered clinical documentation system**

## Features
- 🎙 **Live Consultation Recording** — Azure Speech + real-time transcription
- 📋 **SOAP Note Editor** — AI-generated with GPT-4, inline editing, e-signature
- ✦ **AI Report Analysis** — Upload PDFs/DOCX, extract entities, compare & approve
- 👥 **Patient Management** — Full CRUD, MRN, medical history
- 📄 **Report Export** — PDF/DOCX, digital signature, email delivery
- 📊 **Analytics Dashboard** — KPIs, trends, AI accuracy tracking
- 🛡 **Audit Trail** — HIPAA-compliant event logging, AES-256 encrypted
- ⚙ **Settings** — 2FA, integrations (Azure, GPT-4, EHR FHIR), billing

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| State | Zustand |
| Data Fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v3 + CSS Variables |
| Notifications | React Hot Toast |
| HTTP | Axios (JWT interceptors, auto-refresh) |

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in VITE_API_BASE_URL, VITE_AZURE_SPEECH_KEY, etc.

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure
```
src/
├── api/              # Axios API clients (auth, patients, consultations…)
├── components/
│   └── shared/       # AppLayout, Sidebar, Topbar, Modal, Badge, StatCard
├── hooks/            # useRecording (Azure Speech abstraction)
├── pages/            # One file per route/module
├── store/            # Zustand stores (auth, ui, consultation)
├── styles/           # globals.css (Tailwind + CSS vars)
├── types/            # Full TypeScript interfaces
└── utils/            # cn(), formatDate(), calcAge()…
```

## Environment Variables
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | FastAPI backend base URL |
| `VITE_AZURE_SPEECH_KEY` | Azure Cognitive Services key |
| `VITE_AZURE_SPEECH_REGION` | Azure region (e.g. eastus) |

## Compliance
- HIPAA-compliant data handling
- GDPR user rights support
- AES-256 encryption at rest
- TLS 1.3 in transit
- Role-based access control (RBAC)
- Full audit trail for all PHI access

## Backend
This frontend is designed to work with a **FastAPI + PostgreSQL** backend.
See `src/api/` for the full API contract (endpoints, request/response shapes).
All API calls use JWT authentication with automatic token refresh.

## License
Proprietary — MediScribe Healthcare Solutions

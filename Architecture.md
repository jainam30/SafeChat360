# SafeChat360 Architecture

## System Overview
SafeChat360 is a real-time messaging application. It consists of:
- **Frontend**: React 18, Vite, Tailwind CSS, deployed on Vercel.
- **Backend**: FastAPI, deployed on Render.
- **Database**: PostgreSQL (hosted on Supabase) accessed via SQLModel.
- **Realtime**: WebSockets for messaging.
- **Authentication**: JWT token-based authentication.
- **Push Notifications/Cloud Storage**: Firebase Admin SDK.

## Folder Structure (Backend)
```
backend/
├── app/
│   ├── core/         # Core configuration, logging, exceptions, middleware
│   ├── routes/       # FastAPI endpoints (auth, chat, users, etc.)
│   ├── services/     # Business logic layer (new)
│   ├── repositories/ # Database interaction layer (new)
│   ├── schemas/      # Pydantic models (new)
│   ├── utils/        # Shared utilities
│   ├── tests/        # Test suite
│   ├── db.py         # Database connection logic
│   └── main.py       # FastAPI application entry point
├── requirements.txt  # Python dependencies
└── pytest.ini        # Testing configuration
```

## Security Overview
- Passwords are pre-hashed with SHA256 then hashed with bcrypt.
- JWT is used for securing API access.
- Request rate limiting via `slowapi`.
- Security headers enforced via middleware.

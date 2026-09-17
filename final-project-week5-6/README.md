Live Demo [View Website] https://frontend-etdwu1rb3-purnashish07s-projects.vercel.app

# ProjectHub — Week 5-6 Final 🚀

A full-stack project management application showcasing secure uploads, premium checkout, email notifications, caching, and deployment-ready configuration.

## Overview

This project includes:
- React + Vite frontend
- Node.js + Express backend
- MongoDB persistence with Mongoose
- JWT authentication and bcrypt password hashing
- Image uploads with validation and optional Cloudinary storage
- Demo premium payment flow for local development and testing
- SMTP email sending with a safe fallback
- Cache-based project listing with invalidation on mutation
- Security middleware and health endpoints

## Features

- User registration and login
- Protected project dashboard
- Project creation, listing, update, and delete
- Image upload previews and safe file validation
- Premium subscription checkout in demo mode for development
- Demo payment verification on the server
- Welcome email and premium email notifications
- Project cache invalidation on post mutation
- Deployment-ready environment configuration

## Tech Stack

- Frontend: React 18, Redux Toolkit, React Router, Vite
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose
- Auth: JWT, bcryptjs
- Uploads: Multer, optional Cloudinary
- Payments: Razorpay
- Email: Nodemailer
- Cache: node-cache
- Security: Helmet, xss-clean, express-mongo-sanitize, hpp, express-rate-limit

## Project Structure

```bash
final-project-week5-6/
├── backend/
│   ├── src/
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── vite.config.js
│   ├── package.json
│   └── package-lock.json
├── README.md
├── .gitignore
└── .env.example
```

## Requirements

- Node.js 18+
- MongoDB Atlas or local MongoDB
- SMTP provider credentials
- Razorpay Test Mode credentials
- Cloudinary credentials for optional production image storage

## Installation

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

The backend expects the following variables in `backend/.env`:

```bash
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DEMO_PAYMENT_MODE=true
MONGO_URI=mongodb://127.0.0.1:27017/projecthub
JWT_SECRET=replace_with_long_random_secret
RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

The frontend expects:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_DEMO_PAYMENT_MODE=true
```

> `DEMO_PAYMENT_MODE=true` enables the temporary simulated premium payment flow. It is for local development/demo work only and does not create a real financial transaction.
> Set `DEMO_PAYMENT_MODE=false` only when you intentionally re-enable the real Razorpay integration with valid credentials.

## MongoDB Setup

1. Create a MongoDB Atlas cluster or run MongoDB locally.
2. Create a database user.
3. Add the database URI to `MONGO_URI`.
4. Ensure the app can reach the database from the deployment environment.

## Cloudinary Setup

1. Create a Cloudinary account.
2. Copy cloud name, API key, and API secret.
3. Add them to the backend environment.
4. If credentials are absent, the app falls back to local uploads without crashing.

## Demo Payment Setup

The project currently runs in demo payment mode by default. This is intentionally a simulated premium payment flow for development and demos.

1. Set `DEMO_PAYMENT_MODE=true` in the backend environment.
2. Set `VITE_DEMO_PAYMENT_MODE=true` in the frontend environment.
3. The app will use the demo payment modal instead of the real Razorpay SDK.
4. This does not create a real financial transaction and should not be treated as production payment processing.

## Real Razorpay Setup (optional, later)

If you later want to restore real Razorpay checkout:

1. Set `DEMO_PAYMENT_MODE=false`.
2. Add valid `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to the backend `.env` file.
3. Do not expose the secret in frontend code or public docs.
4. Use Razorpay Test Mode for local development.

## SMTP Setup

1. Use Gmail or any SMTP provider.
2. Generate an app password if needed.
3. Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, and `SMTP_PASSWORD`.
4. If missing, email sending logs a fallback message and continues without failing the request.

## Development Commands

```bash
cd backend
npm run dev

cd frontend
npm run dev
```

## Production Build

```bash
cd frontend
npm install
npm run build
```

Backend:

```bash
cd backend
npm install
npm start
```

## Deployment Guide

### Backend

1. Push the backend to GitHub.
2. Deploy to Render, Railway, or another Node hosting service.
3. Add all environment variables from `.env.example`.
4. Set `NODE_ENV=production`.
5. Ensure the database and SMTP providers are reachable.

### Frontend

1. Deploy the frontend to Vercel.
2. Set `VITE_API_URL` to the deployed backend URL.
3. Configure CORS to allow the deployed frontend origin.

### CORS

The backend allows the frontend origin from `FRONTEND_URL`, plus localhost development ports. Production should include the deployed frontend domain.

## API Overview

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Projects
- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/payment/order`
- `POST /api/projects/payment/demo/order`
- `POST /api/projects/payment/verify`
- `POST /api/projects/payment/demo/verify`

### Health
- `GET /api/health`
- `GET /`

## Security Notes

- JWT secrets stay server-side.
- Razorpay secrets stay server-side.
- SMTP passwords stay server-side.
- Uploads are limited to safe image types and a 5MB cap.
- Rate limiting and sanitization are enabled.
- Stack traces are hidden in production responses.

## Troubleshooting

- If MongoDB fails to connect, verify `MONGO_URI` and the network access rules.
- If payment creation fails, verify Razorpay keys and Test Mode status.
- If email fails, check SMTP settings.
- If the frontend cannot reach the backend, verify `VITE_API_URL` and CORS configuration.

## Demo and Test Flow

1. Register a user.
2. Log in and create a project.
3. Upload a project image.
4. Search project listings.
5. Upgrade to premium using the demo payment modal.
6. Verify the premium status persists after refresh.
7. Logout and log back in to confirm premium remains active.
8. Check the health endpoint.

## Production Notes

This project is deployment-ready when the required env vars are configured. No live deployment URL is claimed here because no deployment was performed in this environment.

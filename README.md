# BookPresent — Digital Book Catalog App

## Quick Start

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB, S3/R2 credentials
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install
npm start
```

### 3. First Login
- Create your first admin account via Postman or curl:
```bash
curl -X POST http://localhost:5000/api/auth/register \  
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@company.com","password":"Admin@1234","role":"admin"}'
```  
> NOTE: Comment out the `protect` middleware on the register route temporarily for first admin creation, then re-enable it.

## Tech Stack
- Frontend: React 18 (CRA) + Tailwind CSS + Framer Motion
- Backend: Node.js + Express
- Database: MongoDB Atlas
- Storage: Cloudflare R2 or AWS S3
- Auth: JWT + bcrypt
- Flipbook: react-pageflip + pre-generated page images

## Security Features
- JWT authentication with role-based access
- bcrypt password hashing (12 rounds)
- Rate limiting on all API + stricter on login
- NoSQL injection sanitization
- HTTP param pollution prevention
- Helmet security headers
- CORS configured
- Input validation via Mongoose + validator

## Cost (2-3GB storage)
- Cloudflare R2: ~$0.05/month
- MongoDB Atlas M0: Free
- Vercel (frontend): Free
- Render (backend): $7/month
- **Total: ~$7-8/month**

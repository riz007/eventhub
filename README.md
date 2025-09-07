# Fastify User Management API

A simple **Fastify** API for user authentication and management, using **Prisma** as the ORM and **JWT** for authentication.

---

## Features

- ✅ Signup & Login with email and password  
- ✅ Password hashing with **bcrypt**  
- ✅ JWT token creation & cookie support  
- ✅ CRUD operations for users (`create`, `read`, `update`, `delete`)  
- ✅ Request logging & slow request detection  
- ✅ Rate limiting with **@fastify/rate-limit**  
- ✅ Security headers with **helmet**  
- ✅ Environment variables via **dotenv**  

---

## In Progress / TODO

- JWT authentication for protected routes (`preHandler`) is partially implemented  
- Profile endpoints (e.g., `GET /me`) are not fully added  
- Role-based access control (Admin vs User)  
- Validation & error handling improvements for edge cases  
- Unit tests & Postman collection for automated testing  

---

## Getting Started

### Requirements

- Node.js >= 18  
- PostgreSQL (or your preferred database supported by Prisma)  
- Yarn or npm  

### Setup

1. Clone the repository:

```bash
git clone <repo-url>
cd <project-folder>
```

2. Install dependencies:

```bash
yarn install
# or
npm install
```

3. Configure environment variables:
Create a .env file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
```
4. Apply Prisma migrations:
```bash
npx prisma migrate dev
```
Server will run on http://localhost:3000

5. API Endpoints

### Authentication

POST /auth/signup – Register a new user

POST /auth/login – Login and get JWT token

### Users

GET /users – Get all users

GET /users/:id – Get a single user

POST /users – Create a new user

PATCH /users/:id – Update user

DELETE /users/:id – Delete user

Protected routes will require JWT authentication (work in progress).

## Testing
- Use Postman or Insomnia
- Include JWT token in Authorization: Bearer <token> header for protected routes
- Health check endpoint: GET /health

### License
GNU GENERAL PUBLIC LICENSE (Check the LICENSE file for details)
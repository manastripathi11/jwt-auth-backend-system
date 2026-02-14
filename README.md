# YOUTUBE CLONE (Backend)

A production-style backend system built with Node.js, Express, and MongoDB following modular architecture and real-world authentication patterns.
This project demonstrates secure token handling, file uploads, scalable schema design, aggregation pipelines, and structured controller-based development.

## Overview

The backend is designed using a modular MVC-inspired architecture with clear separation of concerns between routes, controllers, models, middleware, and utilities.
It includes authentication, user management, subscription logic, content interactions (likes, comments, tweets, playlists), and aggregation-based data retrieval.

## Core Features

Authentication & Security
- JWT-based access and refresh token system
- Token rotation strategy
- Secure httpOnly cookie implementation
- Password hashing using bcrypt
- Protected routes using middleware
- Refresh token validation against database

User Management
- User registration and login
- Profile update
- Password change flow
- Avatar and cover image upload
- Logout with token invalidation

Content System
- Video handling
- Tweet system
- Like system
- Comment system
- Playlist management
- Subscription system (scalable many-to-many design)

File Upload System
- Multer-based middleware
- Cloudinary integration
- Local file cleanup after upload
- URL storage in database

Database Optimization
- MongoDB aggregation pipelines
- $lookup joins
- Subscriber count calculation
- Conditional subscription checks
- Field projection and response shaping

Error Handling
- Centralized async error handler
- Custom APIError class
- Custom APIResponse class
- Consistent status code structure

## Tech Stack

Runtime:
- Node.js

Framework:
- Express.js

Database:
- MongoDB
- Mongoose

Authentication:
- JSON Web Token (JWT)
- bcrypt

File Handling:
- Multer
- Cloudinary

Testing:
- Postman

## Project Structure

src/
│
├── controllers/
│   ├── about.controller.js
│   ├── comment.controller.js
│   ├── dashboard.controller.js
│   ├── healthcheck.controller.js
│   ├── like.controller.js
│   ├── playlist.controller.js
│   ├── subscription.controller.js
│   ├── tweet.controller.js
│   ├── user.controller.js
│   └── video.controller.js
│
├── db/
│   └── index.js
│
├── middlewares/
│   ├── auth.middleware.js
│   └── multer.middleware.js
│
├── models/
│   ├── comment.model.js
│   ├── like.model.js
│   ├── playlist.model.js
│   ├── subscription.model.js
│   ├── tweet.model.js
│   ├── user.model.js
│   └── video.model.js
│
├── routes/
│   ├── about.routes.js
│   ├── comment.routes.js
│   ├── dashboard.routes.js
│   ├── healthcheck.routes.js
│   ├── like.routes.js
│   ├── playlist.routes.js
│   ├── subscription.routes.js
│   ├── tweet.routes.js
│   ├── user.routes.js
│   └── video.routes.js
│
├── utils/
│   ├── ApiError.js
│   ├── ApiResponse.js
│   ├── asyncHandler.js
│   └── cloudinary.js
│
├── app.js
├── constants.js
└── index.js

Architecture Flow:

Routes → Middleware → Controller → Model → Response

## Authentication Flow

1. User registers or logs in.
2. Credentials are validated.
3. Access token (short-lived) is generated.
4. Refresh token (long-lived) is generated and stored in the database.
5. Tokens are sent via secure httpOnly cookies.
6. Access token expiration triggers refresh endpoint.
7. Logout invalidates refresh token and clears cookies.

Security Considerations:
- Password never returned in response.
- Refresh token stored in database.
- Tokens validated using server secrets.
- Protected routes require middleware verification.

## API Design Principles

- GET for data retrieval.
- POST for state-changing processes (login, logout, token refresh, password change).
- PATCH for partial resource updates.
- No sensitive data exposed in responses.
- Consistent JSON response format using custom wrapper classes.

## Database Design Decisions

- Separate Subscription model to support scalable many-to-many relationships.
- Aggregation pipelines used for complex queries.
- ObjectId conversion handled explicitly inside aggregation stages.
- Projection used to minimize response payload.

## Environment Variables Required

Create a `.env` file with:
PORT=
MONGODB_URI=
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

## Running the Project

Install dependencies:
npm install
Start development server:
npm run dev

This project is built as a backend engineering portfolio project focusing on production-ready patterns rather than minimal tutorial-level implementation.
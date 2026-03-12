# Authentication System

The Authentication System in Void Nexus provides secure player identification and persistent data tracking across sessions. It integrates with the Void Nexus Backend to handle user registration, credential verification, and session authority.

## 1. Credentials & Registration
Players must create a unique identity to participate in the global leaderboards.
- **Username**: A unique identifier (3-50 characters) required for leaderboard entries.
- **Password**: Hashed using `bcryptjs` for secure storage.
- **Registration**: Creates a new record in the `players` database table with a timestamp.

## 2. Session Management
Authentication utilizes JSON Web Tokens (JWT) for secure, stateless communication between the client and server.
- **Login**: Upon successful credential verification, the server issues a signed JWT.
- **Token Storage**: The JWT is stored in the browser's `localStorage` as `authToken`.
- **Authorization**: All protected API requests (e.g., submitting runs) must include the JWT in the `Authorization: Bearer <token>` header.
- **Verification**: The system automatically verifies the token's validity upon app initialization to restore the session.

## 3. Persistent States
The system tracks the following player-specific information:
- **Account Creation**: Timestamp of initial registration.
- **Last Login**: Automatically updated on every successful login session.
- **Leaderboard Integration**: Only authenticated players can submit run scores to the global, daily, and weekly leaderboards.

## 4. API Client Logic
The client-side `ApiClient` handles all communication with the authentication backend.
- **Base URL**: The system uses the local `/api` origin for both development and production consistency.
- **Request Interception**: The client automatically injects the current authorization token into every outgoing request.
- **Error Handling**: Standardized response parsing for common authentication failures (e.g., "Invalid credentials" or "Token expired").

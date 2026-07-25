# Microservices API Gateway Architecture

A robust microservices architecture featuring an API Gateway with reverse proxying, JWT-based distributed authentication, Redis-backed rate limiting & caching, Winston-structured logging, distributed request tracing, and live system monitoring using Prometheus and Grafana.

---

## 🏗️ Project Architecture

```
                           +----------------+
                           |    Client      |
                           | React / Postman|
                           +-------+--------+
                                   |
                                   | HTTP Requests
                                   ▼
                     +--------------------------+
                     |      API Gateway         |
                     |--------------------------|
                     | Routing & Reverse Proxy  |
                     | JWT Validation           |
                     | Redis Rate Limiting      |
                     | Redis Cache (Products)   |
                     | Winston JSON Logging     |
                     | Request ID Tracing       |
                     | Metrics (/metrics)       |
                     +-----------+------------+
                                 |
        +------------------------+------------------------+
        |                        |                        |
        ▼                        ▼                        ▼
+---------------+        +---------------+        +---------------+
| Auth Service  |        | User Service  |        | Product Service|
| (Port 8001)   |        | (Port 8002)   |        | (Port 8003)   |
+---------------+        +---------------+        +---------------+
| Register      |        | Profile (/me) |        | CRUD Products  |
| Login         |        | Address       |        | Search         |
| Refresh Token |        | Orders        |        | Categories     |
+-------+-------+        +-------+-------+        +-------+-------+
        |                        |                        |
        ▼                        ▼                        ▼
   MongoDB (Auth)           MongoDB (User)           MongoDB (Product)
```

---

## 🛠️ Tech Stack & Services

- **API Gateway (Port 8000)**: Node.js/Express, `http-proxy-middleware`, `redis`, `prom-client` (metrics), `express-rate-limit`, `rate-limit-redis`, `winston` (JSON logging), `uuid` (tracing).
- **Auth Service (Port 8001)**: Node.js/Express, Mongoose, JWT authentication, `bcryptjs`. Handles authentication credentials, login, registration, and session token refreshes.
- **User Service (Port 8002)**: Node.js/Express, Mongoose. Manages customer profile fields, address, and orders.
- **Product Service (Port 8003)**: Node.js/Express, Mongoose. Manages catalog CRUD, product category filtering, and text-based searching.
- **Redis (Port 6379)**: Caches catalog reading queries and stores rate-limiting request budgets.
- **Prometheus (Port 9090)**: Time-series database that scrapes `/metrics` from the API Gateway every 5 seconds.
- **Grafana (Port 3000)**: Visual dashboard that queries Prometheus. Pre-provisioned to display:
  - Throughput (Requests/sec)
  - Average Latency
  - 95th Percentile Latency
  - Cache Hit/Miss Ratio
  - Error Rates
  - Rate Limited Blocked Requests

---

## 🚀 How to Run

Ensure you have [Docker](https://www.docker.com/) and Docker Compose installed.

1. **Spin Up the Infrastructure**:
   ```bash
   docker compose up --build
   ```

2. **Verify Health of Services**:
   - Gateway Health: `http://localhost:8000/health`
   - Auth Service Health: `http://localhost:8000/auth/health`
   - User Service Health: `http://localhost:8000/users/health` (requires JWT token in request authorization header)
   - Product Service Health: `http://localhost:8000/products/health` (requires JWT token in request authorization header)

3. **Check Metrics**:
   - Prometheus metrics endpoint: `http://localhost:8000/metrics`
   - Prometheus Dashboard UI: `http://localhost:9090`
   - Grafana Dashboard: Go to `http://localhost:3000` (Log in with username `admin`, password `admin`). The **API Gateway Metrics** dashboard is preloaded and ready under the dashboard section.

---

## 📡 API Documentation & Request Flows

### 1. Authentication Flow
- **Register**: `POST http://localhost:8000/auth/register`
  ```json
  {
    "email": "user@example.com",
    "password": "Password123",
    "role": "admin" 
  }
  ```
  *(Roles are either `user` or `admin`. Admins can write products; users can only read them).*

- **Login**: `POST http://localhost:8000/auth/login`
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
  Response contains short-lived `accessToken` (15m) and long-lived `refreshToken` (7d).

- **Refresh Token**: `POST http://localhost:8000/auth/refresh`
  ```json
  {
    "refreshToken": "your_long_lived_refresh_token_here"
  }
  ```

- **Logout**: `POST http://localhost:8000/auth/logout`
  ```json
  {
    "refreshToken": "your_long_lived_refresh_token_here"
  }
  ```

### 2. Profile Management Flow
All routes require standard Header: `Authorization: Bearer <accessToken>`.

- **Get Profile (/me)**: `GET http://localhost:8000/users/me`
- **Get Profile by ID**: `GET http://localhost:8000/users/:id` *(Admins can fetch any profile; users can only fetch their own).*
- **Update Profile**: `PUT http://localhost:8000/users/:id`
  ```json
  {
    "name": "Jane Doe",
    "address": "123 Main Street, City",
    "orders": ["Order_A", "Order_B"]
  }
  ```

### 3. Product Catalog Flow
- **Retrieve Products (Public & Cached)**: `GET http://localhost:8000/products`
  - Filter by category: `GET http://localhost:8000/products?category=Electronics`
  - Text Search: `GET http://localhost:8000/products?q=Laptop`
  - *First load counts as a Cache Miss (queries MongoDB). Subsequent loads return instant `X-Cache: HIT` from Redis without hitting the Product microservice.*
- **Get Product Details (Public & Cached)**: `GET http://localhost:8000/products/:id`
- **Create Product (Admin Only)**: `POST http://localhost:8000/products`
  *Header: `Authorization: Bearer <AdminAccessToken>`*
  ```json
  {
    "name": "MacBook Pro",
    "description": "Powerful laptop with M3 chip",
    "price": 1999,
    "category": "Electronics",
    "stock": 50
  }
  ```
  *Creating/updating/deleting products automatically invalidates relevant Redis query caches.*
- **Update Product (Admin Only)**: `PUT http://localhost:8000/products/:id`
- **Delete Product (Admin Only)**: `DELETE http://localhost:8000/products/:id`

---

## 🛡️ Distributed Cross-Service Features

### 🔍 Request Tracing & Correlation ID
For every request entering the API Gateway, a middleware generates a UUID `requestId` and binds it:
1. To the client response header: `X-Request-Id`.
2. To the downstream proxy calls: The Gateway injects the header `X-Request-Id` to downstream microservices.
3. To structured logger statements: All service output prints JSON structures with the request ID, allowing you to trace the lifecycle of a request across all microservices (Distributed Tracing).

### 🚀 Caching & Invalidation Logic
```
Client -> GET /products -> Gateway checks Redis -> [Cache Hit] -> Returns directly
                                    |
                             [Cache Miss]
                                    ▼
                          Product Service (MongoDB)
                                    |
                           Returned & Cached in Redis
```
- GET requests check Redis first.
- PUT, POST, DELETE requests bypass cache, modify database, and scan Redis to delete matching keys (e.g. `cache:/products*`), guaranteeing data consistency.

### ⛔ Rate Limiting
- Configured using Redis memory store so that rate budgets are shared, preventing clients from bypassing limitations if there were multiple horizontal Gateway replicas.
- Automatically records blocks in Prometheus metrics to trigger alerts in production.

# 📚 SmartAttend API Documentation

## 🌐 Base URL
```
Development: http://localhost:5000
Production: https://api.smartattend.com
```

## 📖 Interactive Documentation
Access the Swagger UI interface at:
```
http://localhost:5000/api-docs
```

---

## 🔐 Authentication

All authenticated endpoints require a JWT token sent as an HTTP-only cookie named `token`.

### Cookie-based Authentication
When you login or register, the server sets an HTTP-only cookie:
```
Set-Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Path=/; HttpOnly; Secure; SameSite=Strict
```

This cookie is automatically sent with subsequent requests by the browser.

---

## 📋 API Endpoints

### Authentication Endpoints

#### 1. Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "student",
  "studentId": "STU2024001",
  "department": "Computer Science"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "role": "student"
  }
}
```

---

#### 2. Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "role": "student"
  }
}
```

**Headers:**
```
Set-Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly
```

---

#### 3. Logout
```http
POST /api/auth/logout
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged Out"
}
```

---

#### 4. Get Current User
```http
GET /api/auth/me
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "studentId": "STU2024001",
    "department": "Computer Science",
    "isVerified": true
  }
}
```

---

### Course Endpoints

#### 5. Create Course (Lecturer Only)
```http
POST /api/courses
```

**Request Body:**
```json
{
  "name": "Introduction to Computer Science",
  "code": "CS101",
  "lecturerId": "507f1f77bcf86cd799439012"
}
```

**Response (201):**
```json
{
  "success": true,
  "course": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Introduction to Computer Science",
    "code": "CS101",
    "lecturer": "507f1f77bcf86cd799439012",
    "students": []
  }
}
```

---

#### 6. Get All Courses
```http
GET /api/courses
```

**Response (200):**
```json
{
  "success": true,
  "courses": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Introduction to Computer Science",
      "code": "CS101",
      "lecturer": {
        "_id": "507f1f77bcf86cd799439012",
        "fullName": "Dr. Smith",
        "email": "smith@university.edu"
      },
      "students": []
    }
  ]
}
```

---

#### 7. Get Course by ID
```http
GET /api/courses/:id
```

**Response (200):**
```json
{
  "success": true,
  "course": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Introduction to Computer Science",
    "code": "CS101",
    "lecturer": {
      "_id": "507f1f77bcf86cd799439012",
      "fullName": "Dr. Smith"
    },
    "students": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe",
        "studentId": "STU2024001",
        "email": "john@example.com"
      }
    ]
  }
}
```

---

#### 8. Enroll in Course (Student Only)
```http
POST /api/courses/:id/enroll
```

**Response (200):**
```json
{
  "success": true,
  "message": "Enrolled successfully",
  "course": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Introduction to Computer Science",
    "code": "CS101"
  }
}
```

---

### Session Endpoints

#### 9. Start Attendance Session (Lecturer Only)
```http
POST /api/sessions/start
```

**Request Body:**
```json
{
  "courseId": "507f1f77bcf86cd799439013",
  "windowMinutes": 15
}
```

**Response (201):**
```json
{
  "success": true,
  "session": {
    "_id": "507f1f77bcf86cd799439014",
    "course": "507f1f77bcf86cd799439013",
    "lecturer": "507f1f77bcf86cd799439012",
    "qrToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "pin": "1234",
    "qrExpiresAt": "2024-01-01T12:00:30.000Z",
    "windowClosesAt": "2024-01-01T12:15:00.000Z",
    "isActive": true
  },
  "qrImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "pin": "1234"
}
```

**Notes:**
- `qrImage` is a base64-encoded PNG that can be directly displayed in an `<img>` tag
- `pin` is a 4-digit code students must enter along with scanning the QR
- `qrExpiresAt` - QR code expires in 30 seconds
- `windowClosesAt` - Attendance window closes after `windowMinutes`

---

#### 10. Refresh QR Code (Lecturer Only)
```http
POST /api/sessions/:id/refresh
```

**Response (200):**
```json
{
  "success": true,
  "qrImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "pin": "5678",
  "qrToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Use Case:** When the QR code expires (every 30 seconds), lecturer clicks "Refresh" to generate a new one.

---

#### 11. Close Session (Lecturer Only)
```http
POST /api/sessions/:id/close
```

**Response (200):**
```json
{
  "success": true,
  "message": "Session closed"
}
```

---

### Attendance Endpoints

#### 12. Mark Attendance (Student Only)
```http
POST /api/attendance/mark
```

**Request Body:**
```json
{
  "qrToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "pin": "1234",
  "deviceFingerprint": "fp_abc123xyz789",
  "location": {
    "lat": 6.5244,
    "log": 3.3792
  },
  "photoUrl": "https://cloudinary.com/selfie.jpg"
}
```

**Response (201):**
```json
{
  "success": true,
  "attendance": {
    "_id": "507f1f77bcf86cd799439015",
    "student": "507f1f77bcf86cd799439011",
    "session": "507f1f77bcf86cd799439014",
    "deviceFingerprint": "fp_abc123xyz789",
    "location": {
      "lat": 6.5244,
      "log": 3.3792
    },
    "photoUrl": "https://cloudinary.com/selfie.jpg",
    "status": "present",
    "createdAt": "2024-01-01T12:05:00.000Z"
  }
}
```

**Possible Errors (400):**
```json
{ "message": "QR code expired or invalid" }
{ "message": "QR code already used" }
{ "message": "Session is not active" }
{ "message": "QR code expired" }
{ "message": "Attendance window closed" }
{ "message": "Incorrect PIN" }
{ "message": "Attendance already marked" }
```

---

#### 13. Get Session Attendance (Lecturer Only)
```http
GET /api/attendance/session/:sessionId
```

**Response (200):**
```json
{
  "success": true,
  "count": 25,
  "records": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "student": {
        "fullName": "John Doe",
        "studentId": "STU2024001",
        "profilePhoto": "https://cloudinary.com/john.jpg"
      },
      "session": "507f1f77bcf86cd799439014",
      "deviceFingerprint": "fp_abc123xyz789",
      "location": {
        "lat": 6.5244,
        "log": 3.3792
      },
      "photoUrl": "https://cloudinary.com/selfie.jpg",
      "status": "present",
      "createdAt": "2024-01-01T12:05:00.000Z"
    }
  ]
}
```

---

## 🔒 Role-Based Access Control

| Endpoint | Student | Lecturer |
|----------|---------|----------|
| `POST /api/auth/register` | ✅ | ✅ |
| `POST /api/auth/login` | ✅ | ✅ |
| `GET /api/auth/me` | ✅ | ✅ |
| `POST /api/courses` | ❌ | ✅ |
| `GET /api/courses` | ✅ | ✅ |
| `GET /api/courses/:id` | ✅ | ✅ |
| `POST /api/courses/:id/enroll` | ✅ | ❌ |
| `POST /api/sessions/start` | ❌ | ✅ |
| `POST /api/sessions/:id/refresh` | ❌ | ✅ |
| `POST /api/sessions/:id/close` | ❌ | ✅ |
| `POST /api/attendance/mark` | ✅ | ❌ |
| `GET /api/attendance/session/:sessionId` | ❌ | ✅ |

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "message": "Error description here"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorised, no token"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied: requires role lecturer"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error message"
}
```

---

## 📝 Testing with cURL

### Register a Student
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "role": "student",
    "studentId": "STU2024001",
    "department": "Computer Science"
  }' \
  -c cookies.txt
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123!"
  }' \
  -c cookies.txt
```

### Get Current User (using saved cookies)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -b cookies.txt
```

---

## 🔄 Typical User Flows

### Student Flow
1. **Register** → `POST /api/auth/register` (role: student)
2. **Login** → `POST /api/auth/login`
3. **View Courses** → `GET /api/courses`
4. **Enroll in Course** → `POST /api/courses/:id/enroll`
5. **Scan QR Code** (frontend captures QR token)
6. **Mark Attendance** → `POST /api/attendance/mark`

### Lecturer Flow
1. **Register** → `POST /api/auth/register` (role: lecturer)
2. **Login** → `POST /api/auth/login`
3. **Create Course** → `POST /api/courses`
4. **Start Session** → `POST /api/sessions/start`
5. **Display QR Code** (frontend shows qrImage and pin)
6. **Refresh QR** (every 30 seconds) → `POST /api/sessions/:id/refresh`
7. **View Attendance** → `GET /api/attendance/session/:sessionId`
8. **Close Session** → `POST /api/sessions/:id/close`

---

## 🎯 Real-Time Updates (Socket.IO)

The backend emits real-time events via Socket.IO:

### Events Emitted by Server
```javascript
// When QR is refreshed
socket.to(sessionId).emit('new-qr', { qrImage, pin })

// When student marks attendance
socket.to(sessionId).emit('attendance-marked', { student, attendance })
```

### Frontend Listening
```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:5000', { withCredentials: true })

socket.emit('join-session', sessionId)
socket.on('new-qr', ({ qrImage, pin }) => {
  // Update QR display
})
socket.on('attendance-marked', ({ student, attendance }) => {
  // Add student to attendance list
})
```

---

## 📊 Rate Limiting

- **Global limit:** 100 requests per 15 minutes per IP
- **Login endpoint:** 10 requests per 15 minutes per IP

---

## 🔐 Security Features

1. **JWT Authentication** - Tokens expire after 7 days
2. **HTTP-only Cookies** - Prevents XSS attacks
3. **Helmet.js** - Sets security headers
4. **CORS** - Restricts cross-origin requests
5. **Input Sanitization** - Prevents NoSQL injection
6. **Rate Limiting** - Prevents brute force attacks
7. **Password Hashing** - bcrypt with 12 rounds
8. **QR Token Blacklist** - Prevents token reuse
9. **Device Fingerprinting** - Tracks unique devices
10. **Geolocation** - Verifies physical presence

---

## 📚 Additional Resources

- **Swagger UI:** http://localhost:5000/api-docs
- **Postman Collection:** (Import from Swagger)
- **Frontend Repository:** Coming soon
- **Deployment Guide:** See DEPLOYMENT.md

---

## 💡 Tips for Frontend Developers

1. **Always send credentials:**
   ```javascript
   axios.defaults.withCredentials = true
   ```

2. **Handle 401 errors globally:**
   ```javascript
   axios.interceptors.response.use(
     response => response,
     error => {
       if (error.response?.status === 401) {
         // Redirect to login
       }
       return Promise.reject(error)
     }
   )
   ```

3. **QR Code Display:**
   ```jsx
   <img src={qrImage} alt="QR Code" />
   <p>PIN: {pin}</p>
   ```

4. **Refresh QR every 25 seconds** (before 30s expiry)

5. **Use Socket.IO for real-time updates**

---

**Last Updated:** January 2025
**API Version:** 1.0.0

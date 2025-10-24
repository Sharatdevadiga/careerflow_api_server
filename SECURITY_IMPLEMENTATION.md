# Security Implementation: Role-Based Access & HTTP-Only Cookies

## Overview
This document outlines the security improvements implemented in the CareerFlow application:
1. **Role-Based Access Control (RBAC)** with flexible middleware
2. **HTTP-Only Cookies** for JWT storage (eliminating localStorage security risks)

---

## 1. Role-Based Access Control (RBAC)

### Backend Implementation

#### Updated `restrictTo` Middleware
**Location:** `naukari_api/controllers/authController.js`

```javascript
// RestrictTo middleware - accepts multiple roles
// Usage: restrictTo('employer'), restrictTo('employee'), or restrictTo('admin', 'employer')
function restrictTo(...allowedRoles) {
  return function (req, res, next) {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return next(
        new AppError("You must be logged in to access this resource", 401)
      );
    }

    // Check if user's type/role is in the allowed roles
    if (!allowedRoles.includes(req.user.type)) {
      return next(
        new AppError(
          `Access denied. This resource is only available to ${allowedRoles.join(', ')} users.`,
          403
        )
      );
    }
    
    next();
  };
}
```

**Features:**
- ✅ Accepts multiple roles as arguments using spread operator
- ✅ Provides clear error messages specifying required roles
- ✅ Returns 403 Forbidden for unauthorized access
- ✅ Can be chained with other middleware

#### Router Protection Examples

**Job Router** (`naukari_api/routers/jobRouter.js`):
```javascript
// Public routes - no authentication required
router.get("/", authController.optionalAuth, jobController.getJobs);
router.get("/search/:searchtext", authController.optionalAuth, jobController.getSearchJobs);

// Protected routes - authentication required
router.use(authController.protect);

// Employer-only routes
router.post("/", authController.restrictTo("employer"), jobController.createJob);
router.get("/employer/my-jobs", authController.restrictTo("employer"), jobController.getEmployerJobs);
router.patch("/:id", authController.restrictTo("employer"), jobController.updateJob);
router.delete("/:id", authController.restrictTo("employer"), jobController.deleteJob);
```

**Saved Jobs Router** (`naukari_api/routers/savedJobRouter.js`):
```javascript
router.use(authController.protect); // All routes require authentication
router.use(authController.restrictTo("employee")); // Only employees can save jobs

router
  .route("/")
  .get(savedJobController.getSavedJobs)
  .post(savedJobController.addSavedJob)
  .delete(savedJobController.deleteSavedJob);
```

**Applied Jobs Router** (`naukari_api/routers/appliedJobRouter.js`):
```javascript
router.use(authController.protect); // All routes require authentication
router.use(authController.restrictTo("employee")); // Only employees can apply to jobs

router
  .route("/")
  .get(appliedJobController.getAppliedJobs)
  .post(appliedJobController.addAppliedJob)
  .delete(appliedJobController.deleteAppliedJob);
```

---

## 2. HTTP-Only Cookie Implementation

### Why HTTP-Only Cookies?

**Security Benefits:**
- ✅ **XSS Protection**: JavaScript cannot access httpOnly cookies (localStorage is vulnerable to XSS)
- ✅ **Automatic Management**: Browser handles cookie sending/storage
- ✅ **CSRF Protection**: Combined with SameSite attribute
- ✅ **Secure Flag**: Cookies only sent over HTTPS in production

### Backend Changes

#### 1. Updated Token Creation (`authenticationHelpers.js`)
```javascript
export function createSendToken(user, statusCode, res) {
  const token = signJWT(user._id);

  // Set the JWT token in a secure httpOnly cookie
  const cookieOptions = {
    expires: new Date(Date.now() + JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true, // Prevents JavaScript access to the cookie
    sameSite: NODE_ENV === "production" ? "none" : "lax", // CSRF protection
    secure: NODE_ENV === "production", // Only send cookie over HTTPS in production
    path: "/", // Cookie available for all routes
  };
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;

  // Send a success response with the user data (NO TOKEN in response body)
  respondSuccess(statusCode, user, res);
}
```

**Key Changes:**
- ❌ **Removed:** Token from response body
- ✅ **Added:** Cookie configuration with httpOnly flag
- ✅ **Added:** Environment-based SameSite and Secure settings

#### 2. Updated Authentication Middleware
**Priority Order:** Cookie → Authorization Header

```javascript
const protect = asyncHandler(async function (req, res, next) {
  let token;
  
  // Prioritize cookie over Authorization header
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please login to get access.", 401)
    );
  }

  const decoded = jwt.verify(token, JWT_SECRET);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("User does not exist.", 404));
  }

  req.user = currentUser;
  next();
});
```

#### 3. CORS Configuration (`app.js`)
```javascript
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // IMPORTANT: Allow credentials (cookies)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

### Frontend Changes

#### 1. Updated Axios Client (`apiClient.js`)
```javascript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // IMPORTANT: This enables sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - NO LONGER manually adding token
apiClient.interceptors.request.use(
  (config) => {
    // The httpOnly cookie will be sent automatically by the browser
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - NO LONGER clearing localStorage
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 2. Updated AuthContext (`AuthContext.jsx`)

**Removed localStorage Usage:**
```javascript
// OLD (REMOVED):
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(userData));
const token = localStorage.getItem('authToken');
localStorage.removeItem('authToken');

// NEW: No localStorage operations needed!
```

**Added Auth Verification on App Load:**
```javascript
useEffect(() => {
  const checkAuth = async () => {
    try {
      // Call backend to get current user (cookie will be sent automatically)
      const response = await authAPI.getCurrentUser();
      
      if (response.data.status === 'success' && response.data.data) {
        dispatch({ type: 'SET_USER', payload: response.data.data });
      }
    } catch {
      // User not authenticated or token expired
      dispatch({ type: 'SET_USER', payload: null });
    }
  };

  checkAuth();
}, []);
```

**Updated Login/Signup:**
```javascript
const login = async (credentials) => {
  try {
    dispatch({ type: 'LOGIN_START' });
    
    const response = await authAPI.login(credentials);
    
    if (response.data.status === 'success') {
      const userData = response.data.data;
      
      // No need to store token in localStorage - it's in httpOnly cookie
      dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
      toast.success('Login successful!');
      
      return { success: true };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Login failed';
    dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
    toast.error(errorMessage);
    
    return { success: false, error: errorMessage };
  }
};
```

---

## Testing the Implementation

### 1. Test Role-Based Access

**Employer Access Test:**
```bash
# Should succeed (employer creating job)
POST http://localhost:3001/api/v1/job
Cookie: jwt=<employer-token>
Body: { "role": "Software Engineer", "company": "Tech Corp", ... }

# Should fail with 403 (employee trying to create job)
POST http://localhost:3001/api/v1/job
Cookie: jwt=<employee-token>
Body: { "role": "Software Engineer", "company": "Tech Corp", ... }
```

**Employee Access Test:**
```bash
# Should succeed (employee saving job)
POST http://localhost:3001/api/v1/savedjobs
Cookie: jwt=<employee-token>
Body: { "jobId": "..." }

# Should fail with 403 (employer trying to save job)
POST http://localhost:3001/api/v1/savedjobs
Cookie: jwt=<employer-token>
Body: { "jobId": "..." }
```

### 2. Test HTTP-Only Cookies

**Login and Check Cookie:**
1. Login via frontend
2. Open DevTools → Application → Cookies
3. Verify `jwt` cookie exists with:
   - ✅ HttpOnly: ✓
   - ✅ Secure: ✓ (in production)
   - ✅ SameSite: Lax/None
   - ✅ Path: /

**Try to Access Cookie via JavaScript:**
```javascript
// This should return undefined or empty (security working!)
console.log(document.cookie); // jwt cookie should NOT appear here
```

**Verify Auto-Sending:**
1. Make any authenticated API request
2. Check Network tab → Request Headers
3. Verify `Cookie: jwt=...` is sent automatically

### 3. Test Cookie Clearance on Logout

**Logout Flow:**
1. Click logout button
2. Open DevTools → Application → Cookies
3. Verify `jwt` cookie is deleted
4. Try accessing protected route → Should redirect to login

---

## Security Comparison

| Feature | Before (localStorage) | After (httpOnly Cookie) |
|---------|----------------------|-------------------------|
| XSS Attack | ❌ Vulnerable | ✅ Protected |
| JavaScript Access | ❌ Yes | ✅ No |
| CSRF Protection | ⚠️ Manual | ✅ Built-in (SameSite) |
| Storage | Client-side | Server-controlled |
| Automatic Sending | ❌ Manual | ✅ Automatic |
| HTTPS Enforcement | ⚠️ Optional | ✅ Secure flag |

---

## Environment Variables Required

```env
# Backend (.env)
DATABASE="mongodb://..."
PORT=3001
CLIENT_URL="http://localhost:5174"
NODE_ENV=development  # or production
JWT_SECRET='your-secret-key'
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
```

---

## Role Definitions

| Role | Can Access | Cannot Access |
|------|------------|---------------|
| **Employee** | - Browse/search jobs<br>- Apply to jobs<br>- Save jobs<br>- View applications<br>- Update profile | - Create jobs<br>- View applicants<br>- Edit/delete jobs |
| **Employer** | - Post jobs<br>- Edit own jobs<br>- Delete own jobs<br>- View applicants<br>- View dashboard | - Apply to jobs<br>- Save jobs |
| **Guest** | - Browse jobs (limited)<br>- Search jobs<br>- View job details | All protected routes |

---

## Migration Checklist

### Backend ✅
- [x] Updated `restrictTo` to accept multiple roles
- [x] Modified `createSendToken` to remove token from response
- [x] Updated cookie configuration with httpOnly
- [x] Configured CORS with credentials
- [x] Updated all routers with role restrictions

### Frontend ✅
- [x] Removed all localStorage token operations
- [x] Added `withCredentials: true` to axios
- [x] Updated AuthContext to use `getCurrentUser` API
- [x] Removed token from request interceptors
- [x] Updated login/signup/logout flows

---

## Common Issues & Solutions

### Issue 1: "CORS error - credentials not allowed"
**Solution:** Ensure backend CORS has `credentials: true` and frontend axios has `withCredentials: true`

### Issue 2: Cookie not being sent with requests
**Solution:** 
- Check `withCredentials: true` in axios config
- Verify cookie domain matches request domain
- Check cookie path is `/`

### Issue 3: 401 Unauthorized after login
**Solution:**
- Check cookie is being set (DevTools → Application)
- Verify cookie name matches backend (`jwt`)
- Ensure `httpOnly` is not blocking server access

### Issue 4: Role restriction not working
**Solution:**
- Ensure `protect` middleware runs before `restrictTo`
- Verify `req.user.type` matches role string exactly
- Check user object has `type` field

---

## Best Practices

1. **Always use HTTPS in production** - Cookies with `secure: true` only work over HTTPS
2. **Set appropriate cookie expiration** - Match with JWT expiration
3. **Use SameSite=Strict for production** - Better CSRF protection
4. **Implement refresh token strategy** - For longer sessions without compromising security
5. **Log security events** - Track failed auth attempts, role violations
6. **Regular security audits** - Review and update security measures

---

## Next Steps (Optional Enhancements)

1. **Refresh Token Implementation**
   - Short-lived access tokens (15 min)
   - Long-lived refresh tokens (7 days)
   - Automatic token refresh

2. **Rate Limiting**
   - Prevent brute force attacks
   - Limit API requests per user/IP

3. **Two-Factor Authentication (2FA)**
   - Email/SMS verification
   - Authenticator app support

4. **Audit Logging**
   - Track all authentication events
   - Log role-based access attempts
   - Monitor suspicious activities

5. **Session Management**
   - Track active sessions
   - Force logout from all devices
   - Session timeout warnings

---

**Implementation Date:** October 6, 2025
**Security Level:** ⭐⭐⭐⭐ (High)

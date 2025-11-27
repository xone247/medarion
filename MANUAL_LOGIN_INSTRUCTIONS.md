# Manual Super Admin Login Instructions

## Quick Login

### Option 1: Use Login Form
1. Go to: https://medarion.africa/auth
2. Enter email: `superadmin@medarion.com`
3. Enter password: `admin123`
4. Click "Sign in"

### Option 2: Browser Console (If form doesn't work)

1. Open browser console (F12)
2. Navigate to: https://medarion.africa/admin
3. Run this JavaScript code:

```javascript
// Get fresh token
fetch('https://api.medarion.africa/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'superadmin@medarion.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(data => {
  const token = data.token;
  const user = data.user;
  
  // Set all possible token keys
  localStorage.setItem('auth_token', token);
  localStorage.setItem('medarionAuthToken', token);
  localStorage.setItem('medarionSessionToken', token);
  localStorage.setItem('medarionSession', JSON.stringify(user));
  
  console.log('✅ Login successful!');
  console.log('User:', user.full_name);
  console.log('Token set in localStorage');
  
  // Reload page
  window.location.reload();
});
```

## Login Credentials
- **Email:** superadmin@medarion.com
- **Password:** admin123

## Verification
After login, check:
- URL should be: https://medarion.africa/admin
- Admin dashboard should be visible
- No redirect to /auth page
- API calls should return 200 OK

## Token Storage Keys
The frontend uses these localStorage keys:
- `auth_token` - Primary token
- `medarionAuthToken` - Admin dashboard token
- `medarionSessionToken` - Session token
- `medarionSession` - Full user session data


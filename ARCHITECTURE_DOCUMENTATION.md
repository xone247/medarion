# Medarion Platform Architecture Documentation

## Overview

The Medarion platform uses a **hybrid backend architecture** combining Node.js (Express) and PHP to leverage the strengths of each technology.

## Backend Architecture

### Node.js (Express) - Primary Backend
- **Location**: `/home/medasnnc/api.medarion.africa/`
- **Port**: `3001` (localhost)
- **Process Manager**: PM2 (`medarion-backend`)
- **Purpose**: Handles all business logic, CRUD operations, authentication, and general API endpoints

#### Key Responsibilities:
- Blog post management (CRUD operations)
- Admin dashboard operations
- User authentication and authorization
- Database operations (MySQL)
- API routing and middleware
- Business logic and data processing

#### Main Routes:
- `/api/blog/*` - Blog post endpoints
- `/api/admin/*` - Admin operations
- `/api/auth/*` - Authentication endpoints
- `/api/health` - Health check endpoint

### PHP - File Upload Handler
- **Location**: `/home/medasnnc/api.medarion.africa/api/upload/` and `/home/medasnnc/api.medarion.africa/api/admin/`
- **Purpose**: Handles multipart/form-data file uploads

#### Key Responsibilities:
- Receiving file uploads via `multipart/form-data`
- Validating file types and sizes
- Saving files to server filesystem
- Returning public URLs for uploaded files
- CORS header management

#### Upload Endpoints:
- `/api/upload/image.php` - Blog post image uploads
- `/api/admin/upload.php` - Admin uploads (ads, announcements, companies, investors)

#### Why PHP for Uploads?
1. **Robust multipart/form-data handling**: PHP has native, battle-tested support for file uploads
2. **Existing architecture**: Node.js backend was designed to accept image URLs (strings), not raw file uploads
3. **Separation of concerns**: File handling is isolated from business logic
4. **Performance**: PHP handles file I/O efficiently for this use case

## Frontend Architecture

### React + Vite
- **Location**: `/home/medasnnc/public_html/` (production)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6

### API Communication
- **Base URL**: `https://api.medarion.africa` (production)
- **Service Layer**: `src/services/apiService.ts` and `src/services/adminApi.ts`
- **CORS**: Handled by backend (PHP and Node.js)

## Apache Configuration

### Main API Subdomain (.htaccess)
**Location**: `/home/medasnnc/api.medarion.africa/.htaccess`

```apache
# Check if REQUEST_URI ends with .php BEFORE proxying
RewriteCond %{REQUEST_URI} \.php$ [NC]
RewriteRule ^ - [L]

# Proxy /api/* requests to Node.js (except PHP files)
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]
```

**Key Rule**: PHP files are checked first and allowed to execute directly. All other `/api/*` requests are proxied to Node.js.

### Upload Directory .htaccess Files
**Locations**: 
- `/home/medasnnc/api.medarion.africa/api/upload/.htaccess`
- `/home/medasnnc/api.medarion.africa/api/admin/.htaccess`

These ensure PHP files execute and set CORS headers.

## CORS Configuration

### PHP Upload Endpoints
All PHP upload scripts set CORS headers **before any output**:

```php
// Dynamic origin handling
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
if (strpos($origin, 'medarion.africa') !== false) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: POST, OPTIONS, GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
```

### Node.js Backend
CORS is handled by Express middleware (typically `cors` package).

## File Upload Flow

1. **Frontend** (`ImageUploadModal.tsx` or `BlogEditor.tsx`):
   - User selects/drops file
   - Creates `FormData` with file
   - Sends POST request to PHP upload endpoint with `Authorization` header

2. **PHP Upload Script** (`api/upload/image.php` or `api/admin/upload.php`):
   - Validates authorization token
   - Validates file type and size
   - Saves file to `/uploads/{type}/` directory
   - Returns JSON with public URL: `{ success: true, url: "https://api.medarion.africa/uploads/..." }`

3. **Frontend**:
   - Receives URL from PHP endpoint
   - Sends URL to Node.js backend via `adminApi.createBlogPost()` or `adminApi.updateBlogPost()`

4. **Node.js Backend** (`server/routes/admin.js`):
   - Receives image URL (string)
   - Saves URL to database in `featured_image` or `image_url` column

## Database Schema

### Blog Posts (`blog_posts` table)
- `featured_image` (VARCHAR) - URL to uploaded image
- `video_url` (VARCHAR) - YouTube video URL
- `slug` (VARCHAR) - URL-friendly identifier

### Other Tables with Image Support
- `advertisements` - `image_url` column
- `announcements` - `image_url` column
- `companies` - `logo` column
- `investors` - `logo` column

**Migration**: The `ensureImageColumns()` function in `server/routes/admin.js` automatically adds these columns if they don't exist.

## Deployment Structure

```
/home/medasnnc/
├── api.medarion.africa/          # Node.js backend subdomain
│   ├── .htaccess                 # Main routing configuration
│   ├── server.js                 # Node.js entry point
│   ├── routes/                   # Express routes
│   │   ├── blog.js
│   │   └── admin.js
│   ├── api/
│   │   ├── upload/
│   │   │   ├── .htaccess
│   │   │   └── image.php
│   │   └── admin/
│   │       ├── .htaccess
│   │       └── upload.php
│   └── uploads/                  # Uploaded files
│       ├── images/
│       │   └── blog/
│       ├── ads/
│       ├── announcement/
│       ├── company/
│       └── investor/
│
└── public_html/                  # React frontend
    ├── .htaccess
    ├── index.html
    └── assets/
```

## Server Management

### PM2 Process
```bash
# Check status
/opt/cpanel/ea-nodejs22/bin/pm2 status medarion-backend

# Restart
/opt/cpanel/ea-nodejs22/bin/pm2 restart medarion-backend

# View logs
/opt/cpanel/ea-nodejs22/bin/pm2 logs medarion-backend
```

### SSH Access
- **Host**: `server1.medarion.africa`
- **User**: `root`
- **Key**: `C:\Users\xone\.ssh\medarionput.ppk`
- **Port**: As specified in `cpanel-config.json`

## Development vs Production

### Development (Local)
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- PHP uploads: `http://localhost/medarion/api/upload/image.php`

### Production
- Frontend: `https://medarion.africa`
- Backend API: `https://api.medarion.africa`
- PHP uploads: `https://api.medarion.africa/api/upload/image.php`

## Troubleshooting

### CORS Errors
1. Check PHP scripts set headers **before any output**
2. Verify `.htaccess` allows PHP execution
3. Check Node.js CORS middleware configuration

### 404 Errors on API Endpoints
1. Verify PM2 process is running: `pm2 status medarion-backend`
2. Check `.htaccess` routing rules
3. Ensure PHP files exist on server
4. Check Apache error logs

### File Upload Failures
1. Verify upload directories exist with correct permissions (755)
2. Check PHP `upload_max_filesize` and `post_max_size` settings
3. Verify CORS headers are set correctly
4. Check file type validation in PHP scripts

## Best Practices

1. **Always set CORS headers first** in PHP scripts
2. **Use specific origins** in production, wildcard in development
3. **Validate file types and sizes** on both frontend and backend
4. **Use database migrations** to ensure schema consistency
5. **Keep PHP and Node.js in sync** for shared data structures
6. **Monitor PM2 logs** for backend errors
7. **Test uploads** after any deployment

## Future Considerations

### Potential Migration to Pure Node.js
If desired, file uploads can be migrated to Node.js using:
- `multer` middleware for multipart/form-data
- `express-fileupload` or similar
- New upload endpoints in Express routes

**Current recommendation**: Keep hybrid architecture as it's working well and leverages each technology's strengths.


# cPanel Node.js Deployment Checklist

## Pre-Deployment
- [ ] Built frontend: 
pm run build
- [ ] Created cPanel database
- [ ] Created database user and granted permissions
- [ ] Configured cpanel-config.json with credentials

## cPanel Setup
- [ ] Created Node.js application in cPanel Node.js Selector
- [ ] Selected Node.js version 18.x or higher
- [ ] Set application root path
- [ ] Set application URL path
- [ ] Set startup file to: server.js
- [ ] Set port (or let cPanel assign)

## File Upload
- [ ] Uploaded all files from 'cpanel-nodejs-app' directory
- [ ] Uploaded to: /home/username/nodevenv/medarion/[version]/bin/
- [ ] Set correct file permissions (755 for directories, 644 for files)

## Configuration
- [ ] Updated .env file with production database credentials
- [ ] Set environment variables in cPanel Node.js Selector
- [ ] Updated CORS_ORIGIN to your production domain
- [ ] Set JWT_SECRET to a strong random value

## Dependencies
- [ ] Ran 
pm install in the application directory
- [ ] Verified all dependencies installed successfully

## Database
- [ ] Created production database
- [ ] Imported database schema (if needed)
- [ ] Tested database connection

## Testing
- [ ] Started Node.js application in cPanel
- [ ] Checked application logs for errors
- [ ] Tested health endpoint: /health
- [ ] Tested API endpoints
- [ ] Verified CORS is working
- [ ] Tested authentication endpoints

## Frontend Integration
- [ ] Updated frontend API base URL to production
- [ ] Deployed frontend files to public_html
- [ ] Tested full application flow
- [ ] Verified all API calls work from frontend

## Security
- [ ] Changed default JWT_SECRET
- [ ] Verified HTTPS is enabled
- [ ] Checked that sensitive files are not publicly accessible
- [ ] Verified .env file is not in public directory

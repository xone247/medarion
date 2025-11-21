# cPanel Node.js Setup Instructions

## Step 1: Access Node.js Selector in cPanel

1. Log into your cPanel
2. Go to: Software → Node.js Selector
3. Click "Create Application"

## Step 2: Configure Node.js Application

Fill in the following settings:

- **Node.js Version**: Select the latest available (18.x or higher recommended)
- **Application Mode**: Production
- **Application Root**: /home/username/nodevenv/medarion/18/bin
- **Application URL**: /medarion-api (or your preferred path)
- **Application Startup File**: server.js
- **Application Port**: 3001 (or let cPanel assign one)

## Step 3: Install Dependencies

After creating the app, cPanel will show you the application path.
SSH into your server and run:

`ash
cd /home/username/nodevenv/medarion/18/bin
npm install
`

Or use cPanel's "Run NPM Install" button if available.

## Step 4: Configure Environment Variables

1. In cPanel Node.js Selector, click on your application
2. Go to "Environment Variables" section
3. Add the following variables (from your .env file):
   - NODE_ENV=production
   - PORT=3001
   - DB_HOST=localhost
   - DB_PORT=3306
   - DB_NAME=your_database_name
   - DB_USER=your_database_user
   - DB_PASSWORD=your_database_password
   - CORS_ORIGIN=https://yourdomain.com
   - JWT_SECRET=your-secret-key

## Step 5: Start the Application

1. In Node.js Selector, click "Start" on your application
2. Check the logs to ensure it started successfully
3. Test the API endpoint: https://yourdomain.com/medarion-api/health

## Step 6: Configure Domain/Subdomain (Optional)

If you want to use a subdomain (e.g., api.yourdomain.com):

1. Go to: Domains → Subdomains
2. Create subdomain: api
3. Point it to: /home/username/nodevenv/medarion/18/bin
4. Update CORS_ORIGIN in environment variables

## Troubleshooting

- **Application won't start**: Check logs in Node.js Selector
- **Database connection failed**: Verify database credentials
- **Port already in use**: Change PORT in environment variables
- **Module not found**: Run 
pm install again

## File Structure on cPanel

Your Node.js app should be located at:
/home/username/nodevenv/medarion/[version]/bin/

Upload all files from the 'cpanel-nodejs-app' directory to this location.

# Medarion Healthcare Platform

A comprehensive healthcare platform built with React/TypeScript frontend and Node.js backend, using MySQL database from XAMPP.

## 🚀 Quick Start

### First Time Setup

1. **Set up Git and GitHub:**
   ```powershell
   .\setup_git_github.ps1
   ```

2. **Set up fast development workflow:**
   ```powershell
   .\setup_fast_workflow.ps1
   ```
   This creates shortcuts and optimizes your workflow.

3. **Install dependencies:**
   ```bash
   npm run install:all
   ```

4. **Setup database:**
   ```bash
   npm run setup:db
   ```

5. **Start development:**
   ```bash
   npm start
   ```

### ⚡ Fast Development Workflow

**One-command deployment:**
```powershell
# Commit, push, and deploy to cPanel
.\qd.ps1 -Message "Your changes" -Deploy
```

**Quick Git commands** (after loading `git_quick_commands.ps1`):
```powershell
git-status          # Quick status
git-save "message"  # Add and commit
git-push "message"  # Add, commit, push
git-pull            # Pull latest
```

**See `QUICK_WORKFLOW.md` for complete quick reference!**

### Git Workflow

After initial setup, your typical workflow:

```powershell
# Quick save
git-save "Description of changes"

# Or full workflow
.\qd.ps1 -Message "Description" -Deploy
```

**Important:** Sensitive files (`.env`, `cpanel-config.json`, SSH keys) are automatically excluded from Git via `.gitignore`.

## 📚 Documentation

- **Complete Knowledge Base:** See `PROJECT_KNOWLEDGE_BASE.md` for all project information
- **Working Environment:** See `WORKING_ENVIRONMENT.md` for deployment and SSH details
- **Quick Reference:** See `QUICK_REFERENCE.md` for common commands
- **Architecture:** See `ARCHITECTURE_DOCUMENTATION.md` for technical details

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MySQL2
- **Database**: MySQL (via XAMPP)
- **Authentication**: JWT tokens
- **API**: RESTful API with proper error handling

## 🚀 Quick Start

### Prerequisites

1. **XAMPP** installed and running
   - Start Apache and MySQL services
   - MySQL should be accessible on `localhost:3306`
   - Default credentials: `root` with no password

2. **Node.js** (v18 or higher)
3. **npm** or **yarn**

### Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Setup the database:**
   ```bash
   npm run setup:db
   ```
   This will create the `medarion_platform` database and all required tables.

3. **Start the application:**
   ```bash
   npm start
   ```
   This will start both the backend server (port 3001) and frontend dev server (port 5173).

### Alternative: Manual Setup

If you prefer to run services separately:

1. **Start the backend:**
   ```bash
   npm run server:dev
   ```

2. **Start the frontend (in another terminal):**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
medarion/
├── src/                    # Frontend React application
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Auth, Theme, Dashboard)
│   ├── pages/             # Page components
│   ├── lib/               # API client and utilities
│   └── types/              # TypeScript type definitions
├── server/                 # Backend Node.js application
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── config/            # Database configuration
│   └── server.js          # Main server file
├── api/                    # Legacy PHP API (can be removed)
├── config/                 # Database configuration files
└── create_database.sql     # Database schema
```

## 🔧 Configuration

### Backend Configuration

The backend uses environment variables. Create a `.env` file in the `server/` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medarion_platform
DB_USER=root
DB_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Frontend Configuration

The frontend uses Vite environment variables. Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Medarion Healthcare Platform
VITE_APP_VERSION=1.0.0
```

## 🗄️ Database Schema

The application includes the following main tables:

- **users** - User accounts and profiles
- **companies** - Startup and investor companies
- **deals** - Investment deals and transactions
- **grants** - Research grants and funding opportunities
- **clinical_trials** - Clinical trial information
- **blog_posts** - Blog content management
- **newsletter_subscriptions** - Newsletter signups
- **user_sessions** - Authentication sessions

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Companies
- `GET /api/companies` - List companies
- `GET /api/companies/:id` - Get company details
- `POST /api/companies` - Create company (authenticated)
- `PUT /api/companies/:id` - Update company (authenticated)
- `DELETE /api/companies/:id` - Delete company (authenticated)

### Deals
- `GET /api/deals` - List deals
- `GET /api/deals/:id` - Get deal details
- `POST /api/deals` - Create deal (authenticated)
- `PUT /api/deals/:id` - Update deal (authenticated)
- `DELETE /api/deals/:id` - Delete deal (authenticated)

### Grants
- `GET /api/grants` - List grants
- `GET /api/grants/:id` - Get grant details
- `POST /api/grants` - Create grant (authenticated)
- `PUT /api/grants/:id` - Update grant (authenticated)
- `DELETE /api/grants/:id` - Delete grant (authenticated)

### Clinical Trials
- `GET /api/clinical-trials` - List clinical trials
- `GET /api/clinical-trials/:id` - Get trial details
- `POST /api/clinical-trials` - Create trial (authenticated)
- `PUT /api/clinical-trials/:id` - Update trial (authenticated)
- `DELETE /api/clinical-trials/:id` - Delete trial (authenticated)

### Blog
- `GET /api/blog` - List blog posts
- `GET /api/blog/:id` - Get blog post
- `GET /api/blog/slug/:slug` - Get blog post by slug
- `POST /api/blog` - Create blog post (authenticated)
- `PUT /api/blog/:id` - Update blog post (authenticated)
- `DELETE /api/blog/:id` - Delete blog post (authenticated)

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run server:dev` - Start backend development server
- `npm start` - Start both frontend and backend
- `npm run build` - Build frontend for production
- `npm run lint` - Run ESLint
- `npm run setup` - Full setup (install + database)
- `npm run setup:db` - Setup database only

### Database Management

To reset the database:
```bash
# Drop and recreate database
mysql -u root -e "DROP DATABASE IF EXISTS medarion_platform;"
npm run setup:db
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection with Helmet

## 🚀 Deployment

### Production Build

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Start the backend in production:**
   ```bash
   cd server
   npm start
   ```

### Environment Variables for Production

Update the environment variables for your production environment:

- Database credentials
- JWT secret (use a strong, random secret)
- CORS origin (your production domain)
- Port configuration

## 📝 Notes

- The application maintains backward compatibility with the existing React frontend
- All API endpoints are properly documented and typed
- The database schema includes sample data for testing
- Authentication is handled via JWT tokens stored in localStorage
- The application supports multiple user roles: admin, investor, startup, researcher, regulator

## 🆘 Troubleshooting

### Common Issues

1. **Database connection failed:**
   - Ensure XAMPP MySQL is running
   - Check database credentials in server configuration
   - Verify MySQL is accessible on localhost:3306

2. **Frontend can't connect to backend:**
   - Check that backend is running on port 3001
   - Verify CORS configuration
   - Check API URL in frontend environment variables

3. **Authentication issues:**
   - Clear localStorage and try logging in again
   - Check JWT secret configuration
   - Verify token expiration settings

### Getting Help

If you encounter issues:
1. Check the console for error messages
2. Verify all services are running (XAMPP, Node.js)
3. Check the database connection
4. Review the API endpoints and authentication flow

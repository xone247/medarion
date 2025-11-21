# Deployment Safety Checks

## Overview

All deployment scripts now include safety checks to prevent errors and avoid redundant operations. This document lists all the checks implemented.

## Safety Checks by Step

### Step 1: Cleanup
**File:** `deploy_step1_cleanup.ps1`

- ✅ **Database Existence Check**
  - Checks if database exists before backing up
  - Only backs up if database exists
  - Skips backup if database doesn't exist

- ✅ **Database Drop Check**
  - Checks if database exists before dropping
  - Only drops if database exists
  - Creates database if it doesn't exist

### Step 2: Build
**File:** `deploy_step2_build.ps1`

- ✅ **package.json Check**
  - Verifies package.json exists before proceeding
  - Exits with error if not found

- ✅ **node_modules Check**
  - Checks if node_modules exists
  - Checks if node_modules has packages
  - Skips installation if already installed
  - Reinstalls if directory is empty

- ✅ **Build Output Check**
  - Checks if medarion-dist exists
  - Prompts to rebuild if exists
  - Verifies build output after build

### Step 3: Upload Frontend
**File:** `deploy_step3_upload_frontend.ps1`

- ✅ **Build Existence Check**
  - Verifies medarion-dist directory exists
  - Verifies index.html exists
  - Exits if build not found

- ✅ **Server File Check**
  - Checks if files already exist on server
  - Prompts to overwrite or skip
  - Prevents accidental overwrites

### Step 4: Upload Backend
**File:** `deploy_step4_upload_backend.ps1`

- ✅ **Source File Checks**
  - Verifies server directory exists
  - Verifies server.js exists
  - Verifies package.json exists
  - Exits if any missing

- ✅ **Server Backend Check**
  - Checks if backend already exists on server
  - Prompts to overwrite or skip
  - Prevents accidental overwrites

### Step 5: Upload .htaccess
**File:** `deploy_step5_upload_htaccess.ps1`

- ✅ **Server .htaccess Check**
  - Checks if .htaccess already exists on server
  - Prompts to overwrite or skip
  - Prevents accidental overwrites

- ✅ **Local .htaccess Check**
  - Uses existing .htaccess if found locally
  - Creates new one if not found

- ✅ **Apache Module Verification**
  - Checks all required modules
  - Warns if modules missing
  - Prompts to continue or stop

### Step 6: Upload Database
**File:** `deploy_step6_upload_database.ps1`

- ✅ **SQL File Existence Check**
  - Verifies SQL file exists locally
  - Lists available SQL files if not found
  - Exits if no SQL file found

- ✅ **Server SQL File Check**
  - Checks if SQL file already exists on server
  - Prompts to re-upload or use existing
  - Prevents redundant uploads

### Step 7: Deploy on Server
**File:** `deploy_step7_deploy_server.ps1`

- ✅ **Database Status Check**
  - Checks if database exists
  - Checks if database has tables
  - Prompts before importing if tables exist
  - Handles empty database
  - Creates database if doesn't exist

- ✅ **Node.js Dependencies Check**
  - Checks if node_modules exists
  - Checks if node_modules has packages
  - Prompts to reinstall or use existing
  - Skips installation if already installed

- ✅ **.env File Check**
  - Checks if .env file exists
  - Prompts to overwrite or keep existing
  - Preserves existing .env if user chooses

- ✅ **PM2 Config Check**
  - Checks if ecosystem.config.js exists
  - Prompts to overwrite or keep existing
  - Preserves existing config if user chooses

- ✅ **PM2 Process Check**
  - Checks if PM2 process already exists
  - Shows current process status
  - Prompts to restart or keep running
  - Prevents duplicate processes

- ✅ **Port Availability Check**
  - Checks if port 3001 is available
  - Stops conflicting processes automatically
  - Verifies port is free before starting

- ✅ **Vast.ai Tunnel Script Check**
  - Checks if tunnel script exists
  - Prompts to overwrite or keep existing
  - Preserves existing script if user chooses

### Step 8: Verification
**File:** `deploy_step8_verify.ps1`

- ✅ **Comprehensive Checks**
  - PM2 status
  - Application health
  - Frontend files
  - Backend files
  - Database tables
  - .htaccess
  - .env file
  - Node.js version
  - Port 3001
  - Apache modules
  - Database backups

## Benefits

### Prevents Errors
- ✅ No "file already exists" errors
- ✅ No "database already exists" errors
- ✅ No "port already in use" errors
- ✅ No "module not found" errors

### Avoids Redundancy
- ✅ Skips unnecessary operations
- ✅ Reuses existing resources
- ✅ Prevents duplicate processes
- ✅ Avoids redundant uploads

### User Control
- ✅ Prompts before overwriting
- ✅ Allows skipping steps
- ✅ Shows what already exists
- ✅ Provides options to continue

### Safety
- ✅ Backs up before destructive operations
- ✅ Verifies prerequisites before proceeding
- ✅ Checks dependencies before installing
- ✅ Confirms before overwriting

## User Prompts

The scripts now prompt the user when:
1. Files already exist on server (overwrite or skip)
2. Database already has tables (import anyway or skip)
3. Dependencies already installed (reinstall or skip)
4. PM2 process already running (restart or keep)
5. Configuration files exist (overwrite or keep)
6. Required Apache modules missing (continue or stop)

## Error Prevention

### Before Operations
- ✅ Check if target exists
- ✅ Check if source exists
- ✅ Check prerequisites
- ✅ Check dependencies

### During Operations
- ✅ Handle existing files gracefully
- ✅ Handle existing processes gracefully
- ✅ Handle existing databases gracefully
- ✅ Handle missing modules gracefully

### After Operations
- ✅ Verify operations succeeded
- ✅ Check for errors
- ✅ Report status
- ✅ Update state

## Example Flow

### Typical Deployment
1. **Step 1:** Checks database → Backs up if exists → Cleans
2. **Step 2:** Checks node_modules → Installs if needed → Builds
3. **Step 3:** Checks server files → Prompts if exist → Uploads
4. **Step 4:** Checks server backend → Prompts if exists → Uploads
5. **Step 5:** Checks .htaccess → Prompts if exists → Uploads → Checks modules
6. **Step 6:** Checks SQL file → Prompts if exists → Uploads
7. **Step 7:** Checks database → Prompts if has tables → Imports
   - Checks node_modules → Prompts to reinstall → Installs
   - Checks .env → Prompts to overwrite → Creates/Updates
   - Checks PM2 process → Prompts to restart → Starts
8. **Step 8:** Verifies everything

### Resume After Interruption
- Scripts check what's already done
- Skip completed operations
- Only do what's needed
- No redundant operations

## Best Practices

1. **Always check before creating**
   - Files, directories, databases, processes

2. **Always prompt before overwriting**
   - Configuration files, uploaded files

3. **Always verify prerequisites**
   - Dependencies, modules, ports

4. **Always handle existing resources**
   - Reuse when possible, prompt when needed

5. **Always verify after operations**
   - Check success, report status


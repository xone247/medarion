# Quick Start: Deployment

## First Time Setup

```powershell
# 1. Create necessary folders
.\deploy_setup_folders.ps1

# 2. Start deployment (interactive menu)
.\deploy_controller.ps1
```

## Common Commands

### Run Complete Deployment
```powershell
.\deploy_controller.ps1 -All
```

### Resume After Failure
```powershell
.\deploy_controller.ps1 -Resume
```

### Check Status
```powershell
.\deploy_controller.ps1 -Status
```

### Run Specific Step
```powershell
.\deploy_controller.ps1 -Step step2_build
```

### Reset and Start Fresh
```powershell
.\deploy_controller.ps1 -Reset
.\deploy_controller.ps1 -All
```

## Step Names

- `step1_cleanup` - Clean cPanel
- `step2_build` - Build frontend
- `step3_upload_frontend` - Upload frontend
- `step4_upload_backend` - Upload backend
- `step5_upload_htaccess` - Upload .htaccess
- `step6_upload_database` - Upload database
- `step7_deploy_server` - Deploy on server

## What Gets Created

- `.deployment/deployment_state.json` - Tracks which steps completed
- `medarion-dist/` - Built frontend (created by step 2)
- `logs/` - Deployment logs
- `temp/` - Temporary files


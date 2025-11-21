# Deployment System Documentation

## Overview

The deployment system is split into modular scripts that can be run individually or together. Each step tracks its completion status, allowing you to resume from where you left off.

## Scripts

### Setup Script
- **`deploy_setup_folders.ps1`** - Creates necessary folders for deployment

### State Management
- **`deploy_state.ps1`** - Manages deployment state tracking (JSON file in `.deployment/`)

### Controller Script
- **`deploy_controller.ps1`** - Main controller that manages the deployment process

### Individual Step Scripts
1. **`deploy_step1_cleanup.ps1`** - Clean cPanel and reset database
2. **`deploy_step2_build.ps1`** - Build React frontend
3. **`deploy_step3_upload_frontend.ps1`** - Upload frontend files
4. **`deploy_step4_upload_backend.ps1`** - Upload backend files
5. **`deploy_step5_upload_htaccess.ps1`** - Upload .htaccess configuration
6. **`deploy_step6_upload_database.ps1`** - Upload database SQL file
7. **`deploy_step7_deploy_server.ps1`** - Deploy on server (import DB, install deps, start PM2)

## Quick Start

### First Time Setup
```powershell
# 1. Create necessary folders
.\deploy_setup_folders.ps1

# 2. Run deployment controller
.\deploy_controller.ps1
```

### Using the Controller

#### Interactive Mode
```powershell
.\deploy_controller.ps1
```
Shows a menu with options:
1. Run All Steps (from beginning)
2. Resume Deployment (continue from last step)
3. Run Specific Step
4. Show Status
5. Reset State (start fresh)
6. Exit

#### Command Line Options

**Run all steps from beginning:**
```powershell
.\deploy_controller.ps1 -All
```

**Resume from last completed step:**
```powershell
.\deploy_controller.ps1 -Resume
```

**Run a specific step:**
```powershell
.\deploy_controller.ps1 -Step step1_cleanup
.\deploy_controller.ps1 -Step step2_build
# etc.
```

**Show current status:**
```powershell
.\deploy_controller.ps1 -Status
```

**Reset state (start fresh):**
```powershell
.\deploy_controller.ps1 -Reset
```

### Running Individual Steps

You can also run steps directly:
```powershell
.\deploy_step1_cleanup.ps1
.\deploy_step2_build.ps1
.\deploy_step3_upload_frontend.ps1
# etc.
```

Each step will:
- Check if it's already completed (skip if done)
- Update state on completion
- Verify its own success

## State Tracking

The deployment state is stored in `.deployment/deployment_state.json`:

```json
{
  "version": "1.0",
  "started": "2025-01-15 10:00:00",
  "lastUpdated": "2025-01-15 10:30:00",
  "steps": {
    "step1_cleanup": {
      "status": "completed",
      "completed": true,
      "timestamp": "2025-01-15 10:05:00",
      "error": null
    },
    "step2_build": {
      "status": "pending",
      "completed": false,
      "timestamp": null,
      "error": null
    }
  }
}
```

### Step Status Values
- `pending` - Not started yet
- `in_progress` - Currently running
- `completed` - Successfully completed
- `failed` - Failed with error
- `skipped` - Skipped by user

## Workflow Examples

### Complete Fresh Deployment
```powershell
.\deploy_setup_folders.ps1
.\deploy_controller.ps1 -All
```

### Resume After Failure
```powershell
# Check status first
.\deploy_controller.ps1 -Status

# Resume from last step
.\deploy_controller.ps1 -Resume
```

### Fix a Failed Step
```powershell
# Check which step failed
.\deploy_controller.ps1 -Status

# Re-run the failed step
.\deploy_controller.ps1 -Step step3_upload_frontend
```

### Partial Deployment (Skip Steps)
```powershell
# Run specific steps only
.\deploy_step2_build.ps1
.\deploy_step3_upload_frontend.ps1
```

## Troubleshooting

### State File Issues
If the state file gets corrupted:
```powershell
.\deploy_controller.ps1 -Reset
```

### Step Failed
1. Check the error message
2. Fix the issue
3. Re-run the step:
   ```powershell
   .\deploy_controller.ps1 -Step stepX_name
   ```

### Skip Completed Steps
The controller automatically skips completed steps when resuming. To force re-run:
```powershell
# Run the step script directly (it will update state)
.\deploy_stepX_name.ps1
```

## File Structure

```
.
├── deploy_setup_folders.ps1      # Setup script
├── deploy_state.ps1              # State management
├── deploy_controller.ps1         # Main controller
├── deploy_step1_cleanup.ps1      # Step 1
├── deploy_step2_build.ps1        # Step 2
├── deploy_step3_upload_frontend.ps1  # Step 3
├── deploy_step4_upload_backend.ps1   # Step 4
├── deploy_step5_upload_htaccess.ps1  # Step 5
├── deploy_step6_upload_database.ps1  # Step 6
├── deploy_step7_deploy_server.ps1    # Step 7
├── .deployment/
│   └── deployment_state.json     # State file
└── medarion-dist/                # Built frontend (created by step 2)
```

## Best Practices

1. **Always run setup first**: `.\deploy_setup_folders.ps1`
2. **Use the controller**: It manages state and resume capability
3. **Check status regularly**: `.\deploy_controller.ps1 -Status`
4. **Don't manually edit state file**: Use the controller or step scripts
5. **Resume after failures**: The controller will continue from where it stopped

## Notes

- Each step is independent and can be run standalone
- Steps check their prerequisites (e.g., step 3 requires step 2)
- State is automatically updated on completion
- Failed steps can be re-run individually
- The controller provides progress tracking and error handling


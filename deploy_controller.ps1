# Deployment Controller Script
# Manages deployment process with state tracking and resume capability

$ErrorActionPreference = "Continue"

# Import state management
. .\deploy_state.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Deployment Controller                                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Initialize state
Initialize-DeploymentState

# Step definitions
$stepDefinitions = @{
    step1_cleanup = @{ 
        Name = "Step 1: Cleanup"; 
        Script = "deploy_step1_cleanup.ps1";
        Description = "Clean cPanel and reset database"
    }
    step2_build = @{ 
        Name = "Step 2: Build Frontend"; 
        Script = "deploy_step2_build.ps1";
        Description = "Build React frontend"
    }
    step3_upload_frontend = @{ 
        Name = "Step 3: Upload Frontend"; 
        Script = "deploy_step3_upload_frontend.ps1";
        Description = "Upload frontend files to cPanel"
    }
    step4_upload_backend = @{ 
        Name = "Step 4: Upload Backend"; 
        Script = "deploy_step4_upload_backend.ps1";
        Description = "Upload backend server files"
    }
    step5_upload_htaccess = @{ 
        Name = "Step 5: Upload .htaccess"; 
        Script = "deploy_step5_upload_htaccess.ps1";
        Description = "Upload Apache configuration"
    }
    step6_upload_database = @{ 
        Name = "Step 6: Upload Database"; 
        Script = "deploy_step6_upload_database.ps1";
        Description = "Upload database SQL file"
    }
    step7_deploy_server = @{ 
        Name = "Step 7: Deploy on Server"; 
        Script = "deploy_step7_deploy_server.ps1";
        Description = "Import database, install dependencies, start PM2"
    }
    step8_verify = @{ 
        Name = "Step 8: Post-Deployment Verification"; 
        Script = "deploy_step8_verify.ps1";
        Description = "Verify all components are working"
    }
}

# Function to run a step
function Invoke-DeploymentStep {
    param(
        [string]$StepName,
        [switch]$Force
    )
    
    $stepDef = $stepDefinitions[$StepName]
    if (-not $stepDef) {
        Write-Host "❌ Unknown step: $StepName" -ForegroundColor Red
        return $false
    }
    
    # Check if already completed
    $stepStatus = Get-StepStatus $StepName
    if ($stepStatus.completed -and -not $Force) {
        Write-Host "⏭️  $($stepDef.Name) already completed" -ForegroundColor Yellow
        Write-Host "   Completed: $($stepStatus.timestamp)" -ForegroundColor Gray
        Write-Host "   Use -Force to re-run" -ForegroundColor Gray
        return $true
    }
    
    # Check if script exists
    if (-not (Test-Path $stepDef.Script)) {
        Write-Host "❌ Script not found: $($stepDef.Script)" -ForegroundColor Red
        Update-StepStatus $StepName "failed" "Script file not found"
        return $false
    }
    
    # Mark as in progress
    Update-StepStatus $StepName "in_progress"
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "▶️  Running: $($stepDef.Name)" -ForegroundColor Cyan
    Write-Host "   $($stepDef.Description)" -ForegroundColor Gray
    Write-Host ""
    
    # Run the step script
    try {
        $result = & powershell -ExecutionPolicy Bypass -File $stepDef.Script
        
        if ($LASTEXITCODE -eq 0) {
            Update-StepStatus $StepName "completed"
            Write-Host ""
            Write-Host "✅ $($stepDef.Name) completed successfully" -ForegroundColor Green
            return $true
        } else {
            Update-StepStatus $StepName "failed" "Exit code: $LASTEXITCODE"
            Write-Host ""
            Write-Host "❌ $($stepDef.Name) failed!" -ForegroundColor Red
            return $false
        }
    } catch {
        Update-StepStatus $StepName "failed" $_.Exception.Message
        Write-Host ""
        Write-Host "❌ $($stepDef.Name) failed with error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Show current status
function Show-DeploymentStatus {
    $summary = Get-DeploymentSummary
    if (-not $summary) {
        Write-Host "No deployment state found" -ForegroundColor Yellow
        return
    }
    
    Write-Host ""
    Write-Host "📊 Deployment Status:" -ForegroundColor Cyan
    Write-Host "   Total Steps: $($summary.total)" -ForegroundColor White
    Write-Host "   ✅ Completed: $($summary.completed)" -ForegroundColor Green
    Write-Host "   ❌ Failed: $($summary.failed)" -ForegroundColor Red
    Write-Host "   ⏳ Pending: $($summary.pending)" -ForegroundColor Yellow
    Write-Host "   🔄 In Progress: $($summary.inProgress)" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Step Details:" -ForegroundColor Cyan
    foreach ($step in $summary.steps) {
        $stepDef = $stepDefinitions[$step.name]
        $statusIcon = switch ($step.status) {
            "completed" { "✅" }
            "failed" { "❌" }
            "in_progress" { "🔄" }
            default { "⏳" }
        }
        
        $statusColor = switch ($step.status) {
            "completed" { "Green" }
            "failed" { "Red" }
            "in_progress" { "Cyan" }
            default { "Yellow" }
        }
        
        Write-Host "   $statusIcon $($stepDef.Name)" -ForegroundColor $statusColor
        if ($step.timestamp) {
            Write-Host "      Time: $($step.timestamp)" -ForegroundColor Gray
        }
        if ($step.status -eq "failed") {
            $stepStatus = Get-StepStatus $step.name
            if ($stepStatus.error) {
                Write-Host "      Error: $($stepStatus.error)" -ForegroundColor Red
            }
        }
    }
    Write-Host ""
}

# Main menu
function Show-MainMenu {
    param([switch]$AutoResume)
    
    $summary = Get-DeploymentSummary
    
    if ($AutoResume -and $summary.pending -gt 0) {
        $nextStep = Get-NextPendingStep
        if ($nextStep) {
            Write-Host "🔄 Resuming deployment from: $($stepDefinitions[$nextStep].Name)" -ForegroundColor Cyan
            Write-Host ""
            return $nextStep
        }
    }
    
    Write-Host "Deployment Options:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   1. Run All Steps (from beginning)" -ForegroundColor White
    Write-Host "   2. Resume Deployment (continue from last step)" -ForegroundColor White
    Write-Host "   3. Run Specific Step" -ForegroundColor White
    Write-Host "   4. Show Status" -ForegroundColor White
    Write-Host "   5. Reset State (start fresh)" -ForegroundColor White
    Write-Host "   6. Exit" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Select option (1-6)"
    return $choice
}

# Parse command line arguments
$autoResume = $false
$runAll = $false
$specificStep = $null
$showStatus = $false
$reset = $false

foreach ($arg in $args) {
    switch ($arg) {
        "-Resume" { $autoResume = $true }
        "-All" { $runAll = $true }
        "-Status" { $showStatus = $true }
        "-Reset" { $reset = $true }
        "-Step" { 
            $stepIndex = $args.IndexOf($arg) + 1
            if ($stepIndex -lt $args.Count) {
                $specificStep = $args[$stepIndex]
            }
        }
    }
}

# Handle command line options
if ($reset) {
    Reset-DeploymentState
    exit 0
}

if ($showStatus) {
    Show-DeploymentStatus
    exit 0
}

if ($specificStep) {
    $success = Invoke-DeploymentStep $specificStep
    exit $(if ($success) { 0 } else { 1 })
}

# Run all steps
if ($runAll -or $autoResume) {
    Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan
    Write-Host ""
    
    if ($runAll) {
        Reset-DeploymentState
        Write-Host "🔄 Starting fresh deployment" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "🔄 Resuming deployment" -ForegroundColor Yellow
        Show-DeploymentStatus
    }
    
    $stepOrder = @(
        "step1_cleanup",
        "step2_build",
        "step3_upload_frontend",
        "step4_upload_backend",
        "step5_upload_htaccess",
        "step6_upload_database",
        "step7_deploy_server",
        "step8_verify"
    )
    
    $failedSteps = @()
    
    foreach ($stepName in $stepOrder) {
        $stepStatus = Get-StepStatus $stepName
        if ($stepStatus.completed -and -not $runAll) {
            Write-Host "⏭️  Skipping completed step: $($stepDefinitions[$stepName].Name)" -ForegroundColor Gray
            continue
        }
        
        $success = Invoke-DeploymentStep $stepName
        
        if (-not $success) {
            $failedSteps += $stepName
            Write-Host ""
            Write-Host "⚠️  Deployment paused due to failure" -ForegroundColor Yellow
            $response = Read-Host "Continue with next step? (y/n)"
            if ($response -ne "y" -and $response -ne "Y") {
                break
            }
        }
    }
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    
    Show-DeploymentStatus
    
    if ($failedSteps.Count -eq 0) {
        Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║     ALL STEPS COMPLETED SUCCESSFULLY!                    ║" -ForegroundColor Green
        Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Your application: https://medarion.africa" -ForegroundColor Cyan
    } else {
        Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
        Write-Host "║     DEPLOYMENT COMPLETED WITH ERRORS                       ║" -ForegroundColor Yellow
        Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "⚠️  Failed steps:" -ForegroundColor Yellow
        foreach ($step in $failedSteps) {
            Write-Host "   - $($stepDefinitions[$step].Name)" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "💡 Re-run failed steps:" -ForegroundColor Cyan
        Write-Host "   .\deploy_controller.ps1 -Step $($failedSteps[0])" -ForegroundColor White
    }
    
    Write-Host ""
    exit 0
}

# Interactive mode
while ($true) {
    $choice = Show-MainMenu
    
    switch ($choice) {
        "1" {
            Reset-DeploymentState
            $runAll = $true
            break
        }
        "2" {
            $autoResume = $true
            break
        }
        "3" {
            Write-Host ""
            Write-Host "Available Steps:" -ForegroundColor Cyan
            $index = 1
            foreach ($stepName in $stepDefinitions.Keys) {
                $stepDef = $stepDefinitions[$stepName]
                $stepStatus = Get-StepStatus $stepName
                $statusIcon = if ($stepStatus.completed) { "✅" } else { "⏳" }
                Write-Host "   $index. $statusIcon $($stepDef.Name)" -ForegroundColor White
                $index++
            }
            Write-Host ""
            $stepChoice = Read-Host "Select step (1-8) or step name"
            
            if ($stepChoice -match '^\d+$') {
                $stepNames = @($stepDefinitions.Keys)
                if ([int]$stepChoice -ge 1 -and [int]$stepChoice -le $stepNames.Count) {
                    $selectedStep = $stepNames[[int]$stepChoice - 1]
                    Invoke-DeploymentStep $selectedStep -Force
                }
            } else {
                Invoke-DeploymentStep $stepChoice -Force
            }
        }
        "4" {
            Show-DeploymentStatus
        }
        "5" {
            Reset-DeploymentState
        }
        "6" {
            Write-Host "Exiting..." -ForegroundColor Yellow
            exit 0
        }
        default {
            Write-Host "Invalid option" -ForegroundColor Red
        }
    }
    
    if ($runAll -or $autoResume) {
        break
    }
}

# If we broke out of menu to run all/resume, execute it
if ($runAll -or $autoResume) {
    $script:args = @()
    if ($runAll) { $script:args += "-All" }
    if ($autoResume) { $script:args += "-Resume" }
    & $PSCommandPath @script:args
}


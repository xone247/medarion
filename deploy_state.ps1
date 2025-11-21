# Deployment State Management
# Functions to track deployment progress

$ErrorActionPreference = "Continue"

$StateFile = ".deployment\deployment_state.json"

# Initialize state file
function Initialize-DeploymentState {
    if (-not (Test-Path ".deployment")) {
        New-Item -ItemType Directory -Path ".deployment" -Force | Out-Null
    }
    
    if (-not (Test-Path $StateFile)) {
        $initialState = @{
            version = "1.0"
            started = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            lastUpdated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            steps = @{
                step1_cleanup = @{ status = "pending"; completed = $false; timestamp = $null; error = $null }
                step2_build = @{ status = "pending"; completed = $false; timestamp = $null; error = $null }
                step3_upload_frontend = @{ status = "pending"; completed = $false; timestamp = $null; error = $null }
                step4_upload_backend = @{ status = "pending"; completed = $false; timestamp = $null; error = $null }
                step5_upload_htaccess = @{ status = "pending"; completed = $false; timestamp = $null; error = $null }
                step6_upload_database = @{ status = "pending"; completed = $false; timestamp = $null; error = $null }
                step7_deploy_server = @{ status = "pending"; completed = $false; timestamp = $null; error = $null }
                step8_verify = @{ status = "pending"; completed = $false; timestamp = $null; error = $null }
            }
        }
        $initialState | ConvertTo-Json -Depth 10 | Set-Content $StateFile
    }
}

# Get deployment state
function Get-DeploymentState {
    Initialize-DeploymentState
    if (Test-Path $StateFile) {
        $content = Get-Content $StateFile -Raw | ConvertFrom-Json
        return $content
    }
    return $null
}

# Update step status
function Update-StepStatus {
    param(
        [string]$StepName,
        [string]$Status,  # "pending", "in_progress", "completed", "failed", "skipped"
        [string]$Error = $null
    )
    
    $state = Get-DeploymentState
    if ($state -and $state.steps.$StepName) {
        $state.steps.$StepName.status = $Status
        $state.steps.$StepName.completed = ($Status -eq "completed")
        $state.steps.$StepName.timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        if ($Error) {
            $state.steps.$StepName.error = $Error
        }
        $state.lastUpdated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $state | ConvertTo-Json -Depth 10 | Set-Content $StateFile
    }
}

# Get step status
function Get-StepStatus {
    param([string]$StepName)
    
    $state = Get-DeploymentState
    if ($state -and $state.steps.$StepName) {
        return $state.steps.$StepName
    }
    return $null
}

# Check if step is completed
function Test-StepCompleted {
    param([string]$StepName)
    
    $step = Get-StepStatus $StepName
    return ($step -and $step.completed -eq $true)
}

# Get next pending step
function Get-NextPendingStep {
    $state = Get-DeploymentState
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
    
    foreach ($step in $stepOrder) {
        $stepStatus = $state.steps.$step
        if ($stepStatus.status -eq "pending" -or $stepStatus.status -eq "failed") {
            return $step
        }
    }
    return $null
}

# Get deployment summary
function Get-DeploymentSummary {
    $state = Get-DeploymentState
    if (-not $state) {
        return $null
    }
    
    $summary = @{
        total = 8
        completed = 0
        failed = 0
        pending = 0
        inProgress = 0
        steps = @()
    }
    
    foreach ($stepName in $state.steps.PSObject.Properties.Name) {
        $step = $state.steps.$stepName
        $summary.steps += @{
            name = $stepName
            status = $step.status
            completed = $step.completed
            timestamp = $step.timestamp
        }
        
        switch ($step.status) {
            "completed" { $summary.completed++ }
            "failed" { $summary.failed++ }
            "in_progress" { $summary.inProgress++ }
            default { $summary.pending++ }
        }
    }
    
    return $summary
}

# Reset deployment state
function Reset-DeploymentState {
    if (Test-Path $StateFile) {
        Remove-Item $StateFile -Force
    }
    Initialize-DeploymentState
    Write-Host "✅ Deployment state reset" -ForegroundColor Green
}

# Export functions for use in other scripts
Export-ModuleMember -Function Initialize-DeploymentState, Get-DeploymentState, Update-StepStatus, Get-StepStatus, Test-StepCompleted, Get-NextPendingStep, Get-DeploymentSummary, Reset-DeploymentState


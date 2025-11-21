# Deploy Node.js Application to cPanel
# This script uploads the prepared Node.js app to cPanel

param(
    [string]$ConfigFile = "cpanel-config.json",
    [string]$NodeAppDir = "cpanel-nodejs-app"
)

Write-Host "🚀 Deploying Node.js App to cPanel" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js app directory exists
if (-not (Test-Path $NodeAppDir)) {
    Write-Host "❌ Node.js app directory not found: $NodeAppDir" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Run this first to prepare the app:" -ForegroundColor Yellow
    Write-Host "   .\setup_cpanel_nodejs.ps1" -ForegroundColor White
    exit 1
}

# Check if config exists
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ Configuration file not found: $ConfigFile" -ForegroundColor Red
    Write-Host "   Please create it from cpanel-config.json.example" -ForegroundColor Yellow
    exit 1
}

# Load configuration
try {
    $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
} catch {
    Write-Host "❌ Error reading configuration: $_" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Configuration loaded" -ForegroundColor Green
Write-Host ""

# Ask for Node.js app path on cPanel
Write-Host "📍 Enter your Node.js Application Root path on cPanel" -ForegroundColor Cyan
Write-Host "   (This is shown when you create the app in Node.js Selector)" -ForegroundColor Gray
Write-Host "   Example: /home/username/nodevenv/medarion/18/bin" -ForegroundColor Gray
Write-Host ""
$nodeAppPath = Read-Host "Node.js App Path"

if ([string]::IsNullOrWhiteSpace($nodeAppPath)) {
    Write-Host "❌ Node.js app path is required" -ForegroundColor Red
    exit 1
}

# Normalize path
$nodeAppPath = $nodeAppPath.Trim().TrimEnd('/')

Write-Host ""
Write-Host "📤 Preparing to upload Node.js app..." -ForegroundColor Cyan
Write-Host "   Source: $NodeAppDir" -ForegroundColor Gray
Write-Host "   Destination: $nodeAppPath" -ForegroundColor Gray
Write-Host ""

# Get files to upload
$filesToUpload = Get-ChildItem -Path $NodeAppDir -Recurse -File | Where-Object {
    $relativePath = $_.FullName.Replace((Resolve-Path $NodeAppDir).Path + "\", "").Replace("\", "/")
    # Exclude node_modules if it exists
    -not $relativePath.StartsWith("node_modules/")
}

Write-Host "📊 Found $($filesToUpload.Count) files to upload" -ForegroundColor Cyan
Write-Host ""

# Check for WinSCP (for SFTP) or use FTP
$useWinSCP = $false
if ($config.ftp.useSftp) {
    $winscpPath = Get-Command WinSCP.com -ErrorAction SilentlyContinue
    if ($winscpPath) {
        $useWinSCP = $true
        Write-Host "✅ Using WinSCP for SFTP upload" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WinSCP not found. Install for SFTP support." -ForegroundColor Yellow
        Write-Host "   Falling back to basic FTP" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📤 Uploading files..." -ForegroundColor Cyan

if ($useWinSCP) {
    # Use WinSCP for SFTP
    $scriptContent = @"
option batch abort
option confirm off
open sftp://$($config.ftp.username):$($config.ftp.password)@$($config.ftp.host) -hostkey=*
cd $nodeAppPath
lcd "$(Resolve-Path $NodeAppDir)"
"@
    
    $filesToUpload | ForEach-Object {
        $relativePath = $_.FullName.Replace((Resolve-Path $NodeAppDir).Path + "\", "").Replace("\", "/")
        $remoteDir = Split-Path $relativePath -Parent
        
        if ($remoteDir -and $remoteDir -ne ".") {
            $scriptContent += "`nmkdir -p $remoteDir"
        }
        
        $scriptContent += "`nput `"$($_.FullName)`" `"$relativePath`""
    }
    
    $scriptContent += "`nclose`nexit"
    
    $scriptFile = "winscp_nodejs_upload.txt"
    $scriptContent | Out-File $scriptFile -Encoding ASCII
    
    Write-Host "   Running WinSCP script..." -ForegroundColor Gray
    & WinSCP.com /script=$scriptFile /log=winscp_nodejs_log.txt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Upload completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Upload failed. Check winscp_nodejs_log.txt for details." -ForegroundColor Red
        exit 1
    }
    
    Remove-Item $scriptFile -ErrorAction SilentlyContinue
} else {
    # Use PowerShell FTP
    Write-Host "⚠️  Using basic FTP (SFTP recommended)" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        $uploaded = 0
        $failed = 0
        
        $filesToUpload | ForEach-Object {
            $relativePath = $_.FullName.Replace((Resolve-Path $NodeAppDir).Path + "\", "").Replace("\", "/")
            $remotePath = "$nodeAppPath/$relativePath"
            $remoteDir = Split-Path $remotePath -Parent
            
            try {
                # Create directory if needed (simplified - FTP directory creation is limited)
                $fileInfo = New-Object System.IO.FileInfo($_.FullName)
                $uri = "ftp://$($config.ftp.host)$remotePath"
                
                $ftpRequest = [System.Net.FtpWebRequest]::Create($uri)
                $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($config.ftp.username, $config.ftp.password)
                $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
                $ftpRequest.UseBinary = $true
                $ftpRequest.ContentLength = $fileInfo.Length
                
                $fileContent = [System.IO.File]::ReadAllBytes($_.FullName)
                $requestStream = $ftpRequest.GetRequestStream()
                $requestStream.Write($fileContent, 0, $fileContent.Length)
                $requestStream.Close()
                
                $response = $ftpRequest.GetResponse()
                $response.Close()
                
                $uploaded++
                Write-Host "   ✓ $relativePath" -ForegroundColor Gray
            } catch {
                $failed++
                Write-Host "   ✗ $relativePath - Error: $_" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        if ($failed -eq 0) {
            Write-Host "✅ Uploaded $uploaded files successfully!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Uploaded $uploaded files, $failed failed" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ FTP upload failed: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Node.js app deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. SSH into your server and navigate to: $nodeAppPath" -ForegroundColor White
Write-Host "   2. Run: npm install" -ForegroundColor White
Write-Host "   3. Update .env file with your production credentials" -ForegroundColor White
Write-Host "   4. Set environment variables in cPanel Node.js Selector" -ForegroundColor White
Write-Host "   5. Start the application in cPanel Node.js Selector" -ForegroundColor White
Write-Host "   6. Test: https://yourdomain.com/medarion-api/health" -ForegroundColor White
Write-Host ""
Write-Host "📖 See CPANEL_NODEJS_SETUP_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""


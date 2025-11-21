# Test Chat endpoint on cPanel
$config = Get-Content "cpanel-config.json" | ConvertFrom-Json
$plinkPath = $config.ssh.plinkPath
$sshPassword = $config.ssh.password
$cpanelKey = $config.ssh.keyPath
$cpanelHost = $config.ssh.host
$cpanelUser = $config.ssh.username
$cpanelPort = $config.ssh.port

Write-Host "`n🧪 Testing Chat Endpoint on cPanel..." -ForegroundColor Cyan

# Create a test script on cPanel
$testScript = @'
#!/bin/bash
curl -s -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"max_tokens":20}' | jq . 2>/dev/null || curl -s -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: medarion-secure-key-2025" \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"max_tokens":20}'
'@

# Upload and run test
$testScript | echo $sshPassword | & $plinkPath -P $cpanelPort -pw $sshPassword -i $cpanelKey "${cpanelUser}@${cpanelHost}" "cat > /tmp/test_chat.sh && chmod +x /tmp/test_chat.sh && /tmp/test_chat.sh" 2>&1


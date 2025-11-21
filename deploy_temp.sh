#!/bin/bash
echo '=== Deploying run_api_on_vast.py ==='
echo ''
echo '🛑 Step 1: Stopping existing API...'
pkill -f 'run_api_on_vast.py' 2>/dev/null
sleep 2
echo '✅ Stopped'
echo ''
echo '📁 Step 2: Checking/removing old file...'
if [ -f /workspace/run_api_on_vast.py ]; then
    rm -f /workspace/run_api_on_vast.py
    echo '✅ Old file removed'
else
    echo 'ℹ️  No old file found'
fi
echo ''
echo '📤 Step 3: Ready for file upload...'
echo '   Please upload the file using SCP from another terminal'
echo '   Command: scp -P 37792 run_api_on_vast.py root@194.228.55.129:/workspace/'
echo ''
echo '⏳ Waiting for file...'
while [ ! -f /workspace/run_api_on_vast.py ]; do
    sleep 2
    echo -n '.'
done
echo ''
echo '✅ File detected!'
echo ''
echo '🚀 Step 4: Starting new API...'
cd /workspace
nohup python3 run_api_on_vast.py > api.log 2>&1 &
sleep 3
echo '✅ API started'
echo ''
echo '🔍 Step 5: Verifying...'
ps aux | grep 'run_api_on_vast.py' | grep -v grep
echo ''
echo '�� Log (last 10 lines):'
tail -10 api.log 2>/dev/null || echo 'Log not ready yet'
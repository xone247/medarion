# 🛑 How to Stop Processes in Jupyter Terminal

## Quick Methods

### Method 1: Interrupt Kernel (Easiest)
- **Click** the **Interrupt** button (⏹️) in the Jupyter toolbar
- **Or** press: `Ctrl + M`, then `I` (in command mode)
- **Or** use menu: **Kernel → Interrupt**

### Method 2: Restart Kernel
- **Click** the **Restart** button (🔄) in the toolbar
- **Or** press: `Ctrl + M`, then `0, 0` (restart with confirmation)
- **Or** use menu: **Kernel → Restart**

### Method 3: Kill Process from Terminal
If running in Jupyter terminal, open a **NEW terminal** and:

```bash
# Find the process
ps aux | grep python
# Or
ps aux | grep "run_api_on_vast"

# Kill by PID
kill <PID>

# Or force kill if needed
kill -9 <PID>
```

### Method 4: Close and Restart
- Close the Jupyter terminal tab
- Open a new terminal
- The process should stop when terminal closes

### Method 5: For Flask/Python API
If running Flask API in Jupyter:

```bash
# Find and kill the process
pkill -f 'run_api_on_vast.py'

# Or kill all Python processes (be careful!)
killall python3

# Or find specific process
ps aux | grep 'run_api_on_vast.py'
kill <PID>
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Interrupt | `Ctrl + M, I` |
| Restart | `Ctrl + M, 0, 0` |
| Restart & Clear Output | `Ctrl + M, 0, 0` (then confirm) |

## For Stuck Processes

If nothing works:

1. **Close the browser tab** with Jupyter
2. **Restart Jupyter server** from command line
3. **Kill the Jupyter process** itself:
   ```bash
   pkill -f jupyter
   ```

## Tips

- **Interrupt** is usually enough for most processes
- **Restart** will stop everything and clear memory
- **Kill** is for processes that won't respond to interrupts
- Always save your work before restarting!


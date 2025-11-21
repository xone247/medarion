# 🎯 Best Vast.ai Template/Instance for Port Control

## Recommended Template Types

### ✅ Best Option: **Base/Custom Template**

**Why:**
- ✅ Minimal pre-configured services
- ✅ No port conflicts from existing services
- ✅ Full control over port configuration
- ✅ Clean slate for your API

**Look for:**
- "Base Ubuntu" or "Base Debian"
- "Custom" or "Blank" templates
- Templates with minimal services

### ✅ Good Option: **PyTorch/CUDA Template (Minimal)**

**Why:**
- ✅ Has PyTorch pre-installed (good for AI)
- ✅ Usually minimal services
- ✅ Can configure ports freely

**Avoid:**
- ❌ Templates with Jupyter (uses port 8080/38941)
- ❌ Templates with TensorBoard (uses port 6006/38570)
- ❌ Templates with multiple pre-configured services

---

## Instance Configuration Recommendations

### 1. **Port Range Selection**

When creating instance, look for:
- **Custom port mapping** option
- **Port range** configuration
- Ability to **specify exact ports**

### 2. **Template Settings to Check**

**Good Settings:**
- ✅ "Minimal services"
- ✅ "Base image"
- ✅ "Custom configuration"
- ✅ "No pre-installed services"

**Avoid:**
- ❌ "Jupyter included"
- ❌ "TensorBoard enabled"
- ❌ "Multiple services"
- ❌ "Development environment"

### 3. **Recommended Template**

**Best Choice:**
```
Template: Base Ubuntu 22.04 / Debian 12
Services: Minimal (SSH only)
Ports: Custom/Manual configuration
```

**Or:**
```
Template: PyTorch (minimal)
Services: PyTorch only, no Jupyter/TensorBoard
Ports: Custom configuration
```

---

## What to Do When Creating Instance

### Step 1: Choose Template
- Select "Base" or "Minimal" template
- Avoid templates with Jupyter, TensorBoard, etc.

### Step 2: Configure Ports
- Look for "Port Mapping" or "Port Configuration"
- Specify your desired port (e.g., 38800)
- Or leave it to auto-assign in range 38506-38941

### Step 3: Instance Settings
- **Image:** Base Ubuntu/Debian or minimal PyTorch
- **Services:** SSH only (or minimal)
- **Ports:** Custom/manual if available

---

## Alternative: Use Existing Instance Better

If you want to keep current instance:

### Option 1: Stop Conflicting Services
```bash
# Stop Jupyter (if running)
pkill -f jupyter

# Stop TensorBoard (if running)
pkill -f tensorboard

# Stop any other services
ps aux | grep -E 'jupyter|tensorboard|6006|8080' | grep -v grep
```

### Option 2: Use Unused Ports
From your list, these might be free:
- **38800** (we're using this now)
- **38750** (between 38710 and 38772)
- **38600-38659** (before 38660)
- **38801-38940** (between 38800 and 38941)

---

## Best Practice: Custom Port Configuration

### When Creating New Instance:

1. **Choose "Custom" or "Base" template**
2. **Specify port in instance creation:**
   - Look for "Port" or "Service Port" field
   - Enter: `38800` (or your preferred port)
3. **Or use port range:**
   - Select range: 38506-38941
   - Pick a port not in use: 38800, 38750, etc.

---

## Recommended Instance Setup

### Template:
- **Base Ubuntu 22.04** or **Minimal PyTorch**

### Services:
- ✅ SSH (required)
- ❌ No Jupyter
- ❌ No TensorBoard
- ❌ No other pre-configured services

### Ports:
- **Custom port:** 38800 (or any in range 38506-38941)
- **Or:** Let Vast.ai auto-assign in range

### Why This Works:
- ✅ No port conflicts
- ✅ Full control
- ✅ Clean environment
- ✅ Easy to configure

---

## Quick Checklist for New Instance

- [ ] Template: Base/Minimal (not Jupyter/TensorBoard)
- [ ] Services: SSH only
- [ ] Port: Custom 38800 (or auto-assign)
- [ ] GPU: RTX A5000 or similar
- [ ] Storage: Enough for model

---

## Current Instance: Keep Using Port 38800

Your current setup with port 38800 should work! Just:
1. ✅ API is running on 38800
2. ✅ cPanel is configured
3. ⏳ Wait for Vast.ai to map the port (may take 1-2 minutes)
4. ✅ Test: `curl http://194.228.55.129:38800/health`

If port 38800 doesn't work externally, try:
- **38750** (between used ports)
- **38850** (higher in range)
- **38600** (before 38660)


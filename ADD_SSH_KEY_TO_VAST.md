# 🔑 Add SSH Key to Vast.ai

## Your Public Key

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOt8xzV4cr+SA9aJSJl9NYGK9XTVXcetbZNN0SSkZpTO manjofetty@gmail.com
```

**This key is also saved in:** `vast_ai_public_key.txt`

---

## Step 1: Add to Vast.ai Account

1. Go to: **https://console.vast.ai/account/keys**
2. Click **"Add SSH Key"** button
3. Paste the public key above (or from `vast_ai_public_key.txt`)
4. Give it a name (e.g., "Windows PC - Medarion")
5. Click **"Save"**

⚠️ **Important:** New keys only apply to **NEW instances** created after adding the key.

---

## Step 2: Add to Existing Instance

If you have an existing instance (like instance 27831217), you need to add the key to that specific instance:

1. Go to your instance in Vast.ai console
2. Click the **SSH icon** (🔑) next to your instance
3. Look for **"Instance-specific SSH interface"** or **"Add SSH Key"**
4. Paste the same public key
5. Save

---

## Step 3: Test Connection

After adding the key, test the connection:

```bash
ssh -i "C:\Users\xone\.ssh\id_ed25519_vast" -p 31216 root@ssh1.vast.ai
```

Or for your new instance:
```bash
ssh -i "C:\Users\xone\.ssh\id_ed25519_vast" -p 31216 root@ssh1.vast.ai
```

---

## Step 4: Use for File Transfer

### SCP (Upload file):
```bash
scp -i "C:\Users\xone\.ssh\id_ed25519_vast" -P 31216 run_api_on_vast.py root@ssh1.vast.ai:/workspace/
```

### SCP (Download file):
```bash
scp -i "C:\Users\xone\.ssh\id_ed25519_vast" -P 31216 root@ssh1.vast.ai:/workspace/api.log ./
```

---

## Troubleshooting

### Permission Denied (publickey)

1. ✅ Verify key is added to Vast.ai account/instance
2. ✅ Check you're using the correct private key path
3. ✅ Verify key permissions (Windows usually handles this automatically)
4. ✅ Use `-vv` flag for debug: `ssh -vv -i "C:\Users\xone\.ssh\id_ed25519_vast" -p 31216 root@ssh1.vast.ai`

### Key Not Working

- New account keys only apply to **NEW instances**
- For existing instances, use **instance-specific SSH interface**
- Make sure you're using the correct port (31216 for your instance)

---

## Reference

- Official Vast.ai SSH Guide: https://docs.vast.ai/documentation/instances/connect/ssh
- Key Location: `C:\Users\xone\.ssh\id_ed25519_vast` (private)
- Public Key File: `vast_ai_public_key.txt`


# Upload Database to cPanel - Quick Guide

## ✅ Files Ready

1. **database_export_for_cpanel.sql** - Database export file (~3.3 MB)
2. **import_database.php** - Server-side import script

## 📤 Upload Steps

### Step 1: Upload Files to cPanel

1. **Access cPanel File Manager**:
   - Go to: https://medarion.africa:2083
   - Login: medasnnc / Neorage94
   - Navigate to: **Files → File Manager**
   - Go to: **public_html** directory

2. **Upload Files**:
   - Click **"Upload"** button
   - Upload: `database_export_for_cpanel.sql`
   - Upload: `import_database.php`
   - Wait for uploads to complete

### Step 2: Run Import Script

**Option A: Via Browser (Easiest)**
- Visit: https://medarion.africa/import_database.php
- The script will automatically:
  - Clear old data (preserving users)
  - Import all 3,125 records
  - Verify the import
- Wait for completion (1-2 minutes)

**Option B: Via SSH (If you have access)**
```bash
cd ~/public_html
php import_database.php
```

### Step 3: Verify Import

After import completes, verify:
- Check the output shows ~3,125 total records
- Test your application at https://medarion.africa
- Verify data displays correctly

### Step 4: Clean Up (Security)

**IMPORTANT**: Delete the import script after use:
- Go to File Manager
- Delete: `import_database.php`
- (Keep `database_export_for_cpanel.sql` as backup if desired)

## 🔍 Expected Results

After import, you should see:
- ✅ africa_countries: 54 records
- ✅ companies: 286 records
- ✅ deals: 367 records
- ✅ grants: 95 records
- ✅ clinical_trials: 195 records
- ✅ regulatory_bodies: 54 records
- ✅ public_stocks: 45 records
- ✅ clinical_centers: 95 records
- ✅ investigators: 97 records
- ✅ nation_pulse_data: 756 records
- ✅ glossary_terms: 1,059 records
- **Total: ~3,125 records**

## ⚠️ Troubleshooting

### Import Script Not Found
- Make sure both files are in `public_html` directory
- Check file permissions (should be 644)

### Import Fails
- Check database credentials in `import_database.php`
- Verify database user has proper permissions
- Check PHP error logs in cPanel

### Timeout Issues
- Increase PHP `max_execution_time` in cPanel
- Or use SSH method (Option B)

## ✅ Success Checklist

- [ ] Files uploaded to cPanel
- [ ] Import script executed
- [ ] ~3,125 records imported
- [ ] Application tested
- [ ] Import script deleted (security)

---

**Ready to upload!** Follow the steps above to complete the database reset on cPanel.


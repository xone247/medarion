# cPanel Database Upload Instructions

## ✅ Database Export Complete

Your local database has been exported to:
- **File**: `database_export_for_cpanel.sql`
- **Size**: ~3.3 MB
- **Records**: 3,125 real, verifiable records

## 📤 Upload to cPanel

Since direct database connection from local machine may be restricted, use one of these methods:

### Method 1: cPanel phpMyAdmin (Recommended)

1. **Access cPanel**:
   - URL: https://medarion.africa:2083
   - Username: medasnnc
   - Password: Neorage94

2. **Open phpMyAdmin**:
   - Go to: Databases → phpMyAdmin
   - Or directly: https://medarion.africa/phpmyadmin

3. **Select Database**:
   - Click on `medasnnc_medarion` in the left sidebar

4. **Clear Existing Data** (Optional but Recommended):
   - Click "Operations" tab
   - Scroll to "Empty database" section
   - Click "Empty the database (DROP)" 
   - ⚠️ **WARNING**: This will delete ALL data except users (if you want to preserve users, skip this step)

5. **Import SQL File**:
   - Click "Import" tab
   - Click "Choose File" button
   - Select: `database_export_for_cpanel.sql`
   - Scroll down and click "Go" button
   - Wait for import to complete (may take 1-2 minutes)

6. **Verify Import**:
   - Check table counts match:
     - africa_countries: 54
     - companies: 286
     - deals: 367
     - grants: 95
     - clinical_trials: 195
     - regulatory_bodies: 54
     - public_stocks: 45
     - clinical_centers: 95
     - investigators: 97
     - nation_pulse_data: 756
     - glossary_terms: 1,059

### Method 2: cPanel MySQL Databases (Alternative)

1. **Access cPanel**: https://medarion.africa:2083

2. **Go to MySQL Databases**:
   - Navigate to: Databases → MySQL Databases

3. **Use phpMyAdmin**:
   - Click "phpMyAdmin" link next to your database
   - Follow steps 4-6 from Method 1

### Method 3: SSH/Command Line (If you have SSH access)

```bash
# Upload SQL file to server first (via FTP/SFTP)
# Then SSH into server and run:

mysql -u medasnnc_medarion -p medasnnc_medarion < database_export_for_cpanel.sql
# Enter password when prompted: Neorage94
```

## 🔍 Verification

After import, verify the data:

1. **In phpMyAdmin**, run this query:
   ```sql
   SELECT 
       'africa_countries' as table_name, COUNT(*) as count FROM africa_countries
   UNION ALL
   SELECT 'companies', COUNT(*) FROM companies
   UNION ALL
   SELECT 'deals', COUNT(*) FROM deals
   UNION ALL
   SELECT 'grants', COUNT(*) FROM grants
   UNION ALL
   SELECT 'clinical_trials', COUNT(*) FROM clinical_trials
   UNION ALL
   SELECT 'regulatory_bodies', COUNT(*) FROM regulatory_bodies
   UNION ALL
   SELECT 'public_stocks', COUNT(*) FROM public_stocks
   UNION ALL
   SELECT 'clinical_centers', COUNT(*) FROM clinical_centers
   UNION ALL
   SELECT 'investigators', COUNT(*) FROM investigators
   UNION ALL
   SELECT 'nation_pulse_data', COUNT(*) FROM nation_pulse_data
   UNION ALL
   SELECT 'glossary_terms', COUNT(*) FROM glossary_terms;
   ```

2. **Expected Results**:
   - Total should be approximately 3,125 records
   - All tables should have data (except blog_posts and sponsored_ads which are intentionally empty)

## ⚠️ Important Notes

1. **Backup First**: If you have existing data you want to keep, export it first
2. **Users Table**: The export includes users - if you want to preserve existing users, you may need to:
   - Export users table separately before import
   - Or manually exclude users table from import
3. **File Size**: The SQL file is ~3.3 MB - make sure phpMyAdmin allows imports of this size
   - If import fails due to size, increase `upload_max_filesize` and `post_max_size` in php.ini
   - Or split the SQL file into smaller chunks

## 🚀 After Import

Once the database is imported:

1. **Test Your Application**:
   - Visit your website
   - Check that data displays correctly
   - Test API endpoints

2. **Verify Logo URLs**:
   - Check that company/investor logos are accessible
   - Logo files should be in `/public/uploads/company/` and `/public/uploads/investor/`

3. **Check Foreign Keys**:
   - Verify relationships between tables work correctly
   - Test queries that join tables

## 📝 Troubleshooting

### Import Fails Due to File Size
- Increase PHP upload limits in cPanel
- Or use SSH method (Method 3)

### Import Shows Errors
- Some errors may be expected (duplicate entries, etc.)
- Check the final record counts to verify data was imported

### Connection Issues
- Verify database credentials in `CPANEL_ACCESS.md`
- Check that database user has proper permissions

## ✅ Success Checklist

- [ ] SQL file uploaded to cPanel
- [ ] Database cleared (if desired)
- [ ] SQL file imported successfully
- [ ] Record counts verified
- [ ] Application tested and working
- [ ] Logos accessible

---

**Status**: Database export ready for upload to cPanel!


# Funding and Logos Issue Report

## Summary

**Date:** 2025-01-27  
**Status:** ⚠️ Issues Identified

---

## Issue 1: Funding Data is NOT Real

### Problem
- Most funding amounts are **placeholder/generated** values ($100M, $50M)
- Deals have placeholder company names ("Healthcare Company 1", "EliteTech", "WellTech", etc.)
- These are NOT real funding data from the Excel file

### Evidence
From database check:
- Sample deals show amounts like $100,000,000.00 (clearly placeholder)
- Company names like "EliteTech", "WellTech", "BioLabs" are generated placeholders
- Real Excel data has actual company names and varied amounts

### Root Cause
The seed script (`seed_real_data_comprehensive.sql`) contains:
- Placeholder company names in deals table
- Generated funding amounts (not from Excel)
- Only a small portion of data is from the real Excel file

### Solution Needed
1. Parse the Excel file (`Copy of 07202025 Funding_Validated.xlsx`) for REAL funding data
2. Replace all placeholder deals with real deals from Excel
3. Ensure all funding amounts are from actual Excel data
4. Link deals to real company names (not placeholders)

---

## Issue 2: Company Logos Not Displaying

### Problem
- Logo URLs in database are not matching logo files
- Many companies have placeholder names that don't match logo filenames
- Logo files exist for real companies (mPharma, 54gene, LifeBank, etc.)
- But database has many placeholder company names (EliteTech, WellTech, etc.)

### Evidence
- Logo files exist: 45+ files in `public/uploads/company/`
- Logo files are for real companies: mPharma, 54gene, LifeBank, etc.
- Database has placeholder companies: EliteTech, WellTech, BioLabs, etc.
- Logo fix script found 0 matches because names don't match

### Root Cause
- Database has many placeholder company names
- Logo files are for real companies
- Name mismatch prevents logo assignment

### Solution Needed
1. Replace placeholder company names with real company names
2. Match logo files to real company names
3. Update logo_url in database with correct paths
4. Ensure logo URLs use full API path: `https://api.medarion.africa/uploads/company/{filename}.png`

---

## Next Steps

### Priority 1: Replace Placeholder Data with Real Data
1. Parse Excel file for ALL real funding deals
2. Replace placeholder companies with real companies from Excel
3. Use real funding amounts from Excel
4. Ensure all 286 companies are REAL companies (not placeholders)

### Priority 2: Fix Logo Display
1. Map logo files to real company names
2. Update database logo_url for all real companies
3. Upload logos to cPanel if not already there
4. Verify logo URLs are accessible

---

## Current Status

- ❌ **Funding Data**: Mostly placeholder (NOT real)
- ❌ **Company Names**: Many are placeholders (NOT real)
- ❌ **Logos**: Not displaying due to name mismatch
- ✅ **Logo Files**: Exist for real companies
- ✅ **Excel Data**: Contains real funding data (needs to be used)

---

## Action Required

**The user wants ALL data to be REAL, not generated placeholders.**

We need to:
1. Extract ALL real funding data from Excel
2. Replace ALL placeholder companies with real companies
3. Use ONLY real funding amounts from Excel
4. Match logos to real company names
5. Update database with real data only


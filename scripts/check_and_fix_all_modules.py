"""
Check all modules and fix issues:
1. Remove blog posts (user will add manually)
2. Check for missing modules (company_regulatory)
3. Verify ads are empty
4. Check image downloads
"""
import re

# Read seed script
with open('scripts/seed_real_data_comprehensive.sql', 'r', encoding='utf-8') as f:
    sql_content = f.read()

print("=" * 60)
print("CHECKING ALL MODULES")
print("=" * 60)

# Check what we have
modules = {
    'companies': len(re.findall(r'INSERT INTO companies', sql_content, re.IGNORECASE)),
    'deals': len(re.findall(r'INSERT INTO deals', sql_content, re.IGNORECASE)),
    'investors': len(re.findall(r'INSERT INTO investors', sql_content, re.IGNORECASE)),
    'grants': len(re.findall(r'INSERT INTO grants', sql_content, re.IGNORECASE)),
    'clinical_trials': len(re.findall(r'INSERT INTO clinical_trials', sql_content, re.IGNORECASE)),
    'regulatory_bodies': len(re.findall(r'INSERT INTO regulatory_bodies', sql_content, re.IGNORECASE)),
    'company_regulatory': len(re.findall(r'INSERT INTO company_regulatory', sql_content, re.IGNORECASE)),
    'clinical_centers': len(re.findall(r'INSERT INTO clinical_centers', sql_content, re.IGNORECASE)),
    'investigators': len(re.findall(r'INSERT INTO investigators', sql_content, re.IGNORECASE)),
    'public_stocks': len(re.findall(r'INSERT INTO public_stocks', sql_content, re.IGNORECASE)),
    'nation_pulse_data': len(re.findall(r'INSERT INTO nation_pulse_data', sql_content, re.IGNORECASE)),
    'blog_posts': len(re.findall(r'INSERT INTO blog_posts', sql_content, re.IGNORECASE)),
    'sponsored_ads': len(re.findall(r'INSERT INTO sponsored_ads', sql_content, re.IGNORECASE)),
    'crm_investors': len(re.findall(r'INSERT INTO crm_investors', sql_content, re.IGNORECASE)),
    'crm_meetings': len(re.findall(r'INSERT INTO crm_meetings', sql_content, re.IGNORECASE)),
    'glossary_terms': len(re.findall(r'INSERT INTO glossary_terms', sql_content, re.IGNORECASE)),
    'africa_countries': len(re.findall(r'INSERT INTO africa_countries', sql_content, re.IGNORECASE)),
}

print("\nCurrent Data Counts:")
for module, count in sorted(modules.items()):
    status = "✓" if count > 0 or module in ['sponsored_ads', 'crm_investors', 'crm_meetings', 'blog_posts'] else "✗"
    print(f"  {status} {module}: {count}")

print("\n" + "=" * 60)
print("ISSUES FOUND:")
print("=" * 60)

issues = []

# 1. Blog posts should be removed
if modules['blog_posts'] > 0:
    issues.append(f"✗ Blog Posts: {modules['blog_posts']} records - NEED TO REMOVE (user will add manually)")

# 2. Company regulatory approvals missing
if modules['company_regulatory'] == 0:
    issues.append(f"✗ Company Regulatory: 0 records - MISSING (need to add regulatory approvals)")

# 3. Ads should be empty (good)
if modules['sponsored_ads'] > 0:
    issues.append(f"✗ Sponsored Ads: {modules['sponsored_ads']} records - SHOULD BE EMPTY")
else:
    print("✓ Sponsored Ads: Empty (correct)")

# 4. CRM should be empty (user-specific)
if modules['crm_investors'] > 0:
    issues.append(f"✗ CRM Investors: {modules['crm_investors']} records - SHOULD BE EMPTY (user-specific)")
else:
    print("✓ CRM Investors: Empty (correct - user-specific)")

if modules['crm_meetings'] > 0:
    issues.append(f"✗ CRM Meetings: {modules['crm_meetings']} records - SHOULD BE EMPTY (user-specific)")
else:
    print("✓ CRM Meetings: Empty (correct - user-specific)")

for issue in issues:
    print(issue)

print("\n" + "=" * 60)
print("ACTIONS NEEDED:")
print("=" * 60)
print("1. Remove all blog_posts INSERT statements")
print("2. Add company_regulatory data (regulatory approvals)")
print("3. Check image downloads (verify if any were actually downloaded)")

# Check for image references
image_refs = len(re.findall(r'logo_url|image_url|featured_image', sql_content, re.IGNORECASE))
print(f"\nImage URL references found: {image_refs}")
print("Note: Most are NULL - actual images need to be downloaded separately")














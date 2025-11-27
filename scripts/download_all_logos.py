"""
Download ALL logos and images for companies and investors
Extracts company/investor data from seed file and downloads logos
"""
import os
import re
import json
import requests
from urllib.parse import urlparse, urljoin
from PIL import Image
import io

# Create directories
directories = {
    'company': 'public/uploads/company',
    'investor': 'public/uploads/investor',
    'regulatory': 'public/uploads/regulatory',
    'blog': 'public/uploads/blog'
}

for dir_type, dir_path in directories.items():
    os.makedirs(dir_path, exist_ok=True)
    print(f"✓ Created/verified: {dir_path}")

def esc_filename(name):
    """Create safe filename from company/investor name"""
    safe = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
    safe = safe.replace(' ', '_').replace("'", '').lower()
    return safe

def try_logo_urls(base_url):
    """Try common logo URL patterns"""
    if not base_url or base_url == 'NULL':
        return []
    
    # Clean URL
    base_url = base_url.strip().strip("'").strip('"')
    if not base_url.startswith('http'):
        base_url = 'https://' + base_url
    
    parsed = urlparse(base_url)
    base_domain = f"{parsed.scheme}://{parsed.netloc}"
    
    # Common logo paths
    logo_paths = [
        '/logo.png',
        '/logo.svg',
        '/images/logo.png',
        '/images/logo.svg',
        '/img/logo.png',
        '/img/logo.svg',
        '/assets/logo.png',
        '/assets/logo.svg',
        '/static/logo.png',
        '/static/logo.svg',
        '/wp-content/uploads/logo.png',
        '/logo.jpg',
        '/images/logo.jpg',
    ]
    
    urls = []
    for path in logo_paths:
        urls.append(urljoin(base_domain, path))
    
    return urls

def download_image(url, save_path, timeout=10):
    """Download image from URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, timeout=timeout, headers=headers, allow_redirects=True)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'image' in content_type:
                # Try to optimize/resize if it's a PNG or JPG
                try:
                    img = Image.open(io.BytesIO(response.content))
                    
                    # Resize if too large (max 400x400 for logos)
                    if img.width > 400 or img.height > 400:
                        img.thumbnail((400, 400), Image.Resampling.LANCZOS)
                    
                    # Save as PNG for logos (better quality)
                    if save_path.endswith('.png') or save_path.endswith('.jpg'):
                        img.save(save_path, 'PNG', optimize=True)
                    else:
                        img.save(save_path, optimize=True)
                    
                    print(f"  ✓ Downloaded and optimized: {os.path.basename(save_path)}")
                    return True
                except Exception as e:
                    # If image processing fails, save raw
                    with open(save_path, 'wb') as f:
                        f.write(response.content)
                    print(f"  ✓ Downloaded (raw): {os.path.basename(save_path)}")
                    return True
        return False
    except Exception as e:
        return False

def extract_companies_from_seed():
    """Extract all company names and websites from seed file"""
    companies = []
    
    with open('scripts/seed_real_data_comprehensive.sql', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match INSERT INTO companies statements
    pattern = r"INSERT INTO companies.*?VALUES\s*\(([^)]+)\);"
    matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
    
    for match in matches:
        # Parse the values - this is tricky due to SQL formatting
        # Try to extract name and website
        parts = [p.strip().strip("'").strip('"') for p in match.split(',')]
        if len(parts) >= 3:
            name = parts[0].strip("'").strip('"')
            website = parts[2].strip("'").strip('"') if len(parts) > 2 else None
            
            # Skip placeholders
            if 'Healthcare Company' in name or 'Healthcare Corp' in name:
                continue
            
            if name and name != 'NULL':
                companies.append({
                    'name': name,
                    'website': website if website and website != 'NULL' else None
                })
    
    return companies

def extract_investors_from_seed():
    """Extract all investor names and websites from seed file"""
    investors = []
    
    with open('scripts/seed_real_data_comprehensive.sql', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match INSERT INTO investors statements
    pattern = r"INSERT INTO investors.*?VALUES\s*\(([^)]+)\);"
    matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
    
    for match in matches:
        # Parse the values
        parts = [p.strip().strip("'").strip('"') for p in match.split(',')]
        if len(parts) >= 1:
            name = parts[0].strip("'").strip('"')
            website = parts[4].strip("'").strip('"') if len(parts) > 4 else None
            
            # Skip placeholders
            if 'Healthcare Investor' in name:
                continue
            
            if name and name != 'NULL':
                investors.append({
                    'name': name,
                    'website': website if website and website != 'NULL' else None
                })
    
    return investors

print("=" * 60)
print("DOWNLOADING ALL LOGOS AND IMAGES")
print("=" * 60)
print()

# Extract companies and investors
print("1. Extracting companies and investors from seed file...")
companies = extract_companies_from_seed()
investors = extract_investors_from_seed()

# Remove duplicates
companies = list({c['name']: c for c in companies}.values())
investors = list({i['name']: i for i in investors}.values())

print(f"  Found {len(companies)} unique companies")
print(f"  Found {len(investors)} unique investors")
print()

# Download company logos
print("2. Downloading company logos...")
company_logos = {}
downloaded = 0
failed = 0

for company in companies:
    name = company['name']
    website = company.get('website')
    filename = esc_filename(name) + '.png'
    save_path = os.path.join(directories['company'], filename)
    
    # Skip if already downloaded
    if os.path.exists(save_path):
        print(f"  ⊙ Already exists: {name}")
        company_logos[name] = f"https://api.medarion.africa/uploads/company/{filename}"
        continue
    
    # Try to download logo
    logo_urls = try_logo_urls(website) if website else []
    success = False
    
    for logo_url in logo_urls:
        if download_image(logo_url, save_path):
            company_logos[name] = f"https://api.medarion.africa/uploads/company/{filename}"
            downloaded += 1
            success = True
            break
    
    if not success:
        print(f"  ✗ Could not download: {name} (website: {website or 'N/A'})")
        failed += 1
        # Create placeholder entry for manual download
        company_logos[name] = None

print(f"\n  Downloaded: {downloaded}, Failed: {failed}, Total: {len(companies)}")
print()

# Download investor logos
print("3. Downloading investor logos...")
investor_logos = {}
downloaded_inv = 0
failed_inv = 0

for investor in investors:
    name = investor['name']
    website = investor.get('website')
    filename = esc_filename(name) + '.png'
    save_path = os.path.join(directories['investor'], filename)
    
    # Skip if already downloaded
    if os.path.exists(save_path):
        print(f"  ⊙ Already exists: {name}")
        investor_logos[name] = f"https://api.medarion.africa/uploads/investor/{filename}"
        continue
    
    # Try to download logo
    logo_urls = try_logo_urls(website) if website else []
    success = False
    
    for logo_url in logo_urls:
        if download_image(logo_url, save_path):
            investor_logos[name] = f"https://api.medarion.africa/uploads/investor/{filename}"
            downloaded_inv += 1
            success = True
            break
    
    if not success:
        print(f"  ✗ Could not download: {name} (website: {website or 'N/A'})")
        failed_inv += 1
        investor_logos[name] = None

print(f"\n  Downloaded: {downloaded_inv}, Failed: {failed_inv}, Total: {len(investors)}")
print()

# Save logo mapping
logo_mapping = {
    'companies': company_logos,
    'investors': investor_logos,
    'stats': {
        'companies_total': len(companies),
        'companies_downloaded': downloaded,
        'companies_failed': failed,
        'investors_total': len(investors),
        'investors_downloaded': downloaded_inv,
        'investors_failed': failed_inv
    }
}

with open('scripts/logo_mapping_complete.json', 'w', encoding='utf-8') as f:
    json.dump(logo_mapping, f, indent=2)

print("=" * 60)
print("DOWNLOAD SUMMARY")
print("=" * 60)
print(f"Companies: {downloaded}/{len(companies)} downloaded")
print(f"Investors: {downloaded_inv}/{len(investors)} downloaded")
print()
print(f"Logo mapping saved to: scripts/logo_mapping_complete.json")
print()
print("Note: Some logos may need to be downloaded manually from:")
print("  - Company/investor websites")
print("  - Media kits or press pages")
print("  - Crunchbase or other directories")
print()
print("For failed downloads, check the mapping file and update URLs manually.")













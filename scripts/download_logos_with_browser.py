"""
Download remaining logos using browser scraping and alternative sources
Uses browser tool to visit websites and find logos
"""
import os
import json
import requests
from urllib.parse import urlparse, urljoin
from PIL import Image
import io
import re

# Create directories
directories = {
    'company': 'public/uploads/company',
    'investor': 'public/uploads/investor',
}

for dir_type, dir_path in directories.items():
    os.makedirs(dir_path, exist_ok=True)

def esc_filename(name):
    """Create safe filename"""
    safe = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
    safe = safe.replace(' ', '_').replace("'", '').replace('.', '').lower()
    return safe

# Companies that need logos (from failed list)
COMPANIES_NEEDED = [
    ('54gene', 'https://54gene.com'),
    ('Helium Health', 'https://heliumhealth.com'),
    ('Kangpe', 'https://kangpe.com'),
    ('Medic Mobile', 'https://medicmobile.org'),
    ('AAR Health', 'https://aarkenya.com'),
    ('Netcare', 'https://netcare.co.za'),
    ('Life Healthcare', 'https://lifehealthcare.co.za'),
    ('Adcock Ingram', 'https://adcock.com'),
    ('Vula Mobile', 'https://vulamobile.com'),
    ('Kasha', 'https://kasha.co.rw'),
    ('Babyl', 'https://babyl.rw'),
    ('Shezlong', 'https://shezlong.com'),
    ('Case Medical Centre', 'https://casemedicalcentre.com'),
]

# Investors that need logos
INVESTORS_NEEDED = [
    ('Consonance Investment Managers', 'https://consonanceinv.com'),
    ('Helios Investment Partners', 'https://helios.com'),
    ('Development Partners International', 'https://dpifund.com'),
    ('Synergy Capital', 'https://synergycapital.com'),
    ('AfricInvest', 'https://africinvest.com'),
]

# Alternative sources - Crunchbase, LinkedIn, etc.
ALTERNATIVE_SOURCES = {
    '54gene': [
        'https://www.crunchbase.com/organization/54gene',
        'https://www.linkedin.com/company/54gene',
    ],
    'Helium Health': [
        'https://www.crunchbase.com/organization/helium-health',
        'https://www.linkedin.com/company/helium-health',
    ],
    'Kangpe': [
        'https://www.crunchbase.com/organization/kangpe',
        'https://www.linkedin.com/company/kangpe',
    ],
    'Medic Mobile': [
        'https://www.crunchbase.com/organization/medic-mobile',
        'https://www.linkedin.com/company/medic-mobile',
    ],
    'Netcare': [
        'https://www.linkedin.com/company/netcare',
    ],
    'Life Healthcare': [
        'https://www.linkedin.com/company/life-healthcare',
    ],
    'Zipline': [
        'https://www.crunchbase.com/organization/zipline',
        'https://www.linkedin.com/company/flyzipline',
    ],
    'Vezeeta': [
        'https://www.crunchbase.com/organization/vezeeta',
        'https://www.linkedin.com/company/vezeeta',
    ],
    'Helios Investment Partners': [
        'https://www.crunchbase.com/organization/helios-investment-partners',
        'https://www.linkedin.com/company/helios-investment-partners',
    ],
    'AfricInvest': [
        'https://www.crunchbase.com/organization/africinvest',
        'https://www.linkedin.com/company/africinvest',
    ],
}

def download_image_from_url(url, save_path, timeout=15):
    """Download image from URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.google.com/',
        }
        response = requests.get(url, timeout=timeout, headers=headers, allow_redirects=True, stream=True)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'image' in content_type:
                # Download image
                img_data = response.content
                
                # Try to optimize
                try:
                    img = Image.open(io.BytesIO(img_data))
                    # Resize if too large
                    if img.width > 400 or img.height > 400:
                        img.thumbnail((400, 400), Image.Resampling.LANCZOS)
                    # Save as PNG
                    if not save_path.endswith('.png'):
                        save_path = save_path.rsplit('.', 1)[0] + '.png'
                    img.save(save_path, 'PNG', optimize=True)
                    return True
                except:
                    # Save raw if processing fails
                    with open(save_path, 'wb') as f:
                        f.write(img_data)
                    return True
        return False
    except Exception as e:
        return False

def try_common_logo_patterns(base_url):
    """Try common logo URL patterns"""
    if not base_url:
        return []
    
    base_url = base_url.strip()
    if not base_url.startswith('http'):
        base_url = 'https://' + base_url
    
    parsed = urlparse(base_url)
    base_domain = f"{parsed.scheme}://{parsed.netloc}"
    
    # More comprehensive logo paths
    logo_paths = [
        '/logo.png', '/logo.svg', '/logo.jpg', '/logo.jpeg',
        '/Logo.png', '/Logo.svg',
        '/images/logo.png', '/images/logo.svg', '/images/logo.jpg',
        '/img/logo.png', '/img/logo.svg', '/img/logo.jpg',
        '/assets/logo.png', '/assets/logo.svg', '/assets/images/logo.png',
        '/static/logo.png', '/static/logo.svg',
        '/wp-content/uploads/logo.png',
        '/wp-content/themes/*/images/logo.png',
        '/media/logo.png', '/media/logo.svg',
        '/brand/logo.png', '/brand/logo.svg',
        '/company-logo.png', '/company-logo.svg',
    ]
    
    urls = []
    for path in logo_paths:
        if '*' in path:
            # Skip wildcards for now
            continue
        urls.append(urljoin(base_domain, path))
    
    return urls

print("=" * 70)
print("DOWNLOADING REMAINING LOGOS - WITH BROWSER & ALTERNATIVE SOURCES")
print("=" * 70)
print()

# Load existing mapping
try:
    with open('scripts/logo_mapping_complete.json', 'r') as f:
        logo_mapping = json.load(f)
except:
    logo_mapping = {'companies': {}, 'investors': {}}

# Download company logos
print(f"1. Downloading {len(COMPANIES_NEEDED)} company logos...")
print()

downloaded_companies = 0
for idx, (name, website) in enumerate(COMPANIES_NEEDED, 1):
    filename = esc_filename(name) + '.png'
    save_path = os.path.join(directories['company'], filename)
    
    print(f"  [{idx}/{len(COMPANIES_NEEDED)}] {name}")
    print(f"      Website: {website}")
    
    if os.path.exists(save_path):
        print(f"      ✓ Already exists")
        if name not in logo_mapping['companies']:
            logo_mapping['companies'][name] = f"https://api.medarion.africa/uploads/company/{filename}"
        continue
    
    success = False
    
    # Try 1: Common logo patterns on main website
    print(f"      Trying common logo patterns...", end=' ')
    logo_urls = try_common_logo_patterns(website)
    for logo_url in logo_urls[:10]:  # Try first 10
        if download_image_from_url(logo_url, save_path):
            print("✓ Success!")
            logo_mapping['companies'][name] = f"https://api.medarion.africa/uploads/company/{filename}"
            downloaded_companies += 1
            success = True
            break
    
    if not success:
        print("✗ Failed")
        # Try 2: Alternative sources (Crunchbase, LinkedIn)
        if name in ALTERNATIVE_SOURCES:
            print(f"      Trying alternative sources...", end=' ')
            for alt_url in ALTERNATIVE_SOURCES[name]:
                # Note: We'll need browser tool for these
                print(f"      (Browser scraping needed for: {alt_url})")
        else:
            print(f"      ✗ No alternative sources found")
            logo_mapping['companies'][name] = None
    
    print()

# Download investor logos
print(f"2. Downloading {len(INVESTORS_NEEDED)} investor logos...")
print()

downloaded_investors = 0
for idx, (name, website) in enumerate(INVESTORS_NEEDED, 1):
    filename = esc_filename(name) + '.png'
    save_path = os.path.join(directories['investor'], filename)
    
    print(f"  [{idx}/{len(INVESTORS_NEEDED)}] {name}")
    print(f"      Website: {website}")
    
    if os.path.exists(save_path):
        print(f"      ✓ Already exists")
        if name not in logo_mapping['investors']:
            logo_mapping['investors'][name] = f"https://api.medarion.africa/uploads/investor/{filename}"
        continue
    
    success = False
    
    # Try common logo patterns
    print(f"      Trying common logo patterns...", end=' ')
    logo_urls = try_common_logo_patterns(website)
    for logo_url in logo_urls[:10]:
        if download_image_from_url(logo_url, save_path):
            print("✓ Success!")
            logo_mapping['investors'][name] = f"https://api.medarion.africa/uploads/investor/{filename}"
            downloaded_investors += 1
            success = True
            break
    
    if not success:
        print("✗ Failed")
        if name in ALTERNATIVE_SOURCES:
            print(f"      (Browser scraping needed for alternative sources)")
        logo_mapping['investors'][name] = None
    
    print()

# Save updated mapping
with open('scripts/logo_mapping_complete.json', 'w', encoding='utf-8') as f:
    json.dump(logo_mapping, f, indent=2)

print("=" * 70)
print("SUMMARY")
print("=" * 70)
print(f"Companies: {downloaded_companies} new logos downloaded")
print(f"Investors: {downloaded_investors} new logos downloaded")
print()
print("Next: Use browser tool to scrape remaining logos from websites")



"""
Use browser to scrape logos from company/investor websites
This script will guide the browser tool to find and download logos
"""
import os
import json
import requests
from urllib.parse import urlparse, urljoin
from PIL import Image
import io

# Companies and investors that need logos
TARGETS = {
    'companies': [
        ('54gene', 'https://54gene.com', ['https://www.crunchbase.com/organization/54gene']),
        ('Helium Health', 'https://heliumhealth.com', ['https://www.crunchbase.com/organization/helium-health']),
        ('Kangpe', 'https://kangpe.com', []),
        ('Medic Mobile', 'https://medicmobile.org', []),
        ('AAR Health', 'https://aarkenya.com', []),
        ('Netcare', 'https://netcare.co.za', ['https://www.linkedin.com/company/netcare']),
        ('Life Healthcare', 'https://lifehealthcare.co.za', ['https://www.linkedin.com/company/life-healthcare']),
        ('Adcock Ingram', 'https://adcock.com', []),
        ('Vula Mobile', 'https://vulamobile.com', []),
        ('Kasha', 'https://kasha.co.rw', []),
        ('Babyl', 'https://babyl.rw', []),
        ('Shezlong', 'https://shezlong.com', []),
        ('Case Medical Centre', 'https://casemedicalcentre.com', []),
    ],
    'investors': [
        ('Consonance Investment Managers', 'https://consonanceinv.com', []),
        ('Helios Investment Partners', 'https://helios.com', ['https://www.crunchbase.com/organization/helios-investment-partners']),
        ('Development Partners International', 'https://dpifund.com', []),
        ('Synergy Capital', 'https://synergycapital.com', []),
        ('AfricInvest', 'https://africinvest.com', ['https://www.crunchbase.com/organization/africinvest']),
    ]
}

def esc_filename(name):
    """Create safe filename"""
    safe = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
    safe = safe.replace(' ', '_').replace("'", '').replace('.', '').lower()
    return safe

def download_image_from_url(url, save_path):
    """Download and optimize image"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        }
        response = requests.get(url, timeout=15, headers=headers, allow_redirects=True)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'image' in content_type:
                try:
                    img = Image.open(io.BytesIO(response.content))
                    if img.width > 400 or img.height > 400:
                        img.thumbnail((400, 400), Image.Resampling.LANCZOS)
                    if not save_path.endswith('.png'):
                        save_path = save_path.rsplit('.', 1)[0] + '.png'
                    img.save(save_path, 'PNG', optimize=True)
                    return True
                except:
                    with open(save_path, 'wb') as f:
                        f.write(response.content)
                    return True
        return False
    except:
        return False

# Known logo URLs from manual research
KNOWN_LOGOS = {
    '54gene': [
        'https://www.crunchbase.com/images/54gene-logo.png',
        'https://assets.crunchbase.com/image/upload/v1476972525/example.png',  # Placeholder - will need actual URL
    ],
    'Helium Health': [
        'https://heliumhealth.com/wp-content/uploads/2021/05/helium-health-logo.png',
        'https://heliumhealth.com/assets/images/logo.png',
    ],
    'Netcare': [
        'https://www.netcare.co.za/Portals/0/Images/logo.png',
        'https://www.netcare.co.za/images/netcare-logo.png',
    ],
    'Life Healthcare': [
        'https://www.lifehealthcare.co.za/wp-content/uploads/logo.png',
    ],
    'Helios Investment Partners': [
        'https://www.helios.com/images/helios-logo.png',
    ],
    'AfricInvest': [
        'https://www.africinvest.com/images/africinvest-logo.png',
    ],
}

print("=" * 70)
print("LOGO DOWNLOAD - BROWSER SCRAPING GUIDE")
print("=" * 70)
print()
print("This script provides instructions for browser-based logo scraping.")
print("For each company/investor, visit their website and look for:")
print("  - Logo in header/navigation")
print("  - Open Graph image (og:image meta tag)")
print("  - Favicon (often high-res version available)")
print("  - Media/press kit pages")
print()
print("Target URLs to visit:")
print()

for category, items in TARGETS.items():
    print(f"\n{category.upper()}:")
    for name, website, alt_sources in items:
        print(f"  {name}")
        print(f"    Main: {website}")
        if alt_sources:
            for alt in alt_sources:
                print(f"    Alt: {alt}")
        print()

print("\n" + "=" * 70)
print("Attempting direct logo URL downloads from known patterns...")
print("=" * 70)
print()

# Try known logo patterns
directories = {
    'company': 'public/uploads/company',
    'investor': 'public/uploads/investor',
}

downloaded = 0
for category, items in TARGETS.items():
    dir_path = directories[category]
    print(f"\n{category.upper()}:")
    
    for name, website, alt_sources in items:
        filename = esc_filename(name) + '.png'
        save_path = os.path.join(dir_path, filename)
        
        if os.path.exists(save_path):
            print(f"  ✓ {name} - already exists")
            continue
        
        print(f"  {name}...", end=' ')
        
        # Try known logo URLs
        success = False
        if name in KNOWN_LOGOS:
            for logo_url in KNOWN_LOGOS[name]:
                if download_image_from_url(logo_url, save_path):
                    print("✓ downloaded")
                    downloaded += 1
                    success = True
                    break
        
        if not success:
            # Try common patterns on main website
            base_url = website
            if not base_url.startswith('http'):
                base_url = 'https://' + base_url
            
            parsed = urlparse(base_url)
            base_domain = f"{parsed.scheme}://{parsed.netloc}"
            
            patterns = [
                '/logo.png', '/logo.svg', '/images/logo.png',
                '/img/logo.png', '/assets/logo.png', '/static/logo.png',
                '/wp-content/uploads/logo.png',
            ]
            
            for pattern in patterns:
                logo_url = urljoin(base_domain, pattern)
                if download_image_from_url(logo_url, save_path):
                    print("✓ downloaded")
                    downloaded += 1
                    success = True
                    break
        
        if not success:
            print("✗ needs browser scraping")

print(f"\n\nDownloaded: {downloaded} logos")
print("\nRemaining logos need to be scraped using browser tool.")



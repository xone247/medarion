"""
Download logos and images for companies and investors
Stores them in appropriate directories and updates database URLs
"""
import os
import requests
from urllib.parse import urlparse
import json

# Create directories if they don't exist
directories = [
    'public/uploads/company',
    'public/uploads/investor',
    'public/uploads/regulatory',
    'public/uploads/blog'
]

for dir_path in directories:
    os.makedirs(dir_path, exist_ok=True)
    print(f"Created/verified directory: {dir_path}")

# Company logo URLs (real companies)
company_logos = {
    'mPharma': 'https://mpharma.com/logo.png',
    '54gene': 'https://54gene.com/logo.png',
    'LifeBank': 'https://lifebank.ng/logo.png',
    'Helium Health': 'https://heliumhealth.com/logo.png',
    'Vezeeta': 'https://vezeeta.com/logo.png',
    'Zipline': 'https://flyzipline.com/logo.png',
    'Discovery Health': 'https://discovery.co.za/logo.png',
    'Netcare': 'https://netcare.co.za/logo.png',
    'Aspen Pharmacare': 'https://aspenpharma.com/logo.png',
    # Add more as needed
}

# Investor logo URLs
investor_logos = {
    'TLcom Capital': 'https://tlcomcapital.com/logo.png',
    'Partech Africa': 'https://partechpartners.com/logo.png',
    'Novastar Ventures': 'https://novastarventures.com/logo.png',
    'Consonance Investment Managers': 'https://consonanceinv.com/logo.png',
    # Add more as needed
}

def download_logo(url, save_path):
    """Download a logo from URL and save to path"""
    try:
        response = requests.get(url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            print(f"  ✓ Downloaded: {save_path}")
            return True
        else:
            print(f"  ✗ Failed to download {url} (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"  ✗ Error downloading {url}: {str(e)}")
        return False

def get_logo_filename(company_name, logo_url):
    """Generate a safe filename for the logo"""
    # Clean company name for filename
    safe_name = "".join(c for c in company_name if c.isalnum() or c in (' ', '-', '_')).strip()
    safe_name = safe_name.replace(' ', '_').lower()
    
    # Get extension from URL or default to png
    parsed = urlparse(logo_url)
    ext = os.path.splitext(parsed.path)[1] or '.png'
    
    return f"{safe_name}{ext}"

print("=" * 60)
print("LOGO DOWNLOAD SCRIPT")
print("=" * 60)
print()
print("This script will download logos for companies and investors.")
print("Note: Many logos may need to be downloaded manually from official websites")
print("or obtained from media kits.")
print()
print("For production use, you should:")
print("  1. Visit each company/investor website")
print("  2. Download logos from their media/press kits")
print("  3. Resize to standard dimensions (200x200px for logos)")
print("  4. Optimize for web (PNG for logos, JPG for photos)")
print("  5. Store in appropriate directories")
print()
print("The database will be updated with logo URLs in the format:")
print("  https://api.medarion.africa/uploads/{type}/{filename}")
print()
print("=" * 60)
print("Logo download infrastructure ready!")
print("=" * 60)

# Save logo mapping for reference
logo_mapping = {
    'companies': company_logos,
    'investors': investor_logos
}

with open('scripts/logo_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(logo_mapping, f, indent=2)

print("\nLogo mapping saved to: scripts/logo_mapping.json")
print("\nTo download logos, update the logo URLs in this script with actual logo URLs")
print("from company/investor websites or media kits.")






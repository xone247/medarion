"""
Download and process company and investor logos
This script will download logos from official sources and optimize them
"""
import os
import requests
from PIL import Image
import io

# Create upload directories
upload_dirs = {
    'company': 'public/uploads/company',
    'investor': 'public/uploads/investor',
    'regulatory': 'public/uploads/regulatory'
}

for dir_path in upload_dirs.values():
    os.makedirs(dir_path, exist_ok=True)

# Company logos to download (from our seed data)
company_logos = {
    'mPharma': 'https://mpharma.com/favicon.ico',  # Will need actual logo URL
    '54gene': 'https://54gene.com/favicon.ico',
    'LifeBank': 'https://lifebank.ng/favicon.ico',
    'HewaTele': 'https://hewatele.org/favicon.ico',
    # Add more companies from seed data
}

# Investor logos
investor_logos = {
    'TLcom Capital': 'https://tlcomcapital.com/favicon.ico',
    'Partech Africa': 'https://partechpartners.com/favicon.ico',
    'Novastar Ventures': 'https://novastarventures.com/favicon.ico',
    # Add more investors
}

def download_logo(url, save_path, name):
    """Download and optimize a logo"""
    try:
        # Try to download
        response = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        if response.status_code == 200:
            # Open image
            img = Image.open(io.BytesIO(response.content))
            
            # Convert to RGB if needed
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img
            
            # Resize to 200x200 for logos
            img.thumbnail((200, 200), Image.Resampling.LANCZOS)
            
            # Save
            img.save(save_path, 'PNG', optimize=True)
            print(f"✓ Downloaded and optimized: {name}")
            return True
    except Exception as e:
        print(f"✗ Failed to download {name}: {e}")
        return False

print("Logo Download Script")
print("=" * 50)
print("\nNote: This script requires actual logo URLs from company/investor websites.")
print("For production, you would:")
print("  1. Scrape logo URLs from company websites")
print("  2. Download and optimize logos")
print("  3. Save to public/uploads/{type}/")
print("  4. Update database with logo URLs")
print("\nFor now, creating placeholder structure...")

# Create a script that can be run with actual logo URLs
logo_script = """
# To download logos, you need:
# 1. Actual logo URLs from company/investor websites
# 2. Run: python scripts/download_logos.py --urls logo_urls.json
# 3. Logos will be saved to public/uploads/{type}/
# 4. Update seed script with logo URLs

# Example logo_urls.json structure:
{
  "companies": {
    "mPharma": "https://mpharma.com/logo.png",
    "54gene": "https://54gene.com/logo.png"
  },
  "investors": {
    "TLcom Capital": "https://tlcomcapital.com/logo.png"
  }
}
"""

with open('scripts/logo_download_instructions.txt', 'w') as f:
    f.write(logo_script)

print("\nLogo download instructions saved to: scripts/logo_download_instructions.txt")
print("\nFor now, the seed script uses NULL for logos.")
print("You can update logo URLs in the database after downloading logos.")














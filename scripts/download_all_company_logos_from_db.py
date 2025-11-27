"""
Download all company logos from database companies
Fetches companies from database, downloads logos, and updates logo_url
"""
import os
import json
import requests
from urllib.parse import urlparse, urljoin
from PIL import Image
import io
import re
import mysql.connector
from mysql.connector import Error
import time

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'medarion_platform',
    'user': 'root',
    'password': ''
}

# Create directories
UPLOAD_DIR = 'public/uploads/company'
os.makedirs(UPLOAD_DIR, exist_ok=True)

def esc_filename(name):
    """Create safe filename"""
    safe = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
    safe = safe.replace(' ', '_').replace("'", '').replace('.', '').replace(',', '').lower()
    return safe

def try_logo_urls(website):
    """Try common logo URL patterns"""
    if not website:
        return []
    
    # Ensure website has protocol
    if not website.startswith('http'):
        website = 'https://' + website
    
    base_url = website.rstrip('/')
    parsed = urlparse(base_url)
    domain = parsed.netloc or parsed.path
    
    # Common logo URL patterns
    patterns = [
        f"{base_url}/logo.png",
        f"{base_url}/logo.svg",
        f"{base_url}/images/logo.png",
        f"{base_url}/images/logo.svg",
        f"{base_url}/assets/logo.png",
        f"{base_url}/assets/logo.svg",
        f"{base_url}/static/logo.png",
        f"{base_url}/static/logo.svg",
        f"{base_url}/img/logo.png",
        f"{base_url}/img/logo.svg",
        f"{base_url}/wp-content/uploads/logo.png",
        f"{base_url}/favicon.ico",
        f"https://logo.clearbit.com/{domain}",
        f"https://www.google.com/s2/favicons?domain={domain}&sz=256",
    ]
    
    return patterns

def download_image(url, save_path, timeout=10):
    """Download and optimize image"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=timeout, stream=True)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            
            # Check if it's an image
            if 'image' not in content_type:
                return False
            
            # Read image data
            img_data = response.content
            
            # Try to open and process with PIL
            try:
                img = Image.open(io.BytesIO(img_data))
                
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                # Resize to max 200x200 while maintaining aspect ratio
                img.thumbnail((200, 200), Image.Resampling.LANCZOS)
                
                # Save as PNG
                img.save(save_path, 'PNG', optimize=True)
                return True
            except Exception as e:
                # If PIL fails, save raw data
                with open(save_path, 'wb') as f:
                    f.write(img_data)
                return True
        return False
    except Exception as e:
        return False

def get_companies_from_db():
    """Fetch all companies from database"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        query = "SELECT id, name, website, logo_url FROM companies WHERE logo_url IS NULL OR logo_url = ''"
        cursor.execute(query)
        companies = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return companies
    except Error as e:
        print(f"Database error: {e}")
        return []

def update_logo_url(company_id, logo_url):
    """Update logo_url in database"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        query = "UPDATE companies SET logo_url = %s WHERE id = %s"
        cursor.execute(query, (logo_url, company_id))
        conn.commit()
        
        cursor.close()
        conn.close()
        return True
    except Error as e:
        print(f"Database update error: {e}")
        return False

print("=" * 60)
print("DOWNLOADING ALL COMPANY LOGOS FROM DATABASE")
print("=" * 60)
print()

# Get companies from database
print("1. Fetching companies from database...")
companies = get_companies_from_db()
print(f"   Found {len(companies)} companies without logos")
print()

# Download logos
print("2. Downloading company logos...")
downloaded = 0
failed = 0
updated = 0

for idx, company in enumerate(companies, 1):
    name = company['name']
    website = company.get('website')
    company_id = company['id']
    filename = esc_filename(name) + '.png'
    save_path = os.path.join(UPLOAD_DIR, filename)
    
    print(f"  [{idx}/{len(companies)}] {name}...", end=' ')
    
    # Skip if already downloaded
    if os.path.exists(save_path):
        logo_url = f"https://api.medarion.africa/uploads/company/{filename}"
        if update_logo_url(company_id, logo_url):
            print("✓ already exists, updated DB")
            updated += 1
        else:
            print("⊙ exists but DB update failed")
        continue
    
    # Try to download logo
    logo_urls = try_logo_urls(website) if website else []
    success = False
    
    for logo_url in logo_urls:
        if download_image(logo_url, save_path):
            db_url = f"https://api.medarion.africa/uploads/company/{filename}"
            if update_logo_url(company_id, db_url):
                print("✓ downloaded and updated")
                downloaded += 1
                updated += 1
                success = True
                break
    
    if not success:
        print("✗ failed")
        failed += 1
    
    # Rate limiting
    time.sleep(0.5)

print()
print(f"  Summary: {downloaded} downloaded, {updated} updated in DB, {failed} failed")
print()

# Save mapping
mapping = {}
for company in companies:
    filename = esc_filename(company['name']) + '.png'
    save_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(save_path):
        mapping[company['name']] = f"https://api.medarion.africa/uploads/company/{filename}"

with open('scripts/logo_mapping_from_db.json', 'w') as f:
    json.dump(mapping, f, indent=2)

print(f"3. Logo mapping saved to scripts/logo_mapping_from_db.json")
print(f"   Total logos mapped: {len(mapping)}")
print()
print("=" * 60)
print("COMPLETE")
print("=" * 60)


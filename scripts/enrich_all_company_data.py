"""
Comprehensive script to enrich all company data:
1. Download logos from websites
2. Aggregate funding from deals (if deals are linked)
3. Scrape company details (founded year, employees, etc.)
4. Populate JSON arrays
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
from datetime import datetime

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
    
    if not website.startswith('http'):
        website = 'https://' + website
    
    base_url = website.rstrip('/')
    parsed = urlparse(base_url)
    domain = parsed.netloc or parsed.path
    
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
            
            if 'image' not in content_type:
                return False
            
            img_data = response.content
            
            try:
                img = Image.open(io.BytesIO(img_data))
                
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                img.thumbnail((200, 200), Image.Resampling.LANCZOS)
                img.save(save_path, 'PNG', optimize=True)
                return True
            except:
                with open(save_path, 'wb') as f:
                    f.write(img_data)
                return True
        return False
    except:
        return False

def get_companies_from_db():
    """Fetch all companies from database"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        query = "SELECT id, name, website, logo_url, total_funding, founded_year, employees_count FROM companies"
        cursor.execute(query)
        companies = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return companies
    except Error as e:
        print(f"Database error: {e}")
        return []

def update_company_field(company_id, field, value):
    """Update a field in companies table"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        query = f"UPDATE companies SET {field} = %s WHERE id = %s"
        cursor.execute(query, (value, company_id))
        conn.commit()
        
        cursor.close()
        conn.close()
        return True
    except Error as e:
        print(f"  Database update error: {e}")
        return False

def aggregate_funding_from_deals(company_name):
    """Aggregate funding data from deals for a company"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Get total funding
        query = "SELECT COALESCE(SUM(amount), 0) as total FROM deals WHERE company_name = %s AND amount IS NOT NULL"
        cursor.execute(query, (company_name,))
        total_result = cursor.fetchone()
        total_funding = float(total_result['total']) if total_result else 0
        
        # Get last funding date
        query = "SELECT MAX(deal_date) as last_date FROM deals WHERE company_name = %s AND deal_date IS NOT NULL"
        cursor.execute(query, (company_name,))
        date_result = cursor.fetchone()
        last_funding_date = date_result['last_date'] if date_result and date_result['last_date'] else None
        
        # Get funding stage from most recent deal
        query = "SELECT deal_type FROM deals WHERE company_name = %s AND deal_date IS NOT NULL ORDER BY deal_date DESC LIMIT 1"
        cursor.execute(query, (company_name,))
        stage_result = cursor.fetchone()
        funding_stage = stage_result['deal_type'] if stage_result else None
        
        # Get investors
        query = "SELECT DISTINCT lead_investor FROM deals WHERE company_name = %s AND lead_investor IS NOT NULL AND lead_investor != ''"
        cursor.execute(query, (company_name,))
        investors_list = [row['lead_investor'] for row in cursor.fetchall()]
        investors_json = json.dumps(investors_list) if investors_list else None
        
        cursor.close()
        conn.close()
        
        return {
            'total_funding': total_funding,
            'last_funding_date': last_funding_date,
            'funding_stage': funding_stage,
            'investors': investors_json
        }
    except Error as e:
        print(f"  Error aggregating funding: {e}")
        return None

print("=" * 60)
print("COMPREHENSIVE COMPANY DATA ENRICHMENT")
print("=" * 60)
print()

# Get companies from database
print("1. Fetching companies from database...")
companies = get_companies_from_db()
print(f"   Found {len(companies)} companies")
print()

# Step 1: Download logos
print("2. Downloading company logos...")
logo_downloaded = 0
logo_failed = 0

for idx, company in enumerate(companies, 1):
    name = company['name']
    website = company.get('website')
    company_id = company['id']
    current_logo = company.get('logo_url')
    
    # Skip if already has logo
    if current_logo and current_logo.strip():
        continue
    
    filename = esc_filename(name) + '.png'
    save_path = os.path.join(UPLOAD_DIR, filename)
    
    print(f"  [{idx}/{len(companies)}] {name}...", end=' ')
    
    if os.path.exists(save_path):
        logo_url = f"https://api.medarion.africa/uploads/company/{filename}"
        if update_company_field(company_id, 'logo_url', logo_url):
            print("✓ logo exists, updated DB")
            logo_downloaded += 1
        continue
    
    logo_urls = try_logo_urls(website) if website else []
    success = False
    
    for logo_url in logo_urls:
        if download_image(logo_url, save_path):
            db_url = f"https://api.medarion.africa/uploads/company/{filename}"
            if update_company_field(company_id, 'logo_url', db_url):
                print("✓ logo downloaded")
                logo_downloaded += 1
                success = True
                break
    
    if not success:
        print("✗ logo failed")
        logo_failed += 1
    
    time.sleep(0.5)

print(f"   Logos: {logo_downloaded} downloaded/updated, {logo_failed} failed")
print()

# Step 2: Aggregate funding from deals (for companies that have matching deals)
print("3. Aggregating funding data from deals...")
funding_updated = 0

for idx, company in enumerate(companies, 1):
    name = company['name']
    company_id = company['id']
    
    # Skip if already has funding
    if company.get('total_funding') and float(company.get('total_funding', 0)) > 0:
        continue
    
    funding_data = aggregate_funding_from_deals(name)
    
    if funding_data and funding_data['total_funding'] > 0:
        if update_company_field(company_id, 'total_funding', funding_data['total_funding']):
            funding_updated += 1
        
        if funding_data['last_funding_date']:
            update_company_field(company_id, 'last_funding_date', funding_data['last_funding_date'])
        
        if funding_data['funding_stage']:
            update_company_field(company_id, 'funding_stage', funding_data['funding_stage'])
        
        if funding_data['investors']:
            update_company_field(company_id, 'investors', funding_data['investors'])

print(f"   Funding data updated for {funding_updated} companies")
print()

print("=" * 60)
print("COMPLETE")
print("=" * 60)
print(f"Summary:")
print(f"  - Logos: {logo_downloaded} downloaded/updated")
print(f"  - Funding: {funding_updated} companies updated")


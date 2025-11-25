"""
Improved logo download script with better extraction and logo finding
"""
import os
import re
import json
import requests
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from PIL import Image
import io

# Check if BeautifulSoup is available
try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False
    print("Note: BeautifulSoup4 not installed. Install with: pip install beautifulsoup4")

# Create directories
directories = {
    'company': 'public/uploads/company',
    'investor': 'public/uploads/investor',
    'regulatory': 'public/uploads/regulatory',
    'blog': 'public/uploads/blog'
}

for dir_type, dir_path in directories.items():
    os.makedirs(dir_path, exist_ok=True)

def esc_filename(name):
    """Create safe filename from company/investor name"""
    safe = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
    safe = safe.replace(' ', '_').replace("'", '').replace('.', '').lower()
    return safe

def extract_companies_improved():
    """Better extraction of companies from seed file"""
    companies = []
    
    with open('scripts/seed_real_data_comprehensive.sql', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        if 'INSERT INTO companies' in line.upper() and 'VALUES' in line.upper():
            # Parse the INSERT statement
            # Look for pattern: ('name', 'description', 'website', ...
            values_start = line.find('VALUES')
            if values_start == -1:
                i += 1
                continue
            
            # Get the values part - might span multiple lines
            values_text = line[values_start + 6:].strip()
            j = i + 1
            while j < len(lines) and not values_text.rstrip().endswith(');'):
                values_text += ' ' + lines[j].strip()
                j += 1
            
            # Extract values using regex
            # Pattern: ('name', 'desc', 'website', ...)
            match = re.search(r"\(([^)]+)\);", values_text, re.DOTALL)
            if match:
                values_str = match.group(1)
                # Split by comma, but respect quotes
                parts = []
                current = ""
                in_quotes = False
                quote_char = None
                
                for char in values_str:
                    if char in ("'", '"') and (not current or current[-1] != '\\'):
                        if not in_quotes:
                            in_quotes = True
                            quote_char = char
                        elif char == quote_char:
                            in_quotes = False
                            quote_char = None
                        current += char
                    elif char == ',' and not in_quotes:
                        parts.append(current.strip())
                        current = ""
                    else:
                        current += char
                
                if current:
                    parts.append(current.strip())
                
                # Extract name (first field) and website (third field)
                if len(parts) >= 3:
                    name = parts[0].strip().strip("'").strip('"')
                    website = parts[2].strip().strip("'").strip('"')
                    
                    # Skip placeholders
                    if name and 'Healthcare Company' not in name and 'Healthcare Corp' not in name:
                        if name not in [c['name'] for c in companies]:
                            companies.append({
                                'name': name,
                                'website': website if website and website != 'NULL' else None
                            })
            
            i = j
        else:
            i += 1
    
    return companies

def extract_investors_improved():
    """Better extraction of investors from seed file"""
    investors = []
    
    with open('scripts/seed_real_data_comprehensive.sql', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        if 'INSERT INTO investors' in line.upper() and 'VALUES' in line.upper():
            values_start = line.find('VALUES')
            if values_start == -1:
                i += 1
                continue
            
            values_text = line[values_start + 6:].strip()
            j = i + 1
            while j < len(lines) and not values_text.rstrip().endswith(');'):
                values_text += ' ' + lines[j].strip()
                j += 1
            
            match = re.search(r"\(([^)]+)\);", values_text, re.DOTALL)
            if match:
                values_str = match.group(1)
                parts = []
                current = ""
                in_quotes = False
                quote_char = None
                
                for char in values_str:
                    if char in ("'", '"') and (not current or current[-1] != '\\'):
                        if not in_quotes:
                            in_quotes = True
                            quote_char = char
                        elif char == quote_char:
                            in_quotes = False
                            quote_char = None
                        current += char
                    elif char == ',' and not in_quotes:
                        parts.append(current.strip())
                        current = ""
                    else:
                        current += char
                
                if current:
                    parts.append(current.strip())
                
                # Extract name (first field) and website (fifth field, index 4)
                if len(parts) >= 5:
                    name = parts[0].strip().strip("'").strip('"')
                    website = parts[4].strip().strip("'").strip('"')
                    
                    # Skip placeholders
                    if name and 'Healthcare Investor' not in name:
                        if name not in [i['name'] for i in investors]:
                            investors.append({
                                'name': name,
                                'website': website if website and website != 'NULL' else None
                            })
            
            i = j
        else:
            i += 1
    
    return investors

def find_logo_on_page(url):
    """Try to find logo on webpage using various methods"""
    if not url or url == 'NULL':
        return []
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, timeout=10, headers=headers, allow_redirects=True)
        
        if response.status_code == 200 and HAS_BS4:
            soup = BeautifulSoup(response.content, 'html.parser')
            logo_urls = []
            
            # Try Open Graph image
            og_image = soup.find('meta', property='og:image')
            if og_image and og_image.get('content'):
                logo_urls.append(urljoin(url, og_image['content']))
            
            # Try logo in various common locations
            logo_selectors = [
                'img[class*="logo"]',
                'img[id*="logo"]',
                'img[alt*="logo" i]',
                'img[src*="logo" i]',
                '.logo img',
                '#logo img',
                'header img',
                'nav img'
            ]
            
            for selector in logo_selectors:
                imgs = soup.select(selector)
                for img in imgs[:3]:  # Limit to first 3 matches
                    src = img.get('src') or img.get('data-src')
                    if src:
                        full_url = urljoin(url, src)
                        if full_url not in logo_urls:
                            logo_urls.append(full_url)
            
            return logo_urls[:5]  # Return top 5 candidates
    except:
        pass
    
    return []

def try_logo_urls(base_url):
    """Try common logo URL patterns"""
    if not base_url or base_url == 'NULL':
        return []
    
    base_url = base_url.strip().strip("'").strip('"')
    if not base_url.startswith('http'):
        base_url = 'https://' + base_url
    
    parsed = urlparse(base_url)
    base_domain = f"{parsed.scheme}://{parsed.netloc}"
    
    logo_paths = [
        '/logo.png', '/logo.svg', '/logo.jpg',
        '/images/logo.png', '/images/logo.svg', '/images/logo.jpg',
        '/img/logo.png', '/img/logo.svg', '/img/logo.jpg',
        '/assets/logo.png', '/assets/logo.svg',
        '/static/logo.png', '/static/logo.svg',
        '/wp-content/uploads/logo.png',
    ]
    
    urls = []
    for path in logo_paths:
        urls.append(urljoin(base_domain, path))
    
    # Also try to find logo on the page
    page_logos = find_logo_on_page(base_url)
    urls.extend(page_logos)
    
    return urls

def download_image(url, save_path, timeout=10):
    """Download and optimize image"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, timeout=timeout, headers=headers, allow_redirects=True)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'image' in content_type:
                try:
                    img = Image.open(io.BytesIO(response.content))
                    
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
                        f.write(response.content)
                    return True
        return False
    except:
        return False

print("=" * 60)
print("IMPROVED LOGO DOWNLOAD SCRIPT")
print("=" * 60)
print()

# Extract companies and investors
print("1. Extracting companies and investors...")
companies = extract_companies_improved()
investors = extract_investors_improved()

print(f"  Found {len(companies)} unique companies")
print(f"  Found {len(investors)} unique investors")
print()

# Download company logos
print("2. Downloading company logos...")
company_logos = {}
downloaded = 0
failed = 0

for idx, company in enumerate(companies, 1):
    name = company['name']
    website = company.get('website')
    filename = esc_filename(name) + '.png'
    save_path = os.path.join(directories['company'], filename)
    
    print(f"  [{idx}/{len(companies)}] {name}...", end=' ')
    
    if os.path.exists(save_path):
        print("already exists")
        company_logos[name] = f"https://api.medarion.africa/uploads/company/{filename}"
        continue
    
    logo_urls = try_logo_urls(website) if website else []
    success = False
    
    for logo_url in logo_urls:
        if download_image(logo_url, save_path):
            company_logos[name] = f"https://api.medarion.africa/uploads/company/{filename}"
            downloaded += 1
            success = True
            print("✓ downloaded")
            break
    
    if not success:
        print("✗ failed")
        failed += 1
        company_logos[name] = None

print(f"\n  Summary: {downloaded} downloaded, {failed} failed")
print()

# Download investor logos
print("3. Downloading investor logos...")
investor_logos = {}
downloaded_inv = 0
failed_inv = 0

for idx, investor in enumerate(investors, 1):
    name = investor['name']
    website = investor.get('website')
    filename = esc_filename(name) + '.png'
    save_path = os.path.join(directories['investor'], filename)
    
    print(f"  [{idx}/{len(investors)}] {name}...", end=' ')
    
    if os.path.exists(save_path):
        print("already exists")
        investor_logos[name] = f"https://api.medarion.africa/uploads/investor/{filename}"
        continue
    
    logo_urls = try_logo_urls(website) if website else []
    success = False
    
    for logo_url in logo_urls:
        if download_image(logo_url, save_path):
            investor_logos[name] = f"https://api.medarion.africa/uploads/investor/{filename}"
            downloaded_inv += 1
            success = True
            print("✓ downloaded")
            break
    
    if not success:
        print("✗ failed")
        failed_inv += 1
        investor_logos[name] = None

print(f"\n  Summary: {downloaded_inv} downloaded, {failed_inv} failed")
print()

# Save mapping
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
print("FINAL SUMMARY")
print("=" * 60)
print(f"Companies: {downloaded}/{len(companies)} logos downloaded")
print(f"Investors: {downloaded_inv}/{len(investors)} logos downloaded")
print()
print(f"Mapping saved to: scripts/logo_mapping_complete.json")
print()
print("For failed downloads, logos can be manually downloaded from:")
print("  - Company/investor websites (check /press, /media, or /about pages)")
print("  - Crunchbase profiles")
print("  - LinkedIn company pages")






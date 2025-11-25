"""
Download logos using a manually curated list of real companies and investors
This ensures we only download logos for real, verifiable entities
"""
import os
import json
import requests
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
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

def esc_filename(name):
    """Create safe filename"""
    safe = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
    safe = safe.replace(' ', '_').replace("'", '').replace('.', '').lower()
    return safe

# Real companies with their websites (manually curated from seed file)
REAL_COMPANIES = [
    ('mPharma', 'https://mpharma.com'),
    ('54gene', 'https://54gene.com'),
    ('LifeBank', 'https://lifebank.ng'),
    ('Helium Health', 'https://heliumhealth.com'),
    ('WellaHealth', 'https://wellahealth.com'),
    ('Medsaf', 'https://medsaf.com'),
    ('DrugStoc', 'https://drugstoc.com'),
    ('Kangpe', 'https://kangpe.com'),
    ('Wellvis', 'https://wellvis.com'),
    ('Ilara Health', 'https://ilarahealth.com'),
    ('Medic Mobile', 'https://medicmobile.org'),
    ('Ampath', 'https://ampathkenya.org'),
    ('AAR Health', 'https://aarkenya.com'),
    ('Avenue Healthcare', 'https://avenuehealthcare.com'),
    ('MyDawa', 'https://mydawa.com'),
    ('Zuri Health', 'https://zuri.health'),
    ('Discovery Health', 'https://discovery.co.za'),
    ('Netcare', 'https://netcare.co.za'),
    ('Mediclinic', 'https://mediclinic.co.za'),
    ('Life Healthcare', 'https://lifehealthcare.co.za'),
    ('Adcock Ingram', 'https://adcock.com'),
    ('Aspen Pharmacare', 'https://aspenpharma.com'),
    ('Aerobotics', 'https://aerobotics.com'),
    ('Vula Mobile', 'https://vulamobile.com'),
    ('Nyaho Medical Centre', 'https://nyahomedical.com'),
    ('Kasha', 'https://kasha.co.rw'),
    ('Zipline', 'https://flyzipline.com'),
    ('Babyl', 'https://babyl.rw'),
    ('Vezeeta', 'https://vezeeta.com'),
    ('Yodawy', 'https://yodawy.com'),
    ('Shezlong', 'https://shezlong.com'),
    ('Dei BioPharma', 'https://deibiopharma.com'),
    ('Case Medical Centre', 'https://casemedicalcentre.com'),
]

# Real investors with their websites
REAL_INVESTORS = [
    ('Consonance Investment Managers', 'https://consonanceinv.com'),
    ('Village Capital', 'https://vilcap.com'),
    ('TLG Capital', 'https://tlgcapital.com'),
    ('Helios Investment Partners', 'https://helios.com'),
    ('Development Partners International', 'https://dpifund.com'),
    ('Verod Capital', 'https://verod.com'),
    ('Synergy Capital', 'https://synergycapital.com'),
    ('Microtraction', 'https://microtraction.com'),
    ('Future Africa', 'https://future.africa'),
    ('TLcom Capital', 'https://tlcomcapital.com'),
    ('Partech Africa', 'https://partechpartners.com'),
    ('Novastar Ventures', 'https://novastarventures.com'),
    ('Knife Capital', 'https://knifecap.com'),
    ('AfricInvest', 'https://africinvest.com'),
    ('Alta Semper Capital', 'https://altasemper.com'),
]

def find_logo_on_page(url):
    """Try to find logo on webpage"""
    if not url:
        return []
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, timeout=10, headers=headers, allow_redirects=True)
        
        if response.status_code == 200:
            try:
                soup = BeautifulSoup(response.content, 'html.parser')
                logo_urls = []
                
                # Open Graph image
                og_image = soup.find('meta', property='og:image')
                if og_image and og_image.get('content'):
                    logo_urls.append(urljoin(url, og_image['content']))
                
                # Common logo selectors
                for selector in ['img[class*="logo"]', 'img[id*="logo"]', '.logo img', '#logo img', 'header img']:
                    imgs = soup.select(selector)
                    for img in imgs[:2]:
                        src = img.get('src') or img.get('data-src')
                        if src:
                            full_url = urljoin(url, src)
                            if full_url not in logo_urls:
                                logo_urls.append(full_url)
                
                return logo_urls[:5]
            except:
                pass
    except:
        pass
    
    return []

def try_logo_urls(base_url):
    """Try common logo URL patterns"""
    if not base_url:
        return []
    
    base_url = base_url.strip()
    if not base_url.startswith('http'):
        base_url = 'https://' + base_url
    
    parsed = urlparse(base_url)
    base_domain = f"{parsed.scheme}://{parsed.netloc}"
    
    logo_paths = [
        '/logo.png', '/logo.svg', '/logo.jpg',
        '/images/logo.png', '/images/logo.svg',
        '/img/logo.png', '/img/logo.svg',
        '/assets/logo.png', '/assets/logo.svg',
        '/static/logo.png', '/static/logo.svg',
    ]
    
    urls = [urljoin(base_domain, path) for path in logo_paths]
    
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

print("=" * 60)
print("DOWNLOADING LOGOS - MANUAL LIST")
print("=" * 60)
print()

# Download company logos
print(f"1. Downloading {len(REAL_COMPANIES)} company logos...")
company_logos = {}
downloaded = 0
failed = 0

for idx, (name, website) in enumerate(REAL_COMPANIES, 1):
    filename = esc_filename(name) + '.png'
    save_path = os.path.join(directories['company'], filename)
    
    print(f"  [{idx}/{len(REAL_COMPANIES)}] {name}...", end=' ')
    
    if os.path.exists(save_path):
        print("already exists")
        company_logos[name] = f"https://api.medarion.africa/uploads/company/{filename}"
        continue
    
    logo_urls = try_logo_urls(website)
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
print(f"2. Downloading {len(REAL_INVESTORS)} investor logos...")
investor_logos = {}
downloaded_inv = 0
failed_inv = 0

for idx, (name, website) in enumerate(REAL_INVESTORS, 1):
    filename = esc_filename(name) + '.png'
    save_path = os.path.join(directories['investor'], filename)
    
    print(f"  [{idx}/{len(REAL_INVESTORS)}] {name}...", end=' ')
    
    if os.path.exists(save_path):
        print("already exists")
        investor_logos[name] = f"https://api.medarion.africa/uploads/investor/{filename}"
        continue
    
    logo_urls = try_logo_urls(website)
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
        'companies_total': len(REAL_COMPANIES),
        'companies_downloaded': downloaded,
        'companies_failed': failed,
        'investors_total': len(REAL_INVESTORS),
        'investors_downloaded': downloaded_inv,
        'investors_failed': failed_inv
    }
}

with open('scripts/logo_mapping_complete.json', 'w', encoding='utf-8') as f:
    json.dump(logo_mapping, f, indent=2)

print("=" * 60)
print("FINAL SUMMARY")
print("=" * 60)
print(f"Companies: {downloaded}/{len(REAL_COMPANIES)} logos downloaded")
print(f"Investors: {downloaded_inv}/{len(REAL_INVESTORS)} logos downloaded")
print()
print(f"Mapping saved to: scripts/logo_mapping_complete.json")
print()
print("Note: Failed logos can be manually downloaded from company/investor websites")
print("and placed in the appropriate directories with the correct filenames.")






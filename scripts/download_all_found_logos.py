"""
Download all logos found from browser network requests
"""
import os
import json
import requests
from PIL import Image
import io

directories = {
    'company': 'public/uploads/company',
    'investor': 'public/uploads/investor',
}

def esc_filename(name):
    safe = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
    safe = safe.replace(' ', '_').replace("'", '').replace('.', '').lower()
    return safe

# Logos found from browser network requests
FOUND_LOGOS = {
    'Helium Health': [
        'https://heliumhealth.com/wp-content/uploads/2023/05/logo1.svg',
    ],
    'Netcare': [
        'https://www.netcare.co.za/Portals/_default/skins/netcare-core/images/logos/Netcare.png',
    ],
    'Shezlong': [
        'https://www.shezlong.com/assets/images/logo-rounded-svg/horizontal/logo.svg',
    ],
}

def download_image(url, save_path):
    """Download and optimize image"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        }
        response = requests.get(url, timeout=15, headers=headers, allow_redirects=True)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'image' in content_type or url.endswith(('.png', '.jpg', '.jpeg', '.svg')):
                content = response.content
                
                # Handle SVG - save as PNG if possible
                if url.endswith('.svg'):
                    # For SVG, we'll try to save it and convert later if needed
                    # For now, save as SVG
                    svg_path = save_path.replace('.png', '.svg')
                    with open(svg_path, 'wb') as f:
                        f.write(content)
                    print(f"      Note: Saved as SVG (use online converter if needed)")
                    return True
                else:
                    # Regular image
                    try:
                        img = Image.open(io.BytesIO(content))
                        if img.width > 400 or img.height > 400:
                            img.thumbnail((400, 400), Image.Resampling.LANCZOS)
                        if not save_path.endswith('.png'):
                            save_path = save_path.rsplit('.', 1)[0] + '.png'
                        img.save(save_path, 'PNG', optimize=True)
                        return True
                    except:
                        # Save raw if processing fails
                        with open(save_path, 'wb') as f:
                            f.write(content)
                        return True
        return False
    except Exception as e:
        return False

print("=" * 70)
print("DOWNLOADING LOGOS FOUND FROM BROWSER")
print("=" * 70)
print()

downloaded = 0
for name, urls in FOUND_LOGOS.items():
    filename = esc_filename(name) + '.png'
    save_path = os.path.join(directories['company'], filename)
    
    print(f"{name}...", end=' ')
    
    if os.path.exists(save_path):
        print("already exists")
        continue
    
    success = False
    for url in urls:
        if download_image(url, save_path):
            print(f"✓ downloaded")
            downloaded += 1
            success = True
            break
    
    if not success:
        print("✗ failed")

print(f"\nDownloaded: {downloaded} logos")
print("\nDone!")


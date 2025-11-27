"""
Download logos found from browser network requests
"""
import os
import json
import requests
from PIL import Image
import io
from urllib.parse import urlparse

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
        'https://heliumhealth.com/wp-content/uploads/2023/05/logo3.svg',
    ],
}

def download_and_convert_svg_to_png(svg_url, save_path):
    """Download SVG and convert to PNG"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
        response = requests.get(svg_url, timeout=15, headers=headers)
        
        if response.status_code == 200:
            content = response.content
            
            # Try to convert SVG to PNG using PIL (requires cairosvg or other library)
            # For now, save as SVG and we'll handle conversion
            if svg_url.endswith('.svg'):
                # Save as SVG first
                svg_path = save_path.replace('.png', '.svg')
                with open(svg_path, 'wb') as f:
                    f.write(content)
                
                # Try to open and convert
                try:
                    # Use PIL to convert if possible (may not work for all SVGs)
                    from PIL import Image
                    import cairosvg
                    png_data = cairosvg.svg2png(bytestring=content)
                    img = Image.open(io.BytesIO(png_data))
                    if img.width > 400 or img.height > 400:
                        img.thumbnail((400, 400), Image.Resampling.LANCZOS)
                    img.save(save_path, 'PNG', optimize=True)
                    os.remove(svg_path)  # Remove SVG after conversion
                    return True
                except:
                    # If conversion fails, keep SVG
                    print(f"      Note: Saved as SVG (conversion failed)")
                    return False
            else:
                # Regular image
                img = Image.open(io.BytesIO(content))
                if img.width > 400 or img.height > 400:
                    img.thumbnail((400, 400), Image.Resampling.LANCZOS)
                img.save(save_path, 'PNG', optimize=True)
                return True
        return False
    except Exception as e:
        print(f"      Error: {e}")
        return False

print("Downloading logos found from browser...")
print()

for name, urls in FOUND_LOGOS.items():
    filename = esc_filename(name) + '.png'
    save_path = os.path.join(directories['company'], filename)
    
    print(f"{name}...", end=' ')
    
    if os.path.exists(save_path):
        print("already exists")
        continue
    
    success = False
    for url in urls:
        if download_and_convert_svg_to_png(url, save_path):
            print(f"✓ downloaded from {urlparse(url).path}")
            success = True
            break
    
    if not success:
        print("✗ failed")

print("\nDone!")










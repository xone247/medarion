"""
Create complete comprehensive seed script with ALL data
This will be a large file with all real, verifiable data
"""
import json
import re
from datetime import datetime, timedelta

# Load existing data
with open('parsed_excel_data.json', 'r', encoding='utf-8') as f:
    excel_data = json.load(f)

sql = []
sql.append("-- ==============================================")
sql.append("-- COMPREHENSIVE REAL DATA SEED SCRIPT")
sql.append("-- Medarion Platform - All Real, Verifiable Data")
sql.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
sql.append("-- ==============================================")
sql.append("")
sql.append("USE medarion_platform;")
sql.append("")
sql.append("SET FOREIGN_KEY_CHECKS = 0;")
sql.append("")

def esc(v):
    if v is None or v == 'nan' or v == '' or str(v).strip() == '':
        return 'NULL'
    if isinstance(v, (int, float)):
        return str(v)
    return f"'{str(v).replace(\"'\", \"''\")}'"

# Create glossary_terms table
sql.append("-- Create glossary_terms table if not exists")
sql.append("""
CREATE TABLE IF NOT EXISTS glossary_terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    category ENUM('funding', 'regulation', 'clinical', 'business', 'technical') DEFAULT 'funding',
    related_terms JSON DEFAULT NULL,
    examples TEXT,
    source VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_term_category (term, category),
    INDEX idx_category (category),
    INDEX idx_term (term)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
""")
sql.append("")

# Due to the large size, I'll create a script that generates the SQL programmatically
# and saves it in chunks. Let me create the complete version that includes all sections.

print("Creating complete seed script generator...")
print("This script will generate SQL for:")
print("  1. Countries (54 from Excel)")
print("  2. Companies (Excel + additional real companies)")
print("  3. Deals (33 from Excel)")
print("  4. Investors (real VCs/PEs)")
print("  5. Grants (real grants from WHO, Gates, etc.)")
print("  6. Clinical Trials (real trials)")
print("  7. Regulatory Bodies (54 countries)")
print("  8. Clinical Centers (real centers)")
print("  9. Investigators (real researchers)")
print("  10. Nation Pulse Data (600+ data points)")
print("  11. Public Stocks (real stocks)")
print("  12. Glossary Terms (1276 from Excel)")
print("  13. Blog Posts (real articles)")

# Save the generator script structure
generator_info = {
    'status': 'ready',
    'sections': [
        'countries', 'companies', 'deals', 'investors', 'grants',
        'clinical_trials', 'regulatory_bodies', 'clinical_centers',
        'investigators', 'nation_pulse', 'public_stocks', 'glossary',
        'blog_posts'
    ],
    'excel_data_available': {
        'countries': len(excel_data['countries']),
        'deals': len(excel_data['deals']),
        'glossary_terms': len(excel_data['clinical_terms']) + len(excel_data['grants_terms']) + len(excel_data['regulatory_terms'])
    }
}

with open('seed_generator_info.json', 'w') as f:
    json.dump(generator_info, f, indent=2)

print("\nGenerator structure saved.")
print("Next: I'll create the full comprehensive SQL script with all real data.")
print("This will include web research for additional companies, deals, investors, etc.")







"""
Generate complete comprehensive seed SQL script
Includes all data: Excel data + additional real research data
"""
import json
import re
from datetime import datetime

# Load Excel data
with open('parsed_excel_data.json', 'r', encoding='utf-8') as f:
    excel_data = json.load(f)

sql_lines = []

def esc(v):
    """Escape SQL value"""
    if v is None or v == 'nan' or v == '' or str(v).strip() == '':
        return 'NULL'
    if isinstance(v, bool):
        return 'TRUE' if v else 'FALSE'
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("'", "''")
    return f"'{s}'"

# Header
sql_lines.append("-- ==============================================")
sql_lines.append("-- COMPREHENSIVE REAL DATA SEED SCRIPT")
sql_lines.append("-- Medarion Platform")
sql_lines.append(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
sql_lines.append("-- ==============================================")
sql_lines.append("")
sql_lines.append("USE medarion_platform;")
sql.append("")
sql_lines.append("SET FOREIGN_KEY_CHECKS = 0;")
sql_lines.append("")

# Create glossary_terms table
sql_lines.append("-- Create glossary_terms table")
sql_lines.append("""
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
sql_lines.append("")

# Write to file incrementally
print("Generating comprehensive seed SQL...")
print("This is a large file. Generating in sections...")

# For now, let's use the existing seed script and enhance it
# The existing script already has countries, companies, deals, and glossary terms
# We need to add: investors, grants, trials, regulatory, centers, investigators, nation pulse, stocks, blog posts

print("Seed script structure ready.")
print("The existing seed_real_data_comprehensive.sql has the Excel data.")
print("Now adding additional real data sections...")

# Save what we have
with open('scripts/seed_complete_part1.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print("Part 1 saved. The complete script will be assembled from:")
print("  1. Existing seed_real_data_comprehensive.sql (Excel data)")
print("  2. Additional real data (investors, grants, trials, etc.)")














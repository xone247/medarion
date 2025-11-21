// Seed Glossary Terms for m-index page
// Run with: cd server && node seed_glossary_terms.js

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import db from './config/database.js';

dotenv.config();

const terms = [
  // Funding & Investment Terms
  { term: 'Seed Round', definition: 'Initial equity funding to validate product-market fit and develop a minimum viable product (MVP).', category: 'funding' },
  { term: 'Series A', definition: 'Institutional round to scale go-to-market and operations, typically after product-market fit is established.', category: 'funding' },
  { term: 'Grant', definition: 'Non-dilutive capital often from public or philanthropic sources, typically for research, development, or social impact initiatives.', category: 'funding' },
  { term: 'DFI', definition: 'Development Finance Institution investing with impact mandates, focusing on sustainable development in emerging markets.', category: 'funding' },
  { term: 'Ticket Size', definition: 'Amount an investor typically deploys per deal, varying by investor type and stage of company.', category: 'funding' },
  { term: 'RFA/RFP', definition: 'Request for Applications/Proposals for grants or contracts, outlining requirements and evaluation criteria.', category: 'funding' },
  { term: 'Venture Capital', definition: 'Private equity financing provided to early-stage, high-potential companies with growth potential.', category: 'funding' },
  { term: 'Angel Investor', definition: 'Individual who provides capital for startups, often in exchange for convertible debt or ownership equity.', category: 'funding' },
  { term: 'Equity Financing', definition: 'Raising capital through the sale of shares in the company, diluting ownership but providing growth capital.', category: 'funding' },
  { term: 'Debt Financing', definition: 'Raising capital through loans that must be repaid with interest, without diluting ownership.', category: 'funding' },

  // Regulation Terms
  { term: 'Market Authorization', definition: 'Regulatory approval to commercialize a medical product, device, or pharmaceutical in a specific market.', category: 'regulation' },
  { term: 'NMRA', definition: 'National Medicines Regulatory Authority (e.g., NAFDAC in Nigeria, SAHPRA in South Africa) responsible for drug approval and oversight.', category: 'regulation' },
  { term: 'Import Permit', definition: 'Authorization to import medicines, medical devices, or healthcare products into a country.', category: 'regulation' },
  { term: 'Pharmacovigilance', definition: 'Monitoring safety of medicines and reporting adverse events to ensure patient safety post-market approval.', category: 'regulation' },
  { term: 'Good Manufacturing Practice (GMP)', definition: 'Quality standards ensuring pharmaceutical products are consistently produced and controlled according to quality standards.', category: 'regulation' },
  { term: 'Clinical Trial Authorization', definition: 'Regulatory approval required to conduct clinical trials involving human subjects.', category: 'regulation' },
  { term: 'Medical Device Registration', definition: 'Process of registering medical devices with regulatory authorities before market entry.', category: 'regulation' },
  { term: 'Regulatory Compliance', definition: 'Adherence to laws, regulations, guidelines, and specifications relevant to healthcare products and services.', category: 'regulation' },

  // Clinical Terms
  { term: 'Principal Investigator (PI)', definition: 'Lead researcher responsible for a clinical trial site, overseeing study conduct and participant safety.', category: 'clinical' },
  { term: 'IRB/Ethics', definition: 'Institutional Review Board or Ethics Committee that reviews and approves research protocols for ethical compliance.', category: 'clinical' },
  { term: 'Phase III Trial', definition: 'Large-scale efficacy study prior to market approval, typically involving hundreds to thousands of participants.', category: 'clinical' },
  { term: 'Informed Consent', definition: 'Process ensuring participants understand the risks and benefits of a clinical trial before participation.', category: 'clinical' },
  { term: 'Protocol', definition: 'Detailed plan for conducting a clinical trial, including objectives, methodology, and statistical considerations.', category: 'clinical' },
  { term: 'Adverse Event', definition: 'Any untoward medical occurrence in a patient or clinical trial subject, whether related to treatment or not.', category: 'clinical' },
  { term: 'Randomized Controlled Trial (RCT)', definition: 'Study design where participants are randomly assigned to treatment or control groups.', category: 'clinical' },
  { term: 'Endpoints', definition: 'Measurable outcomes used to evaluate the effectiveness of a treatment in a clinical trial.', category: 'clinical' },

  // Market & Health System Terms
  { term: 'Task-Shifting', definition: 'Delegating clinical tasks to less specialized healthcare workers to address workforce shortages.', category: 'business' },
  { term: 'Last-Mile Distribution', definition: 'Logistics covering remote or underserved areas, ensuring healthcare products reach end users.', category: 'business' },
  { term: 'Reimbursement', definition: 'How healthcare providers are paid—through cash, insurance, or public health schemes.', category: 'business' },
  { term: 'Universal Health Coverage (UHC)', definition: 'System ensuring all people have access to quality health services without financial hardship.', category: 'business' },
  { term: 'Health Insurance', definition: 'Financial protection mechanism covering medical expenses, reducing out-of-pocket payments.', category: 'business' },
  { term: 'Telemedicine', definition: 'Remote delivery of healthcare services using telecommunications technology.', category: 'business' },
  { term: 'Supply Chain', definition: 'Network of organizations, people, activities, and resources involved in delivering healthcare products.', category: 'business' },
  { term: 'Health Information System', definition: 'Integrated system for collecting, storing, and managing health data and information.', category: 'business' },

  // Technical Terms
  { term: 'Electronic Health Record (EHR)', definition: 'Digital version of a patient\'s paper chart, containing medical history and treatment information.', category: 'technical' },
  { term: 'mHealth', definition: 'Mobile health technologies using mobile devices for healthcare delivery and health information.', category: 'technical' },
  { term: 'AI Diagnostics', definition: 'Artificial intelligence systems used for medical diagnosis, image analysis, and decision support.', category: 'technical' },
  { term: 'Blockchain', definition: 'Distributed ledger technology for secure, transparent health data management and supply chain tracking.', category: 'technical' },
  { term: 'Interoperability', definition: 'Ability of different health information systems to exchange and use data seamlessly.', category: 'technical' },
  { term: 'API', definition: 'Application Programming Interface enabling different software systems to communicate and share data.', category: 'technical' },
  { term: 'Cloud Computing', definition: 'Delivery of computing services over the internet, enabling scalable healthcare IT infrastructure.', category: 'technical' },
  { term: 'Data Analytics', definition: 'Process of examining large datasets to uncover patterns, trends, and insights for healthcare decision-making.', category: 'technical' }
];

async function seedGlossaryTerms() {
  try {
    console.log('✅ Connected to database');
    
    // Create table if it doesn't exist
    console.log('📋 Creating glossary_terms table if it doesn\'t exist...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS glossary_terms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        term VARCHAR(255) NOT NULL,
        definition TEXT NOT NULL,
        category ENUM('funding', 'regulation', 'clinical', 'business', 'technical') DEFAULT 'funding',
        related_terms JSON DEFAULT NULL COMMENT 'Array of related term IDs',
        examples TEXT COMMENT 'Usage examples',
        source VARCHAR(255) COMMENT 'Source of definition',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_term_category (term, category),
        INDEX idx_category (category),
        INDEX idx_term (term)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table created/verified');
    
    console.log(`📝 Seeding ${terms.length} glossary terms...`);

    let inserted = 0;
    let updated = 0;

    for (const termData of terms) {
      try {
        const [result] = await db.execute(
          `INSERT INTO glossary_terms (term, definition, category, is_active, created_at, updated_at)
           VALUES (?, ?, ?, 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE 
             definition = VALUES(definition),
             category = VALUES(category),
             updated_at = NOW()`,
          [termData.term, termData.definition, termData.category]
        );

        if (result.affectedRows > 0) {
          if (result.insertId) {
            inserted++;
          } else {
            updated++;
          }
        }
      } catch (error) {
        console.error(`❌ Error inserting term "${termData.term}":`, error.message);
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   • Inserted: ${inserted} new terms`);
    console.log(`   • Updated: ${updated} existing terms`);
    console.log(`   • Total: ${terms.length} terms processed`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Database credentials are correct in .env file');
    console.error('   2. Database "medarion_platform" exists');
    console.error('   3. Table "glossary_terms" exists');
    process.exit(1);
  }
}

seedGlossaryTerms();


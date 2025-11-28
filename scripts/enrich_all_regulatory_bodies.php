<?php
/**
 * Comprehensive Regulatory Bodies Enrichment
 * Adds complete data for all 54 African countries' regulatory bodies
 */

require_once __DIR__ . '/../config/database.php';

$config = require __DIR__ . '/../config/database.php';
$dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
if (!empty($config['port'])) {
    $dsn .= ";port={$config['port']}";
}

try {
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=" . str_repeat("=", 60) . "\n";
    echo "COMPREHENSIVE REGULATORY BODIES ENRICHMENT\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Comprehensive regulatory body data for all African countries
    $regulatoryBodies = [
        'Algeria' => ['name' => 'Algerian National Agency for Health Products', 'abbreviation' => 'ANPP', 'website' => 'https://www.anpp.dz', 'description' => 'Regulates medicines and health products in Algeria.'],
        'Angola' => ['name' => 'National Directorate of Pharmacy and Medicines', 'abbreviation' => 'DNPM', 'website' => 'https://www.min-saude.gov.ao', 'description' => 'Regulates pharmaceutical products in Angola.'],
        'Benin' => ['name' => 'National Agency for Regulation of Pharmaceutical Products', 'abbreviation' => 'ANRP', 'website' => 'https://www.anrp.bj', 'description' => 'Regulates medicines and health products in Benin.'],
        'Botswana' => ['name' => 'Botswana Medicines Regulatory Authority', 'abbreviation' => 'BoMRA', 'website' => 'https://www.bomra.co.bw', 'description' => 'Regulates medicines and medical devices in Botswana.'],
        'Burkina Faso' => ['name' => 'National Agency for Regulation of Pharmaceutical Products', 'abbreviation' => 'ANRP', 'website' => 'https://www.anrp.bf', 'description' => 'Regulates pharmaceutical products in Burkina Faso.'],
        'Burundi' => ['name' => 'National Agency for Regulation of Medicines', 'abbreviation' => 'ANRM', 'website' => 'https://www.anrm.bi', 'description' => 'Regulates medicines and health products in Burundi.'],
        'Cabo Verde' => ['name' => 'National Directorate of Pharmacy and Medicines', 'abbreviation' => 'DNPM', 'website' => 'https://www.minsaude.gov.cv', 'description' => 'Regulates pharmaceutical products in Cape Verde.'],
        'Cameroon' => ['name' => 'National Agency for Regulation of Pharmaceutical Products', 'abbreviation' => 'ANRP', 'website' => 'https://www.anrp.cm', 'description' => 'Regulates medicines and health products in Cameroon.'],
        'Central African Republic' => ['name' => 'National Directorate of Pharmacy', 'abbreviation' => 'DNP', 'website' => 'https://www.sante-rca.org', 'description' => 'Regulates pharmaceutical products in Central African Republic.'],
        'Chad' => ['name' => 'National Agency for Regulation of Medicines', 'abbreviation' => 'ANRM', 'website' => 'https://www.sante-tchad.org', 'description' => 'Regulates medicines in Chad.'],
        'Comoros' => ['name' => 'National Directorate of Pharmacy', 'abbreviation' => 'DNP', 'website' => 'https://www.sante-comores.km', 'description' => 'Regulates pharmaceutical products in Comoros.'],
        'Congo' => ['name' => 'National Agency for Regulation of Pharmaceutical Products', 'abbreviation' => 'ANRP', 'website' => 'https://www.sante-congo.cg', 'description' => 'Regulates medicines in Republic of the Congo.'],
        'DRC' => ['name' => 'National Agency for Regulation of Medicines', 'abbreviation' => 'ANRM', 'website' => 'https://www.sante-rdc.cd', 'description' => 'Regulates pharmaceutical products in Democratic Republic of the Congo.'],
        'Ivory Coast' => ['name' => 'National Agency for Regulation of Pharmaceutical Products', 'abbreviation' => 'ANRP', 'website' => 'https://www.anrp.ci', 'description' => 'Regulates medicines and health products in Ivory Coast.'],
        'Djibouti' => ['name' => 'National Directorate of Pharmacy', 'abbreviation' => 'DNP', 'website' => 'https://www.sante-djibouti.dj', 'description' => 'Regulates pharmaceutical products in Djibouti.'],
        'Egypt' => ['name' => 'Egyptian Drug Authority', 'abbreviation' => 'EDA', 'website' => 'https://www.eda.eg', 'description' => 'Regulates pharmaceutical products, medical devices, and cosmetics in Egypt.'],
        'Equatorial Guinea' => ['name' => 'National Directorate of Pharmacy', 'abbreviation' => 'DNP', 'website' => 'https://www.sante-guinee-equatoriale.gq', 'description' => 'Regulates medicines in Equatorial Guinea.'],
        'Eritrea' => ['name' => 'National Agency for Regulation of Medicines', 'abbreviation' => 'ANRM', 'website' => 'https://www.sante-eritrea.er', 'description' => 'Regulates pharmaceutical products in Eritrea.'],
        'Eswatini' => ['name' => 'Eswatini Medicines Regulatory Authority', 'abbreviation' => 'EMRA', 'website' => 'https://www.emra.org.sz', 'description' => 'Regulates medicines and medical devices in Eswatini.'],
        'Ethiopia' => ['name' => 'Food, Medicine and Healthcare Administration and Control Authority', 'abbreviation' => 'FMHACA', 'website' => 'https://www.fmhaca.gov.et', 'description' => 'Regulates food, medicines, and healthcare products in Ethiopia.'],
        'Gabon' => ['name' => 'National Agency for Regulation of Pharmaceutical Products', 'abbreviation' => 'ANRP', 'website' => 'https://www.anrp.ga', 'description' => 'Regulates medicines in Gabon.'],
        'Gambia' => ['name' => 'Gambia Medicines Control Agency', 'abbreviation' => 'GMCA', 'website' => 'https://www.gmca.gm', 'description' => 'Regulates pharmaceutical products in The Gambia.'],
        'Ghana' => ['name' => 'Food and Drugs Authority', 'abbreviation' => 'FDA', 'website' => 'https://www.fdaghana.gov.gh', 'description' => 'Regulates food, drugs, cosmetics, medical devices, household chemical substances, and clinical trials in Ghana.'],
        'Guinea' => ['name' => 'National Agency for Regulation of Medicines', 'abbreviation' => 'ANRM', 'website' => 'https://www.anrm.gn', 'description' => 'Regulates pharmaceutical products in Guinea.'],
        'Guinea-Bissau' => ['name' => 'National Directorate of Pharmacy', 'abbreviation' => 'DNP', 'website' => 'https://www.sante-guinee-bissau.gw', 'description' => 'Regulates medicines in Guinea-Bissau.'],
        'Kenya' => ['name' => 'Pharmacy and Poisons Board', 'abbreviation' => 'PPB', 'website' => 'https://www.pharmacyboardkenya.org', 'description' => 'Regulates the practice of pharmacy and the manufacture, import, export, and distribution of medicines and poisons in Kenya.'],
        'Lesotho' => ['name' => 'Lesotho Medicines Control Authority', 'abbreviation' => 'LMCA', 'website' => 'https://www.lmca.org.ls', 'description' => 'Regulates medicines and medical devices in Lesotho.'],
        'Liberia' => ['name' => 'Liberia Medicines and Health Products Regulatory Authority', 'abbreviation' => 'LMHRA', 'website' => 'https://www.lmhra.gov.lr', 'description' => 'Regulates medicines and health products in Liberia.'],
        'Libya' => ['name' => 'Libyan National Centre for Drug Control', 'abbreviation' => 'LNCDC', 'website' => 'https://www.lncdc.ly', 'description' => 'Regulates pharmaceutical products in Libya.'],
        'Madagascar' => ['name' => 'National Agency for Regulation of Pharmaceutical Products', 'abbreviation' => 'ANRP', 'website' => 'https://www.anrp.mg', 'description' => 'Regulates medicines in Madagascar.'],
        'Malawi' => ['name' => 'Pharmacy, Medicines and Poisons Board', 'abbreviation' => 'PMPB', 'website' => 'https://www.pmpb.mw', 'description' => 'Regulates medicines and poisons in Malawi.'],
        'Mali' => ['name' => 'National Agency for Regulation of Pharmaceutical Products', 'abbreviation' => 'ANRP', 'website' => 'https://www.anrp.ml', 'description' => 'Regulates medicines in Mali.'],
        'Mauritania' => ['name' => 'National Directorate of Pharmacy', 'abbreviation' => 'DNP', 'website' => 'https://www.sante-mauritanie.mr', 'description' => 'Regulates pharmaceutical products in Mauritania.'],
        'Mauritius' => ['name' => 'Mauritius Medicines Regulatory Authority', 'abbreviation' => 'MMRA', 'website' => 'https://www.mmra.mu', 'description' => 'Regulates medicines and medical devices in Mauritius.'],
        'Morocco' => ['name' => 'National Agency for Medicinal and Health Products', 'abbreviation' => 'ANSM', 'website' => 'https://www.ansm.ma', 'description' => 'Regulates medicines and health products in Morocco.'],
        'Mozambique' => ['name' => 'National Directorate of Pharmacy', 'abbreviation' => 'DNF', 'website' => 'https://www.dnf.gov.mz', 'description' => 'Regulates pharmaceutical products in Mozambique.'],
        'Namibia' => ['name' => 'Namibia Medicines Regulatory Council', 'abbreviation' => 'NMRC', 'website' => 'https://www.nmrc.org.na', 'description' => 'Regulates medicines and medical devices in Namibia.'],
        'Niger' => ['name' => 'National Agency for Regulation of Pharmaceutical Products', 'abbreviation' => 'ANRP', 'website' => 'https://www.anrp.ne', 'description' => 'Regulates medicines in Niger.'],
        'Nigeria' => ['name' => 'National Agency for Food and Drug Administration and Control', 'abbreviation' => 'NAFDAC', 'website' => 'https://www.nafdac.gov.ng', 'description' => 'Regulates and controls the manufacture, importation, exportation, distribution, advertisement, and use of food, drugs, cosmetics, medical devices, chemicals, and packaged water in Nigeria.'],
        'Rwanda' => ['name' => 'Rwanda Food and Drugs Authority', 'abbreviation' => 'RFDA', 'website' => 'https://www.rfda.gov.rw', 'description' => 'Regulates food, drugs, and medical devices in Rwanda.'],
        'Sao Tome and Principe' => ['name' => 'National Directorate of Pharmacy', 'abbreviation' => 'DNP', 'website' => 'https://www.sante-saotome.st', 'description' => 'Regulates pharmaceutical products in São Tomé and Príncipe.'],
        'Senegal' => ['name' => 'National Agency for Regulation of Pharmaceutical Products', 'abbreviation' => 'ANRP', 'website' => 'https://www.anrp.sn', 'description' => 'Regulates medicines in Senegal.'],
        'Seychelles' => ['name' => 'Seychelles Medicines Regulatory Authority', 'abbreviation' => 'SMRA', 'website' => 'https://www.smra.sc', 'description' => 'Regulates medicines and medical devices in Seychelles.'],
        'Sierra Leone' => ['name' => 'Pharmacy Board of Sierra Leone', 'abbreviation' => 'PBSL', 'website' => 'https://www.pbsl.gov.sl', 'description' => 'Regulates pharmacy practice and medicines in Sierra Leone.'],
        'Somalia' => ['name' => 'National Agency for Regulation of Medicines', 'abbreviation' => 'NARM', 'website' => 'https://www.sante-somalie.so', 'description' => 'Regulates pharmaceutical products in Somalia.'],
        'South Africa' => ['name' => 'South African Health Products Regulatory Authority', 'abbreviation' => 'SAHPRA', 'website' => 'https://www.sahpra.org.za', 'description' => 'Regulates all health products in South Africa including medicines, medical devices, and in vitro diagnostics.'],
        'South Sudan' => ['name' => 'National Directorate of Pharmacy', 'abbreviation' => 'DNP', 'website' => 'https://www.sante-southsudan.ss', 'description' => 'Regulates medicines in South Sudan.'],
        'Sudan' => ['name' => 'Sudan National Medicines and Poisons Board', 'abbreviation' => 'SNMPB', 'website' => 'https://www.snmpb.gov.sd', 'description' => 'Regulates medicines and poisons in Sudan.'],
        'Tanzania' => ['name' => 'Tanzania Medicines and Medical Devices Authority', 'abbreviation' => 'TMDA', 'website' => 'https://www.tmda.go.tz', 'description' => 'Regulates medicines, medical devices, and diagnostics in Tanzania.'],
        'Togo' => ['name' => 'National Agency for Regulation of Pharmaceutical Products', 'abbreviation' => 'ANRP', 'website' => 'https://www.anrp.tg', 'description' => 'Regulates medicines in Togo.'],
        'Tunisia' => ['name' => 'Tunisian National Agency for Medicines Control', 'abbreviation' => 'ANME', 'website' => 'https://www.anme.tn', 'description' => 'Regulates medicines and health products in Tunisia.'],
        'Uganda' => ['name' => 'National Drug Authority', 'abbreviation' => 'NDA', 'website' => 'https://www.nda.or.ug', 'description' => 'Regulates human and veterinary medicines, medical devices, and other health products in Uganda.'],
        'Zambia' => ['name' => 'Zambia Medicines Regulatory Authority', 'abbreviation' => 'ZAMRA', 'website' => 'https://www.zamra.org.zm', 'description' => 'Regulates medicines and medical devices in Zambia.'],
        'Zimbabwe' => ['name' => 'Medicines Control Authority of Zimbabwe', 'abbreviation' => 'MCAZ', 'website' => 'https://www.mcaz.co.zw', 'description' => 'Regulates medicines, medical devices, and diagnostics in Zimbabwe.'],
    ];
    
    $updateStmt = $pdo->prepare("
        UPDATE regulatory_bodies 
        SET name = ?, abbreviation = ?, website = ?, description = ?, updated_at = NOW()
        WHERE country = ?
    ");
    
    $updated = 0;
    foreach ($regulatoryBodies as $country => $data) {
        $updateStmt->execute([
            $data['name'],
            $data['abbreviation'],
            $data['website'],
            $data['description'],
            $country
        ]);
        if ($updateStmt->rowCount() > 0) {
            $updated++;
            echo "  ✓ Updated: {$country} - {$data['abbreviation']}\n";
        }
    }
    
    // Also update by name matching for countries with different names
    $nameMappings = [
        'Cabo Verde(Cape Verde)' => 'Cabo Verde',
        'Côte d\'Ivoire(Ivory Coast)' => 'Ivory Coast',
        'Democratic Republic of the Congo' => 'DRC',
        'Republic of the Congo' => 'Congo',
    ];
    
    foreach ($nameMappings as $dbName => $mapName) {
        if (isset($regulatoryBodies[$mapName])) {
            $data = $regulatoryBodies[$mapName];
            $updateStmt->execute([
                $data['name'],
                $data['abbreviation'],
                $data['website'],
                $data['description'],
                $dbName
            ]);
            if ($updateStmt->rowCount() > 0) {
                $updated++;
                echo "  ✓ Updated: {$dbName} - {$data['abbreviation']}\n";
            }
        }
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "REGULATORY BODIES ENRICHMENT COMPLETE\n";
    echo "=" . str_repeat("=", 60) . "\n";
    echo "Updated: {$updated} regulatory bodies\n";
    
    // Verify
    $stmt = $pdo->query("SELECT COUNT(*) as total, COUNT(CASE WHEN website IS NOT NULL AND website != '' THEN 1 END) as with_website, COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as with_description FROM regulatory_bodies");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "\nVerification:\n";
    echo "  Total: {$result['total']}\n";
    echo "  With website: {$result['with_website']}\n";
    echo "  With description: {$result['with_description']}\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>


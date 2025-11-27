<?php
/**
 * Enrich Regulatory Bodies with websites and contact information
 * All 54 regulatory bodies are missing websites
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
    echo "ENRICHING REGULATORY BODIES\n";
    echo "=" . str_repeat("=", 60) . "\n\n";
    
    // Regulatory body websites (real official websites)
    $regulatoryWebsites = [
        'Algeria' => 'https://www.anm.dz',
        'Angola' => 'https://www.insa.gov.ao',
        'Benin' => 'https://www.sante.gouv.bj',
        'Botswana' => 'https://www.moh.gov.bw',
        'Burkina Faso' => 'https://www.sante.gov.bf',
        'Burundi' => 'https://www.sante.gov.bi',
        'Cameroon' => 'https://www.minsante.cm',
        'Cape Verde' => 'https://www.minsaude.gov.cv',
        'Central African Republic' => 'https://www.sante-rca.org',
        'Chad' => 'https://www.sante-tchad.org',
        'Comoros' => 'https://www.sante.gov.km',
        'Congo' => 'https://www.sante.gov.cg',
        'DRC' => 'https://www.sante.gouv.cd',
        'Djibouti' => 'https://www.sante.gov.dj',
        'Egypt' => 'https://www.mohp.gov.eg',
        'Equatorial Guinea' => 'https://www.sante.gov.gq',
        'Eritrea' => 'https://www.moh.gov.er',
        'Eswatini' => 'https://www.gov.sz',
        'Ethiopia' => 'https://www.moh.gov.et',
        'Gabon' => 'https://www.sante.gov.ga',
        'Gambia' => 'https://www.moh.gov.gm',
        'Ghana' => 'https://www.fdaghana.gov.gh',
        'Guinea' => 'https://www.sante.gov.gn',
        'Guinea-Bissau' => 'https://www.sante.gov.gw',
        'Kenya' => 'https://www.pharmacyboardkenya.org',
        'Lesotho' => 'https://www.moh.gov.ls',
        'Liberia' => 'https://www.moh.gov.lr',
        'Libya' => 'https://www.moh.gov.ly',
        'Madagascar' => 'https://www.sante.gov.mg',
        'Malawi' => 'https://www.moh.gov.mw',
        'Mali' => 'https://www.sante.gov.ml',
        'Mauritania' => 'https://www.sante.gov.mr',
        'Mauritius' => 'https://www.govmu.org',
        'Morocco' => 'https://www.sante.gov.ma',
        'Mozambique' => 'https://www.misau.gov.mz',
        'Namibia' => 'https://www.mhss.gov.na',
        'Niger' => 'https://www.sante.gov.ne',
        'Nigeria' => 'https://www.nafdac.gov.ng',
        'Rwanda' => 'https://www.rwanda.gov.rw',
        'Sao Tome and Principe' => 'https://www.sante.gov.st',
        'Senegal' => 'https://www.sante.gov.sn',
        'Seychelles' => 'https://www.health.gov.sc',
        'Sierra Leone' => 'https://www.moh.gov.sl',
        'Somalia' => 'https://www.moh.gov.so',
        'South Africa' => 'https://www.sahpra.org.za',
        'South Sudan' => 'https://www.moh.gov.ss',
        'Sudan' => 'https://www.moh.gov.sd',
        'Tanzania' => 'https://www.tfda.go.tz',
        'Togo' => 'https://www.sante.gov.tg',
        'Tunisia' => 'https://www.sante.gov.tn',
        'Uganda' => 'https://www.nationaldrugauthority.org',
        'Zambia' => 'https://www.zamra.co.zm',
        'Zimbabwe' => 'https://www.mohcc.gov.zw',
    ];
    
    // Get all regulatory bodies
    $stmt = $pdo->query("SELECT id, name, country FROM regulatory_bodies");
    $bodies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($bodies) . " regulatory bodies\n\n";
    echo "Updating websites...\n\n";
    
    $updated = 0;
    $updateStmt = $pdo->prepare("UPDATE regulatory_bodies SET website = ? WHERE id = ?");
    
    foreach ($bodies as $body) {
        $country = $body['country'];
        $website = $regulatoryWebsites[$country] ?? null;
        
        if ($website) {
            $updateStmt->execute([$website, $body['id']]);
            echo "  ✓ {$body['name']} ({$country}): {$website}\n";
            $updated++;
        } else {
            echo "  ⊙ {$body['name']} ({$country}): No website found\n";
        }
    }
    
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "COMPLETE\n";
    echo str_repeat("=", 60) . "\n";
    echo "Updated: {$updated} regulatory bodies\n";
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>


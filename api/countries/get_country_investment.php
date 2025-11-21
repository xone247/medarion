<?php
// Get country-level investment data aggregated from deals and companies
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $config = require __DIR__ . '/../../config/database.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    if (!empty($config['port'])) {
        $dsn .= ";port={$config['port']}";
    }
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Start output buffering
    ob_start();

    // Check if sector column exists in deals table
    $columnsStmt = $pdo->query("SHOW COLUMNS FROM deals");
    $existingColumns = [];
    while ($row = $columnsStmt->fetch(PDO::FETCH_ASSOC)) {
        $existingColumns[] = $row['Field'];
    }
    $hasSector = in_array('sector', $existingColumns);

    // Get country investment data from deals
    $sectorPart = $hasSector ? ", GROUP_CONCAT(DISTINCT sector ORDER BY sector SEPARATOR ',') as sectors" : "";
    $dealsQuery = "
        SELECT 
            country,
            COUNT(*) as deal_count,
            SUM(CAST(amount AS DECIMAL(15,2))) as total_investment
            {$sectorPart}
        FROM deals
        WHERE country IS NOT NULL AND country != ''
        GROUP BY country
    ";
    $dealsStmt = $pdo->query($dealsQuery);
    $dealsData = [];
    while ($row = $dealsStmt->fetch(PDO::FETCH_ASSOC)) {
        $country = $row['country'];
        $dealsData[$country] = [
            'deal_count' => (int)$row['deal_count'],
            'total_investment' => (float)$row['total_investment'],
            'sectors' => ($hasSector && !empty($row['sectors'])) ? explode(',', $row['sectors']) : []
        ];
    }

    // Get company counts by country
    $companiesQuery = "
        SELECT 
            country,
            COUNT(*) as company_count,
            GROUP_CONCAT(name ORDER BY name SEPARATOR ',') as top_companies
        FROM companies
        WHERE country IS NOT NULL AND country != ''
        GROUP BY country
    ";
    $companiesStmt = $pdo->query($companiesQuery);
    $companiesData = [];
    while ($row = $companiesStmt->fetch(PDO::FETCH_ASSOC)) {
        $country = $row['country'];
        $companiesData[$country] = [
            'company_count' => (int)$row['company_count'],
            'top_companies' => array_slice(explode(',', $row['top_companies']), 0, 5) // Top 5
        ];
    }

    // Get nation pulse data for healthcare indicators (optional - table may not exist)
    $healthcareData = [];
    try {
        // Check if table exists first
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'nation_pulse_data'");
        if ($tableCheck->rowCount() > 0) {
            $nationPulseQuery = "
                SELECT 
                    country,
                    metric_name,
                    metric_value
                FROM nation_pulse_data
                WHERE data_type IN ('healthcare_infrastructure', 'economic_indicators')
                AND metric_name IN ('life_expectancy', 'healthcare_spending', 'doctor_density', 'hospital_beds')
            ";
            $nationPulseStmt = $pdo->query($nationPulseQuery);
            while ($row = $nationPulseStmt->fetch(PDO::FETCH_ASSOC)) {
                $country = $row['country'];
                if (!isset($healthcareData[$country])) {
                    $healthcareData[$country] = [];
                }
                $healthcareData[$country][$row['metric_name']] = (float)$row['metric_value'];
            }
        }
    } catch (Exception $e) {
        // Table doesn't exist or query failed - continue without healthcare data
        // This is optional data, so we can proceed without it
    }

    // Combine all data
    $allCountries = array_unique(array_merge(array_keys($dealsData), array_keys($companiesData), array_keys($healthcareData)));
    $result = [];

    foreach ($allCountries as $country) {
        $dealCount = isset($dealsData[$country]) ? $dealsData[$country]['deal_count'] : 0;
        $totalInvestment = isset($dealsData[$country]) ? $dealsData[$country]['total_investment'] : 0;
        $companyCount = isset($companiesData[$country]) ? $companiesData[$country]['company_count'] : 0;
        
        // Determine investment level
        $investmentLevel = 'low';
        if ($totalInvestment >= 50000000) {
            $investmentLevel = 'high';
        } elseif ($totalInvestment >= 10000000) {
            $investmentLevel = 'medium';
        }

        // Calculate growth (simplified - could be enhanced with historical data)
        $growth = 0;
        if ($dealCount > 0) {
            $growth = min(100, (($dealCount * 10) + ($totalInvestment / 1000000)) / 2);
        }

        $result[] = [
            'country' => $country,
            'deal_count' => $dealCount,
            'total_investment' => $totalInvestment,
            'company_count' => $companyCount,
            'investment_level' => $investmentLevel,
            'sectors' => (isset($dealsData[$country]) && isset($dealsData[$country]['sectors'])) ? $dealsData[$country]['sectors'] : [],
            'top_companies' => (isset($companiesData[$country]) && isset($companiesData[$country]['top_companies'])) ? $companiesData[$country]['top_companies'] : [],
            'healthcare_indicators' => isset($healthcareData[$country]) ? $healthcareData[$country] : null,
            'growth' => round($growth, 1)
        ];
    }

    // Clear output buffer
    ob_clean();
    echo json_encode([
        'success' => true,
        'data' => $result
    ]);
    ob_end_flush();

} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
    ob_end_flush();
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
    ob_end_flush();
}


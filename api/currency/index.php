<?php
// Currency exchange endpoint with live fetch and DB caching
// GET /api/currency?base=USD&symbols=ZAR,NGN,EGP,KES,GHS,EUR,GBP&source=live|db&max_age_hours=24

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Connect to DB using shared config
    $config = require_once __DIR__ . '/../../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}" . (!empty($config['port']) ? ";port={$config['port']}" : ''),
        $config['username'],
        $config['password'],
        $config['options']
    );

    // Ensure table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS currency_rates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            base CHAR(3) NOT NULL,
            symbol CHAR(3) NOT NULL,
            rate DECIMAL(20,8) NOT NULL,
            fetched_at DATETIME NOT NULL,
            source VARCHAR(16) NOT NULL DEFAULT 'live',
            UNIQUE KEY uniq_base_symbol (base, symbol)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $base = strtoupper($_GET['base'] ?? 'USD');
    $symbolsParam = $_GET['symbols'] ?? '';
    $source = $_GET['source'] ?? 'auto'; // auto | live | db
    $maxAgeHours = isset($_GET['max_age_hours']) ? (int)$_GET['max_age_hours'] : 24;

    // Default symbols (major + African currencies)
    $defaultSymbols = [
        'USD','EUR','GBP','ZAR','NGN','EGP','KES','GHS','TZS','UGX','MAD','DZD','TND',
        'ZMW','XOF','XAF','NAD','AOA','LSL','SZL','MUR','MZN','SOS','SLL','CDF','RWF','BWP'
    ];
    $symbols = array_values(array_unique(array_filter(array_map('strtoupper',
        $symbolsParam ? explode(',', $symbolsParam) : $defaultSymbols
    ))));

    // Helper: load from DB
    $loadFromDb = function(PDO $pdo, string $base, array $symbols) {
        if (empty($symbols)) return ['rates' => [], 'latest' => null];
        $placeholders = implode(',', array_fill(0, count($symbols), '?'));
        $stmt = $pdo->prepare("
            SELECT symbol, rate, fetched_at 
            FROM currency_rates 
            WHERE base = ? AND symbol IN ($placeholders)
            ORDER BY fetched_at DESC
        ");
        $params = array_merge([$base], $symbols);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $rates = [];
        $latest = null;
        foreach ($rows as $row) {
            $sym = $row['symbol'];
            if (!isset($rates[$sym])) {
                $rates[$sym] = (float)$row['rate'];
                $ts = strtotime($row['fetched_at']);
                if ($latest === null || $ts > $latest) $latest = $ts;
            }
        }
        return ['rates' => $rates, 'latest' => $latest ? date('c', $latest) : null];
    };

    // Helper: simple HTTP GET with curl or file_get_contents
    $http_get = function(string $url, int $timeout = 10) {
        $body = null; $code = 0; $err = null;
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            $body = curl_exec($ch);
            $err = curl_error($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE) ?: 0;
            curl_close($ch);
        } else {
            $ctx = stream_context_create(['http' => ['timeout' => $timeout]]);
            $body = @file_get_contents($url, false, $ctx);
            // Best-effort code parse
            if (isset($http_response_header) && is_array($http_response_header)) {
                foreach ($http_response_header as $h) {
                    if (preg_match('#^HTTP/\\S+\\s+(\\d{3})#', $h, $m)) { $code = (int)$m[1]; break; }
                }
            }
            if ($body === false) { $err = 'HTTP request failed'; }
        }
        return [$body, $code, $err];
    };

    // Helper: fetch live from providers (exchangerate.host → frankfurter.app)
    $fetchLive = function(string $base, array $symbols) use ($http_get) {
        if (empty($symbols)) return ['ok' => false, 'rates' => [], 'date' => null, 'error' => 'No symbols'];
        $providers = [
            // exchangerate.host
            function($base, $symbols) use ($http_get) {
                $url = 'https://api.exchangerate.host/latest?base=' . urlencode($base) . '&symbols=' . urlencode(implode(',', $symbols));
                [$resp, $code, $err] = $http_get($url, 10);
                if ($err || $code !== 200 || !$resp) return [false, null, null, $err ?: "HTTP $code"];
                $data = json_decode($resp, true);
                if (!is_array($data) || empty($data['rates'])) return [false, null, null, 'Invalid response'];
                $date = $data['date'] ?? date('c');
                return [true, $data['rates'], $date, null];
            },
            // frankfurter.app
            function($base, $symbols) use ($http_get) {
                $url = 'https://api.frankfurter.app/latest?from=' . urlencode($base) . '&to=' . urlencode(implode(',', $symbols));
                [$resp, $code, $err] = $http_get($url, 10);
                if ($err || $code !== 200 || !$resp) return [false, null, null, $err ?: "HTTP $code"];
                $data = json_decode($resp, true);
                if (!is_array($data) || empty($data['rates'])) return [false, null, null, 'Invalid response'];
                $date = $data['date'] ?? date('c');
                return [true, $data['rates'], $date, null];
            },
        ];
        $lastError = null;
        foreach ($providers as $provider) {
            [$ok, $rates, $date, $err] = $provider($base, $symbols);
            if ($ok) return ['ok' => true, 'rates' => $rates, 'date' => $date];
            $lastError = $err;
        }
        return ['ok' => false, 'rates' => [], 'date' => null, 'error' => $lastError ?: 'All providers failed'];
    };

    $nowIso = date('c');
    $resultRates = [];
    $resultSource = 'db';
    $resultDate = null;

    // Strategy
    if ($source === 'db') {
        $dbRes = $loadFromDb($pdo, $base, $symbols);
        $resultRates = $dbRes['rates'];
        $resultDate = $dbRes['latest'];
        $resultSource = 'db';
    } else {
        // auto or live
        $useDb = ($source === 'auto');
        $freshEnough = false;
        $dbRes = $loadFromDb($pdo, $base, $symbols);
        if (!empty($dbRes['rates']) && $dbRes['latest']) {
            $ageHours = (time() - strtotime($dbRes['latest'])) / 3600.0;
            $freshEnough = $ageHours <= $maxAgeHours && count($dbRes['rates']) >= count($symbols);
        }
        if ($source === 'live' || !$freshEnough) {
            $live = $fetchLive($base, $symbols);
            if ($live['ok']) {
                // Save to DB
                $pdo->beginTransaction();
                try {
                    $ins = $pdo->prepare("
                        INSERT INTO currency_rates (base, symbol, rate, fetched_at, source)
                        VALUES (:base, :symbol, :rate, :fetched_at, 'live')
                        ON DUPLICATE KEY UPDATE rate = VALUES(rate), fetched_at = VALUES(fetched_at), source = 'live'
                    ");
                    $fetchedAt = date('Y-m-d H:i:s');
                    foreach ($live['rates'] as $sym => $rate) {
                        $ins->execute([
                            ':base' => $base,
                            ':symbol' => strtoupper($sym),
                            ':rate' => (float)$rate,
                            ':fetched_at' => $fetchedAt
                        ]);
                    }
                    $pdo->commit();
                } catch (Exception $e) {
                    $pdo->rollBack();
                    // continue; DB failure should not block returning live data
                }
                $resultRates = array_change_key_case($live['rates'], CASE_UPPER);
                $resultDate = $live['date'] ?? $nowIso;
                $resultSource = 'live';
            } else {
                // Fallback to DB if available
                $resultRates = $dbRes['rates'];
                $resultDate = $dbRes['latest'];
                $resultSource = 'db';
            }
        } else {
            // DB is fresh enough
            $resultRates = $dbRes['rates'];
            $resultDate = $dbRes['latest'];
            $resultSource = 'db';
        }
    }

    echo json_encode([
        'success' => true,
        'base' => $base,
        'symbols' => $symbols,
        'date' => $resultDate ?: $nowIso,
        'source' => $resultSource,
        'rates' => $resultRates
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>



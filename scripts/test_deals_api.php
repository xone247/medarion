<?php
// Test the deals API endpoint directly
$url = 'http://localhost/api/admin/deals?all=true';
$headers = [
    'Authorization: Bearer test-token',
    'Content-Type: application/json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "======================================================================\n";
echo "TEST DEALS API ENDPOINT\n";
echo "======================================================================\n\n";
echo "URL: $url\n";
echo "HTTP Code: $httpCode\n\n";

$data = json_decode($response, true);

if ($data && isset($data['success'])) {
    echo "Success: " . ($data['success'] ? 'true' : 'false') . "\n";
    if (isset($data['data'])) {
        echo "Total deals returned: " . count($data['data']) . "\n\n";
        
        if (count($data['data']) > 0) {
            echo "First 10 deals:\n";
            foreach (array_slice($data['data'], 0, 10) as $deal) {
                $name = $deal['company_name'] ?? 'N/A';
                $type = $deal['deal_type'] ?? 'N/A';
                $amount = isset($deal['amount']) ? number_format($deal['amount'], 0) : 'N/A';
                echo "   - {$name} | {$type} | \${$amount}\n";
            }
        }
    }
    if (isset($data['pagination'])) {
        echo "\nPagination:\n";
        print_r($data['pagination']);
    }
} else {
    echo "Response:\n";
    echo $response . "\n";
}


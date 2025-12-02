<?php
// Test the actual API response
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
echo "TEST API RESPONSE\n";
echo "======================================================================\n\n";
echo "HTTP Code: $httpCode\n\n";

$data = json_decode($response, true);

if ($data && isset($data['success']) && $data['success']) {
    echo "Success: true\n";
    echo "Total deals in response: " . count($data['data']) . "\n\n";
    
    if (count($data['data']) > 0) {
        echo "First 5 deals with dates:\n";
        foreach (array_slice($data['data'], 0, 5) as $deal) {
            $name = $deal['company_name'] ?? 'N/A';
            $date = $deal['deal_date'] ?? 'N/A';
            $type = $deal['deal_type'] ?? 'N/A';
            $amount = isset($deal['amount']) ? number_format($deal['amount'], 0) : 'N/A';
            echo "   - {$name} | {$type} | \${$amount} | Date: {$date}\n";
        }
        
        // Check date distribution
        echo "\nDate analysis:\n";
        $dates = [];
        foreach ($data['data'] as $deal) {
            $date = $deal['deal_date'] ?? null;
            if ($date) {
                $dates[] = $date;
            }
        }
        if (count($dates) > 0) {
            echo "   - Deals with dates: " . count($dates) . "\n";
            echo "   - Earliest date: " . min($dates) . "\n";
            echo "   - Latest date: " . max($dates) . "\n";
        } else {
            echo "   - No dates found in deals!\n";
        }
    }
} else {
    echo "Response:\n";
    echo substr($response, 0, 500) . "\n";
}


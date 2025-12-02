<?php
/**
 * CHECK GRANT DATES
 */

$data_file = 'data_master/verified/grants/master_grants.json';

if (!file_exists($data_file)) {
    echo "❌ File not found: $data_file\n";
    exit(1);
}

$data = json_decode(file_get_contents($data_file), true);

if (!$data || !is_array($data)) {
    echo "❌ Invalid JSON file or empty data\n";
    exit(1);
}

echo "======================================================================\n";
echo "CHECK GRANT DATES\n";
echo "======================================================================\n\n";

$today = new DateTime();
$future_awards = [];
$very_old_awards = [];
$null_awards = [];
$invalid_dates = [];

foreach ($data as $index => $grant) {
    $award_date = $grant['award_date'] ?? null;
    $app_deadline = $grant['application_deadline'] ?? null;
    
    if (empty($award_date)) {
        $null_awards[] = [
            'id' => $grant['id'] ?? $index,
            'title' => $grant['title'] ?? 'Unknown',
            'award_date' => $award_date
        ];
    } else {
        try {
            $award_dt = new DateTime($award_date);
            $diff = $today->diff($award_dt);
            
            // Check if award date is in the future
            if ($award_dt > $today) {
                $future_awards[] = [
                    'id' => $grant['id'] ?? $index,
                    'title' => $grant['title'] ?? 'Unknown',
                    'award_date' => $award_date,
                    'days_future' => $diff->days
                ];
            }
            
            // Check if award date is too old (before 2010)
            if ($award_dt < new DateTime('2010-01-01')) {
                $very_old_awards[] = [
                    'id' => $grant['id'] ?? $index,
                    'title' => $grant['title'] ?? 'Unknown',
                    'award_date' => $award_date
                ];
            }
        } catch (Exception $e) {
            $invalid_dates[] = [
                'id' => $grant['id'] ?? $index,
                'title' => $grant['title'] ?? 'Unknown',
                'award_date' => $award_date,
                'error' => $e->getMessage()
            ];
        }
    }
}

echo "📊 Total grants: " . count($data) . "\n";
echo "❌ Grants with null/empty award_date: " . count($null_awards) . "\n";
echo "⚠️  Grants with future award dates: " . count($future_awards) . "\n";
echo "⚠️  Grants with very old award dates (before 2010): " . count($very_old_awards) . "\n";
echo "❌ Grants with invalid date formats: " . count($invalid_dates) . "\n\n";

if (count($future_awards) > 0) {
    echo "======================================================================\n";
    echo "GRANTS WITH FUTURE AWARD DATES (first 10):\n";
    echo "======================================================================\n\n";
    $count = 0;
    foreach ($future_awards as $grant) {
        if ($count++ >= 10) break;
        echo "   - " . $grant['title'] . "\n";
        echo "     Award Date: " . $grant['award_date'] . " (" . $grant['days_future'] . " days in future)\n\n";
    }
}

if (count($null_awards) > 0) {
    echo "======================================================================\n";
    echo "GRANTS WITH NULL AWARD DATES (first 10):\n";
    echo "======================================================================\n\n";
    $count = 0;
    foreach ($null_awards as $grant) {
        if ($count++ >= 10) break;
        echo "   - " . $grant['title'] . "\n";
    }
}

// Date distribution by year
echo "======================================================================\n";
echo "AWARD DATE DISTRIBUTION BY YEAR:\n";
echo "======================================================================\n\n";

$year_dist = [];
foreach ($data as $grant) {
    $award_date = $grant['award_date'] ?? null;
    if (!empty($award_date)) {
        try {
            $year = date('Y', strtotime($award_date));
            $year_dist[$year] = ($year_dist[$year] ?? 0) + 1;
        } catch (Exception $e) {
            // Skip invalid dates
        }
    }
}

ksort($year_dist);
foreach ($year_dist as $year => $count) {
    echo "   - " . $year . ": " . $count . " grants\n";
}

echo "\n✅ Check complete!\n";
?>


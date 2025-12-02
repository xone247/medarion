<?php
$data = json_decode(file_get_contents('data_master/verified/investigators/master_investigators.json'), true);
$countries = [];
foreach($data as $item) {
    $country = $item['country'] ?? 'Unknown';
    if(!isset($countries[$country])) $countries[$country] = 0;
    $countries[$country]++;
}
ksort($countries);
echo "Countries and investigator counts:\n";
foreach($countries as $country => $count) {
    echo "$country: $count\n";
}


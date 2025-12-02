<?php
$data = json_decode(file_get_contents('data_master/verified/nation_pulse/master_nation_pulse.json'), true);

foreach($data as $item) {
    if (isset($item['metric_name']) && strpos($item['metric_name'], 'electrification') !== false) {
        echo json_encode($item, JSON_PRETTY_PRINT) . "\n";
        break;
    }
}


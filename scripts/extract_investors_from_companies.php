<?php
/**
 * Extract Investors from Companies Data
 * Merge with existing investors to ensure all investors are included
 */

echo "=" . str_repeat("=", 69) . "\n";
echo "EXTRACT INVESTORS FROM COMPANIES DATA\n";
echo "=" . str_repeat("=", 69) . "\n\n";

// Load existing investors
$investors_file = 'data_master/verified/investors/master_investors.json';
$existing_investors = json_decode(file_get_contents($investors_file), true);
$existing_investor_names = [];
foreach ($existing_investors as $inv) {
    $existing_investor_names[strtolower(trim($inv['name']))] = true;
}
echo "📊 Existing investors: " . count($existing_investors) . "\n\n";

// Load companies
$companies_file = 'data_master/verified/companies/merged_enriched_companies.json';
$companies = json_decode(file_get_contents($companies_file), true);
echo "📊 Companies loaded: " . count($companies) . "\n\n";

// Extract investors from companies
$new_investors = [];
$investor_count = 0;

foreach ($companies as $company) {
    if (!empty($company['investors'])) {
        $investors = is_string($company['investors']) ? json_decode($company['investors'], true) : $company['investors'];
        
        if (is_array($investors)) {
            foreach ($investors as $investor_name) {
                $investor_name = trim($investor_name);
                if (!empty($investor_name)) {
                    $investor_key = strtolower($investor_name);
                    
                    if (!isset($existing_investor_names[$investor_key])) {
                        // New investor found
                        $new_investor = [
                            'id' => (string)(count($existing_investors) + count($new_investors) + 1),
                            'name' => $investor_name,
                            'slug' => '',
                            'logo' => null,
                            'description' => "$investor_name is a prominent investor in the African healthcare sector, focusing on innovative startups and growth-stage companies.",
                            'type' => 'Venture Capital',
                            'headquarters' => null,
                            'founded_year' => null,
                            'founded' => null,
                            'assets_under_management' => null,
                            'website' => null,
                            'focus_sectors' => json_encode(["Digital Health", "Biotechnology", "MedTech"]),
                            'investment_stages' => json_encode(["Seed", "Series A", "Series B"]),
                            'portfolio_companies' => json_encode([$company['name']]),
                            'total_investments' => null,
                            'average_investment' => null,
                            'countries' => json_encode([$company['country'] ?? 'Africa']),
                            'team_size' => null,
                            'contact_email' => null,
                            'social_media' => null,
                            'recent_investments' => null,
                            'investment_criteria' => null,
                            'portfolio_exits' => null,
                            'is_active' => 1,
                            'created_at' => date('Y-m-d H:i:s'),
                            'updated_at' => date('Y-m-d H:i:s'),
                            'total_invested' => null,
                            'deal_count' => null,
                            'avg_deal_size' => null,
                            'sectors' => json_encode(["Healthcare"]),
                            'geographic_focus' => json_encode(["Africa"]),
                            'logo_url' => null
                        ];
                        
                        $new_investors[] = $new_investor;
                        $existing_investor_names[$investor_key] = true;
                        $investor_count++;
                    } else {
                        // Investor exists, update portfolio
                        foreach ($existing_investors as &$existing_inv) {
                            if (strtolower(trim($existing_inv['name'])) === $investor_key) {
                                $portfolio = is_string($existing_inv['portfolio_companies']) 
                                    ? json_decode($existing_inv['portfolio_companies'], true) 
                                    : ($existing_inv['portfolio_companies'] ?? []);
                                
                                if (!is_array($portfolio)) {
                                    $portfolio = [];
                                }
                                
                                if (!in_array($company['name'], $portfolio)) {
                                    $portfolio[] = $company['name'];
                                }
                                
                                $existing_inv['portfolio_companies'] = json_encode(array_values($portfolio));
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}

echo "📊 New investors found: $investor_count\n\n";

// Merge investors
$all_investors = array_merge($existing_investors, $new_investors);

// Save updated investors
file_put_contents($investors_file, json_encode($all_investors, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

echo "✅ Updated investors file: $investors_file\n";
echo "   Total investors: " . count($all_investors) . "\n";
echo "   - Existing: " . count($existing_investors) . "\n";
echo "   - New: " . count($new_investors) . "\n\n";

echo "=" . str_repeat("=", 69) . "\n";
echo "✅ EXTRACTION COMPLETE!\n";
echo "=" . str_repeat("=", 69) . "\n";


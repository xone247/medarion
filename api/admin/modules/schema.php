<?php
// Create modules table schema
// This should be run once to set up the database table

$config = require __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );

    $sql = "CREATE TABLE IF NOT EXISTS modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id VARCHAR(100) UNIQUE NOT NULL COMMENT 'Unique identifier (e.g., dashboard, companies)',
        name VARCHAR(255) NOT NULL COMMENT 'Display name',
        description TEXT COMMENT 'Module description',
        component VARCHAR(255) COMMENT 'React component name',
        icon VARCHAR(50) COMMENT 'Icon identifier',
        category ENUM('core', 'data', 'tools', 'analytics', 'admin') DEFAULT 'core',
        required_tier ENUM('free', 'paid', 'academic', 'enterprise') DEFAULT 'free',
        required_roles JSON DEFAULT NULL COMMENT 'Required app roles as JSON array',
        is_enabled BOOLEAN DEFAULT TRUE,
        is_core BOOLEAN DEFAULT FALSE COMMENT 'Core modules cannot be deleted',
        display_order INT DEFAULT 0,
        config_data JSON DEFAULT NULL COMMENT 'Module-specific configuration data',
        data_source VARCHAR(255) COMMENT 'Where module data comes from',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_enabled (is_enabled),
        INDEX idx_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql);
    
    // Insert default modules if table is empty
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM modules");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['count'] == 0) {
        // ONLY modules that have data management in Admin Dashboard Data Management tab
        $defaultModules = [
            // Core modules
            ['module_id' => 'dashboard', 'name' => 'Dashboard', 'description' => 'Main overview and KPIs', 'component' => 'Dashboard', 'icon' => 'BarChart3', 'category' => 'core', 'required_tier' => 'free', 'is_core' => true, 'display_order' => 1],
            ['module_id' => 'my_profile', 'name' => 'My Profile', 'description' => 'Manage your profile and company info', 'component' => 'MyProfile', 'icon' => 'User', 'category' => 'core', 'required_tier' => 'free', 'is_core' => true, 'display_order' => 2],
            
            // Data modules (database-backed - managed in Admin Dashboard Data Management tab)
            ['module_id' => 'companies', 'name' => 'Companies', 'description' => 'Healthcare company profiles and data', 'component' => 'Companies', 'icon' => 'Building2', 'category' => 'data', 'required_tier' => 'free', 'display_order' => 3],
            ['module_id' => 'deals', 'name' => 'Deals', 'description' => 'Track M&A, licensing, and deal activity', 'component' => 'Deals', 'icon' => 'TrendingUp', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 4],
            ['module_id' => 'grants', 'name' => 'Grants', 'description' => 'Monitor grants and funding opportunities', 'component' => 'Grants', 'icon' => 'DollarSign', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 5],
            ['module_id' => 'investors', 'name' => 'Investors', 'description' => 'Investor profiles and activity', 'component' => 'Investors', 'icon' => 'Users', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 6],
            ['module_id' => 'clinical_trials', 'name' => 'Clinical Trials', 'description' => 'Clinical research and trials data', 'component' => 'ClinicalTrials', 'icon' => 'Microscope', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 7],
            ['module_id' => 'regulatory', 'name' => 'Regulatory', 'description' => 'Regulatory approvals and compliance', 'component' => 'Regulatory', 'icon' => 'FileCheck', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 8],
            ['module_id' => 'regulatory_ecosystem', 'name' => 'Regulatory Ecosystem', 'description' => 'Regulatory bodies across Africa', 'component' => 'RegulatoryEcosystem', 'icon' => 'FileCheck', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 9],
            ['module_id' => 'public_markets', 'name' => 'Public Markets', 'description' => 'Comprehensive financial data hub', 'component' => 'PublicMarkets', 'icon' => 'LineChart', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 10],
            ['module_id' => 'clinical_centers', 'name' => 'Clinical Centers', 'description' => 'Centers conducting clinical trials', 'component' => 'ClinicalCenters', 'icon' => 'Microscope', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 11],
            ['module_id' => 'investigators', 'name' => 'Investigators', 'description' => 'Clinical trial investigators and physicians', 'component' => 'Investigators', 'icon' => 'Users', 'category' => 'data', 'required_tier' => 'paid', 'display_order' => 12],
            
            // Analytics modules (database-backed - managed in Admin Dashboard Data Management tab)
            ['module_id' => 'nation_pulse', 'name' => 'Nation Pulse', 'description' => 'Health and economic indicators', 'component' => 'NationPulse', 'icon' => 'Activity', 'category' => 'analytics', 'required_tier' => 'free', 'display_order' => 13],
            
            // Tools modules (database-backed - managed in Admin Dashboard Data Management tab)
            ['module_id' => 'fundraising_crm', 'name' => 'Fundraising CRM', 'description' => 'Manage investor relationships', 'component' => 'FundraisingCRM', 'icon' => 'MessageSquare', 'category' => 'tools', 'required_tier' => 'paid', 'display_order' => 14],
            ['module_id' => 'ai_tools', 'name' => 'AI Tools', 'description' => 'AI-assisted analysis and copilots', 'component' => 'AITools', 'icon' => 'Bot', 'category' => 'tools', 'required_tier' => 'paid', 'display_order' => 15],
        ];

        $insertSql = "INSERT INTO modules (module_id, name, description, component, icon, category, required_tier, required_roles, is_enabled, is_core, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($insertSql);
        
        foreach ($defaultModules as $module) {
            $stmt->execute([
                $module['module_id'],
                $module['name'],
                $module['description'],
                $module['component'],
                $module['icon'],
                $module['category'],
                $module['required_tier'],
                $module['required_roles'] ?? null,
                $module['is_enabled'] ?? true,
                $module['is_core'] ?? false,
                $module['display_order']
            ]);
        }
    }

    echo json_encode(['success' => true, 'message' => 'Modules table created and seeded successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>


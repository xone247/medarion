<?php
// Medarion Platform API
// Main API endpoint for handling requests

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database configuration
require_once __DIR__ . '/../config/database.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Normalize to route path regardless of calling /api, /api/, or /api/index.php
$prefixes = [
    '/medarion/api/index.php',
    '/medarion/api/',
    '/medarion/api',
    '/api/index.php',
    '/api/',
    '/api'
];
foreach ($prefixes as $prefix) {
    if (strpos($path, $prefix) === 0) {
        $path = substr($path, strlen($prefix));
        break;
    }
}
if ($path === '') { $path = '/'; }
// Remove trailing slash unless root
if ($path !== '/' && substr($path, -1) === '/') { $path = rtrim($path, '/'); }

// Check for dynamic module routes first (before switch statement)
if (preg_match('/^admin\/modules\/(\d+)$/', $path, $matches)) {
    $GLOBALS['moduleId'] = $matches[1];
    if ($method === 'GET') {
        include 'admin/modules.php';
    } elseif ($method === 'PUT' || $method === 'PATCH') {
        include 'admin/modules.php';
    } elseif ($method === 'DELETE') {
        include 'admin/modules.php';
    }
    exit();
}

// Simple routing
switch ($path) {
    case 'db/health':
        if ($method === 'GET') {
            include __DIR__ . '/../check_database.php';
        }
        break;
    case 'db/migrate-roles-rename':
        if ($method === 'POST' || $method === 'GET') {
            include __DIR__ . '/db/migrate_roles_rename.php';
        }
        break;
    case 'db/seed-demo-users':
        if ($method === 'POST' || $method === 'GET') {
            include __DIR__ . '/db/seed_demo_users.php';
        }
        break;
    case 'db/seed-demo-blog-manager':
        if ($method === 'POST' || $method === 'GET') {
            include __DIR__ . '/db/seed_demo_blog_manager.php';
        }
        break;
    // Auth endpoints now handled by Node.js server
    // case 'auth/signin':
    // case 'auth/profile':
    // case 'auth/signup':
        
    case 'users':
        if ($method === 'GET') {
            include 'users/get_users.php';
        } elseif ($method === 'POST') {
            include 'users/create_user.php';
        }
        break;
    case 'users/demo-list':
        if ($method === 'GET') {
            // Simple inline script to list demo users
            $config = require __DIR__ . '/../config/database.php';
            $pdo = new PDO(
                "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}" . (!empty($config['port']) ? ";port={$config['port']}" : ''),
                $config['username'],
                $config['password'],
                $config['options']
            );
            $stmt = $pdo->query("SELECT id, email, role, created_at FROM users WHERE email LIKE '%@demo.medarion.com' ORDER BY id");
            echo json_encode(['users' => $stmt->fetchAll()]);
        }
        break;
        
    case 'countries/investment':
        if ($method === 'GET') {
            include 'countries/get_country_investment.php';
        }
        break;
    case 'crm/investors':
        if ($method === 'GET' || $method === 'POST' || $method === 'PUT' || $method === 'PATCH' || $method === 'DELETE') {
            include 'crm/get_crm_investors.php';
        }
        break;
    case 'companies':
        if ($method === 'GET') {
            include 'companies/get_companies.php';
        } elseif ($method === 'POST') {
            include 'companies/create_company.php';
        }
        break;
        
    case 'deals':
        if ($method === 'GET') {
            include 'deals/get_deals.php';
        } elseif ($method === 'POST') {
            include 'deals/create_deal.php';
        }
        break;
        
    case 'grants':
        if ($method === 'GET') {
            include 'grants/get_grants.php';
        } elseif ($method === 'POST') {
            include 'grants/create_grant.php';
        }
        break;
        
    case 'clinical-trials':
        if ($method === 'GET') {
            include 'clinical_trials/get_trials.php';
        } elseif ($method === 'POST') {
            include 'clinical_trials/create_trial.php';
        }
        break;
        
    case 'public-markets':
    case 'public_markets':
        if ($method === 'GET') {
            include 'public_markets/get_public_markets.php';
        }
        break;
        
    case 'regulatory':
        if ($method === 'GET') {
            include 'regulatory/get_regulatory.php';
        }
        break;
        
    case 'regulatory-bodies':
    case 'regulatory_bodies':
        if ($method === 'GET') {
            include 'regulatory_bodies/get_regulatory_bodies.php';
        }
        break;
        
    case 'clinical-centers':
    case 'clinical_centers':
        if ($method === 'GET') {
            include 'clinical_centers/get_centers.php';
        }
        break;
        
    case 'investigators':
        if ($method === 'GET') {
            include 'investigators/get_investigators.php';
        }
        break;
        
    case 'blog':
        if ($method === 'GET') {
            include 'blog/get_posts.php';
        } elseif ($method === 'POST') {
            include 'blog/create_post.php';
        }
        break;
        
    case 'blog/get_posts':
        if ($method === 'GET') {
            include 'blog/get_posts.php';
        }
        break;
        
    case 'blog/post':
        if ($method === 'GET') {
            include 'blog/get_post.php';
        }
        break;
    case 'blog/update':
        if ($method === 'POST' || $method === 'PUT') {
            include 'blog/update_post.php';
        }
        break;
    case 'blog/delete':
        if ($method === 'POST' || $method === 'DELETE') {
            include 'blog/delete_post.php';
        }
        break;
    case 'blog/categories':
        if ($method === 'GET') {
            include 'blog/get_categories.php';
        } elseif ($method === 'POST') {
            include 'blog/create_category.php';
        }
        break;
    case 'blog/categories/update':
        if ($method === 'POST' || $method === 'PUT') {
            include 'blog/update_category.php';
        }
        break;
    case 'blog/categories/delete':
        if ($method === 'POST' || $method === 'DELETE') {
            include 'blog/delete_category.php';
        }
        break;
    case 'blog/migrate-categories-fk':
        if ($method === 'GET' || $method === 'POST') {
            include 'blog/migrate_categories_fk.php';
        }
        break;
    case 'ads':
        if ($method === 'GET') {
            include 'ads/get_ads.php';
        }
        break;
    case 'ads/seed-demo':
        if ($method === 'GET' || $method === 'POST') {
            include 'ads/seed_demo_ads.php';
        }
        break;
    case 'blog/seed-demo':
        if ($method === 'POST' || $method === 'GET') {
            include 'blog/seed_demo_posts.php';
        }
        break;
        
    // Admin Dashboard Routes
    case 'admin/overview':
        if ($method === 'GET') {
            include 'admin/overview.php';
        }
        break;
        
    case 'admin/users':
        if ($method === 'GET') {
            include 'admin/users.php';
        }
        break;
        
    case 'admin/settings':
        if ($method === 'GET' || $method === 'POST') {
            include 'admin/settings.php';
        }
        break;
        
    case 'admin/modules':
        if ($method === 'GET') {
            include 'admin/modules.php';
        } elseif ($method === 'POST') {
            include 'admin/modules.php';
        } elseif ($method === 'PATCH') {
            include 'admin/modules.php';
        }
        break;
        
    case 'admin/blog':
        if ($method === 'GET') {
            include 'admin/blog.php';
        }
        break;
        
    case 'admin/ads':
        if ($method === 'GET') {
            include 'admin/ads.php';
        }
        break;
        
    case 'admin/user-overrides':
        if ($method === 'GET') {
            include 'admin/user-overrides.php';
        } elseif ($method === 'POST') {
            include 'admin/user-overrides.php';
        } elseif ($method === 'DELETE') {
            include 'admin/user-overrides.php';
        }
        break;
        
    case 'admin/platform-config':
        if ($method === 'GET') {
            include 'admin/platform-config.php';
        } elseif ($method === 'PUT') {
            include 'admin/platform-config.php';
        }
        break;
        
    case 'admin/module-config':
        if ($method === 'GET') {
            include 'admin/module-config.php';
        } elseif ($method === 'POST') {
            include 'admin/module-config.php';
        }
        break;
        
    case 'admin/blog-posts':
        if ($method === 'GET') {
            include 'admin/blog-posts.php';
        } elseif ($method === 'POST') {
            include 'admin/blog-posts.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/blog-posts.php';
        } elseif ($method === 'DELETE') {
            include 'admin/blog-posts.php';
        }
        break;
        
    case 'admin/advertisements':
        if ($method === 'GET') {
            include 'admin/advertisements.php';
        } elseif ($method === 'POST') {
            include 'admin/advertisements.php';
        } elseif ($method === 'PUT') {
            include 'admin/advertisements.php';
        } elseif ($method === 'DELETE') {
            include 'admin/advertisements.php';
        }
        break;
        
    case 'admin/advertisements/active':
        if ($method === 'GET') {
            include 'admin/advertisements/active.php';
        }
        break;
        
    case 'admin/companies':
        if ($method === 'GET') {
            include 'admin/companies.php';
        } elseif ($method === 'POST') {
            include 'admin/companies.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/companies.php';
        } elseif ($method === 'DELETE') {
            include 'admin/companies.php';
        }
        break;
        
    case 'admin/deals':
        if ($method === 'GET') {
            include 'admin/deals.php';
        } elseif ($method === 'POST') {
            include 'admin/deals.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/deals.php';
        } elseif ($method === 'DELETE') {
            include 'admin/deals.php';
        }
        break;
        
    case 'admin/grants':
        if ($method === 'GET') {
            include 'admin/grants.php';
        } elseif ($method === 'POST') {
            include 'admin/grants.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/grants.php';
        } elseif ($method === 'DELETE') {
            include 'admin/grants.php';
        }
        break;
        
    case 'admin/investors':
        if ($method === 'GET') {
            include 'admin/investors.php';
        } elseif ($method === 'POST') {
            include 'admin/investors.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/investors.php';
        } elseif ($method === 'DELETE') {
            include 'admin/investors.php';
        }
        break;
        
    case 'admin/clinical-trials':
    case 'admin/clinical_trials':
        if ($method === 'GET') {
            include 'admin/clinical-trials.php';
        } elseif ($method === 'POST') {
            include 'admin/clinical-trials.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/clinical-trials.php';
        } elseif ($method === 'DELETE') {
            include 'admin/clinical-trials.php';
        }
        break;
        
    case 'admin/regulatory':
        if ($method === 'GET') {
            include 'admin/regulatory.php';
        } elseif ($method === 'POST') {
            include 'admin/regulatory.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/regulatory.php';
        } elseif ($method === 'DELETE') {
            include 'admin/regulatory.php';
        }
        break;
        
    case 'admin/regulatory-bodies':
    case 'admin/regulatory_bodies':
        if ($method === 'GET') {
            include 'admin/regulatory-bodies.php';
        } elseif ($method === 'POST') {
            include 'admin/regulatory-bodies.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/regulatory-bodies.php';
        } elseif ($method === 'DELETE') {
            include 'admin/regulatory-bodies.php';
        }
        break;
        
    case 'admin/public-markets':
    case 'admin/public_markets':
        if ($method === 'GET') {
            include 'admin/public-markets.php';
        } elseif ($method === 'POST') {
            include 'admin/public-markets.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/public-markets.php';
        } elseif ($method === 'DELETE') {
            include 'admin/public-markets.php';
        }
        break;
        
    case 'admin/clinical-centers':
    case 'admin/clinical_centers':
        if ($method === 'GET') {
            include 'admin/clinical-centers.php';
        } elseif ($method === 'POST') {
            include 'admin/clinical-centers.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/clinical-centers.php';
        } elseif ($method === 'DELETE') {
            include 'admin/clinical-centers.php';
        }
        break;
        
    case 'admin/investigators':
        if ($method === 'GET') {
            include 'admin/investigators.php';
        } elseif ($method === 'POST') {
            include 'admin/investigators.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/investigators.php';
        } elseif ($method === 'DELETE') {
            include 'admin/investigators.php';
        }
        break;
        
    // Notifications endpoints now handled by Node.js server
    // case 'notifications':
    // case 'notifications/unread-count':
    // case 'notifications/preferences':
    // case 'notifications/mark-all-read':
        
    // Handle dynamic paths
    default:
        // Notifications dynamic paths now handled by Node.js server
        // if (preg_match('/^notifications\/(\d+)$/', $path, $matches)) {
        
        // Handle dynamic blog post paths like /admin/blog-posts/{id}
        if (preg_match('/^admin\/blog-posts\/(\d+)$/', $path, $matches)) {
            $GLOBALS['postId'] = $matches[1];
            if ($method === 'GET') {
                include 'admin/blog-posts.php';
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                include 'admin/blog-posts.php';
            } elseif ($method === 'DELETE') {
                include 'admin/blog-posts.php';
            }
        }
        // Handle dynamic company paths like /admin/companies/{id}
        elseif (preg_match('/^admin\/companies\/(\d+)$/', $path, $matches)) {
            $GLOBALS['companyId'] = $matches[1];
            if ($method === 'GET') {
                include 'admin/companies.php';
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                include 'admin/companies.php';
            } elseif ($method === 'DELETE') {
                include 'admin/companies.php';
            }
        }
        // Handle dynamic deal paths like /admin/deals/{id}
        elseif (preg_match('/^admin\/deals\/(\d+)$/', $path, $matches)) {
            $GLOBALS['dealId'] = $matches[1];
            if ($method === 'GET') {
                include 'admin/deals.php';
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                include 'admin/deals.php';
            } elseif ($method === 'DELETE') {
                include 'admin/deals.php';
            }
        }
        // Handle dynamic grant paths like /admin/grants/{id}
        elseif (preg_match('/^admin\/grants\/(\d+)$/', $path, $matches)) {
            $GLOBALS['grantId'] = $matches[1];
            if ($method === 'GET') {
                include 'admin/grants.php';
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                include 'admin/grants.php';
            } elseif ($method === 'DELETE') {
                include 'admin/grants.php';
            }
        }
        // Handle dynamic investor paths
        elseif (preg_match('/^admin\/investors\/(\d+)$/', $path, $matches)) {
            $GLOBALS['investorId'] = $matches[1];
            if ($method === 'GET') {
                include 'admin/investors.php';
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                include 'admin/investors.php';
            } elseif ($method === 'DELETE') {
                include 'admin/investors.php';
            }
        }
        // Handle dynamic clinical trial paths
        elseif (preg_match('/^admin\/clinical-trials\/(\d+)$/', $path, $matches) || preg_match('/^admin\/clinical_trials\/(\d+)$/', $path, $matches)) {
            $GLOBALS['trialId'] = $matches[1];
            if ($method === 'GET') {
                include 'admin/clinical-trials.php';
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                include 'admin/clinical-trials.php';
            } elseif ($method === 'DELETE') {
                include 'admin/clinical-trials.php';
            }
        }
    // Handle dynamic regulatory paths
    elseif (preg_match('/^admin\/regulatory\/(\d+)$/', $path, $matches)) {
        $GLOBALS['regulatoryId'] = $matches[1];
        if ($method === 'GET') {
            include 'admin/regulatory.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/regulatory.php';
        } elseif ($method === 'DELETE') {
            include 'admin/regulatory.php';
        }
    }
    // Handle dynamic regulatory bodies paths
    elseif (preg_match('/^admin\/regulatory-bodies\/(\d+)$/', $path, $matches) || preg_match('/^admin\/regulatory_bodies\/(\d+)$/', $path, $matches)) {
        $GLOBALS['regulatoryBodyId'] = $matches[1];
        if ($method === 'GET') {
            include 'admin/regulatory-bodies.php';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            include 'admin/regulatory-bodies.php';
        } elseif ($method === 'DELETE') {
            include 'admin/regulatory-bodies.php';
        }
    }
        // Handle dynamic public markets paths
        elseif (preg_match('/^admin\/public-markets\/(\d+)$/', $path, $matches) || preg_match('/^admin\/public_markets\/(\d+)$/', $path, $matches)) {
            $GLOBALS['stockId'] = $matches[1];
            if ($method === 'GET') {
                include 'admin/public-markets.php';
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                include 'admin/public-markets.php';
            } elseif ($method === 'DELETE') {
                include 'admin/public-markets.php';
            }
        }
        // Handle dynamic clinical centers paths
        elseif (preg_match('/^admin\/clinical-centers\/(\d+)$/', $path, $matches) || preg_match('/^admin\/clinical_centers\/(\d+)$/', $path, $matches)) {
            $GLOBALS['centerId'] = $matches[1];
            if ($method === 'GET') {
                include 'admin/clinical-centers.php';
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                include 'admin/clinical-centers.php';
            } elseif ($method === 'DELETE') {
                include 'admin/clinical-centers.php';
            }
        }
        // Handle dynamic investigators paths
        elseif (preg_match('/^admin\/investigators\/(\d+)$/', $path, $matches)) {
            $GLOBALS['investigatorId'] = $matches[1];
            if ($method === 'GET') {
                include 'admin/investigators.php';
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                include 'admin/investigators.php';
            } elseif ($method === 'DELETE') {
                include 'admin/investigators.php';
            }
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
        break;
}
?>
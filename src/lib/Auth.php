<?php
// Authentication helper class for API endpoints

class Auth {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function authenticate() {
        // Get the Authorization header
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        if (!$authHeader) {
            return null;
        }
        
        // Extract token from "Bearer TOKEN" format
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
        } else {
            return null;
        }
        
        // For development, accept any token and return admin user
        if ($token === 'test-token') {
            // Get admin user from database
            $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
            $stmt->execute(['superadmin@medarion.com']);
            $user = $stmt->fetch();
            
            if ($user) {
                return $user;
            }
        }
        
        return null;
    }
    
    public function requireAuth() {
        $user = $this->authenticate();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Authorization token required']);
            exit();
        }
        return $user;
    }
}
?>


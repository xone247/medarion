<?php
/**
 * Email Configuration
 * 
 * Configure your email service here (SMTP, SendGrid, Mailgun, etc.)
 * 
 * For development, you can use:
 * - SMTP (with Gmail, Outlook, etc.)
 * - SendGrid (recommended for production)
 * - Mailgun
 * - PHP mail() function (not recommended for production)
 */

return [
    // Email service type: 'smtp', 'sendgrid', 'mailgun', 'mail'
    'driver' => env('EMAIL_DRIVER', 'smtp'),
    
    // Application email address
    'from' => [
        'address' => env('EMAIL_FROM_ADDRESS', 'noreply@medarion.com'),
        'name' => env('EMAIL_FROM_NAME', 'Medarion'),
    ],
    
    // SMTP Configuration
    'smtp' => [
        'host' => env('SMTP_HOST', 'smtp.gmail.com'),
        'port' => env('SMTP_PORT', 587),
        'encryption' => env('SMTP_ENCRYPTION', 'tls'), // 'tls' or 'ssl'
        'username' => env('SMTP_USERNAME', ''),
        'password' => env('SMTP_PASSWORD', ''),
    ],
    
    // SendGrid Configuration
    'sendgrid' => [
        'api_key' => env('SENDGRID_API_KEY', ''),
    ],
    
    // Mailgun Configuration
    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN', ''),
        'api_key' => env('MAILGUN_API_KEY', ''),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],
    
    // Application URL (for email links)
    'app_url' => env('APP_URL', 'http://localhost:5173'),
];

/**
 * Helper function to get environment variable with fallback
 */
if (!function_exists('env')) {
    function env($key, $default = null) {
        return isset($_ENV[$key]) ? $_ENV[$key] : $default;
    }
}
?>


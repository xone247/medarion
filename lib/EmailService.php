<?php
/**
 * Email Service
 * Handles sending emails using configured email service
 */

require __DIR__ . '/../config/email.php';

class EmailService {
    private $config;
    
    public function __construct() {
        $this->config = require __DIR__ . '/../config/email.php';
    }
    
    /**
     * Send an email
     * 
     * @param string $to Recipient email address
     * @param string $subject Email subject
     * @param string $body Email body (HTML)
     * @param string|null $plainText Plain text version (optional)
     * @return bool Success status
     */
    public function send($to, $subject, $body, $plainText = null) {
        $driver = $this->config['driver'];
        
        switch ($driver) {
            case 'smtp':
                return $this->sendViaSMTP($to, $subject, $body, $plainText);
            case 'sendgrid':
                return $this->sendViaSendGrid($to, $subject, $body, $plainText);
            case 'mailgun':
                return $this->sendViaMailgun($to, $subject, $body, $plainText);
            case 'mail':
            default:
                return $this->sendViaMail($to, $subject, $body, $plainText);
        }
    }
    
    /**
     * Send email via SMTP
     */
    private function sendViaSMTP($to, $subject, $body, $plainText = null) {
        $smtp = $this->config['smtp'];
        
        // Use PHPMailer if available, otherwise fallback to mail()
        if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            return $this->sendViaPHPMailer($to, $subject, $body, $plainText);
        }
        
        // Fallback to mail() if PHPMailer not available
        return $this->sendViaMail($to, $subject, $body, $plainText);
    }
    
    /**
     * Send email via PHPMailer (if installed)
     */
    private function sendViaPHPMailer($to, $subject, $body, $plainText = null) {
        try {
            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            
            // Server settings
            $mail->isSMTP();
            $mail->Host = $this->config['smtp']['host'];
            $mail->SMTPAuth = true;
            $mail->Username = $this->config['smtp']['username'];
            $mail->Password = $this->config['smtp']['password'];
            $mail->SMTPSecure = $this->config['smtp']['encryption'];
            $mail->Port = $this->config['smtp']['port'];
            
            // Recipients
            $mail->setFrom($this->config['from']['address'], $this->config['from']['name']);
            $mail->addAddress($to);
            
            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $body;
            if ($plainText) {
                $mail->AltBody = $plainText;
            }
            
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Email send failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send email via SendGrid
     */
    private function sendViaSendGrid($to, $subject, $body, $plainText = null) {
        $apiKey = $this->config['sendgrid']['api_key'];
        
        if (empty($apiKey)) {
            error_log("SendGrid API key not configured");
            return false;
        }
        
        $data = [
            'personalizations' => [
                [
                    'to' => [['email' => $to]]
                ]
            ],
            'from' => [
                'email' => $this->config['from']['address'],
                'name' => $this->config['from']['name']
            ],
            'subject' => $subject,
            'content' => [
                [
                    'type' => 'text/html',
                    'value' => $body
                ]
            ]
        ];
        
        if ($plainText) {
            $data['content'][] = [
                'type' => 'text/plain',
                'value' => $plainText
            ];
        }
        
        $ch = curl_init('https://api.sendgrid.com/v3/mail/send');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $httpCode >= 200 && $httpCode < 300;
    }
    
    /**
     * Send email via Mailgun
     */
    private function sendViaMailgun($to, $subject, $body, $plainText = null) {
        $domain = $this->config['mailgun']['domain'];
        $apiKey = $this->config['mailgun']['api_key'];
        
        if (empty($domain) || empty($apiKey)) {
            error_log("Mailgun configuration incomplete");
            return false;
        }
        
        $data = [
            'from' => $this->config['from']['name'] . ' <' . $this->config['from']['address'] . '>',
            'to' => $to,
            'subject' => $subject,
            'html' => $body
        ];
        
        if ($plainText) {
            $data['text'] = $plainText;
        }
        
        $ch = curl_init("https://{$this->config['mailgun']['endpoint']}/v3/{$domain}/messages");
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Basic ' . base64_encode("api:{$apiKey}")
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $httpCode >= 200 && $httpCode < 300;
    }
    
    /**
     * Send email via PHP mail() function (fallback)
     */
    private function sendViaMail($to, $subject, $body, $plainText = null) {
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: ' . $this->config['from']['name'] . ' <' . $this->config['from']['address'] . '>',
            'Reply-To: ' . $this->config['from']['address'],
            'X-Mailer: PHP/' . phpversion()
        ];
        
        return mail($to, $subject, $body, implode("\r\n", $headers));
    }
}
?>


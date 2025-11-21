<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #10b981;
            margin: 0;
            font-size: 28px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #10b981;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
        .button:hover {
            background-color: #059669;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>Medarion</h1>
        </div>
        
        <h2>Reset Your Password</h2>
        
        <p>Hello,</p>
        
        <p>We received a request to reset your password for your Medarion account. Click the button below to create a new password:</p>
        
        <div style="text-align: center;">
            <a href="<?php echo htmlspecialchars($resetUrl); ?>" class="button">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280; font-size: 12px;"><?php echo htmlspecialchars($resetUrl); ?></p>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> This link will expire in 24 hours. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </div>
        
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        
        <div class="footer">
            <p>© <?php echo date('Y'); ?> Medarion. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>


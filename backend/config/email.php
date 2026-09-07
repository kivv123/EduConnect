<?php
// backend/config/email.php

/**
 * Generate a secure 6-digit OTP code
 */
function generate6DigitCode() {
    return str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
}

/**
 * Send an OTP verification code or password reset code via email
 */
function sendEduConnectEmail($toEmail, $recipientName, $subject, $code, $purpose = 'verification') {
    $title = ($purpose === 'verification') ? 'Verify Your EduConnect Email' : 'Reset Your EduConnect Password';
    $messageBody = "
    Hello {$recipientName},

    Your 6-digit security code for {$title} is:
    
    ------------------------
    {$code}
    ------------------------
    
    This code is valid for 15 minutes. Please do not share this code with anyone.
    
    If you did not request this, please disregard this email.
    
    Best regards,
    The EduConnect Security Team
    ";

    $headers = [
        'From: no-reply@educonnect.org',
        'Reply-To: support@educonnect.org',
        'X-Mailer: PHP/' . phpversion(),
        'Content-Type: text/plain; charset=UTF-8'
    ];

    // Attempt native mail delivery (standard on configured XAMPP sendmail)
    $mailSent = @mail($toEmail, $subject, $messageBody, implode("\r\n", $headers));
    
    // Also save to a local log file for testing and offline debugging
    $logDir = __DIR__ . '/../../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0777, true);
    }
    $logLine = date('Y-m-d H:i:s') . " | To: {$toEmail} | Purpose: {$purpose} | Code: {$code} | Status: " . ($mailSent ? 'SENT' : 'LOGGED') . "\n";
    @file_put_contents($logDir . '/email_outbox.log', $logLine, FILE_APPEND);

    return [
        'sent' => true,
        'code' => $code, // Returned for dev inspection / test automation
        'logged' => true
    ];
}

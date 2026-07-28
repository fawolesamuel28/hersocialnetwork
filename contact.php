<?php
// Simple contact form endpoint for Namecheap/shared hosting.
// Replace $TO_EMAIL and optionally $FROM_EMAIL with your real addresses (or set via hosting config).

header('Content-Type: application/json; charset=utf-8');

// Read JSON body
$raw = trim(file_get_contents('php://input'));
if (!$raw) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty request body']);
    exit;
}

$data = json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$first = isset($data['first_name']) ? strip_tags(trim($data['first_name'])) : '';
$last = isset($data['last_name']) ? strip_tags(trim($data['last_name'])) : '';
$email = isset($data['email']) ? filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL) : false;
$phone = isset($data['phone']) ? strip_tags(trim($data['phone'])) : '';
$message = isset($data['message']) ? trim($data['message']) : '';
$type = isset($data['type']) && $data['type'] === 'call' ? 'call' : 'email';

if (!$first || !$email || !$message) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Helper to retrieve environment variable with $_SERVER / $_ENV fallback
function get_setting($key, $default = '') {
    return getenv($key) ?: ($_SERVER[$key] ?? ($_ENV[$key] ?? $default));
}

$TO_EMAIL = get_setting('MAIL_TO', 'info@hersocialnetwork.co.uk');
$FROM_EMAIL = get_setting('MAIL_FROM', 'noreply@hersocialnetwork.co.uk');

$subject = ($type === 'call') ? "[Website] Call Request from $first $last" : "[Website] Contact from $first $last";

$html = "<html><body>";
$html .= "<div style=\"font-family: Arial, sans-serif; max-width:600px; margin:0 auto;\">";
$html .= "<h2>New contact form submission</h2>";
$html .= "<p><strong>Name:</strong> " . htmlspecialchars($first . ' ' . $last) . "</p>";
$html .= "<p><strong>Email:</strong> " . htmlspecialchars($email) . "</p>";
if ($phone) { $html .= "<p><strong>Phone:</strong> " . htmlspecialchars($phone) . "</p>"; }
$html .= "<p><strong>Type:</strong> " . htmlspecialchars(ucfirst($type)) . "</p>";
$html .= "<hr/><h3>Message</h3><p>" . nl2br(htmlspecialchars($message)) . "</p>";
$html .= "</div></body></html>";

// SMTP configuration (with default fallbacks for Namecheap / cPanel)
$smtpHost = get_setting('SMTP_HOST', 'hersocialnetwork.co.uk');
$smtpPort = get_setting('SMTP_PORT', '465');
$smtpUser = get_setting('SMTP_USER', 'noreply@hersocialnetwork.co.uk');
$smtpPass = get_setting('SMTP_PASS', 'HerSocialNetwrkcic2026');
$smtpSecure = get_setting('SMTP_SECURE', 'ssl');

$sent = false;
$lastError = '';

// Try PHPMailer via Composer autoload if present and SMTP credentials provided
$composer = __DIR__ . '/vendor/autoload.php';
if (file_exists($composer) && $smtpHost && $smtpUser && $smtpPass) {
    require_once $composer;
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        
        // SMTP settings
        $mail->isSMTP();
        $mail->Host = $smtpHost;
        $mail->SMTPAuth = true;
        $mail->Username = $smtpUser;
        $mail->Password = $smtpPass;
        $mail->Timeout = 10; // Prevent hanging on network timeout
        
        if (strtolower($smtpSecure) === 'ssl') {
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        } elseif (strtolower($smtpSecure) === 'tls') {
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        }
        $mail->Port = intval($smtpPort) ?: 465;

        // SSL options for local cPanel certificates
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );

        $mail->setFrom($FROM_EMAIL, 'Her Social Network Website');
        $mail->addAddress($TO_EMAIL);
        $mail->addReplyTo($email);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $html;

        $sent = $mail->send();
    } catch (Exception $e) {
        $lastError = $e->getMessage();
        error_log('PHPMailer error: ' . $lastError);
        $sent = false;
    }
}

// Fallback to PHP mail() if PHPMailer wasn't used or failed
if (!$sent) {
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-type: text/html; charset=utf-8';
    $headers[] = 'From: ' . $FROM_EMAIL;
    $headers[] = 'Reply-To: ' . $email;

    $sent = @mail($TO_EMAIL, $subject, $html, implode("\r\n", $headers));
    if (!$sent && empty($lastError)) {
        $lastError = 'PHP mail() function returned false.';
    }
}

if ($sent) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email. Details: ' . $lastError]);
}

?>
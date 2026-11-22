<?php

date_default_timezone_set('Asia/Manila');
header('X-Content-Type-Options: nosniff');

$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH'])
       && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';

function respond($ok, $message, $isAjax, $status = 200)
{
    if ($isAjax) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message]);
    } else {
        header('Location: index.html?sent=' . ($ok ? '1' : '0') . '#contac_area');
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request.', $isAjax, 405);
}

if (!empty($_POST['website'])) {
    respond(true, 'Thanks! Your message has been sent.', $isAjax);
}

function field($key, $max)
{
    $v = isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
    return mb_substr($v, 0, $max);
}

$name    = field('name', 100);
$email   = field('Email', 150);
$service = field('service', 60);
$subject = field('subject', 150);
$message = field('message', 5000);

if ($name === '' || $email === '' || $subject === '' || $message === '') {
    respond(false, 'Please fill in all fields before sending.', $isAjax, 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please enter a valid email address.', $isAjax, 422);
}

$dir  = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$file = $dir . DIRECTORY_SEPARATOR . 'messages.csv';

if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
    respond(false, 'Sorry, we could not save your message. Please email us instead.', $isAjax, 500);
}

function csv_safe($v)
{
    return preg_match('/^[=+\-@\t\r]/', $v) ? "'" . $v : $v;
}

$isNew = !file_exists($file);
$fh = fopen($file, 'a');

if (!$fh || !flock($fh, LOCK_EX)) {
    respond(false, 'Sorry, we could not save your message. Please email us instead.', $isAjax, 500);
}

if ($isNew) {
    fwrite($fh, "\xEF\xBB\xBF");
    fputcsv($fh, ['Date', 'Name', 'Email', 'Service', 'Subject', 'Message', 'IP']);
}

fputcsv($fh, array_map('csv_safe', [
    date('Y-m-d H:i:s'),
    $name,
    $email,
    $service,
    $subject,
    $message,
    isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '',
]));

flock($fh, LOCK_UN);
fclose($fh);

respond(true, 'Thanks, ' . $name . '! Your message has been sent. We will get back to you within 24 hours.', $isAjax);

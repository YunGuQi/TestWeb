<?php
require __DIR__ . '/_bootstrap.php';

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', (bool) $p['secure'], (bool) $p['httponly']);
}
session_destroy();

copy_board_json(['ok' => true, 'authed' => false]);

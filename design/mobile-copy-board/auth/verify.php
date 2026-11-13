<?php
require __DIR__ . '/_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    copy_board_json(['ok' => false, 'error' => '仅支持 POST'], 405);
}

$expected = copy_board_load_password();
if ($expected === '') {
    $_SESSION = [];
    copy_board_json([
        'ok' => false,
        'configured' => false,
        'error' => '服务器未配置口令，拒绝进入。请到宝塔配置 COPY_BOARD_PASSWORD 或 auth/config.local.php',
    ], 403);
}

$raw = file_get_contents('php://input');
$data = [];
if (is_string($raw) && $raw !== '') {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $data = $decoded;
    }
}
if (!$data && !empty($_POST)) {
    $data = $_POST;
}

$input = isset($data['password']) ? trim((string) $data['password']) : '';
if ($input === '') {
    copy_board_json(['ok' => false, 'configured' => true, 'error' => '请输入口令'], 400);
}

if (!hash_equals($expected, $input)) {
    usleep(250000);
    copy_board_json(['ok' => false, 'configured' => true, 'error' => '口令错误'], 401);
}

$_SESSION['copy_board_ok'] = true;
$_SESSION['copy_board_at'] = time();

copy_board_json(['ok' => true, 'configured' => true, 'authed' => true]);

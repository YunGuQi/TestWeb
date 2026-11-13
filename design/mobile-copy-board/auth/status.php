<?php
require __DIR__ . '/_bootstrap.php';

$pwd = copy_board_load_password();
$configured = $pwd !== '';
$authed = !empty($_SESSION['copy_board_ok']) && $configured;

copy_board_json([
    'ok' => true,
    'configured' => $configured,
    'authed' => $authed,
    'hint' => $configured
        ? ''
        : '服务器未配置口令。请在宝塔创建 /www/wwwroot/copy-board/auth/config.local.php（参考 config.example.php），或设置环境变量 COPY_BOARD_PASSWORD。',
]);

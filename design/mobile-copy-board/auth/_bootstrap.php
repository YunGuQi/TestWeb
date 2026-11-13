<?php
/**
 * 口令读取与会话公共逻辑（不对外暴露）
 * 口令来源优先级：getenv('COPY_BOARD_PASSWORD') > config.local.php
 */
declare(strict_types=1);

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('copy_board_sess');
    session_set_cookie_params([
        'lifetime' => 60 * 60 * 12,
        'path' => '/copy/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function copy_board_load_password(): string
{
    $fromEnv = getenv('COPY_BOARD_PASSWORD');
    if (is_string($fromEnv) && trim($fromEnv) !== '') {
        return trim($fromEnv);
    }

    $local = __DIR__ . '/config.local.php';
    if (is_file($local)) {
        /** @noinspection PhpIncludeInspection */
        include $local;
        if (isset($COPY_BOARD_PASSWORD) && is_string($COPY_BOARD_PASSWORD) && trim($COPY_BOARD_PASSWORD) !== '') {
            return trim($COPY_BOARD_PASSWORD);
        }
    }

    return '';
}

function copy_board_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

<?php
/**
 * 手机复制板口令配置模板（可提交 Git）
 *
 * 部署步骤：
 * 1. 复制本文件为同目录下的 config.local.php（该文件已被 .gitignore 排除，切勿提交）
 * 2. 把下面的口令改成你自己的强口令
 * 3. 也可不建 config.local.php，改在宝塔「网站 → test.mutong-xhs.top → 配置文件 / 环境变量」
 *    里设置环境变量 COPY_BOARD_PASSWORD
 *
 * 优先级：环境变量 COPY_BOARD_PASSWORD > 本文件 $COPY_BOARD_PASSWORD
 * 二者都未配置时，页面拒绝进入。
 */

// 在 config.local.php 里填写真实口令；本示例文件保持为空。
$COPY_BOARD_PASSWORD = '';

# Antigravity Assistant Project Guidelines

## Git 操作规范 (Critical Rule)
- **绝对禁止私自回退 Git 代码**。在执行任何会修改工作区、可能导致代码丢失的 Git 操作（例如 `git checkout <commit>`、`git reset --hard` 等）之前，**必须**事先询问用户，并获得用户的明确同意。
- 操作前必须假定用户在本地有最新且未提交（uncommitted）的代码修改。任何回退或覆盖操作都会造成用户今天的心血永久丢失。

@echo off
REM 在 Windows 上构建 publish.exe（需先装好 Python 3.10+）
REM 双击本文件即可；首次会联网下载 Chromium 和依赖。

setlocal
cd /d "%~dp0"

echo [1/4] 创建虚拟环境...
python -m venv .venv || goto :err
call .venv\Scripts\activate.bat || goto :err

echo [2/4] 安装依赖...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt pyinstaller || goto :err

echo [3/4] 下载 Chromium（Playwright）...
python -m playwright install chromium || goto :err

echo [4/4] 打包 exe...
REM 把 Playwright 的浏览器随 exe 一起带上，目标机器免再下载
set PLAYWRIGHT_BROWSERS_PATH=0
python -m playwright install chromium
pyinstaller --noconfirm --onefile --name publish ^
  --collect-all playwright ^
  publish.py || goto :err

echo.
echo 完成！exe 在 dist\publish.exe
echo 用法：把 wechat-export\<slug> 拷到 bundles\ 下，双击 dist\publish.exe
echo 首次联调建议命令行跑： dist\publish.exe --debug --draft-only
goto :eof

:err
echo.
echo 构建失败，请把上面的报错发给我。
exit /b 1

@echo off
chcp 65001 > nul
title Hệ thống Quản lý công việc TCS23

echo ===================================================================
echo      KHỞI ĐỘNG ỨNG DỤNG QUẢN LÝ CÔNG VIỆC - THUẾ CƠ SỞ 23
echo ===================================================================
echo.

echo [1/3] Đang kiểm tra môi trường chạy...
where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo [2/3] Đã phát hiện Node.js/npm. Đang mở trình duyệt và chạy Vite...
    start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"
    echo [3/3] Máy chủ phát triển Vite đang chạy tại http://localhost:5173
    echo       (Nhấn Ctrl+C để dừng máy chủ khi hoàn thành)
    echo.
    call npm run dev
    if %errorlevel% neq 0 (
        echo.
        echo Gặp lỗi với Vite, đang chuyển sang máy chủ Python dự phòng...
        goto RUN_PYTHON
    )
    goto END
)

:RUN_PYTHON
echo [2/3] Đang khởi động máy chủ Python nội bộ...
where python >nul 2>nul
if %errorlevel% equ 0 (
    start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173"
    echo [3/3] Máy chủ Python đang chạy tại http://localhost:5173
    echo       (Nhấn Ctrl+C để dừng máy chủ khi hoàn thành)
    echo.
    python server.py
    goto END
)

echo.
echo [!] Không tìm thấy Node.js hoặc Python.
echo Đang mở trực tiếp giao diện ứng dụng Offline không cần máy chủ...
start "" "%~dp0dist\Demo_website_quan_ly_cong_viec_TCS23_25082026.html"

:END
pause

#!/usr/bin/env sh
set -eu

APP_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
SERVICE_NAME="${SERVICE_NAME:-tax-task-web}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-5173}"
PUBLIC_PORT="${PUBLIC_PORT:-80}"
EXCEL_FILE="${EXCEL_FILE:-$APP_DIR/file du lieu.xlsx}"

run_as_root() {
  if [ "$(id -u)" = "0" ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    echo "Can quyen root hoac sudo de cai dat goi he thong."
    exit 1
  fi
}

install_python3() {
  if command -v python3 >/dev/null 2>&1; then
    echo "python3 da san sang: $(python3 --version)"
    return
  fi

  echo "Chua co python3. Dang thu cai dat..."

  if command -v apt-get >/dev/null 2>&1; then
    run_as_root apt-get update
    run_as_root apt-get install -y python3
  elif command -v dnf >/dev/null 2>&1; then
    run_as_root dnf install -y python3
  elif command -v yum >/dev/null 2>&1; then
    run_as_root yum install -y python3
  elif command -v apk >/dev/null 2>&1; then
    run_as_root apk add --no-cache python3
  else
    echo "Khong tim thay trinh quan ly goi apt-get/dnf/yum/apk."
    echo "Hay cai python3 thu cong roi chay lai: sh install.sh"
    exit 1
  fi
}

install_nginx() {
  if command -v nginx >/dev/null 2>&1; then
    echo "nginx da san sang."
    return
  fi

  echo "Chua co nginx. Dang thu cai dat..."

  if command -v apt-get >/dev/null 2>&1; then
    run_as_root apt-get update
    run_as_root apt-get install -y nginx
  elif command -v dnf >/dev/null 2>&1; then
    run_as_root dnf install -y nginx
  elif command -v yum >/dev/null 2>&1; then
    run_as_root yum install -y nginx
  elif command -v apk >/dev/null 2>&1; then
    run_as_root apk add --no-cache nginx
  else
    echo "Khong tim thay trinh quan ly goi apt-get/dnf/yum/apk."
    echo "Hay cai nginx thu cong roi chay lai: sh install.sh"
    exit 1
  fi
}

create_systemd_service() {
  if ! command -v systemctl >/dev/null 2>&1; then
    echo "Server khong co systemd. Hay chay thu cong bang: sh start.sh"
    return
  fi

  SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
  TMP_FILE="/tmp/$SERVICE_NAME.service"

  cat > "$TMP_FILE" <<EOF
[Unit]
Description=Quan ly cong viec to Quan ly ho tro ca nhan ho kinh doanh
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
Environment=HOST=$HOST
Environment=PORT=$PORT
Environment=EXCEL_FILE=$EXCEL_FILE
ExecStart=/usr/bin/env python3 $APP_DIR/server.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

  run_as_root mv "$TMP_FILE" "$SERVICE_FILE"
  run_as_root systemctl daemon-reload
  run_as_root systemctl enable "$SERVICE_NAME"
  run_as_root systemctl restart "$SERVICE_NAME"

  echo "Da tao va khoi dong service: $SERVICE_NAME"
  echo "Kiem tra trang thai: sudo systemctl status $SERVICE_NAME"
}

create_nginx_config() {
  if ! command -v nginx >/dev/null 2>&1; then
    echo "Bo qua cau hinh nginx vi chua co nginx."
    return
  fi

  NGINX_CONF="/etc/nginx/conf.d/$SERVICE_NAME.conf"
  TMP_FILE="/tmp/$SERVICE_NAME-nginx.conf"

  cat > "$TMP_FILE" <<EOF
server {
    listen $PUBLIC_PORT default_server;
    server_name _;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

  if [ -e /etc/nginx/sites-enabled/default ]; then
    run_as_root rm -f /etc/nginx/sites-enabled/default
  fi
  if [ -e /etc/nginx/conf.d/default.conf ]; then
    run_as_root mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak
  fi
  if [ -e /etc/nginx/http.d/default.conf ]; then
    run_as_root mv /etc/nginx/http.d/default.conf /etc/nginx/http.d/default.conf.bak
  fi

  run_as_root mv "$TMP_FILE" "$NGINX_CONF"
  run_as_root nginx -t

  if command -v systemctl >/dev/null 2>&1; then
    run_as_root systemctl enable nginx
    run_as_root systemctl restart nginx
  else
    run_as_root nginx -s reload || run_as_root nginx
  fi

  echo "Da cau hinh nginx port $PUBLIC_PORT -> 127.0.0.1:$PORT"
}

install_python3
install_nginx
create_systemd_service
create_nginx_config

echo "Cai dat hoan tat."
echo "Dia chi truy cap: http://<IP_SERVER>"
echo "Lan sau cap nhat code: keo de noi dung thu muc dist moi vao $APP_DIR bang FileZilla."

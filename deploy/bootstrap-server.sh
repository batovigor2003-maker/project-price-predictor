#!/usr/bin/env bash
set -Eeuo pipefail

[[ $EUID == 0 ]]
apt-get install -y docker-compose-v2
usermod -aG docker checkbilet

config=/etc/nginx/sites-available/checkbilet.conf
backup=$(mktemp)
cp -p -- "$config" "$backup"
changed=0
finish() {
  local status=$?
  if (( status != 0 && changed != 0 )); then
    cp -p -- "$backup" "$config"
  fi
  rm -f -- "$backup"
}
trap finish EXIT

changed=1
python3 - "$config" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
config = path.read_text()
old = """    root /var/www/checkbilet-app;
    location / { try_files $uri $uri/ =404; }"""
new = """    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }"""
app_start = config.index("    server_name app.checkbilet.ru;")
if config.count(old) == 1 and config.index(old) > app_start:
    path.write_text(config.replace(old, new, 1))
elif config.count(new) != 1 or config.index(new) < app_start:
    raise SystemExit("Unexpected Checkbilet app configuration")
PY
nginx -t
systemctl reload nginx

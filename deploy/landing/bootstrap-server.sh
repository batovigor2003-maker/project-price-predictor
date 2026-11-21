#!/usr/bin/env bash
set -Eeuo pipefail

[[ $EUID == 0 ]]
root=/var/www/checkbilet-landing
config=/etc/nginx/sites-available/checkbilet.conf
test "$(stat -c %u "$root")" -eq 0
test ! -e "$root/current"
test ! -e "$root/releases"
test -s "$root/index.html"

install -d -m 755 "$root/releases" "$root/releases/initial"
cp -a -- "$root/index.html" "$root/releases/initial/index.html"
ln -s releases/initial "$root/current"

backup=$(mktemp)
cp -p -- "$config" "$backup"
finish() {
  local status=$?
  if (( status != 0 )); then
    cp -p -- "$backup" "$config"
  fi
  rm -f -- "$backup"
}
trap finish EXIT

python3 - "$config" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
config = path.read_text()
old = "    root /var/www/checkbilet-landing;"
new = "    root /var/www/checkbilet-landing/current;"
if config.count(old) != 1:
    raise SystemExit("Unexpected Checkbilet landing configuration")
path.write_text(config.replace(old, new, 1))
PY
nginx -t
systemctl reload nginx

chown checkbilet:checkbilet "$root/releases" "$root"

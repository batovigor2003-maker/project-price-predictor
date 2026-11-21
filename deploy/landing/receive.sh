#!/usr/bin/env bash
set -Eeuo pipefail
umask 022

root=/var/www/checkbilet-landing
domain=checkbilet.ru
command=${SSH_ORIGINAL_COMMAND:-}
if [[ ! $command =~ ^publish\ ([a-f0-9]{40})-([0-9]+)-([0-9]+)$ ]]; then
  printf 'Expected a landing release identifier.\n' >&2
  exit 1
fi
sha=${BASH_REMATCH[1]}
release=${command#publish }

exec 9>"$root/release.lock"
flock -w 60 9
stage=$(mktemp -d "$root/.staging.XXXXXXXX")
trap 'rm -rf -- "$stage"' EXIT
mkdir "$stage/site"

tar --extract --gzip --file=- --directory="$stage/site" --no-same-owner --no-same-permissions
test -s "$stage/site/index.html"
test "$(cat "$stage/site/release-sha.txt")" = "$sha"
test -z "$(find "$stage/site" ! -type d ! -type f -print -quit)"
test ! -e "$root/releases/$release"

mv -T -- "$stage/site" "$root/releases/$release"
ln -s "releases/$release" "$stage/current"
mv -Tf -- "$stage/current" "$root/current"

verify() {
  local path=$1 output=$2
  status=$(curl -fsS --max-time 10 --resolve "$domain:443:127.0.0.1" \
    --output "$output" --write-out '%{http_code}' "https://$domain$path")
  test "$status" = 200
}
verify / "$stage/live.html"
cmp "$root/releases/$release/index.html" "$stage/live.html"
verify /release-sha.txt "$stage/live-sha.txt"
test "$(cat "$stage/live-sha.txt")" = "$sha"
printf 'Nginx served HTTP 200 for / from release %s\n' "$sha"

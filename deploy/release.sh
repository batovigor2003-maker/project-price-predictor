#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

sha=${1:?Release SHA is required}
[[ $sha =~ ^[0-9a-f]{40}$ ]]
release_dir=$(cd "$(dirname "$0")" && pwd)
project_dir="$HOME/checkbilet-deploy"
registry_repo=ghcr.io/batovigor2003-maker/project-price-predictor
export APP_IMAGE="$registry_repo:$sha"
compose=(docker compose -p prod --project-directory "$project_dir" --env-file "$project_dir/.env" -f "$release_dir/compose.yaml")

exec 9>"$project_dir/release.lock"
flock -w 120 9
step='reading server configuration'
registry_config=''
on_exit() {
  local status=$?
  if [[ -n $registry_config ]]; then
    rm -rf -- "$registry_config"
  fi
  if (( status != 0 )); then
    printf 'Deployment failed during %s (exit %s).\n' "$step" "$status" >&2
    "${compose[@]}" ps >&2 || true
    local container
    container=$("${compose[@]}" ps -q app 2>/dev/null) || true
    if [[ -n $container ]]; then
      docker inspect --format 'Running image: {{.Config.Image}}' "$container" >&2 || true
    else
      printf 'No running app container found.\n' >&2
    fi
    printf 'Server log command: APP_IMAGE=%s docker compose -p prod --env-file %s/.env -f %s/compose.yaml logs --tail 100 app postgres\n' "$APP_IMAGE" "$project_dir" "$release_dir" >&2
  fi
}
trap on_exit EXIT

grep -Eq '^POSTGRES_PASSWORD=[0-9a-f]{64}$' "$project_dir/.env"
step='pulling the release image'
registry_config=$(mktemp -d)
docker --config "$registry_config" login ghcr.io --username "$2" --password-stdin
docker --config "$registry_config" pull "$APP_IMAGE"

step='recording the running image'
container=$("${compose[@]}" ps -q app)
if [[ -n $container ]]; then
  docker inspect --format 'Previous running image: {{.Config.Image}}' "$container"
else
  printf 'Previous running image: none (first release)\n'
fi

step='starting PostgreSQL'
"${compose[@]}" up -d --wait --wait-timeout 90 postgres

step='applying migrations'
"${compose[@]}" run --rm --no-deps app node node_modules/drizzle-kit/bin.cjs migrate

step='starting the application'
"${compose[@]}" up -d --no-deps --pull never app

step='checking the running image'
container=$("${compose[@]}" ps -q app)
[[ -n $container ]]
[[ $(docker inspect --format '{{.Config.Image}}' "$container") == "$APP_IMAGE" ]]
[[ $(docker inspect --format '{{.Image}}' "$container") == "$(docker image inspect --format '{{.Id}}' "$APP_IMAGE")" ]]

step='checking public HTTPS /health'
deadline=$((SECONDS + 90))
while true; do
  remaining=$((deadline - SECONDS))
  (( remaining > 0 )) || exit 1
  timeout=$((remaining < 5 ? remaining : 5))
  response=$(curl --silent --fail --max-time "$timeout" --write-out '\n%{http_code}' https://app.checkbilet.ru/health) || response=''
  if [[ $response == "$(printf '{"status":"ok","sha":"%s"}\n200' "$sha")" ]]; then
    printf 'HTTPS /health: 200 (%s)\n' "$sha"
    break
  fi
  remaining=$((deadline - SECONDS))
  if (( remaining > 0 )); then
    sleep "$((remaining < 3 ? remaining : 3))"
  fi
done

step='recording the successful release'
state="$project_dir/successful-releases"
previous=''
if [[ -f $state ]]; then
  previous=$(awk -v sha="$sha" '/^[a-f0-9]+$/ && length($0) == 40 && $0 != sha {print; exit}' "$state")
fi
{
  printf '%s\n' "$sha"
  if [[ -n $previous ]]; then printf '%s\n' "$previous"; fi
} > "$state.tmp"
mv -f "$state.tmp" "$state"

step='cleaning up old application images'
tags=$(docker image ls --format '{{.Tag}}' "$registry_repo")
while IFS= read -r tag; do
  if [[ ! $tag =~ ^[0-9a-f]{40}$ || $tag == "$sha" || $tag == "$previous" ]]; then
    continue
  fi
  used=$(docker ps -aq --filter "ancestor=$registry_repo:$tag")
  if [[ -z $used ]]; then
    docker image rm "$registry_repo:$tag"
  fi
done <<< "$tags"
printf 'Deployed release %s\n' "$sha"

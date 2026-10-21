#!/bin/bash
#
# Starts the stack of e2e/docker/ (backend and app under test) under the compose project
# `twake-contacts-e2e`, then writes the addresses Playwright needs to .generated/stack.json.
#
#   ./scripts/build.sh     # once, and whenever the app changes: builds the images
#   ./scripts/start.sh
#   E2E_APP_IMAGE=<image> ./scripts/start.sh   # another image of the app
#
# Nothing is published on the host: the browser reaches the containers by their IP (Chromium
# --host-resolver-rules, playwright.config.ts), the harness too. Linux only.
#
set -euo pipefail

E2E_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GENERATED="$E2E_DIR/.generated"

E2E_PROJECT="${E2E_PROJECT:-twake-contacts-e2e}"
E2E_APP_IMAGE="${E2E_APP_IMAGE:-twake-contacts-web-e2e}"
IMAGES=("$E2E_APP_IMAGE" twake-contacts-e2e-side-service twake-contacts-e2e-ldap twake-contacts-e2e-dex twake-contacts-e2e-proxy twake-contacts-e2e-sabre)
SERVICES=(frontend proxy sso twake-calendar-side-service mock-smtp)

compose() {
  E2E_APP_IMAGE="$E2E_APP_IMAGE" docker compose -p "$E2E_PROJECT" \
    -f "$E2E_DIR/docker/docker-compose.yml" "$@"
}

for image in "${IMAGES[@]}"; do
  if ! docker image inspect "$image" >/dev/null 2>&1; then
    echo "Missing image $image: build the images first with ./scripts/build.sh" >&2
    exit 1
  fi
done

echo "==> Starting the stack as compose project '$E2E_PROJECT' (app: $E2E_APP_IMAGE)"
compose up -d "${SERVICES[@]}"

echo "==> Waiting for the side service"
ready=false
for _ in $(seq 1 120); do
  if compose logs twake-calendar-side-service 2>/dev/null | grep -q "StartUpChecks all succeeded"; then
    ready=true
    break
  fi
  sleep 5
done
if [ "$ready" != "true" ]; then
  echo "The side service did not start within 10 minutes, see: docker compose -p $E2E_PROJECT logs" >&2
  exit 1
fi

ip() {
  docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' \
    "$(compose ps -q "$1")"
}

mkdir -p "$GENERATED"
cat >"$GENERATED/stack.json" <<JSON
{
  "project": "$E2E_PROJECT",
  "frontend": "$(ip frontend)",
  "proxy": "$(ip proxy)",
  "sso": "$(ip sso)",
  "sideService": "$(ip twake-calendar-side-service)",
  "sabre": "$(ip sabre_dav)",
  "ldap": "$(ip ldap)",
  "mockSmtp": "$(ip mock-smtp)"
}
JSON

# Sabre and the LDAP directory answer a little after the side service declares itself ready
echo "==> Waiting for Sabre and Dex"
SABRE="$(ip sabre_dav)"
SSO="$(ip sso)"
for _ in $(seq 1 60); do
  if curl -s -o /dev/null -w '%{http_code}' "http://$SABRE/" | grep -qE '^(200|401|404)$' \
    && curl -sk -o /dev/null -w '%{http_code}' "https://$SSO:5554/.well-known/openid-configuration" | grep -q '^200$'; then
    break
  fi
  sleep 2
done

cat <<INFO

==> The e2e stack is up ($GENERATED/stack.json)

  npx playwright test

Stop it with: ./scripts/stop.sh
INFO

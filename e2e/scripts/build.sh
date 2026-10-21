#!/bin/bash
#
# Builds the images of the stack (e2e/docker/): the SPA bundle, the production image of the app
# layered with the runtime configuration of the stack, and the backend images. Used by the e2e
# suite (e2e/scripts/start.sh) and the QA environment (scripts/qa-environment/start.sh).
#
#   e2e/scripts/build.sh                                   # rebuilds the SPA bundle from the working tree
#   FORCE_FRONTEND_BUILD=false e2e/scripts/build.sh        # reuses apps/private/dist if present
#   e2e/scripts/build.sh <sabre image>                     # tests against a candidate esn-sabre build
#   E2E_APP_IMAGE=<name:tag> e2e/scripts/build.sh          # another tag for the app (start.sh reads it too)
#
set -euo pipefail

DOCKER_DIR="$(cd "$(dirname "$0")/../docker" && pwd)"
REPO_DIR="$(cd "$DOCKER_DIR/../.." && pwd)"

APP_IMAGE="${E2E_APP_IMAGE:-twake-contacts-web-e2e}"

# The tests are about the code in the working tree: never reuse a stale bundle unless asked to.
FORCE_FRONTEND_BUILD="${FORCE_FRONTEND_BUILD:-true}"

# npm records the installed tree in node_modules/.package-lock.json: a lockfile newer than it
# means node_modules no longer matches what the branch asks for.
NEEDS_INSTALL='[ ! -f node_modules/.package-lock.json ] || [ package-lock.json -nt node_modules/.package-lock.json ]'

echo "==> Building the SPA bundle"
if [ "$FORCE_FRONTEND_BUILD" = "true" ] || [ ! -d "$REPO_DIR/apps/private/dist" ]; then
  NODE_MAJOR="$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')"
  if [ -n "$NODE_MAJOR" ] && [ "$NODE_MAJOR" -ge 24 ]; then
    (cd "$REPO_DIR" && { ! eval "$NEEDS_INSTALL" || npm ci; } && npm run build:private)
  else
    # The repo needs Node 24+. Fall back to a container so that a developer running an
    # older Node -- or none at all -- can still build it.
    echo "Local Node is ${NODE_MAJOR:-absent}, building the bundle with node:24 in docker"
    docker run --rm \
      --user "$(id -u):$(id -g)" \
      -e HOME=/tmp \
      -e npm_config_cache=/tmp/.npm \
      -v "$REPO_DIR:/app" -w /app \
      node:24 sh -c "if $NEEDS_INSTALL; then npm ci; fi && npm run build:private"
  fi
else
  echo "Reusing existing apps/private/dist, built $(find "$REPO_DIR/apps/private/dist" -name 'index.html' -printf '%TY-%Tm-%Td %TH:%TM\n' 2>/dev/null || echo 'at an unknown time')"
fi

echo "==> Building the production image of the app"
docker build --quiet -f "$REPO_DIR/apps/private/Dockerfile" \
  --build-arg BUILD_VERSION=e2e \
  -t "$APP_IMAGE-base" "$REPO_DIR"

echo "==> Layering the runtime configuration of the stack on top of it"
docker build --quiet -f "$DOCKER_DIR/Dockerfile.frontend" \
  --build-arg FRONTEND_IMAGE="$APP_IMAGE-base" -t "$APP_IMAGE" "$DOCKER_DIR"

echo "==> Building the backend images"
for service in side-service ldap dex proxy; do
  docker build --quiet --pull -f "$DOCKER_DIR/Dockerfile.$service" -t "twake-contacts-e2e-$service" "$DOCKER_DIR"
done

# $1: Sabre image to test against, e.g. a candidate esn-sabre build
if [ -n "${1:-}" ]; then
  echo "==> Building the sabre image from $1"
  docker build --quiet --build-arg SABRE_IMAGE="$1" -f "$DOCKER_DIR/Dockerfile.sabre" -t twake-contacts-e2e-sabre "$DOCKER_DIR"
else
  docker build --quiet --pull -f "$DOCKER_DIR/Dockerfile.sabre" -t twake-contacts-e2e-sabre "$DOCKER_DIR"
fi

echo "==> All images built"

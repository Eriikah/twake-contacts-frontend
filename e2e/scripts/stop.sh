#!/bin/bash
#
# Stops the e2e stack started by start.sh and drops its data.
#
set -euo pipefail

E2E_DIR="$(cd "$(dirname "$0")/.." && pwd)"
E2E_PROJECT="${E2E_PROJECT:-twake-contacts-e2e}"

docker compose -p "$E2E_PROJECT" -f "$E2E_DIR/docker/docker-compose.yml" down --volumes
rm -f "$E2E_DIR/.generated/stack.json"
echo "==> e2e stack '$E2E_PROJECT' stopped"

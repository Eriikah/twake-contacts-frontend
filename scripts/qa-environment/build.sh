#!/bin/bash
#
# Builds the docker images start.sh runs: those of the e2e stack (e2e/scripts/build.sh).
#
#   scripts/qa-environment/build.sh                      # rebuilds the SPA bundle from the working tree
#   FORCE_FRONTEND_BUILD=false scripts/qa-environment/build.sh   # reuses apps/private/dist if present
#   scripts/qa-environment/build.sh <sabre image>        # tests against a candidate esn-sabre build
#
set -euo pipefail

# start.sh registers the accounts with it, from inside the stack network. A local copy is as good
# when the registry does not answer.
docker pull -q curlimages/curl >/dev/null || docker image inspect curlimages/curl >/dev/null

exec "$(dirname "$0")/../../e2e/scripts/build.sh" "$@"

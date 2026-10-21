# Shared by build.sh, start.sh and stop.sh. Not meant to be run on its own.
#
# The QA environment runs the stack of the e2e suite (e2e/docker/), under its own compose
# project, so that both can run at once.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$REPO_DIR/e2e/docker"

QA_PROJECT="${QA_PROJECT:-twake-contacts-qa}"
NETWORK="${QA_PROJECT}_tcalendar-e2e"

compose() {
  docker compose -p "$QA_PROJECT" -f "$DOCKER_DIR/docker-compose.yml" "$@"
}

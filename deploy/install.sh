#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL_DIR="${HOME}/.local/bin"
CONFIG_DIR="${HOME}/.config/multica"
SYSTEMD_DIR="${HOME}/.config/systemd/user"

echo "==> Building multica CLI..."
cd "${REPO_ROOT}/server"
VERSION=$(git -C "${REPO_ROOT}" describe --tags --always --dirty 2>/dev/null || echo dev)
COMMIT=$(git -C "${REPO_ROOT}" rev-parse --short HEAD 2>/dev/null || echo unknown)
GOROOT="${GOROOT:-${HOME}/sdk/go1.26.1}" \
  PATH="${GOROOT}/bin:${PATH}" \
  CGO_ENABLED=0 go build \
  -ldflags "-s -w -X main.version=${VERSION} -X main.commit=${COMMIT}" \
  -o "${INSTALL_DIR}/multica" ./cmd/multica
echo "    Installed ${INSTALL_DIR}/multica (${VERSION})"

echo "==> Setting up daemon config..."
mkdir -p "${CONFIG_DIR}"
if [ ! -f "${CONFIG_DIR}/daemon.env" ]; then
  cp "${REPO_ROOT}/deploy/daemon.env.example" "${CONFIG_DIR}/daemon.env"
  echo "    Created ${CONFIG_DIR}/daemon.env (edit this with your settings)"
else
  echo "    ${CONFIG_DIR}/daemon.env already exists, skipping"
fi

echo "==> Installing systemd user unit..."
mkdir -p "${SYSTEMD_DIR}"
cp "${REPO_ROOT}/deploy/multica-daemon.service" "${SYSTEMD_DIR}/multica-daemon.service"
systemctl --user daemon-reload
systemctl --user enable multica-daemon.service
echo "    Enabled multica-daemon.service"

echo ""
echo "Done! Next steps:"
echo "  1. Edit ~/.config/multica/daemon.env with your settings"
echo "  2. Start the app:    make -C ${REPO_ROOT} deploy"
echo "  3. Start the daemon: systemctl --user start multica-daemon"
echo "  4. View daemon logs: journalctl --user -u multica-daemon -f"

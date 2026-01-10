#!/usr/bin/env bash
#
# VibeKit Installation Script
#
# Downloads the latest VibeKit binary for your platform and installs it to ~/.local/bin
#
# Usage:
#   curl -fsSL https://getvibekit.ai/install | sh
#
# Or with a specific version:
#   VIBEKIT_VERSION=v0.1.0 curl -fsSL https://getvibekit.ai/install | sh
#
# Environment variables:
#   VIBEKIT_VERSION       - Install a specific version (default: latest)
#   VIBEKIT_INSTALL_DIR   - Custom install directory (default: ~/.local/bin)
#   VIBEKIT_FORCE_INSTALL - Skip confirmation prompts if set
#

set -euo pipefail

# GitHub repository
REPO="gabrielkuettel/vibekit"

if [[ -n "${VIBEKIT_VERSION:-}" ]]; then
  RELEASE_URL="https://github.com/$REPO/releases/download/$VIBEKIT_VERSION"
else
  RELEASE_URL="${VIBEKIT_RELEASE_URL:-https://github.com/$REPO/releases/latest/download}"
fi

# Installation directory (XDG standard for user binaries)
INSTALL_DIR="${VIBEKIT_INSTALL_DIR:-$HOME/.local/bin}"

# Colors
Red=''
Green=''
Yellow=''
Blue=''
Dim=''
Bold=''
Reset=''

if [[ -t 1 ]]; then
  Reset='\033[0m'
  Red='\033[0;31m'
  Green='\033[0;32m'
  Yellow='\033[0;33m'
  Blue='\033[0;34m'
  Dim='\033[0;2m'
  Bold='\033[1m'
fi

info() {
  echo -e "${Dim}$@${Reset}"
}

success() {
  echo -e "${Green}$@${Reset}"
}

warn() {
  echo -e "${Yellow}WARN${Reset}: $@"
}

error() {
  echo -e "${Red}ERROR${Reset}: $@" >&2
  exit 1
}

# Detect platform
detect_platform() {
  local os arch

  os=$(uname -s)
  arch=$(uname -m)

  # On macOS, detect ARM hardware even when running under Rosetta
  if [[ "$os" == "Darwin" && "$arch" == "x86_64" ]]; then
    if sysctl -n hw.optional.arm64 2>/dev/null | grep -q '1'; then
      arch="arm64"
    fi
  fi

  case "$os" in
    Darwin)
      case "$arch" in
        arm64)   echo "darwin-arm64" ;;
        *)       error "Only Apple Silicon (arm64) is supported on macOS. Detected: $arch" ;;
      esac
      ;;
    Linux)
      case "$arch" in
        x86_64)  echo "linux-x64" ;;
        *)       error "Only x64 is supported on Linux. Detected: $arch" ;;
      esac
      ;;
    MINGW*|MSYS*|CYGWIN*)
      error "Windows is not supported. Please use WSL with Linux x64."
      ;;
    *)
      error "Unsupported operating system: $os"
      ;;
  esac
}

# Ensure install directory exists
ensure_install_dir() {
  if [[ ! -d "$INSTALL_DIR" ]]; then
    info "Creating install directory: $INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"
  fi
}

# Check for existing installation
check_existing() {
  local install_path="$INSTALL_DIR/vibekit"

  if [[ -f "$install_path" ]]; then
    warn "VibeKit is already installed at $install_path"

    if [[ -n "${VIBEKIT_FORCE_INSTALL:-}" ]]; then
      info "VIBEKIT_FORCE_INSTALL is set, replacing existing installation..."
      rm "$install_path"
      return 0
    fi

    echo -n "Do you want to replace it? (y/N) "
    read -rn1 response < /dev/tty
    echo ""

    if [[ "$response" =~ ^[Yy]$ ]]; then
      rm "$install_path"
    else
      info "Keeping existing installation."
      exit 0
    fi
  fi
}

# Check if install directory is in PATH
check_path() {
  if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo ""
    warn "$INSTALL_DIR is not in your PATH"
    echo ""
    info "Add it to your shell configuration:"
    echo ""

    # Detect shell and show appropriate instructions
    local shell_name
    shell_name=$(basename "${SHELL:-bash}")

    case "$shell_name" in
      zsh)
        echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.zshrc"
        echo "  source ~/.zshrc"
        ;;
      bash)
        echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"
        echo "  source ~/.bashrc"
        ;;
      fish)
        echo "  fish_add_path ~/.local/bin"
        ;;
      *)
        echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
        echo ""
        info "Add the above line to your shell's config file."
        ;;
    esac
    echo ""
    return 1
  fi
  return 0
}

# Download vibekit
download() {
  local platform="$1"
  local target="vibekit-$platform"
  local url="$RELEASE_URL/$target"
  local install_path="$INSTALL_DIR/vibekit"

  echo -e "${Dim}Downloading:${Reset} ${Bold}$target${Reset}"
  echo -e "${Dim}From:${Reset} $url"
  echo -e "${Dim}To:${Reset} $install_path"
  echo ""

  local error_msg="Failed to download $target from $url"

  if command -v curl &> /dev/null; then
    curl --fail --location --progress-bar --output "$install_path" "$url" || error "$error_msg"
  elif command -v wget &> /dev/null; then
    wget -qO "$install_path" --show-progress "$url" || error "$error_msg"
  else
    error "Neither curl nor wget found. Please install one and try again."
  fi

  chmod +x "$install_path"
}

# Main
main() {
  echo ""
  echo -e "${Bold}VibeKit Installer${Reset}"
  echo ""

  ensure_install_dir
  check_existing

  local platform
  platform=$(detect_platform)

  download "$platform"

  echo ""
  success "Installed: vibekit ($platform)"
  echo -e "${Dim}Location:${Reset} $INSTALL_DIR/vibekit"
  echo ""

  # Check PATH and show instructions if needed
  check_path || true

  info "To get started, run:"
  echo ""
  echo "  vibekit init"
  echo ""
}

main

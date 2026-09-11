#!/usr/bin/env bash
# ==============================================================================
# Daily Health Coach - Docker Container Automation Script
# Supports: build, run, stop, logs, login, push
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Load .env if present
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Detect docker command (prefer rootless/group docker, use passwordless sudo if available)
DOCKER_CMD="docker"
if ! docker info >/dev/null 2>&1; then
    if sudo -n docker info >/dev/null 2>&1; then
        DOCKER_CMD="sudo docker"
    fi
fi

ACTION="${1:-up}"

case "$ACTION" in
    login)
        echo "🔐 Logging in to Docker Hub with your personal credentials..."
        if [ -n "$DOCKER_USERNAME" ] && [ "$DOCKER_USERNAME" != "your_dockerhub_username" ]; then
            if [ -n "$DOCKER_PASSWORD" ] && [ "$DOCKER_PASSWORD" != "your_dockerhub_token_or_password" ]; then
                echo "$DOCKER_PASSWORD" | $DOCKER_CMD login -u "$DOCKER_USERNAME" --password-stdin
            else
                $DOCKER_CMD login -u "$DOCKER_USERNAME"
            fi
        else
            $DOCKER_CMD login
        fi
        ;;
    build)
        echo "🔨 Building Daily Health Coach Docker Image..."
        $DOCKER_CMD compose build
        echo "✅ Image built successfully!"
        ;;
    up|start)
        echo "🚀 Starting Daily Health Coach container in background..."
        $DOCKER_CMD compose up -d --build
        echo ""
        echo "✨ Application running!"
        echo "   -> Web App:       http://localhost:${PORT:-8001}"
        echo "   -> Health API:    http://localhost:${PORT:-8001}/api/health"
        echo "   -> Check status:  ./docker-run.sh status"
        echo "   -> View logs:     ./docker-run.sh logs"
        ;;
    stop|down)
        echo "🛑 Stopping Daily Health Coach container..."
        $DOCKER_CMD compose down
        echo "✅ Container stopped."
        ;;
    logs)
        $DOCKER_CMD compose logs -f daily-health-coach
        ;;
    status)
        $DOCKER_CMD compose ps
        ;;
    push)
        echo "📦 Pushing image to your personal Docker repository..."
        $DOCKER_CMD compose push
        echo "✅ Successfully pushed image to Docker Hub!"
        ;;
    *)
        echo "Usage: ./docker-run.sh {up|build|stop|logs|status|login|push}"
        exit 1
        ;;
esac

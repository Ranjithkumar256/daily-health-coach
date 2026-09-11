# 🌿 Daily Health Coach - Complete Docker Deployment Guide (New Server / System)

This guide provides step-by-step instructions for deploying and running **Daily Health Coach** on any fresh Linux server (Ubuntu, Debian, AWS EC2, DigitalOcean Droplet, Hetzner, etc.) or new computer.

---

## 📋 Table of Contents
1. [Prerequisites: Installing Docker on a Fresh Server](#1-prerequisites-installing-docker-on-a-fresh-server)
2. [Method A: Instant Deployment (No Source Code Needed - Recommended)](#2-method-a-instant-deployment-no-source-code-needed---recommended)
3. [Method B: Deployment from Source Code](#3-method-b-deployment-from-source-code)
4. [Running Alongside PaisaTrack (Multi-App Setup)](#4-running-alongside-paisatrack-multi-app-setup)
5. [Database Persistence & Automated Backups](#5-database-persistence--automated-backups)
6. [Updating to New Versions](#6-updating-to-new-versions)
7. [Helpful Troubleshooting Commands](#7-helpful-troubleshooting-commands)

---

## 1. Prerequisites: Installing Docker on a Fresh Server

Run these commands on your fresh Ubuntu/Debian server to install Docker and Docker Compose:

```bash
# 1. Update package lists
sudo apt update && sudo apt upgrade -y

# 2. Install required packages
sudo apt install -y curl apt-transport-https ca-certificates gnupg lsb-release

# 3. Install Docker via the official automated script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 4. Add your user to the docker group (so you don't need 'sudo' for docker commands)
sudo usermod -aG docker $USER

# 5. Apply the group change immediately
newgrp docker

# 6. Verify Docker is running
docker --version
docker compose version
```

---

## 2. Method A: Instant Deployment (No Source Code Needed - Recommended)

Because the container image is published on Docker Hub (**`ranjith256/daily-health-coach:latest`**), you do **not** need Python, Node, Git, or any source code on the new server.

### Step 2.1: Create a Project Directory
```bash
mkdir -p ~/daily-health-coach && cd ~/daily-health-coach
```

### Step 2.2: Create `docker-compose.yml`
```bash
cat << 'EOF' > docker-compose.yml
services:
  daily-health-coach:
    image: ranjith256/daily-health-coach:latest
    container_name: daily-health-coach-app
    restart: unless-stopped
    ports:
      - "8001:8001"
    volumes:
      - healthcoach_data:/app/data
    environment:
      - PORT=8001
      - HOST=0.0.0.0
      - DB_PATH=/app/data/health_coach.db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  healthcoach_data:
    name: healthcoach_data
EOF
```

### Step 2.3: Start the Application
```bash
docker compose up -d
```
Docker will automatically pull `ranjith256/daily-health-coach:latest` from Docker Hub and start the container in the background.

Visit:
* `http://<your-server-ip>:8001`

---

## 3. Method B: Deployment from Source Code

If building from source on the server:

```bash
git clone <your-git-repo-url> ~/daily-health-coach
cd ~/daily-health-coach
cp .env.example .env
./docker-run.sh up
```

---

## 4. Running Alongside PaisaTrack (Multi-App Setup)

Both applications can run concurrently on the same server without any conflict:

| Application | Port | Database Volume | Container Name |
| :--- | :--- | :--- | :--- |
| **PaisaTrack** | `8000` | `paisatrack_data` | `paisatrack-app` |
| **Daily Health Coach** | `8001` | `healthcoach_data` | `daily-health-coach-app` |

---

## 5. Database Persistence & Automated Backups

### Where Data is Stored
Data is stored inside the named Docker volume: `healthcoach_data`. The database file is `/app/data/health_coach.db`.

### How to Backup the Database
```bash
docker run --rm \
  -v healthcoach_data:/data \
  -v $(pwd):/backup \
  busybox cp /data/health_coach.db /backup/health_coach_backup_$(date +%F_%H%M%S).db
```

### How to Restore a Database from Backup
```bash
docker compose down
docker run --rm \
  -v healthcoach_data:/data \
  -v $(pwd):/backup \
  busybox cp /backup/your_backup_file.db /data/health_coach.db
docker compose up -d
```

---

## 6. Updating to New Versions

```bash
cd ~/daily-health-coach

# 1. Pull latest image from Docker Hub
docker compose pull

# 2. Restart container with zero downtime
docker compose up -d
```

---

## 7. Helpful Troubleshooting Commands

| Task | Command |
| :--- | :--- |
| **Check Container Status** | `docker compose ps` |
| **View Real-Time Logs** | `docker compose logs -f` |
| **Restart Application** | `docker compose restart` |
| **Stop Application** | `docker compose down` |
| **Test Healthcheck API** | `curl -f http://localhost:8001/api/health` |
| **Monitor Resource Usage** | `docker stats daily-health-coach-app` |

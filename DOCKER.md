# Docker Deployment Guide for SuperBotijo

This guide explains how to deploy SuperBotijo using Docker and Docker Compose.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [Method 1: Docker Compose (Recommended)](#method-1-docker-compose-recommended)
  - [Method 2: Docker Run](#method-2-docker-run)
  - [Method 3: CasaOS Integration](#method-3-casaos-integration)
- [Configuration](#configuration)
- [Volume Mounts](#volume-mounts)
- [Environment Variables](#environment-variables)
- [Building Your Own Image](#building-your-own-image)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Updates and Maintenance](#updates-and-maintenance)

---

## Quick Start

The fastest way to get SuperBotijo running with Docker:

```bash
# 1. Create a directory for SuperBotijo
mkdir -p ~/superbotijo && cd ~/superbotijo

# 2. Download the docker-compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/vinayakv22/SuperBotijo/main/docker-compose.yml

# 3. Download the example environment file
curl -o .env https://raw.githubusercontent.com/vinayakv22/SuperBotijo/main/.env.docker.example

# 4. Generate secrets
echo "ADMIN_PASSWORD=$(openssl rand -base64 24)" >> .env
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env

# 5. Edit the .env file to set your OPENCLAW_DIR
nano .env

# 6. Start SuperBotijo
docker-compose up -d

# 7. Access the dashboard
open http://localhost:3000
```

---

## Prerequisites

Before deploying SuperBotijo with Docker, ensure you have:

| Requirement | Version | Notes |
|-------------|---------|-------|
| Docker | 20.10+ | Install from [docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | 2.0+ | Included with Docker Desktop |
| OpenClaw | Latest | Must be installed on the same host |
| Disk Space | 2GB+ | For Docker image and data |
| RAM | 1GB+ | For container runtime |

### OpenClaw Installation

SuperBotijo requires access to your OpenClaw installation. Make sure OpenClaw is installed and note the installation directory (usually `/root/.openclaw` or `/home/username/.openclaw`).

---

## Installation Methods

### Method 1: Docker Compose (Recommended)

This is the easiest and most maintainable way to deploy SuperBotijo.

#### Step 1: Create Project Directory

```bash
mkdir -p ~/superbotijo
cd ~/superbotijo
```

#### Step 2: Create docker-compose.yml

Download the official docker-compose file:

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/vinayakv22/SuperBotijo/main/docker-compose.yml
```

Or create it manually (see [docker-compose.yml](../docker-compose.yml) in the repository).

#### Step 3: Create Environment File

```bash
# Download the example
curl -o .env https://raw.githubusercontent.com/vinayakv22/SuperBotijo/main/.env.docker.example

# Or create manually
cat > .env << 'EOF'
# Required
ADMIN_PASSWORD=your-secure-password-here
AUTH_SECRET=your-random-32-char-secret-here

# OpenClaw paths
OPENCLAW_DIR=/root/.openclaw
OPENCLAW_WORKSPACE=/root/.openclaw/workspace

# Optional branding
NEXT_PUBLIC_AGENT_NAME=SuperBotijo
NEXT_PUBLIC_AGENT_EMOJI=🫙
EOF
```

#### Step 4: Generate Secrets

```bash
# Generate a strong password
echo "ADMIN_PASSWORD=$(openssl rand -base64 24)"

# Generate auth secret
echo "AUTH_SECRET=$(openssl rand -base64 32)"
```

Add these values to your `.env` file.

#### Step 5: Configure OpenClaw Path

Edit `.env` and set `OPENCLAW_DIR` to your OpenClaw installation directory:

```bash
# For standard installation
OPENCLAW_DIR=/root/.openclaw

# For custom installation
OPENCLAW_DIR=/home/username/.openclaw

# For CasaOS
OPENCLAW_DIR=/DATA/AppData/openclaw
```

#### Step 6: Start the Container

```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

#### Step 7: Access SuperBotijo

Open your browser and navigate to:
```
http://localhost:3000
```

Login with your `ADMIN_PASSWORD`.

---

### Method 2: Docker Run

If you prefer not to use Docker Compose, you can run SuperBotijo directly with Docker:

```bash
# Pull the latest image
docker pull ghcr.io/vinayakv22/superbotijo:latest

# Run the container
docker run -d \
  --name superbotijo \
  --restart unless-stopped \
  -p 3000:3000 \
  -e ADMIN_PASSWORD="your-secure-password" \
  -e AUTH_SECRET="your-random-32-char-secret" \
  -e OPENCLAW_DIR="/openclaw" \
  -v /root/.openclaw:/openclaw:rw \
  -v superbotijo-data:/app/data \
  ghcr.io/vinayakv22/superbotijo:latest
```

**Important:** Replace `/root/.openclaw` with your actual OpenClaw directory path.

---

### Method 3: CasaOS Integration

SuperBotijo is designed to integrate seamlessly with CasaOS.

#### Using CasaOS App Store (if available)

1. Open CasaOS dashboard
2. Go to App Store
3. Search for "SuperBotijo"
4. Click Install
5. Configure environment variables in the UI
6. Start the app

#### Manual Import

1. Download the CasaOS-specific compose file:

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/vinayakv22/SuperBotijo/main/docker-compose.casaos.yml
```

2. In CasaOS dashboard, go to **App Store** → **Custom Install**

3. Upload the `docker-compose.yml` file

4. Configure required environment variables in the CasaOS UI:
   - `ADMIN_PASSWORD`: Your secure password
   - `AUTH_SECRET`: 32-character random string
   - `OPENCLAW_DIR`: Path to OpenClaw (default: `/DATA/AppData/openclaw`)

5. Click **Install**

6. Access via the CasaOS dashboard or directly at `http://your-server-ip:3000`

#### CasaOS-Specific Notes

- Default OpenClaw path: `/DATA/AppData/openclaw`
- Data is stored in Docker volumes for persistence
- Resource limits are pre-configured (2GB RAM, 2 CPU cores)
- Health checks are enabled for monitoring

---

## Configuration

### Environment Variables

SuperBotijo is configured entirely through environment variables. See the full list in [Environment Variables](#environment-variables) section below.

### Custom Branding

Customize the dashboard appearance by setting these environment variables:

```env
NEXT_PUBLIC_AGENT_NAME=MyAgent
NEXT_PUBLIC_AGENT_EMOJI=🤖
NEXT_PUBLIC_AGENT_DESCRIPTION=My AI Assistant
NEXT_PUBLIC_AGENT_LOCATION=San Francisco, CA
NEXT_PUBLIC_OWNER_USERNAME=myusername
```

### Weather Widget

Configure location for the weather widget:

```env
WEATHER_LAT=37.7749
WEATHER_LON=-122.4194
WEATHER_CITY=San Francisco
WEATHER_TIMEZONE=America/Los_Angeles
```

Find coordinates at [latlong.net](https://www.latlong.net/)
Find timezone at [Wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

---

## Volume Mounts

SuperBotijo requires two volume mounts:

### 1. OpenClaw Directory (Required)

**Host Path:** Your OpenClaw installation directory
**Container Path:** `/openclaw`
**Mode:** Read-Write (`rw`)

```yaml
volumes:
  - /root/.openclaw:/openclaw:rw
```

This gives SuperBotijo access to:
- `openclaw.json` - Agent configuration
- `workspace/` - Agent workspaces and sessions
- `media/` - Media files
- All sub-agent workspaces

### 2. Application Data (Required)

**Volume Name:** `superbotijo-data`
**Container Path:** `/app/data`
**Mode:** Read-Write

```yaml
volumes:
  - superbotijo-data:/app/data
```

This stores:
- SQLite databases (usage tracking, kanban)
- JSON configuration files
- Application state

**Note:** This is a Docker named volume, which persists across container restarts.

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Dashboard login password | `my-secure-password-2024` |
| `AUTH_SECRET` | Session token secret (32 chars) | `abcd1234...` (use `openssl rand -base64 32`) |

### OpenClaw Integration

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCLAW_DIR` | Path to OpenClaw installation | `/openclaw` (inside container) |
| `OPENCLAW_WORKSPACE` | Path to main workspace | `${OPENCLAW_DIR}/workspace` |

**Important:** The `OPENCLAW_DIR` inside the container is always `/openclaw`. The host path is configured in the volume mount.

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `WEATHER_LAT` | Latitude for weather | `40.4168` |
| `WEATHER_LON` | Longitude for weather | `-3.7038` |
| `WEATHER_CITY` | City name | `Madrid` |
| `WEATHER_TIMEZONE` | Timezone | `Europe/Madrid` |
| `KANBAN_AGENT_KEYS` | Agent API keys for Kanban | (empty) |

### Branding Variables (Public)

All `NEXT_PUBLIC_*` variables are safe to set (no secrets):

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_AGENT_NAME` | Agent display name | `SuperBotijo` |
| `NEXT_PUBLIC_AGENT_EMOJI` | Agent emoji | `🫙` |
| `NEXT_PUBLIC_AGENT_DESCRIPTION` | Agent description | `Your AI co-pilot, powered by OpenClaw` |
| `NEXT_PUBLIC_AGENT_LOCATION` | Location | (empty) |
| `NEXT_PUBLIC_BIRTH_DATE` | Birth date | (empty) |
| `NEXT_PUBLIC_OWNER_USERNAME` | Owner username | `your-username` |
| `NEXT_PUBLIC_OWNER_EMAIL` | Owner email | `your-email@example.com` |
| `NEXT_PUBLIC_COMPANY_NAME` | Company name | `SUPERBOTIJO, INC.` |
| `NEXT_PUBLIC_APP_TITLE` | Browser title | `SuperBotijo` |

---

## Building Your Own Image

If you want to build the Docker image yourself:

### Clone the Repository

```bash
git clone https://github.com/vinayakv22/SuperBotijo.git
cd SuperBotijo
```

### Build the Image

```bash
# Build for your platform
docker build -t superbotijo:local .

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t superbotijo:local \
  .
```

### Run Your Custom Image

```bash
docker run -d \
  --name superbotijo \
  -p 3000:3000 \
  -e ADMIN_PASSWORD="your-password" \
  -e AUTH_SECRET="your-secret" \
  -v /root/.openclaw:/openclaw:rw \
  -v superbotijo-data:/app/data \
  superbotijo:local
```

---

## Troubleshooting

### Container Won't Start

**Issue:** Container exits immediately after starting

**Solution:**
```bash
# Check logs
docker-compose logs superbotijo

# Common causes:
# 1. Missing ADMIN_PASSWORD or AUTH_SECRET
# 2. OpenClaw directory not accessible
# 3. Port 3000 already in use
```

### Permission Denied Errors

**Issue:** Container can't read OpenClaw directory

**Solution:**
```bash
# Make OpenClaw directory readable
chmod -R 755 /root/.openclaw

# If still having issues, check SELinux (on RHEL/CentOS)
setenforce 0  # Temporarily disable
# Or add the correct SELinux context
chcon -Rt svirt_sandbox_file_t /root/.openclaw
```

### OpenClaw Not Found

**Issue:** Dashboard shows "OpenClaw not found"

**Solution:**
1. Verify OpenClaw is installed on the host
2. Check the `OPENCLAW_DIR` environment variable matches your installation
3. Verify the volume mount in docker-compose.yml points to the correct host path
4. Restart the container: `docker-compose restart`

### Database Errors

**Issue:** SQLite database errors or "database locked"

**Solution:**
```bash
# Stop the container
docker-compose down

# Remove the data volume
docker volume rm superbotijo-data

# Start fresh
docker-compose up -d
```

### Port Already in Use

**Issue:** Port 3000 is already allocated

**Solution:**
```bash
# Option 1: Stop the conflicting service
# Find what's using port 3000
sudo lsof -i :3000
sudo kill -9 <PID>

# Option 2: Use a different port
# Edit docker-compose.yml
ports:
  - "8080:3000"  # Map to port 8080 instead
```

### Memory Issues

**Issue:** Container running out of memory

**Solution:**

Add resource limits to docker-compose.yml:
```yaml
services:
  superbotijo:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M
```

### Health Check Failing

**Issue:** Container shows unhealthy status

**Solution:**
```bash
# Check the health endpoint directly
docker exec superbotijo curl http://localhost:3000/api/health

# View detailed logs
docker-compose logs -f superbotijo

# Disable health check temporarily (for debugging)
# Comment out the healthcheck section in docker-compose.yml
```

---

## Security Considerations

### 1. Strong Passwords

Always use strong passwords:
```bash
# Generate a secure password
openssl rand -base64 24
```

Minimum 16 characters recommended.

### 2. Secrets Management

**Never commit secrets to git!**

- Use `.env` file (gitignored)
- Use Docker secrets (for Swarm)
- Use external secrets management (Vault, etc.)

### 3. File Permissions

The container runs as a non-root user (`nextjs:nodejs`, UID 1001).

If you have permission issues, you can:
```bash
# Option 1: Make OpenClaw readable by all
chmod -R 755 /root/.openclaw

# Option 2: Change ownership to match container user
chown -R 1001:1001 /root/.openclaw
```

### 4. Network Security

The container exposes port 3000. For production:

- Use a reverse proxy (Caddy, nginx, Traefik)
- Enable HTTPS
- Restrict access with firewall rules
- Consider using Docker networks

Example Caddy reverse proxy:
```caddyfile
superbotijo.yourdomain.com {
    reverse_proxy superbotijo:3000
}
```

### 5. Updates

Keep the image updated:
```bash
# Pull latest image
docker-compose pull

# Restart with new image
docker-compose up -d
```

---

## Updates and Maintenance

### Updating SuperBotijo

To update to the latest version:

```bash
# Pull the latest image
docker-compose pull

# Restart the container
docker-compose up -d

# View logs to ensure successful start
docker-compose logs -f
```

### Backing Up Data

SuperBotijo stores data in two locations:

1. **OpenClaw directory** (your responsibility to backup)
2. **Application data volume**

To backup the application data volume:

```bash
# Create backup directory
mkdir -p ~/backups

# Backup the volume
docker run --rm \
  -v superbotijo-data:/data \
  -v ~/backups:/backup \
  alpine \
  tar czf /backup/superbotijo-data-$(date +%Y%m%d).tar.gz -C /data .
```

To restore:

```bash
# Stop the container
docker-compose down

# Remove the old volume
docker volume rm superbotijo-data

# Create new volume
docker volume create superbotijo-data

# Restore backup
docker run --rm \
  -v superbotijo-data:/data \
  -v ~/backups:/backup \
  alpine \
  tar xzf /backup/superbotijo-data-YYYYMMDD.tar.gz -C /data

# Start the container
docker-compose up -d
```

### Viewing Logs

```bash
# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# Save logs to file
docker-compose logs > superbotijo.log
```

### Monitoring Resource Usage

```bash
# View resource usage
docker stats superbotijo

# View disk usage
docker system df -v
```

### Clean Up

```bash
# Stop and remove container (keeps data)
docker-compose down

# Stop and remove container + volumes (deletes data!)
docker-compose down -v

# Remove unused images
docker image prune -a

# Remove all unused resources
docker system prune -a
```

---

## Advanced Configuration

### Using a Custom Port

Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Access on port 8080
```

### Resource Limits

Add resource limits:
```yaml
services:
  superbotijo:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Using Docker Secrets

For Docker Swarm:
```yaml
services:
  superbotijo:
    secrets:
      - admin_password
      - auth_secret
    environment:
      - ADMIN_PASSWORD_FILE=/run/secrets/admin_password
      - AUTH_SECRET_FILE=/run/secrets/auth_secret

secrets:
  admin_password:
    external: true
  auth_secret:
    external: true
```

### Reverse Proxy Examples

#### Caddy

```caddyfile
superbotijo.yourdomain.com {
    reverse_proxy superbotijo:3000
}
```

#### nginx

```nginx
server {
    listen 80;
    server_name superbotijo.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Traefik

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.superbotijo.rule=Host(`superbotijo.yourdomain.com`)"
  - "traefik.http.services.superbotijo.loadbalancer.server.port=3000"
```

---

## Support

For issues, questions, or contributions:

- **GitHub Issues:** [vinayakv22/SuperBotijo/issues](https://github.com/vinayakv22/SuperBotijo/issues)
- **Documentation:** [README.md](../README.md)
- **Architecture:** [ARCHITECTURE.md](../ARCHITECTURE.md)

---

## License

MIT License - see [LICENSE](../LICENSE)

# Custom Domain Server Setup Guide (Azure VPS + Nginx + PM2)

## Overview

This document covers the server-side setup required for custom domain support on a self-hosted Azure VPS infrastructure using Nginx as reverse proxy and Let's Encrypt (Certbot) for SSL certificates.

**Routing Approach:** Nginx handles all custom domain routing by rewriting URLs to include the business slug. No Next.js middleware changes required - zero risk to existing platform functionality.

## How It Works

```
Customer visits: shop.example.com/products
                        ↓
                     Nginx
                        ↓ (rewrites URL to /business-slug/products)
                   Next.js
                        ↓ (sees normal storefront request)
                  Page served
                        ↓
Browser shows: shop.example.com/products (URL never changes)
```

- **No redirects** - URL stays as customer's custom domain
- **No flash/delay** - Nginx rewrite is internal (microseconds)
- **No Next.js changes** - Platform code unchanged

## Prerequisites

- Azure VPS with Ubuntu 22.04 LTS (or similar)
- Nginx installed and configured as reverse proxy
- PM2 managing the Next.js application
- Root/sudo access to the server
- Domain pointed to server IP (for main waveorder.app domain)

## Architecture

```
Customer Browser
       │
       ▼
┌─────────────────┐
│     Nginx       │  ← SSL termination + URL rewriting
│  (Port 80/443)  │
└────────┬────────┘
         │ (rewritten URL: /business-slug/path)
         ▼
┌─────────────────┐
│   Next.js App   │  ← Sees normal storefront request
│   (Port 3000)   │
└─────────────────┘
```

## Server-Side Components

### 1. Directory Structure

```bash
/etc/nginx/
├── nginx.conf                    # Main Nginx config
├── sites-available/
│   ├── waveorder.app             # Main domain config
│   └── custom-domains/           # Auto-generated custom domain configs
│       ├── shop.example.com.conf
│       └── store.mybusiness.com.conf
├── sites-enabled/                # Symlinks to active configs
└── ssl/
    └── custom-domains/           # SSL certificates for custom domains
        ├── shop.example.com/
        │   ├── fullchain.pem
        │   └── privkey.pem
        └── store.mybusiness.com/
            ├── fullchain.pem
            └── privkey.pem

/opt/waveorder/
├── scripts/
│   ├── provision-domain.sh       # Main provisioning script
│   ├── remove-domain.sh          # Domain removal script
│   ├── verify-dns.sh             # DNS verification helper
│   └── renew-certificates.sh     # SSL renewal script
└── logs/
    └── domain-provisioning.log   # Provisioning logs
```

### 2. Main Nginx Configuration

**File: `/etc/nginx/sites-available/waveorder.app`**

```nginx
# Main WaveOrder Application
server {
    listen 80;
    server_name waveorder.app www.waveorder.app;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name waveorder.app www.waveorder.app;
    
    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/waveorder.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/waveorder.app/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 3. Custom Domain Nginx Template (KEY FILE)

**File: `/opt/waveorder/scripts/templates/custom-domain.conf.template`**

This is the critical template that rewrites URLs to include the business slug:

```nginx
# Custom Domain: {{DOMAIN}}
# Business Slug: {{SLUG}}
# Generated: {{DATE}}

server {
    listen 80;
    server_name {{DOMAIN}} www.{{DOMAIN}};
    
    # ACME Challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://{{DOMAIN}}$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name {{DOMAIN}} www.{{DOMAIN}};
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/custom-domains/{{DOMAIN}}/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/custom-domains/{{DOMAIN}}/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # ===========================================
    # URL REWRITING - The Magic Happens Here
    # ===========================================
    # Rewrites /anything → /{{SLUG}}/anything
    # Browser URL stays as {{DOMAIN}}/anything
    # Next.js sees /{{SLUG}}/anything (normal storefront request)
    
    # Handle root path specially (/ → /{{SLUG}})
    location = / {
        proxy_pass http://127.0.0.1:3000/{{SLUG}};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Custom-Domain {{DOMAIN}};
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files - pass through without rewriting
    location /_next/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # API routes - pass through without rewriting
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Images and static assets - pass through
    location /images/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
    }
    
    # All other paths - rewrite to include business slug
    location / {
        # Rewrite /path → /{{SLUG}}/path
        rewrite ^/(.+)$ /{{SLUG}}/$1 break;
        
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Custom-Domain {{DOMAIN}};
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Domain Provisioning Script

**File: `/opt/waveorder/scripts/provision-domain.sh`**

```bash
#!/bin/bash
# Domain Provisioning Script for WaveOrder Custom Domains
# Usage: ./provision-domain.sh <domain> <business_slug>

set -e

DOMAIN=$1
SLUG=$2
LOG_FILE="/opt/waveorder/logs/domain-provisioning.log"
NGINX_CUSTOM_DIR="/etc/nginx/sites-available/custom-domains"
SSL_DIR="/etc/nginx/ssl/custom-domains"
CERTBOT_WEBROOT="/var/www/certbot"
TEMPLATE="/opt/waveorder/scripts/templates/custom-domain.conf.template"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Validate inputs
if [ -z "$DOMAIN" ] || [ -z "$SLUG" ]; then
    log "ERROR: Usage: $0 <domain> <business_slug>"
    exit 1
fi

log "Starting provisioning for domain: $DOMAIN (slug: $SLUG)"

# Create directories if they don't exist
mkdir -p "$NGINX_CUSTOM_DIR"
mkdir -p "$SSL_DIR/$DOMAIN"
mkdir -p "$CERTBOT_WEBROOT/.well-known/acme-challenge"

# Step 1: Create initial Nginx config (HTTP only for ACME challenge)
log "Creating initial Nginx config for ACME challenge..."
cat > "$NGINX_CUSTOM_DIR/$DOMAIN.conf" << EOF
# Temporary config for ACME challenge - $DOMAIN
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 503 "Domain setup in progress";
    }
}
EOF

# Enable the site
ln -sf "$NGINX_CUSTOM_DIR/$DOMAIN.conf" "/etc/nginx/sites-enabled/$DOMAIN.conf"

# Test and reload Nginx
log "Testing Nginx configuration..."
nginx -t
systemctl reload nginx

# Step 2: Obtain SSL certificate using Certbot
log "Obtaining SSL certificate from Let's Encrypt..."
certbot certonly \
    --webroot \
    --webroot-path="$CERTBOT_WEBROOT" \
    --domain "$DOMAIN" \
    --domain "www.$DOMAIN" \
    --email admin@waveorder.app \
    --agree-tos \
    --non-interactive \
    --keep-until-expiring \
    2>&1 | tee -a "$LOG_FILE"

# Check if certificate was obtained
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    log "ERROR: Failed to obtain SSL certificate"
    # Clean up
    rm -f "/etc/nginx/sites-enabled/$DOMAIN.conf"
    rm -f "$NGINX_CUSTOM_DIR/$DOMAIN.conf"
    systemctl reload nginx
    exit 1
fi

# Step 3: Copy certificates to custom location
log "Setting up SSL certificates..."
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/$DOMAIN/"
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/$DOMAIN/"
chmod 600 "$SSL_DIR/$DOMAIN/privkey.pem"

# Step 4: Generate full Nginx config from template with URL rewriting
log "Generating full Nginx configuration with URL rewriting..."
sed -e "s/{{DOMAIN}}/$DOMAIN/g" \
    -e "s/{{SLUG}}/$SLUG/g" \
    -e "s/{{DATE}}/$(date '+%Y-%m-%d %H:%M:%S')/g" \
    "$TEMPLATE" > "$NGINX_CUSTOM_DIR/$DOMAIN.conf"

# Step 5: Test and reload Nginx
log "Testing and reloading Nginx..."
nginx -t
systemctl reload nginx

log "SUCCESS: Domain $DOMAIN provisioned successfully!"
log "URL rewriting configured: $DOMAIN/* → /$SLUG/*"
log "SSL certificate expires: $(openssl x509 -enddate -noout -in "$SSL_DIR/$DOMAIN/fullchain.pem" | cut -d= -f2)"

exit 0
```

### 5. Domain Removal Script

**File: `/opt/waveorder/scripts/remove-domain.sh`**

```bash
#!/bin/bash
# Domain Removal Script for WaveOrder Custom Domains
# Usage: ./remove-domain.sh <domain>

set -e

DOMAIN=$1
LOG_FILE="/opt/waveorder/logs/domain-provisioning.log"
NGINX_CUSTOM_DIR="/etc/nginx/sites-available/custom-domains"
SSL_DIR="/etc/nginx/ssl/custom-domains"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

if [ -z "$DOMAIN" ]; then
    log "ERROR: Usage: $0 <domain>"
    exit 1
fi

log "Starting removal for domain: $DOMAIN"

# Remove Nginx config
if [ -f "/etc/nginx/sites-enabled/$DOMAIN.conf" ]; then
    rm -f "/etc/nginx/sites-enabled/$DOMAIN.conf"
    log "Removed symlink from sites-enabled"
fi

if [ -f "$NGINX_CUSTOM_DIR/$DOMAIN.conf" ]; then
    rm -f "$NGINX_CUSTOM_DIR/$DOMAIN.conf"
    log "Removed Nginx config"
fi

# Remove SSL certificates
if [ -d "$SSL_DIR/$DOMAIN" ]; then
    rm -rf "$SSL_DIR/$DOMAIN"
    log "Removed SSL certificates"
fi

# Optionally revoke Let's Encrypt certificate
# certbot revoke --cert-path "/etc/letsencrypt/live/$DOMAIN/cert.pem" --non-interactive || true

# Reload Nginx
nginx -t && systemctl reload nginx

log "SUCCESS: Domain $DOMAIN removed successfully!"

exit 0
```

### 6. DNS Verification Script

**File: `/opt/waveorder/scripts/verify-dns.sh`**

```bash
#!/bin/bash
# DNS Verification Script
# Usage: ./verify-dns.sh <domain> <expected_ip>

DOMAIN=$1
EXPECTED_IP=$2
SERVER_IP=$(curl -s ifconfig.me)

if [ -z "$EXPECTED_IP" ]; then
    EXPECTED_IP=$SERVER_IP
fi

echo "Checking DNS for: $DOMAIN"
echo "Expected IP: $EXPECTED_IP"
echo "---"

# Check A record
A_RECORD=$(dig +short A "$DOMAIN" | head -1)
echo "A Record: $A_RECORD"

if [ "$A_RECORD" == "$EXPECTED_IP" ]; then
    echo "✓ A record correctly points to server"
    A_OK=1
else
    echo "✗ A record does not match (expected: $EXPECTED_IP)"
    A_OK=0
fi

# Check www subdomain
WWW_RECORD=$(dig +short A "www.$DOMAIN" | head -1)
echo "www A Record: $WWW_RECORD"

# Check propagation from multiple DNS servers
echo "---"
echo "Checking propagation from public DNS servers:"
for DNS in "8.8.8.8" "1.1.1.1" "9.9.9.9"; do
    RESULT=$(dig +short @$DNS A "$DOMAIN" | head -1)
    if [ "$RESULT" == "$EXPECTED_IP" ]; then
        echo "  $DNS: ✓ $RESULT"
    else
        echo "  $DNS: ✗ $RESULT (expected: $EXPECTED_IP)"
    fi
done

if [ "$A_OK" == "1" ]; then
    exit 0
else
    exit 1
fi
```

### 7. SSL Renewal Script (Cron)

**File: `/opt/waveorder/scripts/renew-certificates.sh`**

```bash
#!/bin/bash
# SSL Certificate Renewal Script
# Run via cron: 0 3 * * * /opt/waveorder/scripts/renew-certificates.sh

LOG_FILE="/opt/waveorder/logs/ssl-renewal.log"
SSL_DIR="/etc/nginx/ssl/custom-domains"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting SSL certificate renewal check..."

# Renew all Let's Encrypt certificates
certbot renew --quiet 2>&1 | tee -a "$LOG_FILE"

# Copy renewed certificates to custom SSL directory
for DOMAIN_DIR in /etc/letsencrypt/live/*/; do
    DOMAIN=$(basename "$DOMAIN_DIR")
    
    # Skip default domain
    if [ "$DOMAIN" == "waveorder.app" ]; then
        continue
    fi
    
    if [ -d "$SSL_DIR/$DOMAIN" ]; then
        log "Updating certificates for: $DOMAIN"
        cp "$DOMAIN_DIR/fullchain.pem" "$SSL_DIR/$DOMAIN/"
        cp "$DOMAIN_DIR/privkey.pem" "$SSL_DIR/$DOMAIN/"
        chmod 600 "$SSL_DIR/$DOMAIN/privkey.pem"
    fi
done

# Reload Nginx to pick up new certificates
nginx -t && systemctl reload nginx

log "SSL renewal check completed"
```

### 8. Cron Jobs Setup

Add to `/etc/crontab` or use `crontab -e`:

```cron
# SSL Certificate Renewal - Daily at 3 AM
0 3 * * * root /opt/waveorder/scripts/renew-certificates.sh

# Clean up old logs - Weekly
0 0 * * 0 root find /opt/waveorder/logs -name "*.log" -mtime +30 -delete
```

### 9. Initial Server Setup Commands

Run these commands once to set up the server:

```bash
# Create directories
sudo mkdir -p /opt/waveorder/scripts/templates
sudo mkdir -p /opt/waveorder/logs
sudo mkdir -p /etc/nginx/sites-available/custom-domains
sudo mkdir -p /etc/nginx/ssl/custom-domains
sudo mkdir -p /var/www/certbot/.well-known/acme-challenge

# Set permissions
sudo chown -R www-data:www-data /var/www/certbot
sudo chmod +x /opt/waveorder/scripts/*.sh

# Install Certbot if not installed
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Include custom domains directory in Nginx
# Add this line to /etc/nginx/nginx.conf inside http block:
# include /etc/nginx/sites-available/custom-domains/*.conf;
```

### 10. API Integration

The WaveOrder platform calls these scripts via local execution (since the Next.js app runs on the same server):

```typescript
// In /src/lib/domain-provisioning.ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function provisionDomain(domain: string, slug: string) {
  const { stdout, stderr } = await execAsync(
    `sudo /opt/waveorder/scripts/provision-domain.sh ${domain} ${slug}`
  )
  return { stdout, stderr }
}

async function removeDomain(domain: string) {
  const { stdout, stderr } = await execAsync(
    `sudo /opt/waveorder/scripts/remove-domain.sh ${domain}`
  )
  return { stdout, stderr }
}
```

### 11. Security Considerations

1. **Script Permissions**: Only root can execute provisioning scripts
2. **Input Validation**: Always validate domain format before passing to scripts
3. **Rate Limiting**: Limit domain provisioning to prevent abuse
4. **Logging**: All operations logged for audit trail
5. **Backup**: Regular backup of Nginx configs and SSL certificates

### 12. Monitoring & Alerts

Set up monitoring for:
- SSL certificate expiry (alert 14 days before)
- Nginx error logs for custom domains
- Domain provisioning failures
- Disk space for certificates

### 13. Troubleshooting

**SSL Certificate Failed:**
```bash
# Check Certbot logs
sudo cat /var/log/letsencrypt/letsencrypt.log

# Verify DNS is pointing correctly
dig +short A yourdomain.com

# Test ACME challenge path
curl http://yourdomain.com/.well-known/acme-challenge/test
```

**Nginx Errors:**
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

**Domain Not Resolving:**
```bash
# Check if config is enabled
ls -la /etc/nginx/sites-enabled/

# Check if Nginx is listening
sudo netstat -tlnp | grep nginx
```

**URL Rewriting Issues:**
```bash
# Check the generated config for a domain
cat /etc/nginx/sites-available/custom-domains/yourdomain.com.conf

# Verify the business slug is correct
# The rewrite rule should show: rewrite ^/(.+)$ /your-business-slug/$1 break;
```

## Testing the Setup

1. **Test DNS Resolution:**
   ```bash
   ./verify-dns.sh shop.example.com
   ```

2. **Test Provisioning:**
   ```bash
   ./provision-domain.sh shop.example.com my-business-slug
   ```

3. **Test URL Rewriting:**
   ```bash
   # Should show the storefront page
   curl -I https://shop.example.com/
   
   # Should show products page (internally /my-business-slug/products)
   curl -I https://shop.example.com/products
   ```

4. **Test Removal:**
   ```bash
   ./remove-domain.sh shop.example.com
   ```

## Summary

This setup provides:
- ✅ Automatic SSL provisioning via Let's Encrypt
- ✅ Nginx URL rewriting (custom domain → business slug)
- ✅ No Next.js middleware changes required
- ✅ Zero risk to existing platform functionality
- ✅ No flash or delay for users
- ✅ Automatic certificate renewal
- ✅ Logging and monitoring
- ✅ Security best practices

The key is the Nginx `rewrite` rule that transforms:
- `shop.example.com/` → `/business-slug`
- `shop.example.com/products` → `/business-slug/products`
- `shop.example.com/category/food` → `/business-slug/category/food`

While keeping the browser URL as the custom domain.

#!/bin/bash
# Script to enable SSL/HTTPS for runshare.alnet.site

echo "Setting up SSL certificate for runshare.alnet.site..."

# Ensure letsencrypt webroot exists
sudo mkdir -p /var/www/letsencrypt
sudo chown -R www-data:www-data /var/www/letsencrypt

# Get SSL certificate
sudo certbot certonly --webroot -w /var/www/letsencrypt -d runshare.alnet.site --non-interactive --agree-tos -m admin@alnet.site

# Update nginx config with SSL
sudo tee /etc/nginx/sites-available/runshare.alnet.site > /dev/null << 'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name runshare.alnet.site;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name runshare.alnet.site;

    ssl_certificate /etc/letsencrypt/live/runshare.alnet.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/runshare.alnet.site/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    root /opt/project/runshare/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    gzip_min_length 256;
}
NGINX

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✓ SSL certificate obtained and nginx configured!"
echo "✓ Auto-renewal set up via certbot (runs via systemd timer)"

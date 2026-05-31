#!/bin/bash
# ============================================================
# Deploy script — Klinik App untuk Ubuntu 22.04/24.04 (VPS)
# VPS: 43.133.146.200 (Sumopod) | User: ubuntu
# Jalankan: sudo ./deploy.sh
# ============================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Load .env ────────────────────────────────────────────────
if [ ! -f .env ]; then
    error "File .env tidak ditemukan. Salin .env.prod.example ke .env dan isi dulu."
fi
export $(grep -v '^#' .env | xargs)

[ -z "$DOMAIN" ]           && error "DOMAIN belum diset di .env"
[ -z "$DB_PASSWORD" ]      && error "DB_PASSWORD belum diset di .env"
[ -z "$CERTBOT_EMAIL" ]    && error "CERTBOT_EMAIL belum diset di .env"

info "Domain: $DOMAIN"

# ── 1. Install Docker (jika belum ada) ───────────────────────
if ! command -v docker &> /dev/null; then
    info "Menginstall Docker..."
    apt-get update -qq
    apt-get install -y ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    # Tambahkan user ubuntu ke group docker agar tidak perlu sudo tiap docker command
    usermod -aG docker ubuntu 2>/dev/null || true
    info "Docker terinstall: $(docker --version)"
else
    info "Docker sudah ada: $(docker --version)"
fi

# ── 2. Pastikan port 80 & 443 tidak dipakai ──────────────────
if ss -tlnp | grep -q ':80 '; then
    warning "Port 80 sedang dipakai. Coba hentikan nginx/apache host..."
    systemctl stop nginx apache2 2>/dev/null || true
fi

# ── 3. Setup nginx config (domain sudah hardcoded, skip jika tidak ada placeholder) ──
info "Mengkonfigurasi nginx untuk domain $DOMAIN..."
if grep -q "DOMAIN_PLACEHOLDER" docker/nginx/default.conf 2>/dev/null; then
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" docker/nginx/default.conf
fi

# ── 4. Setup backend .env ─────────────────────────────────────
if [ ! -f backend/.env ]; then
    info "Membuat backend/.env dari .env.example..."
    cp backend/.env.example backend/.env

    # Generate random APP_KEY dan JWT_SECRET
    APP_KEY="base64:$(openssl rand -base64 32)"
    JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"

    sed -i "s|APP_KEY=.*|APP_KEY=$APP_KEY|" backend/.env
    sed -i "s|APP_URL=.*|APP_URL=https://$DOMAIN|" backend/.env
    sed -i "s|APP_ENV=.*|APP_ENV=production|" backend/.env
    sed -i "s|APP_DEBUG=.*|APP_DEBUG=false|" backend/.env
    sed -i "s|DB_HOST=.*|DB_HOST=postgres|" backend/.env
    sed -i "s|DB_DATABASE=.*|DB_DATABASE=${DB_DATABASE:-klinik_db}|" backend/.env
    sed -i "s|DB_USERNAME=.*|DB_USERNAME=${DB_USERNAME:-klinik_user}|" backend/.env
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" backend/.env
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env

    info "backend/.env sudah dibuat."
fi

# ── 5. Setup frontend .env ────────────────────────────────────
if [ ! -f frontend/.env.local ]; then
    info "Membuat frontend/.env.local..."
    cat > frontend/.env.local <<EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN/api/v1
EOF
fi

# ── 6. Buat direktori certbot ─────────────────────────────────
mkdir -p /var/www/certbot
mkdir -p /etc/letsencrypt

# ── 7. Build & start containers (HTTP dulu untuk certbot challenge) ──
info "Build dan start containers (HTTP mode dulu)..."

# Buat nginx config sementara yang hanya HTTP untuk certbot challenge
cat > /tmp/nginx-certbot.conf <<'NGINXEOF'
server {
    listen 80;
    server_name _;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 'Klinik App - Menunggu SSL setup...';
        add_header Content-Type text/plain;
    }
}
NGINXEOF

# Start nginx sementara pakai config HTTP-only
docker run -d --rm --name nginx_temp \
    -p 80:80 \
    -v /var/www/certbot:/var/www/certbot \
    -v /tmp/nginx-certbot.conf:/etc/nginx/conf.d/default.conf \
    nginx:alpine

# ── 8. Request SSL certificate ────────────────────────────────
info "Meminta SSL certificate dari Let's Encrypt untuk $DOMAIN..."
docker run --rm \
    -v /etc/letsencrypt:/etc/letsencrypt \
    -v /var/www/certbot:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

# Stop nginx sementara
docker stop nginx_temp

info "SSL certificate berhasil didapat!"

# ── 9. Build semua containers production ─────────────────────
info "Build semua containers (production mode)..."
docker compose -f docker-compose.prod.yml build --no-cache

# ── 10. Start semua services ──────────────────────────────────
info "Start semua services..."
docker compose -f docker-compose.prod.yml up -d

# ── 11. Tunggu PostgreSQL siap ────────────────────────────────
info "Menunggu PostgreSQL siap..."
RETRIES=30
until docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_isready -U "${DB_USERNAME:-klinik_user}" -d "${DB_DATABASE:-klinik_db}" \
    > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    sleep 2
    RETRIES=$((RETRIES-1))
done
[ $RETRIES -eq 0 ] && error "PostgreSQL tidak siap setelah 60 detik."

# ── 12. Run migrations & seed ────────────────────────────────
info "Menjalankan database migrations..."
docker compose -f docker-compose.prod.yml exec -T app \
    php artisan migrate --force --seed

# ── 13. Set storage permissions ──────────────────────────────
docker compose -f docker-compose.prod.yml exec -T app \
    chmod -R 775 storage bootstrap/cache

info "Optimasi Laravel..."
docker compose -f docker-compose.prod.yml exec -T app php artisan config:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan route:cache

# ── 14. Setup auto-renew SSL via cron ────────────────────────
info "Setup auto-renew SSL (cron harian)..."
CRON_JOB="0 3 * * * cd $(pwd) && docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot certbot/certbot renew --quiet && docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload"
(crontab -l 2>/dev/null | grep -v 'certbot renew'; echo "$CRON_JOB") | crontab -

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Klinik App berhasil di-deploy!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  URL:      ${GREEN}https://$DOMAIN${NC}"
echo -e "  Login:    ${YELLOW}admin@klinik.com${NC}"
echo -e "  Password: ${YELLOW}admin123${NC}  ← Ganti setelah login pertama!"
echo ""
echo -e "  Perintah berguna:"
echo -e "    Lihat logs:    docker compose -f docker-compose.prod.yml logs -f"
echo -e "    Restart:       docker compose -f docker-compose.prod.yml restart"
echo -e "    Stop:          docker compose -f docker-compose.prod.yml down"
echo -e "    Update app:    git pull && ./update.sh"
echo ""

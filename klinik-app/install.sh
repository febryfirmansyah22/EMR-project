#!/bin/bash
# ============================================================
# Klinik App — One-Command Install
# Jalankan: curl -fsSL [url] | sudo bash
# ============================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}►${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}!${NC} $1"; }

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Klinik App — Auto Install${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# ── 1. Install Docker ────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    info "Menginstall Docker..."
    apt-get update -qq
    apt-get install -y ca-certificates curl gnupg lsb-release 2>/dev/null
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin 2>/dev/null
    usermod -aG docker ubuntu 2>/dev/null || true
    ok "Docker terinstall"
else
    ok "Docker sudah ada"
fi

# ── 2. Clone / update repo ───────────────────────────────────
INSTALL_DIR="/opt/klinik-app"

if [ -d "$INSTALL_DIR/.git" ]; then
    info "Update repo..."
    git -C "$INSTALL_DIR" pull origin claude/confident-planck-Ww4xn 2>/dev/null || true
else
    info "Clone repo..."
    git clone -b claude/confident-planck-Ww4xn \
        https://github.com/febryfirmansyah22/EMR-project.git \
        "$INSTALL_DIR" 2>/dev/null
fi

cd "$INSTALL_DIR/klinik-app"
ok "Repo siap di $INSTALL_DIR/klinik-app"

# ── 3. Auto-generate backend .env ────────────────────────────
if [ ! -f backend/.env ]; then
    info "Membuat konfigurasi backend..."
    cp backend/.env.example backend/.env

    APP_KEY="base64:$(openssl rand -base64 32)"
    JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"
    DB_PASS="klinik$(openssl rand -hex 8)"

    # Dapatkan IP publik VPS
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")

    sed -i "s|APP_KEY=.*|APP_KEY=$APP_KEY|" backend/.env
    sed -i "s|APP_URL=.*|APP_URL=http://$PUBLIC_IP|" backend/.env
    sed -i "s|APP_ENV=.*|APP_ENV=production|" backend/.env
    sed -i "s|APP_DEBUG=.*|APP_DEBUG=false|" backend/.env
    sed -i "s|DB_HOST=.*|DB_HOST=postgres|" backend/.env
    sed -i "s|DB_DATABASE=.*|DB_DATABASE=klinik_db|" backend/.env
    sed -i "s|DB_USERNAME=.*|DB_USERNAME=klinik_user|" backend/.env
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASS|" backend/.env
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env

    # Simpan DB password ke docker-compose env
    echo "DB_PASSWORD=$DB_PASS" > .env
    ok "Konfigurasi backend selesai"
else
    ok "Konfigurasi backend sudah ada"
    # Pastikan .env untuk docker compose ada
    if [ ! -f .env ]; then
        DB_PASS=$(grep DB_PASSWORD backend/.env | cut -d= -f2)
        echo "DB_PASSWORD=$DB_PASS" > .env
    fi
fi

# ── 4. Build & start containers ──────────────────────────────
info "Build containers (ini bisa 3–5 menit pertama kali)..."
docker compose -f docker-compose.simple.yml build

info "Start semua services..."
docker compose -f docker-compose.simple.yml up -d

# ── 5. Tunggu PostgreSQL ──────────────────────────────────────
info "Menunggu database siap..."
RETRIES=30
until docker compose -f docker-compose.simple.yml exec -T postgres \
    pg_isready -U klinik_user -d klinik_db >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    printf "."
    sleep 3
    RETRIES=$((RETRIES-1))
done
echo ""
[ $RETRIES -eq 0 ] && { echo -e "${RED}Database timeout. Cek: docker compose -f docker-compose.simple.yml logs postgres${NC}"; exit 1; }
ok "Database siap"

# ── 6. Migrate & seed ────────────────────────────────────────
info "Setup database..."
docker compose -f docker-compose.simple.yml exec -T app \
    php artisan migrate --force --seed 2>/dev/null
docker compose -f docker-compose.simple.yml exec -T app \
    chmod -R 775 storage bootstrap/cache 2>/dev/null || true
docker compose -f docker-compose.simple.yml exec -T app \
    php artisan config:cache 2>/dev/null || true
ok "Database selesai di-setup"

# ── 7. Tunggu Next.js ready ──────────────────────────────────
info "Menunggu frontend siap (bisa 1–2 menit)..."
RETRIES=40
until curl -s http://localhost:3000 >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    printf "."
    sleep 3
    RETRIES=$((RETRIES-1))
done
echo ""

# Dapatkan IP publik untuk ditampilkan
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "43.133.146.200")

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   SELESAI! Klinik App sudah jalan!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  Buka di browser:"
echo -e "  ${GREEN}http://$PUBLIC_IP${NC}"
echo ""
echo -e "  Login:"
echo -e "  Email    : ${YELLOW}admin@klinik.com${NC}"
echo -e "  Password : ${YELLOW}admin123${NC}"
echo ""
echo -e "  Perintah:"
echo -e "  Logs     : cd $INSTALL_DIR/klinik-app && docker compose -f docker-compose.simple.yml logs -f"
echo -e "  Restart  : cd $INSTALL_DIR/klinik-app && docker compose -f docker-compose.simple.yml restart"
echo -e "  Stop     : cd $INSTALL_DIR/klinik-app && docker compose -f docker-compose.simple.yml down"
echo ""

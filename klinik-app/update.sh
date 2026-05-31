#!/bin/bash
# ============================================================
# Update script — pull latest code & restart containers
# ============================================================
set -e

GREEN='\033[0;32m'; NC='\033[0m'
info() { echo -e "${GREEN}[INFO]${NC} $1"; }

if [ ! -f .env ]; then
    echo "File .env tidak ditemukan."
    exit 1
fi

export $(grep -v '^#' .env | xargs)

info "Pull latest code..."
git pull origin main

info "Rebuild containers..."
docker compose -f docker-compose.prod.yml build

info "Restart services..."
docker compose -f docker-compose.prod.yml up -d

info "Run migrations..."
docker compose -f docker-compose.prod.yml exec -T app php artisan migrate --force

info "Clear & rebuild cache..."
docker compose -f docker-compose.prod.yml exec -T app php artisan config:cache
docker compose -f docker-compose.prod.yml exec -T app php artisan route:cache

info "Done! App sudah diupdate."

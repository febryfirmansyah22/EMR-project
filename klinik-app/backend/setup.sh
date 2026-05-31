#!/bin/bash

# Klinik Backend Setup Script
set -e

echo "=== Klinik Backend Setup ==="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# Install composer dependencies
echo "Installing Composer dependencies..."
composer install --optimize-autoloader

# Generate application key
echo "Generating application key..."
php artisan key:generate

# Generate JWT secret
echo "Generating JWT secret..."
php artisan jwt:secret --force

# Run migrations
echo "Running database migrations..."
php artisan migrate --force

# Run seeders
echo "Seeding database..."
php artisan db:seed --force

# Clear and cache config
echo "Optimizing..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Default super_admin credentials:"
echo "  Email: admin@klinik.com"
echo "  Password: admin123"
echo ""
echo "Start development server: php artisan serve"

#!/usr/bin/env bash
set -euo pipefail

# Ensure Laravel writable directories exist (uploads are on the Railway Volume).
mkdir -p storage/app/private/uploads storage/framework/cache/data \
  storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

# Apply schema changes before accepting requests.
php artisan migrate --force

# Cache production configuration for faster boot.
php artisan config:cache

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"

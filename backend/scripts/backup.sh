#!/bin/bash
# Genera un dump de PostgreSQL dentro del contenedor Docker.
# Uso: ./backend/scripts/backup.sh
# El archivo se guarda en backend/scripts/backups/

set -euo pipefail

CONTAINER="ecommerce-postgres"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-ecommerce}"
BACKUP_DIR="$(dirname "$0")/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "Generando backup de '$DB_NAME'..."

docker exec "$CONTAINER" \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --no-password \
  > "$BACKUP_DIR/$FILENAME"

echo "Backup guardado en: backend/scripts/backups/$FILENAME"

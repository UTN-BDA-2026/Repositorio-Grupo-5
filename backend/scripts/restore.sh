#!/bin/bash
# Restaura un dump de PostgreSQL en el contenedor Docker.
# Uso: ./backend/scripts/restore.sh <archivo.sql>
# Ejemplo: ./backend/scripts/restore.sh backend/scripts/backups/backup_ecommerce_20260609_120000.sql

set -euo pipefail

CONTAINER="ecommerce-postgres"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-ecommerce}"
DUMP_FILE="${1:-}"

if [[ -z "$DUMP_FILE" ]]; then
  echo "Error: debés pasar el archivo de backup como argumento."
  echo "Uso: $0 <archivo.sql>"
  exit 1
fi

if [[ ! -f "$DUMP_FILE" ]]; then
  echo "Error: no se encontró el archivo '$DUMP_FILE'."
  exit 1
fi

echo "Restaurando '$DUMP_FILE' en la base '$DB_NAME'..."

docker exec -i "$CONTAINER" \
  psql -U "$DB_USER" -d "$DB_NAME" \
  < "$DUMP_FILE"

echo "Restauración completada."

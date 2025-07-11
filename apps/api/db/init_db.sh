DB_FILE="db/db.sqlite"

rm -f "$DB_FILE"

sqlite3 "$DB_FILE" < db/schema.sql

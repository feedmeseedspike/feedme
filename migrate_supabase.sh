#!/bin/bash

# Set these variables before running!
SRC_DB_HOST="db.qafbcposwxopeoiuwyji.supabase.co"
SRC_DB_USER="postgres"
SRC_DB_PASS="OpDvWyoRGjHUW9C6"
SRC_DB_PORT="5432"
SRC_DB_NAME="postgres"
SRC_PROJECT_REF="qafbcposwxopeoiuwyji"
SRC_SERVICE_ROLE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZmJjcG9zd3hvcGVvaXV3eWppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzIxOTc2OSwiZXhwIjoyMDYyNzk1NzY5fQ.Pql9g65Ri_76h9xbmfl7L5CSSgSQZ4pvsemnLtLGjag"

DEST_DB_HOST="db.fyldgskqxrfmrhyluxmw.supabase.co"
DEST_DB_USER="postgres"
DEST_DB_PASS="yaBk6fBeI6P6Y8J6"
DEST_DB_PORT="5432"
DEST_DB_NAME="postgres"
DEST_PROJECT_REF="fyldgskqxrfmrhyluxmw"
DEST_SERVICE_ROLE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bGRnc2txeHJmbXJoeWx1eG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk3NTc2NiwiZXhwIjoyMDY1NTUxNzY2fQ.Bd1xAR6fCom0HpcN7ngNP_MTI-gbsU-w1EzAjUFSrqE"

# 1. Export all schema (structure, including functions, triggers, policies, etc.)
echo "Exporting all schema (structure) from source..."
PGPASSWORD=$SRC_DB_PASS pg_dump \
  -h $SRC_DB_HOST \
  -U $SRC_DB_USER \
  -p $SRC_DB_PORT \
  -d $SRC_DB_NAME \
  --schema='*' \
  --schema-only \
  --no-owner --no-privileges \
  --exclude-schema 'extensions|graphql|graphql_public|net|tiger|pgbouncer|vault|realtime|supabase_functions|storage|pg*|information_schema' \
  -f schema.sql

# 2. Export all data (all schemas)
echo "Exporting all data from source..."
PGPASSWORD=$SRC_DB_PASS pg_dump \
  -h $SRC_DB_HOST \
  -U $SRC_DB_USER \
  -p $SRC_DB_PORT \
  -d $SRC_DB_NAME \
  --schema='*' \
  --data-only \
  --no-owner --no-privileges \
  --exclude-schema 'extensions|graphql|graphql_public|net|tiger|pgbouncer|vault|realtime|supabase_functions|storage|pg*|information_schema' \
  -f data.sql

# 3. Export auth users from source
echo "Exporting auth users from source..."
supabase auth export --project-ref $SRC_PROJECT_REF --out auth_users.json --service-role-key $SRC_SERVICE_ROLE

# 4. Truncate all tables in destination (DANGEROUS: this deletes all data!)
echo "Truncating all tables in destination..."
PGPASSWORD=$DEST_DB_PASS psql \
  -h $DEST_DB_HOST \
  -U $DEST_DB_USER \
  -p $DEST_DB_PORT \
  -d $DEST_DB_NAME \
  -c "DO \$\$ DECLARE
    r RECORD;
  BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'extensions', 'graphql', 'graphql_public', 'net', 'tiger', 'pgbouncer', 'vault', 'realtime', 'supabase_functions', 'storage')) LOOP
      EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
  END \$\$;"

# 5. Import schema into destination
echo "Importing schema into destination..."
PGPASSWORD=$DEST_DB_PASS psql \
  -h $DEST_DB_HOST \
  -U $DEST_DB_USER \
  -p $DEST_DB_PORT \
  -d $DEST_DB_NAME \
  -f schema.sql

# 6. Import data into destination
echo "Importing data into destination..."
PGPASSWORD=$DEST_DB_PASS psql \
  -h $DEST_DB_HOST \
  -U $DEST_DB_USER \
  -p $DEST_DB_PORT \
  -d $DEST_DB_NAME \
  -f data.sql

# 7. Import auth users into destination
echo "Importing auth users into destination..."
supabase auth import --project-ref $DEST_PROJECT_REF --file auth_users.json --service-role-key $DEST_SERVICE_ROLE

# 8. (Optional) Migrate storage buckets/files
echo "If you use Supabase Storage, run your storage migration script here (e.g., python3 migrate_storage.py or node migrate_storage.js)."

echo "Migration complete!"
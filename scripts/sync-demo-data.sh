#!/usr/bin/env bash
set -euo pipefail

# Copies releases + demo CRM data (leads, notes, activities, follow-ups/calendar,
# show bookings, contact queries, WhatsApp lists/templates) from the LOCAL db
# to the LIVE db. Refuses to run if any of those tables already has rows on live.
# Never touches admins, auths, site settings, blog, social or invoices.

REMOTE="root@oc"
REMOTE_ENV="/root/alibaba/server/.env"
TABLES=(releases leads contact_queries show_bookings lead_notes follow_ups
  lead_activities wa_templates wa_broadcast_lists wa_broadcast_list_members)

log() { echo -e "\033[0;32m$1\033[0m"; }
err() { echo -e "\033[0;31m$1\033[0m"; }

cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.."
LOCAL_URL=$(grep '^DATABASE_URL=' apps/api/.env | cut -d= -f2-)
DUMP="$(mktemp -t demo-data).sql"

log "📥 Dumping ${#TABLES[@]} tables from local db..."
pg_dump "$LOCAL_URL" --data-only --no-owner --no-privileges --column-inserts \
  $(printf -- '-t public.%s ' "${TABLES[@]}") >"$DUMP"

# Load into FK-free temp staging tables first (no superuser needed), remap
# local admin ids to the live admin, then copy into the real tables in FK order.
{
  echo "BEGIN;"
  for t in "${TABLES[@]}"; do
    echo "CREATE TEMP TABLE stage_$t (LIKE public.$t INCLUDING DEFAULTS) ON COMMIT DROP;"
  done
  grep -v -E "^(SET |SELECT pg_catalog.set_config)" "$DUMP" |
    sed -E 's/^INSERT INTO public\.([a-z_]+) /INSERT INTO stage_\1 /'
  echo "UPDATE stage_leads SET assigned_to = (SELECT min(id) FROM public.admins) WHERE assigned_to IS NOT NULL;"
  for t in lead_notes lead_activities; do
    echo "UPDATE stage_$t SET admin_id = (SELECT min(id) FROM public.admins) WHERE admin_id IS NOT NULL;"
  done
  for t in "${TABLES[@]}"; do
    echo "INSERT INTO public.$t SELECT * FROM stage_$t;"
    [ "$t" = wa_broadcast_list_members ] && continue # composite PK, no serial id
    echo "SELECT setval(pg_get_serial_sequence('public.$t','id'), COALESCE((SELECT max(id) FROM public.$t),0)+1, false);"
  done
  echo "COMMIT;"
} >"$DUMP.final"

log "🔎 Checking live tables are empty..."
COUNT_SQL="SELECT 0"
for t in "${TABLES[@]}"; do COUNT_SQL+=" + (SELECT count(*) FROM public.$t)"; done
EXISTING=$(ssh "$REMOTE" "psql \"\$(grep '^DATABASE_URL=' $REMOTE_ENV | cut -d= -f2-)\" -Atc \"$COUNT_SQL\"")
if [ "$EXISTING" != "0" ]; then
  err "❌ Live db already has $EXISTING rows in these tables — aborting, nothing changed."
  exit 1
fi

log "📤 Loading into live db (single transaction)..."
ssh "$REMOTE" "psql \"\$(grep '^DATABASE_URL=' $REMOTE_ENV | cut -d= -f2-)\" -v ON_ERROR_STOP=1 -q" <"$DUMP.final"

log "📊 Live row counts:"
for t in "${TABLES[@]}"; do
  ssh "$REMOTE" "psql \"\$(grep '^DATABASE_URL=' $REMOTE_ENV | cut -d= -f2-)\" -Atc \"SELECT '$t', count(*) FROM public.$t\""
done
rm -f "$DUMP" "$DUMP.final"
log "✅ Demo data synced"

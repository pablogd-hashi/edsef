# Publishing / sharing this repository

This app is meant to be self-hosted. **Do not commit personal family data.**

## Never commit

| Path / data | Why |
|-------------|-----|
| `.env` | Database passwords, `AUTH_SECRET`, LAN URLs |
| `storage/` | Photos, videos, exports |
| `backups/` | Database dumps + media archives |
| Personal seed content | Real names, addresses, stories |

These are already in `.gitignore` for `.env` and `/storage/`.

## Clean git history before making public

If you previously committed personal data:

```bash
# Check for leaks
git grep -i "bianca\|amsterdam\|diemen" || echo "No matches in tracked files"

# Ensure storage and .env are not tracked
git ls-files storage .env
```

If old demo seed data was committed, it may still exist in git history. For a public fork, consider a fresh repo or history rewrite.

## Production checklist

1. `ALLOW_REGISTRATION=true` only until you create your account
2. Then set `ALLOW_REGISTRATION=false` in `.env`
3. Use strong `POSTGRES_PASSWORD` and `AUTH_SECRET`
4. Run `./scripts/prod/backup.sh` regularly — backups stay local

## Fresh database (removes old demo data)

```bash
docker compose -f docker-compose.prod.yml --env-file .env down -v
./scripts/prod/setup-mac.sh
# Register at /register, add children from dashboard
```

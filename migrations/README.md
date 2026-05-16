# AI Impact Maine D1 Migrations

Use `schema.sql` for a brand-new database.

Use these migration files for an existing production database, in number order. Run each file once, then confirm a row exists in `migration_versions`.

SQLite/D1 does not support `ALTER TABLE ADD COLUMN IF NOT EXISTS`. Column migrations must be run only after checking the column is missing with:

```sql
SELECT name FROM pragma_table_info('engagements');
```

Table and index migrations use `IF NOT EXISTS` and are safe to re-run.


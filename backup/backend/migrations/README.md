# Database Migrations

This directory contains database migrations for the Flattr application.

## Migration Naming Convention

Migrations follow the format: `YYYYMMDDHHMMSS_descriptive_name.sql`

## How to Run Migrations

Migrations can be applied using the Supabase CLI:

```bash
supabase db push
```

This will apply any pending migrations to your Supabase database.

## Creating a New Migration

To create a new migration:

```bash
supabase migration new your_migration_name
```

This will create a new timestamp-prefixed migration file in the Supabase migrations directory. 
After adding your SQL statements to this file, move it to this backend/migrations directory 
for better organization and tracking in your repository.

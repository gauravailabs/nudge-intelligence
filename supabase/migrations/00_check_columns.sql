-- Run this first to see what columns currently exist
SELECT column_name, data_type, is_nullable, column_default
FROM   information_schema.columns
WHERE  table_name IN ('account_plan_versions', 'account_context_sections')
ORDER  BY table_name, ordinal_position;

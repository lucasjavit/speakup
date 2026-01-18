-- Enable useful PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL extensions initialized successfully';
END $$;

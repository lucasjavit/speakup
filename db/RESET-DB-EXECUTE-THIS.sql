-- ============================================================================
-- IMPORTANTE: Você DEVE estar conectado no banco "postgres", NÃO no "speakup"!
-- ============================================================================
-- No DBeaver/pgAdmin:
-- 1. Clique com botão direito na conexão PostgreSQL
-- 2. Selecione "postgres" database (NÃO "speakup")
-- 3. Abra Query Tool / SQL Editor
-- 4. Execute este script
-- ============================================================================

-- Terminar todas as conexões ativas no banco speakup
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'speakup'
  AND pid <> pg_backend_pid();

-- Dropar e recriar o banco (só funciona se estiver conectado no "postgres")
DROP DATABASE IF EXISTS speakup;
CREATE DATABASE speakup;

-- ✓ Pronto! Agora inicie o backend que todas as migrations serão aplicadas

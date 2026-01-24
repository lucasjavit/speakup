# Como Resetar o Banco de Dados

## Opção 1: Via pgAdmin (Docker) - RECOMENDADO

### 1. Iniciar o pgAdmin (se não estiver rodando)
```bash
cd backend
docker-compose --profile debug up -d pgadmin
```

### 2. Acessar o pgAdmin
- Abra: http://localhost:5050
- Email: `admin@speakup.local`
- Password: `admin123`

### 3. Adicionar Servidor PostgreSQL
1. Clique com botão direito em "Servers" → "Register" → "Server"
2. Na aba **General**:
   - Name: `SpeakUp Local`
3. Na aba **Connection**:
   - Host: `postgres` (nome do container Docker)
   - Port: `5432`
   - Maintenance database: `postgres`
   - Username: `speakup`
   - Password: `speakup123`
   - Save password: ✓ (marque)
4. Clique em **Save**

### 4. Executar o Reset
1. Expanda: Servers → SpeakUp Local → Databases
2. Clique com botão direito em `postgres` database
3. Selecione **Query Tool**
4. Cole e execute:

```sql
-- Terminar conexões
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'speakup'
  AND pid <> pg_backend_pid();

-- Recriar banco
DROP DATABASE IF EXISTS speakup;
CREATE DATABASE speakup;
```

5. Clique no botão **Execute (▶)** ou pressione `F5`

---

## Opção 2: Via Docker CLI (Terminal)

```bash
# Execute este comando no terminal
docker exec -i speakup-postgres psql -U speakup -d postgres << 'EOF'
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'speakup'
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS speakup;
CREATE DATABASE speakup;
EOF
```

---

## Opção 3: Via DBeaver (se preferir)

### Credenciais:
- Host: `localhost`
- Port: `5432`
- Database: `postgres` (conecte aqui, não no speakup)
- Username: `speakup`
- Password: `speakup123`

### Execute o script:
```sql
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'speakup'
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS speakup;
CREATE DATABASE speakup;
```

---

## Depois do Reset

1. Inicie o backend (Spring Boot)
2. Todas as migrations (V1 a V13) serão aplicadas automaticamente
3. O sistema estará limpo com os 4 novos níveis!

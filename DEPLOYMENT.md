# 🚀 SpeakUp - Deployment Guide

## 📋 Environment Variables Configuration

### Local Development (usando arquivo .env)

O Spring Boot **não lê** arquivos `.env` automaticamente. Para desenvolvimento local, você tem duas opções:

#### Opção 1: Usar application-dev.yml (Atual - Recomendada)
O arquivo `application-dev.yml` já contém valores padrão para desenvolvimento:

```bash
# No arquivo .env, garanta que o profile está como 'dev'
SPRING_PROFILES_ACTIVE=dev
```

Rode o backend:
```bash
cd backend
mvn spring-boot:run
```

#### Opção 2: Exportar variáveis manualmente (Alternativa)
```bash
# Bash/Linux/Mac
export GOOGLE_CLIENT_ID=932414018844-ifeapfombmps2e5f0c518fsq81g7uipu.apps.googleusercontent.com
export JWT_SECRET=dev-secret
mvn spring-boot:run

# Windows CMD
set GOOGLE_CLIENT_ID=932414018844-ifeapfombmps2e5f0c518fsq81g7uipu.apps.googleusercontent.com
set JWT_SECRET=dev-secret
mvn spring-boot:run

# Windows PowerShell
$env:GOOGLE_CLIENT_ID="932414018844-ifeapfombmps2e5f0c518fsq81g7uipu.apps.googleusercontent.com"
$env:JWT_SECRET="dev-secret"
mvn spring-boot:run
```

---

## 🌐 Production Deployment (Coolify)

### 1. Configurar Variáveis de Ambiente no Coolify

No painel do Coolify, vá em **Environment Variables** e adicione:

#### Backend (OBRIGATÓRIAS)

```bash
# Spring Profile
SPRING_PROFILES_ACTIVE=prod

# Google Authentication
GOOGLE_CLIENT_ID=<seu-client-id-de-producao>

# JWT Secret (gere uma string aleatória longa)
JWT_SECRET=<string-aleatoria-de-pelo-menos-64-caracteres>

# Database (se não usar Docker Compose)
DB_HOST=<host-do-postgres>
DB_PORT=5432
DB_NAME=speakup
DB_USERNAME=<usuario>
DB_PASSWORD=<senha-forte>

# Redis
REDIS_HOST=<host-do-redis>
REDIS_PORT=6379
REDIS_PASSWORD=<senha-redis>

# Stripe (quando configurar pagamentos)
STRIPE_API_KEY=<stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
STRIPE_PUBLIC_KEY=<stripe-public-key>
STRIPE_SUCCESS_URL=https://seudominio.com/credits/success
STRIPE_CANCEL_URL=https://seudominio.com/credits/buy

# Claude AI (opcional - para geração de tópicos)
CLAUDE_API_KEY=<sua-api-key-claude>
SPEAKUP_TOPICS_PROVIDER=claude
```

#### Frontend (OBRIGATÓRIAS)

```bash
# Google Authentication (mesmo Client ID do backend)
VITE_GOOGLE_CLIENT_ID=<seu-client-id-de-producao>

# API URL (ajustar conforme seu domínio)
VITE_API_BASE_URL=/api/v1

# PeerJS (se usar servidor próprio)
VITE_PEERJS_HOST=<seu-peerjs-host>
VITE_PEERJS_PORT=9000
```

### 2. Gerar JWT Secret Seguro

```bash
# Linux/Mac
openssl rand -base64 64

# Node.js (qualquer OS)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Python (qualquer OS)
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### 3. Configurar Google OAuth para Produção

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs & Services > Credentials**
3. Crie um novo **OAuth 2.0 Client ID** ou edite o existente
4. Adicione suas URLs de produção:
   - **Authorized JavaScript origins**: `https://seudominio.com`
   - **Authorized redirect URIs**: `https://seudominio.com`
5. Copie o **Client ID** e adicione no Coolify

---

## 🔒 Segurança em Produção

### Checklist de Segurança

- [ ] `SPRING_PROFILES_ACTIVE=prod` está configurado
- [ ] JWT_SECRET é uma string aleatória longa (mínimo 64 caracteres)
- [ ] Senhas de banco de dados são fortes
- [ ] Google Client ID é do ambiente de produção
- [ ] Swagger está desabilitado (`application-prod.yml` já faz isso)
- [ ] Logs não expõem informações sensíveis
- [ ] HTTPS está configurado (Coolify faz automaticamente)
- [ ] Variáveis de ambiente estão configuradas, não hardcoded

### O que NÃO fazer

❌ **NUNCA** comitar credenciais no código
❌ **NUNCA** usar `ddl-auto: update` em produção (use `validate`)
❌ **NUNCA** expor Swagger em produção
❌ **NUNCA** usar senhas fracas ou padrão
❌ **NUNCA** logar informações sensíveis

---

## 📊 Monitoramento

O backend expõe endpoints de health check:

```bash
# Health check
GET /actuator/health

# Métricas (se habilitado)
GET /actuator/metrics
```

Configure um monitor no Coolify para verificar `/actuator/health`.

---

## 🔄 Como Funciona (Spring Profiles)

### Hierarquia de Configuração

1. `application.yml` - Configurações comuns a todos os ambientes
2. `application-{profile}.yml` - Sobrescreve configurações específicas
3. **Variáveis de ambiente** - Têm prioridade máxima

### Exemplo

Se você tem:
- `application.yml`: `google.client-id: ${GOOGLE_CLIENT_ID}`
- `application-dev.yml`: `google.client-id: ${GOOGLE_CLIENT_ID:valor-default-dev}`
- Variável de ambiente: `GOOGLE_CLIENT_ID=valor-da-env`

**Resultado com profile `dev`:**
- Se `GOOGLE_CLIENT_ID` estiver definida → usa o valor da variável
- Se não estiver definida → usa `valor-default-dev`

**Resultado com profile `prod`:**
- Se `GOOGLE_CLIENT_ID` estiver definida → usa o valor da variável
- Se não estiver definida → **ERRO** (proposital, para forçar configuração)

---

## 🐛 Troubleshooting

### Backend não inicia - "google.client-id is required"

**Causa:** Variável `GOOGLE_CLIENT_ID` não está configurada.

**Solução:**
- Dev: Certifique-se que `SPRING_PROFILES_ACTIVE=dev` está no `.env`
- Prod: Configure `GOOGLE_CLIENT_ID` nas variáveis de ambiente do Coolify

### Login retorna 401 Unauthorized

**Causa:** Client ID do frontend ≠ Client ID do backend

**Solução:**
1. Verifique que `VITE_GOOGLE_CLIENT_ID` (frontend) é igual a `GOOGLE_CLIENT_ID` (backend)
2. Reinicie ambos os serviços
3. Limpe cache do navegador

### "Invalid redirect URI" no Google Login

**Causa:** URL de redirect não está configurada no Google Console

**Solução:**
1. Vá no Google Cloud Console > Credentials
2. Adicione a URL do seu site nas "Authorized redirect URIs"

---

## 📝 Resumo Rápido

**Local (Dev):**
```bash
# .env
SPRING_PROFILES_ACTIVE=dev
GOOGLE_CLIENT_ID=932414018844-ifeapfombmps2e5f0c518fsq81g7uipu.apps.googleusercontent.com
```

**Produção (Coolify):**
```bash
# Environment Variables no Coolify
SPRING_PROFILES_ACTIVE=prod
GOOGLE_CLIENT_ID=<seu-prod-client-id>
JWT_SECRET=<random-64-chars>
# ... outras vars obrigatórias
```

---

**Última atualização:** 2026-01-23

# Deploy no Coolify - Guia Passo a Passo

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      Coolify                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │   Backend    │  │   PeerJS     │  │
│  │   (nginx)    │  │  (Spring)    │  │   (Node)     │  │
│  │    :80       │  │    :8080     │  │    :9000     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                 │                  │          │
│         │                 ▼                  │          │
│         │    ┌──────────────────────┐       │          │
│         │    │     PostgreSQL       │       │          │
│         │    │       :5432          │       │          │
│         │    └──────────────────────┘       │          │
│         │                 │                  │          │
│         │    ┌──────────────────────┐       │          │
│         │    │       Redis          │       │          │
│         │    │       :6379          │       │          │
│         │    └──────────────────────┘       │          │
│         │                                    │          │
└─────────┼────────────────────────────────────┼──────────┘
          │                                    │
          ▼                                    ▼
    speakup.com.br                    speakup.com.br/peerjs
```

## Passo 1: Criar PostgreSQL

1. **New Resource → Database → PostgreSQL**
2. Configurações:
   - Name: `speakup-postgres`
   - Version: `16`
   - Database: `speakup`
   - Username: `speakup`
   - Password: (gerar senha forte)
3. **Deploy**
4. Anote:
   - Host interno: `speakup-postgres` (nome do container)
   - Port: `5432`

## Passo 2: Criar Redis

1. **New Resource → Database → Redis**
2. Configurações:
   - Name: `speakup-redis`
   - Version: `7`
3. **Deploy**
4. Anote:
   - Host interno: `speakup-redis`
   - Port: `6379`

## Passo 3: Criar Backend

1. **New Resource → Application → Docker → Git Repository**
2. Configurações:
   - Repository: `https://github.com/lucasjavit/speakup.git`
   - Branch: `main`
   - Build Pack: `Dockerfile`
   - Dockerfile Location: `backend/Dockerfile`
   - Port: `8080`
3. **Environment Variables:**
   ```
   SPRING_PROFILES_ACTIVE=prod
   DB_HOST=speakup-postgres
   DB_PORT=5432
   DB_NAME=speakup
   DB_USERNAME=speakup
   DB_PASSWORD=<senha-do-postgres>
   REDIS_HOST=speakup-redis
   REDIS_PORT=6379
   JWT_SECRET=<gerar-com-openssl-rand-base64-64>
   GOOGLE_CLIENT_ID=<seu-google-client-id>
   STRIPE_API_KEY=<sk_live_ou_sk_test>
   STRIPE_WEBHOOK_SECRET=<whsec_...>
   STRIPE_PUBLIC_KEY=<pk_live_ou_pk_test>
   STRIPE_SUCCESS_URL=https://SEU_DOMINIO_FRONTEND/credits/success
   STRIPE_CANCEL_URL=https://SEU_DOMINIO_FRONTEND/credits/buy
   CLAUDE_API_KEY=<sk-ant-...>
   ```
4. **Domain:** `api.speakup.com.br` (ou subdomínio que preferir)
5. **Deploy**
6. Verifique: `https://api.speakup.com.br/actuator/health` deve retornar `{"status":"UP"}`

## Passo 4: Criar PeerJS Server

1. **New Resource → Application → Docker → Git Repository**
2. Configurações:
   - Repository: `https://github.com/lucasjavit/speakup.git`
   - Branch: `main`
   - Build Pack: `Dockerfile`
   - Dockerfile Location: `peerjs-server/Dockerfile`
   - Port: `9000`
3. **Domain:** `peerjs.speakup.com.br` (ou subdomínio)
4. **Deploy**
5. Verifique: `https://peerjs.speakup.com.br/peerjs` deve retornar info do PeerJS

## Passo 5: Criar Frontend

1. **New Resource → Application → Docker → Git Repository**
2. Configurações:
   - Repository: `https://github.com/lucasjavit/speakup.git`
   - Branch: `main`
   - Build Pack: `Dockerfile`
   - Dockerfile Location: `frontend/Dockerfile`
   - Port: `80`
3. **Build Arguments:** (IMPORTANTE: são args de BUILD, não env vars)
   ```
   VITE_API_BASE_URL=https://api.speakup.com.br/api/v1
   VITE_GOOGLE_CLIENT_ID=<seu-google-client-id>
   VITE_PEERJS_HOST=peerjs.speakup.com.br
   VITE_PEERJS_PORT=443
   VITE_PEERJS_PATH=/peerjs
   ```
4. **Domain:** `speakup.com.br` (domínio principal)
5. **Deploy**
6. Verifique: `https://speakup.com.br` deve carregar a aplicação

## Passo 6: Configurar Google OAuth

No Google Cloud Console:
1. Vá em **APIs & Services → Credentials**
2. Edite seu OAuth Client ID
3. Em **Authorized JavaScript origins**, adicione:
   - `https://speakup.com.br`
4. Em **Authorized redirect URIs**, adicione:
   - `https://speakup.com.br`
   - `https://speakup.com.br/login`
5. Salve

## Passo 7: Configurar Stripe Webhook

No Stripe Dashboard:
1. Vá em **Developers → Webhooks**
2. Adicione endpoint:
   - URL: `https://api.speakup.com.br/api/v1/stripe/webhook`
   - Events:
     - `checkout.session.completed`
     - `checkout.session.expired`
3. Copie o **Signing secret** (whsec_...)
4. Atualize `STRIPE_WEBHOOK_SECRET` no backend

## Variáveis de Ambiente - Resumo

### Backend (Environment Variables)
| Variável | Exemplo |
|----------|---------|
| SPRING_PROFILES_ACTIVE | prod |
| DB_HOST | speakup-postgres |
| DB_PORT | 5432 |
| DB_NAME | speakup |
| DB_USERNAME | speakup |
| DB_PASSWORD | (senha forte) |
| REDIS_HOST | speakup-redis |
| REDIS_PORT | 6379 |
| JWT_SECRET | (64+ chars base64) |
| GOOGLE_CLIENT_ID | xxx.apps.googleusercontent.com |
| STRIPE_API_KEY | sk_live_xxx ou sk_test_xxx |
| STRIPE_WEBHOOK_SECRET | whsec_xxx |
| STRIPE_PUBLIC_KEY | pk_live_xxx ou pk_test_xxx |
| STRIPE_SUCCESS_URL | https://speakup.com.br/credits/success |
| STRIPE_CANCEL_URL | https://speakup.com.br/credits/buy |
| CLAUDE_API_KEY | sk-ant-xxx |

### Frontend (Build Arguments)
| Variável | Exemplo |
|----------|---------|
| VITE_API_BASE_URL | https://api.speakup.com.br/api/v1 |
| VITE_GOOGLE_CLIENT_ID | xxx.apps.googleusercontent.com |
| VITE_PEERJS_HOST | peerjs.speakup.com.br |
| VITE_PEERJS_PORT | 443 |
| VITE_PEERJS_PATH | /peerjs |

## Troubleshooting

### Frontend dá 404 em todas as rotas
- Verifique se o nginx está servindo o index.html
- Teste `/health` - deve retornar "healthy"

### Backend não conecta ao PostgreSQL
- Verifique se `DB_HOST` é o nome do container do postgres
- Containers precisam estar na mesma network do Coolify

### CORS errors no frontend
- Backend deve ter o domínio do frontend nas origens permitidas
- Verifique `application.yml` do Spring

### Google OAuth "origin_mismatch"
- Adicione o domínio do frontend nas origens autorizadas do Google Console

### PeerJS não conecta
- Verifique se VITE_PEERJS_HOST está correto
- Verifique se WebSocket está funcionando (HTTPS + WSS)

## Gerar JWT_SECRET

```bash
openssl rand -base64 64
```

## Health Checks

| Serviço | URL | Resposta Esperada |
|---------|-----|-------------------|
| Backend | /actuator/health | {"status":"UP"} |
| Frontend | /health | healthy |
| PeerJS | /peerjs | {"name":"PeerJS",...} |

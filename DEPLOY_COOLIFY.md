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
3. **Deploy**
4. Anote o host e senha gerados pelo Coolify

## Passo 2: Criar Redis

1. **New Resource → Database → Redis**
2. Configurações:
   - Name: `speakup-redis`
   - Version: `7`
3. **Deploy**
4. Anote o host e senha gerados pelo Coolify

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
   DB_HOST=<coolify-postgres-host>
   DB_PORT=5432
   DB_NAME=postgres
   DB_USERNAME=postgres
   DB_PASSWORD=<coolify-postgres-password>
   REDIS_HOST=<coolify-redis-host>
   REDIS_PORT=6379
   REDIS_PASSWORD=<coolify-redis-password>
   JWT_SECRET=<gerar-com-openssl-rand-base64-64>
   GOOGLE_CLIENT_ID=<seu-google-client-id>
   STRIPE_API_KEY=<sk_test_ou_sk_live>
   STRIPE_WEBHOOK_SECRET=<whsec_...>
   STRIPE_PUBLIC_KEY=<pk_test_ou_pk_live>
   STRIPE_SUCCESS_URL=<url-do-frontend>/credits/success
   STRIPE_CANCEL_URL=<url-do-frontend>/credits/buy
   CLAUDE_API_KEY=<sua-api-key-openai-ou-anthropic>
   MAIL_USERNAME=<seu-email@gmail.com>
   MAIL_PASSWORD=<app-password-16-caracteres>
   MAIL_FROM=<seu-email@gmail.com>
   MAIL_FROM_NAME=SpeakYou
   ```
   > **Gmail SMTP:** Para gerar o App Password, ative a verificação em 2 etapas na conta Google e crie um App Password em https://myaccount.google.com/apppasswords
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
| Variável | Descrição |
|----------|-----------|
| SPRING_PROFILES_ACTIVE | prod |
| DB_HOST | Host do PostgreSQL (do Coolify) |
| DB_PORT | 5432 |
| DB_NAME | Nome do banco |
| DB_USERNAME | Usuário do banco |
| DB_PASSWORD | Senha do banco |
| REDIS_HOST | Host do Redis (do Coolify) |
| REDIS_PORT | 6379 |
| REDIS_PASSWORD | Senha do Redis |
| JWT_SECRET | Gerar com: `openssl rand -base64 64` |
| GOOGLE_CLIENT_ID | ID do OAuth do Google Cloud |
| STRIPE_API_KEY | Chave secreta do Stripe (sk_test ou sk_live) |
| STRIPE_WEBHOOK_SECRET | Secret do webhook (whsec_...) |
| STRIPE_PUBLIC_KEY | Chave pública do Stripe (pk_test ou pk_live) |
| STRIPE_SUCCESS_URL | URL do frontend + /credits/success |
| STRIPE_CANCEL_URL | URL do frontend + /credits/buy |
| CLAUDE_API_KEY | API key para AI (opcional) |
| MAIL_USERNAME | E-mail do Gmail (ou SMTP) |
| MAIL_PASSWORD | Senha de app do Gmail (16 caracteres) |
| MAIL_FROM | Remetente (ex: noreply@speakyou.co ou seu Gmail) |
| MAIL_FROM_NAME | Nome do remetente (ex: SpeakYou) |
| MAIL_HOST | (opcional) smtp.gmail.com padrão |
| MAIL_PORT | (opcional) 587 padrão |

### Frontend (Build Arguments)
| Variável | Descrição |
|----------|-----------|
| VITE_API_BASE_URL | URL completa do backend + /api/v1 |
| VITE_GOOGLE_CLIENT_ID | ID do OAuth do Google Cloud |
| VITE_PEERJS_HOST | Host do PeerJS (sem https://) |
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

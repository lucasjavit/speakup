# Infraestrutura - SpeakUp

## Ambiente Atual

### VPS Disponível
```
Provider: (Hetzner/DigitalOcean/etc.)
vCPU: 2
RAM: 4 GB
Disk: 80 GB SSD
Traffic: 20 TB/mês
Custo: ~$7/mês
```

### Software de Deploy
- **Coolify** - PaaS self-hosted para gerenciar deploys

---

## Arquitetura de Containers

### Docker Compose (Produção)
```yaml
version: '3.8'

services:
  # ============ APPLICATION ============
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: speakup-backend
    restart: unless-stopped
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DATABASE_URL=jdbc:postgresql://postgres:5432/speakup
      - DATABASE_USERNAME=${DB_USER}
      - DATABASE_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - LIVEKIT_URL=ws://livekit:7880
      - LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
      - LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
      - DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - speakup-network
    volumes:
      - recordings:/app/recordings

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: speakup-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    networks:
      - speakup-network

  # ============ DATABASES ============
  postgres:
    image: postgres:16-alpine
    container_name: speakup-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=speakup
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d speakup"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - speakup-network

  redis:
    image: redis:7-alpine
    container_name: speakup-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - speakup-network

  # ============ LIVEKIT ============
  livekit:
    image: livekit/livekit-server:v1.5
    container_name: speakup-livekit
    restart: unless-stopped
    ports:
      - "7880:7880"      # HTTP API
      - "7881:7881"      # RTC over TCP
      - "7882:7882/udp"  # RTC over UDP
      - "50000-50100:50000-50100/udp"  # WebRTC media (range reduzido)
    volumes:
      - ./config/livekit.yaml:/etc/livekit.yaml
    command: --config /etc/livekit.yaml
    environment:
      - LIVEKIT_KEYS=${LIVEKIT_API_KEY}:${LIVEKIT_API_SECRET}
    networks:
      - speakup-network

  # ============ PROXY ============
  nginx:
    image: nginx:alpine
    container_name: speakup-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./config/ssl:/etc/nginx/ssl:ro
      - certbot_data:/var/www/certbot
    depends_on:
      - backend
      - frontend
      - livekit
    networks:
      - speakup-network

networks:
  speakup-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  recordings:
  certbot_data:
```

---

## Dockerfiles

### Backend (Spring Boot)
```dockerfile
# Build stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src

# Cache Maven dependencies
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw dependency:go-offline -B

RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Frontend (React + Nginx)
```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Configuração do Nginx

### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8080;
    }

    upstream frontend {
        server frontend:80;
    }

    upstream livekit {
        server livekit:7880;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn:10m;

    server {
        listen 80;
        server_name speakup.com www.speakup.com;

        # Redirect to HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }

        # Let's Encrypt challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
    }

    server {
        listen 443 ssl http2;
        server_name speakup.com www.speakup.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # API Backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket
        location /ws/ {
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400;
        }

        # LiveKit
        location /livekit/ {
            proxy_pass http://livekit/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # Frontend (SPA)
        location / {
            proxy_pass http://frontend/;
            proxy_set_header Host $host;

            # SPA fallback
            try_files $uri $uri/ /index.html;
        }
    }
}
```

---

## Configuração do LiveKit

### livekit.yaml
```yaml
port: 7880

rtc:
  port_range_start: 50000
  port_range_end: 50100
  tcp_port: 7881
  use_external_ip: true

redis:
  address: redis:6379

keys:
  # Definido via environment variable
  # API_KEY: API_SECRET

room:
  auto_create: false
  empty_timeout: 300
  max_participants: 2

webhook:
  urls:
    - http://backend:8080/api/livekit/webhook
  api_key: ${LIVEKIT_API_KEY}

logging:
  level: info
  pion_level: warn

# Egress (gravação)
egress:
  enabled: true
  output_path: /recordings
```

---

## Deploy com Coolify

### Estrutura no Coolify
```
Projeto: SpeakUp
├── Service: backend
│   ├── Type: Docker Compose
│   ├── Repository: github.com/user/speakup
│   └── Path: /backend
│
├── Service: frontend
│   ├── Type: Docker Compose
│   └── Path: /frontend
│
├── Database: PostgreSQL
│   ├── Type: PostgreSQL 16
│   └── Backup: Daily
│
├── Service: Redis
│   └── Type: Redis 7
│
└── Service: LiveKit
    └── Type: Docker Image
```

### Variáveis de Ambiente (Coolify)
```bash
# Database
DB_USER=speakup
DB_PASSWORD=<generated>

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# LiveKit
LIVEKIT_URL=wss://live.speakup.com
LIVEKIT_API_KEY=<generated>
LIVEKIT_API_SECRET=<generated>

# External APIs
DEEPGRAM_API_KEY=<your-key>
CLAUDE_API_KEY=<your-key>

# OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-secret>

# Security
JWT_SECRET=<generated-256-bit>

# App
FRONTEND_URL=https://speakup.com
BACKEND_URL=https://api.speakup.com
```

---

## SSL/TLS

### Let's Encrypt via Coolify
Coolify gerencia automaticamente certificados SSL com Let's Encrypt.

### Configuração de Domínios
```
speakup.com          → Frontend
api.speakup.com      → Backend API
live.speakup.com     → LiveKit
```

---

## Monitoramento

### Health Checks
```yaml
# Backend
GET /actuator/health

# Response
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "redis": { "status": "UP" },
    "livekit": { "status": "UP" }
  }
}
```

### Logs (Coolify)
- Logs centralizados no dashboard do Coolify
- Opção de integrar com Loki/Grafana

### Alertas
- Configurar alertas no Coolify para:
  - Container down
  - High CPU/Memory
  - Disk space low
  - Health check failing

---

## Backups

### PostgreSQL
```bash
# Backup automático (cron no Coolify)
0 3 * * * pg_dump -U speakup speakup | gzip > /backups/speakup_$(date +%Y%m%d).sql.gz

# Retenção: 7 dias
find /backups -name "*.sql.gz" -mtime +7 -delete
```

### Redis
```yaml
# redis.conf
appendonly yes
appendfsync everysec
```

### Gravações de Áudio
```bash
# Sync para storage externo (opcional)
# Pode usar rclone para S3/Backblaze
rclone sync /recordings remote:speakup-recordings
```

---

## Escalabilidade Futura

### Fase 2: Separar LiveKit
```
VPS 1 (4GB) - $7/mês
├── Backend
├── Frontend
├── PostgreSQL
└── Redis

VPS 2 (4GB) - $7/mês
└── LiveKit (dedicado)
```

### Fase 3: Kubernetes
```
Kubernetes Cluster
├── Deployment: backend (2-5 replicas)
├── Deployment: frontend (2 replicas)
├── StatefulSet: postgresql
├── StatefulSet: redis
└── Deployment: livekit (2-5 replicas)
```

---

## Segurança

### Firewall (UFW)
```bash
# Permitir apenas portas necessárias
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 7880/tcp    # LiveKit API
ufw allow 7881/tcp    # LiveKit RTC TCP
ufw allow 50000:50100/udp  # LiveKit WebRTC

ufw enable
```

### Hardening
- [ ] SSH apenas com chave (desabilitar senha)
- [ ] Fail2ban configurado
- [ ] Updates automáticos de segurança
- [ ] Containers rodando como non-root
- [ ] Secrets gerenciados pelo Coolify

---

## Checklist de Deploy

### Pré-deploy
- [ ] Domínios configurados (DNS)
- [ ] SSL certificados gerados
- [ ] Variáveis de ambiente configuradas
- [ ] Backups configurados
- [ ] Firewall configurado

### Deploy
- [ ] Build passa sem erros
- [ ] Containers iniciam corretamente
- [ ] Health checks passam
- [ ] Frontend acessível
- [ ] API respondendo
- [ ] WebSocket funcionando
- [ ] LiveKit conectando

### Pós-deploy
- [ ] Monitoramento ativo
- [ ] Alertas configurados
- [ ] Primeiro usuário teste
- [ ] Vídeo-chamada teste

---

## Próximos Passos

- [ ] Configurar VPS com Coolify
- [ ] Configurar domínios e DNS
- [ ] Criar docker-compose.yml
- [ ] Testar deploy local com Docker
- [ ] Deploy em staging
- [ ] Deploy em produção

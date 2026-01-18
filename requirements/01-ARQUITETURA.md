# Arquitetura - SpeakUp

## Visão Geral

SpeakUp é uma plataforma de prática de idiomas por vídeo-chamada com as seguintes características principais:

- **Pareamento inteligente** por idioma e nível de proficiência
- **Sessões de 10 minutos** com rotação automática
- **Análise de IA** das conversas para feedback de aprendizado
- **Sistema social** com favoritos, avaliações e gamificação

---

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USUÁRIOS                                      │
│                    (Browser - React Application)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOAD BALANCER                                    │
│                    (Nginx / Traefik via Coolify)                        │
│                         - SSL Termination                                │
│                         - Rate Limiting                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │  REST API │   │ WebSocket │   │  LiveKit  │
            │   :8080   │   │   :8080   │   │   :7880   │
            │  (HTTP)   │   │  (STOMP)  │   │  (WebRTC) │
            └───────────┘   └───────────┘   └───────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     BACKEND - Spring Boot (Monolito Modular)            │
│                                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │    Auth     │ │  Matching   │ │   Session   │ │   Video     │       │
│  │   Module    │ │   Module    │ │   Module    │ │   Module    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  Analysis   │ │   Social    │ │   Gamify    │ │  Scheduler  │       │
│  │   Module    │ │   Module    │ │   Module    │ │   Module    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                      Common / Shared                         │       │
│  │     (Entities, DTOs, Exceptions, Config, Utils)             │       │
│  └─────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
    ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
    │  PostgreSQL   │       │     Redis     │       │   LiveKit     │
    │    :5432      │       │    :6379      │       │   Server      │
    │               │       │               │       │               │
    │  - Users      │       │  - Sessions   │       │  - Rooms      │
    │  - Sessions   │       │  - Match Queue│       │  - Tracks     │
    │  - Transcripts│       │  - Pub/Sub    │       │  - Recording  │
    │  - Ratings    │       │  - Cache      │       │               │
    │  - Favorites  │       │  - Leaderboard│       │               │
    │  - Badges     │       │               │       │               │
    │  - Schedules  │       │               │       │               │
    └───────────────┘       └───────────────┘       └───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │      SERVIÇOS EXTERNOS        │
                    │                               │
                    │  ┌─────────┐ ┌─────────┐     │
                    │  │Deepgram │ │ Claude/ │     │
                    │  │  (STT)  │ │ OpenAI  │     │
                    │  └─────────┘ └─────────┘     │
                    │                               │
                    │  ┌─────────┐ ┌─────────┐     │
                    │  │ Google  │ │ Stripe  │     │
                    │  │ OAuth   │ │(Futuro) │     │
                    │  └─────────┘ └─────────┘     │
                    └───────────────────────────────┘
```

---

## Stack Tecnológica

### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Java | 21 (LTS) | Linguagem principal |
| Spring Boot | 3.2+ | Framework web |
| Spring Security | 6.x | Autenticação/Autorização |
| Spring WebSocket | - | Comunicação real-time |
| Spring Data JPA | - | Acesso a dados |
| Spring Data Redis | - | Cache e filas |

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18+ | UI Framework |
| TypeScript | 5.x | Tipagem |
| Vite | 5.x | Build tool |
| TailwindCSS | 3.x | Estilos |
| TanStack Query | 5.x | Server state |
| Zustand | 4.x | Client state |

### Infraestrutura
| Tecnologia | Propósito |
|------------|-----------|
| Docker | Containerização |
| Docker Compose | Orquestração local |
| Coolify | Deploy e gerenciamento |
| Nginx/Traefik | Load balancer/Proxy |
| PostgreSQL 16 | Banco de dados principal |
| Redis 7 | Cache, filas, pub/sub |
| LiveKit | Servidor WebRTC |

### Serviços Externos
| Serviço | Propósito |
|---------|-----------|
| Google OAuth | Autenticação social |
| Deepgram | Transcrição de áudio |
| Claude/OpenAI | Análise de IA |
| Stripe | Pagamentos (futuro) |

---

## Módulos do Backend

### 1. Auth Module
- OAuth2 com Google/GitHub
- Geração e validação de JWT
- Gerenciamento de sessões de usuário
- Refresh tokens

### 2. Matching Module
- Fila de espera (Redis Sorted Set)
- Algoritmo de pareamento por idioma + nível
- Priorização de favoritos mútuos
- WebSocket para notificações de match

### 3. Session Module
- Gerenciamento do ciclo de vida da sessão
- Timer de 10 minutos
- Rotação automática
- Histórico de sessões

### 4. Video Module
- Integração com LiveKit SDK
- Criação de salas
- Geração de tokens de acesso
- Webhook para eventos de sala

### 5. Analysis Module
- Worker assíncrono para processamento
- Integração com Deepgram (transcrição)
- Integração com Claude/OpenAI (análise)
- Geração de relatórios

### 6. Social Module
- Sistema de favoritos
- Avaliações e reviews
- Sistema de report
- Notificações

### 7. Gamify Module
- Sistema de XP e níveis
- Badges e conquistas
- Streaks diários
- Ranking/Leaderboard

### 8. Scheduler Module
- Calendário de disponibilidade
- Agendamento de sessões
- Lembretes e notificações
- Salas privadas

---

## Comunicação Entre Componentes

### REST API
- Operações CRUD padrão
- Autenticação, perfil, histórico
- Rate limiting: 100 req/min por usuário

### WebSocket (STOMP)
- Notificações de match
- Atualizações de fila
- Timer sync
- Notificações de favoritos online

### Redis Pub/Sub
- Comunicação entre instâncias (futuro)
- Eventos de sistema
- Invalidação de cache

---

## Padrões de Projeto Utilizados

1. **Monolito Modular** - Módulos bem definidos e desacoplados
2. **Repository Pattern** - Acesso a dados abstraído
3. **Service Layer** - Lógica de negócio isolada
4. **DTO Pattern** - Transferência de dados entre camadas
5. **Event-Driven** - Comunicação assíncrona via Redis
6. **Circuit Breaker** - Resiliência em chamadas externas

---

## Decisões Arquiteturais

### Por que Monolito Modular?
- **Simplicidade**: Mais fácil de desenvolver, debugar e deploy
- **Escalabilidade**: VPS de 4GB suporta bem para MVP
- **Migração futura**: Módulos podem virar microsserviços se necessário

### Por que LiveKit self-hosted?
- **Custo zero**: Open-source, sem cobranças por minuto
- **Controle total**: Configuração customizada
- **Privacidade**: Dados não passam por terceiros

### Por que Redis para matching?
- **Performance**: Operações O(log N) com Sorted Sets
- **Pub/Sub nativo**: Ideal para notificações real-time
- **Simplicidade**: Estrutura de dados perfeita para filas

---

## Próximos Passos

- [ ] Revisar e aprovar esta arquitetura
- [ ] Definir contratos de API (OpenAPI)
- [ ] Modelar banco de dados (diagrama ER)
- [ ] Prototipar fluxo de matching

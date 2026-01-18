# SpeakUp - Documentação de Requisitos

> **ATUALIZADO**: Nova arquitetura com sessões controladas por admin, sistema de créditos e tópicos gerados por IA.

## Sobre o Projeto

**SpeakUp** é uma plataforma de prática de idiomas por vídeo-chamada onde:
- Admin define horários de sessões (ex: 7h-8h, 19h-20h)
- Usuários entram em sessões de 1 hora com rotação automática a cada 10 min
- IA gera tópicos de conversa durante intervalos de 30s
- Sistema de créditos flexível (por sessão ou por conversa)
- Matching por nível + favoritos com bônus percentual

---

## Documentos

| # | Documento | Descrição |
|---|-----------|-----------|
| 01 | [ARQUITETURA](01-ARQUITETURA.md) | Diagrama de arquitetura, stack tecnológica, módulos do sistema |
| 02 | [USUARIO](02-USUARIO.md) | Perfil do usuário, jornada, telas do aplicativo, estados |
| 03 | [MATCHING](03-MATCHING.md) | Algoritmo de pareamento, filas Redis, sistema de favoritos |
| 04 | [VIDEO](04-VIDEO.md) | Integração LiveKit, WebRTC, timer, transcrição |
| 05 | [IA-ANALISE](05-IA-ANALISE.md) | Pipeline de análise, Deepgram, Claude API, relatórios |
| 06 | [MONETIZACAO](06-MONETIZACAO.md) | Sistema de créditos, pacotes, Stripe, serviços extras |
| 07 | [INFRAESTRUTURA](07-INFRAESTRUTURA.md) | Docker, Coolify, deploy, configurações |
| 08 | [CUSTOS](08-CUSTOS.md) | Análise de custos, otimizações, projeções |
| 09 | [REQUISITOS](09-REQUISITOS.md) | Requisitos funcionais e não-funcionais completos |
| 10 | [GAMIFICACAO](10-GAMIFICACAO.md) | XP, níveis, badges, streaks, ranking |
| 12 | [TESTES](12-TESTES.md) | Estratégia de testes, exemplos, CI/CD |
| 13 | [ADMIN](13-ADMIN.md) | Painel administrativo, níveis de acesso, CRUD sessões |
| 14 | [TOPICOS-IA](14-TOPICOS-IA.md) | Sistema de tópicos de conversa gerados por IA |

---

## Resumo das Funcionalidades

### Core (MVP)
- Login com Google/GitHub OAuth
- Perfil com idioma nativo, idioma de prática, nível
- **Sessões em horários fixos** definidos pelo admin
- **Rotação automática** a cada 10 min + intervalo de 30s
- **Tópicos de conversa** gerados por IA durante intervalo
- Matching por idioma + nível + favoritos (bônus percentual)
- Vídeo-chamada 1x1 ou trio (número ímpar)
- Transcrição de áudio opcional (Deepgram)
- Análise de IA opcional (Claude)
- Avaliação de parceiro + "Quer conversar novamente?"

### Créditos e Pagamento
- Sistema de créditos flexível (sessão ou conversa)
- Pacotes com desconto
- Serviços extras opcionais (transcrição, análise IA)
- Integração Stripe

### Painel Admin
- 3 níveis: Super Admin, Admin Pagamento, Moderador
- CRUD de sessões/períodos
- Habilitar/desabilitar sessões
- Gerenciamento de usuários
- Relatórios financeiros
- Configuração de tópicos

### Social
- Favoritos criados via "Quer conversar novamente?"
- Favoritos mútuos: +40% chance de match
- Favoritos unilaterais: +30% chance de match

### Gamificação
- Sistema de XP
- Níveis (Bronze → Diamante → Mestre)
- Badges por conquistas
- Streaks diários
- Ranking semanal/mensal (opt-in)

### Lobby do Usuário
- Estatísticas: Total Calls, Total Time, Avg Duration, This Week, This Month
- Próxima sessão disponível
- Botão para entrar (habilitado quando sessão ativa)
- Saldo de créditos

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Backend | Java 21, Spring Boot 3 |
| Frontend | React 18, TypeScript, Vite |
| Banco de Dados | PostgreSQL 16 |
| Cache/Filas | Redis 7 |
| Vídeo | LiveKit (self-hosted) |
| Transcrição | Deepgram API (opcional) |
| IA | Claude API / OpenAI |
| Pagamentos | Stripe |
| Deploy | Docker, Coolify |

---

## Fluxo Principal

```
1. Admin cria período de sessão (ex: 19h-20h)
2. Sessão fica ativa no horário definido
3. Usuário vê "Entrar na Sessão" habilitado no lobby
4. Usuário clica e entra na fila de matching
5. Sistema pareia por nível + favoritos
6. Conversa de 10 min com tópico visível
7. Timer de 30s + novo tópico gerado por IA
8. Nova conversa com outro parceiro
9. Repete até fim da sessão (6 conversas)
10. Avaliação + "Quer conversar novamente?"
```

---

## Como Usar Esta Documentação

1. **Para entender o sistema**: Comece por [01-ARQUITETURA](01-ARQUITETURA.md)
2. **Para entender o usuário**: Leia [02-USUARIO](02-USUARIO.md)
3. **Para entender o admin**: Leia [13-ADMIN](13-ADMIN.md)
4. **Para funcionalidades específicas**: Consulte o documento correspondente
5. **Para requisitos detalhados**: Veja [09-REQUISITOS](09-REQUISITOS.md)
6. **Para custos e viabilidade**: Consulte [08-CUSTOS](08-CUSTOS.md)

---

## Status dos Documentos

- [x] Arquitetura - Completo
- [x] Usuário - **Atualizado**
- [x] Matching - **Atualizado**
- [x] Vídeo - Completo
- [x] IA/Análise - Completo
- [x] Monetização - **Atualizado** (Sistema de Créditos)
- [x] Infraestrutura - Completo
- [x] Custos - Completo
- [x] Requisitos - **Atualizado**
- [x] Gamificação - Completo
- [x] Testes - Completo
- [x] Admin - **Novo**
- [x] Tópicos IA - **Novo**

---

## Funcionalidades Removidas

- ~~Agendamento de sessões pelo usuário~~ (removido)
- ~~Convite de favoritos para sessão~~ (removido)
- ~~Sessões a qualquer hora~~ (agora é horário fixo)

---

## Próximos Passos

Após revisar e aprovar estes documentos:

1. **Setup do Projeto** - Criar estrutura de pastas, configurar build
2. **Sprint 1: Fundação** - Auth, banco de dados, entidades base
3. **Sprint 2: Admin + Sessões** - Painel admin, CRUD sessões
4. **Sprint 3: Matching + Vídeo** - Filas, pareamento, LiveKit
5. **Sprint 4: Rotação + Tópicos** - Timer 30s, geração de tópicos
6. **Sprint 5: Avaliação + Favoritos** - Sistema de favoritos automático
7. **Sprint 6: Créditos + Pagamento** - Stripe, pacotes
8. **Sprint 7: Extras** - Transcrição, análise IA
9. **Sprint 8: Gamificação + Polish** - XP, badges, testes

---

*Última atualização: Janeiro 2025*

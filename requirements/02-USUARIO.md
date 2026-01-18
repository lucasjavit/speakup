# Usuário e Experiência - SpeakUp

> **ATUALIZADO**: Nova jornada com lobby, sessões controladas por admin, estatísticas e sistema de créditos.

## Tipos de Usuário

### Usuário Comum
- Pessoa que quer praticar idiomas
- Compra créditos (sessão ou conversa)
- Pode avaliar parceiros, criar favoritos via "quer conversar novamente?"
- Acesso a gamificação completa
- Pode contratar serviços extras (transcrição, análise IA)

### Administradores
| Tipo | Descrição |
|------|-----------|
| Super Admin | Acesso total, cria outros admins |
| Admin Pagamento | Gerencia financeiro e relatórios |
| Moderador | Gerencia usuários e sessões |

---

## Perfil do Usuário

### Dados do OAuth
```
- ID único (UUID)
- Nome completo
- Email
- Foto de perfil (URL do Google/GitHub)
- Provider (google/github)
```

### Dados de Configuração
```
- Idioma nativo (português, inglês, espanhol, etc.)
- Idioma que quer praticar (inglês ou espanhol - MVP)
- Nível de proficiência:
  - BEGINNER (Iniciante)
  - INTERMEDIATE (Intermediário)
  - ADVANCED (Avançado)
- Fuso horário
- Preferências de notificação
- Modo de cobrança (SESSION ou CONVERSATION)
```

### Dados de Gamificação
```
- XP total acumulado
- Nível atual (Bronze, Prata, Ouro, Platina, Diamante)
- Streak atual (dias consecutivos)
- Maior streak histórico
- Lista de badges conquistados
```

### Dados Sociais
```
- Lista de favoritos (gerados via "quer conversar novamente?")
- Média de avaliações recebidas
- Total de avaliações recebidas
- Lista de reports recebidos (para moderação)
```

### Estatísticas do Usuário
```
- Total de conversas (calls) completadas
- Tempo total de prática (horas/minutos)
- Duração média das conversas
- Conversas esta semana
- Conversas este mês
- Total de parceiros diferentes
- Data de criação da conta
- Última atividade
```

### Créditos
```
- Créditos de sessão disponíveis
- Créditos de conversa disponíveis
- Histórico de compras
- Histórico de consumo
```

---

## Jornada do Usuário

### 1. Primeiro Acesso
```
[Landing Page]
    → [Login com Google/GitHub]
    → [Completar Perfil]
        - Selecionar idioma nativo
        - Selecionar idioma para praticar
        - Selecionar nível de proficiência
    → [Tutorial Rápido] (opcional)
    → [Comprar Créditos] ou [Usar Crédito de Boas-Vindas]
    → [Lobby Principal]
```

### 2. Lobby Principal (Tela Inicial)
```
┌─────────────────────────────────────────────┐
│ 👋 Olá, João!                               │
├─────────────────────────────────────────────┤
│ 📊 Suas Estatísticas                        │
│                                             │
│ Total Calls: 45    │ This Week: 8           │
│ Total Time: 12h    │ This Month: 25         │
│ Avg Duration: 9min │                        │
├─────────────────────────────────────────────┤
│ 🕐 Próxima Sessão: 19:00 - 20:00           │
│                                             │
│ [🔘 Entrar na Sessão] ← Habilitado quando   │
│                         sessão está ativa   │
│                                             │
│ 💳 Créditos: 5 sessões | 12 conversas       │
│ [+ Comprar]                                 │
└─────────────────────────────────────────────┘
```

### 3. Entrando em uma Sessão
```
[Lobby Principal]
    → [Verificar se há sessão ativa]
        - Se não: botão desabilitado + "Próxima sessão às XX:XX"
        - Se sim: botão habilitado "Entrar na Sessão"
    → [Clicar "Entrar na Sessão"]
    → [Verificar créditos]
        - Se insuficiente: redireciona para compra
        - Se suficiente: debita crédito (conforme modo de cobrança)
    → [Entrar na Fila de Matching]
        - Ver posição na fila
        - Ver usuários online no mesmo idioma/nível
        - Tempo estimado de espera
    → [Match Encontrado!]
        - Preview do parceiro (foto, nome, nível)
        - É favorito? Mostrar indicador ⭐
        - Countdown 5s para conectar
    → [Sala de Vídeo]
```

### 4. Durante a Conversa
```
┌─────────────────────────────────────────────┐
│ 💬 Tópico: "What would you do if you won   │
│     the lottery?"                           │
├─────────────────────────────────────────────┤
│                                             │
│    ┌─────────────┐    ┌─────────────┐      │
│    │   Você      │    │   Maria     │      │
│    │   (vídeo)   │    │  ⭐(vídeo)  │      │
│    └─────────────┘    └─────────────┘      │
│                                             │
│              ⏱️ 08:32                       │
│                                             │
│ [Mute] [Camera Off] [Chat] [Sair]          │
└─────────────────────────────────────────────┘

Elementos:
- Tópico gerado por IA (sempre visível no topo)
- Vídeo próprio (pequeno)
- Vídeo do parceiro (grande)
- Indicador se parceiro é favorito ⭐
- Timer: 10:00 → 00:00
- Chat de texto (lateral/colapsável)
- Controles de mídia

[Aviso 1 minuto]
→ "1 minuto restante!"

[Fim da Conversa - 00:00]
→ [Tela de Avaliação]
```

### 5. Avaliação Pós-Conversa
```
┌─────────────────────────────────────────────┐
│ 🌟 Como foi a conversa com Maria?           │
├─────────────────────────────────────────────┤
│                                             │
│    ☆ ☆ ☆ ☆ ☆  (Clique para avaliar)        │
│                                             │
│    Tags: [Paciente] [Divertido] [Fluente]   │
│                                             │
│    Feedback (opcional):                     │
│    ┌─────────────────────────────────────┐  │
│    │                                     │  │
│    └─────────────────────────────────────┘  │
│                                             │
│  ❓ Quer conversar com Maria novamente?     │
│                                             │
│        [👍 Sim]     [👎 Não]               │
│                                             │
│  [Reportar] (se necessário)                 │
│                                             │
│  [Enviar e Continuar]                       │
└─────────────────────────────────────────────┘

Se ambos responderem "Sim" → viram favoritos mútuos automaticamente
Se apenas um responder "Sim" → favorito unilateral (não notificado)
```

### 6. Intervalo (30 segundos)
```
┌─────────────────────────────────────────────┐
│ ⏱️ Próxima conversa em: 28s                │
├─────────────────────────────────────────────┤
│                                             │
│ 💡 Tópico sugerido para próxima conversa:  │
│                                             │
│ "If you could travel anywhere in the       │
│  world, where would you go and why?"       │
│                                             │
│ ────────────────────────────────────────── │
│                                             │
│ Conversa 3 de 6                             │
│ Sessão termina às 20:00                     │
│                                             │
│ [Sair da Sessão]                            │
└─────────────────────────────────────────────┘

Durante o intervalo:
- IA gera novo tópico de conversa
- Usuário vê progresso (conversa X de 6)
- Pode optar por sair da sessão
- Matching acontece em background
```

### 7. Fim da Sessão (após 6 conversas ou fim do horário)
```
┌─────────────────────────────────────────────┐
│ 🎉 Sessão Concluída!                        │
├─────────────────────────────────────────────┤
│                                             │
│ 📊 Resumo                                   │
│                                             │
│ Conversas: 6                                │
│ Tempo total: 1h 03min                       │
│ XP ganho: +75                               │
│                                             │
│ 👥 Novos Favoritos: 2                       │
│    Maria Santos ⭐ (mútuo)                  │
│    João Lima ⭐ (mútuo)                     │
│                                             │
│ 💎 Serviços Extras Disponíveis              │
│    [ ] Transcrição (1 crédito/conversa)     │
│    [ ] Análise IA (3 créditos)              │
│    [ ] Pacote Completo (8 créditos)         │
│                                             │
│ [Voltar ao Lobby]                           │
└─────────────────────────────────────────────┘
```

### 8. Dashboard/Perfil
```
[Menu Principal]
    ├── [Lobby] (tela inicial com estatísticas)
    │
    ├── [Meu Perfil]
    │   - Editar dados
    │   - Ver estatísticas completas
    │   - Ver badges
    │   - Alterar nível de proficiência
    │
    ├── [Histórico de Sessões]
    │   - Lista de sessões passadas
    │   - Relatórios de IA (se contratado)
    │   - Transcrições (se contratado)
    │
    ├── [Favoritos]
    │   - Lista de favoritos mútuos ⭐⭐
    │   - Lista de favoritos unilaterais ⭐
    │   - Remover favorito
    │
    ├── [Créditos]
    │   - Saldo atual
    │   - Histórico de transações
    │   - Comprar mais créditos
    │
    └── [Ranking] (opt-in)
        - Ranking semanal/mensal
        - Posição atual
        - Top 10
```

---

## Telas do Aplicativo

### T01 - Landing Page
- Hero com proposta de valor
- CTA "Começar Gratuitamente"
- Como funciona (3 passos)
- Preços/pacotes de créditos
- Depoimentos (futuro)

### T02 - Login
- Botão "Continuar com Google"
- Botão "Continuar com GitHub"
- Termos de uso e privacidade

### T03 - Completar Perfil
- Seleção de idioma nativo (dropdown)
- Seleção de idioma para praticar (cards: EN/ES)
- Seleção de nível (cards com descrição)

### T04 - Lobby Principal (NOVA)
- Saudação personalizada
- Cards com estatísticas:
  - Total Calls
  - Total Time
  - Avg Duration
  - This Week
  - This Month
- Próxima sessão (horário)
- Botão "Entrar na Sessão" (habilitado/desabilitado)
- Saldo de créditos + botão comprar
- Streak e XP (pequeno)

### T05 - Fila de Matching
- Animação de busca
- Posição na fila (se relevante)
- "Procurando parceiro ideal..."
- Info sobre a sessão atual
- Botão cancelar

### T06 - Sala de Vídeo (ATUALIZADA)
- **Tópico de conversa no topo** (gerado por IA)
- Layout responsivo para vídeos
- Indicador de favorito no parceiro ⭐
- Timer grande visível
- Chat colapsável
- Controles de mídia (mute, câmera off)
- Botão de emergência (sair)

### T07 - Avaliação (ATUALIZADA)
- Design limpo e rápido
- Estrelas clicáveis
- Tags como chips selecionáveis
- Textarea para feedback
- **"Quer conversar novamente?" Sim/Não**
- Botão reportar
- Botão enviar

### T08 - Intervalo (NOVA)
- Countdown de 30 segundos
- Tópico da próxima conversa
- Progresso (conversa X de 6)
- Opção de sair

### T09 - Dashboard/Perfil
- Cards com métricas completas
- Gráficos de progresso
- Lista de atividades recentes

### T10 - Favoritos (ATUALIZADA)
- Seção: Favoritos Mútuos ⭐⭐
- Seção: Favoritos Unilaterais ⭐
- Status online/offline (quando na sessão)
- Botão remover

### T11 - Créditos (NOVA)
- Saldo atual (sessões + conversas)
- Modo de cobrança (dropdown)
- Histórico de transações
- Botão comprar créditos

### T12 - Comprar Créditos (NOVA)
- Tabs: Sessões | Conversas
- Cards de pacotes com preços
- Destaque para mais populares
- Integração com Stripe

### T13 - Relatório de IA
- Resumo da sessão
- Correções gramaticais destacadas
- Sugestões de vocabulário
- Pontuação de fluência
- Dicas personalizadas

### T14 - Histórico de Sessões
- Lista cronológica
- Filtros por período
- Status de transcrição/análise
- Botão para contratar serviços extras

---

## Estados do Usuário

```
OFFLINE       → Não logado ou inativo
ONLINE        → Logado, no lobby
IN_QUEUE      → Aguardando match na sessão
IN_SESSION    → Em chamada de vídeo
IN_BREAK      → No intervalo de 30s entre chamadas
IN_RATING     → Avaliando parceiro
AWAY          → Logado mas ausente (AFK)
```

### Transições de Estado
```
OFFLINE → ONLINE (login)
ONLINE → IN_QUEUE (entrar na sessão)
IN_QUEUE → IN_SESSION (match encontrado)
IN_SESSION → IN_RATING (fim da conversa)
IN_RATING → IN_BREAK (enviar avaliação)
IN_BREAK → IN_QUEUE (aguardar próximo match)
IN_BREAK → ONLINE (sair da sessão)
IN_SESSION → ONLINE (sair da sessão)
ONLINE → OFFLINE (logout/timeout)
```

---

## Notificações

### In-App (Durante Uso)
- Match encontrado
- Conversa terminando em 1 minuto
- Nova avaliação recebida
- Favorito mútuo criado! ⭐
- Badge conquistado
- Análise/transcrição pronta

### Push/Email (Futuro)
- "Sessão começando em 15 minutos!"
- "Sua análise de sessão está pronta"
- "Você perdeu seu streak! Pratique hoje"
- "Novidade: Sessão extra às 12h!"

---

## Fluxo de Créditos na Jornada

### Modo SESSÃO
```
1. Usuário clica "Entrar na Sessão"
2. Sistema verifica: tem 1 crédito de sessão OU 6 de conversa?
3. Se sim: debita e entra na fila
4. Se não: redireciona para compra
5. Usuário fica na sessão até fim (6 conversas)
6. Se sair antes, NÃO há reembolso parcial
```

### Modo CONVERSA
```
1. Usuário clica "Entrar na Sessão"
2. Sistema verifica: tem pelo menos 1 crédito de conversa?
3. Se sim: entra na fila (não debita ainda)
4. Ao completar cada conversa: debita 1 crédito
5. Se sair no meio, só paga conversas realizadas
6. Se crédito acabar, sai automaticamente após conversa atual
```

---

## Acessibilidade

- [ ] Suporte a leitores de tela
- [ ] Contraste adequado (WCAG AA)
- [ ] Navegação por teclado
- [ ] Tamanho de fonte ajustável
- [ ] Legendas em vídeo (via transcrição, se contratada)

---

## Responsividade

- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptado, vídeo em tela cheia
- **Mobile**: Layout simplificado, foco em vídeo
  - *Nota*: Experiência mobile pode ser limitada para vídeo-chamadas

---

## Próximos Passos

- [ ] Criar wireframes das telas principais
- [ ] Definir design system (cores, tipografia)
- [ ] Prototipar fluxo no Figma
- [ ] Validar UX com usuários potenciais
- [ ] Implementar componentes base

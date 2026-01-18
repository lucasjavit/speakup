# Sistema de Gamificação - SpeakUp

## Visão Geral

O sistema de gamificação visa aumentar o engajamento e retenção dos usuários através de:
- **XP (Experience Points)** - Pontos acumulados por ações
- **Níveis** - Progressão baseada em XP total
- **Badges** - Conquistas por marcos específicos
- **Streaks** - Incentivo à prática diária
- **Ranking** - Competição saudável (opt-in)

---

## Sistema de XP

### Ações que Concedem XP

| Ação | XP | Condição |
|------|----|----|
| Completar conversa | +10 | Mínimo 5 min na chamada |
| Completar sessão inteira (6 conversas) | +20 (bônus) | Todas as 6 conversas |
| Avaliar parceiro | +5 | Após cada conversa |
| Receber avaliação 4-5 estrelas | +10 | Por avaliação positiva |
| Receber avaliação 5 estrelas | +5 (extra) | Por avaliação perfeita |
| Adicionar favorito | +2 | Máx 5/dia |
| Ser adicionado como favorito | +5 | - |
| Login diário | +5 | Uma vez por dia |
| Manter streak (7 dias) | +50 (bônus) | A cada 7 dias |
| Manter streak (30 dias) | +200 (bônus) | A cada 30 dias |
| Primeiro acesso do dia | +3 | Uma vez por dia |

### Limites Anti-Abuse
```java
public class XPLimits {
    // Máximo de XP por dia para evitar farming
    public static final int MAX_DAILY_XP = 300;

    // Máximo de XP por conversas (evita bots)
    public static final int MAX_CONVERSATION_XP_PER_DAY = 150;

    // Cooldown entre ações repetidas
    public static final Duration FAVORITE_COOLDOWN = Duration.ofMinutes(5);
}
```

### Cálculo de XP
```java
@Service
public class XPService {

    public void awardConversationXP(User user, Conversation conversation) {
        int xp = 0;

        // XP base por conversa
        if (conversation.getDuration() >= Duration.ofMinutes(5)) {
            xp += 10;
        }

        // Bônus por sessão completa
        if (isSessionComplete(user)) {
            xp += 20;
        }

        // Verificar limite diário
        int todayXP = getTodayXP(user);
        if (todayXP + xp > XPLimits.MAX_DAILY_XP) {
            xp = Math.max(0, XPLimits.MAX_DAILY_XP - todayXP);
        }

        if (xp > 0) {
            addXP(user, xp, XPSource.CONVERSATION);
            checkLevelUp(user);
            checkBadges(user);
        }
    }
}
```

---

## Sistema de Níveis

### Tabela de Níveis

| Nível | Nome | XP Necessário | XP Total | Badge |
|-------|------|---------------|----------|-------|
| 1 | Bronze I | 0 | 0 | 🥉 |
| 2 | Bronze II | 100 | 100 | 🥉 |
| 3 | Bronze III | 150 | 250 | 🥉 |
| 4 | Prata I | 200 | 450 | 🥈 |
| 5 | Prata II | 250 | 700 | 🥈 |
| 6 | Prata III | 300 | 1,000 | 🥈 |
| 7 | Ouro I | 400 | 1,400 | 🥇 |
| 8 | Ouro II | 500 | 1,900 | 🥇 |
| 9 | Ouro III | 600 | 2,500 | 🥇 |
| 10 | Platina I | 750 | 3,250 | 💎 |
| 11 | Platina II | 1,000 | 4,250 | 💎 |
| 12 | Platina III | 1,250 | 5,500 | 💎 |
| 13 | Diamante I | 1,500 | 7,000 | 💠 |
| 14 | Diamante II | 2,000 | 9,000 | 💠 |
| 15 | Diamante III | 2,500 | 11,500 | 💠 |
| 16 | Mestre | 3,500 | 15,000 | 👑 |
| 17+ | Grão-Mestre | +5,000/nível | - | 👑✨ |

### Progressão Visual
```
Bronze III: [████████░░] 80% → Prata I
XP: 400/450
```

### Level Up
```java
public void checkLevelUp(User user) {
    int newLevel = calculateLevel(user.getTotalXP());

    if (newLevel > user.getLevel()) {
        user.setLevel(newLevel);

        // Notificar usuário
        notificationService.notify(user, new LevelUpNotification(
            newLevel,
            getLevelName(newLevel),
            getLevelBadge(newLevel)
        ));

        // Conceder badge de nível se aplicável
        checkLevelBadges(user, newLevel);
    }
}
```

---

## Sistema de Badges

### Categorias de Badges

#### Badges de Conversação
| Badge | Nome | Condição | Ícone |
|-------|------|----------|-------|
| first_conversation | Primeira Conversa | Completar 1ª conversa | 💬 |
| conversation_10 | Conversador | Completar 10 conversas | 🗣️ |
| conversation_50 | Comunicador | Completar 50 conversas | 📢 |
| conversation_100 | Orador | Completar 100 conversas | 🎤 |
| conversation_500 | Mestre da Conversa | Completar 500 conversas | 🏆 |

#### Badges de Tempo
| Badge | Nome | Condição | Ícone |
|-------|------|----------|-------|
| hour_1 | Uma Hora | Praticar 1 hora total | ⏱️ |
| hour_10 | Dez Horas | Praticar 10 horas total | ⌚ |
| hour_50 | Cinquenta Horas | Praticar 50 horas total | 🕐 |
| hour_100 | Cem Horas | Praticar 100 horas total | ⏰ |

#### Badges de Streak
| Badge | Nome | Condição | Ícone |
|-------|------|----------|-------|
| streak_7 | Uma Semana | 7 dias consecutivos | 🔥 |
| streak_30 | Um Mês | 30 dias consecutivos | 🌟 |
| streak_100 | Cem Dias | 100 dias consecutivos | 💯 |
| streak_365 | Um Ano | 365 dias consecutivos | 🎊 |

#### Badges Sociais
| Badge | Nome | Condição | Ícone |
|-------|------|----------|-------|
| popular_10 | Popular | 10 pessoas te favoritaram | ⭐ |
| popular_50 | Muito Popular | 50 pessoas te favoritaram | 🌟 |
| popular_100 | Celebridade | 100 pessoas te favoritaram | ✨ |
| helpful | Prestativo | Média de avaliação > 4.5 (mín 20 avaliações) | 🤝 |
| perfect_rating | Avaliação Perfeita | 10 avaliações 5 estrelas seguidas | ⭐⭐⭐⭐⭐ |

#### Badges de Idioma
| Badge | Nome | Condição | Ícone |
|-------|------|----------|-------|
| english_beginner | English Starter | Completar 10 conversas em inglês | 🇬🇧 |
| english_intermediate | English Speaker | Completar 50 conversas em inglês | 🇺🇸 |
| english_advanced | English Master | Completar 200 conversas em inglês | 🎓 |
| spanish_beginner | Español Starter | Completar 10 conversas em espanhol | 🇪🇸 |
| spanish_intermediate | Español Speaker | Completar 50 conversas em espanhol | 🇲🇽 |
| spanish_advanced | Español Master | Completar 200 conversas em espanhol | 🎓 |
| polyglot | Poliglota | Praticar 2+ idiomas | 🌍 |

#### Badges Especiais
| Badge | Nome | Condição | Ícone |
|-------|------|----------|-------|
| early_adopter | Early Adopter | Criar conta nos primeiros 30 dias | 🚀 |
| premium | Premium | Assinar plano premium | 💎 |
| beta_tester | Beta Tester | Participar do beta | 🧪 |

### Modelo de Dados
```java
@Entity
public class Badge {
    @Id
    private String id;  // "conversation_10"

    private String name;  // "Conversador"
    private String description;
    private String icon;  // emoji ou URL
    private String category;  // CONVERSATION, TIME, STREAK, SOCIAL, LANGUAGE, SPECIAL

    @Enumerated
    private Rarity rarity;  // COMMON, UNCOMMON, RARE, EPIC, LEGENDARY
}

@Entity
public class UserBadge {
    @Id
    private UUID id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Badge badge;

    private LocalDateTime earnedAt;
    private boolean displayed;  // Mostrar no perfil
}
```

### Verificação de Badges
```java
@Service
public class BadgeService {

    public void checkBadges(User user) {
        checkConversationBadges(user);
        checkTimeBadges(user);
        checkStreakBadges(user);
        checkSocialBadges(user);
        checkLanguageBadges(user);
    }

    private void checkConversationBadges(User user) {
        long conversations = conversationRepository.countByUser(user);

        Map<Long, String> thresholds = Map.of(
            1L, "first_conversation",
            10L, "conversation_10",
            50L, "conversation_50",
            100L, "conversation_100",
            500L, "conversation_500"
        );

        thresholds.forEach((threshold, badgeId) -> {
            if (conversations >= threshold && !hasBadge(user, badgeId)) {
                awardBadge(user, badgeId);
            }
        });
    }
}
```

---

## Sistema de Streaks

### Regras do Streak
```java
public class StreakRules {
    // Uma conversa completa (5+ min) conta para o streak
    public static final Duration MIN_CONVERSATION_DURATION = Duration.ofMinutes(5);

    // Fuso horário do usuário é considerado
    // Streak reseta à meia-noite local

    // Grace period: até 4h após meia-noite
    public static final Duration GRACE_PERIOD = Duration.ofHours(4);

    // Streak freeze: 1 por mês (premium)
    public static final int MONTHLY_FREEZES = 1;
}
```

### Cálculo de Streak
```java
@Service
public class StreakService {

    public void updateStreak(User user) {
        LocalDate today = LocalDate.now(user.getTimezone());
        LocalDate lastActive = user.getLastActiveDate();

        if (lastActive == null) {
            // Primeiro dia
            user.setCurrentStreak(1);
            user.setLastActiveDate(today);
            return;
        }

        long daysDiff = ChronoUnit.DAYS.between(lastActive, today);

        if (daysDiff == 0) {
            // Já praticou hoje, não faz nada
            return;
        } else if (daysDiff == 1) {
            // Dia consecutivo
            user.setCurrentStreak(user.getCurrentStreak() + 1);
            user.setLastActiveDate(today);

            // Atualizar maior streak
            if (user.getCurrentStreak() > user.getLongestStreak()) {
                user.setLongestStreak(user.getCurrentStreak());
            }

            // Verificar bônus de streak
            checkStreakBonus(user);
        } else if (daysDiff <= 2 && hasStreakFreeze(user)) {
            // Usar streak freeze
            useStreakFreeze(user);
            user.setLastActiveDate(today);
        } else {
            // Streak quebrado
            notifyStreakLost(user, user.getCurrentStreak());
            user.setCurrentStreak(1);
            user.setLastActiveDate(today);
        }
    }
}
```

### UI do Streak
```
🔥 15 dias de prática!
[🔥🔥🔥🔥🔥🔥🔥] Semana atual

Maior streak: 45 dias
```

---

## Sistema de Ranking

### Opt-in
```java
// Usuário escolhe participar do ranking
user.setRankingOptIn(true);
```

### Tipos de Ranking
1. **Semanal** - Reset toda segunda-feira
2. **Mensal** - Reset no dia 1
3. **All-time** - Histórico completo

### Critérios
```java
public class RankingCriteria {
    // Pontuação = XP ganho no período
    // Desempate:
    // 1. Número de conversas
    // 2. Tempo total praticado
    // 3. Média de avaliação
}
```

### Estrutura Redis (Leaderboard)
```
Key: ranking:weekly:{year}:{week}
Type: Sorted Set
Score: XP semanal
Value: userId

Exemplo:
ranking:weekly:2024:03
  - user123 (score: 450)
  - user456 (score: 380)
  - user789 (score: 320)
```

### API de Ranking
```java
@GetMapping("/ranking/weekly")
public RankingResponse getWeeklyRanking(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size) {

    List<RankingEntry> top = rankingService.getTopUsers(page, size);
    RankingEntry myPosition = rankingService.getMyPosition(currentUser);

    return new RankingResponse(top, myPosition);
}
```

### UI do Ranking
```
🏆 Ranking Semanal

1. 🥇 João Silva      - 450 XP
2. 🥈 Maria Santos    - 380 XP
3. 🥉 Pedro Lima      - 320 XP
4.    Ana Costa       - 290 XP
5.    Lucas Oliveira  - 275 XP
...
42.   Você           - 125 XP
```

---

## Modelo de Dados Completo

```java
@Entity
public class UserGamification {
    @Id
    private UUID id;

    @OneToOne
    private User user;

    // XP
    private int totalXP;
    private int weeklyXP;
    private int monthlyXP;

    // Níveis
    private int level;
    private String levelName;

    // Streaks
    private int currentStreak;
    private int longestStreak;
    private LocalDate lastActiveDate;
    private int streakFreezesRemaining;
    private LocalDate lastStreakFreezeReset;

    // Ranking
    private boolean rankingOptIn;
    private Integer weeklyRank;
    private Integer monthlyRank;
    private Integer allTimeRank;

    // Estatísticas
    private int totalConversations;
    private Duration totalPracticeTime;
    private int uniquePartners;
}
```

---

## Notificações de Gamificação

| Evento | Notificação |
|--------|-------------|
| Level up | "🎉 Parabéns! Você subiu para {nível}!" |
| Badge earned | "🏅 Nova conquista: {badge}!" |
| Streak milestone | "🔥 Incrível! {n} dias de streak!" |
| Streak at risk | "⚠️ Pratique hoje para manter seu streak!" |
| Streak lost | "😢 Seu streak de {n} dias foi perdido" |
| Ranking up | "📈 Você subiu para #{posição} no ranking!" |

---

## Próximos Passos

- [ ] Criar entidades de gamificação
- [ ] Implementar XPService
- [ ] Implementar BadgeService
- [ ] Implementar StreakService
- [ ] Criar UI de progresso
- [ ] Implementar ranking com Redis
- [ ] Adicionar notificações

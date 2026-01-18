# Sistema de Tópicos de Conversa - SpeakUp

## Visão Geral

Durante o intervalo de 30 segundos entre conversas, a IA gera um tópico de conversa para ajudar os usuários a iniciarem a próxima interação. O tópico:
- É gerado automaticamente via Claude/OpenAI
- Fica visível durante todo o intervalo de 30s
- Permanece exibido acima do vídeo durante a conversa
- É apenas uma sugestão (usuários podem ignorar)
- É categorizado para facilitar variedade

---

## Fluxo de Geração

```
1. Conversa termina (timer 00:00)
2. Usuários vão para tela de avaliação
3. Sistema inicia geração de tópico em background
4. Intervalo de 30s começa
5. Tópico aparece na tela de intervalo
6. Nova conversa começa
7. Tópico fica visível acima dos vídeos
8. Conversa termina, ciclo repete
```

### Diagrama
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Conversa    │ →  │  Avaliação   │ →  │  Intervalo   │
│  (10 min)    │    │  (~5-10s)    │    │  (30s)       │
└──────────────┘    └──────────────┘    └──────────────┘
                           │                   │
                           └─── Gera tópico ───┘
                                async
```

---

## Categorias de Tópicos

### Categorias Disponíveis
```java
public enum TopicCategory {
    TRAVEL("Viagens", "Travel-related topics"),
    TECHNOLOGY("Tecnologia", "Tech, gadgets, internet"),
    CULTURE("Cultura", "Movies, music, art, books"),
    FOOD("Comida", "Food, cooking, restaurants"),
    SPORTS("Esportes", "Sports and fitness"),
    BUSINESS("Negócios", "Work, career, business"),
    DAILY_LIFE("Vida Cotidiana", "Everyday situations"),
    HYPOTHETICAL("Situações Hipotéticas", "What if scenarios"),
    OPINIONS("Opiniões", "Debates and opinions"),
    HOBBIES("Hobbies", "Hobbies and interests"),
    ENVIRONMENT("Meio Ambiente", "Nature, climate, sustainability"),
    EDUCATION("Educação", "Learning, school, knowledge");
}
```

### Configuração pelo Admin
O admin pode:
- Habilitar/desabilitar categorias
- Definir peso (frequência) de cada categoria
- Adicionar tópicos customizados
- Excluir tópicos específicos

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Configurar Categorias de Tópicos                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Categoria          │ Ativo │ Peso │ Exemplo               │
│  ───────────────────┼───────┼──────┼─────────────────────  │
│  Viagens            │  ✅   │ 15%  │ "If you could..."    │
│  Tecnologia         │  ✅   │ 12%  │ "What do you think..." │
│  Cultura            │  ✅   │ 15%  │ "Have you seen..."    │
│  Comida             │  ✅   │ 10%  │ "What's your favorite..."│
│  Esportes           │  ✅   │  8%  │ "Do you practice..."  │
│  Negócios           │  ✅   │ 10%  │ "What would you do..." │
│  Vida Cotidiana     │  ✅   │ 10%  │ "Tell me about..."    │
│  Situações Hipot.   │  ✅   │ 15%  │ "What would happen..."│
│  Opiniões           │  ☐   │  0%  │ [Desabilitado]        │
│  Hobbies            │  ✅   │  5%  │ "What do you like..."  │
│                                                             │
│  [Salvar Configurações]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### Tópico
```java
@Entity
public class Topic {
    @Id
    private UUID id;

    private String content;        // Texto do tópico em inglês
    private String contentPt;      // Tradução em português (opcional)

    @Enumerated
    private TopicCategory category;

    @Enumerated
    private TopicDifficulty difficulty;  // BEGINNER, INTERMEDIATE, ADVANCED

    private boolean customTopic;   // Criado manualmente pelo admin
    private boolean active;

    private int timesUsed;         // Quantas vezes foi usado
    private LocalDateTime lastUsedAt;

    private LocalDateTime createdAt;
    private String createdBy;      // "AI" ou adminId
}
```

### Configuração de Categoria
```java
@Entity
public class TopicCategoryConfig {
    @Id
    private String category;       // Enum name

    private boolean active;
    private int weight;            // 0-100 (porcentagem relativa)

    private LocalDateTime updatedAt;
    private String updatedBy;
}
```

### Histórico de Tópicos por Sessão
```java
@Entity
public class SessionTopicHistory {
    @Id
    private UUID id;

    private UUID sessionId;
    private UUID conversationId;
    private UUID topicId;

    private LocalDateTime generatedAt;
    private long generationTimeMs;  // Tempo de geração
}
```

---

## Geração com IA

### Prompt para Geração
```java
@Service
public class TopicGeneratorService {

    private static final String GENERATION_PROMPT = """
        Generate a conversation topic for language practice.

        Requirements:
        - Category: %s
        - Difficulty: %s (adjust vocabulary and complexity)
        - Language: English
        - Format: A single question or conversation starter
        - Length: 1-2 sentences maximum
        - Style: Open-ended, encourages discussion
        - Avoid: Yes/no questions, controversial politics, religion

        Examples for reference:
        - "If you could travel anywhere in the world, where would you go and why?"
        - "What's a skill you'd like to learn in the next year?"
        - "Tell me about a movie or book that changed your perspective on something."

        Generate ONE topic:
        """;

    public String generateTopic(TopicCategory category, TopicDifficulty difficulty) {
        String prompt = String.format(GENERATION_PROMPT,
            category.getDescription(),
            difficulty.name()
        );

        return aiService.complete(prompt);
    }
}
```

### Geração Assíncrona
```java
@Service
public class TopicService {

    @Async
    public CompletableFuture<Topic> generateTopicAsync(
            TopicCategory category,
            TopicDifficulty difficulty) {

        long startTime = System.currentTimeMillis();

        // Tentar usar tópico existente primeiro (cache)
        Topic existingTopic = findUnusedTopic(category, difficulty);
        if (existingTopic != null) {
            return CompletableFuture.completedFuture(existingTopic);
        }

        // Gerar novo tópico
        String content = topicGenerator.generateTopic(category, difficulty);

        Topic topic = new Topic();
        topic.setContent(content);
        topic.setCategory(category);
        topic.setDifficulty(difficulty);
        topic.setCreatedBy("AI");

        topicRepository.save(topic);

        long duration = System.currentTimeMillis() - startTime;
        metricsService.recordTopicGeneration(duration);

        return CompletableFuture.completedFuture(topic);
    }
}
```

### Seleção de Categoria
```java
public TopicCategory selectCategory() {
    // Pegar configurações ativas
    List<TopicCategoryConfig> activeConfigs = configRepository
        .findByActiveTrue();

    // Calcular total de pesos
    int totalWeight = activeConfigs.stream()
        .mapToInt(TopicCategoryConfig::getWeight)
        .sum();

    // Seleção ponderada aleatória
    int random = ThreadLocalRandom.current().nextInt(totalWeight);
    int cumulative = 0;

    for (TopicCategoryConfig config : activeConfigs) {
        cumulative += config.getWeight();
        if (random < cumulative) {
            return TopicCategory.valueOf(config.getCategory());
        }
    }

    // Fallback
    return TopicCategory.DAILY_LIFE;
}
```

---

## Cache de Tópicos

Para evitar latência de geração, manter um pool de tópicos pré-gerados:

### Estratégia de Cache
```java
@Service
public class TopicCacheService {

    private static final int MIN_CACHED_PER_CATEGORY = 10;
    private static final int MAX_TOPIC_AGE_DAYS = 30;

    @Scheduled(fixedRate = 300000)  // A cada 5 minutos
    public void maintainCache() {
        for (TopicCategory category : TopicCategory.values()) {
            if (!isActive(category)) continue;

            for (TopicDifficulty difficulty : TopicDifficulty.values()) {
                int cached = countUnusedTopics(category, difficulty);

                if (cached < MIN_CACHED_PER_CATEGORY) {
                    int toGenerate = MIN_CACHED_PER_CATEGORY - cached;
                    generateTopicsAsync(category, difficulty, toGenerate);
                }
            }
        }

        // Limpar tópicos antigos
        cleanupOldTopics();
    }

    private void cleanupOldTopics() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(MAX_TOPIC_AGE_DAYS);
        topicRepository.deleteByCreatedAtBeforeAndCustomTopicFalse(cutoff);
    }
}
```

### Estrutura Redis para Cache Rápido
```
Key: topics:pool:{category}:{difficulty}
Type: List
Values: topic IDs

Exemplo:
topics:pool:TRAVEL:INTERMEDIATE = [topic1, topic2, topic3, ...]
```

---

## Exibição do Tópico

### Durante o Intervalo
```
┌─────────────────────────────────────────────┐
│ ⏱️ Próxima conversa em: 28s                │
├─────────────────────────────────────────────┤
│                                             │
│ 💬 Sugestão de tópico:                      │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │  "If you could have dinner with any    │ │
│ │   historical figure, who would it be   │ │
│ │   and what would you ask them?"        │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ 📂 Categoria: Situações Hipotéticas        │
│                                             │
│ ────────────────────────────────────────── │
│                                             │
│ Conversa 3 de 6                             │
│                                             │
└─────────────────────────────────────────────┘
```

### Durante a Conversa
```
┌─────────────────────────────────────────────┐
│ 💬 "If you could have dinner with any      │
│     historical figure, who would it be?"    │
├─────────────────────────────────────────────┤
│                                             │
│    ┌─────────────┐    ┌─────────────┐      │
│    │             │    │             │      │
│    │   Você      │    │   Maria     │      │
│    │             │    │             │      │
│    └─────────────┘    └─────────────┘      │
│                                             │
│              ⏱️ 08:32                       │
│                                             │
└─────────────────────────────────────────────┘
```

### Componente React
```tsx
interface TopicBannerProps {
  topic: string;
  category?: string;
  showCategory?: boolean;
}

function TopicBanner({ topic, category, showCategory = false }: TopicBannerProps) {
  return (
    <div className="topic-banner">
      <div className="topic-icon">💬</div>
      <div className="topic-content">
        <p className="topic-text">"{topic}"</p>
        {showCategory && category && (
          <span className="topic-category">📂 {category}</span>
        )}
      </div>
    </div>
  );
}
```

---

## API Endpoints

### Tópicos (Interno/Sistema)
```
GET    /api/topics/next                  # Próximo tópico para conversa
POST   /api/topics/generate              # Forçar geração (debug)
```

### Admin - Tópicos
```
GET    /api/admin/topics                 # Listar todos tópicos
POST   /api/admin/topics                 # Criar tópico customizado
PUT    /api/admin/topics/{id}            # Editar tópico
DELETE /api/admin/topics/{id}            # Remover tópico

GET    /api/admin/topics/categories      # Listar configurações
PUT    /api/admin/topics/categories      # Atualizar configurações
```

### Exemplos de Response
```json
// GET /api/topics/next
{
  "id": "topic-uuid",
  "content": "If you could travel anywhere in the world right now, where would you go?",
  "category": "TRAVEL",
  "difficulty": "INTERMEDIATE"
}

// GET /api/admin/topics/categories
{
  "categories": [
    {
      "category": "TRAVEL",
      "name": "Viagens",
      "active": true,
      "weight": 15,
      "topicsCount": 45
    },
    {
      "category": "TECHNOLOGY",
      "name": "Tecnologia",
      "active": true,
      "weight": 12,
      "topicsCount": 38
    }
  ]
}
```

---

## Tópicos Customizados

Admin pode adicionar tópicos manualmente:

```
┌─────────────────────────────────────────────────────────────┐
│ ➕ Adicionar Tópico Customizado                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Texto do tópico (inglês):                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ What technology do you think will change our lives  │   │
│  │ the most in the next 10 years?                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Categoria:                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tecnologia                                     ▼    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Dificuldade:                                              │
│  ○ Beginner  ● Intermediate  ○ Advanced                    │
│                                                             │
│  [Cancelar]                              [Salvar]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Métricas

```
# Geração
- topics.generation.count
- topics.generation.latency_ms
- topics.generation.errors

# Uso
- topics.used.count
- topics.used.by_category
- topics.cache.hit_rate

# Pool
- topics.pool.size
- topics.pool.by_category
```

---

## Configurações

```yaml
topics:
  # Geração
  generation:
    enabled: true
    model: "claude-3-haiku"  # Modelo rápido e barato
    timeout-ms: 5000
    max-retries: 2

  # Cache
  cache:
    min-per-category: 10
    max-age-days: 30
    cleanup-interval: 300000  # 5 min

  # Fallback
  fallback:
    enabled: true
    topics:
      - "Tell me about yourself and what you do."
      - "What are your plans for the weekend?"
      - "What's something interesting that happened to you recently?"

  # Categorias default
  categories:
    TRAVEL: { active: true, weight: 15 }
    TECHNOLOGY: { active: true, weight: 12 }
    CULTURE: { active: true, weight: 15 }
    FOOD: { active: true, weight: 10 }
    DAILY_LIFE: { active: true, weight: 15 }
    HYPOTHETICAL: { active: true, weight: 18 }
    HOBBIES: { active: true, weight: 10 }
    BUSINESS: { active: true, weight: 5 }
```

---

## Fallback

Se a geração falhar ou demorar muito:

```java
@Service
public class TopicFallbackService {

    private static final List<String> FALLBACK_TOPICS = List.of(
        "Tell me about yourself. What do you do and what are your hobbies?",
        "What did you do last weekend?",
        "What are your plans for the upcoming holidays?",
        "What's the best movie or TV show you've watched recently?",
        "If you could learn any new skill instantly, what would it be?",
        "What's your favorite way to relax after a long day?",
        "Tell me about a place you'd love to visit someday.",
        "What's something you're looking forward to this month?",
        "Do you prefer working from home or in an office? Why?",
        "What's the most interesting thing you learned recently?"
    );

    public String getFallbackTopic() {
        int index = ThreadLocalRandom.current().nextInt(FALLBACK_TOPICS.size());
        return FALLBACK_TOPICS.get(index);
    }
}
```

---

## Próximos Passos

- [ ] Criar entidades de tópicos
- [ ] Implementar geração via Claude/OpenAI
- [ ] Criar pool de tópicos pré-gerados
- [ ] Implementar seleção ponderada por categoria
- [ ] Criar UI de configuração no admin
- [ ] Adicionar componente de exibição no frontend
- [ ] Implementar métricas de uso

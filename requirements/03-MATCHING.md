# Sistema de Matching - SpeakUp

> **ATUALIZADO**: Novo algoritmo com favoritos baseados em porcentagem, sala de 3, e sem repetição na mesma sessão.

## Visão Geral

O sistema de matching pareia usuários dentro de uma sessão ativa, considerando:
1. **Não repetir** parceiro na mesma sessão (obrigatório)
2. **Favoritos mútuos** (+40% chance)
3. **Favoritos unilaterais** (+30% chance)
4. **Mesmo nível** de proficiência
5. **Número ímpar** → sala de 3 pessoas

---

## Estrutura de Dados (Redis)

### Fila de Espera por Sessão
```
Key: session:{sessionId}:queue
Type: Sorted Set
Score: timestamp de entrada
Value: JSON com dados do usuário

Exemplo:
session:sess_19h_20h:queue
  - {"userId":"user123","level":"INTERMEDIATE","favorites":["user456"]} (score: 1705234567890)
  - {"userId":"user456","level":"INTERMEDIATE","favorites":["user123"]} (score: 1705234568000)
```

### Histórico de Pareamentos na Sessão
```
Key: session:{sessionId}:matched:{odId}
Type: Set
Values: IDs de usuários já pareados

Exemplo:
session:sess_19h_20h:matched:user123 = {user456, user789}
```

### Cache de Favoritos
```
Key: user:{userId}:favorites
Type: Set
Values: IDs de usuários favoritados

Key: user:{userId}:favoritedBy
Type: Set
Values: IDs de quem o favoritou
```

---

## Algoritmo de Matching

### Novo Algoritmo com Pesos

```python
def find_match(user, session):
    """Algoritmo principal de matching com favoritos ponderados"""

    # Buscar candidatos na fila (exceto o próprio usuário)
    candidates = get_queue(session.id).exclude(user.id)

    # Filtrar já pareados nesta sessão
    already_matched = get_matched_in_session(session.id, user.id)
    candidates = [c for c in candidates if c.id not in already_matched]

    if not candidates:
        return None

    # Calcular scores para cada candidato
    scored_candidates = []
    for candidate in candidates:
        score = calculate_match_score(user, candidate)
        scored_candidates.append((candidate, score))

    # Ordenar por score (maior primeiro)
    scored_candidates.sort(key=lambda x: x[1], reverse=True)

    # Selecionar com probabilidade ponderada
    return weighted_random_selection(scored_candidates)


def calculate_match_score(user, candidate):
    """Calcula score de compatibilidade"""
    base_score = 100

    # Verificar favoritos
    is_mutual = is_mutual_favorite(user.id, candidate.id)
    is_unilateral = is_favorite(user.id, candidate.id) or is_favorite(candidate.id, user.id)

    if is_mutual:
        base_score += 40  # +40% para favoritos mútuos
    elif is_unilateral:
        base_score += 30  # +30% para favoritos unilaterais

    # Verificar nível
    if user.level == candidate.level:
        base_score += 20  # Mesmo nível
    elif abs(level_to_int(user.level) - level_to_int(candidate.level)) == 1:
        base_score += 10  # Nível adjacente

    return base_score


def weighted_random_selection(scored_candidates):
    """Seleção aleatória ponderada por score"""
    total_score = sum(score for _, score in scored_candidates)

    # Gerar número aleatório
    rand = random.uniform(0, total_score)

    # Selecionar baseado no peso
    cumulative = 0
    for candidate, score in scored_candidates:
        cumulative += score
        if rand <= cumulative:
            return candidate

    # Fallback: retorna o primeiro
    return scored_candidates[0][0]
```

### Tratamento de Número Ímpar

```python
def run_matching_cycle(session):
    """Executa ciclo de matching para uma sessão"""

    queue = get_queue(session.id)
    matches = []

    while len(queue) >= 2:
        # Pegar primeiro da fila
        user1 = queue.pop(0)

        # Encontrar melhor match
        user2 = find_match(user1, session)

        if user2:
            queue.remove(user2)

            # Verificar se sobrou apenas 1
            if len(queue) == 1:
                # Criar sala de 3
                user3 = queue.pop(0)
                matches.append(create_room_3(user1, user2, user3, session))
            else:
                # Sala normal de 2
                matches.append(create_room_2(user1, user2, session))

            # Registrar pareamento
            register_match(session.id, user1.id, user2.id)
            if user3:
                register_match(session.id, user1.id, user3.id)
                register_match(session.id, user2.id, user3.id)

    return matches
```

---

## Criação de Salas

### Sala de 2 Pessoas
```java
public RoomInfo createRoom2(User user1, User user2, Session session) {
    String roomName = String.format("session_%s_room_%s",
        session.getId(),
        UUID.randomUUID().toString().substring(0, 8)
    );

    roomService.createRoom(CreateRoomRequest.newBuilder()
        .setName(roomName)
        .setMaxParticipants(2)
        .setEmptyTimeout(60)
        .build());

    return new RoomInfo(roomName, List.of(user1, user2));
}
```

### Sala de 3 Pessoas (Número Ímpar)
```java
public RoomInfo createRoom3(User user1, User user2, User user3, Session session) {
    String roomName = String.format("session_%s_room_%s_trio",
        session.getId(),
        UUID.randomUUID().toString().substring(0, 8)
    );

    roomService.createRoom(CreateRoomRequest.newBuilder()
        .setName(roomName)
        .setMaxParticipants(3)  // Sala de 3
        .setEmptyTimeout(60)
        .build());

    return new RoomInfo(roomName, List.of(user1, user2, user3));
}
```

---

## Sistema de Favoritos (ATUALIZADO)

### Como Favoritos São Criados
1. Após cada conversa, usuário responde: "Quer conversar novamente?"
2. Se **ambos** responderem Sim → viram favoritos mútuos automaticamente
3. Se **apenas um** responder Sim → favorito unilateral

### Implementação
```java
@Service
public class FavoriteService {

    public void processConversationEnd(Conversation conversation) {
        User user1 = conversation.getUser1();
        User user2 = conversation.getUser2();

        boolean user1WantsAgain = conversation.getUser1WantsAgain();
        boolean user2WantsAgain = conversation.getUser2WantsAgain();

        if (user1WantsAgain && user2WantsAgain) {
            // Favoritos mútuos
            addFavorite(user1.getId(), user2.getId());
            addFavorite(user2.getId(), user1.getId());
            notifyMutualFavorite(user1, user2);
        } else if (user1WantsAgain) {
            // Apenas user1 quer
            addFavorite(user1.getId(), user2.getId());
        } else if (user2WantsAgain) {
            // Apenas user2 quer
            addFavorite(user2.getId(), user1.getId());
        }
    }

    public boolean isMutualFavorite(String userId1, String userId2) {
        return isFavorite(userId1, userId2) && isFavorite(userId2, userId1);
    }

    public boolean isFavorite(String userId, String targetId) {
        return redisTemplate.opsForSet()
            .isMember("user:" + userId + ":favorites", targetId);
    }
}
```

### Porcentagens de Matching
```java
public class MatchingWeights {
    public static final int BASE_SCORE = 100;
    public static final int MUTUAL_FAVORITE_BONUS = 40;   // +40%
    public static final int UNILATERAL_FAVORITE_BONUS = 30; // +30%
    public static final int SAME_LEVEL_BONUS = 20;
    public static final int ADJACENT_LEVEL_BONUS = 10;
}
```

---

## Fluxo de um Ciclo de Matching

```
┌─────────────────────────────────────────────────────────────────┐
│                    CICLO DE 10 MINUTOS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  00:00 - Fim da conversa anterior                              │
│         ↓                                                       │
│  00:00 - Tela de avaliação (estrelas + "quer novamente?")      │
│         ↓                                                       │
│  00:05 - Processamento de favoritos                            │
│         ↓                                                       │
│  00:05 - Início do intervalo de 30s                            │
│         ↓                                                       │
│  00:05 - IA gera tópico de conversa                            │
│         ↓                                                       │
│  00:10 - Usuário volta para fila de matching                   │
│         ↓                                                       │
│  00:15 - Algoritmo de matching executa                         │
│         ↓                                                       │
│  00:20 - Match encontrado, tokens gerados                      │
│         ↓                                                       │
│  00:25 - Notificação via WebSocket                             │
│         ↓                                                       │
│  00:30 - Countdown 5s                                          │
│         ↓                                                       │
│  00:35 - Nova conversa começa                                  │
│         ↓                                                       │
│  10:35 - Conversa termina, ciclo reinicia                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prevenção de Re-Match na Sessão

```java
@Service
public class MatchHistoryService {

    private static final String KEY_PATTERN = "session:%s:matched:%s";

    public void registerMatch(String sessionId, String user1Id, String user2Id) {
        // Registrar para ambos os usuários
        String key1 = String.format(KEY_PATTERN, sessionId, user1Id);
        String key2 = String.format(KEY_PATTERN, sessionId, user2Id);

        redisTemplate.opsForSet().add(key1, user2Id);
        redisTemplate.opsForSet().add(key2, user1Id);

        // TTL de 2 horas (duração máxima de uma sessão)
        redisTemplate.expire(key1, Duration.ofHours(2));
        redisTemplate.expire(key2, Duration.ofHours(2));
    }

    public boolean alreadyMatchedInSession(String sessionId, String user1Id, String user2Id) {
        String key = String.format(KEY_PATTERN, sessionId, user1Id);
        return Boolean.TRUE.equals(
            redisTemplate.opsForSet().isMember(key, user2Id)
        );
    }

    public Set<String> getMatchedUsers(String sessionId, String odId) {
        String key = String.format(KEY_PATTERN, sessionId, odId);
        return redisTemplate.opsForSet().members(key);
    }
}
```

---

## API Endpoints

### Fila
```
POST   /api/sessions/{sessionId}/join     # Entrar na fila da sessão
DELETE /api/sessions/{sessionId}/leave    # Sair da fila
GET    /api/sessions/{sessionId}/status   # Status (posição, tempo)
```

### Favoritos
```
GET    /api/favorites                     # Listar meus favoritos
GET    /api/favorites/mutual              # Apenas favoritos mútuos
DELETE /api/favorites/{userId}            # Remover favorito
```

### Avaliação
```
POST   /api/conversations/{id}/rate       # Avaliar conversa
Body: {
  "stars": 4,
  "wantAgain": true,
  "feedback": "Great conversation!"
}
```

### WebSocket Events
```
SUBSCRIPTIONS:
/user/queue/match          # Match encontrado
/user/queue/waiting        # Atualização de fila
/user/session/topic        # Novo tópico gerado

PAYLOADS:
{
  "type": "MATCH_FOUND",
  "roomName": "session_abc_room_xyz",
  "partners": [
    {"id": "user456", "name": "Maria", "level": "INTERMEDIATE"}
  ],
  "topic": "If you could travel anywhere...",
  "isTrioRoom": false
}
```

---

## Métricas

```
- matching.cycle.duration_ms
- matching.success_rate
- matching.trio_rooms_created
- matching.favorite_matches (mutual vs unilateral)
- matching.same_level_rate
- matching.users_without_match
```

---

## Configurações

```yaml
matching:
  cycle-interval: 30s        # Intervalo entre ciclos
  max-wait-cycles: 6         # Máximo de ciclos esperando
  favorite-mutual-bonus: 40  # % de bônus para favoritos mútuos
  favorite-unilateral-bonus: 30  # % de bônus para favoritos unilaterais
  same-level-bonus: 20       # % de bônus para mesmo nível
  adjacent-level-bonus: 10   # % de bônus para nível adjacente
```

---

## Próximos Passos

- [ ] Implementar estrutura Redis
- [ ] Criar MatchingService com pesos
- [ ] Implementar sala de 3
- [ ] Criar FavoriteService com "quer novamente"
- [ ] WebSocket handlers
- [ ] Testes de carga do algoritmo

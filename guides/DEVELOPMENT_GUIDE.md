# Guia de Boas Práticas de Desenvolvimento - SpeakUp

## Índice

1. [Princípios Fundamentais](#princípios-fundamentais)
2. [Test-Driven Development (TDD)](#test-driven-development-tdd)
3. [Design Patterns](#design-patterns)
4. [Arquitetura Limpa](#arquitetura-limpa)
5. [SOLID Principles](#solid-principles)
6. [Code Quality](#code-quality)
7. [Git Workflow](#git-workflow)
8. [API Design](#api-design)
9. [Segurança](#segurança)
10. [Performance](#performance)
11. [Documentação](#documentação)

---

## Princípios Fundamentais

### KISS (Keep It Simple, Stupid)
- Prefira soluções simples e diretas
- Evite over-engineering
- Se uma solução parece complexa demais, provavelmente existe uma mais simples

### DRY (Don't Repeat Yourself)
- Extraia código duplicado para funções/classes reutilizáveis
- Centralize lógica de negócio
- Use constants para valores repetidos

### YAGNI (You Aren't Gonna Need It)
- Não implemente funcionalidades "para o futuro"
- Implemente apenas o necessário para o requisito atual
- Refatore quando a necessidade real surgir

---

## Test-Driven Development (TDD)

### O Ciclo Red-Green-Refactor

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│    ┌─────────┐     ┌─────────┐     ┌──────────┐        │
│    │  RED    │ ──► │  GREEN  │ ──► │ REFACTOR │        │
│    │ (Fail)  │     │ (Pass)  │     │ (Improve)│        │
│    └─────────┘     └─────────┘     └──────────┘        │
│         ▲                               │              │
│         └───────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

1. **RED**: Escreva um teste que falha
2. **GREEN**: Escreva o código mínimo para passar
3. **REFACTOR**: Melhore o código mantendo os testes verdes

### Estrutura de Testes

```java
// Backend (Java/JUnit 5)
@DisplayName("UserService")
class UserServiceTest {

    @Nested
    @DisplayName("quando criar usuário")
    class CreateUser {

        @Test
        @DisplayName("deve criar usuário com dados válidos")
        void shouldCreateUserWithValidData() {
            // Arrange (Given)
            CreateUserRequest request = new CreateUserRequest("john@email.com", "John");

            // Act (When)
            User user = userService.create(request);

            // Assert (Then)
            assertThat(user.getEmail()).isEqualTo("john@email.com");
            assertThat(user.getName()).isEqualTo("John");
            assertThat(user.getId()).isNotNull();
        }

        @Test
        @DisplayName("deve lançar exceção para email duplicado")
        void shouldThrowExceptionForDuplicateEmail() {
            // Arrange
            CreateUserRequest request = new CreateUserRequest("existing@email.com", "John");
            when(userRepository.existsByEmail(request.email())).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> userService.create(request))
                .isInstanceOf(DuplicateEmailException.class)
                .hasMessage("Email já cadastrado");
        }
    }
}
```

```typescript
// Frontend (React/Vitest)
describe('UserCard', () => {
  describe('quando renderizado', () => {
    it('deve exibir nome do usuário', () => {
      // Arrange
      const user = { id: '1', name: 'John', email: 'john@email.com' };

      // Act
      render(<UserCard user={user} />);

      // Assert
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('deve chamar onEdit ao clicar no botão editar', async () => {
      // Arrange
      const user = { id: '1', name: 'John', email: 'john@email.com' };
      const onEdit = vi.fn();

      // Act
      render(<UserCard user={user} onEdit={onEdit} />);
      await userEvent.click(screen.getByRole('button', { name: /editar/i }));

      // Assert
      expect(onEdit).toHaveBeenCalledWith(user);
    });
  });
});
```

### Pirâmide de Testes

```
              ┌───────────┐
              │    E2E    │  ← Poucos (lentos, frágeis)
              │   Tests   │
             ┌┴───────────┴┐
             │ Integration │  ← Alguns (testam integração)
             │    Tests    │
            ┌┴─────────────┴┐
            │     Unit      │  ← Muitos (rápidos, isolados)
            │     Tests     │
            └───────────────┘
```

### Cobertura Mínima Recomendada
- **Unit Tests**: 80%+ para lógica de negócio
- **Integration Tests**: Todos os endpoints da API
- **E2E Tests**: Fluxos críticos (login, pagamento, etc.)

---

## Design Patterns

### Creational Patterns

#### Builder Pattern
Use para criar objetos complexos com muitos parâmetros opcionais.

```java
// Ao invés de construtores telescópicos
User user = User.builder()
    .email("john@email.com")
    .name("John")
    .language(Language.ENGLISH)
    .level(Level.INTERMEDIATE)
    .timezone(ZoneId.of("America/Sao_Paulo"))
    .build();
```

#### Factory Pattern
Use para encapsular a lógica de criação de objetos.

```java
public interface NotificationFactory {
    Notification create(NotificationType type, User user, String message);
}

@Component
public class NotificationFactoryImpl implements NotificationFactory {
    @Override
    public Notification create(NotificationType type, User user, String message) {
        return switch (type) {
            case EMAIL -> new EmailNotification(user.getEmail(), message);
            case PUSH -> new PushNotification(user.getDeviceToken(), message);
            case SMS -> new SmsNotification(user.getPhone(), message);
        };
    }
}
```

### Structural Patterns

#### Repository Pattern
Abstrai o acesso a dados.

```java
public interface UserRepository {
    Optional<User> findById(UUID id);
    Optional<User> findByEmail(String email);
    User save(User user);
    void delete(UUID id);
    List<User> findByLevel(Level level);
}

// Implementação com JPA
@Repository
public interface JpaUserRepository extends JpaRepository<User, UUID>, UserRepository {
    // Spring Data implementa automaticamente
}
```

#### Adapter Pattern
Adapta interfaces incompatíveis.

```java
// Interface esperada pelo sistema
public interface PaymentGateway {
    PaymentResult charge(Money amount, PaymentMethod method);
}

// Adapter para Stripe
@Component
public class StripePaymentAdapter implements PaymentGateway {
    private final StripeClient stripeClient;

    @Override
    public PaymentResult charge(Money amount, PaymentMethod method) {
        StripeCharge charge = stripeClient.createCharge(
            amount.toCents(),
            amount.getCurrency(),
            method.getToken()
        );
        return PaymentResult.from(charge);
    }
}
```

### Behavioral Patterns

#### Strategy Pattern
Use para trocar algoritmos em runtime.

```java
// Interface da estratégia
public interface MatchingStrategy {
    List<UserPair> match(List<User> users);
}

// Implementações
@Component("levelBased")
public class LevelBasedMatchingStrategy implements MatchingStrategy {
    @Override
    public List<UserPair> match(List<User> users) {
        // Pareia por nível de proficiência
    }
}

@Component("favoriteBased")
public class FavoriteBasedMatchingStrategy implements MatchingStrategy {
    @Override
    public List<UserPair> match(List<User> users) {
        // Prioriza favoritos mútuos
    }
}

// Uso
@Service
public class MatchingService {
    private final Map<String, MatchingStrategy> strategies;

    public List<UserPair> match(List<User> users, String strategyName) {
        return strategies.get(strategyName).match(users);
    }
}
```

#### Observer Pattern (Event-Driven)
Use para desacoplar componentes.

```java
// Evento
public record ConversationEndedEvent(
    UUID conversationId,
    UUID user1Id,
    UUID user2Id,
    Duration duration
) {}

// Publisher
@Service
public class ConversationService {
    private final ApplicationEventPublisher eventPublisher;

    public void endConversation(UUID conversationId) {
        Conversation conv = // ... finaliza conversa

        eventPublisher.publishEvent(new ConversationEndedEvent(
            conv.getId(),
            conv.getUser1Id(),
            conv.getUser2Id(),
            conv.getDuration()
        ));
    }
}

// Listeners (desacoplados)
@Component
public class StatisticsListener {
    @EventListener
    public void onConversationEnded(ConversationEndedEvent event) {
        // Atualiza estatísticas
    }
}

@Component
public class GamificationListener {
    @EventListener
    public void onConversationEnded(ConversationEndedEvent event) {
        // Adiciona XP, verifica badges
    }
}
```

#### Command Pattern
Use para encapsular operações como objetos.

```java
// Command interface
public interface Command<T> {
    T execute();
}

// Comando específico
public record CreateSessionCommand(
    LocalTime startTime,
    LocalTime endTime,
    ZoneId timezone
) implements Command<Session> {

    @Override
    public Session execute() {
        // Lógica de criação
    }
}

// Handler
@Service
public class CommandHandler {
    public <T> T handle(Command<T> command) {
        // Logging, validação, etc.
        return command.execute();
    }
}
```

---

## Arquitetura Limpa

### Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION                           │
│  Controllers, DTOs, Mappers, Exception Handlers            │
├─────────────────────────────────────────────────────────────┤
│                       APPLICATION                           │
│  Use Cases, Application Services, Commands, Queries        │
├─────────────────────────────────────────────────────────────┤
│                         DOMAIN                              │
│  Entities, Value Objects, Domain Services, Repositories    │
├─────────────────────────────────────────────────────────────┤
│                      INFRASTRUCTURE                         │
│  Database, External APIs, Messaging, File System           │
└─────────────────────────────────────────────────────────────┘
```

### Regra de Dependência
- Dependências apontam para DENTRO (em direção ao Domain)
- Domain não conhece nada das outras camadas
- Use interfaces para inverter dependências

### Estrutura de Pastas (Backend)

```
src/main/java/com/speakup/
├── domain/
│   ├── user/
│   │   ├── User.java              # Entity
│   │   ├── UserId.java            # Value Object
│   │   ├── Email.java             # Value Object
│   │   └── UserRepository.java    # Interface
│   ├── session/
│   │   ├── Session.java
│   │   ├── SessionPeriod.java
│   │   └── SessionRepository.java
│   └── shared/
│       ├── Entity.java
│       └── ValueObject.java
├── application/
│   ├── user/
│   │   ├── CreateUserUseCase.java
│   │   ├── GetUserUseCase.java
│   │   └── dto/
│   │       ├── CreateUserRequest.java
│   │       └── UserResponse.java
│   └── session/
│       ├── CreateSessionUseCase.java
│       └── dto/
├── infrastructure/
│   ├── persistence/
│   │   ├── JpaUserRepository.java
│   │   └── JpaSessionRepository.java
│   ├── external/
│   │   ├── StripePaymentGateway.java
│   │   └── LiveKitVideoService.java
│   └── config/
│       ├── SecurityConfig.java
│       └── DatabaseConfig.java
└── presentation/
    ├── api/
    │   ├── UserController.java
    │   └── SessionController.java
    ├── exception/
    │   └── GlobalExceptionHandler.java
    └── mapper/
        └── UserMapper.java
```

### Estrutura de Pastas (Frontend)

```
src/
├── domain/
│   ├── entities/
│   │   ├── User.ts
│   │   └── Session.ts
│   └── repositories/
│       └── UserRepository.ts      # Interface
├── application/
│   ├── hooks/
│   │   ├── useUser.ts
│   │   └── useSession.ts
│   └── services/
│       └── AuthService.ts
├── infrastructure/
│   ├── api/
│   │   ├── userApi.ts
│   │   └── sessionApi.ts
│   └── storage/
│       └── localStorage.ts
├── presentation/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   └── Modal/
│   │   └── features/
│   │       ├── user/
│   │       └── session/
│   ├── pages/
│   │   ├── Home/
│   │   └── Session/
│   └── layouts/
│       └── MainLayout/
└── shared/
    ├── types/
    ├── utils/
    └── constants/
```

---

## SOLID Principles

### S - Single Responsibility Principle
Cada classe deve ter apenas uma razão para mudar.

```java
// ❌ RUIM: Múltiplas responsabilidades
public class User {
    public void save() { /* salva no banco */ }
    public void sendEmail() { /* envia email */ }
    public String toJson() { /* serializa */ }
}

// ✅ BOM: Responsabilidades separadas
public class User { /* apenas dados e regras de negócio */ }
public class UserRepository { /* persistência */ }
public class UserNotificationService { /* notificações */ }
public class UserSerializer { /* serialização */ }
```

### O - Open/Closed Principle
Aberto para extensão, fechado para modificação.

```java
// ❌ RUIM: Precisa modificar para adicionar novo tipo
public class CreditCalculator {
    public int calculate(String type, int amount) {
        if (type.equals("session")) return amount * 6;
        if (type.equals("conversation")) return amount;
        // Precisa adicionar novo if para cada tipo
    }
}

// ✅ BOM: Extensível sem modificação
public interface CreditCalculator {
    int calculate(int amount);
}

public class SessionCreditCalculator implements CreditCalculator {
    public int calculate(int amount) { return amount * 6; }
}

public class ConversationCreditCalculator implements CreditCalculator {
    public int calculate(int amount) { return amount; }
}
```

### L - Liskov Substitution Principle
Subtipos devem ser substituíveis por seus tipos base.

```java
// ❌ RUIM: Subtipo quebra o contrato
public class Rectangle {
    protected int width, height;
    public void setWidth(int w) { width = w; }
    public void setHeight(int h) { height = h; }
    public int area() { return width * height; }
}

public class Square extends Rectangle {
    @Override
    public void setWidth(int w) { width = height = w; } // Quebra expectativa
}

// ✅ BOM: Hierarquia correta
public interface Shape {
    int area();
}

public class Rectangle implements Shape { /* ... */ }
public class Square implements Shape { /* ... */ }
```

### I - Interface Segregation Principle
Clientes não devem depender de interfaces que não usam.

```java
// ❌ RUIM: Interface grande demais
public interface UserService {
    User create(CreateUserRequest req);
    User update(UpdateUserRequest req);
    void delete(UUID id);
    User findById(UUID id);
    List<User> findAll();
    void sendWelcomeEmail(User user);
    void updateStatistics(User user);
}

// ✅ BOM: Interfaces segregadas
public interface UserCrudService {
    User create(CreateUserRequest req);
    User update(UpdateUserRequest req);
    void delete(UUID id);
}

public interface UserQueryService {
    User findById(UUID id);
    List<User> findAll();
}

public interface UserNotificationService {
    void sendWelcomeEmail(User user);
}
```

### D - Dependency Inversion Principle
Dependa de abstrações, não de implementações.

```java
// ❌ RUIM: Depende de implementação concreta
public class SessionService {
    private final StripePaymentGateway stripe = new StripePaymentGateway();

    public void chargeSession(User user) {
        stripe.charge(user.getPaymentMethod(), 10);
    }
}

// ✅ BOM: Depende de abstração
public class SessionService {
    private final PaymentGateway paymentGateway;

    public SessionService(PaymentGateway paymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    public void chargeSession(User user) {
        paymentGateway.charge(user.getPaymentMethod(), 10);
    }
}
```

---

## Code Quality

### Nomenclatura

```java
// Classes: PascalCase, substantivos
UserService, SessionRepository, PaymentGateway

// Interfaces: PascalCase, adjetivos ou substantivos
Runnable, Serializable, UserRepository

// Métodos: camelCase, verbos
createUser(), findById(), calculateCredits()

// Variáveis: camelCase, descritivas
userEmail, sessionDuration, activeConversations

// Constantes: SCREAMING_SNAKE_CASE
MAX_RETRY_ATTEMPTS, DEFAULT_TIMEOUT_MS

// Pacotes: lowercase
com.speakup.domain.user
```

### Tamanho e Complexidade

| Métrica | Limite Recomendado |
|---------|-------------------|
| Linhas por método | ≤ 20 |
| Parâmetros por método | ≤ 3 |
| Linhas por classe | ≤ 200 |
| Complexidade ciclomática | ≤ 10 |
| Profundidade de aninhamento | ≤ 3 |

### Early Return

```java
// ❌ RUIM: Aninhamento profundo
public void processUser(User user) {
    if (user != null) {
        if (user.isActive()) {
            if (user.hasCredits()) {
                // lógica principal
            }
        }
    }
}

// ✅ BOM: Early return
public void processUser(User user) {
    if (user == null) return;
    if (!user.isActive()) return;
    if (!user.hasCredits()) return;

    // lógica principal
}
```

### Null Safety

```java
// ❌ RUIM: Retorna null
public User findUser(UUID id) {
    return repository.findById(id).orElse(null);
}

// ✅ BOM: Usa Optional
public Optional<User> findUser(UUID id) {
    return repository.findById(id);
}

// ✅ BOM: Lança exceção quando obrigatório
public User getUser(UUID id) {
    return repository.findById(id)
        .orElseThrow(() -> new UserNotFoundException(id));
}
```

### Imutabilidade

```java
// ❌ RUIM: Classe mutável
public class User {
    private String name;
    public void setName(String name) { this.name = name; }
}

// ✅ BOM: Record imutável
public record User(
    UUID id,
    String name,
    Email email,
    Instant createdAt
) {}

// ✅ BOM: Classe imutável com builder para "modificações"
@Value
@Builder(toBuilder = true)
public class User {
    UUID id;
    String name;
    Email email;
    Instant createdAt;

    public User withName(String newName) {
        return this.toBuilder().name(newName).build();
    }
}
```

---

## Git Workflow

### Branches

```
main (produção)
  │
  ├── develop (desenvolvimento)
  │     │
  │     ├── feature/SP-123-add-video-call
  │     ├── feature/SP-124-user-matching
  │     └── feature/SP-125-payment-integration
  │
  ├── bugfix/SP-126-fix-login-error
  │
  └── hotfix/SP-127-critical-security-fix
```

### Commits Convencionais

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de manutenção

**Exemplos:**
```
feat(matching): implementar algoritmo de pareamento por nível

fix(auth): corrigir token expirado não sendo renovado

docs(api): adicionar documentação do endpoint de sessões

refactor(user): extrair validação de email para value object

test(payment): adicionar testes de integração com Stripe
```

### Pull Request Template

```markdown
## Descrição
Breve descrição do que foi feito.

## Tipo de Mudança
- [ ] Nova funcionalidade
- [ ] Correção de bug
- [ ] Refatoração
- [ ] Documentação

## Checklist
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Sem breaking changes
- [ ] Code review solicitado

## Screenshots (se aplicável)

## Notas para Revisores
```

---

## API Design

### RESTful Endpoints

```
# Recursos no plural
GET    /api/v1/users           # Listar
POST   /api/v1/users           # Criar
GET    /api/v1/users/{id}      # Obter
PUT    /api/v1/users/{id}      # Atualizar completo
PATCH  /api/v1/users/{id}      # Atualizar parcial
DELETE /api/v1/users/{id}      # Remover

# Recursos aninhados
GET    /api/v1/users/{id}/sessions
POST   /api/v1/sessions/{id}/conversations

# Ações (quando não é CRUD)
POST   /api/v1/sessions/{id}/join
POST   /api/v1/sessions/{id}/leave
```

### Response Format

```json
// Sucesso (200, 201)
{
  "data": {
    "id": "uuid",
    "name": "John",
    "email": "john@email.com"
  }
}

// Lista com paginação (200)
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}

// Erro (4xx, 5xx)
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Usuário não encontrado",
    "details": {
      "userId": "uuid"
    }
  }
}

// Validação (400)
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": {
      "fields": {
        "email": "Email inválido",
        "name": "Nome é obrigatório"
      }
    }
  }
}
```

### HTTP Status Codes

| Código | Uso |
|--------|-----|
| 200 | OK - Sucesso geral |
| 201 | Created - Recurso criado |
| 204 | No Content - Sucesso sem corpo |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não existe |
| 409 | Conflict - Conflito (duplicado) |
| 422 | Unprocessable Entity - Regra de negócio |
| 500 | Internal Server Error |

---

## Segurança

### Autenticação e Autorização

```java
// Use JWT com refresh tokens
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwt -> jwt.decoder(jwtDecoder())))
            .build();
    }
}
```

### Validação de Input

```java
// Sempre valide entrada do usuário
public record CreateUserRequest(
    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    @Size(max = 255)
    String email,

    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 2, max = 100)
    @Pattern(regexp = "^[a-zA-Z\\s]+$")
    String name
) {}
```

### Proteção contra Ataques Comuns

```java
// SQL Injection - Use prepared statements
// ❌ RUIM
String query = "SELECT * FROM users WHERE email = '" + email + "'";

// ✅ BOM
@Query("SELECT u FROM User u WHERE u.email = :email")
Optional<User> findByEmail(@Param("email") String email);

// XSS - Sanitize output
// Use bibliotecas como OWASP Java Encoder
String safe = Encode.forHtml(userInput);

// CSRF - Token em formulários (se usar sessions)
// Rate Limiting
@RateLimiter(name = "default", fallbackMethod = "rateLimitFallback")
public Response createUser(CreateUserRequest request) { }
```

---

## Performance

### Caching

```java
// Cache de leitura frequente
@Cacheable(value = "users", key = "#id")
public User findById(UUID id) {
    return repository.findById(id).orElseThrow();
}

// Invalidação
@CacheEvict(value = "users", key = "#user.id")
public User update(User user) {
    return repository.save(user);
}

// Cache distribuído com Redis
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory)
            .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10)))
            .build();
    }
}
```

### Database

```java
// Use índices apropriados
@Entity
@Table(indexes = {
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_level", columnList = "level")
})
public class User { }

// Evite N+1 queries
// ❌ RUIM
List<User> users = userRepository.findAll(); // 1 query
users.forEach(u -> u.getSessions().size()); // N queries

// ✅ BOM
@Query("SELECT u FROM User u LEFT JOIN FETCH u.sessions")
List<User> findAllWithSessions(); // 1 query

// Paginação
Page<User> findByLevel(Level level, Pageable pageable);
```

### Async Processing

```java
// Operações demoradas em background
@Async
public CompletableFuture<TranscriptionResult> transcribe(UUID conversationId) {
    // Processa transcrição
    return CompletableFuture.completedFuture(result);
}

// Filas para processamento
@RabbitListener(queues = "transcription-queue")
public void processTranscription(TranscriptionMessage message) {
    // Processa mensagem da fila
}
```

---

## Documentação

### Código Auto-Documentado

```java
// ❌ RUIM: Comentário desnecessário
// Incrementa contador
counter++;

// ✅ BOM: Comentário útil
// Stripe retorna valores em centavos, convertemos para reais
BigDecimal amount = stripeAmount.divide(BigDecimal.valueOf(100));

// ❌ RUIM: Nome obscuro
int d; // elapsed time in days

// ✅ BOM: Nome descritivo
int elapsedTimeInDays;
```

### JavaDoc para APIs Públicas

```java
/**
 * Cria uma nova sessão de conversação.
 *
 * @param request dados da sessão a ser criada
 * @return sessão criada com ID gerado
 * @throws InvalidSessionTimeException se horário for inválido
 * @throws SessionOverlapException se houver sobreposição
 */
public Session createSession(CreateSessionRequest request) { }
```

### README de Projeto

```markdown
# Nome do Projeto

Breve descrição.

## Requisitos

- Java 21+
- PostgreSQL 15+
- Redis 7+

## Setup

\```bash
git clone ...
cd projeto
./mvnw spring-boot:run
\```

## Variáveis de Ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| DATABASE_URL | URL do banco | localhost:5432 |

## Arquitetura

Breve explicação da arquitetura.

## Testes

\```bash
./mvnw test
\```
```

---

## Checklist de Code Review

### Funcionalidade
- [ ] Atende aos requisitos?
- [ ] Casos de borda tratados?
- [ ] Erros tratados adequadamente?

### Qualidade
- [ ] Código legível e bem organizado?
- [ ] Segue os padrões do projeto?
- [ ] Sem código duplicado?
- [ ] Sem código morto?

### Testes
- [ ] Testes unitários adequados?
- [ ] Testes cobrem casos de borda?
- [ ] Testes passando?

### Segurança
- [ ] Input validado?
- [ ] Sem dados sensíveis expostos?
- [ ] Autenticação/autorização correta?

### Performance
- [ ] Queries otimizadas?
- [ ] Sem loops desnecessários?
- [ ] Cache quando apropriado?

---

## Referências

- [Clean Code - Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Clean Architecture - Robert C. Martin](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)
- [Domain-Driven Design - Eric Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)
- [Test-Driven Development - Kent Beck](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Refactoring - Martin Fowler](https://refactoring.com/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

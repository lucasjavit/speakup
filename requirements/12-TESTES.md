# Estratégia de Testes - SpeakUp

## Visão Geral

A estratégia de testes segue a pirâmide de testes:
```
         /\
        /  \        E2E (5%)
       /────\       Poucas, críticas, lentas
      /      \
     /────────\     Integração (20%)
    /          \    Médias, fluxos completos
   /────────────\
  /              \  Unitários (75%)
 /────────────────\ Muitos, rápidos, isolados
```

---

## Testes Unitários

### Backend (Java/Spring)

#### Ferramentas
- **JUnit 5** - Framework de testes
- **Mockito** - Mocking
- **AssertJ** - Asserções fluentes

#### Estrutura
```
src/test/java/com/speakup/
├── auth/
│   └── service/
│       └── AuthServiceTest.java
├── matching/
│   └── service/
│       ├── MatchmakingServiceTest.java
│       └── QueueServiceTest.java
├── session/
│   └── service/
│       └── SessionServiceTest.java
├── analysis/
│   └── service/
│       ├── TranscriptionServiceTest.java
│       └── AIAnalysisServiceTest.java
├── gamification/
│   └── service/
│       ├── XPServiceTest.java
│       ├── BadgeServiceTest.java
│       └── StreakServiceTest.java
└── social/
    └── service/
        ├── FavoriteServiceTest.java
        └── RatingServiceTest.java
```

#### Exemplos

**MatchmakingServiceTest.java**
```java
@ExtendWith(MockitoExtension.class)
class MatchmakingServiceTest {

    @Mock
    private QueueRepository queueRepository;

    @Mock
    private FavoriteService favoriteService;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @InjectMocks
    private MatchmakingService matchmakingService;

    @Test
    @DisplayName("Deve parear usuários com mesmo idioma e nível")
    void shouldMatchUsersWithSameLanguageAndLevel() {
        // Given
        User userA = createUser("userA", Language.ENGLISH, Level.INTERMEDIATE);
        User userB = createUser("userB", Language.ENGLISH, Level.INTERMEDIATE);

        when(queueRepository.findByLanguage(Language.ENGLISH))
            .thenReturn(List.of(userA, userB));

        // When
        Optional<Match> match = matchmakingService.findMatch(userA);

        // Then
        assertThat(match).isPresent();
        assertThat(match.get().getPartner()).isEqualTo(userB);
        assertThat(match.get().getType()).isEqualTo(MatchType.SAME_LEVEL);
    }

    @Test
    @DisplayName("Deve priorizar favoritos mútuos")
    void shouldPrioritizeMutualFavorites() {
        // Given
        User userA = createUser("userA", Language.ENGLISH, Level.BEGINNER);
        User userB = createUser("userB", Language.ENGLISH, Level.ADVANCED);
        User userC = createUser("userC", Language.ENGLISH, Level.BEGINNER);

        when(favoriteService.isMutualFavorite(userA.getId(), userB.getId()))
            .thenReturn(true);
        when(queueRepository.findByLanguage(Language.ENGLISH))
            .thenReturn(List.of(userB, userC));

        // When
        Optional<Match> match = matchmakingService.findMatch(userA);

        // Then
        assertThat(match).isPresent();
        assertThat(match.get().getPartner()).isEqualTo(userB);
        assertThat(match.get().getType()).isEqualTo(MatchType.MUTUAL_FAVORITE);
    }

    @Test
    @DisplayName("Não deve parear usuários com idiomas diferentes")
    void shouldNotMatchUsersWithDifferentLanguages() {
        // Given
        User userA = createUser("userA", Language.ENGLISH, Level.INTERMEDIATE);
        User userB = createUser("userB", Language.SPANISH, Level.INTERMEDIATE);

        when(queueRepository.findByLanguage(Language.ENGLISH))
            .thenReturn(List.of(userA));

        // When
        Optional<Match> match = matchmakingService.findMatch(userA);

        // Then
        assertThat(match).isEmpty();
    }
}
```

**XPServiceTest.java**
```java
@ExtendWith(MockitoExtension.class)
class XPServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private XPHistoryRepository xpHistoryRepository;

    @InjectMocks
    private XPService xpService;

    @Test
    @DisplayName("Deve conceder XP por conversa completada")
    void shouldAwardXPForCompletedConversation() {
        // Given
        User user = createUserWithXP(100);
        Conversation conversation = createConversation(Duration.ofMinutes(8));

        // When
        xpService.awardConversationXP(user, conversation);

        // Then
        assertThat(user.getTotalXP()).isEqualTo(110); // +10 XP
    }

    @Test
    @DisplayName("Não deve exceder limite diário de XP")
    void shouldNotExceedDailyXPLimit() {
        // Given
        User user = createUserWithXP(0);
        when(xpHistoryRepository.sumTodayXP(user.getId()))
            .thenReturn(295);

        Conversation conversation = createConversation(Duration.ofMinutes(10));

        // When
        xpService.awardConversationXP(user, conversation);

        // Then
        assertThat(user.getTotalXP()).isEqualTo(5); // Apenas 5 XP (limite 300)
    }

    @Test
    @DisplayName("Deve calcular level up corretamente")
    void shouldCalculateLevelUpCorrectly() {
        // Given
        User user = createUserWithXP(440); // Quase no level 4

        // When
        xpService.addXP(user, 15, XPSource.CONVERSATION);

        // Then
        assertThat(user.getTotalXP()).isEqualTo(455);
        assertThat(user.getLevel()).isEqualTo(4); // Level up!
        assertThat(user.getLevelName()).isEqualTo("Prata I");
    }
}
```

**StreakServiceTest.java**
```java
@ExtendWith(MockitoExtension.class)
class StreakServiceTest {

    @InjectMocks
    private StreakService streakService;

    @Test
    @DisplayName("Deve incrementar streak em dia consecutivo")
    void shouldIncrementStreakOnConsecutiveDay() {
        // Given
        User user = new User();
        user.setCurrentStreak(5);
        user.setLastActiveDate(LocalDate.now().minusDays(1));
        user.setTimezone(ZoneId.of("America/Sao_Paulo"));

        // When
        streakService.updateStreak(user);

        // Then
        assertThat(user.getCurrentStreak()).isEqualTo(6);
    }

    @Test
    @DisplayName("Deve resetar streak se pular um dia")
    void shouldResetStreakIfDaySkipped() {
        // Given
        User user = new User();
        user.setCurrentStreak(10);
        user.setLastActiveDate(LocalDate.now().minusDays(2));
        user.setTimezone(ZoneId.of("America/Sao_Paulo"));

        // When
        streakService.updateStreak(user);

        // Then
        assertThat(user.getCurrentStreak()).isEqualTo(1);
    }

    @Test
    @DisplayName("Deve usar streak freeze quando disponível")
    void shouldUseStreakFreezeWhenAvailable() {
        // Given
        User user = new User();
        user.setCurrentStreak(30);
        user.setLastActiveDate(LocalDate.now().minusDays(2));
        user.setStreakFreezesRemaining(1);

        // When
        streakService.updateStreak(user);

        // Then
        assertThat(user.getCurrentStreak()).isEqualTo(30); // Mantido
        assertThat(user.getStreakFreezesRemaining()).isEqualTo(0);
    }
}
```

### Frontend (React/TypeScript)

#### Ferramentas
- **Vitest** - Framework de testes
- **React Testing Library** - Testes de componentes
- **MSW (Mock Service Worker)** - Mock de APIs

#### Exemplos

**useMatching.test.ts**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useMatching } from './useMatching';
import { server } from '../mocks/server';
import { rest } from 'msw';

describe('useMatching', () => {
  it('should enter queue successfully', async () => {
    const { result } = renderHook(() => useMatching());

    await act(async () => {
      await result.current.enterQueue('english');
    });

    expect(result.current.status).toBe('IN_QUEUE');
    expect(result.current.language).toBe('english');
  });

  it('should handle match found event', async () => {
    const { result } = renderHook(() => useMatching());

    await act(async () => {
      await result.current.enterQueue('english');
      // Simulate WebSocket event
      result.current.handleMatchFound({
        partnerId: 'user-123',
        partnerName: 'John',
        roomName: 'room-abc',
      });
    });

    expect(result.current.status).toBe('MATCHED');
    expect(result.current.partner?.name).toBe('John');
  });
});
```

**SessionTimer.test.tsx**
```typescript
import { render, screen, act } from '@testing-library/react';
import { SessionTimer } from './SessionTimer';

describe('SessionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display initial time', () => {
    render(<SessionTimer duration={600} onComplete={vi.fn()} />);

    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('should countdown every second', () => {
    render(<SessionTimer duration={600} onComplete={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('09:59')).toBeInTheDocument();
  });

  it('should show warning at 1 minute', () => {
    const onWarning = vi.fn();
    render(<SessionTimer duration={600} onWarning={onWarning} onComplete={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(540000); // 9 minutes
    });

    expect(onWarning).toHaveBeenCalled();
    expect(screen.getByText('01:00')).toHaveClass('warning');
  });

  it('should call onComplete when timer ends', () => {
    const onComplete = vi.fn();
    render(<SessionTimer duration={600} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(600000);
    });

    expect(onComplete).toHaveBeenCalled();
  });
});
```

---

## Testes de Integração

### Backend

#### Ferramentas
- **Testcontainers** - Containers Docker para testes
- **Spring Boot Test** - Context de teste

#### Exemplo com Testcontainers
```java
@SpringBootTest
@Testcontainers
class MatchingIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @Autowired
    private MatchmakingService matchmakingService;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Fluxo completo de matching")
    void completeMatchingFlow() {
        // Given
        User userA = userRepository.save(createUser("A", Language.ENGLISH, Level.INTERMEDIATE));
        User userB = userRepository.save(createUser("B", Language.ENGLISH, Level.INTERMEDIATE));

        // When
        matchmakingService.enterQueue(userA);
        matchmakingService.enterQueue(userB);

        // Then
        await().atMost(5, SECONDS).untilAsserted(() -> {
            Optional<Match> matchA = matchmakingService.getActiveMatch(userA);
            Optional<Match> matchB = matchmakingService.getActiveMatch(userB);

            assertThat(matchA).isPresent();
            assertThat(matchB).isPresent();
            assertThat(matchA.get().getPartner()).isEqualTo(userB);
        });
    }
}
```

### API Tests
```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class SessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Test
    @DisplayName("GET /api/sessions retorna histórico do usuário")
    void shouldReturnUserSessions() throws Exception {
        String token = jwtService.generateToken(testUser);

        mockMvc.perform(get("/api/sessions")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].id").exists());
    }

    @Test
    @DisplayName("POST /api/matching/queue requer autenticação")
    void shouldRequireAuthForQueue() throws Exception {
        mockMvc.perform(post("/api/matching/queue"))
            .andExpect(status().isUnauthorized());
    }
}
```

---

## Testes E2E

### Ferramentas
- **Playwright** - Automação de browser

#### Configuração
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
});
```

#### Exemplo
```typescript
// e2e/matching.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Matching Flow', () => {
  test('should match two users and start video call', async ({ browser }) => {
    // Create two browser contexts (simulate two users)
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // User A logs in and enters queue
    await pageA.goto('/login');
    await pageA.click('[data-testid="google-login"]');
    // ... OAuth mock
    await pageA.goto('/lobby');
    await pageA.click('[data-testid="start-session"]');

    await expect(pageA.locator('[data-testid="queue-status"]'))
      .toHaveText(/Procurando/);

    // User B logs in and enters queue
    await pageB.goto('/login');
    // ... OAuth mock
    await pageB.goto('/lobby');
    await pageB.click('[data-testid="start-session"]');

    // Both should be matched
    await expect(pageA.locator('[data-testid="match-found"]'))
      .toBeVisible({ timeout: 30000 });
    await expect(pageB.locator('[data-testid="match-found"]'))
      .toBeVisible({ timeout: 30000 });

    // Video room should load
    await expect(pageA.locator('[data-testid="video-room"]'))
      .toBeVisible();
    await expect(pageB.locator('[data-testid="video-room"]'))
      .toBeVisible();

    // Timer should be visible
    await expect(pageA.locator('[data-testid="session-timer"]'))
      .toHaveText('10:00');

    await contextA.close();
    await contextB.close();
  });
});
```

---

## Testes de Carga

### Ferramenta
- **k6** - Testes de performance

#### Script de Teste
```javascript
// load-test.js
import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up
    { duration: '3m', target: 100 },  // Sustain
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% requests < 500ms
    ws_connecting: ['p(95)<1000'],     // WebSocket connect < 1s
  },
};

export default function () {
  // Login
  const loginRes = http.post('http://localhost:8080/api/auth/login', {
    token: 'test-token',
  });
  check(loginRes, { 'logged in': (r) => r.status === 200 });

  const authToken = loginRes.json('token');

  // Enter queue via WebSocket
  const wsUrl = `ws://localhost:8080/ws?token=${authToken}`;
  const res = ws.connect(wsUrl, function (socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        type: 'ENTER_QUEUE',
        language: 'english',
      }));
    });

    socket.on('message', (msg) => {
      const data = JSON.parse(msg);
      if (data.type === 'MATCH_FOUND') {
        // Match successful
        socket.close();
      }
    });

    socket.setTimeout(() => {
      socket.close();
    }, 30000);
  });

  check(res, { 'WebSocket connected': (r) => r.status === 101 });

  sleep(1);
}
```

#### Execução
```bash
k6 run load-test.js
```

---

## Cobertura de Código

### Metas
- **Backend**: > 70% de cobertura
- **Frontend**: > 60% de cobertura

### Configuração (Maven)
```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

### Visualização
```bash
# Gerar relatório
mvn test jacoco:report

# Abrir relatório
open target/site/jacoco/index.html
```

---

## CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Run tests
        run: |
          cd backend
          ./mvnw test

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install and test
        run: |
          cd frontend
          npm ci
          npm test -- --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    steps:
      - uses: actions/checkout@v4
      - name: Start services
        run: docker-compose up -d
      - name: Run Playwright
        run: npx playwright test
```

---

## Checklist de Testes por Feature

### Matching
- [ ] Pareamento por idioma
- [ ] Pareamento por nível
- [ ] Priorização de favoritos
- [ ] Expansão de busca
- [ ] Timeout de fila
- [ ] Reconexão

### Vídeo
- [ ] Criação de sala
- [ ] Conexão de participantes
- [ ] Timer funcionando
- [ ] Encerramento automático
- [ ] Reconexão

### Gamificação
- [ ] Concessão de XP
- [ ] Level up
- [ ] Badges
- [ ] Streaks
- [ ] Limites diários

---

## Próximos Passos

- [ ] Configurar JUnit 5 e Mockito
- [ ] Configurar Testcontainers
- [ ] Configurar Vitest
- [ ] Configurar Playwright
- [ ] Criar testes para features críticas
- [ ] Configurar CI/CD
- [ ] Definir metas de cobertura

# Painel Administrativo - SpeakUp

## Visão Geral

O painel administrativo permite gerenciar todos os aspectos da plataforma:
- Gerenciamento de sessões (criar, habilitar, desabilitar)
- Gerenciamento de usuários
- Relatórios financeiros
- Configurações do sistema
- Monitoramento em tempo real

---

## Níveis de Acesso

### Matriz de Permissões

| Permissão | Super Admin | Admin Pagamento | Moderador |
|-----------|:-----------:|:---------------:|:---------:|
| **Admins** |
| Criar outros admins | ✅ | ❌ | ❌ |
| Editar admins | ✅ | ❌ | ❌ |
| Remover admins | ✅ | ❌ | ❌ |
| **Usuários** |
| Ver todos usuários | ✅ | ✅ | ✅ |
| Editar usuário | ✅ | ❌ | ✅ |
| Remover usuário | ✅ | ❌ | ✅ |
| Banir usuário | ✅ | ❌ | ✅ |
| Dar créditos de bônus | ✅ | ✅ | ❌ |
| **Sessões** |
| Criar períodos de sessão | ✅ | ❌ | ✅ |
| Editar períodos | ✅ | ❌ | ✅ |
| Habilitar/desabilitar sessão | ✅ | ❌ | ✅ |
| Limpar fila de espera | ✅ | ❌ | ✅ |
| Ver sessões ativas | ✅ | ✅ | ✅ |
| Encerrar sessão forçadamente | ✅ | ❌ | ✅ |
| **Financeiro** |
| Gerenciar pagamentos | ✅ | ✅ | ❌ |
| Ver relatórios financeiros | ✅ | ✅ | ❌ |
| Configurar preços | ✅ | ✅ | ❌ |
| Processar reembolsos | ✅ | ✅ | ❌ |
| **Sistema** |
| Configurar categorias de tópicos | ✅ | ❌ | ✅ |
| Ver métricas do sistema | ✅ | ✅ | ✅ |
| Ver logs de auditoria | ✅ | ✅ | ❌ |
| Configurações gerais | ✅ | ❌ | ❌ |

---

## Modelo de Dados

### Admin
```java
@Entity
public class Admin {
    @Id
    private UUID id;

    @OneToOne
    private User user;  // Vinculado a um usuário existente

    @Enumerated
    private AdminRole role;  // SUPER_ADMIN, PAYMENT_ADMIN, MODERATOR

    private boolean active;

    private LocalDateTime createdAt;
    private String createdBy;  // ID do admin que criou

    private LocalDateTime lastLoginAt;
}
```

### Período de Sessão
```java
@Entity
public class SessionPeriod {
    @Id
    private UUID id;

    private String name;           // Ex: "Manhã", "Noite"
    private LocalTime startTime;   // Ex: 07:00
    private LocalTime endTime;     // Ex: 08:00
    private String timezone;       // Ex: "America/Sao_Paulo"

    @ElementCollection
    private Set<DayOfWeek> daysOfWeek;  // Ex: [MONDAY, WEDNESDAY, FRIDAY]

    private boolean active;        // Pode ser desabilitado temporariamente

    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
```

### Sessão Ativa
```java
@Entity
public class ActiveSession {
    @Id
    private UUID id;

    @ManyToOne
    private SessionPeriod period;

    private LocalDate date;        // Data específica
    private LocalDateTime startAt;
    private LocalDateTime endAt;

    @Enumerated
    private SessionStatus status;  // SCHEDULED, ACTIVE, ENDED, CANCELLED

    private int usersCount;        // Usuários que entraram
    private int matchesCount;      // Matches realizados
    private int conversationsCount; // Conversas completadas

    private String cancelledBy;    // Se cancelada, por quem
    private String cancellationReason;
}
```

### Log de Auditoria
```java
@Entity
public class AuditLog {
    @Id
    private UUID id;

    private String adminId;
    private String adminEmail;
    private AdminRole adminRole;

    @Enumerated
    private AuditAction action;
    // USER_CREATED, USER_BANNED, SESSION_ENABLED, PRICE_CHANGED, etc.

    private String targetType;     // "User", "SessionPeriod", "Product"
    private String targetId;

    private String details;        // JSON com detalhes da ação
    private String ipAddress;

    private LocalDateTime createdAt;
}
```

---

## Dashboard Principal

### Visão Geral
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Dashboard Administrativo                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📈 Métricas em Tempo Real                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Usuários    │ │ Na Fila     │ │ Em Conversa │           │
│  │ Online: 156 │ │ Agora: 23   │ │ Agora: 66   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Sessões     │ │ Conversas   │ │ Receita     │           │
│  │ Hoje: 5     │ │ Hoje: 892   │ │ Hoje: R$2.4k│           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📅 Sessões de Hoje                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 07:00-08:00 │ Finalizada │ 45 usuários │ 180 conversas│  │
│  │ 12:00-13:00 │ ATIVA      │ 78 usuários │ 156 conversas│  │
│  │ 19:00-20:00 │ Agendada   │ [Habilitar] │ [Cancelar]  │  │
│  │ 21:00-22:00 │ Agendada   │ [Habilitar] │ [Cancelar]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [+ Criar Sessão Avulsa]                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar de Navegação
```
┌───────────────────────┐
│ SpeakUp Admin         │
├───────────────────────┤
│ 📊 Dashboard          │
│ 📅 Sessões            │
│ 👥 Usuários           │
│ 💰 Financeiro         │
│ 🤖 Tópicos IA         │
│ ⚙️ Configurações      │
│ 📜 Logs               │
├───────────────────────┤
│ 🔓 Logout             │
└───────────────────────┘
```

---

## Gerenciamento de Sessões

### Lista de Períodos
```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Períodos de Sessão                      [+ Criar Novo]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🌅 Manhã                                              │  │
│  │ 07:00 - 08:00 (America/Sao_Paulo)                    │  │
│  │ Dias: Seg, Ter, Qua, Qui, Sex                        │  │
│  │ Status: ✅ Ativo                                      │  │
│  │ [Editar] [Desabilitar]                               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🌙 Noite                                              │  │
│  │ 19:00 - 20:00 (America/Sao_Paulo)                    │  │
│  │ Dias: Todos                                          │  │
│  │ Status: ✅ Ativo                                      │  │
│  │ [Editar] [Desabilitar]                               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🌙 Noite 2                                            │  │
│  │ 21:00 - 22:00 (America/Sao_Paulo)                    │  │
│  │ Dias: Sex, Sáb                                       │  │
│  │ Status: ⚠️ Desabilitado                              │  │
│  │ [Editar] [Habilitar] [Remover]                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Criar/Editar Período
```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Criar Período de Sessão                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Nome do período:                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Noite                                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Horário:                                                  │
│  ┌───────────┐  ┌───────────┐                             │
│  │ 19:00     │  │ 20:00     │                             │
│  └───────────┘  └───────────┘                             │
│    Início         Fim                                      │
│                                                             │
│  Fuso horário:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ America/Sao_Paulo                            ▼      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Dias da semana:                                           │
│  [✅ Seg] [✅ Ter] [✅ Qua] [✅ Qui] [✅ Sex] [✅ Sáb] [✅ Dom]│
│                                                             │
│  [Cancelar]                              [Salvar]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sessão Ativa - Detalhes
```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Sessão: Noite (19:00 - 20:00)            Status: ATIVA  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⏱️ Tempo restante: 32:15                                  │
│                                                             │
│  📊 Estatísticas                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Usuários    │ │ Na Fila     │ │ Em Conversa │           │
│  │ Total: 78   │ │ 12          │ │ 66          │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Matches     │ │ Conversas   │ │ Salas de 3  │           │
│  │ 156         │ │ 234         │ │ 4           │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  👥 Usuários na Fila (12)                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ João Silva       │ INTERMEDIATE │ Esperando: 45s      │  │
│  │ Maria Santos     │ BEGINNER     │ Esperando: 32s      │  │
│  │ Pedro Lima       │ ADVANCED     │ Esperando: 28s      │  │
│  │ ...                                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [Limpar Fila]                    [Encerrar Sessão]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Gerenciamento de Usuários

### Lista de Usuários
```
┌─────────────────────────────────────────────────────────────┐
│ 👥 Usuários                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Buscar: ┌─────────────────────────────────────────────┐   │
│          │ nome ou email...                            │   │
│          └─────────────────────────────────────────────┘   │
│                                                             │
│  Filtros: [Todos ▼] [Nível ▼] [Status ▼]                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 👤 │ Nome          │ Email              │ Conversas │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 🟢 │ João Silva    │ joao@email.com     │ 145       │  │
│  │ 🟢 │ Maria Santos  │ maria@email.com    │ 89        │  │
│  │ 🔴 │ Pedro Lima    │ pedro@email.com    │ 23        │  │
│  │ 🟡 │ Ana Costa     │ ana@email.com      │ 56        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  🟢 Ativo  🟡 Ausente  🔴 Banido                           │
│                                                             │
│  Página: [< 1 2 3 ... 50 >]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Detalhes do Usuário
```
┌─────────────────────────────────────────────────────────────┐
│ 👤 João Silva                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📧 joao.silva@email.com                                   │
│  📅 Membro desde: 15/01/2024                               │
│  🔑 Provider: Google                                       │
│                                                             │
│  📊 Estatísticas                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Conversas   │ │ Tempo Total │ │ Avaliação   │           │
│  │ 145         │ │ 24h 15min   │ │ 4.7 ⭐      │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  💳 Créditos                                               │
│  Sessões: 5  │  Conversas: 12                              │
│  [+ Adicionar Crédito de Bônus]                            │
│                                                             │
│  🎮 Gamificação                                            │
│  Nível: Ouro III  │  XP: 2,450  │  Streak: 15 dias        │
│                                                             │
│  📜 Reports Recebidos: 0                                   │
│                                                             │
│  Ações:                                                    │
│  [Editar Perfil] [Resetar Senha] [Banir Usuário]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Banir Usuário
```java
@Service
public class UserModerationService {

    public void banUser(UUID userId, UUID adminId, String reason) {
        User user = userRepository.findById(userId).orElseThrow();

        user.setStatus(UserStatus.BANNED);
        user.setBannedAt(LocalDateTime.now());
        user.setBannedBy(adminId.toString());
        user.setBanReason(reason);

        userRepository.save(user);

        // Remover de sessões ativas
        sessionService.removeUserFromActiveSessions(userId);

        // Log de auditoria
        auditService.log(AuditAction.USER_BANNED, adminId, "User", userId.toString(),
            Map.of("reason", reason));
    }
}
```

---

## Painel Financeiro

### Visão Geral (Admin Pagamento)
```
┌─────────────────────────────────────────────────────────────┐
│ 💰 Painel Financeiro                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Resumo do Mês                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Receita     │ │ Compras     │ │ Ticket Médio│           │
│  │ R$ 12.450   │ │ 342         │ │ R$ 36,40    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  📈 Receita Diária (últimos 30 dias)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │        ╭─╮                                            │  │
│  │      ╭─╯ ╰─╮     ╭──╮                                │  │
│  │    ╭─╯     ╰─╮ ╭─╯  ╰─╮  ╭─╮                        │  │
│  │ ───╯         ╰─╯      ╰──╯ ╰──────                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📦 Vendas por Produto                                     │
│                                                             │
│  Sessão Pack 10:   ████████████████  R$ 5.100 (41%)       │
│  Sessão Pack 5:    ██████████        R$ 2.700 (22%)       │
│  Conv Pack 50:     ████████          R$ 2.400 (19%)       │
│  Sessão Pack 20:   ██████            R$ 1.500 (12%)       │
│  Outros:           ████              R$ 750 (6%)          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🔧 Ações                                                  │
│                                                             │
│  [Ver Transações] [Configurar Preços] [Relatório Completo] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Lista de Transações
```
┌─────────────────────────────────────────────────────────────┐
│ 📜 Transações                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filtros: [Período ▼] [Produto ▼] [Status ▼]              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Data       │ Usuário      │ Produto    │ Valor  │ St │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 16/01 14:32│ João Silva   │ Pack 10    │ R$127,5│ ✅ │  │
│  │ 16/01 13:45│ Maria Santos │ Pack 5     │ R$67,50│ ✅ │  │
│  │ 16/01 12:20│ Pedro Lima   │ Conv 20    │ R$54,00│ ✅ │  │
│  │ 16/01 11:15│ Ana Costa    │ 1 Sessão   │ R$15,00│ ✅ │  │
│  │ 16/01 10:30│ Lucas Olivei │ Pack 10    │ R$127,5│ ❌ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ✅ Completado  ❌ Falhou  🔄 Pendente  ↩️ Reembolsado     │
│                                                             │
│  [Exportar CSV]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Configurar Preços
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ Configurar Preços                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📦 Pacotes de Sessão                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Produto      │ Créditos │ Preço    │ Ativo │ Popular │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 1 Sessão     │ 1        │ R$ 15,00 │ ✅    │ ☐       │  │
│  │ 5 Sessões    │ 5        │ R$ 67,50 │ ✅    │ ☐       │  │
│  │ 10 Sessões   │ 10       │ R$127,50 │ ✅    │ ☑️      │  │
│  │ 20 Sessões   │ 20       │ R$240,00 │ ✅    │ ☐       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  📦 Pacotes de Conversa                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Produto      │ Créditos │ Preço    │ Ativo │ Popular │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 1 Conversa   │ 1        │ R$ 3,00  │ ✅    │ ☐       │  │
│  │ 20 Conversas │ 20       │ R$ 54,00 │ ✅    │ ☐       │  │
│  │ 50 Conversas │ 50       │ R$120,00 │ ✅    │ ☑️      │  │
│  │ 100 Conversas│ 100      │ R$210,00 │ ✅    │ ☐       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [Cancelar]                              [Salvar]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints Admin

### Autenticação
```
POST   /api/admin/login           # Login admin (retorna JWT)
POST   /api/admin/logout          # Logout
GET    /api/admin/me              # Perfil do admin logado
```

### Admins (Super Admin)
```
GET    /api/admin/admins          # Listar admins
POST   /api/admin/admins          # Criar admin
PUT    /api/admin/admins/{id}     # Editar admin
DELETE /api/admin/admins/{id}     # Remover admin
```

### Sessões
```
GET    /api/admin/sessions/periods        # Listar períodos
POST   /api/admin/sessions/periods        # Criar período
PUT    /api/admin/sessions/periods/{id}   # Editar período
DELETE /api/admin/sessions/periods/{id}   # Remover período

GET    /api/admin/sessions/active         # Sessões ativas agora
GET    /api/admin/sessions/today          # Sessões de hoje
PUT    /api/admin/sessions/{id}/enable    # Habilitar sessão
PUT    /api/admin/sessions/{id}/disable   # Desabilitar sessão
PUT    /api/admin/sessions/{id}/end       # Encerrar forçadamente
DELETE /api/admin/sessions/{id}/queue     # Limpar fila
```

### Usuários
```
GET    /api/admin/users                   # Listar usuários
GET    /api/admin/users/{id}              # Detalhes usuário
PUT    /api/admin/users/{id}              # Editar usuário
PUT    /api/admin/users/{id}/ban          # Banir usuário
PUT    /api/admin/users/{id}/unban        # Desbanir
POST   /api/admin/users/{id}/credits      # Adicionar créditos bônus
```

### Financeiro
```
GET    /api/admin/finance/summary         # Resumo financeiro
GET    /api/admin/finance/transactions    # Lista transações
GET    /api/admin/finance/products        # Lista produtos
PUT    /api/admin/finance/products/{id}   # Atualizar produto/preço
POST   /api/admin/finance/refund/{id}     # Processar reembolso
GET    /api/admin/finance/report          # Relatório completo
```

### Logs
```
GET    /api/admin/logs                    # Logs de auditoria
GET    /api/admin/logs/export             # Exportar logs
```

---

## Segurança

### Autenticação Admin
```java
@Configuration
public class AdminSecurityConfig {

    @Bean
    public SecurityFilterChain adminFilterChain(HttpSecurity http) {
        return http
            .securityMatcher("/api/admin/**")
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/admin/login").permitAll()
                .requestMatchers("/api/admin/admins/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/admin/finance/**").hasAnyRole("SUPER_ADMIN", "PAYMENT_ADMIN")
                .requestMatchers("/api/admin/**").hasAnyRole("SUPER_ADMIN", "PAYMENT_ADMIN", "MODERATOR")
            )
            .build();
    }
}
```

### Verificação de Permissão
```java
@Service
public class AdminAuthorizationService {

    public boolean canPerform(Admin admin, AdminAction action) {
        return switch (admin.getRole()) {
            case SUPER_ADMIN -> true;
            case PAYMENT_ADMIN -> PAYMENT_ACTIONS.contains(action);
            case MODERATOR -> MODERATOR_ACTIONS.contains(action);
        };
    }

    private static final Set<AdminAction> PAYMENT_ACTIONS = Set.of(
        AdminAction.VIEW_USERS,
        AdminAction.VIEW_SESSIONS,
        AdminAction.VIEW_FINANCE,
        AdminAction.MANAGE_PRODUCTS,
        AdminAction.PROCESS_REFUND,
        AdminAction.ADD_BONUS_CREDITS
    );

    private static final Set<AdminAction> MODERATOR_ACTIONS = Set.of(
        AdminAction.VIEW_USERS,
        AdminAction.EDIT_USER,
        AdminAction.BAN_USER,
        AdminAction.VIEW_SESSIONS,
        AdminAction.MANAGE_SESSIONS,
        AdminAction.CLEAR_QUEUE,
        AdminAction.MANAGE_TOPICS
    );
}
```

---

## Métricas e Monitoramento

### Métricas do Dashboard
```
# Tempo Real
- admin.users.online
- admin.users.in_queue
- admin.users.in_session
- admin.sessions.active_count

# Diário
- admin.sessions.total_today
- admin.conversations.total_today
- admin.revenue.today

# Mensal
- admin.revenue.monthly
- admin.purchases.monthly
- admin.new_users.monthly
```

### Alertas (Futuro)
- Fila muito grande (> X usuários esperando > Y minutos)
- Sessão com poucos usuários
- Erro em pagamentos
- Usuário reportado múltiplas vezes

---

## Próximos Passos

- [ ] Criar entidades Admin e permissões
- [ ] Implementar autenticação admin separada
- [ ] Criar CRUD de períodos de sessão
- [ ] Implementar dashboard com métricas
- [ ] Criar UI do painel admin
- [ ] Implementar logs de auditoria
- [ ] Adicionar relatórios financeiros

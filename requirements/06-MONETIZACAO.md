# Sistema de Créditos e Monetização - SpeakUp

> **ATUALIZADO**: Novo sistema de créditos flexível (sessão ou conversa) com serviços extras opcionais.

## Visão Geral

O SpeakUp utiliza um sistema de **créditos flexível** que permite aos usuários:
- Comprar créditos de **sessão** (1h completa = 6 conversas)
- Comprar créditos de **conversa** (10 min cada)
- Adquirir pacotes com desconto
- Contratar serviços extras (transcrição, análise IA)

---

## Tipos de Crédito

### Crédito de Sessão
```yaml
tipo: SESSAO
valor: 1 sessão = 1 hora completa (6 conversas de 10 min)
uso: Debitado ao entrar na sessão
vantagem: Mais econômico para quem pratica sessões inteiras
```

### Crédito de Conversa
```yaml
tipo: CONVERSA
valor: 1 conversa = 10 minutos
uso: Debitado ao completar cada conversa
vantagem: Flexibilidade para quem entra/sai durante a sessão
```

---

## Tabela de Preços

### Créditos Avulsos
| Tipo | Quantidade | Preço | Preço/Unidade |
|------|------------|-------|---------------|
| Sessão | 1 | R$ 15,00 | R$ 15,00 |
| Conversa | 1 | R$ 3,00 | R$ 3,00 |

### Pacotes de Sessão
| Pacote | Quantidade | Preço | Desconto | Preço/Sessão |
|--------|------------|-------|----------|--------------|
| Iniciante | 5 sessões | R$ 67,50 | 10% | R$ 13,50 |
| Regular | 10 sessões | R$ 127,50 | 15% | R$ 12,75 |
| Dedicado | 20 sessões | R$ 240,00 | 20% | R$ 12,00 |

### Pacotes de Conversa
| Pacote | Quantidade | Preço | Desconto | Preço/Conversa |
|--------|------------|-------|----------|----------------|
| Flex 20 | 20 conversas | R$ 54,00 | 10% | R$ 2,70 |
| Flex 50 | 50 conversas | R$ 120,00 | 20% | R$ 2,40 |
| Flex 100 | 100 conversas | R$ 210,00 | 30% | R$ 2,10 |

---

## Serviços Extras (Opcionais)

### Transcrição de Conversa
```yaml
custo: 1 crédito de conversa por conversa transcrita
descrição: Transcrição completa do áudio via Deepgram
entrega: Disponível em até 5 minutos após a conversa
formato: Texto com timestamps e identificação de falantes
```

### Análise de IA
```yaml
custo: 3 créditos de conversa por sessão analisada
descrição: Análise detalhada via Claude/OpenAI
inclui:
  - Avaliação de gramática
  - Análise de fluência
  - Vocabulário utilizado
  - Sugestões de melhoria
  - Pontuação geral
entrega: Disponível em até 10 minutos após a sessão
```

### Pacote Completo (Transcrição + Análise)
```yaml
custo: 8 créditos de conversa por sessão (6 transcrições + análise)
desconto: ~20% comparado a comprar separadamente
```

---

## Modelo de Dados

### Carteira de Créditos
```java
@Entity
public class CreditWallet {
    @Id
    private UUID id;

    @OneToOne
    private User user;

    private int sessionCredits;      // Créditos de sessão
    private int conversationCredits; // Créditos de conversa

    private LocalDateTime updatedAt;
}
```

### Transação de Crédito
```java
@Entity
public class CreditTransaction {
    @Id
    private UUID id;

    @ManyToOne
    private User user;

    @Enumerated
    private CreditType creditType;  // SESSION, CONVERSATION

    @Enumerated
    private TransactionType type;   // PURCHASE, CONSUME, REFUND, BONUS

    private int amount;             // Positivo = entrada, Negativo = saída
    private int balanceAfter;       // Saldo após transação

    private String description;     // Ex: "Pacote 10 sessões", "Sessão 19h-20h"
    private String referenceId;     // ID da compra ou sessão relacionada

    private LocalDateTime createdAt;
}
```

### Compra
```java
@Entity
public class Purchase {
    @Id
    private UUID id;

    @ManyToOne
    private User user;

    @Enumerated
    private ProductType productType;  // SESSION_SINGLE, SESSION_PACK_5, CONVERSATION_PACK_20, etc.

    private int creditsAmount;        // Quantidade de créditos
    private CreditType creditType;    // SESSION ou CONVERSATION

    private BigDecimal price;
    private String currency;          // BRL

    @Enumerated
    private PaymentStatus status;     // PENDING, COMPLETED, FAILED, REFUNDED

    private String stripePaymentIntentId;
    private String stripeSessionId;

    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
```

### Produtos Disponíveis
```java
public enum ProductType {
    // Sessões
    SESSION_SINGLE(1, CreditType.SESSION, new BigDecimal("15.00")),
    SESSION_PACK_5(5, CreditType.SESSION, new BigDecimal("67.50")),
    SESSION_PACK_10(10, CreditType.SESSION, new BigDecimal("127.50")),
    SESSION_PACK_20(20, CreditType.SESSION, new BigDecimal("240.00")),

    // Conversas
    CONVERSATION_SINGLE(1, CreditType.CONVERSATION, new BigDecimal("3.00")),
    CONVERSATION_PACK_20(20, CreditType.CONVERSATION, new BigDecimal("54.00")),
    CONVERSATION_PACK_50(50, CreditType.CONVERSATION, new BigDecimal("120.00")),
    CONVERSATION_PACK_100(100, CreditType.CONVERSATION, new BigDecimal("210.00"));

    private final int credits;
    private final CreditType creditType;
    private final BigDecimal price;
}
```

---

## Lógica de Consumo

### Entrada na Sessão
```java
@Service
public class CreditService {

    public void consumeSessionEntry(User user, Session session) {
        CreditWallet wallet = getWallet(user);

        // Prioridade: créditos de sessão primeiro
        if (wallet.getSessionCredits() > 0) {
            wallet.setSessionCredits(wallet.getSessionCredits() - 1);
            logTransaction(user, CreditType.SESSION, -1,
                "Entrada na sessão " + session.getName());
        }
        // Fallback: usar 6 créditos de conversa
        else if (wallet.getConversationCredits() >= 6) {
            wallet.setConversationCredits(wallet.getConversationCredits() - 6);
            logTransaction(user, CreditType.CONVERSATION, -6,
                "Entrada na sessão " + session.getName());
        }
        else {
            throw new InsufficientCreditsException(
                "Você precisa de 1 crédito de sessão ou 6 créditos de conversa"
            );
        }
    }

    public void consumeConversation(User user, Conversation conversation) {
        CreditWallet wallet = getWallet(user);

        if (wallet.getConversationCredits() > 0) {
            wallet.setConversationCredits(wallet.getConversationCredits() - 1);
            logTransaction(user, CreditType.CONVERSATION, -1,
                "Conversa com " + conversation.getPartnerName());
        } else {
            throw new InsufficientCreditsException(
                "Você precisa de créditos de conversa"
            );
        }
    }

    public boolean hasCreditsForSession(User user) {
        CreditWallet wallet = getWallet(user);
        return wallet.getSessionCredits() > 0 ||
               wallet.getConversationCredits() >= 6;
    }

    public boolean hasCreditsForConversation(User user) {
        CreditWallet wallet = getWallet(user);
        return wallet.getConversationCredits() > 0;
    }
}
```

### Modo de Cobrança do Usuário
```java
@Entity
public class UserPreferences {
    // ...

    @Enumerated
    private BillingMode billingMode;  // SESSION, CONVERSATION

    // SESSION: Cobra 1 sessão ao entrar
    // CONVERSATION: Cobra 1 conversa ao completar cada conversa
}
```

---

## Integração Stripe

### Configuração de Produtos
```java
@Configuration
public class StripeProductConfig {

    // IDs dos produtos no Stripe Dashboard
    @Value("${stripe.products.session-single}")
    private String sessionSingleId;

    @Value("${stripe.products.session-pack-5}")
    private String sessionPack5Id;

    @Value("${stripe.products.session-pack-10}")
    private String sessionPack10Id;

    // ... outros produtos
}
```

### Criar Checkout
```java
@Service
public class PaymentService {

    public String createCheckout(User user, ProductType product) {
        SessionCreateParams params = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.PAYMENT)  // Pagamento único
            .setCustomerEmail(user.getEmail())
            .setClientReferenceId(user.getId().toString())
            .setSuccessUrl(frontendUrl + "/credits/success?session_id={CHECKOUT_SESSION_ID}")
            .setCancelUrl(frontendUrl + "/credits")
            .addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setPrice(getPriceId(product))
                    .setQuantity(1L)
                    .build()
            )
            .putMetadata("productType", product.name())
            .putMetadata("userId", user.getId().toString())
            .build();

        Session session = Session.create(params);

        // Salvar compra pendente
        savePendingPurchase(user, product, session.getId());

        return session.getUrl();
    }
}
```

### Webhook de Pagamento
```java
@RestController
@RequestMapping("/api/stripe/webhook")
public class StripeWebhookController {

    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {

        Event event = Webhook.constructEvent(payload, signature, webhookSecret);

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer()
                .getObject().orElseThrow();

            String productType = session.getMetadata().get("productType");
            String odId = session.getMetadata().get("userId");

            // Creditar na carteira do usuário
            creditService.addCredits(
                UUID.fromString(odId),
                ProductType.valueOf(productType)
            );

            // Atualizar status da compra
            purchaseService.complete(session.getId());
        }

        return ResponseEntity.ok("OK");
    }
}
```

---

## API Endpoints

### Créditos
```
GET    /api/credits                    # Saldo atual
GET    /api/credits/history            # Histórico de transações
PUT    /api/credits/billing-mode       # Alterar modo de cobrança
```

### Compras
```
GET    /api/products                   # Lista de produtos disponíveis
POST   /api/purchases/checkout         # Iniciar checkout
GET    /api/purchases                  # Histórico de compras
GET    /api/purchases/{id}             # Detalhes de uma compra
```

### Exemplos de Response

```json
// GET /api/credits
{
  "sessionCredits": 5,
  "conversationCredits": 12,
  "billingMode": "SESSION",
  "canJoinSession": true
}

// GET /api/products
{
  "sessionProducts": [
    {
      "id": "SESSION_SINGLE",
      "name": "1 Sessão",
      "credits": 1,
      "price": 15.00,
      "pricePerCredit": 15.00
    },
    {
      "id": "SESSION_PACK_10",
      "name": "10 Sessões",
      "credits": 10,
      "price": 127.50,
      "pricePerCredit": 12.75,
      "discount": "15%",
      "popular": true
    }
  ],
  "conversationProducts": [
    // ...
  ]
}
```

---

## UI de Créditos

### Dashboard de Créditos
```
┌─────────────────────────────────────────────┐
│ 💳 Meus Créditos                            │
├─────────────────────────────────────────────┤
│                                             │
│  📦 Sessões: 5          💬 Conversas: 12   │
│                                             │
│  Modo de cobrança: [Sessão ▼]              │
│                                             │
│  [+ Comprar Créditos]                       │
│                                             │
├─────────────────────────────────────────────┤
│ 📜 Últimas Transações                       │
│                                             │
│ -1 sessão   Sessão 19h-20h      Há 2 dias  │
│ +10 sessões Pacote Regular      Há 5 dias  │
│ -1 sessão   Sessão 07h-08h      Há 6 dias  │
│                                             │
└─────────────────────────────────────────────┘
```

### Página de Compra
```
┌─────────────────────────────────────────────┐
│ 🛒 Comprar Créditos                         │
├─────────────────────────────────────────────┤
│                                             │
│  [Sessões] [Conversas]  ← Tabs              │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ 📦 1 Sessão                             ││
│  │ R$ 15,00                                ││
│  │ [Comprar]                               ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ 📦 10 Sessões        ⭐ POPULAR         ││
│  │ R$ 127,50 (economize 15%)               ││
│  │ R$ 12,75 por sessão                     ││
│  │ [Comprar]                               ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ 📦 20 Sessões        💎 MELHOR VALOR    ││
│  │ R$ 240,00 (economize 20%)               ││
│  │ R$ 12,00 por sessão                     ││
│  │ [Comprar]                               ││
│  └─────────────────────────────────────────┘│
│                                             │
└─────────────────────────────────────────────┘
```

---

## Painel Admin - Financeiro

### Visão do Admin de Pagamento
```
┌─────────────────────────────────────────────┐
│ 💰 Painel Financeiro                        │
├─────────────────────────────────────────────┤
│                                             │
│  📊 Resumo do Mês                           │
│                                             │
│  Receita Total: R$ 12.450,00               │
│  Compras: 342                               │
│  Ticket Médio: R$ 36,40                    │
│                                             │
├─────────────────────────────────────────────┤
│  📈 Por Produto                             │
│                                             │
│  Sessão Pack 10: R$ 5.100,00 (41%)         │
│  Sessão Pack 5:  R$ 2.700,00 (22%)         │
│  Conv Pack 50:   R$ 2.400,00 (19%)         │
│  Outros:         R$ 2.250,00 (18%)         │
│                                             │
├─────────────────────────────────────────────┤
│  🔧 Configurar Preços                       │
│                                             │
│  [Editar Produtos] [Ver Relatório Completo] │
│                                             │
└─────────────────────────────────────────────┘
```

### Configuração de Preços (Super Admin)
```java
@Entity
public class ProductConfig {
    @Id
    private String productType;  // Ex: "SESSION_PACK_10"

    private BigDecimal price;
    private boolean active;
    private int sortOrder;
    private boolean popular;     // Destacar como popular

    private LocalDateTime updatedAt;
    private String updatedBy;    // Admin que alterou
}
```

---

## Políticas e Regras

### Reembolso
```yaml
política:
  - Créditos não utilizados podem ser reembolsados em até 7 dias
  - Créditos parcialmente utilizados: reembolso proporcional
  - Após 7 dias: apenas crédito na plataforma (sem devolução)
```

### Expiração
```yaml
política:
  - Créditos não expiram
  - Em caso de inatividade > 12 meses: notificação por email
  - Em caso de inatividade > 24 meses: créditos podem expirar
```

### Bônus e Promoções
```java
@Service
public class PromotionService {

    public void applyFirstPurchaseBonus(User user) {
        if (isFirstPurchase(user)) {
            creditService.addBonus(user, CreditType.CONVERSATION, 5,
                "Bônus de primeira compra");
        }
    }

    public void applyReferralBonus(User referrer, User referred) {
        // Quem indicou ganha 2 conversas
        creditService.addBonus(referrer, CreditType.CONVERSATION, 2,
            "Bônus por indicação");
        // Quem foi indicado ganha 2 conversas
        creditService.addBonus(referred, CreditType.CONVERSATION, 2,
            "Bônus de boas-vindas");
    }
}
```

---

## Métricas de Monetização

```
# Receita
- revenue.total_daily
- revenue.total_monthly
- revenue.by_product

# Conversão
- purchase.conversion_rate (visitantes -> compradores)
- purchase.average_ticket
- purchase.frequency (compras/usuário/mês)

# Créditos
- credits.total_sold
- credits.total_consumed
- credits.average_balance

# Serviços Extras
- extras.transcription_usage
- extras.ai_analysis_usage
- extras.revenue_from_extras
```

---

## Configurações

```yaml
credits:
  # Preços base (podem ser sobrescritos via admin)
  session-price: 15.00
  conversation-price: 3.00

  # Descontos por pacote
  pack-5-discount: 0.10
  pack-10-discount: 0.15
  pack-20-discount: 0.20

  # Serviços extras
  transcription-cost: 1        # créditos de conversa
  ai-analysis-cost: 3          # créditos de conversa
  full-package-cost: 8         # 6 transcrições + análise

  # Políticas
  refund-window-days: 7
  inactivity-warning-months: 12
  inactivity-expiry-months: 24

stripe:
  api-key: ${STRIPE_API_KEY}
  webhook-secret: ${STRIPE_WEBHOOK_SECRET}
  currency: brl
```

---

## Próximos Passos

- [ ] Criar entidades de créditos e carteira
- [ ] Implementar CreditService
- [ ] Configurar produtos no Stripe
- [ ] Implementar webhooks de pagamento
- [ ] Criar UI de créditos e compra
- [ ] Implementar painel financeiro admin
- [ ] Adicionar métricas e relatórios

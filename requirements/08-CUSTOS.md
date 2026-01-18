# Análise de Custos - SpeakUp

## Custos Fixos (Infraestrutura)

### Fase 1: MVP (até 500 usuários ativos)

| Item | Especificação | Custo Mensal |
|------|---------------|--------------|
| VPS Principal | 2 vCPU, 4GB RAM, 80GB SSD | $7 |
| Domínio | .com (anual ÷ 12) | $1 |
| **Total Fixo** | | **$8/mês** |

### Fase 2: Crescimento (500-2000 usuários)

| Item | Especificação | Custo Mensal |
|------|---------------|--------------|
| VPS Principal | 4 vCPU, 8GB RAM | $15 |
| VPS LiveKit | 2 vCPU, 4GB RAM | $7 |
| Domínio | .com | $1 |
| **Total Fixo** | | **$23/mês** |

### Fase 3: Escala (2000-10k usuários)

| Item | Especificação | Custo Mensal |
|------|---------------|--------------|
| Kubernetes Cluster | 3 nodes, 4GB cada | $50 |
| Managed PostgreSQL | Básico | $15 |
| Managed Redis | Básico | $10 |
| CDN | Cloudflare Pro | $20 |
| **Total Fixo** | | **$95/mês** |

---

## Custos Variáveis (Por Uso)

### Deepgram (Transcrição)
```
Modelo: Nova-2
Preço: $0.0043/minuto

Cálculo por sessão:
- 1 sessão = 6 conversas × 10 min = 60 min
- Custo = 60 × $0.0043 = $0.258/sessão
```

### Claude API (Análise)
```
Modelo: Claude 3.5 Sonnet
Preço Input: $3/1M tokens
Preço Output: $15/1M tokens

Cálculo por análise:
- Input médio: 2,000 tokens (transcrição + prompt)
- Output médio: 1,500 tokens (relatório)
- Custo input: 2,000 × $0.000003 = $0.006
- Custo output: 1,500 × $0.000015 = $0.0225
- Total por análise: ~$0.03

Por sessão (6 análises):
- Custo = 6 × $0.03 = $0.18/sessão
```

### Resumo de Custos Variáveis por Sessão
```
Transcrição (Deepgram): $0.26
Análise IA (Claude):    $0.18
──────────────────────────────
Total por sessão:       $0.44
```

---

## Cenários de Uso

### Cenário A: Early Stage (100 usuários ativos)
```
Premissas:
- 100 usuários ativos/dia
- Média de 1 sessão/usuário/dia
- 30 dias/mês

Custos:
- Infraestrutura:     $8
- Transcrição:        100 × 30 × $0.26 = $780
- Análise IA:         100 × 30 × $0.18 = $540
────────────────────────────────────────────────
Total Mensal:         $1,328
Custo por usuário:    $13.28/mês
```

### Cenário B: Growth (500 usuários ativos)
```
Premissas:
- 500 usuários ativos/dia
- Média de 0.5 sessões/usuário/dia
- 30 dias/mês

Custos:
- Infraestrutura:     $23
- Transcrição:        250 × 30 × $0.26 = $1,950
- Análise IA:         250 × 30 × $0.18 = $1,350
────────────────────────────────────────────────
Total Mensal:         $3,323
Custo por usuário:    $6.65/mês
```

### Cenário C: Scale (2000 usuários ativos)
```
Premissas:
- 2000 usuários ativos/dia
- Média de 0.3 sessões/usuário/dia
- 30 dias/mês

Custos:
- Infraestrutura:     $95
- Transcrição:        600 × 30 × $0.26 = $4,680
- Análise IA:         600 × 30 × $0.18 = $3,240
────────────────────────────────────────────────
Total Mensal:         $8,015
Custo por usuário:    $4.01/mês
```

---

## Otimizações de Custo

### 1. Transcrição: Whisper Local
Rodar Whisper self-hosted ao invés de Deepgram

```
Economia: ~$0.26/sessão (100% do custo de transcrição)

Requisitos:
- VPS com mais RAM (8GB mínimo)
- GPU opcional (mas não necessário)

Trade-off:
+ Custo zero por transcrição
- Maior uso de CPU/RAM
- Latência um pouco maior
- Menos preciso que Deepgram
```

### 2. Análise em Batch
Processar todas as conversas da sessão em uma única chamada de IA

```
Antes: 6 chamadas × $0.03 = $0.18
Depois: 1 chamada × $0.05 = $0.05

Economia: ~72% no custo de IA
```

### 3. Análise Opcional
Usuário escolhe se quer análise (reduz volume)

```
Se 50% optam por análise:
- Economia de 50% nos custos variáveis
```

### 4. Cache de Explicações
Cachear explicações de erros gramaticais comuns

```
- "have went" → "have gone" (explicação pré-definida)
- Evita tokens de IA para padrões conhecidos
- Economia estimada: 20-30% no custo de IA
```

### Cenário Otimizado (Whisper + Batch + Cache)
```
Cenário A revisado (100 usuários):
- Infraestrutura:     $15 (VPS maior para Whisper)
- Transcrição:        $0 (Whisper local)
- Análise IA:         100 × 30 × $0.04 = $120
────────────────────────────────────────────────
Total Mensal:         $135
Custo por usuário:    $1.35/mês (vs $13.28 original)

ECONOMIA: 90%
```

---

## Projeção de Receita vs Custo

### Com Plano Premium ($9.90/mês)

| Métrica | 5% conversão | 10% conversão | 20% conversão |
|---------|--------------|---------------|---------------|
| Usuários ativos | 1000 | 1000 | 1000 |
| Premium | 50 | 100 | 200 |
| Receita | $495 | $990 | $1,980 |
| Custo (otimizado) | $500 | $500 | $500 |
| **Resultado** | -$5 | +$490 | +$1,480 |

### Break-even Analysis
```
Custo fixo otimizado: ~$500/mês (1000 usuários)
Preço Premium: $9.90/mês

Break-even = 500 ÷ 9.90 ≈ 51 assinantes

Com 1000 usuários, precisa de 5.1% de conversão para break-even.
```

---

## Comparação: Self-hosted vs Managed

### Transcrição
| Opção | Custo/min | Qualidade | Manutenção |
|-------|-----------|-----------|------------|
| Whisper (local) | $0 | Boa | Alta |
| Deepgram | $0.0043 | Excelente | Zero |
| AssemblyAI | $0.006 | Excelente | Zero |
| Google Speech | $0.006 | Boa | Baixa |

**Recomendação**: Começar com Deepgram, migrar para Whisper quando escalar.

### IA para Análise
| Opção | Custo Input | Custo Output | Qualidade |
|-------|-------------|--------------|-----------|
| Claude Sonnet | $3/1M | $15/1M | Excelente |
| GPT-4o | $5/1M | $15/1M | Excelente |
| GPT-4o-mini | $0.15/1M | $0.60/1M | Boa |
| Llama (local) | $0 | $0 | Variável |

**Recomendação**: GPT-4o-mini para custo baixo, Claude Sonnet para qualidade.

---

## Alertas de Custo

### Configurar alertas para:
```yaml
alerts:
  deepgram:
    daily_limit: $50
    monthly_limit: $1000
    warning_threshold: 80%

  claude:
    daily_limit: $30
    monthly_limit: $500
    warning_threshold: 80%

  infrastructure:
    cpu_threshold: 80%
    memory_threshold: 85%
    disk_threshold: 75%
```

---

## Resumo Executivo

### Fase MVP (Recomendado)
```
Infraestrutura: $8/mês (VPS básica)
APIs: ~$44/mês (100 sessões, otimizado)
────────────────────────────────────
Total: ~$52/mês para validar produto
```

### Fase Crescimento
```
Com 500 usuários e 10% premium:
- Receita: $495/mês
- Custo: ~$300/mês (otimizado)
- Lucro: ~$195/mês
```

### Decisões Críticas de Custo
1. **Whisper vs Deepgram**: Maior impacto no custo
2. **Batch analysis**: Reduz custo de IA em 70%
3. **Análise opcional**: Deixa usuário decidir
4. **Premium pricing**: $9.90 parece adequado para break-even

---

## Próximos Passos

- [ ] Criar conta Deepgram (free tier: 12,500 min/mês!)
- [ ] Criar conta Anthropic/OpenAI
- [ ] Configurar alertas de billing
- [ ] Implementar tracking de custos no dashboard admin
- [ ] Testar Whisper local para comparação

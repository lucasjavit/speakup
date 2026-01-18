# Análise de IA - SpeakUp

## Visão Geral

A análise de IA processa as transcrições das conversas para fornecer feedback detalhado sobre o aprendizado de idiomas, incluindo:

- Correções gramaticais
- Sugestões de vocabulário
- Avaliação de fluência
- Dicas personalizadas de melhoria

---

## Arquitetura do Pipeline

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   LiveKit     │────►│   Deepgram    │────►│    Storage    │
│  (Recording)  │     │  (Transcrição)│     │  (PostgreSQL) │
└───────────────┘     └───────────────┘     └───────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │  Job Queue    │
                                            │   (Redis)     │
                                            └───────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │   Worker      │
                                            │  (Async)      │
                                            └───────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │  Claude API   │
                                            │  (Análise)    │
                                            └───────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │   Report      │
                                            │  (Relatório)  │
                                            └───────────────┘
```

---

## Transcrição com Deepgram

### Configuração
```java
@Configuration
public class DeepgramConfig {
    @Value("${deepgram.api-key}")
    private String apiKey;

    @Value("${deepgram.model}")
    private String model = "nova-2";  // Modelo mais preciso

    @Bean
    public DeepgramClient deepgramClient() {
        return new DeepgramClient(apiKey);
    }
}
```

### Serviço de Transcrição
```java
@Service
public class TranscriptionService {

    public TranscriptionResult transcribe(String audioFilePath, String language) {
        PrerecordedTranscriptionOptions options = PrerecordedTranscriptionOptions.builder()
            .model("nova-2")
            .language(language)  // "en" ou "es"
            .smartFormat(true)
            .punctuate(true)
            .diarize(true)       // Identificar quem está falando
            .utterances(true)
            .build();

        DeepgramResponse response = deepgramClient.transcribeFile(
            new File(audioFilePath),
            options
        );

        return parseResponse(response);
    }

    private TranscriptionResult parseResponse(DeepgramResponse response) {
        List<Utterance> utterances = new ArrayList<>();

        for (var utterance : response.getResults().getUtterances()) {
            utterances.add(new Utterance(
                utterance.getSpeaker(),     // 0 ou 1
                utterance.getText(),
                utterance.getStart(),       // timestamp início
                utterance.getEnd(),         // timestamp fim
                utterance.getConfidence()   // 0.0 - 1.0
            ));
        }

        return new TranscriptionResult(
            response.getResults().getChannels().get(0).getAlternatives().get(0).getTranscript(),
            utterances
        );
    }
}
```

### Formato da Transcrição
```json
{
  "fullText": "Hello, how are you? I'm fine, thank you. And you?",
  "utterances": [
    {
      "speaker": 0,
      "text": "Hello, how are you?",
      "start": 0.5,
      "end": 2.1,
      "confidence": 0.95
    },
    {
      "speaker": 1,
      "text": "I'm fine, thank you. And you?",
      "start": 2.5,
      "end": 4.8,
      "confidence": 0.92
    }
  ],
  "language": "en",
  "duration": 600
}
```

---

## Análise com Claude API

### Serviço de Análise
```java
@Service
public class AIAnalysisService {

    @Value("${claude.api-key}")
    private String apiKey;

    private final Anthropic client;

    public AnalysisReport analyze(TranscriptionResult transcription, User user) {
        String prompt = buildPrompt(transcription, user);

        Message response = client.messages().create(
            MessageCreateParams.builder()
                .model("claude-3-5-sonnet-20241022")
                .maxTokens(4096)
                .messages(List.of(
                    MessageParam.builder()
                        .role("user")
                        .content(prompt)
                        .build()
                ))
                .build()
        );

        return parseAnalysis(response.getContent());
    }
}
```

### Prompt de Análise (Inglês)
```java
private String buildPromptEnglish(TranscriptionResult transcription, User user) {
    return """
        You are an expert English language tutor analyzing a conversation practice session.

        ## Student Information
        - Native language: %s
        - English level: %s
        - Session duration: %d minutes

        ## Conversation Transcript
        Speaker 0 = Student being analyzed
        Speaker 1 = Practice partner

        %s

        ## Your Task
        Analyze the student's (Speaker 0) English usage and provide:

        ### 1. Grammar Analysis
        List specific grammar mistakes with:
        - The original phrase
        - The corrected version
        - Brief explanation of the rule
        - Severity: minor/moderate/significant

        ### 2. Vocabulary Assessment
        - Words/phrases used well
        - Suggested alternatives for basic vocabulary
        - Idiomatic expressions they could have used
        - Technical/formal alternatives when appropriate

        ### 3. Fluency Score (1-10)
        Consider:
        - Natural flow of conversation
        - Response time (based on gaps)
        - Use of fillers
        - Sentence complexity
        - Topic development

        ### 4. Personalized Tips
        Provide 3 specific, actionable tips for improvement based on the patterns observed.

        ### 5. Positive Highlights
        Note 2-3 things the student did well to encourage continued practice.

        Respond in JSON format:
        ```json
        {
          "grammarErrors": [...],
          "vocabulary": {...},
          "fluencyScore": 7,
          "fluencyDetails": "...",
          "tips": [...],
          "highlights": [...]
        }
        ```
        """.formatted(
            user.getNativeLanguage(),
            user.getProficiencyLevel(),
            transcription.getDuration() / 60,
            formatTranscript(transcription)
        );
}
```

### Prompt de Análise (Espanhol)
```java
private String buildPromptSpanish(TranscriptionResult transcription, User user) {
    return """
        Eres un tutor experto en español analizando una sesión de práctica de conversación.

        ## Información del Estudiante
        - Idioma nativo: %s
        - Nivel de español: %s
        - Duración de la sesión: %d minutos

        ## Transcripción de la Conversación
        Hablante 0 = Estudiante siendo analizado
        Hablante 1 = Compañero de práctica

        %s

        ## Tu Tarea
        Analiza el uso del español del estudiante (Hablante 0) y proporciona:

        ### 1. Análisis Gramatical
        Lista errores específicos con:
        - La frase original
        - La versión corregida
        - Breve explicación de la regla
        - Severidad: menor/moderado/significativo

        ### 2. Evaluación de Vocabulario
        - Palabras/frases bien usadas
        - Alternativas sugeridas para vocabulario básico
        - Expresiones idiomáticas que podrían haber usado
        - Alternativas técnicas/formales cuando sea apropiado

        ### 3. Puntuación de Fluidez (1-10)

        ### 4. Consejos Personalizados
        3 consejos específicos y accionables.

        ### 5. Aspectos Positivos
        2-3 cosas que el estudiante hizo bien.

        Responde en formato JSON.
        """.formatted(...);
}
```

---

## Estrutura do Relatório

### Modelo de Dados
```java
@Entity
public class AnalysisReport {
    @Id
    private UUID id;

    @ManyToOne
    private Session session;

    @ManyToOne
    private User user;

    private Integer fluencyScore;  // 1-10

    @Column(columnDefinition = "TEXT")
    private String fluencyDetails;

    @OneToMany(cascade = CascadeType.ALL)
    private List<GrammarError> grammarErrors;

    @OneToMany(cascade = CascadeType.ALL)
    private List<VocabularySuggestion> vocabularySuggestions;

    @ElementCollection
    private List<String> tips;

    @ElementCollection
    private List<String> highlights;

    private LocalDateTime createdAt;
    private LocalDateTime processedAt;

    @Enumerated
    private AnalysisStatus status;  // PENDING, PROCESSING, COMPLETED, FAILED
}

@Entity
public class GrammarError {
    @Id
    private UUID id;

    private String original;
    private String corrected;
    private String explanation;

    @Enumerated
    private Severity severity;  // MINOR, MODERATE, SIGNIFICANT

    private Double timestamp;  // Quando ocorreu na conversa
}

@Entity
public class VocabularySuggestion {
    @Id
    private UUID id;

    private String original;
    private String suggested;
    private String context;
    private String reason;
}
```

### JSON de Resposta da API
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": "session_abc123",
  "userId": "user_xyz789",
  "fluencyScore": 7,
  "fluencyDetails": "Good conversational flow with natural responses. Some hesitation when discussing technical topics. Good use of transitional phrases.",
  "grammarErrors": [
    {
      "original": "I have went to the store",
      "corrected": "I have gone to the store",
      "explanation": "Use past participle 'gone' with 'have', not simple past 'went'",
      "severity": "MODERATE",
      "timestamp": 45.2
    },
    {
      "original": "She don't like it",
      "corrected": "She doesn't like it",
      "explanation": "Third person singular requires 'doesn't', not 'don't'",
      "severity": "SIGNIFICANT",
      "timestamp": 123.8
    }
  ],
  "vocabularySuggestions": [
    {
      "original": "very good",
      "suggested": "excellent, outstanding, remarkable",
      "context": "When describing the movie",
      "reason": "Using varied vocabulary sounds more natural and advanced"
    }
  ],
  "tips": [
    "Practice irregular past participles - focus on common verbs like go/gone, do/done, see/seen",
    "Try using more specific adjectives instead of 'very + adjective' combinations",
    "Great job maintaining conversation! Try asking follow-up questions to deepen discussions"
  ],
  "highlights": [
    "Excellent use of conditional sentences",
    "Natural intonation patterns",
    "Good active listening with appropriate responses"
  ],
  "createdAt": "2024-01-15T14:30:00Z",
  "processedAt": "2024-01-15T14:32:15Z",
  "status": "COMPLETED"
}
```

---

## Worker Assíncrono

### Configuração
```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean
    public Executor analysisExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("analysis-");
        return executor;
    }
}
```

### Worker
```java
@Service
public class AnalysisWorker {

    @Async("analysisExecutor")
    public CompletableFuture<AnalysisReport> processSession(Session session) {
        try {
            // 1. Buscar gravação
            String audioPath = storageService.getRecording(session.getRoomName());

            // 2. Transcrever
            TranscriptionResult transcription = transcriptionService.transcribe(
                audioPath,
                session.getLanguage()
            );

            // 3. Salvar transcrição
            transcriptionRepository.save(new Transcription(session, transcription));

            // 4. Analisar com IA
            AnalysisReport report = aiAnalysisService.analyze(
                transcription,
                session.getUser()
            );

            // 5. Salvar relatório
            report.setStatus(AnalysisStatus.COMPLETED);
            reportRepository.save(report);

            // 6. Notificar usuário
            notificationService.notifyAnalysisReady(session.getUser(), report);

            return CompletableFuture.completedFuture(report);

        } catch (Exception e) {
            log.error("Failed to process session {}", session.getId(), e);
            markAsFailed(session, e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }
}
```

---

## Custos da Análise

### Deepgram (Transcrição)
- Modelo Nova-2: $0.0043/minuto
- Sessão de 10 min: ~$0.043
- 6 conversas (1h): ~$0.26

### Claude API (Análise)
- Sonnet 3.5: $3/1M input tokens, $15/1M output tokens
- Transcrição média: ~2000 tokens input
- Resposta média: ~1500 tokens output
- Custo por análise: ~$0.03

### Total por Sessão Completa (1h)
- Transcrição: $0.26
- Análise (6 conversas): $0.18
- **Total: ~$0.44 por hora de prática**

---

## Otimizações

### 1. Batch Processing
Processar múltiplas conversas da mesma sessão em uma única chamada de IA:
```java
// Ao invés de 6 chamadas separadas, fazer 1 chamada com todas as conversas
String combinedPrompt = buildBatchPrompt(allTranscriptions);
```

### 2. Cache de Padrões Comuns
```java
// Cachear explicações de erros comuns
@Cacheable("grammar-explanations")
public String getExplanation(String errorType) {
    // Retorna explicação sem chamar IA
}
```

### 3. Análise Diferida
```java
// Processar em horários de baixa demanda
@Scheduled(cron = "0 0 3 * * *")  // 3 AM
public void processDelayedAnalysis() {
    // Processar sessões do dia anterior
}
```

---

## Métricas

```
- analysis.transcription.duration_ms
- analysis.transcription.accuracy
- analysis.ai.tokens_used
- analysis.ai.latency_ms
- analysis.queue.pending_count
- analysis.queue.processing_time
- analysis.report.fluency_score_avg
- analysis.cost.daily_total
```

---

## Próximos Passos

- [ ] Configurar conta Deepgram
- [ ] Configurar conta Claude/Anthropic
- [ ] Implementar TranscriptionService
- [ ] Implementar AIAnalysisService
- [ ] Criar worker assíncrono
- [ ] Desenvolver UI de relatório
- [ ] Otimizar prompts com feedback real

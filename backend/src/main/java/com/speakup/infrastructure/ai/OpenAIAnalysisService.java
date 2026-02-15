package com.speakup.infrastructure.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.speakup.domain.conversation.ConversationAnalysis;
import com.speakup.domain.conversation.ConversationTranscript;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Service for analyzing conversation transcripts using OpenAI API.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OpenAIAnalysisService {

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private static final String MODEL = "gpt-4o-mini";
    private static final Duration TIMEOUT = Duration.ofSeconds(60);

    private final ObjectMapper objectMapper;

    /**
     * Analyze a conversation transcript using OpenAI API.
     *
     * @param transcript The transcript to analyze
     * @param apiKey     User's OpenAI API key
     * @return ConversationAnalysis with the analysis results
     * @throws RuntimeException if the API call fails
     */
    public ConversationAnalysis analyzeTranscript(ConversationTranscript transcript, String apiKey) {
        log.info("Analyzing transcript {} using OpenAI", transcript.getId());

        try {
            String prompt = buildAnalysisPrompt(transcript.getTranscriptData());
            String response = callOpenAI(prompt, apiKey);
            return parseAnalysisResponse(response, transcript);
        } catch (Exception e) {
            log.error("Failed to analyze transcript {}", transcript.getId(), e);
            throw new RuntimeException("Failed to analyze transcript: " + e.getMessage(), e);
        }
    }

    private String buildAnalysisPrompt(String transcriptData) {
        return """
                Analyze the following English conversation transcript and provide a detailed analysis in JSON format.
                
                Focus on the language learning perspective, identifying:
                1. Grammar corrections - common mistakes and their corrections
                2. Vocabulary suggestions - better word choices and more natural expressions
                3. Fluency analysis - use of fillers, pauses, repetition, sentence structure
                4. Estimated CEFR level (A1, A2, B1, B2, C1, C2)
                5. Natural phrases - rewrite awkward sentences more naturally
                6. Topics practiced - main subjects discussed
                7. Overall feedback - constructive feedback and encouragement
                
                Return ONLY a valid JSON object with this exact structure:
                {
                  "grammarCorrections": [{"original": "...", "corrected": "...", "explanation": "..."}],
                  "vocabularySuggestions": [{"word": "...", "suggestion": "...", "context": "..."}],
                  "fluencyAnalysis": {
                    "fillerWords": ["um", "uh", "like"],
                    "repetitions": 5,
                    "sentenceComplexity": "simple/intermediate/complex",
                    "overallFluency": "..."
                  },
                  "estimatedLevel": "B1",
                  "naturalPhrases": [{"original": "...", "natural": "..."}],
                  "topicsPracticed": ["topic1", "topic2"],
                  "overallFeedback": "Detailed constructive feedback..."
                }
                
                Transcript:
                %s
                """.formatted(transcriptData);
    }

    private String callOpenAI(String prompt, String apiKey) {
        WebClient webClient = WebClient.builder()
                .baseUrl(OPENAI_API_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();

        Map<String, Object> requestBody = Map.of(
                "model", MODEL,
                "messages", List.of(
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.7,
                "max_tokens", 2000,
                "response_format", Map.of("type", "json_object")
        );

        return webClient.post()
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(TIMEOUT)
                .doOnError(error -> log.error("OpenAI API call failed", error))
                .onErrorResume(error -> Mono.error(new RuntimeException("OpenAI API call failed: " + error.getMessage())))
                .block();
    }

    private ConversationAnalysis parseAnalysisResponse(String response, ConversationTranscript transcript) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode content = root.path("choices").get(0).path("message").path("content");
            JsonNode analysis = objectMapper.readTree(content.asText());

            int tokensUsed = root.path("usage").path("total_tokens").asInt(0);

            return ConversationAnalysis.builder()
                    .transcript(transcript)
                    .grammarCorrections(analysis.path("grammarCorrections").toString())
                    .vocabularySuggestions(analysis.path("vocabularySuggestions").toString())
                    .fluencyAnalysis(analysis.path("fluencyAnalysis").toString())
                    .estimatedLevel(analysis.path("estimatedLevel").asText("B1"))
                    .naturalPhrases(analysis.path("naturalPhrases").toString())
                    .topicsPracticed(analysis.path("topicsPracticed").toString())
                    .overallFeedback(analysis.path("overallFeedback").asText(""))
                    .tokensUsed(tokensUsed)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse OpenAI response", e);
            throw new RuntimeException("Failed to parse OpenAI response: " + e.getMessage(), e);
        }
    }
}

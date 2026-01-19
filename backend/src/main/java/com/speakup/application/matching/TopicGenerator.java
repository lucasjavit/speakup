package com.speakup.application.matching;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Random;

/**
 * Generates conversation topics for practice sessions.
 * Currently uses a static list; can be enhanced to use AI generation.
 */
@Component
public class TopicGenerator {

    private final Random random = new Random();

    private static final List<String> TOPICS = List.of(
            // Travel & Places
            "If you could travel anywhere in the world, where would you go and why?",
            "What's the most interesting place you've ever visited?",
            "Do you prefer beach vacations or mountain adventures?",
            "What country would you like to live in for a year?",

            // Hypothetical Situations
            "What would you do if you won the lottery?",
            "If you could have any superpower, what would it be?",
            "What would you do if you could be invisible for a day?",
            "If you could meet any historical figure, who would it be?",

            // Daily Life
            "What's your morning routine like?",
            "What do you usually do on weekends?",
            "What's your favorite meal to cook at home?",
            "How do you like to relax after a long day?",

            // Technology
            "How has technology changed your daily life?",
            "What app on your phone do you use the most?",
            "Do you think AI will change the way we work?",
            "What technology do you wish existed?",

            // Culture & Entertainment
            "What's the last movie or series you watched?",
            "What kind of music do you enjoy listening to?",
            "Do you prefer reading books or watching movies?",
            "What's a tradition from your culture that you love?",

            // Career & Goals
            "What do you enjoy most about your job or studies?",
            "Where do you see yourself in five years?",
            "What skill would you like to learn this year?",
            "What advice would you give to your younger self?",

            // Food & Cuisine
            "What's your favorite cuisine and why?",
            "Do you prefer cooking at home or eating out?",
            "What's the most unusual food you've ever tried?",
            "If you could only eat one food forever, what would it be?",

            // Relationships & Social
            "What qualities do you value most in a friend?",
            "How do you stay in touch with friends who live far away?",
            "What's the best gift you've ever received?",
            "Do you prefer spending time alone or with others?",

            // Environment & Nature
            "What can individuals do to help the environment?",
            "Do you prefer living in a city or in the countryside?",
            "What's your favorite season and why?",
            "Have you ever had a pet? Tell me about it.",

            // Personal Growth
            "What's something you're proud of accomplishing?",
            "What's a challenge you've overcome recently?",
            "How do you handle stress?",
            "What motivates you to keep learning new things?"
    );

    /**
     * Generate a random conversation topic.
     */
    public String generateTopic() {
        int index = random.nextInt(TOPICS.size());
        return TOPICS.get(index);
    }

    /**
     * Generate a topic from a specific category (for future use).
     */
    public String generateTopic(String category) {
        // For now, just return a random topic
        // Can be enhanced to filter by category
        return generateTopic();
    }
}

package com.speakup.infrastructure.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis configuration for caching and session/queue management.
 * <p>
 * Cache names and TTLs:
 * <ul>
 *   <li>users: 30 minutes (user profile data)</li>
 *   <li>sessions: 1 hour (active video sessions)</li>
 *   <li>topics: 24 hours (AI-generated conversation topics)</li>
 *   <li>statistics: 5 minutes (user statistics)</li>
 *   <li>queues: 10 minutes (matching queue data)</li>
 *   <li>favorites: 1 hour (user favorites list)</li>
 * </ul>
 */
@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // User cache - 30 minutes
        cacheConfigurations.put("users", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // Active video sessions cache - 1 hour
        cacheConfigurations.put("sessions", defaultConfig.entryTtl(Duration.ofHours(1)));

        // AI topics cache - 24 hours (topics don't change often)
        cacheConfigurations.put("topics", defaultConfig.entryTtl(Duration.ofHours(24)));

        // Statistics cache - 5 minutes (frequently updated)
        cacheConfigurations.put("statistics", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        // Matching queue cache - 10 minutes
        cacheConfigurations.put("queues", defaultConfig.entryTtl(Duration.ofMinutes(10)));

        // User favorites cache - 1 hour
        cacheConfigurations.put("favorites", defaultConfig.entryTtl(Duration.ofHours(1)));

        // Session periods (admin-defined) - 1 hour
        cacheConfigurations.put("periods", defaultConfig.entryTtl(Duration.ofHours(1)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}

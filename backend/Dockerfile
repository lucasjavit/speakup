# Build stage
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S speakup && \
    adduser -u 1001 -S speakup -G speakup

COPY --from=build /app/target/*.jar app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

USER speakup
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

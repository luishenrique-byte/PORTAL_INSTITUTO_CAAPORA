# ---------- build ----------
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

# Baixa as dependências primeiro para aproveitar o cache das camadas
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q -DskipTests package && cp target/*.jar app.jar

# ---------- runtime ----------
FROM eclipse-temurin:17-jre-alpine AS runner
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring \
    && mkdir -p /app/uploads && chown spring:spring /app/uploads

COPY --from=builder /app/app.jar app.jar

ENV UPLOADS_DIR=/app/uploads
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

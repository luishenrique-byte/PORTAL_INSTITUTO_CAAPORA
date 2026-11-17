package com.inovatech.portal_instituto_caapora.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// Libera o frontend (Next.js, porta 3000) para chamar o backend (porta 8080).
// Sem isso, o navegador bloqueia as requisições.
// É aplicado pelo Spring Security (.cors() no SecurityConfig): assim o preflight (OPTIONS)
// das rotas protegidas é respondido antes da checagem do token, que ele não carrega.
@Configuration
public class CorsConfig {

    // Origens liberadas, separadas por vírgula (variável CORS_ALLOWED_ORIGINS)
    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String[] allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        config.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

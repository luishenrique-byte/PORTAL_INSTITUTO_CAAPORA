package com.inovatech.portal_instituto_caapora.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAutheticationFilter jwtAutheticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http){
        return http
                .csrf(c -> c.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                        .accessDeniedHandler((request, response, accessDeniedExecepion) -> {
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                        })
                )
                .authorizeHttpRequests(auth -> auth
                    // ==========================================
                    // 1. ROTAS PÚBLICAS
                    // ==========================================
                    .requestMatchers("/auth/login").permitAll()
                    .requestMatchers("/ocorrencias/publica").permitAll()
                    .requestMatchers("/ocorrencias/rastreio/**").permitAll()
                    .requestMatchers("/ocorrencias/*/midias").permitAll()
                    .requestMatchers(HttpMethod.POST, "/ocorrencias/publica/*/midias").permitAll()
                    .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                    .requestMatchers(
                            "/swagger-ui/**",
                            "/swagger-ui.html/**" ,
                            "/v3/api-docs/**").permitAll()

                    // ==========================================
                    // 2. COORDENADOR
                    // ==========================================
                    .requestMatchers("/funcionarios/**").hasAuthority("COORDENADOR")
                    .requestMatchers("/perfis/**").hasAuthority("COORDENADOR")
                    .requestMatchers(HttpMethod.POST,"/equipes").hasAuthority("COORDENADOR")
                    .requestMatchers(HttpMethod.PUT,"/equipes").hasAuthority("COORDENADOR")

                    // ==========================================
                    // 3. ATENDENTE + COORDENADOR
                    // ==========================================
                    .requestMatchers(HttpMethod.POST, "/ocorrencias/manual").hasAnyAuthority("ATENDENTE", "COORDENADOR")
                    .requestMatchers(HttpMethod.PATCH, "/ocorrencias/*/urgencia").hasAnyAuthority("ATENDENTE", "COORDENADOR")
                    .requestMatchers(HttpMethod.PATCH, "/ocorrencias/*/equipe").hasAnyAuthority("ATENDENTE", "COORDENADOR")
                    .requestMatchers("/relatorios/**").hasAnyAuthority("ATENDENTE","COORDENADOR")
                    .requestMatchers("/dashboard/**").hasAnyAuthority("ATENDENTE","COORDENADOR")
                    //Rota futura para consulta de vagas e clinícas/hospitais disponíveis
                    //.requestMatchers(HttpMethod.GET, "/hospitais/**").hasAnyAuthority("ATENDENTE", "COORDENADOR")

                    // ==========================================
                    // 4. EQUIPE DE CAMPO + COORDENADOR
                    // ==========================================

                    // ==========================================
                    // 5. ATENDENTE + EQUIPE DE CAMPO + COORDENADOR
                    // ==========================================
                    .requestMatchers(HttpMethod.PATCH, "/ocorrencias/*/status").hasAnyAuthority("EQUIPE_CAMPO", "COORDENADOR","ATENDENTE")
                    .requestMatchers(HttpMethod.GET,"/ocorrencias").hasAnyAuthority("EQUIPE_CAMPO","ATENDENTE", "COORDENADOR")
                            .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAutheticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration){
        return authenticationConfiguration.getAuthenticationManager();
    }
}

package com.inovatech.portal_instituto_caapora.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class TokenProviderTest {

    @InjectMocks
    private TokenProvider tokenProvider;

    @Mock
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        // Simulamos as chaves do application.properties
        ReflectionTestUtils.setField(tokenProvider, "expirationTime", 3600000L); // 1 hora
        ReflectionTestUtils.setField(tokenProvider, "key", "minha-chave-secreta-muito-segura-para-testes-jwt-12345");
    }

    @Test
    void deveGerarValidarEExtrairUsernameDoToken() {
        // Arrange
        String emailTeste = "coordenador@caapora.org";
        UserDetails userDetails = new User(emailTeste, "senha123", Collections.emptyList());
        when(authentication.getPrincipal()).thenReturn(userDetails);

        // Act 1: Gerar
        String tokenGerado = tokenProvider.gerarToken(authentication);

        // Assert 1 & 2: Verificar se gerou e se é válido
        assertNotNull(tokenGerado);
        assertTrue(tokenProvider.isTokenValid(tokenGerado));

        // Act 3 & Assert 3: Extrair e-mail
        String emailExtraido = tokenProvider.getUsernameFromToken(tokenGerado);
        assertEquals(emailTeste, emailExtraido);
    }

    @Test
    void deveRetornarFalsoParaTokenInvalidoOuAdulterado() {
        // Arrange
        String tokenFalso = "eyJhbGciOiJIUzI1NiJ9.token.falsificado";

        // Act
        boolean isValido = tokenProvider.isTokenValid(tokenFalso);

        // Assert
        assertFalse(isValido);
    }
}
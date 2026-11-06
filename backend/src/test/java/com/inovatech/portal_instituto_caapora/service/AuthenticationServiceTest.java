package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.config.TokenProvider;
import com.inovatech.portal_instituto_caapora.dto.request.LoginRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.TokenResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class AuthenticationServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private TokenProvider tokenProvider;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        // Injeta o valor do @Value manualmente para os testes
        ReflectionTestUtils.setField(authenticationService, "expiration", 900000L);
    }

    @Test
    void deveFazerLoginComSucessoERetornarToken() {
        // Arrange (Preparação)
        LoginRequestDTO requestDTO = new LoginRequestDTO("teste@caapora.org", "senha123");
        String tokenSimulado = "eyJhbGciOiJIUzI1NiJ9.simulado";

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(tokenProvider.gerarToken(authentication)).thenReturn(tokenSimulado);

        // Act (Ação)
        TokenResponseDTO response = authenticationService.login(requestDTO);

        // Assert (Verificação)
        assertNotNull(response);
        assertEquals(tokenSimulado, response.token());
        assertEquals(900000L, response.expiresIn());
        verify(authenticationManager, times(1)).authenticate(any());
        verify(tokenProvider, times(1)).gerarToken(authentication);
    }

    @Test
    void deveLancarBadCredentialsExceptionQuandoCredenciaisInvalidas() {
        // Arrange (Preparação)
        LoginRequestDTO requestDTO = new LoginRequestDTO("teste@caapora.org", "senhaErrada");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // Act & Assert (Ação e Verificação)
        BadCredentialsException exception = assertThrows(BadCredentialsException.class, () -> {
            authenticationService.login(requestDTO);
        });

        assertEquals("Credenciais invalidas", exception.getMessage());
        verify(tokenProvider, never()).gerarToken(any()); // Garante que o token nunca foi gerado
    }
}
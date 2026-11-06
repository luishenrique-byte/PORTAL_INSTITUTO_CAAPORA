package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.FuncionarioEntity;
import com.inovatech.portal_instituto_caapora.database.repository.FuncionarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
    public class UserDetailsServiceImplTest {

    @Mock
    private FuncionarioRepository funcionarioRepository;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    @Test
    void deveRetornarUserDetailsQuandoEmailExistir() {
        // Arrange (Preparação)
        String emailTeste = "coordenador@caapora.org";
        FuncionarioEntity funcionarioMock = new FuncionarioEntity();
        funcionarioMock.setEmail(emailTeste);
        // Assumindo que a sua FuncionarioEntity já implementa UserDetails e tem senha/perfil configurados

        when(funcionarioRepository.findByEmail(emailTeste)).thenReturn(Optional.of(funcionarioMock));

        // Act (Ação)
        UserDetails userDetails = userDetailsService.loadUserByUsername(emailTeste);

        // Assert (Verificação)
        assertNotNull(userDetails);
        assertEquals(emailTeste, userDetails.getUsername());
        verify(funcionarioRepository, times(1)).findByEmail(emailTeste);
    }

    @Test
    void deveLancarUsernameNotFoundExceptionQuandoEmailNaoExistir() {
        // Arrange (Preparação)
        String emailTeste = "inexistente@caapora.org";

        when(funcionarioRepository.findByEmail(emailTeste)).thenReturn(Optional.empty());

        // Act & Assert (Ação e Verificação)
        assertThrows(UsernameNotFoundException.class, () -> {
            userDetailsService.loadUserByUsername(emailTeste);
        });

        verify(funcionarioRepository, times(1)).findByEmail(emailTeste);
    }
}
package com.inovatech.portal_instituto_caapora.config;

import com.inovatech.portal_instituto_caapora.dto.request.FuncionarioRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.PerfilResponseDTO;
import com.inovatech.portal_instituto_caapora.service.FuncionarioService;
import com.inovatech.portal_instituto_caapora.service.PerfilService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InicializacaoBancoTest {

    private static final String EMAIL = "admin@institutocaapora.com.br";

    @Mock FuncionarioService funcionarioService;
    @Mock PerfilService perfilService;

    @InjectMocks InicializacaoBanco inicializacao;

    @BeforeEach
    void configurar() {
        ReflectionTestUtils.setField(inicializacao, "nomeAdmin", "Admin");
        ReflectionTestUtils.setField(inicializacao, "emailAdmin", EMAIL);
        ReflectionTestUtils.setField(inicializacao, "senhaAdmin", "senha-de-teste");
        when(perfilService.garantir(anyString()))
                .thenAnswer(inv -> new PerfilResponseDTO(7L, inv.getArgument(0)));
    }

    @Test
    void garanteOsTresPerfisSemFalharQuandoJaExistem() {
        when(funcionarioService.existsByEmail(EMAIL)).thenReturn(true);

        inicializacao.run();

        verify(perfilService).garantir("COORDENADOR");
        verify(perfilService).garantir("ATENDENTE");
        verify(perfilService).garantir("EQUIPE_CAMPO");
        verify(funcionarioService, never()).criar(any());
    }

    @Test
    void criaCoordenadorInicialQuandoEmailNaoExiste() {
        when(funcionarioService.existsByEmail(EMAIL)).thenReturn(false);

        inicializacao.run();

        ArgumentCaptor<FuncionarioRequestDTO> captor = ArgumentCaptor.forClass(FuncionarioRequestDTO.class);
        verify(funcionarioService).criar(captor.capture());
        assertEquals(EMAIL, captor.getValue().email());
        assertEquals(7L, captor.getValue().perfilId());
    }

    @Test
    void naoCriaCoordenadorSemSenhaConfigurada() {
        ReflectionTestUtils.setField(inicializacao, "senhaAdmin", "");
        when(funcionarioService.existsByEmail(EMAIL)).thenReturn(false);

        inicializacao.run();

        verify(funcionarioService, never()).criar(any());
    }
}

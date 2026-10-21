package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.TipoMidia;
import com.inovatech.portal_instituto_caapora.database.models.MidiaEntity;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.repository.MidiaRepository;
import com.inovatech.portal_instituto_caapora.database.repository.OcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.dto.request.MidiaRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.MidiaResponseDTO;
import com.inovatech.portal_instituto_caapora.exception.RecursoNaoEncontradoException;
import com.inovatech.portal_instituto_caapora.exception.RegraNegocioException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MidiaServiceTest {

    @Mock MidiaRepository midiaRepository;
    @Mock OcorrenciaRepository ocorrenciaRepository;

    @InjectMocks MidiaService service;

    private final OcorrenciaEntity emAndamento = ocorrencia(10L, OcorrenciaStatus.TRIAGEM);
    private final OcorrenciaEntity concluida = ocorrencia(11L, OcorrenciaStatus.CONCLUIDO);

    @BeforeEach
    void setUp() {
        when(midiaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(ocorrenciaRepository.findById(10L)).thenReturn(Optional.of(emAndamento));
        when(ocorrenciaRepository.findById(11L)).thenReturn(Optional.of(concluida));
    }

    @Test
    void adicionaFotoNaOcorrencia() {
        MidiaResponseDTO resposta = service.adicionar(10L, new MidiaRequestDTO("/uploads/foto1.jpg", TipoMidia.FOTO));

        assertEquals("/uploads/foto1.jpg", resposta.url());
        assertEquals(TipoMidia.FOTO, resposta.tipoMidia());
    }

    @Test
    void naoAdicionaMidiaEmOcorrenciaConcluida() {
        assertThrows(RegraNegocioException.class,
                () -> service.adicionar(11L, new MidiaRequestDTO("/uploads/foto1.jpg", TipoMidia.FOTO)));
        verify(midiaRepository, never()).save(any());
    }

    @Test
    void ocorrenciaInexistenteDaErro() {
        assertThrows(RecursoNaoEncontradoException.class, () -> service.listarPorOcorrencia(99L));
    }

    @Test
    void listaTodasAsMidiasDaOcorrencia() {
        when(midiaRepository.findByOcorrenciaId(10L)).thenReturn(List.of(
                midia(1L, TipoMidia.FOTO, emAndamento), midia(2L, TipoMidia.VIDEO, emAndamento)));

        assertEquals(2, service.listarPorOcorrencia(10L).size());
    }

    @Test
    void naoRemoveMidiaDeOcorrenciaConcluida() {
        MidiaEntity midia = midia(1L, TipoMidia.FOTO, concluida);
        when(midiaRepository.findById(1L)).thenReturn(Optional.of(midia));

        assertThrows(RegraNegocioException.class, () -> service.remover(1L));
        verify(midiaRepository, never()).delete(any());
    }

    @Test
    void removeMidiaDeOcorrenciaEmAndamento() {
        MidiaEntity midia = midia(1L, TipoMidia.FOTO, emAndamento);
        when(midiaRepository.findById(1L)).thenReturn(Optional.of(midia));

        service.remover(1L);

        verify(midiaRepository).delete(midia);
    }

    private OcorrenciaEntity ocorrencia(Long id, OcorrenciaStatus status) {
        return OcorrenciaEntity.builder().id(id).protocolo("CAA-" + id).ocorrenciaStatus(status).build();
    }

    private MidiaEntity midia(Long id, TipoMidia tipo, OcorrenciaEntity ocorrencia) {
        return MidiaEntity.builder().id(id).url("/uploads/" + id).tipoMidia(tipo).ocorrencia(ocorrencia).build();
    }
}

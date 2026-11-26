package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.EquipeStatus;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.EquipeEntity;
import com.inovatech.portal_instituto_caapora.database.models.FuncionarioEntity;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.models.PerfilEntity;
import com.inovatech.portal_instituto_caapora.database.repository.EquipeRepository;
import com.inovatech.portal_instituto_caapora.database.repository.FuncionarioRepository;
import com.inovatech.portal_instituto_caapora.database.repository.OcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.dto.request.EquipeRequestDTO;
import com.inovatech.portal_instituto_caapora.dto.response.EquipeDetalheResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.EquipeResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.EquipeResumoResponseDTO;
import com.inovatech.portal_instituto_caapora.exception.RecursoNaoEncontradoException;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EquipeServiceTest {

    @Mock EquipeRepository equipeRepository;
    @Mock FuncionarioRepository funcionarioRepository;
    @Mock OcorrenciaRepository ocorrenciaRepository;

    @InjectMocks EquipeService service;

    private final EquipeEntity alfa = EquipeEntity.builder().id(1L).nome("Alfa").status(EquipeStatus.OCUPADO).build();

    @Test
    void equipeNovaComecaDisponivelEGuardaRegiaoETelefone() {
        when(equipeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipeResponseDTO nova = service.criar(
                new EquipeRequestDTO("Beta", "Zona Norte – Salvador", "(71) 98001-0001"));

        assertEquals(EquipeStatus.DISPONIVEL, nova.status());
        assertEquals("Zona Norte – Salvador", nova.regiao());
        assertEquals("(71) 98001-0001", nova.telefone());
    }

    @Test
    void renomearTrocaSoONome() {
        when(equipeRepository.findById(1L)).thenReturn(Optional.of(alfa));
        when(equipeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipeResponseDTO renomeada = service.renomear(1L, new EquipeRequestDTO("Alfa 2", null, null));

        assertEquals("Alfa 2", renomeada.nome());
        assertEquals(EquipeStatus.OCUPADO, renomeada.status());
    }

    @Test
    void resumoTrazAsContagensDeCadaEquipe() {
        when(equipeRepository.findAll(Sort.by("id"))).thenReturn(List.of(alfa));
        when(funcionarioRepository.countByEquipeIdAndAtivoTrue(1L)).thenReturn(4L);
        when(ocorrenciaRepository.countByEquipeIdAndOcorrenciaStatusNot(1L, OcorrenciaStatus.CONCLUIDO)).thenReturn(2L);
        when(ocorrenciaRepository.countByEquipeIdAndOcorrenciaStatus(1L, OcorrenciaStatus.CONCLUIDO)).thenReturn(15L);

        EquipeResumoResponseDTO card = service.listarResumo().get(0);

        assertEquals("Alfa", card.nome());
        assertEquals(4, card.membros());
        assertEquals(2, card.emCampo());
        assertEquals(15, card.concluidos());
    }

    @Test
    void detalheSeparaEmAndamentoDoHistoricoEMostraSoMembrosAtivos() {
        PerfilEntity perfil = PerfilEntity.builder().id(1L).perfil("EQUIPE_CAMPO").build();
        when(equipeRepository.findById(1L)).thenReturn(Optional.of(alfa));
        when(funcionarioRepository.findByEquipeId(1L)).thenReturn(List.of(
                FuncionarioEntity.builder().id(1L).nome("Ana").perfil(perfil).equipe(alfa).ativo(true).build(),
                FuncionarioEntity.builder().id(2L).nome("Rui").perfil(perfil).equipe(alfa).ativo(false).build()));
        when(ocorrenciaRepository.findByEquipeId(1L)).thenReturn(List.of(
                ocorrencia(10L, OcorrenciaStatus.RESGATE, LocalDateTime.now()),
                ocorrencia(11L, OcorrenciaStatus.CONCLUIDO, LocalDateTime.now().minusDays(2)),
                ocorrencia(12L, OcorrenciaStatus.CONCLUIDO, LocalDateTime.now().minusDays(1))));

        EquipeDetalheResponseDTO detalhe = service.detalhar(1L);

        assertEquals(1, detalhe.membros().size());
        assertEquals(1, detalhe.resgatesEmAndamento().size());
        assertEquals(10L, detalhe.resgatesEmAndamento().get(0).id());
        assertEquals(12L, detalhe.historicoRecente().get(0).id()); // mais recente primeiro
        assertEquals(2, detalhe.totalConcluidos());
    }

    @Test
    void historicoRecenteMostraNoMaximoDez() {
        when(equipeRepository.findById(1L)).thenReturn(Optional.of(alfa));
        when(ocorrenciaRepository.findByEquipeId(1L)).thenReturn(IntStream.range(0, 15)
                .mapToObj(i -> ocorrencia((long) i, OcorrenciaStatus.CONCLUIDO, LocalDateTime.now().minusDays(i)))
                .toList());

        EquipeDetalheResponseDTO detalhe = service.detalhar(1L);

        assertEquals(10, detalhe.historicoRecente().size());
        assertEquals(15, detalhe.totalConcluidos()); // o total conta todos, não só os 10 da lista
    }

    @Test
    void equipeInexistenteDaErro() {
        assertThrows(RecursoNaoEncontradoException.class, () -> service.detalhar(99L));
    }

    private OcorrenciaEntity ocorrencia(Long id, OcorrenciaStatus status, LocalDateTime data) {
        return OcorrenciaEntity.builder().id(id).protocolo("CAA-" + id)
                .ocorrenciaStatus(status).dataHoraRegistro(data).equipe(alfa).build();
    }
}

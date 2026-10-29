package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.EquipeStatus;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.EquipeEntity;
import com.inovatech.portal_instituto_caapora.database.models.HistoricoOcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.repository.HistoricoOcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.database.repository.OcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.dto.response.ContagemResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.RelatorioResponseDTO;
import com.inovatech.portal_instituto_caapora.exception.RegraNegocioException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RelatorioServiceTest {

    @Mock OcorrenciaRepository ocorrenciaRepository;
    @Mock HistoricoOcorrenciaRepository historicoRepository;

    @InjectMocks RelatorioService service;

    private final LocalDateTime base = LocalDateTime.of(2026, 10, 1, 8, 0);
    private final EquipeEntity alfa = EquipeEntity.builder().id(1L).nome("Alfa").status(EquipeStatus.OCUPADO).build();

    @Test
    void periodoSemOcorrenciasDevolveRelatorioZerado() {
        when(ocorrenciaRepository.findAll()).thenReturn(List.of());

        RelatorioResponseDTO relatorio = service.gerar(base, base.plusDays(30), null);

        assertEquals(0, relatorio.totalOcorrencias());
        assertEquals(0.0, relatorio.taxaConclusao());
        assertNull(relatorio.tempoMedioRespostaMinutos());
    }

    @Test
    void dataInicialDepoisDaFinalEhRecusada() {
        assertThrows(RegraNegocioException.class, () -> service.gerar(base.plusDays(1), base, null));
    }

    @Test
    void calculaTemposMediosPelaLinhaDoTempo() {
        // Ocorrência 1: triagem 30 min depois do registro, concluída 2h depois
        OcorrenciaEntity o1 = ocorrencia(1L, OcorrenciaStatus.CONCLUIDO, base, alfa);
        historico(o1, etapa(OcorrenciaStatus.REGISTRADA, base),
                etapa(OcorrenciaStatus.TRIAGEM, base.plusMinutes(30)),
                etapa(OcorrenciaStatus.CONCLUIDO, base.plusMinutes(120)));
        // Ocorrência 2: triagem 10 min depois, ainda não concluída
        OcorrenciaEntity o2 = ocorrencia(2L, OcorrenciaStatus.TRIAGEM, base.plusHours(1), alfa);
        historico(o2, etapa(OcorrenciaStatus.REGISTRADA, base.plusHours(1)),
                etapa(OcorrenciaStatus.TRIAGEM, base.plusHours(1).plusMinutes(10)));
        when(ocorrenciaRepository.findAll()).thenReturn(List.of(o1, o2));

        RelatorioResponseDTO relatorio = service.gerar(null, null, null);

        assertEquals(2, relatorio.totalOcorrencias());
        assertEquals(50.0, relatorio.taxaConclusao());
        assertEquals(20.0, relatorio.tempoMedioRespostaMinutos());   // (30 + 10) / 2
        assertEquals(120.0, relatorio.tempoMedioConclusaoMinutos()); // só a concluída conta
        assertEquals(List.of(new ContagemResponseDTO("Alfa", 2)), relatorio.porEquipe());
    }

    @Test
    void filtraPorPeriodoEEquipe() {
        EquipeEntity beta = EquipeEntity.builder().id(2L).nome("Beta").status(EquipeStatus.DISPONIVEL).build();
        OcorrenciaEntity dentro = ocorrencia(1L, OcorrenciaStatus.REGISTRADA, base.plusDays(2), alfa);
        OcorrenciaEntity outraEquipe = ocorrencia(2L, OcorrenciaStatus.REGISTRADA, base.plusDays(2), beta);
        OcorrenciaEntity foraDoPeriodo = ocorrencia(3L, OcorrenciaStatus.REGISTRADA, base.minusDays(5), alfa);
        when(ocorrenciaRepository.findAll()).thenReturn(List.of(dentro, outraEquipe, foraDoPeriodo));

        RelatorioResponseDTO relatorio = service.gerar(base, base.plusDays(30), 1L);

        assertEquals(1, relatorio.totalOcorrencias());
    }

    private OcorrenciaEntity ocorrencia(Long id, OcorrenciaStatus status, LocalDateTime data, EquipeEntity equipe) {
        return OcorrenciaEntity.builder()
                .id(id)
                .ocorrenciaStatus(status)
                .grauUrgencia(GrauUrgencia.ALTA)
                .dataHoraRegistro(data)
                .equipe(equipe)
                .build();
    }

    private HistoricoOcorrenciaEntity etapa(OcorrenciaStatus status, LocalDateTime dataHora) {
        return HistoricoOcorrenciaEntity.builder().statusMovimentacao(status).dataHora(dataHora).build();
    }

    private void historico(OcorrenciaEntity o, HistoricoOcorrenciaEntity... etapas) {
        when(historicoRepository.findByOcorrenciaIdOrderByDataHoraAsc(o.getId())).thenReturn(List.of(etapas));
    }
}

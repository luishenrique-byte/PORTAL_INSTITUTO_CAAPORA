package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.AnimalEntity;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.CategoriaAnimal;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.repository.OcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.dto.response.ContagemResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.DashboardResumoResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.PontoMapaResponseDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DashboardServiceTest {

    @Mock OcorrenciaRepository ocorrenciaRepository;

    @InjectMocks DashboardService service;

    @Test
    void resumoContaTotaisECalculaTaxaDeConclusao() {
        when(ocorrenciaRepository.findAll()).thenReturn(List.of(
                ocorrencia(OcorrenciaStatus.CONCLUIDO, GrauUrgencia.CRITICA, CategoriaAnimal.AVE),
                ocorrencia(OcorrenciaStatus.TRIAGEM, GrauUrgencia.CRITICA, CategoriaAnimal.AVE),
                ocorrencia(OcorrenciaStatus.REGISTRADA, GrauUrgencia.BAIXA, CategoriaAnimal.REPTIL),
                ocorrencia(OcorrenciaStatus.CONCLUIDO, GrauUrgencia.MEDIA, CategoriaAnimal.MAMIFERO)));

        DashboardResumoResponseDTO resumo = service.resumo();

        assertEquals(4, resumo.totalOcorrencias());
        assertEquals(2, resumo.emAberto());
        assertEquals(1, resumo.urgenciasCriticas()); // a crítica concluída não conta
        assertEquals(2, resumo.concluidas());
        assertEquals(50.0, resumo.taxaConclusao());
    }

    @Test
    void resumoSemOcorrenciasNaoDividePorZero() {
        when(ocorrenciaRepository.findAll()).thenReturn(List.of());

        assertEquals(0.0, service.resumo().taxaConclusao());
    }

    @Test
    void contagemPorCategoriaMostraTodasAsCategorias() {
        when(ocorrenciaRepository.findAll()).thenReturn(List.of(
                ocorrencia(OcorrenciaStatus.REGISTRADA, GrauUrgencia.ALTA, CategoriaAnimal.AVE),
                ocorrencia(OcorrenciaStatus.REGISTRADA, GrauUrgencia.ALTA, CategoriaAnimal.AVE)));

        List<ContagemResponseDTO> contagem = service.contarPorCategoriaAnimal();

        assertEquals(CategoriaAnimal.values().length, contagem.size());
        assertEquals(new ContagemResponseDTO("AVE", 2), contagem.get(0));
        assertEquals(new ContagemResponseDTO("PEIXE", 0), contagem.get(3));
    }

    @Test
    void tendenciaMensalIncluiMesesSemOcorrencia() {
        OcorrenciaEntity desteMes = ocorrencia(OcorrenciaStatus.REGISTRADA, GrauUrgencia.ALTA, CategoriaAnimal.AVE);
        when(ocorrenciaRepository.findByDataHoraRegistroBetween(any(), any())).thenReturn(List.of(desteMes));

        List<ContagemResponseDTO> meses = service.contarPorMes(3);

        assertEquals(3, meses.size());
        assertEquals(YearMonth.now().toString(), meses.get(2).rotulo());
        assertEquals(1, meses.get(2).quantidade());
        assertEquals(0, meses.get(0).quantidade());
    }

    @Test
    void mapaDeCalorIgnoraOcorrenciaSemGps() {
        OcorrenciaEntity comGps = ocorrencia(OcorrenciaStatus.REGISTRADA, GrauUrgencia.ALTA, CategoriaAnimal.AVE);
        comGps.setLatitude(-12.97);
        comGps.setLongitude(-38.50);
        OcorrenciaEntity semGps = ocorrencia(OcorrenciaStatus.REGISTRADA, GrauUrgencia.ALTA, CategoriaAnimal.AVE);
        when(ocorrenciaRepository.findByDataHoraRegistroBetween(any(), any())).thenReturn(List.of(comGps, semGps));

        List<PontoMapaResponseDTO> pontos = service.pontosMapaCalor(90);

        assertEquals(1, pontos.size());
        assertEquals(-12.97, pontos.get(0).latitude());
    }

    private OcorrenciaEntity ocorrencia(OcorrenciaStatus status, GrauUrgencia urgencia, CategoriaAnimal categoria) {
        return OcorrenciaEntity.builder()
                .ocorrenciaStatus(status)
                .grauUrgencia(urgencia)
                .dataHoraRegistro(LocalDateTime.now())
                .animal(AnimalEntity.builder().categoriaAnimal(categoria).build())
                .build();
    }
}

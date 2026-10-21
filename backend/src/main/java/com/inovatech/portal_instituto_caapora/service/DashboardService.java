package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.CategoriaAnimal;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.repository.OcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.dto.response.ContagemResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.DashboardResumoResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.PontoMapaResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.IntStream;

// Indicadores do painel do coordenador (RF06, Telas 3/4 e 9/10 do protótipo)
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OcorrenciaRepository ocorrenciaRepository;

    // Cards do topo: total, em aberto, urgências críticas e taxa de conclusão
    @Transactional(readOnly = true)
    public DashboardResumoResponseDTO resumo() {
        List<OcorrenciaEntity> ocorrencias = ocorrenciaRepository.findAll();
        long total = ocorrencias.size();
        long concluidas = ocorrencias.stream().filter(DashboardService::concluida).count();
        long criticasEmAberto = ocorrencias.stream()
                .filter(o -> !concluida(o))
                .filter(o -> o.getGrauUrgencia() == GrauUrgencia.CRITICA)
                .count();
        return new DashboardResumoResponseDTO(total, total - concluidas, criticasEmAberto, concluidas,
                porcentagem(concluidas, total));
    }

    // Gráfico "desempenho por status de resgate"
    @Transactional(readOnly = true)
    public List<ContagemResponseDTO> contarPorStatus() {
        return ContagemResponseDTO.porEnum(ocorrenciaRepository.findAll(),
                OcorrenciaStatus.class, OcorrenciaEntity::getOcorrenciaStatus);
    }

    // Gráfico de pizza "distribuição por tipo de animal"
    @Transactional(readOnly = true)
    public List<ContagemResponseDTO> contarPorCategoriaAnimal() {
        return ContagemResponseDTO.porEnum(ocorrenciaRepository.findAll(), CategoriaAnimal.class,
                o -> o.getAnimal() != null ? o.getAnimal().getCategoriaAnimal() : null);
    }

    // Gráfico "tendência mensal": quantidade de ocorrências em cada um dos últimos meses,
    // do mais antigo para o mais recente. Meses sem ocorrência aparecem com zero.
    @Transactional(readOnly = true)
    public List<ContagemResponseDTO> contarPorMes(int quantidadeMeses) {
        if (quantidadeMeses < 1) {
            quantidadeMeses = 1;
        }
        YearMonth atual = YearMonth.now();
        YearMonth primeiro = atual.minusMonths(quantidadeMeses - 1L);
        List<OcorrenciaEntity> ocorrencias = ocorrenciaRepository.findByDataHoraRegistroBetween(
                primeiro.atDay(1).atStartOfDay(), LocalDateTime.now());

        return IntStream.range(0, quantidadeMeses)
                .mapToObj(primeiro::plusMonths)
                .map(mes -> new ContagemResponseDTO(mes.toString(), ocorrencias.stream()
                        .filter(o -> YearMonth.from(o.getDataHoraRegistro()).equals(mes))
                        .count()))
                .toList();
    }

    // Mapa de calor: pontos de GPS das ocorrências dos últimos dias (o protótipo usa 90).
    // Ocorrências registradas só com endereço digitado, sem GPS, ficam de fora.
    @Transactional(readOnly = true)
    public List<PontoMapaResponseDTO> pontosMapaCalor(int ultimosDias) {
        LocalDateTime agora = LocalDateTime.now();
        return ocorrenciaRepository.findByDataHoraRegistroBetween(agora.minusDays(ultimosDias), agora).stream()
                .filter(o -> o.getLatitude() != null && o.getLongitude() != null)
                .map(o -> new PontoMapaResponseDTO(o.getLatitude(), o.getLongitude(), o.getGrauUrgencia()))
                .toList();
    }

    private static boolean concluida(OcorrenciaEntity ocorrencia) {
        return ocorrencia.getOcorrenciaStatus() == OcorrenciaStatus.CONCLUIDO;
    }

    // Ex: 3 de 4 -> 75.0. Com zero ocorrências devolve 0, em vez de dividir por zero.
    static double porcentagem(long parte, long total) {
        if (total == 0) {
            return 0.0;
        }
        return Math.round(parte * 1000.0 / total) / 10.0;
    }
}

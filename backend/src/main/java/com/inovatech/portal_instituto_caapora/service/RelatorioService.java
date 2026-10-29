package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.CategoriaAnimal;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.GrauUrgencia;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.HistoricoOcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.repository.HistoricoOcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.database.repository.OcorrenciaRepository;
import com.inovatech.portal_instituto_caapora.dto.response.ContagemResponseDTO;
import com.inovatech.portal_instituto_caapora.dto.response.RelatorioResponseDTO;
import com.inovatech.portal_instituto_caapora.exception.RegraNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

// Relatórios gerenciais para o coordenador e para a prestação de contas
// ao IBAMA/INEMA (US 7.4.3, RF15). Filtros null = sem filtro.
@Service
@RequiredArgsConstructor
public class RelatorioService {

    private final OcorrenciaRepository ocorrenciaRepository;
    private final HistoricoOcorrenciaRepository historicoRepository;

    @Transactional(readOnly = true)
    public RelatorioResponseDTO gerar(LocalDateTime inicio, LocalDateTime fim, Long equipeId) {
        if (inicio != null && fim != null && inicio.isAfter(fim)) {
            throw new RegraNegocioException("A data inicial não pode ser depois da data final");
        }

        List<OcorrenciaEntity> ocorrencias = ocorrenciaRepository.findAll().stream()
                .filter(o -> inicio == null || !o.getDataHoraRegistro().isBefore(inicio))
                .filter(o -> fim == null || !o.getDataHoraRegistro().isAfter(fim))
                .filter(o -> equipeId == null
                        || (o.getEquipe() != null && equipeId.equals(o.getEquipe().getId())))
                .toList();

        long total = ocorrencias.size();
        long concluidas = ocorrencias.stream()
                .filter(o -> o.getOcorrenciaStatus() == OcorrenciaStatus.CONCLUIDO)
                .count();

        // Período sem ocorrências devolve tudo zerado, e não erro (US 7.4.3, cenário 1)
        return new RelatorioResponseDTO(
                inicio,
                fim,
                total,
                concluidas,
                DashboardService.porcentagem(concluidas, total),
                tempoMedioResposta(ocorrencias),
                tempoMedioConclusao(ocorrencias),
                ContagemResponseDTO.porEnum(ocorrencias, OcorrenciaStatus.class,
                        OcorrenciaEntity::getOcorrenciaStatus),
                ContagemResponseDTO.porEnum(ocorrencias, GrauUrgencia.class,
                        OcorrenciaEntity::getGrauUrgencia),
                ContagemResponseDTO.porEnum(ocorrencias, CategoriaAnimal.class,
                        o -> o.getAnimal() != null ? o.getAnimal().getCategoriaAnimal() : null),
                ContagemResponseDTO.porTexto(ocorrencias,
                        o -> o.getEquipe() != null ? o.getEquipe().getNome() : null)
        );
    }

    // Tempo de resposta: do registro até a central mexer na ocorrência pela primeira vez
    // (a primeira etapa da linha do tempo depois de REGISTRADA)
    private Double tempoMedioResposta(List<OcorrenciaEntity> ocorrencias) {
        return media(ocorrencias.stream()
                .map(o -> minutosAte(o, primeiraEtapaApos(o, OcorrenciaStatus.REGISTRADA)))
                .toList());
    }

    // Tempo total: do registro até a ocorrência ser concluída
    private Double tempoMedioConclusao(List<OcorrenciaEntity> ocorrencias) {
        return media(ocorrencias.stream()
                .map(o -> minutosAte(o, etapa(o, OcorrenciaStatus.CONCLUIDO)))
                .toList());
    }

    private Optional<HistoricoOcorrenciaEntity> primeiraEtapaApos(OcorrenciaEntity o, OcorrenciaStatus status) {
        return linhaDoTempo(o).stream()
                .filter(h -> h.getStatusMovimentacao() != status)
                .findFirst();
    }

    private Optional<HistoricoOcorrenciaEntity> etapa(OcorrenciaEntity o, OcorrenciaStatus status) {
        return linhaDoTempo(o).stream()
                .filter(h -> h.getStatusMovimentacao() == status)
                .findFirst();
    }

    private List<HistoricoOcorrenciaEntity> linhaDoTempo(OcorrenciaEntity o) {
        return historicoRepository.findByOcorrenciaIdOrderByDataHoraAsc(o.getId());
    }

    private static Long minutosAte(OcorrenciaEntity o, Optional<HistoricoOcorrenciaEntity> etapa) {
        return etapa
                .map(h -> Duration.between(o.getDataHoraRegistro(), h.getDataHora()).toMinutes())
                .orElse(null);
    }

    // Média ignorando as ocorrências que ainda não chegaram na etapa; null se nenhuma chegou
    private static Double media(List<Long> minutos) {
        List<Long> validos = minutos.stream().filter(Objects::nonNull).toList();
        if (validos.isEmpty()) {
            return null;
        }
        double media = validos.stream().mapToLong(Long::longValue).average().orElse(0);
        return Math.round(media * 10) / 10.0;
    }
}

package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.CategoriaAnimal;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.OcorrenciaStatus;
import com.inovatech.portal_instituto_caapora.database.models.AnimalEntity;
import com.inovatech.portal_instituto_caapora.database.models.HistoricoOcorrenciaEntity;
import com.inovatech.portal_instituto_caapora.database.models.OcorrenciaEntity;

import java.time.LocalDateTime;
import java.util.List;

// Visão pública da consulta por protocolo (RF04).
// Não expõe dados do comunicante nem nomes de funcionários (LGPD).
// O local sai sem números (sem o número da casa), porque o protocolo pode ser adivinhado.
public record RastreioOcorrenciaResponseDTO(
        String protocolo,
        LocalDateTime dataHoraRegistro,
        OcorrenciaStatus ocorrenciaStatus,
        CategoriaAnimal categoriaAnimal,
        String especie,
        String local,
        boolean localPorGps,
        String equipe,
        List<Etapa> linhaDoTempo
) {
    public record Etapa(OcorrenciaStatus status, LocalDateTime dataHora) {
    }

    public static RastreioOcorrenciaResponseDTO fromEntity(OcorrenciaEntity ocorrencia,
                                                           List<HistoricoOcorrenciaEntity> historico) {
        List<Etapa> etapas = historico.stream()
                .map(h -> new Etapa(h.getStatusMovimentacao(), h.getDataHora()))
                .toList();
        AnimalEntity animal = ocorrencia.getAnimal();
        String local = localSemNumero(ocorrencia.getEndereco());
        return new RastreioOcorrenciaResponseDTO(
                ocorrencia.getProtocolo(),
                ocorrencia.getDataHoraRegistro(),
                ocorrencia.getOcorrenciaStatus(),
                animal != null ? animal.getCategoriaAnimal() : null,
                animal != null ? animal.getEspecie() : null,
                local,
                local == null && ocorrencia.getLatitude() != null,
                ocorrencia.getEquipe() != null ? ocorrencia.getEquipe().getNome() : null,
                etapas
        );
    }

    // "Av. Paralela, 3200, Imbuí - Salvador" -> "Av. Paralela, Imbuí - Salvador"
    static String localSemNumero(String endereco) {
        if (endereco == null) return null;
        String limpo = endereco
                .replaceAll("(?i)\\b(n[º°o]?\\.?\\s*)?\\d+[a-z]?\\b", "") // números e "nº 12"
                .replaceAll("[\\-–]\\s*(?=[\\-–,]|$)", "")                // hífens soltos (ex.: CEP)
                .replaceAll("\\s*,\\s*(,\\s*)+", ", ")                   // vírgulas que sobraram
                .replaceAll("\\s*,\\s*([\\-–])", " $1")
                .replaceAll("\\s{2,}", " ")
                .replaceAll("^[\\s,\\-–]+|[\\s,\\-–]+$", "")
                .trim();
        return limpo.isEmpty() ? null : limpo;
    }
}

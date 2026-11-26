package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.ReportanteEntity;

public record ReportanteResponseDTO(
        Long id,
        String nome,
        String telefone,
        Boolean anonimo
) {
    public static ReportanteResponseDTO fromEntity(ReportanteEntity reportante) {
        if (reportante == null) return null;
        boolean isAnonimo = Boolean.TRUE.equals(reportante.getAnonimo());
        return new ReportanteResponseDTO(
                reportante.getId(),
                isAnonimo ? null : reportante.getNome(),
                isAnonimo ? null : reportante.getTelefone(),
                isAnonimo
        );
    }
}

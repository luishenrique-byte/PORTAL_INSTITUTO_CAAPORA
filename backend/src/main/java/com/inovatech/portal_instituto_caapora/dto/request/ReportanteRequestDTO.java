package com.inovatech.portal_instituto_caapora.dto.request;

import com.inovatech.portal_instituto_caapora.database.models.ReportanteEntity;

public record ReportanteRequestDTO(
        String nome,
        String telefone,
        Boolean anonimo
) {
    public ReportanteEntity toEntity() {
        boolean isAnonimo = Boolean.TRUE.equals(anonimo);
        // Se o comunicante pediu anonimato, os dados pessoais não são guardados (LGPD)
        return ReportanteEntity.builder()
                .nome(isAnonimo ? null : nome)
                .telefone(isAnonimo ? null : telefone)
                .anonimo(isAnonimo)
                .build();
    }
}

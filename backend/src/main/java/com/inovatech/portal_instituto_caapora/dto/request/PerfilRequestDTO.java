package com.inovatech.portal_instituto_caapora.dto.request;

import com.inovatech.portal_instituto_caapora.database.models.PerfilEntity;
import jakarta.validation.constraints.NotBlank;

public record PerfilRequestDTO(
        @NotBlank String perfil
) {
    public PerfilEntity toEntity() {
        return PerfilEntity.builder()
                .perfil(perfil)
                .build();
    }
}

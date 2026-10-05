package com.inovatech.portal_instituto_caapora.dto.request;

import com.inovatech.portal_instituto_caapora.database.models.AnimalEntity;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.CategoriaAnimal;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.SaudeStatus;
import jakarta.validation.constraints.NotNull;

public record AnimalRequestDTO(
        String especie,
        @NotNull CategoriaAnimal categoriaAnimal,
        @NotNull SaudeStatus saudeStatus
) {
    public AnimalEntity toEntity() {
        return AnimalEntity.builder()
                .especie(especie)
                .categoriaAnimal(categoriaAnimal)
                .saudeStatus(saudeStatus)
                .build();
    }
}

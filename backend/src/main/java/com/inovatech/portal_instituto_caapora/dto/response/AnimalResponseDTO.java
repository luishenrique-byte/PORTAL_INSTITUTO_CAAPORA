package com.inovatech.portal_instituto_caapora.dto.response;

import com.inovatech.portal_instituto_caapora.database.models.AnimalEntity;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.CategoriaAnimal;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.SaudeStatus;

public record AnimalResponseDTO(
        Long id,
        String especie,
        CategoriaAnimal categoriaAnimal,
        SaudeStatus saudeStatus
) {
    public static AnimalResponseDTO fromEntity(AnimalEntity animal) {
        if (animal == null) return null;
        return new AnimalResponseDTO(
                animal.getId(),
                animal.getEspecie(),
                animal.getCategoriaAnimal(),
                animal.getSaudeStatus()
        );
    }
}

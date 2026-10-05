package com.inovatech.portal_instituto_caapora.dto.request;

import jakarta.validation.constraints.NotBlank;

// O status não vem do cliente: toda equipe nova começa DISPONIVEL (US 7.4.2)
public record EquipeRequestDTO(
        @NotBlank String nome
) {
}

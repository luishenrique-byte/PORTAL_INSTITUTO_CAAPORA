package com.inovatech.portal_instituto_caapora.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FuncionarioRequestDTO(
        @NotBlank String nome,
        @NotBlank @Email String email,
        @NotNull Long perfilId,
        Long equipeId
) {
}

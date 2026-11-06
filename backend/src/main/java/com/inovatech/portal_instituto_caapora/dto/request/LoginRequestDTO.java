package com.inovatech.portal_instituto_caapora.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginRequestDTO (
        @NotBlank String email,
        @NotBlank String senha
){}

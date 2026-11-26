package com.inovatech.portal_instituto_caapora.dto.request;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.TipoMidia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// O arquivo em si é guardado fora do banco (pasta do servidor ou nuvem);
// aqui chega só o endereço (url) onde ele ficou salvo e o tipo do arquivo.
public record MidiaRequestDTO(
        @NotBlank String url,
        @NotNull TipoMidia tipoMidia
) {
}

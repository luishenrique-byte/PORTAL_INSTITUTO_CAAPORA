package com.inovatech.portal_instituto_caapora.dto.response;

// Os números grandes do topo do Dashboard (Tela 3 do protótipo)
public record DashboardResumoResponseDTO(
        long totalOcorrencias,
        long emAberto,
        long urgenciasCriticas,
        long concluidas,
        double taxaConclusao
) {
}

package com.inovatech.portal_instituto_caapora.database.models.ENUM;

import java.util.Set;

public enum OcorrenciaStatus {
    REGISTRADA,
    TRIAGEM,
    ATENDIMENTO,
    RESGATE,
    CONCLUIDO,
    CANCELADO;

    // Status em que o atendimento terminou: a ocorrência não ocupa mais a equipe
    public static final Set<OcorrenciaStatus> FINAIS = Set.of(CONCLUIDO, CANCELADO);

    public boolean isFinal() {
        return FINAIS.contains(this);
    }
}

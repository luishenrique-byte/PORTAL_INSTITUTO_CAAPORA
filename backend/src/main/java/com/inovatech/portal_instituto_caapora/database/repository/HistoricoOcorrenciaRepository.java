package com.inovatech.portal_instituto_caapora.database.repository;

import com.inovatech.portal_instituto_caapora.database.models.HistoricoOcorrenciaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoricoOcorrenciaRepository extends JpaRepository<HistoricoOcorrenciaEntity, Long> {

    // Linha do tempo da ocorrência em ordem cronológica (US 7.4.4)
    List<HistoricoOcorrenciaEntity> findByOcorrenciaIdOrderByDataHoraAsc(Long ocorrenciaId);
}

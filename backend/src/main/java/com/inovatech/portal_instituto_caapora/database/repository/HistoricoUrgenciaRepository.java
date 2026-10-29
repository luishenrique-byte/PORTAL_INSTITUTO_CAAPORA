package com.inovatech.portal_instituto_caapora.database.repository;

import com.inovatech.portal_instituto_caapora.database.models.HistoricoUrgenciaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoricoUrgenciaRepository extends JpaRepository<HistoricoUrgenciaEntity, Long> {

    // Reclassificações de urgência da ocorrência em ordem cronológica (US 7.2.2)
    List<HistoricoUrgenciaEntity> findByOcorrenciaIdOrderByDataHoraAsc(Long ocorrenciaId);
}

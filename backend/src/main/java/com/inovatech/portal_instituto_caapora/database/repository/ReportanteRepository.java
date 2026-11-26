package com.inovatech.portal_instituto_caapora.database.repository;

import com.inovatech.portal_instituto_caapora.database.models.ReportanteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportanteRepository extends JpaRepository<ReportanteEntity, Long> {
}

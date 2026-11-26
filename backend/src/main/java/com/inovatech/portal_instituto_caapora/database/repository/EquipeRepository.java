package com.inovatech.portal_instituto_caapora.database.repository;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.EquipeStatus;
import com.inovatech.portal_instituto_caapora.database.models.EquipeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipeRepository extends JpaRepository<EquipeEntity, Long> {

    // Só equipes disponíveis podem receber uma ocorrência (US 7.2.3)
    List<EquipeEntity> findByStatus(EquipeStatus status);
}

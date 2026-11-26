package com.inovatech.portal_instituto_caapora.database.repository;

import com.inovatech.portal_instituto_caapora.database.models.AnimalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnimalRepository extends JpaRepository<AnimalEntity, Long> {
}

package com.inovatech.portal_instituto_caapora.database.repository;

import com.inovatech.portal_instituto_caapora.database.models.FuncionarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FuncionarioRepository extends JpaRepository<FuncionarioEntity, Long> {

    // Usado no login (RF05)
    Optional<FuncionarioEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    List<FuncionarioEntity> findByAtivoTrue();

    List<FuncionarioEntity> findByEquipeId(Long equipeId);
}

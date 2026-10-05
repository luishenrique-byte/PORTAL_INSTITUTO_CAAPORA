package com.inovatech.portal_instituto_caapora.database.models;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.EquipeStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.Set;

@Entity
@Table(name = "equipe")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class EquipeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, name = "nome_equipe")
    private String nome;

    @Column(nullable = false, name = "status")
    private EquipeStatus status;

    @OneToMany(mappedBy = "equipe")
    private Set<FuncionarioEntity> funcionarios;

    @OneToMany(mappedBy = "equipe")
    private Set<OcorrenciaEntity> ocorrencias;
}

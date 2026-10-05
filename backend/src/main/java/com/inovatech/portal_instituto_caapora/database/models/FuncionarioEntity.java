package com.inovatech.portal_instituto_caapora.database.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "funcionario")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class FuncionarioEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String email;

    @ManyToOne
    @JoinColumn(nullable = false, name = "id_perfil")
    private PerfilEntity perfil;

    @ManyToOne
    @JoinColumn(name = "id_equipe")
    private EquipeEntity equipe;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean ativo = true;
}

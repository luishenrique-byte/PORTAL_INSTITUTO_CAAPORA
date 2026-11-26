package com.inovatech.portal_instituto_caapora.database.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reportante")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class ReportanteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true, name = "nome")
    private String nome;

    @Column(nullable = true, name = "telefone")
    private String telefone;

    @Column(name = "anonimo")
    private Boolean anonimo;
}

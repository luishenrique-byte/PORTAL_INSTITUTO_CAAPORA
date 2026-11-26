package com.inovatech.portal_instituto_caapora.database.models;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.CategoriaAnimal;
import com.inovatech.portal_instituto_caapora.database.models.ENUM.SaudeStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.stereotype.Component;

@Entity
@Table(name = "animal")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class AnimalEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "especie")
    private String especie;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "categoria")
    private CategoriaAnimal categoriaAnimal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "estado_saude")
    private SaudeStatus saudeStatus;
}

package com.inovatech.portal_instituto_caapora.config;

import com.inovatech.portal_instituto_caapora.dto.request.FuncionarioRequestDTO;
import com.inovatech.portal_instituto_caapora.service.FuncionarioService;
import com.inovatech.portal_instituto_caapora.service.PerfilService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

// Roda a cada subida da API: garante os perfis de acesso e o coordenador inicial.
// Tem que ser idempotente, porque com DDL_AUTO=update o banco mantém os dados entre reinícios.
@Slf4j
@Component
@RequiredArgsConstructor
public class InicializacaoBanco implements CommandLineRunner {

    private final FuncionarioService funcionarioService;
    private final PerfilService perfilService;

    @Value("${app.bootstrap.admin.nome}")
    private String nomeAdmin;

    @Value("${app.bootstrap.admin.email}")
    private String emailAdmin;

    @Value("${app.bootstrap.admin.senha}")
    private String senhaAdmin;

    @Override
    public void run(String... args) {
        Long idCoordenador = perfilService.garantir("COORDENADOR").id();
        perfilService.garantir("ATENDENTE");
        perfilService.garantir("EQUIPE_CAMPO");

        if (funcionarioService.existsByEmail(emailAdmin)) {
            return;
        }

        // Sem senha definida não criamos o admin: melhor subir sem ele do que com uma senha padrão conhecida
        if (senhaAdmin == null || senhaAdmin.isBlank()) {
            log.warn("BOOTSTRAP_ADMIN_PASSWORD não definida: coordenador inicial ({}) não foi criado.", emailAdmin);
            return;
        }

        funcionarioService.criar(new FuncionarioRequestDTO(
                nomeAdmin,
                emailAdmin,
                senhaAdmin,
                idCoordenador,
                null
        ));
        log.info("Coordenador inicial criado: {}", emailAdmin);
    }
}

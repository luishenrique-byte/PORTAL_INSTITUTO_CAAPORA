package com.inovatech.portal_instituto_caapora.config;

import com.inovatech.portal_instituto_caapora.service.ArmazenamentoArquivoService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Serve os arquivos enviados em GET /uploads/<nome>, direto da pasta de uploads.
@Configuration
@RequiredArgsConstructor
public class UploadsWebConfig implements WebMvcConfigurer {

    private final ArmazenamentoArquivoService armazenamento;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String local = armazenamento.getPasta().toUri().toString();
        registry.addResourceHandler(ArmazenamentoArquivoService.PREFIXO_URL + "**")
                .addResourceLocations(local.endsWith("/") ? local : local + "/");
    }
}

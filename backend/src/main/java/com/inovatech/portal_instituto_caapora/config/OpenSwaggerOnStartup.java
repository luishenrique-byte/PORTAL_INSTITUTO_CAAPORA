package com.inovatech.portal_instituto_caapora.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.io.File;

@Component
public class OpenSwaggerOnStartup {

    @Value("${server.port:8080}")
    private String serverPort;

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @EventListener(ApplicationReadyEvent.class)
    public void openSwagger() {
        // Se estiver rodando em um servidor sem tela (como Docker/VPS), cancela silenciosamente
        if (new File("/.dockerenv").exists()) {
            return;
        }

        String url = "http://localhost:" + serverPort + contextPath + "/swagger-ui/index.html";
        String os = System.getProperty("os.name").toLowerCase();
        Runtime rt = Runtime.getRuntime();

        try {
            if (os.contains("win")) {
                rt.exec("rundll32 url.dll,FileProtocolHandler " + url);
            } else if (os.contains("mac")) {
                rt.exec("open " + url);
            } else if (os.contains("nix") || os.contains("nux")) {
                rt.exec("xdg-open " + url);
            }
        } catch (Exception ignored) {
            // Se falhar (ex: VPS sem Docker, mas sem interface), morre silenciosamente
        }
    }
}
package com.inovatech.portal_instituto_caapora.utils;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

// Gera o número de protocolo que o cidadão usa para acompanhar a ocorrência (RF04).
// Formato: CAA-AAMMDD-NNNNN  (ex: CAA-260922-17852)
@Component
public class GeradorProtocolo {

    private static final DateTimeFormatter FORMATO_DATA = DateTimeFormatter.ofPattern("yyMMdd");
    private final SecureRandom random = new SecureRandom();

    public String gerar() {
        String data = LocalDate.now().format(FORMATO_DATA);
        int numero = random.nextInt(100_000);
        return String.format("CAA-%s-%05d", data, numero);
    }
}

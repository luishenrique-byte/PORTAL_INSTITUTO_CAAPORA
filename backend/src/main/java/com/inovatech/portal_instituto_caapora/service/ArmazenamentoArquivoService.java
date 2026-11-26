package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.TipoMidia;
import com.inovatech.portal_instituto_caapora.exception.RegraNegocioException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

// Guarda os arquivos enviados (fotos e vídeos) numa pasta do servidor.
// O banco guarda só a url pública: /uploads/<nome-gerado>.
// O nome é sempre gerado aqui (UUID), nunca o nome que veio do cliente.
@Service
public class ArmazenamentoArquivoService {

    public static final String PREFIXO_URL = "/uploads/";

    // Tipos aceitos -> extensão usada no arquivo salvo
    private static final Map<String, String> EXTENSOES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/heic", ".heic",
            "video/mp4", ".mp4",
            "video/quicktime", ".mov",
            "video/webm", ".webm"
    );

    private final Path pasta;

    public ArmazenamentoArquivoService(@Value("${app.uploads.dir:uploads}") String pasta) {
        this.pasta = Path.of(pasta).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.pasta);
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível criar a pasta de uploads: " + this.pasta, e);
        }
    }

    public Path getPasta() {
        return pasta;
    }

    // Retorna o tipo de mídia do arquivo ou lança erro se o formato não é aceito
    public TipoMidia identificarTipo(MultipartFile arquivo) {
        String contentType = tipoDeConteudo(arquivo);
        if (!EXTENSOES.containsKey(contentType)) {
            throw new RegraNegocioException("Formato de arquivo não aceito. Envie foto (JPG, PNG, WEBP, HEIC) ou vídeo (MP4, MOV, WEBM)");
        }
        return contentType.startsWith("video/") ? TipoMidia.VIDEO : TipoMidia.FOTO;
    }

    // Salva o arquivo e devolve a url pública (ex: /uploads/3f2c...jpg)
    public String salvar(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new RegraNegocioException("Arquivo vazio");
        }
        identificarTipo(arquivo);
        String nome = UUID.randomUUID() + EXTENSOES.get(tipoDeConteudo(arquivo));
        Path destino = pasta.resolve(nome);
        try (InputStream entrada = arquivo.getInputStream()) {
            Files.copy(entrada, destino);
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao salvar o arquivo", e);
        }
        return PREFIXO_URL + nome;
    }

    // Apaga o arquivo de uma url gerada por este serviço. Urls externas são ignoradas.
    public void apagar(String url) {
        if (url == null || !url.startsWith(PREFIXO_URL)) {
            return;
        }
        Path alvo = pasta.resolve(url.substring(PREFIXO_URL.length())).normalize();
        if (!alvo.getParent().equals(pasta)) {
            return; // nunca apaga nada fora da pasta de uploads
        }
        try {
            Files.deleteIfExists(alvo);
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao apagar o arquivo", e);
        }
    }

    private String tipoDeConteudo(MultipartFile arquivo) {
        String contentType = arquivo.getContentType();
        return contentType == null ? "" : contentType.toLowerCase();
    }
}

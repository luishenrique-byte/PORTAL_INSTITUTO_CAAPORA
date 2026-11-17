package com.inovatech.portal_instituto_caapora.service;

import com.inovatech.portal_instituto_caapora.database.models.ENUM.TipoMidia;
import com.inovatech.portal_instituto_caapora.exception.RegraNegocioException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class ArmazenamentoArquivoServiceTest {

    @TempDir Path pasta;
    ArmazenamentoArquivoService service;

    @BeforeEach
    void setUp() {
        service = new ArmazenamentoArquivoService(pasta.toString());
    }

    @Test
    void salvaFotoComNomeGeradoEExtensaoDoTipo() throws Exception {
        String url = service.salvar(arquivo("../../evil.html", "image/jpeg", "conteudo"));

        assertTrue(url.startsWith("/uploads/"));
        assertTrue(url.endsWith(".jpg"));
        assertFalse(url.contains("evil"));
        Path salvo = pasta.resolve(url.substring("/uploads/".length()));
        assertEquals("conteudo", Files.readString(salvo));
    }

    @Test
    void identificaVideo() {
        assertEquals(TipoMidia.VIDEO, service.identificarTipo(arquivo("v.mp4", "video/mp4", "x")));
        assertEquals(TipoMidia.FOTO, service.identificarTipo(arquivo("f.png", "image/png", "x")));
    }

    @Test
    void recusaTipoNaoAceito() {
        assertThrows(RegraNegocioException.class,
                () -> service.salvar(arquivo("p.html", "text/html", "<script>")));
        assertThrows(RegraNegocioException.class,
                () -> service.salvar(arquivo("semtipo", null, "x")));
    }

    @Test
    void recusaArquivoVazio() {
        assertThrows(RegraNegocioException.class,
                () -> service.salvar(arquivo("f.jpg", "image/jpeg", "")));
    }

    @Test
    void apagaArquivoSalvo() {
        String url = service.salvar(arquivo("f.jpg", "image/jpeg", "x"));
        service.apagar(url);
        assertFalse(Files.exists(pasta.resolve(url.substring("/uploads/".length()))));
    }

    @Test
    void naoApagaForaDaPasta() throws Exception {
        Path fora = Files.writeString(pasta.getParent().resolve("fora-" + System.nanoTime() + ".txt"), "x");
        try {
            service.apagar("/uploads/../" + fora.getFileName());
            assertTrue(Files.exists(fora));
        } finally {
            Files.deleteIfExists(fora);
        }
    }

    private MockMultipartFile arquivo(String nome, String tipo, String conteudo) {
        return new MockMultipartFile("arquivo", nome, tipo, conteudo.getBytes());
    }
}

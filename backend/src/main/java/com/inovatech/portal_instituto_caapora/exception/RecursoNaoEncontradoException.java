package com.inovatech.portal_instituto_caapora.exception;

// Lançada quando algo procurado no banco não existe (ex: ocorrência com id inexistente).
// O handler pode transformar esta exceção em resposta HTTP 404.
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}

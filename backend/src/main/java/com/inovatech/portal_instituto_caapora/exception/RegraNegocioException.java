package com.inovatech.portal_instituto_caapora.exception;

// Lançada quando uma regra de negócio é violada (ex: atribuir uma equipe OCUPADA).
// O handler pode transformar esta exceção em resposta HTTP 400/422.
public class RegraNegocioException extends RuntimeException {

    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}

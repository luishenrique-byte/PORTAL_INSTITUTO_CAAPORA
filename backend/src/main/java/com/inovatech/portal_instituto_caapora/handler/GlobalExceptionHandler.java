package com.inovatech.portal_instituto_caapora.handler;

import com.inovatech.portal_instituto_caapora.exception.RecursoNaoEncontradoException;
import com.inovatech.portal_instituto_caapora.exception.RegraNegocioException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.Map;

// Os services lançam exceções próprias. Esta classe transforma cada uma
// em uma resposta HTTP com uma mensagem em JSON, ex: { "erro": "Equipe não encontrada: 9" }
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Algo que não existe no banco -> 404
    @ExceptionHandler(RecursoNaoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> tratarNaoEncontrado(RecursoNaoEncontradoException e) {
        return Map.of("erro", e.getMessage());
    }

    // Regra de negócio violada (ex: equipe ocupada) -> 400
    @ExceptionHandler(RegraNegocioException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> tratarRegraNegocio(RegraNegocioException e) {
        return Map.of("erro", e.getMessage());
    }

    // Campo obrigatório faltando no JSON (@NotNull, @NotBlank dos DTOs) -> 400
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> tratarValidacao(MethodArgumentNotValidException e) {
        // Monta algo como { "nome": "must not be blank" }
        Map<String, String> erros = new java.util.LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(erro -> erros.put(erro.getField(), String.valueOf(erro.getDefaultMessage())));
        return erros;
    }

    // JSON mal formado ou valor de enum inválido no corpo (ex: "status": "XYZ") -> 400
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> tratarJsonInvalido(HttpMessageNotReadableException e) {
        return Map.of("erro", "Corpo da requisição inválido");
    }

    // Parâmetro da URL com tipo errado (ex: ?urgencia=XYZ ou /ocorrencias/abc) -> 400
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> tratarTipoInvalido(MethodArgumentTypeMismatchException e) {
        return Map.of("erro", "Valor inválido para o parâmetro '" + e.getName() + "'");
    }

    // Violação de restrição do banco (ex.: protocolo repetido gerado ao mesmo tempo
    // por duas requisições). A transação é desfeita; o cliente pode reenviar -> 409
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> tratarConflito(DataIntegrityViolationException e) {
        return Map.of("erro", "Não foi possível salvar agora. Tente novamente.");
    }

    // Arquivo maior que o limite de spring.servlet.multipart.max-file-size -> 413
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.CONTENT_TOO_LARGE)
    public Map<String, String> tratarArquivoGrande(MaxUploadSizeExceededException e) {
        return Map.of("erro", "Arquivo maior que o limite permitido");
    }

    // Upload sem o campo "arquivo" -> 400
    @ExceptionHandler(MissingServletRequestPartException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> tratarArquivoAusente(MissingServletRequestPartException e) {
        return Map.of("erro", "Campo '" + e.getRequestPartName() + "' é obrigatório");
    }
}

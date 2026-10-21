package com.inovatech.portal_instituto_caapora.dto.response;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

// Um item de gráfico: um rótulo e quantas ocorrências se encaixam nele
// (ex: "AVE" -> 12, "CONCLUIDO" -> 30, "2026-10" -> 7).
public record ContagemResponseDTO(
        String rotulo,
        long quantidade
) {
    // Conta os itens por um campo ENUM. Todos os valores do ENUM aparecem,
    // mesmo os que têm zero, para o gráfico do front-end ficar sempre completo.
    public static <T, E extends Enum<E>> List<ContagemResponseDTO> porEnum(Collection<T> itens,
                                                                          Class<E> tipo,
                                                                          Function<T, E> campo) {
        return Arrays.stream(tipo.getEnumConstants())
                .map(valor -> new ContagemResponseDTO(
                        valor.name(),
                        itens.stream().filter(item -> campo.apply(item) == valor).count()))
                .toList();
    }

    // Conta os itens por um texto qualquer (ex: nome da equipe). Itens sem valor são ignorados.
    public static <T> List<ContagemResponseDTO> porTexto(Collection<T> itens, Function<T, String> campo) {
        return itens.stream()
                .map(campo)
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .map(rotulo -> new ContagemResponseDTO(
                        rotulo,
                        itens.stream().filter(item -> rotulo.equals(campo.apply(item))).count()))
                .toList();
    }
}

package com.redsocial.usuarios;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ActualizarPerfilRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80, message = "El nombre no puede superar los 80 caracteres") String nombre,
        @Size(max = 300, message = "La biograf\u00eda no puede superar los 300 caracteres") String bio) {
}

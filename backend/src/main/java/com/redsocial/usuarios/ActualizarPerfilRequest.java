package com.redsocial.usuarios;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ActualizarPerfilRequest(
        @NotBlank @Size(max = 80) String nombre,
        @Size(max = 300) String bio) {
}

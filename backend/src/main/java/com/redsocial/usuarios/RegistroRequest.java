package com.redsocial.usuarios;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistroRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80, message = "El nombre no puede superar los 80 caracteres") String nombre,
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato v\u00e1lido") String email,
        @NotBlank(message = "La contrase\u00f1a es obligatoria")
        @Size(min = 6, max = 100, message = "La contrase\u00f1a debe tener entre 6 y 100 caracteres") String password) {
}

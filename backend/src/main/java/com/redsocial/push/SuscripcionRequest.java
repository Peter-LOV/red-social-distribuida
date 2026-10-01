package com.redsocial.push;

public record SuscripcionRequest(String endpoint, Keys keys) {
    public record Keys(String p256dh, String auth) {}
}

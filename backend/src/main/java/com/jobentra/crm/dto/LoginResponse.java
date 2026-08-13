package com.jobentra.crm.dto;

public class LoginResponse {

    private String token;
    private String message;
    private long expiresInMs;

    public LoginResponse(String token, String message, long expiresInMs) {
        this.token = token;
        this.message = message;
        this.expiresInMs = expiresInMs;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public long getExpiresInMs() { return expiresInMs; }
    public void setExpiresInMs(long expiresInMs) { this.expiresInMs = expiresInMs; }
}

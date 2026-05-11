package com.jobentra.crm.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AiServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    @Value("${ai.service.api-key}")
    private String apiKey;

    @SuppressWarnings("unchecked")
    public Map<String, Object> generateProfilePdf(Map<String, Object> memberData) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Key", apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(memberData, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                aiServiceUrl + "/generate-pdf",
                request,
                Map.class
        );
        return response.getBody();
    }
}

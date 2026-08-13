package com.jobentra.crm.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
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

    @SuppressWarnings("unchecked")
    public Map<String, Object> extractCv(byte[] fileBytes, String filename, String candidateId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-API-Key", apiKey);

        ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return filename != null ? filename : "cv.pdf";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);
        body.add("candidate_id", candidateId != null ? candidateId : "");

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/extract-cv",
                    request,
                    Map.class
            );
            return response.getBody();
        } catch (RestClientException e) {
            throw new RuntimeException("AI service extraction failed: " + e.getMessage(), e);
        }
    }
}

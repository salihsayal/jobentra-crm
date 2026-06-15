package com.jobentra.crm.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

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
    public Map<String, Object> anonymizeCv(byte[] fileBytes, String filename, UUID candidateId) {
        LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        });
        body.add("candidate_id", candidateId.toString());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-API-Key", apiKey);

        HttpEntity<LinkedMultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                aiServiceUrl + "/anonymize-cv",
                request,
                Map.class
        );
        return response.getBody();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> extractSkills(byte[] fileBytes, String filename) {
        LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        });

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-API-Key", apiKey);

        HttpEntity<LinkedMultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                aiServiceUrl + "/extract-skills",
                request,
                Map.class
        );
        return response.getBody();
    }
}

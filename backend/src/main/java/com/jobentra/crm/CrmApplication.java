package com.jobentra.crm;

import com.jobentra.crm.model.Customer;
import com.jobentra.crm.repository.CustomerRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class CrmApplication {

    public static void main(String[] args) {
        SpringApplication.run(CrmApplication.class, args);
    }

    @Bean
    CommandLineRunner seedData(CustomerRepository repo) {
        return args -> {
            if (repo.count() == 0) {
                repo.save(new Customer(null, "Alice Johnson", "alice@example.com", "Acme Corp", "+1-555-0101"));
                repo.save(new Customer(null, "Bob Smith", "bob@example.com", "Globex Inc", "+1-555-0102"));
                repo.save(new Customer(null, "Carol White", "carol@example.com", "Initech", "+1-555-0103"));
                repo.save(new Customer(null, "David Brown", "david@example.com", "Umbrella Corp", "+1-555-0104"));
                repo.save(new Customer(null, "Emma Davis", "emma@example.com", "Stark Industries", "+1-555-0105"));
            }
        };
    }
}

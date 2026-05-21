package com.jobentra.crm;

import com.jobentra.crm.model.Billing;
import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.Customer;
import com.jobentra.crm.model.Job;
import com.jobentra.crm.model.enums.BillingStatus;
import com.jobentra.crm.model.enums.CandidateStatus;
import com.jobentra.crm.model.enums.CustomerStatus;
import com.jobentra.crm.model.enums.JobStatus;
import com.jobentra.crm.repository.BillingRepository;
import com.jobentra.crm.repository.CandidateRepository;
import com.jobentra.crm.repository.CustomerRepository;
import com.jobentra.crm.repository.JobRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@SpringBootApplication
public class CrmApplication {

    public static void main(String[] args) {
        SpringApplication.run(CrmApplication.class, args);
    }

    @Bean
    CommandLineRunner seedData(CustomerRepository customerRepo,
                               CandidateRepository candidateRepo,
                               JobRepository jobRepo,
                               BillingRepository billingRepo) {
        return args -> {
            if (customerRepo.count() == 0) {
                Customer c1 = new Customer();
                c1.setCompanyName("Acme Corp");
                c1.setContactPerson("John Smith");
                c1.setEmail("john@acme.com");
                c1.setPhone("+1-555-0101");
                c1.setIndustry("Technology");
                c1.setStatus(CustomerStatus.ACTIVE);
                c1 = customerRepo.save(c1);

                Customer c2 = new Customer();
                c2.setCompanyName("Globex Industries");
                c2.setContactPerson("Jane Doe");
                c2.setEmail("jane@globex.com");
                c2.setPhone("+1-555-0102");
                c2.setIndustry("Manufacturing");
                c2.setStatus(CustomerStatus.ACTIVE);
                c2 = customerRepo.save(c2);

                Customer c3 = new Customer();
                c3.setCompanyName("Initech");
                c3.setContactPerson("Bill Lumbergh");
                c3.setEmail("bill@initech.com");
                c3.setIndustry("Finance");
                c3.setStatus(CustomerStatus.LEAD);
                customerRepo.save(c3);

                Candidate ca1 = new Candidate();
                ca1.setFirstName("Alice");
                ca1.setLastName("Johnson");
                ca1.setEmail("alice@example.com");
                ca1.setPhone("+1-555-0201");
                ca1.setStatus(CandidateStatus.IN_PROCESS);
                ca1.setSkills(List.of("Java", "Spring Boot", "PostgreSQL"));
                ca1 = candidateRepo.save(ca1);

                Candidate ca2 = new Candidate();
                ca2.setFirstName("Bob");
                ca2.setLastName("Williams");
                ca2.setEmail("bob@example.com");
                ca2.setPhone("+1-555-0202");
                ca2.setStatus(CandidateStatus.NEW);
                ca2.setSkills(List.of("Python", "FastAPI", "Machine Learning"));
                ca2 = candidateRepo.save(ca2);

                Candidate ca3 = new Candidate();
                ca3.setFirstName("Carol");
                ca3.setLastName("Martinez");
                ca3.setEmail("carol@example.com");
                ca3.setPhone("+1-555-0203");
                ca3.setStatus(CandidateStatus.PLACED);
                ca3.setSkills(List.of("React", "TypeScript", "Node.js"));
                candidateRepo.save(ca3);

                Job j1 = new Job();
                j1.setCustomer(c1);
                j1.setTitle("Senior Backend Developer");
                j1.setDescription("Looking for a senior backend developer with 5+ years of Java experience.");
                j1.setStatus(JobStatus.OPEN);
                j1.setSalaryRange("80,000 - 110,000 EUR");
                j1 = jobRepo.save(j1);

                Job j2 = new Job();
                j2.setCustomer(c1);
                j2.setTitle("DevOps Engineer");
                j2.setDescription("Seeking a DevOps engineer with AWS and Kubernetes experience.");
                j2.setStatus(JobStatus.OPEN);
                j2.setSalaryRange("70,000 - 95,000 EUR");
                j2 = jobRepo.save(j2);

                Job j3 = new Job();
                j3.setCustomer(c2);
                j3.setTitle("Data Scientist");
                j3.setDescription("Data scientist needed for predictive analytics team.");
                j3.setStatus(JobStatus.DRAFT);
                j3.setSalaryRange("75,000 - 100,000 EUR");
                jobRepo.save(j3);

                Billing b1 = new Billing();
                b1.setInvoiceNumber("INV-2025-001");
                b1.setCustomer(c1);
                b1.setCandidate(ca3);
                b1.setJob(j1);
                b1.setAmount(new BigDecimal("15000.00"));
                b1.setCurrency("EUR");
                b1.setStatus(BillingStatus.PAID);
                b1.setDueDate(LocalDate.of(2025, 4, 15));
                billingRepo.save(b1);

                Billing b2 = new Billing();
                b2.setInvoiceNumber("INV-2025-002");
                b2.setCustomer(c2);
                b2.setAmount(new BigDecimal("8500.00"));
                b2.setCurrency("EUR");
                b2.setStatus(BillingStatus.SENT);
                b2.setDueDate(LocalDate.of(2025, 6, 1));
                billingRepo.save(b2);

                Billing b3 = new Billing();
                b3.setInvoiceNumber("INV-2025-003");
                b3.setCustomer(c1);
                b3.setCandidate(ca1);
                b3.setJob(j2);
                b3.setAmount(new BigDecimal("22000.00"));
                b3.setCurrency("EUR");
                b3.setStatus(BillingStatus.DRAFT);
                b3.setDueDate(LocalDate.of(2025, 7, 1));
                billingRepo.save(b3);
            }
        };
    }
}

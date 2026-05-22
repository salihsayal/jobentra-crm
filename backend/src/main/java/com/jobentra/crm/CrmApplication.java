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
                c1.setCompanyName("Mercedes-Benz AG");
                c1.setContactPerson("Dr. Klaus Weber");
                c1.setEmail("k.weber@mercedes.de");
                c1.setPhone("+49 711 170");
                c1.setIndustry("Automotive");
                c1.setStatus(CustomerStatus.ACTIVE);
                c1 = customerRepo.save(c1);

                Customer c2 = new Customer();
                c2.setCompanyName("Siemens Healthineers");
                c2.setContactPerson("Anna M\u00FCller");
                c2.setEmail("a.mueller@siemens.de");
                c2.setPhone("+49 9131 180");
                c2.setIndustry("Healthcare");
                c2.setStatus(CustomerStatus.ACTIVE);
                c2 = customerRepo.save(c2);

                Customer c3 = new Customer();
                c3.setCompanyName("Deutsche Bank");
                c3.setContactPerson("Thomas Schmidt");
                c3.setEmail("t.schmidt@db.com");
                c3.setPhone("+49 69 9100");
                c3.setIndustry("Finance");
                c3.setStatus(CustomerStatus.LEAD);
                c3 = customerRepo.save(c3);

                Customer c4 = new Customer();
                c4.setCompanyName("SAP SE");
                c4.setContactPerson("Laura Fischer");
                c4.setEmail("l.fischer@sap.com");
                c4.setPhone("+49 6227 7474");
                c4.setIndustry("Technology");
                c4.setStatus(CustomerStatus.ACTIVE);
                c4 = customerRepo.save(c4);

                Customer c5 = new Customer();
                c5.setCompanyName("Bosch Rexroth");
                c5.setContactPerson("Martin Schulz");
                c5.setEmail("m.schulz@bosch.de");
                c5.setPhone("+49 9352 180");
                c5.setIndustry("Manufacturing");
                c5.setStatus(CustomerStatus.INACTIVE);
                c5 = customerRepo.save(c5);

                Customer c6 = new Customer();
                c6.setCompanyName("Allianz SE");
                c6.setContactPerson("Petra Wagner");
                c6.setEmail("p.wagner@allianz.de");
                c6.setPhone("+49 89 38000");
                c6.setIndustry("Insurance");
                c6.setStatus(CustomerStatus.LEAD);
                c6 = customerRepo.save(c6);

                Customer c7 = new Customer();
                c7.setCompanyName("Adidas AG");
                c7.setContactPerson("Jan Becker");
                c7.setEmail("j.becker@adidas.com");
                c7.setPhone("+49 9132 840");
                c7.setIndustry("Retail");
                c7.setStatus(CustomerStatus.ACTIVE);
                c7 = customerRepo.save(c7);

                Customer c8 = new Customer();
                c8.setCompanyName("Lufthansa Technik");
                c8.setContactPerson("Sabine Koch");
                c8.setEmail("s.koch@lht.dlh.de");
                c8.setPhone("+49 40 50700");
                c8.setIndustry("Aviation");
                c8.setStatus(CustomerStatus.ACTIVE);
                customerRepo.save(c8);

                Candidate ca1 = new Candidate();
                ca1.setFirstName("Maximilian");
                ca1.setLastName("Hoffmann");
                ca1.setEmail("m.hoffmann@email.de");
                ca1.setPhone("+49 170 1234567");
                ca1.setStatus(CandidateStatus.IN_PROCESS);
                ca1.setSkills("Java, Spring Boot, AWS, Kubernetes");
                ca1.setLocation("48155 M\u00FCnster Hafenstra\u00DFe 42");
                ca1.setMobility(true);
                ca1.setAvailability("Sofort");
                ca1.setJob("Software-Entwickler");
                ca1 = candidateRepo.save(ca1);

                Candidate ca2 = new Candidate();
                ca2.setFirstName("Sophie");
                ca2.setLastName("Bauer");
                ca2.setEmail("s.bauer@email.de");
                ca2.setPhone("+49 151 9876543");
                ca2.setStatus(CandidateStatus.NEW);
                ca2.setSkills("Patientenpflege, Wundversorgung, Dokumentation");
                ca2.setLocation("44137 Dortmund Westenhellweg 15");
                ca2.setMobility(false);
                ca2.setAvailability("2025-07-01");
                ca2.setJob("Krankenschwester");
                ca2 = candidateRepo.save(ca2);

                Candidate ca3 = new Candidate();
                ca3.setFirstName("Lukas");
                ca3.setLastName("Kr\u00FCger");
                ca3.setEmail("l.krueger@email.de");
                ca3.setPhone("+49 173 5551234");
                ca3.setStatus(CandidateStatus.PLACED);
                ca3.setSkills("Elektroinstallation, SPS-Programmierung, Schaltpl\u00E4ne");
                ca3.setLocation("50667 K\u00F6ln Hohe Stra\u00DFe 88");
                ca3.setMobility(true);
                ca3.setAvailability("Sofort");
                ca3.setJob("Elektriker");
                ca3 = candidateRepo.save(ca3);

                Candidate ca4 = new Candidate();
                ca4.setFirstName("Hannah");
                ca4.setLastName("Schneider");
                ca4.setEmail("h.schneider@email.de");
                ca4.setPhone("+49 162 3456789");
                ca4.setStatus(CandidateStatus.IN_PROCESS);
                ca4.setSkills("SAP, Microsoft Office, Buchhaltung");
                ca4.setLocation("20095 Hamburg M\u00F6nckebergstra\u00DFe 7");
                ca4.setMobility(false);
                ca4.setAvailability("2025-08-15");
                ca4.setJob("B\u00FCrokauffrau");
                ca4 = candidateRepo.save(ca4);

                Candidate ca5 = new Candidate();
                ca5.setFirstName("Felix");
                ca5.setLastName("Wagner");
                ca5.setEmail("f.wagner@email.de");
                ca5.setPhone("+49 176 1112233");
                ca5.setStatus(CandidateStatus.REJECTED);
                ca5.setSkills("KFZ-Diagnose, Reparatur, Wartung");
                ca5.setLocation("10115 Berlin Friedrichstra\u00DFe 100");
                ca5.setMobility(true);
                ca5.setAvailability("Sofort");
                ca5.setJob("KFZ-Mechatroniker");
                ca5 = candidateRepo.save(ca5);

                Candidate ca6 = new Candidate();
                ca6.setFirstName("Emma");
                ca6.setLastName("Zimmermann");
                ca6.setEmail("e.zimmermann@email.de");
                ca6.setPhone("+49 157 4445566");
                ca6.setStatus(CandidateStatus.NEW);
                ca6.setSkills("Laboranalyse, Chromatographie, GMP");
                ca6.setLocation("80331 M\u00FCnchen Kaufingerstra\u00DFe 22");
                ca6.setMobility(false);
                ca6.setAvailability("2025-06-01");
                ca6.setJob("Chemikant");
                ca6 = candidateRepo.save(ca6);

                Candidate ca7 = new Candidate();
                ca7.setFirstName("Jonas");
                ca7.setLastName("Sch\u00E4fer");
                ca7.setEmail("j.schaefer@email.de");
                ca7.setPhone("+49 171 7778899");
                ca7.setStatus(CandidateStatus.IN_PROCESS);
                ca7.setSkills("K\u00FCche, Service, Warenwirtschaft");
                ca7.setLocation("70173 Stuttgart K\u00F6nigstra\u00DFe 55");
                ca7.setMobility(true);
                ca7.setAvailability("Sofort");
                ca7.setJob("Koch");
                ca7 = candidateRepo.save(ca7);

                Candidate ca8 = new Candidate();
                ca8.setFirstName("Mia");
                ca8.setLastName("Koch");
                ca8.setEmail("m.koch@email.de");
                ca8.setPhone("+49 179 2223344");
                ca8.setStatus(CandidateStatus.NEW);
                ca8.setSkills("Fr\u00FChp\u00E4dagogik, Elternarbeit, Dokumentation");
                ca8.setLocation("60311 Frankfurt Zeil 12");
                ca8.setMobility(false);
                ca8.setAvailability("2025-09-01");
                ca8.setJob("Erzieherin");
                candidateRepo.save(ca8);

                Job j1 = new Job();
                j1.setCustomer(c1);
                j1.setTitle("Senior Java Entwickler");
                j1.setDescription("Erfahrener Java-Entwickler f\u00FCr Enterprise-Projekte gesucht.");
                j1.setStatus(JobStatus.OPEN);
                j1.setSalaryRange("75.000 - 95.000 EUR");
                j1 = jobRepo.save(j1);

                Job j2 = new Job();
                j2.setCustomer(c2);
                j2.setTitle("Data Scientist");
                j2.setDescription("Data Scientist f\u00FCr unser Health-Data-Analytics Team.");
                j2.setStatus(JobStatus.OPEN);
                j2.setSalaryRange("65.000 - 85.000 EUR");
                j2 = jobRepo.save(j2);

                Job j3 = new Job();
                j3.setCustomer(c4);
                j3.setTitle("Frontend Architect");
                j3.setDescription("Frontend Architect f\u00FCr SAP Cloud Platform.");
                j3.setStatus(JobStatus.DRAFT);
                j3.setSalaryRange("80.000 - 100.000 EUR");
                j3 = jobRepo.save(j3);

                Job j4 = new Job();
                j4.setCustomer(c7);
                j4.setTitle("DevOps Engineer");
                j4.setDescription("DevOps Engineer f\u00FCr E-Commerce Infrastruktur.");
                j4.setStatus(JobStatus.OPEN);
                j4.setSalaryRange("70.000 - 90.000 EUR");
                j4 = jobRepo.save(j4);

                Job j5 = new Job();
                j5.setCustomer(c5);
                j5.setTitle("Embedded Systems Engineer");
                j5.setDescription("Embedded Entwickler f\u00FCr Automotive-Steuerger\u00E4te.");
                j5.setStatus(JobStatus.CLOSED);
                j5.setSalaryRange("68.000 - 88.000 EUR");
                j5 = jobRepo.save(j5);

                Job j6 = new Job();
                j6.setCustomer(c3);
                j6.setTitle("Cloud Architect");
                j6.setDescription("Cloud Architect f\u00FCr die Migration unserer Banking-Plattform.");
                j6.setStatus(JobStatus.OPEN);
                j6.setSalaryRange("90.000 - 120.000 EUR");
                j6 = jobRepo.save(j6);

                Job j7 = new Job();
                j7.setCustomer(c6);
                j7.setTitle("SAP Berater");
                j7.setDescription("SAP-Berater f\u00FCr Versicherungsprozesse.");
                j7.setStatus(JobStatus.DRAFT);
                j7.setSalaryRange("60.000 - 80.000 EUR");
                j7 = jobRepo.save(j7);

                Job j8 = new Job();
                j8.setCustomer(c8);
                j8.setTitle("Full-Stack Developer");
                j8.setDescription("Full-Stack Developer f\u00FCr Wartungssoftware.");
                j8.setStatus(JobStatus.OPEN);
                j8.setSalaryRange("65.000 - 85.000 EUR");
                jobRepo.save(j8);

                Billing b1 = new Billing();
                b1.setInvoiceNumber("INV-2025-0042");
                b1.setCustomer(c1);
                b1.setCandidate(ca1);
                b1.setJob(j1);
                b1.setAmount(new BigDecimal("15000.00"));
                b1.setCurrency("EUR");
                b1.setStatus(BillingStatus.PAID);
                b1.setDueDate(LocalDate.of(2025, 3, 15));
                billingRepo.save(b1);

                Billing b2 = new Billing();
                b2.setInvoiceNumber("INV-2025-0043");
                b2.setCustomer(c2);
                b2.setCandidate(ca3);
                b2.setJob(j2);
                b2.setAmount(new BigDecimal("22500.00"));
                b2.setCurrency("EUR");
                b2.setStatus(BillingStatus.SENT);
                b2.setDueDate(LocalDate.of(2025, 6, 1));
                billingRepo.save(b2);

                Billing b3 = new Billing();
                b3.setInvoiceNumber("INV-2025-0044");
                b3.setCustomer(c7);
                b3.setAmount(new BigDecimal("8500.00"));
                b3.setCurrency("EUR");
                b3.setStatus(BillingStatus.DRAFT);
                billingRepo.save(b3);

                Billing b4 = new Billing();
                b4.setInvoiceNumber("INV-2025-0045");
                b4.setCustomer(c4);
                b4.setCandidate(ca4);
                b4.setJob(j3);
                b4.setAmount(new BigDecimal("30000.00"));
                b4.setCurrency("EUR");
                b4.setStatus(BillingStatus.PAID);
                b4.setDueDate(LocalDate.of(2025, 4, 1));
                billingRepo.save(b4);

                Billing b5 = new Billing();
                b5.setInvoiceNumber("INV-2025-0046");
                b5.setCustomer(c5);
                b5.setJob(j5);
                b5.setAmount(new BigDecimal("12000.00"));
                b5.setCurrency("EUR");
                b5.setStatus(BillingStatus.CANCELLED);
                billingRepo.save(b5);

                Billing b6 = new Billing();
                b6.setInvoiceNumber("INV-2025-0047");
                b6.setCustomer(c8);
                b6.setCandidate(ca2);
                b6.setJob(j8);
                b6.setAmount(new BigDecimal("18000.00"));
                b6.setCurrency("EUR");
                b6.setStatus(BillingStatus.SENT);
                b6.setDueDate(LocalDate.of(2025, 7, 15));
                billingRepo.save(b6);
            }
        };
    }
}

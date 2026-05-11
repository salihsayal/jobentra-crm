package com.jobentra.crm;

import com.jobentra.crm.model.Member;
import com.jobentra.crm.repository.MemberRepository;
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
    CommandLineRunner seedData(MemberRepository repo) {
        return args -> {
            if (repo.count() == 0) {
                Member m1 = new Member();
                m1.setFirstName("Alice"); m1.setLastName("Johnson");
                m1.setEmail("alice@example.com"); m1.setPhone("+1-555-0101");
                m1.setStatus("active"); m1.setNotes("Key account manager");
                repo.save(m1);

                Member m2 = new Member();
                m2.setFirstName("Bob"); m2.setLastName("Smith");
                m2.setEmail("bob@example.com"); m2.setPhone("+1-555-0102");
                m2.setStatus("lead"); m2.setNotes("Inbound from website");
                repo.save(m2);

                Member m3 = new Member();
                m3.setFirstName("Carol"); m3.setLastName("White");
                m3.setEmail("carol@example.com"); m3.setPhone("+1-555-0103");
                m3.setStatus("inactive"); m3.setNotes("");
                repo.save(m3);

                Member m4 = new Member();
                m4.setFirstName("David"); m4.setLastName("Brown");
                m4.setEmail("david@example.com"); m4.setPhone("+1-555-0104");
                m4.setStatus("active"); m4.setNotes("Premium plan");
                repo.save(m4);

                Member m5 = new Member();
                m5.setFirstName("Emma"); m5.setLastName("Davis");
                m5.setEmail("emma@example.com"); m5.setPhone("+1-555-0105");
                m5.setStatus("lead"); m5.setNotes("Referred by Alice");
                repo.save(m5);
            }
        };
    }
}

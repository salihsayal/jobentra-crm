package com.jobentra.crm;

import com.jobentra.crm.model.Activity;
import com.jobentra.crm.model.Member;
import com.jobentra.crm.repository.ActivityRepository;
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
    CommandLineRunner seedData(MemberRepository memberRepo, ActivityRepository activityRepo) {
        return args -> {
            if (memberRepo.count() == 0) {
                Member m1 = new Member();
                m1.setFirstName("Alice"); m1.setLastName("Johnson");
                m1.setEmail("alice@example.com"); m1.setPhone("+1-555-0101");
                m1.setStatus("active"); m1.setNotes("Key account manager");
                m1 = memberRepo.save(m1);

                Member m2 = new Member();
                m2.setFirstName("Bob"); m2.setLastName("Smith");
                m2.setEmail("bob@example.com"); m2.setPhone("+1-555-0102");
                m2.setStatus("lead"); m2.setNotes("Inbound from website");
                memberRepo.save(m2);

                Member m3 = new Member();
                m3.setFirstName("Carol"); m3.setLastName("White");
                m3.setEmail("carol@example.com"); m3.setPhone("+1-555-0103");
                m3.setStatus("inactive"); m3.setNotes("");
                memberRepo.save(m3);

                Member m4 = new Member();
                m4.setFirstName("David"); m4.setLastName("Brown");
                m4.setEmail("david@example.com"); m4.setPhone("+1-555-0104");
                m4.setStatus("active"); m4.setNotes("Premium plan");
                memberRepo.save(m4);

                Member m5 = new Member();
                m5.setFirstName("Emma"); m5.setLastName("Davis");
                m5.setEmail("emma@example.com"); m5.setPhone("+1-555-0105");
                m5.setStatus("lead"); m5.setNotes("Referred by Alice");
                memberRepo.save(m5);

                Activity a1 = new Activity();
                a1.setMember(m1); a1.setType("CALL");
                a1.setContent("Initial discovery call — interested in enterprise plan");
                a1.setCreatedBy("admin@jobentra.com");
                activityRepo.save(a1);

                Activity a2 = new Activity();
                a2.setMember(m1); a2.setType("EMAIL");
                a2.setContent("Sent pricing proposal and feature comparison");
                a2.setCreatedBy("admin@jobentra.com");
                activityRepo.save(a2);

                Activity a3 = new Activity();
                a3.setMember(m1); a3.setType("MEETING");
                a3.setContent("Demo scheduled for next Tuesday at 2pm");
                a3.setCreatedBy("admin@jobentra.com");
                activityRepo.save(a3);
            }
        };
    }
}

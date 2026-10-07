package com.evchargehub_backend.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendResetPasswordEmail(String toEmail, String resetLink)
            throws MessagingException {

        MimeMessage message = mailSender.createMimeMessage();

        MimeMessageHelper helper =
                new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);
        helper.setSubject("EV ChargeHub - Reset Your Password");

        String html = """
                <div style="font-family: Arial, sans-serif;
                            max-width: 600px;
                            margin: auto;
                            padding: 30px;
                            border: 1px solid #e5e7eb;
                            border-radius: 12px;">

                    <h2 style="color: #16a34a;">
                        EV ChargeHub
                    </h2>

                    <p>Hello,</p>

                    <p>
                        We received a request to reset your
                        EV ChargeHub account password.
                    </p>

                    <p>
                        Click the button below to create a new password:
                    </p>

                    <div style="margin: 30px 0;">
                        <a href="%s"
                           style="
                           display:inline-block;
                           padding:12px 22px;
                           background:#16a34a;
                           color:white;
                           text-decoration:none;
                           border-radius:6px;
                           font-weight:bold;">
                            Reset Password
                        </a>
                    </div>

                    <p>
                        This reset link will expire in
                        <strong>15 minutes</strong>.
                    </p>

                    <p>
                        If you did not request a password reset,
                        you can safely ignore this email.
                    </p>

                    <br>

                    <p>
                        Regards,<br>
                        <strong>EV ChargeHub Team</strong>
                    </p>

                </div>
                """.formatted(resetLink);

        helper.setText(html, true);

        mailSender.send(message);
    }
}
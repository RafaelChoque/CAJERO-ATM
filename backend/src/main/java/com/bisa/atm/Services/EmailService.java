package com.bisa.atm.Services;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void enviarCorreoBienvenida(String email, String username, String tempPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("🔐 Credenciales de Acceso - Banca BISA");

            String htmlMsg = "<div style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;\">\n" +
                    "  <h2 style=\"color: #003366; text-align: center;\">¡Bienvenido a la Red BISA!</h2>\n" +
                    "  <p>Hola,</p>\n" +
                    "  <p>Tu cuenta ha sido aperturada exitosamente. Aquí tienes tus credenciales para tu primer ingreso a la App Móvil:</p>\n" +
                    "  <div style=\"background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 5px solid #003366; margin: 20px 0;\">\n" +
                    "    <p style=\"margin: 0;\"><strong>Usuario:</strong> " + username + "</p>\n" +
                    "    <p style=\"margin: 5px 0 0 0;\"><strong>Contraseña Temporal:</strong> <span style=\"color: #e63946; font-weight: bold;\">" + tempPassword + "</span></p>\n" +
                    "  </div>\n" +
                    "  <p style=\"font-size: 0.9em; color: #666;\">⚠️ <strong>Importante:</strong> Por tu seguridad, el sistema te exigirá cambiar esta contraseña por una personal en tu primer ingreso.</p>\n" +
                    "  <hr style=\"border: 0; border-top: 1px solid #eee; margin-top: 30px;\">\n" +
                    "  <p style=\"font-size: 0.8em; color: #999; text-align: center;\">Este es un mensaje automático de Banco BISA.</p>\n" +
                    "</div>";

            helper.setText(htmlMsg, true);
            mailSender.send(message);
            System.out.println("Correo enviado exitosamente a: " + email);

        } catch (Exception e) {
            System.err.println("Error enviando el correo: " + e.getMessage());
        }
    }
}
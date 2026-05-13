package com.bisa.atm.Services;

import com.bisa.atm.Entities.CuentaBancaria;
import com.bisa.atm.Entities.Persona;
import com.bisa.atm.Entities.Transaccion;
import com.bisa.atm.dto.DetalleDispensacionDto;
import com.bisa.atm.dto.ResultadoDispensacionDto;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ComprobanteRetiroService {

    private static final PDType1Font FONT_REGULAR =
            new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private static final PDType1Font FONT_BOLD =
            new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

    public byte[] generarPdfRetiro(
            CuentaBancaria cuenta,
            ResultadoDispensacionDto resultado,
            Transaccion transaccion,
            Long idCajero
    ) {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PDPage page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {

                float pageHeight = page.getMediaBox().getHeight();

                // Caja pequeña del comprobante dentro de la hoja carta
                float boxWidth = 280;
                float boxHeight = 410;
                float marginTop = 50;
                float startX = 50;
                float startY = pageHeight - marginTop - boxHeight;

                // Marco del comprobante
                content.addRect(startX, startY, boxWidth, boxHeight);
                content.stroke();

                float cursorX = startX + 18;
                float cursorY = startY + boxHeight - 22;
                float lineGap = 15;

                // Encabezado
                escribirLinea(content, FONT_BOLD, 13, cursorX, cursorY, "BANCO BISA - COMPROBANTE");
                cursorY -= lineGap;
                escribirLinea(content, FONT_BOLD, 12, cursorX, cursorY, "RETIRO DE EFECTIVO");

                cursorY -= 18;
                dibujarSeparador(content, startX + 12, startX + boxWidth - 12, cursorY);
                cursorY -= 14;

                Persona persona = cuenta.getUsuario().getPersona();
                String nombreCompleto = construirNombreCompleto(persona);

                // Datos principales
                escribirLinea(content, FONT_BOLD, 10, cursorX, cursorY, "Cliente:");
                cursorY -= 12;
                escribirLinea(content, FONT_REGULAR, 10, cursorX, cursorY, nombreCompleto);

                cursorY -= 16;
                escribirLinea(content, FONT_BOLD, 10, cursorX, cursorY, "Cuenta:");
                cursorY -= 12;
                escribirLinea(content, FONT_REGULAR, 10, cursorX, cursorY, cuenta.getNumeroCuenta());

                cursorY -= 16;
                escribirLinea(content, FONT_BOLD, 10, cursorX, cursorY, "Cajero:");
                cursorY -= 12;
                escribirLinea(content, FONT_REGULAR, 10, cursorX, cursorY, "ATM " + idCajero);

                cursorY -= 16;
                escribirLinea(content, FONT_BOLD, 10, cursorX, cursorY, "Fecha y hora:");
                cursorY -= 12;
                escribirLinea(
                        content,
                        FONT_REGULAR,
                        10,
                        cursorX,
                        cursorY,
                        transaccion.getFechaHora().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))
                );

                cursorY -= 16;
                escribirLinea(content, FONT_BOLD, 10, cursorX, cursorY, "Referencia:");
                cursorY -= 12;
                escribirLinea(content, FONT_REGULAR, 10, cursorX, cursorY, transaccion.getNumeroReferencia());

                cursorY -= 18;
                dibujarSeparador(content, startX + 12, startX + boxWidth - 12, cursorY);
                cursorY -= 14;

                escribirLinea(content, FONT_BOLD, 11, cursorX, cursorY, "Monto retirado:");
                cursorY -= 15;
                escribirLinea(
                        content,
                        FONT_BOLD,
                        14,
                        cursorX,
                        cursorY,
                        "Bs " + resultado.getMontoDispensado()
                );

                cursorY -= 20;
                escribirLinea(content, FONT_BOLD, 11, cursorX, cursorY, "Cortes entregados:");
                cursorY -= 14;

                for (String lineaCorte : construirLineasCortes(resultado.getDetalles())) {
                    escribirLinea(content, FONT_REGULAR, 10, cursorX, cursorY, lineaCorte);
                    cursorY -= 13;
                }

                cursorY -= 8;
                dibujarSeparador(content, startX + 12, startX + boxWidth - 12, cursorY);
                cursorY -= 14;

                escribirLinea(content, FONT_REGULAR, 8, cursorX, cursorY, "Gracias por utilizar nuestros servicios.");
            }

            document.save(outputStream);
            return outputStream.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("No se pudo generar el comprobante PDF", e);
        }
    }

    private void escribirLinea(
            PDPageContentStream content,
            PDType1Font font,
            float fontSize,
            float x,
            float y,
            String texto
    ) throws IOException {
        content.beginText();
        content.setFont(font, fontSize);
        content.newLineAtOffset(x, y);
        content.showText(texto != null ? texto : "");
        content.endText();
    }

    private void dibujarSeparador(PDPageContentStream content, float x1, float x2, float y) throws IOException {
        content.moveTo(x1, y);
        content.lineTo(x2, y);
        content.stroke();
    }

    private String construirNombreCompleto(Persona persona) {
        StringBuilder nombre = new StringBuilder();

        if (persona.getNombre() != null) nombre.append(persona.getNombre()).append(" ");
        if (persona.getApellidoPaterno() != null) nombre.append(persona.getApellidoPaterno()).append(" ");
        if (persona.getApellidoMaterno() != null) nombre.append(persona.getApellidoMaterno());

        return nombre.toString().trim();
    }

    private List<String> construirLineasCortes(List<DetalleDispensacionDto> detalles) {
        List<String> lineas = new ArrayList<>();

        if (detalles == null || detalles.isEmpty()) {
            lineas.add("Sin detalle de cortes");
            return lineas;
        }

        int maxLineas = Math.min(detalles.size(), 5);

        for (int i = 0; i < maxLineas; i++) {
            DetalleDispensacionDto detalle = detalles.get(i);
            lineas.add(detalle.getCantidad() + " x Bs " + detalle.getDenominacion());
        }

        return lineas;
    }
}
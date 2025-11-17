package adopciones.tarea4.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class AvisoResumenDTO {

    private Integer id;
    private LocalDate fechaPublicacion;
    private String sector;
    private Integer cantidad;
    private String tipo;
    private String edad; // edad + " " + unidadMedida ej 2 meses, 3 años, etc
    private String comuna;
    private Double notaPromedio; // puede ser null
    private Long notasCount; // cantidad de notas recibidas

    public AvisoResumenDTO(Integer id, LocalDateTime fechaIngreso, String sector, Integer cantidad, String tipo, Integer edad, String unidadMedida, String comuna, Double notaPromedio, Long notasCount) {
        this.id = id;
        this.fechaPublicacion = (fechaIngreso != null) ? fechaIngreso.toLocalDate() : null;
        this.sector = sector;
        this.cantidad = cantidad;
        this.tipo = tipo;

        if(edad != null && unidadMedida != null) {
            String sufijo = "m".equals(unidadMedida) ? " meses" : " años";
            this.edad = edad + sufijo;
        } else {
            this.edad = "";
        }
        this.comuna = comuna;
        this.notaPromedio = notaPromedio;
        this.notasCount = notasCount;
    }

    public Integer getId() {
        return id;
    }

    public LocalDate getFechaPublicacion() {
        return fechaPublicacion;
    }

    public String getSector() {
        return sector;
    }  

    public Integer getCantidad() {
        return cantidad;
    }

    public String getTipo() {
        return tipo;
    }

    public String getEdad() {
        return edad;
    }

    public String getComuna() {
        return comuna;
    }

    public Double getNotaPromedio() {
        return notaPromedio;
    }

    public Long getNotasCount() {
        return notasCount;
    }
    
    
}

package adopciones.tarea4.dto;

public class NotaResponseDTO {

    private boolean ok;
    private double promedio;
    private long total;

    public NotaResponseDTO(boolean ok, double promedio, long total) {
        this.ok = ok;
        this.promedio = promedio;
        this.total = total;
    }

    public boolean isOk() {
        return ok;
    }

    public double getPromedio() {
        return promedio;
    }

    public long getTotal() {
        return total;
    }
    
}

package adopciones.tarea4.controllers;

import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import adopciones.tarea4.dto.AvisoResumenDTO;
import adopciones.tarea4.dto.NotaRequest;
import adopciones.tarea4.dto.NotaResponseDTO;
import adopciones.tarea4.services.ApiService;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final ApiService apiService;

    public ApiController(ApiService apiService) {
        this.apiService = apiService;
    }

    @GetMapping("/avisos")
    public Page<AvisoResumenDTO> getAvisos(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {

        return apiService.listarAvisos(page, size);
    }

    @PostMapping("/avisos/{id}/notas")
    public ResponseEntity<?> agregarNotas(
        @PathVariable("id") Integer avisoId,
        @RequestBody NotaRequest request){

        try {
            NotaResponseDTO resp = apiService.agregarNota(avisoId, request.getNota());
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("ok", false, "error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("ok", false, "error", e.getMessage()));
        }
    }
}
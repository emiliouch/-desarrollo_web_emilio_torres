package adopciones.tarea4.services;

import adopciones.tarea4.dto.AvisoResumenDTO;
import adopciones.tarea4.dto.NotaResponseDTO;
import adopciones.tarea4.models.AvisoAdopcion;
import adopciones.tarea4.models.AvisoRepository;
import adopciones.tarea4.models.Nota;
import adopciones.tarea4.models.NotaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Service
public class ApiService {
    private final AvisoRepository avisoRepository;
    private final NotaRepository notaRepository;


    public ApiService(AvisoRepository avisoRepository, NotaRepository notaRepository){
        this.avisoRepository = avisoRepository;
        this.notaRepository = notaRepository;
    }

    public Page<AvisoResumenDTO> listarAvisos(int page, int size) {
        if (page < 0) page = 0;
        if (size <= 0) size = 10;
        Pageable pageable = PageRequest.of(page, size);
        return avisoRepository.listarConPromedio(pageable);
    }
    
    public NotaResponseDTO agregarNota(Integer avisoId, Integer notaValor) {
        if (notaValor == null || notaValor < 1 || notaValor > 7) {
            throw new IllegalArgumentException("La nota debe estar entre 1 y 7");
        }

        AvisoAdopcion aviso = avisoRepository.findById(avisoId)
            .orElseThrow(() -> new NoSuchElementException("Aviso de adopcion no encontrado"));

        Nota n = new Nota();
        n.setAviso(aviso);
        n.setNota(notaValor);
        notaRepository.save(n);

        Double promedio = notaRepository.promedio(avisoId);
        long total = notaRepository.total(avisoId);
        double p = (promedio != null) ? promedio : 0.0;

        return new NotaResponseDTO(true, p, total);
        

    }
}

package adopciones.tarea4.models;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import adopciones.tarea4.dto.AvisoResumenDTO;


@Repository
public interface AvisoRepository extends JpaRepository<AvisoAdopcion, Integer> {
    
    @Query("""
            SELECT new adopciones.tarea4.dto.AvisoResumenDTO(a.id, a.fechaIngreso, a.sector, a.cantidad, a.tipo, a.edad, a.unidadMedida, c.nombre, avg(n.nota), count(n))
            FROM AvisoAdopcion a join a,comuna c left join a.notas n
            GROUP BY a.id, a.fechaIngreso, a.sector, a.cantidad, a.tipo, a.edad, a.unidadMedida, c.nombre
            ORDER BY a.id desc
    """)
     Page<AvisoResumenDTO> listarConPromedio(Pageable pageable);
}

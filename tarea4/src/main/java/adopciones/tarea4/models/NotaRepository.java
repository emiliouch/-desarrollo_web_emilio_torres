package adopciones.tarea4.models;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotaRepository extends JpaRepository<Nota, Integer> {

    @Query("select avg(n.nota) from Nota n where n.aviso.id = :avisoId")
    Double promedio(@Param("avisoId") Integer avisoId);

    @Query("select count(n) from Nota n where n.aviso.id = :avisoId")
    long total(@Param("avisoId") Integer avisoId);
}

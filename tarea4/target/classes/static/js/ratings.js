// Carga la lista de avisos y permite evaluarlos con una nota 1..7 usando fetch.

(function () {
  var tabla = document.getElementById("tabla-avisos");
  if (!tabla) return;
  var tbody = tabla.querySelector("tbody");
  if (!tbody) return;
 // elementos de paginación
  var prevBtn = document.getElementById("prev-page");
  var nextBtn = document.getElementById("next-page");
  var pageInfo = document.getElementById("page-info");

  var currentPage = 0;
  var pageSize = 10;
  var totalPages = 1;

  function fmtFecha(iso) {
    if (!iso) return "";
    // Asumimos formato ISO "YYYY-MM-DDTHH:MM:SSZ"
    return iso;
  }

  function fmtNumero(n) {
    if (n == null) return "";
    return Number(n).toFixed(2);
  }
  // renderiza la tabla con los avisos dados
  function renderTabla(content) {
    tbody.innerHTML = "";
    if (!Array.isArray(content) || content.length === 0) {
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      td.colSpan = 10;
      td.textContent = "No hay avisos para mostrar.";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    // llena la tabla
    content.forEach(function (a) {
      var tr = document.createElement("tr");

      var tdId = document.createElement("td");
      tdId.textContent = a.id;
      tr.appendChild(tdId);

      var tdFecha = document.createElement("td");
      tdFecha.textContent = fmtFecha(a.fechaPublicacion);
      tr.appendChild(tdFecha);

      var tdSector = document.createElement("td");
      tdSector.textContent = a.sector || "";
      tr.appendChild(tdSector);

      var tdCantidad = document.createElement("td");
      tdCantidad.textContent = a.cantidad != null ? a.cantidad : "";
      tr.appendChild(tdCantidad);

      var tdTipo = document.createElement("td");
      tdTipo.textContent = a.tipo || "";
      tr.appendChild(tdTipo);

      var tdEdad = document.createElement("td");
      tdEdad.textContent = a.edad || "";
      tr.appendChild(tdEdad);

      var tdComuna = document.createElement("td");
      tdComuna.textContent = a.comuna || "";
      tr.appendChild(tdComuna);

      var tdProm = document.createElement("td");
      tdProm.className = "col-promedio";
      tdProm.textContent = a.notaPromedio != null ? fmtNumero(a.notaPromedio) : "-";
      tr.appendChild(tdProm);

      var tdCount = document.createElement("td");
      tdCount.className = "col-count";
      tdCount.textContent = a.notasCount != null ? a.notasCount : 0;
      tr.appendChild(tdCount);

      var tdAcc = document.createElement("td");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Evaluar";
      btn.className = "btn btn-evaluar"; 
      btn.dataset.avisoId = a.id;
      tdAcc.appendChild(btn);
      tr.appendChild(tdAcc);

      tbody.appendChild(tr);
    });
  }
  // actualiza controles de paginación
  function updatePaginacion(page, total) {
    currentPage = page;
    totalPages = total > 0 ? total : 1;

    if (pageInfo) {
      pageInfo.textContent = "Página " + (page + 1) + " de " + totalPages;
    }
    if (prevBtn) {
      prevBtn.disabled = page <= 0;
    }
    if (nextBtn) {
      nextBtn.disabled = page >= totalPages - 1;
    }
  }
  // carga una página de avisos
  function loadPage(page) {
    var url = "/api/avisos?page=" + page + "&size=" + pageSize;

    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("Error al cargar avisos");
        return r.json();
      })
      .then(function (data) {
        var content = data.content || [];
        var number = (typeof data.number === "number") ? data.number : 0;
        var total = (typeof data.totalPages === "number") ? data.totalPages : 1;
        // renderiza tabla y paginación
        renderTabla(content);
        updatePaginacion(number, total);
      })
      .catch(function (err) {
        console.error(err);
        tbody.innerHTML = "";
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.colSpan = 10;
        td.textContent = "Error al cargar avisos.";
        tr.appendChild(td);
        tbody.appendChild(tr);
      });
  }
  // pide una nota al usuario
  function pedirNota() {
    var raw = window.prompt("Ingresa una nota entre 1 y 7");
    if (raw == null) return null;
    var n = parseInt(raw, 10);
    if (isNaN(n) || n < 1 || n > 7) {
      alert("La nota debe ser un entero entre 1 y 7.");
      return null;
    }
    return n;
  }

  function enviarNota(avisoId, nota) {
    return fetch("/api/avisos/" + avisoId + "/notas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nota: nota })
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || data.ok === false) {
            var msg = data.error || "Error al guardar la nota.";
            throw new Error(msg);
          }
          return data;
        });
      });
  }

  // delegación de eventos para botones evaluar
  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".btn-evaluar");
    if (!btn) return;

    var avisoId = btn.dataset.avisoId;
    var nota = pedirNota();
    if (nota == null) return;

    enviarNota(avisoId, nota)
      .then(function () {
        // recargamos la página actual para reflejar el nuevo promedio
        loadPage(currentPage);
      })
      .catch(function (err) {
        console.error(err);
        alert(err.message || "No se pudo guardar la nota.");
      });
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      if (currentPage > 0) loadPage(currentPage - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      if (currentPage < totalPages - 1) loadPage(currentPage + 1);
    });
  }

  // Carga inicial
  loadPage(0);
})();
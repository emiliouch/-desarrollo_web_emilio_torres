"use strict";

/* Datos de ejemplo (puedes cambiar fotos a assets reales) */
const MOCK_AVISOS = [
  {
    id: 1,
    pub: "2025-08-20 10:00",
    entrega: "2025-09-02 12:00",
    region: "Metropolitana",
    comuna: "Las Condes",
    sector: "El Golf",
    cantidad: 2,
    tipo: "perro",
    edad: 4,
    unidad: "meses",
    nombre: "María Pérez",
    email: "maria@gmail.com",
    fotos: ["assets/perro1.webp", "assets/perro2.jpg"],
    descripcion: "Cachorros sanos, muy juguetones."
  },
  {
    id: 2,
    pub: "2025-08-21 16:30",
    entrega: "2025-09-05 10:00",
    region: "Metropolitana",
    comuna: "Providencia",
    sector: "Manuel Montt",
    cantidad: 1,
    tipo: "gato",
    edad: 1,
    unidad: "años",
    nombre: "Juan Soto",
    email: "juan@gmail.com",
    fotos: ["assets/gato1.jpg"],
    descripcion: "Adulto dócil, esterilizado."
  },
  {
    id: 3,
    pub: "2025-08-18 12:00",
    entrega: "2025-09-01 09:00",
    region: "Valparaíso",
    comuna: "Viña del Mar",
    sector: "Recreo",
    cantidad: 3,
    tipo: "perro",
    edad: 2,
    unidad: "meses",
    nombre: "Carla Díaz",
    email: "carla@hotmail.com",
    fotos: ["assets/perro3.webp", "assets/perro4.jpg", "assets/perro5.webp"],
    descripcion: "Tres cachorros buscando familia responsable."
  },
  {
    id: 4,
    pub: "2025-08-17 19:00",
    entrega: "2025-09-03 15:30",
    region: "Metropolitana",
    comuna: "Santiago",
    sector: "Beauchef 850, terraza",
    cantidad: 1,
    tipo: "gato",
    edad: 2,
    unidad: "meses",
    nombre: "Luis Rivas",
    email: "luis@yahoo.com",
    fotos: ["assets/gato2.jpeg"],
    descripcion: "Gatita muy cariñosa y juguetona."
  },
  {
    id: 5,
    pub: "2025-08-15 18:00",
    entrega: "2025-09-07 11:00",
    region: "Biobío",
    comuna: "Concepción",
    sector: "Centro",
    cantidad: 2,
    tipo: "perro",
    edad: 1,
    unidad: "años",
    nombre: "Ana Torres",
    email: "ana@gmail.com",
    fotos: ["assets/perro6.jpeg"],
    descripcion: "Pareja de perritos sociables, conviven con niños."
  }
];

/* Utils */
const $ = (sel, ctx = document) => ctx.querySelector(sel);

/* Portada */
function poblarPortada() {
  const tbody = $("#tabla-ultimos tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  MOCK_AVISOS.slice(0, 5).forEach((a) => {
    const tr = document.createElement("tr");
    const tipoEdad = `${a.tipo} / ${a.edad} ${a.unidad}`;
    const foto = a.fotos?.[0] || "";
    tr.innerHTML = `
      <td>${a.pub}</td>
      <td>${a.comuna}</td>
      <td>${a.sector || ""}</td>
      <td>${a.cantidad}</td>
      <td>${tipoEdad}</td>
      <td>${foto ? `<img alt="foto" width="80" height="60" style="object-fit:cover;border-radius:8px" src="${foto}">` : "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* Agregar: fecha mínima */
function setMinFechaDisponible() {
  const input = $("#fechaDisponible");
  if (!input) return;
  const now = new Date();
  now.setHours(now.getHours() + 3);
  const pad = (n) => String(n).padStart(2, "0");
  const val = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  input.value = val;          // prellenado
  input.dataset.min = val;    // umbral para validación
}

/* Agregar: métodos de contacto */
function agregarMetodoContacto() {
  const cont = $("#contactos");
  const tipoSel = $("#contacto-tipo");
  if (!cont || !tipoSel) return;
  const actual = cont.children.length;
  if (actual >= 5) return alert("Máximo 5 métodos de contacto");
  const tipo = tipoSel.value;
  if (!tipo) return alert("Selecciona un tipo de contacto");
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `
    <span class="chip">${tipo}</span>
    <input type="text" placeholder="ID o URL (4–50)" data-tipo="${tipo}" maxlength="50" />
    <button type="button" aria-label="Quitar">Quitar</button>
  `;
  row.querySelector("button").onclick = () => row.remove();
  cont.appendChild(row);
  tipoSel.value = "";
}

/* Listado (tabla) */
function poblarListado() {
  const tbody = $("#tabla-listado tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  MOCK_AVISOS.forEach((a, idx) => {
    const tr = document.createElement("tr");
    const tipoEdad = `${a.tipo} / ${a.edad} ${a.unidad}`;
    tr.dataset.idx = String(idx);
    tr.innerHTML = `
      <td>${a.pub}</td>
      <td>${a.entrega}</td>
      <td>${a.comuna}</td>
      <td>${a.sector || ""}</td>
      <td>${a.cantidad}</td>
      <td>${tipoEdad}</td>
      <td>${a.nombre}</td>
      <td>${a.fotos?.length ?? 0}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* Detalle del aviso */
function mostrarDetalle(idx) {
  const aviso = MOCK_AVISOS[idx];
  if (!aviso) return;

  const seccionDetalle = $("#detalle");
  const tablaListado = $("#tabla-listado");
  const titulo = $("#det-titulo");
  const meta = $("#det-meta");
  const desc = $("#det-descripcion");
  const fotos = $("#det-fotos");

  if (!seccionDetalle || !tablaListado || !titulo || !meta || !desc || !fotos) return;

  titulo.textContent = `${aviso.tipo} en ${aviso.comuna} — ${aviso.cantidad} (${aviso.edad} ${aviso.unidad})`;

  meta.innerHTML = `
    <div><strong>Publicación:</strong> ${aviso.pub}</div>
    <div><strong>Entrega:</strong> ${aviso.entrega}</div>
    <div><strong>Región:</strong> ${aviso.region}</div>
    <div><strong>Comuna:</strong> ${aviso.comuna}</div>
    <div><strong>Sector:</strong> ${aviso.sector || "-"}</div>
    <div><strong>Contacto:</strong> ${aviso.nombre} — ${aviso.email}</div>
  `;

  desc.textContent = aviso.descripcion || "";

  fotos.innerHTML = "";
  (aviso.fotos || []).forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Foto de la mascota";
    // Miniaturas 320x240
    img.width = 320;
    img.height = 240;
    img.style.objectFit = "cover";
    fotos.appendChild(img);
  });

  // Mostrar detalle / ocultar listado
  seccionDetalle.classList.remove("oculto");
  tablaListado.classList.add("oculto");
}

/* Modal de foto (solo en listado.html) */
function abrirModal(src) {
  const modal = $("#modal");
  if (!modal) return;
  const img = $("#modal-img");
  if (img) {
    img.src = src;
    // Forzar 800x600
    img.width = 800;
    img.height = 600;
    img.style.objectFit = "cover";
  }
  modal.classList.remove("oculto");
}

function cerrarModal() {
  $("#modal")?.classList.add("oculto");
}

/* Inicialización por página (con guardas) */
window.addEventListener("DOMContentLoaded", () => {
  // Portada
  poblarPortada();

  // Listado
  poblarListado();

  // Fecha mínima (agregar.html)
  setMinFechaDisponible();

  // Métodos de contacto (agregar.html)
  const addContacto = $("#btn-add-contacto");
  if (addContacto) addContacto.addEventListener("click", agregarMetodoContacto);

  const tipoMenu = $("#contacto-tipo");
  if (tipoMenu) {
    tipoMenu.addEventListener("change", () => {
      if (tipoMenu.value) agregarMetodoContacto();
    });
  }

  // Fotos (agregar.html)
  const addFoto = $("#btn-add-foto");
  if (addFoto) {
    addFoto.addEventListener("click", () => {
      const cont = $("#fotos");
      const total = cont?.querySelectorAll('input[type="file"]').length || 0;
      if (total >= 5) return alert("Máximo 5 fotos");
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      cont.appendChild(input);
    });
  }

  // Confirmación
  $("#conf-si")?.addEventListener("click", () => {
    $("#confirm")?.classList.add("oculto");
    $("#form-aviso")?.classList.add("oculto");
    $("#recibo")?.classList.remove("oculto");
  });
  $("#conf-no")?.addEventListener("click", () => {
    $("#confirm")?.classList.add("oculto");
  });

  // Submit con validación JS
  const form = $("#form-aviso");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (typeof validarFormulario === "function" && validarFormulario()) {
        $("#confirm")?.classList.remove("oculto"); // abrir confirmación
      } else {
        const firstErr = document.querySelector(".error:not(:empty)");
        firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // Listeners del listado → detalle (listado.html)
  const tbodyListado = $("#tabla-listado tbody");
  if (tbodyListado) {
    tbodyListado.addEventListener("click", (e) => {
      const tr = e.target.closest("tr");
      if (!tr) return;
      const idx = parseInt(tr.dataset.idx, 10);
      if (!Number.isNaN(idx)) mostrarDetalle(idx);
    });
  }

  // Botón volver del detalle (listado.html)
  $("#btn-volver-listado")?.addEventListener("click", () => {
    $("#detalle")?.classList.add("oculto");
    $("#tabla-listado")?.classList.remove("oculto");
  });

  // Modal foto (listado.html)
  $("#modal-cerrar")?.addEventListener("click", cerrarModal);
  $("#det-fotos")?.addEventListener("click", (e) => {
    const img = e.target.closest("img");
    if (!img) return;
    abrirModal(img.src);
  });

  // Cerrar modal al hacer click fuera del contenido
  $("#modal")?.addEventListener("click", (e) => {
    if (e.target.id === "modal") cerrarModal();
  });

  // Cerrar modal con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarModal();
  });
});

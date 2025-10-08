// validaciones de cliente alineadas con el backend

(function () {
  const form = document.getElementById("form-aviso");
  if (!form) return;

  // regex basicos
  const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const CEL_RE = /^\+569\d{8}$/; // formato CL estricto

  // helpers
  const isBlank = (v) => v == null || String(v).trim() === "";
  const intOrNaN = (v) => {
    const n = parseInt(String(v), 10);
    return Number.isNaN(n) ? NaN : n;
  };

  // pinta borde rojo o limpia
  function mark(el, bad) {
    if (!el) return;
    el.style.borderColor = bad ? "red" : "";
  }

  // contenedor de errores alto nivel
  function renderTopErrors(msgs) {
    let box = document.querySelector(".errors");
    if (!box) {
      box = document.createElement("div");
      box.className = "errors";
      form.parentNode.insertBefore(box, form);
    }
    box.innerHTML = "";
    const ul = document.createElement("ul");
    for (const m of msgs) {
      const li = document.createElement("li");
      li.textContent = m;
      ul.appendChild(li);
    }
    box.appendChild(ul);
  }

  // valida el formulario y retorna lista de mensajes
  function validate() {
    const errs = [];

    const region = document.getElementById("region");
    const comuna = document.getElementById("comuna_id");
    const sector = document.getElementById("sector");
    const nombre = document.getElementById("nombre");
    const email = document.getElementById("email");
    const celular = document.getElementById("celular");
    const tipo = document.getElementById("tipo");
    const cantidad = document.getElementById("cantidad");
    const edad = document.getElementById("edad");
    const unidad = document.getElementById("unidad_medida");
    const fecha = document.getElementById("fecha_entrega");
    const desc = document.getElementById("descripcion");

    // reset marcas
    [region, comuna, sector, nombre, email, celular, tipo, cantidad, edad, unidad, fecha, desc].forEach((el) =>
      mark(el, false)
    );

    // requeridos
    const req = [
      ["comuna_id", comuna],
      ["nombre", nombre],
      ["email", email],
      ["tipo", tipo],
      ["cantidad", cantidad],
      ["edad", edad],
      ["unidad_medida", unidad],
      ["fecha_entrega", fecha],
    ];
    const faltan = [];
    for (const [key, el] of req) {
      if (!el || isBlank(el.value)) {
        faltan.push(key);
        mark(el, true);
      }
    }
    if (faltan.length) errs.push("Faltan campos obligatorios: " + faltan.join(", "));

    // longitudes
    if (sector && sector.value && sector.value.length > 100) {
      errs.push("Sector excede 100");
      mark(sector, true);
    }
    if (nombre && nombre.value && nombre.value.length > 200) {
      errs.push("Nombre excede 200");
      mark(nombre, true);
    }
    if (email && email.value && email.value.length > 100) {
      errs.push("Email excede 100");
      mark(email, true);
    }
    if (celular && celular.value && celular.value.length > 12) {
      errs.push("Celular excede 12");
      mark(celular, true);
    }
    if (desc && desc.value && desc.value.length > 500) {
      errs.push("Descripcion excede 500");
      mark(desc, true);
    }

    // formatos
    if (email && !isBlank(email.value) && !EMAIL_RE.test(email.value)) {
      errs.push("Email invalido");
      mark(email, true);
    }
    if (celular && !isBlank(celular.value) && !CEL_RE.test(celular.value)) {
      errs.push("Celular invalido");
      mark(celular, true);
    }
    if (tipo && tipo.value && !["gato", "perro"].includes(tipo.value)) {
      errs.push("Tipo invalido");
      mark(tipo, true);
    }
    if (unidad && unidad.value && !["a", "m"].includes(unidad.value)) {
      errs.push("Unidad invalida");
      mark(unidad, true);
    }

    // enteros y rangos
    const cant = intOrNaN(cantidad && cantidad.value);
    if (Number.isNaN(cant)) {
      errs.push("Cantidad debe ser entero");
      mark(cantidad, true);
    } else if (cant < 1) {
      errs.push("Cantidad debe ser mayor o igual a 1");
      mark(cantidad, true);
    }

    const ed = intOrNaN(edad && edad.value);
    if (Number.isNaN(ed)) {
      errs.push("Edad debe ser entero");
      mark(edad, true);
    } else if (ed < 0) {
      errs.push("Edad no puede ser negativa");
      mark(edad, true);
    }

    // fecha futura estricta
    if (fecha && !isBlank(fecha.value)) {
      const dt = new Date(fecha.value);
      const now = new Date();
      if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) {
        errs.push("Fecha de entrega invalida");
        mark(fecha, true);
      } else if (dt.getTime() <= now.getTime()) {
        errs.push("Fecha de entrega debe ser futura");
        mark(fecha, true);
      }
    }

    return errs;
  }

  // intercepta submit y valida
  form.addEventListener("submit", function (ev) {
    const errs = validate();
    if (errs.length) {
      ev.preventDefault();
      renderTopErrors(errs);
      // desplaza arriba para ver el bloque de errores
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
})();

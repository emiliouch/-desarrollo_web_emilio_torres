(function () {
  // hace navegables las filas con data-href
  function bindRowClicks() {
    const rows = document.querySelectorAll("tr.clickable[data-href]");
    rows.forEach((row) => {
      row.addEventListener("click", () => {
        const href = row.getAttribute("data-href");
        if (href) window.location.href = href;
      });
    });
  }

  // fija min del datetime-local a ahora redondeado a minutos
  function setMinDateTime() {
    const input = document.getElementById("fecha_entrega");
    if (!input) return;
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    const isoLocal =
      now.getFullYear() +
      "-" +
      pad(now.getMonth() + 1) +
      "-" +
      pad(now.getDate()) +
      "T" +
      pad(now.getHours()) +
      ":" +
      pad(now.getMinutes());
    input.min = isoLocal;
  }

  // agrega dinamicamente mas filas de metodos de contacto si existe el contenedor
  function bindAddContacto() {
    const cont = document.getElementById("contactos");
    if (!cont) return;

    // crea boton si no existe uno
    let btn = document.getElementById("btn-add-contacto");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "btn-add-contacto";
      btn.className = "btn-sec";
      btn.textContent = "Agregar contacto";
      cont.parentNode.appendChild(btn);
    }

    btn.addEventListener("click", () => {
      const row = document.createElement("div");
      row.className = "contacto-row";
      row.innerHTML = `
        <select name="metodo[]">
          <option value="">Seleccione</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="telegram">Telegram</option>
          <option value="X">X</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="otra">Otra</option>
        </select>
        <input name="identificador[]" placeholder="@usuario o numero">
      `;
      cont.appendChild(row);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindRowClicks();
    setMinDateTime();
    bindAddContacto();
  });
})();
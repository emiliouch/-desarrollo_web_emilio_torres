// carga de selects dependientes region -> comunas usando endpoints del backend

(function () {
  // obtiene elementos del DOM si existen en la pagina actual
  const regionSel = document.getElementById("region");
  const comunaSel = document.getElementById("comuna_id");

  if (!regionSel || !comunaSel) return; // no aplica en vistas sin formulario

  function opt(value, text) {
    const o = document.createElement("option");
    o.value = String(value);
    o.textContent = text;
    return o;
  }

  // limpia y deja placeholder
  function resetComunas() {
    comunaSel.innerHTML = "";
    comunaSel.appendChild(opt("", "Seleccione"));
  }

  // carga regiones desde /api/regiones
  async function loadRegiones() {
    try {
      const r = await fetch("/api/regiones");
      if (!r.ok) throw new Error("bad regiones");
      const data = await r.json();
      // limpia y agrega placeholder
      regionSel.innerHTML = "";
      regionSel.appendChild(opt("", "Seleccione"));
      // agrega opciones
      for (const reg of data) {
        regionSel.appendChild(opt(reg.id, reg.nombre));
      }
    } catch (e) {
      // en caso de error deja selects basicos
      regionSel.innerHTML = "";
      regionSel.appendChild(opt("", "Seleccione"));
    }
  }

  // carga comunas para una region
  async function loadComunas(regionId) {
    resetComunas();
    if (!regionId) return;
    try {
      const r = await fetch(`/api/comunas?region_id=${encodeURIComponent(regionId)}`);
      if (!r.ok) throw new Error("bad comunas");
      const data = await r.json();
      for (const c of data) {
        comunaSel.appendChild(opt(c.id, c.nombre));
      }
    } catch (e) {
      // deja solo placeholder
      resetComunas();
    }
  }

  // on change de region dispara carga de comunas
  regionSel.addEventListener("change", () => {
    loadComunas(regionSel.value);
  });

  // inicio basico
  resetComunas();
  loadRegiones();
})();
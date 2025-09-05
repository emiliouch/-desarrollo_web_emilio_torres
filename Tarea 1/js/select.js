// Dependencia Región → Comuna separada de UI
const REGIONES = {
  "Metropolitana": ["Santiago", "Las Condes", "Providencia", "La Florida", "Maipú"],
  "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué"],
  "Biobío": ["Concepción", "Talcahuano", "Chiguayante"],
};

function poblarRegiones(){
  const selR = document.getElementById("region");
  if(!selR) return;
  Object.keys(REGIONES).forEach(r => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = r;
    selR.appendChild(opt);
  });
}

function onRegionChange(){
  const selR = document.getElementById("region");
  const selC = document.getElementById("comuna");
  if(!selR || !selC) return;
  selC.innerHTML = `<option value="">Seleccione…</option>`;
  const comunas = REGIONES[selR.value] || [];
  comunas.forEach(c => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = c;
    selC.appendChild(opt);
  });
  selC.disabled = comunas.length === 0;
}

// Inicializa solo en agregar.html
window.addEventListener('DOMContentLoaded', () => {
  const selR = document.getElementById('region');
  if(!selR) return; // en otras páginas no hace nada
  poblarRegiones();
  selR.addEventListener('change', onRegionChange);
});
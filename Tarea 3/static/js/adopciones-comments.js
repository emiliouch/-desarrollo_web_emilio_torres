function esc(s){ const d=document.createElement("div"); d.innerText=String(s); return d.innerHTML; }

async function loadComments(avisoId){
  const ul = document.getElementById("comentarios-list");
  ul.innerHTML = "";
  const data = await (await fetch(`/api/avisos/${avisoId}/comentarios`)).json();
  for(const c of data){
    const li = document.createElement("li");
    li.innerHTML = `<b>${esc(c.nombre)}</b> <small>${new Date(c.fecha).toLocaleString()}</small><br>${esc(c.texto)}`;
    ul.appendChild(li);
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  const sec = document.getElementById("comentarios");
  if(!sec) return;
  const avisoId = sec.dataset.avisoId;
  const form = document.getElementById("form-comentario");
  const errorsDiv = document.getElementById("comentario-errors");

  loadComments(avisoId);

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    errorsDiv.textContent = "";

    const nombre = form.nombre.value.trim();
    const texto  = form.texto.value.trim();

    const errs = {};
    if (nombre.length < 3 || nombre.length > 80) errs.nombre = "Largo 3 a 80.";
    if (texto.length < 5) errs.texto = "Mínimo 5 caracteres.";
    if (Object.keys(errs).length){
      errorsDiv.textContent = Object.values(errs).join(" ");
      return;
    }

    const res = await fetch(`/api/avisos/${avisoId}/comentarios`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ nombre, texto })
    });

    if(res.ok){
      form.reset();
      await loadComments(avisoId);
    }else{
      const data = await res.json().catch(()=>({}));
      errorsDiv.textContent = data.errors ? Object.values(data.errors).join(" ") : "Error al guardar.";
    }
  });
});
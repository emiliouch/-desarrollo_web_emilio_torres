/* Validaciones SOLO con JS (no dependemos de required) */
function setError(id, msg){ const el = document.getElementById(id); if(el) el.textContent = msg || ""; }


function validarFormulario(){
// Limpia errores
["err-region","err-comuna","err-sector","err-nombre","err-email","err-celular","err-contactos","err-tipo","err-cantidad","err-edad","err-fecha","err-fotos"].forEach(id=>setError(id, ""));


let ok = true;
const v = (id)=> document.getElementById(id)?.value?.trim() || "";


// Región
if(!v('region')){ setError('err-region','Debe seleccionar región'); ok=false; }
// Comuna
if(!v('comuna')){ setError('err-comuna','Debe seleccionar comuna'); ok=false; }
// Sector opcional (<=100)
const sector = v('sector');
if(sector && sector.length>100){ setError('err-sector','Máximo 100 caracteres'); ok=false; }


// Nombre 3–200
const nombre = v('nombre');
if(nombre.length<3 || nombre.length>200){ setError('err-nombre','Entre 3 y 200 caracteres'); ok=false; }
// Email formato + máx 100
const email = v('email');
const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if(!reEmail.test(email) || email.length>100){ setError('err-email','Email inválido o >100'); ok=false; }
// Celular opcional formato +NNN.NNNNNNNN (exacto 8 dígitos tras el punto)
const celular = v('celular');
if(celular){
const reCel = /^\+\d{3}\.\d{8}$/;
if(!reCel.test(celular)) { setError('err-celular','Formato esperado +NNN.NNNNNNNN'); ok=false; }
}


// Métodos contacto (0..5), si existen validar 4–50 chars
const cont = document.getElementById('contactos');
if(cont){
const inputs = Array.from(cont.querySelectorAll('input[type="text"]'));
if(inputs.length>5){ setError('err-contactos','Máximo 5 métodos'); ok=false; }
for(const inp of inputs){
const val = inp.value.trim();
if(val && (val.length<4 || val.length>50)){ setError('err-contactos','Cada ID/URL: 4–50 caracteres'); ok=false; break; }
}
}


// Tipo obligatorio
if(!v('tipo')){ setError('err-tipo','Seleccione tipo'); ok=false; }
// Cantidad entero >=1
const cantidad = parseInt(v('cantidad'),10);
if(!Number.isInteger(cantidad) || cantidad<1){ setError('err-cantidad','Ingrese entero ≥ 1'); ok=false; }
// Edad entero >=1 y unidad obligatoria
const edad = parseInt(v('edad'),10);
if(!Number.isInteger(edad) || edad<1 || !v('unidad')){ setError('err-edad','Edad ≥1 y unidad requerida'); ok=false; }


// Fecha disponible >= ahora+3h prellenado
const inputFecha = document.getElementById('fechaDisponible');
if(inputFecha){
const min = inputFecha.dataset.min; // seteado en ui.js
if(!inputFecha.value){ setError('err-fecha','Debe indicar fecha'); ok=false; }
else if(min && inputFecha.value < min){ setError('err-fecha',`Debe ser ≥ ${min.replace('T',' ')}`); ok=false; }
}


// Fotos 1..5 y al menos 1 seleccionada
const fotosCont = document.getElementById('fotos');
if(fotosCont){
const files = Array.from(fotosCont.querySelectorAll('input[type="file"]'));
if(files.length<1 || files.length>5){ setError('err-fotos','Entre 1 y 5 fotos'); ok=false; }
const algunaSeleccionada = files.some(inp => inp.files && inp.files.length>0);
if(!algunaSeleccionada){ setError('err-fotos','Selecciona al menos 1 foto'); ok=false; }
}


return ok;
}
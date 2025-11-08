async function evaluarCadena() {
  const cadena = document.getElementById("cadena").value.trim();
  const resultado = document.getElementById("resultado");
  const di = document.getElementById("di");
  const pilaDiv = document.getElementById("pilaAnimada");

  const estados = ["q0","q1","q2","q3","q4","qf"]; 
  const transiciones = ["t0","t1","t2","t3","t4","b0","b1","b2","b3","b4"]; 

  estados.forEach(function(e){ var el=document.getElementById(e); if(el){ el.classList.remove("activo"); }});
  transiciones.forEach(function(t){ var tr=document.getElementById(t); if(tr){ tr.classList.remove("activa"); }});

  resultado.textContent = "";
  di.textContent = "";
  if (pilaDiv) pilaDiv.innerHTML = "";

  if (cadena === "") {
    resultado.textContent = "⚠️ Ingrese una cadena.";
    resultado.style.color = "orange";
    return;
  }

  if (/[^01]/.test(cadena)) {
    resultado.textContent = "❌ Símbolos inválidos. Use solo {0, 1}.";
    resultado.style.color = "red";
    return;
  }

  let estado = "q0";
  let i = 0;
  let pasos = `Descripción instantánea\n-------------------------\nInicio: (q0, ${cadena}, Z)\n`;
  let pila = ["Z"];
  let nCounter = 0;
  let mCounter = 0;

  async function activar(e,t){
    const estadoId = (e === 'qf') ? 'qf' : e; 

    estados.forEach(function(id){ var el=document.getElementById(id); if(el){ el.classList.remove("activo"); }});
    transiciones.forEach(function(id){ var tr=document.getElementById(id); if(tr){ tr.classList.remove("activa"); }});
    var nodo = document.getElementById(estadoId); 
    if(nodo){ nodo.classList.add("activo"); }
    if (t){ var tr2 = document.getElementById(t); if(tr2){ tr2.classList.add("activa"); }}
    actualizarPila();
    await new Promise(r=>setTimeout(r, 450));
  }

  function actualizarPila(){
    if (!pilaDiv) return;
    pilaDiv.innerHTML = "";
    pila.slice().reverse().forEach(s => {
      const el = document.createElement("div");
      el.className = "pila-elemento";
      el.textContent = s;
      pilaDiv.appendChild(el);
    });
  }

  await activar("q0","b0");

  while (i < cadena.length && cadena[i] === "1") {
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")}) ⊢ `;
    i++;
    await activar("q0","b0"); // q0, 1 -> q0, L/L
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")})\n`;
  }

  if (i < cadena.length && cadena[i] === "0") {
    estado = "q1"; await activar("q1","t0");
  } else {
    di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
    resultado.textContent = "❌ Cadena no aceptada. Debe contener al menos un '0' inicial (0^n, n≥1).";
    resultado.style.color = "red";
    return;
  }

  while (i < cadena.length && cadena[i] === "0") {
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")}) ⊢ `;
    pila.push("A");
    nCounter++;
    i++;
    await activar("q1","b1");
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")})\n`;
  }
  if (nCounter < 1) {
    di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
    resultado.textContent = "❌ 0^n inválido (se requiere n ≥ 1).";
    resultado.style.color = "red";
    return;
  }

  if (i < cadena.length && cadena[i] === "1") {
    estado = "q2"; await activar("q2","t1");
  } else {
    di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
    resultado.textContent = "❌ Falta bloque de 1^m (m ≥ 1).";
    resultado.style.color = "red";
    return;
  }

  let mPushCount = 0;
  while (i < cadena.length && cadena[i] === "1") {
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")}) ⊢ `;
    pila.push("B");
    mPushCount++;
    i++;
    await activar("q2","b2");
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")})\n`;
  }
  if (mPushCount < 1) {
    di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
    resultado.textContent = "❌ 1^m inválido (se requiere m ≥ 1).";
    resultado.style.color = "red";
    return;
  }

  if (i < cadena.length && cadena[i] === "1") {
    estado = "q3"; await activar("q3","t2");
  } else {
    di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
    resultado.textContent = "❌ Falta bloque 1^{2n}.";
    resultado.style.color = "red";
    return;
  }

  let dosNCounter = 0;
  while (i < cadena.length && cadena[i] === "1") {
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")}) ⊢ `;
    dosNCounter++; i++;
    
    if (dosNCounter % 2 === 0) {
      if (pila[pila.length-1] !== "A") {
        di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
        resultado.textContent = "❌ Desbalance (1^{2n} más largo que 0^n). Pila esperada 'A'.";
        resultado.style.color = "red";
        return;
      }
      pila.pop();
      await activar("q3","b3");
    } else {
       await activar("q3","b3");
    }
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")})\n`;
  }
  
  if (dosNCounter % 2 !== 0 || dosNCounter !== 2 * nCounter) {
    di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
    resultado.textContent = "❌ 1^{2n} inválido (longitud incorrecta o desbalance con 0^n).";
    resultado.style.color = "red";
    return;
  }

  if (i < cadena.length && cadena[i] === "0") {
    estado = "q4"; await activar("q4","t3");
  } else {
    di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
    resultado.textContent = "❌ Falta bloque final de 0^m.";
    resultado.style.color = "red";
    return;
  }

  let mFinalCounter = 0;
  while (i < cadena.length && cadena[i] === "0") {
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")}) ⊢ `;
    mFinalCounter++; i++;
    
    if (pila[pila.length-1] !== "B") {
      di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
      resultado.textContent = "❌ Desbalance (0^m más largo que 1^m). Pila esperada 'B'.";
      resultado.style.color = "red";
      return;
    }
    pila.pop();
    await activar("q4","b4");
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")})\n`;
  }
  
  if (mFinalCounter !== mPushCount || mFinalCounter < 1) {
    di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
    resultado.textContent = "❌ Desbalance (1^m o 0^m inválido, o longitudes diferentes).";
    resultado.style.color = "red";
    return;
  }

  if (i !== cadena.length) {
    di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
    resultado.textContent = "❌ Orden/estructura inválida. Quedaron símbolos sin leer.";
    resultado.style.color = "red";
    return;
  }

  if (pila.length === 1 && pila[0] === "Z") {
    estado = "qf"; await activar("qf","t4");
    di.textContent = pasos + `Fin: (${estado}, λ, Z)`;
    resultado.textContent = "✅ Cadena aceptada";
    resultado.style.color = "green";
  } else {
    di.textContent = pasos + `Fin: (${estado}, λ, ${pila.join("")})`;
    resultado.textContent = "❌ Cadena no aceptada. La pila no terminó en Z.";
    resultado.style.color = "red";
  }
}

function crearConexionesCircuito() {
  const container = document.querySelector('.circuit-container');
  if (!container) return;

  const conexionesExistentes = container.querySelectorAll('.circuit-connection');
  conexionesExistentes.forEach(conn => conn.remove());

  function obtenerPosicionNodo(selector) {
    const nodo = container.querySelector(selector);
    if (!nodo) return null;
    const rect = nodo.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top
    };
  }

  const conexiones = [
    ['.node1', '.node2'], ['.node2', '.node3'], ['.node3', '.node4'],
    ['.node5', '.node6'], ['.node6', '.node7'], ['.node7', '.node8'],
    ['.node9', '.node10'], ['.node10', '.node11'], ['.node11', '.node12'],
    ['.node1', '.node5'], ['.node5', '.node9'],
    ['.node2', '.node6'], ['.node6', '.node10'],
    ['.node3', '.node7'], ['.node7', '.node11'],
    ['.node4', '.node8'], ['.node8', '.node12']
  ];

  conexiones.forEach(([nodo1, nodo2], index) => {
    const pos1 = obtenerPosicionNodo(nodo1);
    const pos2 = obtenerPosicionNodo(nodo2);
    
    if (pos1 && pos2) {
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const distancia = Math.sqrt(dx * dx + dy * dy);
      const angulo = Math.atan2(dy, dx) * 180 / Math.PI;

      const linea = document.createElement('div');
      linea.className = 'circuit-connection';
      linea.style.width = distancia + 'px';
      linea.style.left = pos1.x + 'px';
      linea.style.top = pos1.y + 'px';
      linea.style.transform = `rotate(${angulo}deg)`;
      linea.style.animationDelay = (index * 0.2) + 's';
      
      container.appendChild(linea);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    crearConexionesCircuito();
  }, 100);
  
  window.addEventListener('resize', () => {
    setTimeout(() => {
      crearConexionesCircuito();
    }, 100);
  });
});
async function evaluarCadena() {
  const cadena = document.getElementById("cadena").value.trim();
  const resultado = document.getElementById("resultado");
  const di = document.getElementById("di");
  const pilaDiv = document.getElementById("pilaAnimada");

  // Estados: q0, q1, q2, q3, q4 (q4 es el estado final)
  const estados = ["q0", "q1", "q2", "q3", "q4"];
  // Transiciones: b0-b3 para bucles, t0-t3 para movimientos
  const transiciones = ["t0", "t1", "t2", "t3", "b0", "b1", "b2", "b3"];

  estados.forEach(function(e) {
    var el = document.getElementById(e);
    if (el) {
      el.classList.remove("activo");
    }
  });
  transiciones.forEach(function(t) {
    var tr = document.getElementById(t);
    if (tr) {
      tr.classList.remove("activa");
    }
  });

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
  let pasos = `-----------------------------------\nInicio: (q0, ${cadena}, Z)\n`;
  let pila = ["Z"];
  let nCountSimbolos = 0;
  let mCountSimbolos = 0;
  let nConsumidos = 0;
  let mConsumidos = 0;

  async function activar(e, t) {
    const estadoId = e;

    estados.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.classList.remove("activo");
      }
    });
    transiciones.forEach(function(id) {
      var tr = document.getElementById(id);
      if (tr) {
        tr.classList.remove("activa");
      }
    });
    var nodo = document.getElementById(estadoId);
    if (nodo) {
      nodo.classList.add("activo");
    }
    if (t) {
      var tr2 = document.getElementById(t);
      if (tr2) {
        tr2.classList.add("activa");
      }
    }
    actualizarPila();
    await new Promise(r => setTimeout(r, 450));
  }

  function actualizarPila() {
    if (!pilaDiv) return;
    pilaDiv.innerHTML = "";
    pila.slice().reverse().forEach(s => {
      const el = document.createElement("div");
      el.className = "pila-elemento";
      el.textContent = s;
      pilaDiv.appendChild(el);
    });
  }

  await activar("q0", "b0");

  // q0: 1* (Bucle)
  while (i < cadena.length && cadena[i] === "1") {
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")}) ⊢ `;
    i++;
    await activar("q0", "b0"); // q0, 1 -> q0, L/L
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")})\n`;
  }
  
  // q0 -> q1: Transición lambda (t0)
  estado = "q1";
  await activar("q1", "t0");

  // q1: 0^n y Push(nn)
  if (!(i < cadena.length && cadena[i] === "0")) {
    di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
    resultado.textContent = "❌ Cadena no aceptada. Debe contener al menos un '0' inicial (0^n, n≥1).";
    resultado.style.color = "red";
    return;
  }
  
  while (i < cadena.length && cadena[i] === "0") {
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")}) ⊢ `;
    pila.push("n"); pila.push("n"); // Push(nn)
    nCountSimbolos += 2;
    i++;
    await activar("q1", "b1"); // q1, 0 -> q1, L/Lnn
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")})\n`;
  }
  if (nCountSimbolos < 2) { 
     di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
     resultado.textContent = "❌ 0^n inválido (se requiere n ≥ 1).";
     resultado.style.color = "red";
     return;
  }

  // q1 -> q2: Transición para 1^m
  if (i < cadena.length && cadena[i] === "1") {
      estado = "q2";
      await activar("q2", "t1");
  } else {
      di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
      resultado.textContent = "❌ Falta bloque 1^m (m ≥ 1).";
      resultado.style.color = "red";
      return;
  }

  // q2: 1^m y 1^{2n} (Bucle Push m / Pop n)
  while (i < cadena.length && cadena[i] === "1") {
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")}) ⊢ `;

    const topePila = pila[pila.length - 1];

    if (topePila === "n") {
        // Lógica 1^{2n}: Pop(n)
        pila.pop();
        nConsumidos++;
        
    } else if (topePila === "m" || topePila === "Z") {
        // Lógica 1^m: Push(m)
        pila.push("m");
        mCountSimbolos++;
    } else {
        di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
        resultado.textContent = "❌ Símbolo de pila inesperado en q2.";
        resultado.style.color = "red";
        return;
    }

    i++;
    await activar("q2", "b2"); // q2, 1 -> q2, L/Lm o n/λ
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")})\n`;
  }

  // VALIDACIÓN DE 1^{2n}
  if (nConsumidos !== nCountSimbolos) {
      di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
      resultado.textContent = "❌ Desbalance 1^{2n}/0^n. No se consumieron todos los símbolos 'n'.";
      resultado.style.color = "red";
      return;
  }
  if (mCountSimbolos < 1) {
      di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
      resultado.textContent = "❌ 1^m inválido (m ≥ 1).";
      resultado.style.color = "red";
      return;
  }
  
  // q2 -> q3: Transición lambda (t2)
  estado = "q3";
  await activar("q3", "t2");
  
  // q3: 0^m (Pop m)
  if (i < cadena.length && cadena[i] === "0") {
     // Debe haber al menos un '0' para 0^m.
  } else {
     di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
     resultado.textContent = "❌ Falta bloque 0^m.";
     resultado.style.color = "red";
     return;
  }

  while (i < cadena.length && cadena[i] === "0") {
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")}) ⊢ `;

    if (pila[pila.length - 1] === "m") {
        pila.pop(); // Pop(m)
        mConsumidos++;
    } else {
        di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
        resultado.textContent = "❌ Desbalance 0^m/1^m. Pila esperada 'm'.";
        resultado.style.color = "red";
        return;
    }
    
    i++;
    await activar("q3", "b3"); // q3, 0 -> q3, m/λ
    pasos += `(${estado}, ${cadena.slice(i)}, ${pila.join("")})\n`;
  }

  // VALIDACIÓN DE 0^m
  if (mConsumidos !== mCountSimbolos) {
      di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
      resultado.textContent = "❌ Desbalance 0^m/1^m. Cantidad de símbolos 'm' no coincide.";
      resultado.style.color = "red";
      return;
  }

  // q3 -> q4: Transición lambda (Aceptación)
  if (i === cadena.length) {
      estado = "q4"; 
      if (pila.length === 1 && pila[0] === "Z") {
          pasos += `(${estado}, λ, ${pila.join("")}) ⊢ `;
          pila.pop(); // Pop(Z)
          await activar("q4", "t3"); // q3, λ -> q4, Z/λ
          pasos += `(q4, λ, λ)\n`;
          
          di.textContent = pasos + `Fin: (q4, λ, λ)`;
          resultado.textContent = "✅ Cadena aceptada";
          resultado.style.color = "green";
      } else {
          di.textContent = pasos + `Fin: (${estado}, λ, ${pila.join("")})`;
          resultado.textContent = "❌ Cadena no aceptada. La pila no terminó en Z.";
          resultado.style.color = "red";
      }
  } else {
      di.textContent = pasos + `Fin: (${estado}, ${cadena.slice(i)}, ${pila.join("")})`;
      resultado.textContent = "❌ Orden/estructura inválida. Quedaron símbolos sin leer.";
      resultado.style.color = "red";
  }
}

// === Funciones auxiliares (se mantienen sin cambios) ===
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

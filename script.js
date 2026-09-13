import { supabase } from "./supabaseClient.js";

// --- Evaluar presión y asignar estado ---
function evaluarPresion(sis, dia) {
  if (sis < 120 && dia < 80) return {estado: "Normal", clase: "normal"};
  if (sis >= 120 && sis <= 129 && dia < 80) return {estado: "Elevada", clase: "elevada"};
  if ((sis >= 130 && sis <= 139) || (dia >= 80 && dia <= 89)) return {estado: "Hipertensión Etapa 1", clase: "hip1"};
  if (sis >= 140 || dia >= 90) return {estado: "Hipertensión Etapa 2", clase: "hip2"};
  return {estado: "Revisar", clase: ""};
}

function actualizarEstados() {
  const filas = document.querySelectorAll("#tablaPresion tbody tr");
  filas.forEach(fila => {
    const sis = parseInt(fila.cells[2].querySelector("input").value);
    const dia = parseInt(fila.cells[3].querySelector("input").value);
    const estadoCelda = fila.cells[5];
    fila.className = "";
    if (!isNaN(sis) && !isNaN(dia)) {
      const resultado = evaluarPresion(sis, dia);
      estadoCelda.textContent = resultado.estado;
      fila.classList.add(resultado.clase);
    } else {
      estadoCelda.textContent = "";
    }
  });
}

// --- Añadir fila editable ---
function agregarFila(fecha="", hora="", sis="", dia="", pul="", obs="", id=null) {
  const tbody = document.querySelector("#tablaPresion tbody");
  const fila = document.createElement("tr");

  if (id) fila.dataset.id = String(id);

  fila.innerHTML = `
    <td><input type="date" value="${fecha}"></td>
    <td><input type="time" value="${hora}"></td>
    <td><input type="number" min="50" max="250" value="${sis}"></td>
    <td><input type="number" min="30" max="150" value="${dia}"></td>
    <td><input type="number" min="30" max="200" value="${pul}"></td>
    <td class="estado"></td>
    <td><textarea rows="6" class="observaciones">${obs}</textarea></td>
    <td><button class="btnBorrarFila"><i class="fas fa-trash"></i> Borrar</button></td>
  `;
  tbody.appendChild(fila);

  fila.querySelectorAll("input, textarea").forEach(input => {
    input.addEventListener("input", () => {
      actualizarEstados();
      actualizarResumen();
    });
  });

  fila.querySelector(".btnBorrarFila").addEventListener("click", () => {
    const id = fila.dataset.id;
    if (id) {
      borrarRegistro(id);
    } else if (confirm("¿Seguro que quieres borrar este registro sin guardar?")) {
      fila.remove();
      actualizarEstados();
      actualizarGrafico();
      actualizarResumen();
    }
  });

  actualizarEstados();
}

// --- Gráfico ---
const ctx = document.getElementById('graficoPresion').getContext('2d');
const grafico = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'Sistólica', data: [], borderColor: 'red', yAxisID: 'y' },
      { label: 'Diastólica', data: [], borderColor: 'blue', yAxisID: 'y' },
      { label: 'Pulso', data: [], borderColor: 'green', yAxisID: 'y1' }
    ]
  },
  options: {
    responsive: true,
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Presión (mmHg)' } },
      y1: { beginAtZero: true, position: 'right', title: { display: true, text: 'Pulso (bpm)' } }
    }
  }
});

function actualizarGrafico() {
  const filas = document.querySelectorAll("#tablaPresion tbody tr");
  const fechas = [], sistolica = [], diastolica = [], pulso = [];
  filas.forEach(fila => {
    const fecha = fila.cells[0].querySelector("input").value || "";
    const hora = fila.cells[1].querySelector("input").value || "";
    const sis = parseInt(fila.cells[2].querySelector("input").value);
    const dia = parseInt(fila.cells[3].querySelector("input").value);
    const pul = parseInt(fila.cells[4].querySelector("input").value);
    if (!isNaN(sis) && !isNaN(dia) && !isNaN(pul)) {
      fechas.push(fecha + " " + hora);
      sistolica.push(sis);
      diastolica.push(dia);
      pulso.push(pul);
    }
  });
  grafico.data.labels = fechas;
  grafico.data.datasets[0].data = sistolica;
  grafico.data.datasets[1].data = diastolica;
  grafico.data.datasets[2].data = pulso;
  grafico.update();
}

// --- Supabase CRUD ---
const TABLA = "registros_presion";

async function guardarRegistro(fila) {
  const id = fila.dataset.id;
  const data = {
    fecha: fila.cells[0].querySelector("input").value || null,
    hora: fila.cells[1].querySelector("input").value || null,
    sistolica: parseInt(fila.cells[2].querySelector("input").value) || null,
    diastolica: parseInt(fila.cells[3].querySelector("input").value) || null,
    pulso: parseInt(fila.cells[4].querySelector("input").value) || null,
    estado: fila.cells[5].textContent || null,
    observaciones: fila.cells[6].querySelector("textarea").value || null
  };

  let resultado;
  if (id) {
    resultado = await supabase.from(TABLA).update(data).eq("id", id);
  } else {
    resultado = await supabase.from(TABLA).insert(data).select().single();
    if (resultado.data) fila.dataset.id = resultado.data.id;
  }

  if (resultado.error) {
    console.error("Error guardando registro:", resultado.error);
    alert(`No se pudo guardar: ${resultado.error.message}`);
    return false;
  }
  return true;
}

async function cargarRegistros() {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error) {
    console.error("Error cargando registros:", error);
    alert(`No se pudieron cargar los registros: ${error.message}`);
    return;
  }

  const tbody = document.querySelector("#tablaPresion tbody");
  tbody.innerHTML = "";

  data.forEach(registro => {
    agregarFila(
      registro.fecha || "",
      registro.hora || "",
      registro.sistolica || "",
      registro.diastolica || "",
      registro.pulso || "",
      registro.observaciones || "",
      registro.id
    );
  });

  actualizarEstados();
  actualizarGrafico();
  actualizarResumen();
}

async function borrarRegistro(id) {
  if (!id || !confirm("¿Seguro que quieres borrar este registro?")) return;

  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) {
    console.error("Error eliminando registro:", error);
    alert(`No se pudo eliminar: ${error.message}`);
    return;
  }

  alert("Registro eliminado");
  await cargarRegistros();
}

// --- Calcular promedios y mostrar resumen ---
function actualizarResumen() {
  const filas = document.querySelectorAll("#tablaPresion tbody tr");
  let totalSis = 0, totalDia = 0, totalPul = 0, count = 0;
  const estados = {};

  filas.forEach(fila => {
    const sis = parseInt(fila.cells[2].querySelector("input").value);
    const dia = parseInt(fila.cells[3].querySelector("input").value);
    const pul = parseInt(fila.cells[4].querySelector("input").value);
    const estado = fila.cells[5].textContent;

    if (!isNaN(sis) && !isNaN(dia) && !isNaN(pul)) {
      totalSis += sis;
      totalDia += dia;
      totalPul += pul;
      count++;
      estados[estado] = (estados[estado] || 0) + 1;
    }
  });

  if (count > 0) {
    document.getElementById("avgSis").textContent = (totalSis / count).toFixed(1);
    document.getElementById("avgDia").textContent = (totalDia / count).toFixed(1);
    document.getElementById("avgPul").textContent = (totalPul / count).toFixed(1);

    const estadoPred = Object.keys(estados).reduce((a, b) => estados[a] > estados[b] ? a : b);
    document.getElementById("estadoPred").textContent = estadoPred;

    let tip = "";
    if (estadoPred.includes("Normal")) {
      tip = "Mantén hábitos saludables: ejercicio regular, dieta balanceada y control del estrés.";
      document.getElementById("estadoPred").className = "normal";
    } else if (estadoPred.includes("Elevada")) {
      tip = "Reduce consumo de sal, controla el peso y evita el exceso de alcohol.";
      document.getElementById("estadoPred").className = "elevada";
    } else if (estadoPred.includes("Hipertensión Etapa 1")) {
      tip = "Consulta a tu médico para seguimiento y posibles ajustes de tratamiento.";
      document.getElementById("estadoPred").className = "hip1";
    } else if (estadoPred.includes("Hipertensión Etapa 2")) {
      tip = "Requiere atención médica inmediata y control estricto.";
      document.getElementById("estadoPred").className = "hip2";
    }
    document.getElementById("tipSalud").textContent = tip;
  }
}

// --- Exportar CSV ---
function exportarCSV() {
  const filas = document.querySelectorAll("#tablaPresion tbody tr");
  let csv = "Fecha,Hora,Sistólica,Diastólica,Pulso,Estado,Observaciones\n";
  filas.forEach(fila => {
    const fecha = fila.cells[0].querySelector("input").value;
    const hora = fila.cells[1].querySelector("input").value;
    const sis = fila.cells[2].querySelector("input").value;
    const dia = fila.cells[3].querySelector("input").value;
    const pul = fila.cells[4].querySelector("input").value;
    const estado = fila.cells[5].textContent;
    const obs = fila.cells[6].querySelector("textarea").value;
    if (fecha || hora || sis || dia || pul || obs) {
      csv += `${fecha},${hora},${sis},${dia},${pul},${estado},${obs}\n`;
    }
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "presion.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// --- Enlazar botones ---
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnFila").addEventListener("click", () => {
    agregarFila();
    actualizarResumen();
  });

  document.getElementById("btnGrafico").addEventListener("click", () => {
    actualizarGrafico();
    actualizarResumen();
  });

  document.getElementById("btnGuardar").addEventListener("click", async () => {
    const filas = document.querySelectorAll("#tablaPresion tbody tr");
    for (const fila of filas) {
      await guardarRegistro(fila);
    }
    await cargarRegistros();
    alert("Registros guardados correctamente");
    actualizarResumen();
  });

  document.getElementById("btnCargar").addEventListener("click", async () => {
    await cargarRegistros();
    actualizarResumen();
  });

  document.getElementById("btnExcel").addEventListener("click", exportarExcel);

  // Inicializa cargando registros desde BD
  cargarRegistros();
  actualizarResumen();
});

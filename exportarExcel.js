async function exportarExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Registros");

  // Definir columnas con ancho
  sheet.columns = [
    { header: "Fecha", width: 15 },
    { header: "Hora", width: 12 },
    { header: "Sistólica (mmHg)", width: 18 },
    { header: "Diastólica (mmHg)", width: 18 },
    { header: "Pulso (bpm)", width: 15 },
    { header: "Estado", width: 22 },
    { header: "Observaciones", width: 70 }
  ];

  // Estilo de encabezados
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { top:{style:"thin"}, left:{style:"thin"}, bottom:{style:"thin"}, right:{style:"thin"} };
  });

  // Tomar datos de la tabla HTML
  const filas = document.querySelectorAll("#tablaPresion tbody tr");
  filas.forEach(fila => {
    const fecha = fila.cells[0].querySelector("input")?.value || "";
    const hora = fila.cells[1].querySelector("input")?.value || "";
    const sis = parseInt(fila.cells[2].querySelector("input")?.value || "0", 10);
    const dia = parseInt(fila.cells[3].querySelector("input")?.value || "0", 10);
    const pul = parseInt(fila.cells[4].querySelector("input")?.value || "0", 10);
    const estado = fila.cells[5].textContent.trim();
    const obs = fila.cells[6].querySelector("textarea")?.value || "";

    const datos = [fecha, hora, sis, dia, pul, estado, obs];
    sheet.addRow(datos);

    // Ajustar observaciones
    const nuevaFila = sheet.lastRow;
    const estadoCell = nuevaFila.getCell(6);
    const obsCell = nuevaFila.getCell(7);

    estadoCell.alignment = { wrapText: true, vertical: "middle" };
    obsCell.alignment = { wrapText: true, vertical: "top" };

    // Altura dinámica según longitud de observaciones
    const lineas = Math.ceil(obs.length / 50);
    nuevaFila.height = Math.max(20, lineas * 20);
  });

// Colores condicionales en Estado
sheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return; // saltar encabezado
  const estadoCell = row.getCell(6);
  const estado = estadoCell.value || "";

  if (estado.includes("Normal")) {
    estadoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00FF00" } }; // verde
  } else if (estado.includes("Elevada")) {
    estadoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } }; // amarillo
  } else if (estado.includes("Hipertensión Etapa 1")) {
    estadoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC000" } }; // anaranjado
    estadoCell.font = { color: { argb: "FFFFFFFF" }, bold: true };
  } else if (estado.includes("Hipertensión Etapa 2")) {
    estadoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } }; // rojo
    estadoCell.font = { color: { argb: "FFFFFFFF" }, bold: true };
  }
});


  // Exportar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/octet-stream" }), "RegistrosPresion.xlsx");
}

// Vincular al botón
document.getElementById("btnCSV").addEventListener("click", exportarExcel);

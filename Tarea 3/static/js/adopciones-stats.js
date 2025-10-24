document.addEventListener("DOMContentLoaded", async () => {
    
  // grafico linealavisos por día
  const d1 = await (await fetch("/api/stats/avisos-por-dia")).json();
  Highcharts.chart("chart-dia", {
    title: { text: "Avisos por día" },
    xAxis: { type: "datetime" },
    yAxis: { title: { text: "Cantidad" } },
    series: [{ name: "Avisos", data: d1.map(p => [Date.parse(p.date), p.count]) }]
  });

  // grafico torta por tipo
  const d2 = await (await fetch("/api/stats/por-tipo")).json();
  Highcharts.chart("chart-tipo", {
    chart: { type: "pie" },
    title: { text: "Avisos por tipo" },
    series: [{ name: "Avisos", data: Object.entries(d2).map(([k,v]) => ({ name:k, y:v })) }]
  });

  // grafico barras por mes y tipo
  const d3 = await (await fetch("/api/stats/mes-tipo")).json();
  Highcharts.chart("chart-mes-tipo", {
    chart: { type: "column" },
    title: { text: "Avisos por mes y tipo" },
    xAxis: { categories: d3.map(r => r.month) },
    yAxis: { title: { text: "Cantidad" } },
    series: [
      { name: "Gato", data: d3.map(r => r.gato) },
      { name: "Perro", data: d3.map(r => r.perro) }
    ]
  });
});

// --- JS/acustica.js ---

export function dibujarGraficaFrecuencias(contenedorId, datosAcusticos) {
    // 1. Limpiar gráfico anterior si existe
    d3.select(contenedorId).selectAll("*").remove();

    // 2. Configurar medidas y márgenes
    const margin = {top: 20, right: 30, bottom: 40, left: 50};
    const width = 600 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = d3.select(contenedorId)
      .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 3. Ejes X (Especies) e Y (Hertz)
    const x = d3.scaleBand()
      .range([0, width])
      .domain(datosAcusticos.map(d => d.especie))
      .padding(0.3);
    
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
        .style("fill", "#e2e8f0")
        .style("font-size", "14px");

    const y = d3.scaleLinear()
      .domain([0, d3.max(datosAcusticos, d => d.hertz) + 10]) 
      .range([height, 0]);
      
    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
        .style("fill", "#e2e8f0");

    // 4. Dibujar las barras
    svg.selectAll("mybar")
      .data(datosAcusticos)
      .enter()
      .append("rect")
        .attr("x", d => x(d.especie))
        .attr("y", d => y(d.hertz))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.hertz))
        // Resaltar a la ballena de 52Hz en color rosa, las demás en cyan
        .attr("fill", d => d.especie === "Ballena 52Hz" ? "var(--accent-pink)" : "var(--accent-cyan)")
        .attr("rx", 4); // Bordes redondeados
}
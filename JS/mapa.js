// --- JS/mapa.js ---
let projection;
const COLOR_SUPERFICIE = { r: 10, g: 25, b: 47 }; 
const COLOR_ABISAL = { r: 2, g: 5, b: 10 };      

export function inicializarMapa(svgElementId, geoData) {
    const width = 800;
    const height = 500;
    const svg = d3.select(svgElementId).append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    projection = d3.geoMercator()
        .center([-125, 35])
        .scale(600)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    svg.append("g").selectAll("path").data(geoData.features).enter().append("path")
       .attr("fill", "#2a3b4c").attr("d", path).style("stroke", "#111");

    return svg;
}

export function actualizarFondoPorProfundidad(profundidad) {
    const maxProfundidad = 500; 
    const profSegura = Math.min(Math.max(profundidad, 0), maxProfundidad);
    const porcentaje = profSegura / maxProfundidad;

    const r = Math.round(COLOR_SUPERFICIE.r - ((COLOR_SUPERFICIE.r - COLOR_ABISAL.r) * porcentaje));
    const g = Math.round(COLOR_SUPERFICIE.g - ((COLOR_SUPERFICIE.g - COLOR_ABISAL.g) * porcentaje));
    const b = Math.round(COLOR_SUPERFICIE.b - ((COLOR_SUPERFICIE.b - COLOR_ABISAL.b) * porcentaje));

    document.body.style.transition = "background-color 1s ease";
    document.body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    
    const infoProfun = document.getElementById('profundidad-info');
    if(infoProfun) infoProfun.innerText = `Profundidad de inmersión: ${profSegura} metros`;
}

export function dibujarPuntos(svg, ballenasData, mesStr, funcionAlHacerClic) {
    svg.selectAll("circle").remove();
    const datosParaDibujar = ballenasData.filter(d => d.fecha && d.fecha.split('-')[1] <= mesStr);

    svg.selectAll("circle")
        .data(datosParaDibujar)
        .enter()
        .append("circle")
        .attr("class", d => (d.fecha.split('-')[1] === mesStr) ? "current-point" : "historical-point")
        .attr("cx", d => projection([d.lon, d.lat])[0])
        .attr("cy", d => projection([d.lon, d.lat])[1])
        .attr("r", d => (d.fecha.split('-')[1] === mesStr) ? 6 : 2)
        .on("click", (event, d) => {
             funcionAlHacerClic(d);
             actualizarFondoPorProfundidad(d.profundidad);
        });
}
let projection;

const COLOR_SUPERFICIE = { r: 10, g: 150, b: 180 }; 
const COLOR_ABISAL = { r: 2, g: 8, b: 20 };      

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

export function actualizarFondoPorProfundidad(profundidadMaxima) {
    const maxProfundidad = 500; 
    const profSegura = Math.min(Math.max(profundidadMaxima, 0), maxProfundidad);
    const porcentaje = profSegura / maxProfundidad;

    const r = Math.round(COLOR_SUPERFICIE.r - ((COLOR_SUPERFICIE.r - COLOR_ABISAL.r) * porcentaje));
    const g = Math.round(COLOR_SUPERFICIE.g - ((COLOR_SUPERFICIE.g - COLOR_ABISAL.g) * porcentaje));
    const b = Math.round(COLOR_SUPERFICIE.b - ((COLOR_SUPERFICIE.b - COLOR_ABISAL.b) * porcentaje));

    document.body.style.transition = "background 1s ease";
    document.body.style.background = `rgb(${r}, ${g}, ${b})`;
    
    const etiquetaZona = document.getElementById('zona-oceanica');
    if(etiquetaZona) {
        if (profSegura <= 200) {
            etiquetaZona.innerText = "Zona Epipelágica (Luz solar)";
            etiquetaZona.style.color = "var(--accent-cyan)";
        } else {
            etiquetaZona.innerText = "Zona Mesopelágica (Penumbra)";
            etiquetaZona.style.color = "var(--accent-pink)";
        }
    }
}

// AHORA EXPORTAMOS LA FUNCIÓN PARA PODER USARLA EN EL HOVER
export function obtenerRegionGeografica(lat, lon) {
    if (!lat || !lon) return "Ubicación no disponible";
    
    if (lat >= 50) return "Golfo de Alaska / Mar de Bering";
    if (lat >= 42 && lat < 50) return "Costa del Pacífico Noroeste (EEUU)";
    if (lat >= 32.5 && lat < 42) return "Costa de California (EEUU)";
    
    if (lat >= 23 && lat < 32.5) {
        if (lon > -114) return "Golfo de California (Mar de Cortés)";
        return "Costa Occidental de Baja California (México)";
    }
    
    if (lat > 5 && lat < 23) return "Pacífico Tropical (Domo de Costa Rica / Sur de México)";
    if (lat <= 5 && lat >= -5) return "Aguas Ecuatoriales (Islas Galápagos)";
    
    return "Océano Pacífico Central";
}

export function dibujarPuntos(svg, ballenasData, mesStr, funcionAlHacerClic) {
    svg.selectAll("circle").remove();
    
    const datosParaDibujar = ballenasData.filter(d => d.fecha && d.fecha.split('-')[1] <= mesStr);
    const datosMesActual = datosParaDibujar.filter(d => d.fecha.split('-')[1] === mesStr);

    let minProf = 0;
    let maxProf = 0;
    let avgLat = 0;
    let avgLon = 0;
    let textoUbicacion = "Sin avistamientos registrados este mes";
    let ballenaSuperficial = null;
    let ballenaProfunda = null;
    
    if (datosMesActual.length > 0) {
        minProf = d3.min(datosMesActual, d => d.profundidad);
        maxProf = d3.max(datosMesActual, d => d.profundidad);
        
        // Atrapamos a las ballenas responsables de estos récords
        ballenaSuperficial = datosMesActual.find(d => d.profundidad === minProf);
        ballenaProfunda = datosMesActual.find(d => d.profundidad === maxProf);
        
        avgLat = d3.mean(datosMesActual, d => d.lat);
        avgLon = d3.mean(datosMesActual, d => d.lon);
        textoUbicacion = obtenerRegionGeografica(avgLat, avgLon);
    }

    const uiMin = document.getElementById('prof-min');
    const uiMax = document.getElementById('prof-max');
    const uiUbicacion = document.getElementById('ubicacion-geografica');
    
    if(uiMin) uiMin.innerText = `${minProf} m`;
    if(uiMax) uiMax.innerText = `${maxProf} m`;
    if(uiUbicacion) uiUbicacion.innerText = textoUbicacion;

    const tarjetaSup = document.getElementById('tarjeta-superficial');
    const tarjetaProf = document.getElementById('tarjeta-profunda');
    
    // Pegamos la latitud y longitud exacta en las tarjetas para que el hover las lea
    if(tarjetaSup && ballenaSuperficial) {
        tarjetaSup.dataset.prof = minProf;
        tarjetaSup.dataset.lat = ballenaSuperficial.lat;
        tarjetaSup.dataset.lon = ballenaSuperficial.lon;
    }
    
    if(tarjetaProf && ballenaProfunda) {
        tarjetaProf.dataset.prof = maxProf;
        tarjetaProf.dataset.lat = ballenaProfunda.lat;
        tarjetaProf.dataset.lon = ballenaProfunda.lon;
    }

    document.body.dataset.profActual = maxProf;
    // Guardamos la ubicación promedio del mes para poder regresar a ella
    document.body.dataset.ubicacionActual = textoUbicacion; 
    
    actualizarFondoPorProfundidad(maxProf);

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
             document.body.dataset.profActual = d.profundidad;
             actualizarFondoPorProfundidad(d.profundidad);
             if (uiUbicacion) uiUbicacion.innerText = obtenerRegionGeografica(d.lat, d.lon);
        });
}
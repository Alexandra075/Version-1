export function inicializarAcustica(datosAcusticos) {
    const contenedor = d3.select("#grafica-frecuencias");
    contenedor.selectAll("*").remove(); 

    // Tomamos el ancho y alto real del contenedor en pantalla completa
    const divWidth = document.getElementById("grafica-frecuencias").clientWidth || 1000;
    const divHeight = document.getElementById("grafica-frecuencias").clientHeight || 500;
    
    const margin = { top: 40, right: 250, bottom: 60, left: 80 };
    const width = divWidth - margin.left - margin.right;
    const height = divHeight - margin.top - margin.bottom;

    const svg = contenedor.append("svg")
        .attr("viewBox", `0 0 ${divWidth} ${divHeight}`)
        .attr("width", "100%")
        .attr("height", "100%")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // EJE X: Escala Logarítmica para Frecuencias (Hertz)
    const x = d3.scaleLog()
        .domain([10, 2000])
        .range([0, width]);

    // EJE Y: Escala Lineal para Volumen (Decibelios)
    const y = d3.scaleLinear()
        .domain([140, 200])
        .range([height, 0]);

    // Dibujamos Eje X
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5, "~s"))
        .selectAll("text")
        .style("fill", "#8892b0")
        .style("font-size", "14px");
        
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .style("text-anchor", "middle")
        .style("fill", "#e2e8f0")
        .style("font-size", "16px")
        .text("Frecuencias (Hertz)");

    // Dibujamos Eje Y
    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("fill", "#8892b0")
        .style("font-size", "14px");
        
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -(height / 2))
        .style("text-anchor", "middle")
        .style("fill", "#e2e8f0")
        .style("font-size", "16px")
        .text("Intensidad Sonora (Decibelios dB)");

    // Cuadrícula sutil de fondo
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.1);

    // Paleta de colores para las líneas
    const colores = {
        "minke": "#ffea00",
        "jorobada": "#00e676",
        "52hz": "var(--accent-pink)",
        "azul": "var(--accent-cyan)",
        "aleta": "#b388ff"
    };

    // GENERAMOS LOS PUNTOS DE LA CURVA PARA CADA BALLENA (Efecto "Pico")
    const generadorLinea = d3.line()
        .x(d => x(d.hz))
        .y(d => y(d.db))
        .curve(d3.curveMonotoneX); 

    // --- AQUÍ ESTÁ EL TEMPORIZADOR QUE SALVA LA TARJETA ---
    let timeoutTooltip; 

    const lineasData = datosAcusticos.map(d => {
        const hz = d.hertz_grafica;
        const db = d.volumen_maximo_db;
        return {
            info: d,
            color: colores[d.id] || "#ffffff",
            puntos: [
                { hz: Math.max(10, hz * 0.4), db: 145 }, 
                { hz: hz * 0.7, db: db - 15 },           
                { hz: hz, db: db, isPeak: true },        
                { hz: hz * 1.4, db: db - 15 },           
                { hz: Math.min(2000, hz * 2.5), db: 145 }
            ]
        };
    });

    // DIBUJAMOS LAS LÍNEAS Y PUNTOS INTERACTIVOS
    lineasData.forEach(linea => {
        svg.append("path")
            .datum(linea.puntos)
            .attr("fill", "none")
            .attr("stroke", linea.color)
            .attr("stroke-width", 3)
            .attr("opacity", 0.7)
            .attr("d", generadorLinea);
            
        const pico = linea.puntos.find(p => p.isPeak);
        svg.append("circle")
            .attr("cx", x(pico.hz))
            .attr("cy", y(pico.db))
            .attr("r", 7)
            .attr("fill", linea.color)
            .attr("stroke", "#020c1b")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .on("mouseover", function() {
                // Si regresamos al punto, cancelamos la orden de desaparecer la tarjeta
                clearTimeout(timeoutTooltip); 
                d3.select(this).attr("r", 12).attr("stroke", "#ffffff");
                mostrarInfoAcusticaFlotante(linea.info, x(pico.hz), y(pico.db));
            })
            .on("mouseout", function() {
                d3.select(this).attr("r", 7).attr("stroke", "#020c1b");
                
                // Le damos al usuario 400 milisegundos para mover el ratón hacia la tarjeta
                timeoutTooltip = setTimeout(() => {
                    document.getElementById('tooltip-acustica').style.display = 'none';
                }, 400);
            });
    });

    // --- LEYENDA LATERAL ---
    const leyenda = svg.append("g")
        .attr("transform", `translate(${width + 30}, 20)`);
        
    lineasData.forEach((linea, i) => {
        leyenda.append("rect")
            .attr("x", 0)
            .attr("y", i * 35)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", linea.color)
            .attr("rx", 3);
            
        leyenda.append("text")
            .attr("x", 25)
            .attr("y", i * 35 + 12)
            .style("fill", "#e2e8f0")
            .style("font-size", "14px")
            .text(linea.info.nombre_comun);
    });

    // --- GESTIÓN DEL TOOLTIP Y EL AUDIO ---
    const reproductorAudio = new Audio();
    
    let tooltip = document.getElementById('tooltip-acustica');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'tooltip-acustica';
        tooltip.style.position = 'absolute';
        tooltip.style.background = 'rgba(10, 25, 47, 0.95)';
        tooltip.style.border = '1px solid var(--accent-cyan)';
        tooltip.style.padding = '15px';
        tooltip.style.borderRadius = '12px';
        tooltip.style.pointerEvents = 'auto'; // Permitimos que la tarjeta sea "clickeable"
        tooltip.style.display = 'none';
        tooltip.style.width = '300px';
        tooltip.style.color = '#fff';
        tooltip.style.zIndex = '100';
        document.body.appendChild(tooltip);
        
        // Si el ratón logra entrar a la tarjeta, cancelamos el temporizador para que no se borre
        tooltip.addEventListener('mouseenter', () => {
            clearTimeout(timeoutTooltip);
        });
        
        // Si el usuario saca el ratón de la tarjeta, ahora sí la desaparecemos
        tooltip.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    }

    function mostrarInfoAcusticaFlotante(d, px, py) {
        const grafRect = document.getElementById("grafica-frecuencias").getBoundingClientRect();
        
        // Colocamos la tarjeta un poquito más cerca del punto para que sea más fácil alcanzarla
        tooltip.style.left = (grafRect.left + px + margin.left + 15) + 'px';
        tooltip.style.top = (grafRect.top + py + margin.top - 40) + 'px';
        tooltip.style.display = 'block';
        tooltip.style.borderColor = colores[d.id];

        tooltip.innerHTML = `
            <h3 style="color: ${colores[d.id]}; margin-bottom: 8px;">${d.nombre_comun}</h3>
            <p style="font-size: 13px; margin-bottom: 5px;"><strong>Frecuencia:</strong> ${d.rango_hz}</p>
            <p style="font-size: 13px; margin-bottom: 5px;"><strong>Intensidad:</strong> ${d.volumen_maximo_db} dB</p>
            <p style="font-size: 12px; margin-bottom: 15px; color: #8892b0;">${d.tipo_sonido}</p>
            <button id="btn-reproducir-flotante" style="width: 100%; padding: 8px; background: ${colores[d.id]}; color: #020c1b; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                ▶ Escuchar Canto
            </button>
        `;

        // Usamos onclick directo para que no se encimen reproducciones viejas si cambias de ballena
        document.getElementById("btn-reproducir-flotante").onclick = function() {
            if(reproductorAudio.src !== window.location.href + d.archivo_audio && reproductorAudio.src !== d.archivo_audio) {
                 reproductorAudio.src = d.archivo_audio;
            }
            if (reproductorAudio.paused) {
                reproductorAudio.play();
                this.innerText = "⏸ Pausar Canto";
            } else {
                reproductorAudio.pause();
                this.innerText = "▶ Escuchar Canto";
            }
        };
    }
}
export function inicializarAcustica(datosAcusticos) {
    const contenedorGrafica = d3.select("#grafica-frecuencias");
    contenedorGrafica.selectAll("*").remove(); 

    const margin = { top: 30, right: 30, bottom: 120, left: 60 };
    // Usamos medidas base relativas al viewBox para evitar el error de ancho = 0
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = contenedorGrafica
        .append("svg")
        .attr("viewBox", `0 0 800 400`)
        .style("width", "100%")
        .style("height", "100%")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .range([0, width])
        .domain(datosAcusticos.map(d => d.nombre_comun))
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("fill", "#8892b0")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .attr("transform", "translate(-10,10)rotate(-20)")
        .style("text-anchor", "end");

    // Escala Logarítmica para representar mejor de 15 Hz hasta 1500 Hz
    const y = d3.scaleLog()
        .domain([10, 2000])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y).ticks(5, "~s"))
        .selectAll("text")
        .style("fill", "#8892b0")
        .style("font-size", "12px");

    svg.selectAll("mybar")
        .data(datosAcusticos)
        .enter()
        .append("rect")
        .attr("x", d => x(d.nombre_comun))
        .attr("y", d => y(d.hertz_grafica))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.hertz_grafica))
        .attr("fill", d => d.id === "52hz" ? "var(--accent-pink)" : "var(--accent-cyan)")
        .attr("rx", 5) 
        .style("opacity", 0.8)
        .on("mouseover", function(event, d) {
            d3.select(this).style("opacity", 1).style("cursor", "pointer");
            mostrarInfoAcustica(d);
        })
        .on("mouseout", function(event, d) {
            d3.select(this).style("opacity", 0.8);
        });

    const reproductorAudio = new Audio();
    
    function mostrarInfoAcustica(d) {
        let infoDiv = document.getElementById("info-acustica-detalle");
        if (!infoDiv) {
            infoDiv = document.createElement("div");
            infoDiv.id = "info-acustica-detalle";
            infoDiv.style.marginTop = "20px";
            infoDiv.style.padding = "20px";
            infoDiv.style.background = "var(--panel-bg)";
            infoDiv.style.borderRadius = "var(--border-radius-lg)";
            infoDiv.style.border = "1px solid var(--accent-cyan)";
            document.getElementById("grafica-frecuencias").parentElement.appendChild(infoDiv);
        }

        infoDiv.innerHTML = `
            <h3 style="color: var(--accent-pink); margin-bottom: 10px;">${d.nombre_comun} 
                <button id="btn-reproducir-audio" style="margin-left:15px; padding: 5px 15px; background: var(--accent-cyan); color: #000; border: none; border-radius: 15px; cursor: pointer;">
                    ▶ Escuchar
                </button>
            </h3>
            <p style="margin-bottom: 5px;"><strong>Frecuencia Real:</strong> ${d.rango_hz}</p>
            <p style="margin-bottom: 5px;"><strong>Intensidad:</strong> ${d.volumen_maximo_db} dB</p>
            <p style="margin-bottom: 5px;"><strong>Tipo de sonido:</strong> ${d.tipo_sonido}</p>
            <p><strong>Propósito:</strong> ${d.proposito}</p>
        `;

        document.getElementById("btn-reproducir-audio").addEventListener('click', function() {
            if(reproductorAudio.src !== window.location.href + d.archivo_audio && reproductorAudio.src !== d.archivo_audio) {
                 reproductorAudio.src = d.archivo_audio;
            }
            if (reproductorAudio.paused) {
                reproductorAudio.play();
                this.innerText = "⏸ Pausar";
            } else {
                reproductorAudio.pause();
                this.innerText = "▶ Escuchar";
            }
        });
    }
}
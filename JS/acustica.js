export function inicializarAcustica(datosAcusticos) {
    const contenedorGrafica = d3.select("#grafica-frecuencias");
    contenedorGrafica.selectAll("*").remove();

    // SOLUCIÓN 1: Declaramos el reproductor globalmente para que el botón pueda acceder a él
    const reproductorAudio = new Audio();
    
    // SOLUCIÓN 2: Creamos UN SOLO contexto de audio para todas las ballenas, evitando que el navegador nos bloquee
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const margin = { top: 30, right: 30, bottom: 120, left: 60 };
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

    // TEXTOS DEL EJE X CON BLANCO PURO Y SOMBRA NEGRA
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("fill", "#ffffff")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("text-shadow", "2px 2px 5px rgba(0,0,0,1)")
        .attr("transform", "translate(-10,10)rotate(-20)")
        .style("text-anchor", "end");

    const y = d3.scaleLog()
        .domain([10, 2000])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y).ticks(5, "~s"))
        .selectAll("text")
        .style("fill", "#fbfcfd")
        .style("font-size", "12px");

    // Convertimos la lógica de dibujado en una función asíncrona
    async function dibujarGraficasReales() {
        
        for (let d of datosAcusticos) {
            d.ondaReal = await procesarAudioReal(d.archivo_audio, 100); 
        }

        function generarTrazadoReal(d, anchoColumna) {
            const alturaMaxima = height - y(d.hertz_grafica); 
            const puntos = d.ondaReal.length;
            
            const generadorArea = d3.area()
                .x((valor, indice) => (indice / (puntos - 1)) * anchoColumna) 
                .y0(height) 
                .y1(valor => height - (valor * alturaMaxima)) 
                .curve(d3.curveBasis); 

            return generadorArea(d.ondaReal);
        }

        svg.selectAll("ondasReales")
            .data(datosAcusticos)
            .enter()
            .append("path")
            .attr("transform", d => `translate(${x(d.nombre_comun)}, 0)`)
            .attr("d", d => generarTrazadoReal(d, x.bandwidth()))
            .attr("fill", d => d.id === "52hz" ? "rgba(255, 0, 127, 0.4)" : "rgba(0, 229, 255, 0.4)")
            .attr("stroke", d => d.id === "52hz" ? "var(--accent-pink)" : "var(--accent-cyan)")
            .attr("stroke-width", 2)
            .style("opacity", 0.8)
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .on("mouseover", function(event, d) {
                d3.select(this)
                  .style("opacity", 1)
                  .attr("fill", d => d.id === "52hz" ? "rgba(255, 0, 127, 0.8)" : "rgba(0, 229, 255, 0.8)");
                mostrarInfoAcustica(d);
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                  .style("opacity", 0.8)
                  .attr("fill", d => d.id === "52hz" ? "rgba(255, 0, 127, 0.4)" : "rgba(0, 229, 255, 0.4)");
            });
    }

    dibujarGraficasReales();

    async function procesarAudioReal(urlAudio, puntosVisuales = 100) {
        try {
            const respuesta = await fetch(urlAudio);
            const arrayBuffer = await respuesta.arrayBuffer();
            // Usamos el contexto de audio global que creamos arriba
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            const datosPuros = audioBuffer.getChannelData(0); 
            
            const tamanoBloque = Math.floor(datosPuros.length / puntosVisuales);
            const datosFiltrados = [];
            
            for (let i = 0; i < puntosVisuales; i++) {
                let inicioBloque = tamanoBloque * i;
                let suma = 0;
                for (let j = 0; j < tamanoBloque; j++) {
                    suma += Math.abs(datosPuros[inicioBloque + j]); 
                }
                datosFiltrados.push(suma / tamanoBloque);
            }
            
            const maximo = Math.max(...datosFiltrados);
            return datosFiltrados.map(n => n / maximo);
            
        } catch (error) {
            console.error("Error al procesar el audio de la ballena:", error);
            return Array(puntosVisuales).fill(0.1); 
        }
    }

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

        // 1. Revisamos si el audio actual es el de ESTA ballena y si ya está sonando
        let textoBoton = "▶ Escuchar";
        if (reproductorAudio.src.endsWith(d.archivo_audio) && !reproductorAudio.paused) {
            textoBoton = "⏸ Pausar";
        }

        infoDiv.innerHTML = `
            <h3 style="color: var(--accent-pink); margin-bottom: 10px;">${d.nombre_comun} 
                <button id="btn-reproducir-audio" style="margin-left:15px; padding: 5px 15px; background: var(--accent-cyan); color: #000; border: none; border-radius: 15px; cursor: pointer; font-weight: bold;">
                    ${textoBoton}
                </button>
            </h3>
            <p style="margin-bottom: 5px; font-size: 14px;"><strong>Frecuencia Real:</strong> ${d.rango_hz}</p>
            <p style="margin-bottom: 5px; font-size: 14px;"><strong>Intensidad:</strong> ${d.volumen_maximo_db} dB</p>
            <p style="margin-bottom: 5px; font-size: 14px;"><strong>Tipo de sonido:</strong> ${d.tipo_sonido}</p>
            <p style="font-size: 14px;"><strong>Propósito:</strong> ${d.proposito}</p>
        `;

        document.getElementById("btn-reproducir-audio").addEventListener('click', function () {
            // 2. Comparamos usando endsWith para evitar que se reinicie si es el mismo track
            if (!reproductorAudio.src.endsWith(d.archivo_audio)) {
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
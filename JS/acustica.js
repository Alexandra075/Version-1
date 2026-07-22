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
        .style("fill", "#b5b8bb")
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
        .style("fill", "#fbfcfd")
        .style("font-size", "12px");


    // Generador de ondas basado en la frecuencia (Hz)
    function generarOnda(d, ancho) {
        // Calculamos la altura máxima basada en tu escala logarítmica existente
        const alturaBarra = height - y(d.hertz_grafica);
        // A mayor frecuencia, más ciclos (vibraciones) 
        const ciclos = Math.max(3, d.hertz_grafica / 30);

        const generadorArea = d3.area()
            .x(p => p)
            .y0(height) // La base anclada en el fondo del eje X
            .y1(p => {
                //  hace que la onda nazca de 0, crezca en el medio y vuelva a 0
                const envolvente = Math.sin((p / ancho) * Math.PI);
                const onda = Math.sin((p / ancho) * Math.PI * 2 * ciclos);
                const toqueRuido = (Math.random() - 0.5) * 5; // Simula el ruido del océano

                // Calculamos la amplitud final sumando los factores
                return height - (Math.abs(onda) * envolvente * alturaBarra) + toqueRuido;
            })
            .curve(d3.curveMonotoneX);

        // Generamos un punto cada 2 píxeles para trazar la onda suavemente
        return generadorArea(d3.range(0, ancho, 2));
    }

   // Convertimos la lógica de dibujado en una función asíncrona
async function dibujarGraficasReales() {
    
    // 1. Procesamos todos los audios antes de dibujar
    // Asegúrate de que 'd.archivo_audio' tenga la ruta correcta (ej. 'audios/ballena_azul.mp3')
    for (let d of datosAcusticos) {
        // Extraemos 100 puntos de cada audio real
        d.ondaReal = await procesarAudioReal(d.archivo_audio, 100); 
    }

    // 2. Generador de la onda usando los datos reales
    function generarTrazadoReal(d, anchoColumna) {
        const alturaMaxima = height - y(d.hertz_grafica); // Respetamos tu escala logarítmica Y
        const puntos = d.ondaReal.length;
        
        const generadorArea = d3.area()
            // Distribuimos los 100 puntos a lo ancho de la columna
            .x((valor, indice) => (indice / (puntos - 1)) * anchoColumna) 
            .y0(height) // Base plana en la parte inferior
            .y1(valor => height - (valor * alturaMaxima)) // Pico dinámico según el audio
            .curve(d3.curveBasis); // curveBasis suaviza la línea para que parezca una onda orgánica

        return generadorArea(d.ondaReal);
    }

    // 3. Dibujamos en el SVG
    svg.selectAll("ondasReales")
        .data(datosAcusticos)
        .enter()
        .append("path")
        .attr("transform", d => `translate(${x(d.nombre_comun)}, 0)`)
        .attr("d", d => generarTrazadoReal(d, x.bandwidth()))
        // Colores con opacidad al estilo bioluminiscente
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

// Ejecutamos la función
dibujarGraficasReales();

    // Función para leer y simplificar la onda de sonido real
async function procesarAudioReal(urlAudio, puntosVisuales = 100) {
    // Inicializamos el contexto de audio del navegador
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    try {
        // Obtenemos el archivo desde tu servidor/directorio
        const respuesta = await fetch(urlAudio);
        const arrayBuffer = await respuesta.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Obtenemos los datos crudos de las ondas (canal izquierdo)
        const datosPuros = audioBuffer.getChannelData(0); 
        
        // DOWNSAMPLING: Reducimos cientos de miles de puntos a solo 'puntosVisuales'
        const tamanoBloque = Math.floor(datosPuros.length / puntosVisuales);
        const datosFiltrados = [];
        
        for (let i = 0; i < puntosVisuales; i++) {
            let inicioBloque = tamanoBloque * i;
            let suma = 0;
            for (let j = 0; j < tamanoBloque; j++) {
                suma += Math.abs(datosPuros[inicioBloque + j]); // Tomamos la amplitud absoluta
            }
            // Guardamos el promedio de ese bloque
            datosFiltrados.push(suma / tamanoBloque);
        }
        
        // Normalizamos los valores entre 0 y 1 para facilitar el dibujo en D3
        const maximo = Math.max(...datosFiltrados);
        return datosFiltrados.map(n => n / maximo);
        
    } catch (error) {
        console.error("Error al procesar el audio de la ballena:", error);
        return Array(puntosVisuales).fill(0.1); // Onda plana en caso de error
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

        document.getElementById("btn-reproducir-audio").addEventListener('click', function () {
            if (reproductorAudio.src !== window.location.href + d.archivo_audio && reproductorAudio.src !== d.archivo_audio) {
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
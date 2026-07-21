import { cargarBasesDeDatos } from './datos.js';
import { inicializarMapa, dibujarPuntos, actualizarFondoPorProfundidad, obtenerRegionGeografica } from './mapa.js';
import { inicializarAcustica } from './acustica.js';
import { inicializarComparativa } from './comparativa.js';

let appData = null;
let mapaSvgD3 = null;

function llenarDatosGenerales() {
    if(!appData) return;
    
    const datosGenerales = appData.fichaTecnica ? appData.fichaTecnica : appData;
    const bio = datosGenerales.vistas_interactivas.biometria;
    const cons = datosGenerales.vistas_interactivas.conservacion;

    document.getElementById('datos-generales-info').innerHTML = `
        <p><strong>Nombre Científico:</strong> ${bio.taxonomia_completa.especie}</p>
        <p><strong>Peso Máximo:</strong> ${bio.dimensiones_y_peso.peso_maximo_toneladas_metricas} Toneladas</p>
        <p><strong>Longitud Máxima:</strong> ${bio.dimensiones_y_peso.longitud_maxima_metros} Metros</p>
        <p><strong>Esperanza de Vida:</strong> ${cons.ciclo_vida_y_longevidad.rango_vida_anos}</p>
        <p><strong>Estado:</strong> <span style="color: var(--accent-pink);">${cons.estatus_y_amenazas.estado_uicn}</span></p>
    `;
}

function actualizarNarrativa(mesStr) {
    if(!appData) return;
    const m = parseInt(mesStr);
    const titulo = document.getElementById('titulo-tarjeta');
    const info = document.getElementById('contenido-tarjeta');
    
    const datosGenerales = appData.fichaTecnica ? appData.fichaTecnica : appData;
    const migracion = datosGenerales.vistas_interactivas.conservacion.patrones_migratorios;
    const dieta = datosGenerales.vistas_interactivas.dieta;

    let tituloMes = "";
    let textoMes = "";

    switch (m) {
        case 1:
        case 2:
            tituloMes = "Invierno: Zonas Cálidas";
            textoMes = `En esta temporada, las ballenas buscan aguas tropicales y subtropicales de baja latitud. Los registros actuales muestran concentraciones en el Golfo de California (México). Actividad principal: ${migracion.estacion_invierno.actividad}.`;
            break;
        case 3:
        case 4:
            tituloMes = "Transición: Inicio de Migración";
            textoMes = `Realizan una ${migracion.comportamiento_estacional}. Comienzan a desplazarse hacia el norte, viajando solitarias o en parejas temporales a una velocidad de crucero de 3 a 8 km/h.`;
            break;
        case 5:
        case 6:
            tituloMes = "Llegada al Norte";
            textoMes = `Se desplazan por el corredor del Pacífico Norte Oriental, llegando a las costas de California a principios del verano. Se comunican mediante cantos y gemidos de ${dieta.vocalizacion_y_acustica.rango_frecuencia_hz}.`;
            break;
        case 7:
        case 8:
            tituloMes = "Verano: Alimentación Intensiva";
            textoMes = `Aprovechan la explosión de nutrientes en aguas más frías a lo largo de la costa oeste. Realizan ${migracion.estacion_verano.actividad}. Mediante alimentación por embestida, logran un consumo diario de ${dieta.alimentacion_y_dieta.consumo_diario_krill_toneladas} toneladas de krill.`;
            break;
        case 9:
        case 10:
            tituloMes = "Otoño: Preparación para el Retorno";
            textoMes = `Tras acumular aproximadamente ${dieta.alimentacion_y_dieta.calorias_diarias_estimadas} de calorías diarias en el norte, continúan alimentándose frente a las costas de California y Oregón antes de que el krill escasee.`;
            break;
        case 11:
        case 12:
            tituloMes = "Migración de Retorno";
            textoMes = `Inician el descenso hacia el sur. Su destino no es el polo opuesto, sino aguas cálidas cerca del ecuador para reproducirse. Utilizan sonidos de navegación que alcanzan ${dieta.vocalizacion_y_acustica.intensidad_decibelios} decibelios, con un alcance de hasta ${dieta.vocalizacion_y_acustica.alcance_comunicacion_km} km.`;
            break;
    }

    titulo.innerText = tituloMes;
    info.innerHTML = `<p>${textoMes}</p>`;
}

function mostrarTarjeta(d) {
    if(!appData) return;
    const datosGenerales = appData.fichaTecnica ? appData.fichaTecnica : appData;
    const estado = datosGenerales.vistas_interactivas.conservacion.estatus_y_amenazas.estado_uicn;
    
    document.getElementById('info-card').classList.remove('hidden');
    document.getElementById('titulo-tarjeta').innerText = "Registro Detectado";
    document.getElementById('contenido-tarjeta').innerHTML = `
        <p><strong>Especie:</strong> ${d.especie}</p>
        <p><strong>Fecha:</strong> ${d.fecha}</p>
        <p><strong>Coordenadas:</strong> ${d.lat.toFixed(2)}, ${d.lon.toFixed(2)}</p>
        <hr style="margin: 10px 0; border: 0; border-top: 1px solid var(--accent-cyan);">
        <p><em>Estatus: ${estado}</em></p>
    `;
}

// --- CONTROL DE LÍNEA DE TIEMPO (Sustituye al Slider) ---
const timelineNodes = document.querySelectorAll('.timeline-node');

timelineNodes.forEach(node => {
    node.addEventListener('click', (e) => {
        if(!appData || !mapaSvgD3) return;
        
        timelineNodes.forEach(n => n.classList.remove('activo'));
        e.target.classList.add('activo');
        
        const mes = e.target.getAttribute('data-mes').padStart(2, '0');
        document.getElementById('mesEtiqueta').innerText = mes;
        
        dibujarPuntos(mapaSvgD3, appData.avistamientos, mes, mostrarTarjeta);
        actualizarNarrativa(mes);
    });
});

function inicializarHoverProfundidad() {
    const tarjetaSup = document.getElementById('tarjeta-superficial');
    const tarjetaProf = document.getElementById('tarjeta-profunda');
    const uiUbicacion = document.getElementById('ubicacion-geografica');

    if (tarjetaSup && tarjetaProf) {
        
        // --- HOVER SUPERFICIAL ---
        tarjetaSup.addEventListener('mouseenter', () => {
            const prof = parseInt(tarjetaSup.dataset.prof) || 0;
            actualizarFondoPorProfundidad(prof);
            tarjetaSup.style.background = "rgba(0, 229, 255, 0.2)"; 
            
            if(uiUbicacion && tarjetaSup.dataset.lat) {
                const lat = parseFloat(tarjetaSup.dataset.lat);
                const lon = parseFloat(tarjetaSup.dataset.lon);
                uiUbicacion.innerText = obtenerRegionGeografica(lat, lon);
            }
            
            // MAGIA: Encendemos el punto superficial en el mapa
            document.querySelectorAll('.punto-superficial').forEach(p => p.classList.add('highlight-record'));
        });
        
        tarjetaSup.addEventListener('mouseleave', () => {
            const profActual = parseInt(document.body.dataset.profActual) || 0;
            actualizarFondoPorProfundidad(profActual);
            tarjetaSup.style.background = "rgba(0, 229, 255, 0.05)";
            if(uiUbicacion) uiUbicacion.innerText = document.body.dataset.ubicacionActual || "Calculando...";
            
            // MAGIA: Apagamos el punto superficial
            document.querySelectorAll('.punto-superficial').forEach(p => p.classList.remove('highlight-record'));
        });

        // --- HOVER PROFUNDO ---
        tarjetaProf.addEventListener('mouseenter', () => {
            const prof = parseInt(tarjetaProf.dataset.prof) || 0;
            actualizarFondoPorProfundidad(prof);
            tarjetaProf.style.background = "rgba(255, 0, 127, 0.2)"; 
            
            if(uiUbicacion && tarjetaProf.dataset.lat) {
                const lat = parseFloat(tarjetaProf.dataset.lat);
                const lon = parseFloat(tarjetaProf.dataset.lon);
                uiUbicacion.innerText = obtenerRegionGeografica(lat, lon);
            }
            
            // MAGIA: Encendemos el punto profundo en el mapa
            document.querySelectorAll('.punto-profundo').forEach(p => p.classList.add('highlight-record'));
        });
        
        tarjetaProf.addEventListener('mouseleave', () => {
            const profActual = parseInt(document.body.dataset.profActual) || 0;
            actualizarFondoPorProfundidad(profActual);
            tarjetaProf.style.background = "rgba(255, 0, 127, 0.05)";
            if(uiUbicacion) uiUbicacion.innerText = document.body.dataset.ubicacionActual || "Calculando...";
            
            // MAGIA: Apagamos el punto profundo
            document.querySelectorAll('.punto-profundo').forEach(p => p.classList.remove('highlight-record'));
        });
    }
}

async function iniciarApp() {
    try {
        appData = await cargarBasesDeDatos();
        
        if(appData) {
            llenarDatosGenerales();
            
            if(appData.mapaMundi && appData.avistamientos) {
                mapaSvgD3 = inicializarMapa("#mapa-svg", appData.mapaMundi);
                dibujarPuntos(mapaSvgD3, appData.avistamientos, "01", mostrarTarjeta);
                actualizarNarrativa("01");
            }
            
            const datosGenerales = appData.fichaTecnica ? appData.fichaTecnica : appData;
            const datosAcustica = datosGenerales.vistas_interactivas.acustica.especies;
            
            inicializarAcustica(datosAcustica);
            inicializarComparativa(datosAcustica);
            inicializarHoverProfundidad(); 
        }
    } catch (error) {
        console.error("Error crítico al arrancar la app:", error);
        document.getElementById('datos-generales-info').innerHTML = `<p style="color:red;">Error cargando la base de datos. Revisa la consola.</p>`;
    }
}

iniciarApp();
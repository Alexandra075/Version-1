// --- JS/main.js ---
import { cargarBasesDeDatos } from './datos.js';
import { inicializarMapa, dibujarPuntos, actualizarFondoPorProfundidad } from './mapa.js';
import { inicializarAcustica } from './acustica.js';
import { inicializarComparativa } from './comparativa.js';

let appData = null;
let mapaSvgD3 = null;

// --- MAGIA: CONVERTIR RUEDA DEL MOUSE (VERTICAL) A SCROLL HORIZONTAL ---
const scrollContainer = document.getElementById('contenedor-scroll');
scrollContainer.addEventListener('wheel', (evt) => {
    if(!document.getElementById('pantalla-carga').classList.contains('oculto')) return;
    evt.preventDefault();
    scrollContainer.scrollLeft += evt.deltaY;
});

// --- LÓGICA DE LA PORTADA Y CARGA ---
document.getElementById('btn-iniciar').addEventListener('click', () => {
    const pantallaCarga = document.getElementById('pantalla-carga');
    
    pantallaCarga.classList.remove('oculto');
    
    setTimeout(() => {
        document.getElementById('seccion-acustica').scrollIntoView({ behavior: 'smooth' });
        
        setTimeout(() => {
            pantallaCarga.classList.add('oculto');
            llenarDatosGenerales();
        }, 500);

    }, 1500); 
});

// --- LÓGICA DE DATOS ---
function llenarDatosGenerales() {
    if(!appData) return;
    const bio = appData.fichaTecnica.vistas_interactivas.biometria;
    const cons = appData.fichaTecnica.vistas_interactivas.conservacion;

    document.getElementById('datos-generales-info').innerHTML = `
        <p><strong>Nombre Científico:</strong> ${bio.taxonomia_completa.especie}</p>
        <p><strong>Peso Máximo:</strong> ${bio.dimensiones_y_peso.peso_maximo_toneladas_metricas} Toneladas</p>
        <p><strong>Longitud Máxima:</strong> ${bio.dimensiones_y_peso.longitud_maxima_metros} Metros</p>
        <p><strong>Esperanza de Vida:</strong> ${cons.ciclo_vida_y_longevidad.rango_vida_anos}</p>
        <p><strong>Estado:</strong> <span style="color: #ff007f;">${cons.estatus_y_amenazas.estado_uicn}</span></p>
    `;
}

function actualizarNarrativa(mesStr) {
    if(!appData) return;
    const m = parseInt(mesStr);
    const titulo = document.getElementById('titulo-tarjeta');
    const info = document.getElementById('contenido-tarjeta');
    
    const migracion = appData.fichaTecnica.vistas_interactivas.conservacion.patrones_migratorios;

    if (m >= 1 && m <= 3) {
        titulo.innerText = "Invierno: Zonas Cálidas";
        info.innerHTML = `<p>${migracion.estacion_invierno.actividad}</p>`;
    } else if (m >= 4 && m <= 6) {
        titulo.innerText = "Primavera: Transición";
        info.innerHTML = `<p>${migracion.comportamiento_estacional}</p>`;
    } else if (m >= 7 && m <= 9) {
        titulo.innerText = "Verano: Alimentación";
        info.innerHTML = `<p>${migracion.estacion_verano.actividad}</p>`;
    } else {
        titulo.innerText = "Otoño: El Regreso";
        info.innerHTML = `<p>Retorno a aguas tropicales para el próximo ciclo reproductivo.</p>`;
    }
}

function mostrarTarjeta(d) {
    if(!appData) return;
    const estado = appData.fichaTecnica.vistas_interactivas.conservacion.estatus_y_amenazas.estado_uicn;
    
    document.getElementById('info-card').classList.remove('hidden');
    document.getElementById('titulo-tarjeta').innerText = "Registro Detectado";
    document.getElementById('contenido-tarjeta').innerHTML = `
        <p><strong>Especie:</strong> ${d.especie}</p>
        <p><strong>Fecha:</strong> ${d.fecha}</p>
        <p><strong>Coordenadas:</strong> ${d.lat.toFixed(2)}, ${d.lon.toFixed(2)}</p>
        <hr style="margin: 10px 0; border: 0; border-top: 1px solid #00e5ff;">
        <p><em>Estatus: ${estado}</em></p>
    `;
}

document.getElementById('mesSlider').addEventListener('input', (e) => {
    if(!appData || !mapaSvgD3) return;
    const mes = e.target.value.toString().padStart(2, '0');
    document.getElementById('mesEtiqueta').innerText = mes;
    
    dibujarPuntos(mapaSvgD3, appData.avistamientos, mes, mostrarTarjeta);
    actualizarNarrativa(mes);
    actualizarFondoPorProfundidad(0); 
});

// --- ARRANQUE DE LA APP ---
async function iniciarApp() {
    appData = await cargarBasesDeDatos();
    
    if(appData) {
        // 1. Inicializar Mapa
        mapaSvgD3 = inicializarMapa("#mapa-svg", appData.mapaMundi);
        dibujarPuntos(mapaSvgD3, appData.avistamientos, "01", mostrarTarjeta);
        actualizarNarrativa("01");
        
        // 2. Inicializar Acústica pasándole la sección de especies del JSON
        const datosAcustica = appData.fichaTecnica.vistas_interactivas.acustica.especies;
        inicializarAcustica(datosAcustica);

        // 3. Inicializar Comparativa 3D
        inicializarComparativa(datosAcustica);
    }
}

iniciarApp();
// IMPORTANTE: Agregamos obtenerRegionGeografica a las importaciones
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

    // Buscamos los IDs específicos que colocamos en los <span> del HTML 
    // y les inyectamos los datos sin destruir la cuadrícula de CSS
    
    document.getElementById('dato-peso').innerText = `${bio.dimensiones_y_peso.peso_maximo_toneladas_metricas} Toneladas`;
    
    document.getElementById('dato-longitud').innerText = `${bio.dimensiones_y_peso.longitud_maxima_metros} Metros`;
    
    document.getElementById('dato-vida').innerText = cons.ciclo_vida_y_longevidad.rango_vida_anos;
    
    document.getElementById('dato-estado').innerText = cons.estatus_y_amenazas.estado_uicn;
}

function actualizarNarrativa(mesStr) {
    if(!appData) return;
    const m = parseInt(mesStr);
    const titulo = document.getElementById('titulo-tarjeta');
    const info = document.getElementById('contenido-tarjeta');
    
    const datosGenerales = appData.fichaTecnica ? appData.fichaTecnica : appData;
    const migracion = datosGenerales.vistas_interactivas.conservacion.patrones_migratorios;

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

const slider = document.getElementById('mesSlider');
if (slider) {
    slider.addEventListener('input', (e) => {
        if(!appData || !mapaSvgD3) return;
        const mes = e.target.value.toString().padStart(2, '0');
        document.getElementById('mesEtiqueta').innerText = mes;
        
        dibujarPuntos(mapaSvgD3, appData.avistamientos, mes, mostrarTarjeta);
        actualizarNarrativa(mes);
    });
}

function inicializarHoverProfundidad() {
    const tarjetaSup = document.getElementById('tarjeta-superficial');
    const tarjetaProf = document.getElementById('tarjeta-profunda');
    const uiUbicacion = document.getElementById('ubicacion-geografica');

    if (tarjetaSup && tarjetaProf) {
        
        // --- TARJETA SUPERFICIAL ---
        tarjetaSup.addEventListener('mouseenter', () => {
            const prof = parseInt(tarjetaSup.dataset.prof) || 0;
            actualizarFondoPorProfundidad(prof);
            tarjetaSup.style.background = "rgba(0, 229, 255, 0.2)"; 
            
            // Calculamos y mostramos la ubicación exacta
            if(uiUbicacion && tarjetaSup.dataset.lat) {
                const lat = parseFloat(tarjetaSup.dataset.lat);
                const lon = parseFloat(tarjetaSup.dataset.lon);
                uiUbicacion.innerText = obtenerRegionGeografica(lat, lon);
            }
        });
        
        tarjetaSup.addEventListener('mouseleave', () => {
            const profActual = parseInt(document.body.dataset.profActual) || 0;
            actualizarFondoPorProfundidad(profActual);
            tarjetaSup.style.background = "rgba(0, 229, 255, 0.05)";
            
            // Regresamos el texto a la zona general del mes
            if(uiUbicacion) uiUbicacion.innerText = document.body.dataset.ubicacionActual || "📍 Calculando...";
        });

        // --- TARJETA PROFUNDA ---
        tarjetaProf.addEventListener('mouseenter', () => {
            const prof = parseInt(tarjetaProf.dataset.prof) || 0;
            actualizarFondoPorProfundidad(prof);
            tarjetaProf.style.background = "rgba(255, 0, 127, 0.2)"; 
            
            // Calculamos y mostramos la ubicación exacta
            if(uiUbicacion && tarjetaProf.dataset.lat) {
                const lat = parseFloat(tarjetaProf.dataset.lat);
                const lon = parseFloat(tarjetaProf.dataset.lon);
                uiUbicacion.innerText = obtenerRegionGeografica(lat, lon);
            }
        });
        
        tarjetaProf.addEventListener('mouseleave', () => {
            const profActual = parseInt(document.body.dataset.profActual) || 0;
            actualizarFondoPorProfundidad(profActual);
            tarjetaProf.style.background = "rgba(255, 0, 127, 0.05)";
            
            // Regresamos el texto a la zona general del mes
            if(uiUbicacion) uiUbicacion.innerText = document.body.dataset.ubicacionActual || "📍 Calculando...";
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

// --- NUEVO: CONTROL DE SCROLL EXCLUSIVO CON RUEDA Y TOUCHPAD (ARRIBA/ABAJO) ---
const contenedorScroll = document.getElementById('contenedor-scroll');
let scrollEnProgreso = false;

contenedorScroll.addEventListener('wheel', (e) => {
    // EXCEPCIÓN MAGISTRAL: Si el cursor está sobre cualquier visor 3D, 
    // ignoramos todo este código para que la rueda sirva de ZOOM.
    if (e.target.closest('model-viewer')) {
        return; // Salimos inmediatamente sin mover la página
    }

    // 1. MATAMOS CUALQUIER COMPORTAMIENTO NATIVO 
    // (Esto anula el scroll horizontal nativo del touchpad por completo)
    e.preventDefault(); 

    // 2. Si ya estamos moviendo la pantalla, ignoramos el resto del "dedazo"
    if (scrollEnProgreso) return; 

    // 3. Evaluamos SOLO el movimiento de arriba/abajo (deltaY). 
    // Le ponemos un umbral (> 5) para ignorar toques fantasma o temblores mínimos.
    if (Math.abs(e.deltaY) > 5) {
        scrollEnProgreso = true;
        const anchoPantalla = window.innerWidth;

        if (e.deltaY > 0) {
            // Rueda hacia abajo / Deslizar arriba -> Avanzar a la derecha
            contenedorScroll.scrollBy({ left: anchoPantalla, behavior: 'smooth' });
        } else {
            // Rueda hacia arriba / Deslizar abajo -> Retroceder a la izquierda
            contenedorScroll.scrollBy({ left: -anchoPantalla, behavior: 'smooth' });
        }

        // 4. Aumentamos el bloqueo a 850ms. 
        // Esto le da tiempo a la animación de terminar y evita el "doble salto".
        setTimeout(() => {
            scrollEnProgreso = false;
        }, 850); 
    }
}, { passive: false }); // Obligatorio para que preventDefault() funcione

iniciarApp();
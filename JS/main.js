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

// =========================================
// INTERACCIÓN DEL VISUALIZADOR DE ESPECIES (CENTRADOR AUTOMÁTICO)
// =========================================
const iniciarVisorEspecies = () => {
    const botonesEspecies = document.querySelectorAll('.btn-especie');
    const seccionGrande = document.getElementById('seccion-3d'); 

    if(botonesEspecies.length > 0) {
        botonesEspecies.forEach(boton => {
            boton.addEventListener('click', (evento) => {
                evento.preventDefault(); 

                // 1. Pintar el botón activo
                botonesEspecies.forEach(b => b.classList.remove('activo'));
                boton.classList.add('activo');
                
                // 2. Obtener la ruta y el nombre de la especie
                const nuevoModelo = boton.getAttribute('data-src');
                const nombreEspecie = boton.innerText.replace('\n', ' ');
                
                // 3. Actualizar el visor pequeño
                const marco = document.querySelector('.marco-modelo-3d');
                if (marco) {
                    marco.innerHTML = `<model-viewer id="visor-secundario" src="${nuevoModelo}" auto-rotate camera-controls style="width: 100%; height: 100%; background-color: transparent;"></model-viewer>`;
                }

                // 4. Actualizar el visor GRANDE y controlar la estructura
                const visorPrincipal = document.getElementById('visor-principal');
                if (visorPrincipal) {
                    visorPrincipal.src = nuevoModelo;

                    const puntosFlotantes = visorPrincipal.querySelectorAll('.punto-flotante');
                    const dashboardContainer = document.querySelector('#seccion-3d .dashboard-container');
                    const panelLateral = document.querySelector('#seccion-3d .panel-lateral');
                    const contenedorDatos = document.getElementById('contenedor-datos-biologicos');
                    const textoInformativo = document.getElementById('texto-informativo-azul');
                    const subtitulo = document.getElementById('subtitulo-especie');

                    if (nuevoModelo.includes('Azul')) {
                        // SI ES LA BALLENA AZUL: Mostramos la caja lateral con diseño y dividimos la pantalla
                        if (dashboardContainer) dashboardContainer.classList.remove('sin-panel');
                        if (panelLateral) {
                            panelLateral.style.background = "rgba(10, 25, 47, 0.6)";
                            panelLateral.style.backdropFilter = "blur(12px)";
                            panelLateral.style.border = "1px solid rgba(0, 229, 255, 0.2)";
                            panelLateral.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.5)";
                            panelLateral.style.padding = "30px";
                        }
                        puntosFlotantes.forEach(punto => punto.style.display = 'block');
                        if (contenedorDatos) contenedorDatos.style.display = 'block';
                        if (textoInformativo) textoInformativo.style.display = 'block';
                        if (subtitulo) subtitulo.innerText = "Balaenoptera musculus";
                    } else {
                        // PARA LAS DEMÁS: Ocultamos la caja por completo y expandimos el visor 3D al centro
                        if (dashboardContainer) dashboardContainer.classList.add('sin-panel');
                        if (panelLateral) {
                            panelLateral.style.background = "transparent";
                            panelLateral.style.backdropFilter = "none";
                            panelLateral.style.border = "none";
                            panelLateral.style.boxShadow = "none";
                            panelLateral.style.padding = "0px";
                        }
                        puntosFlotantes.forEach(punto => punto.style.display = 'none');
                        if (contenedorDatos) contenedorDatos.style.display = 'none';
                        if (textoInformativo) textoInformativo.style.display = 'none';
                        if (subtitulo) subtitulo.innerText = nombreEspecie;
                    }
                }

                // 5. Viajar automáticamente a la pantalla principal
                if (seccionGrande) {
                    seccionGrande.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
                }
            });
        });
    }
};

setTimeout(iniciarVisorEspecies, 500);

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
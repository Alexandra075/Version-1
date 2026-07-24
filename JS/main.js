import { cargarBasesDeDatos } from './datos.js';
import { inicializarMapa, dibujarPuntos, actualizarFondoPorProfundidad, obtenerRegionGeografica } from './mapa.js';
import { inicializarAcustica } from './acustica.js';

let appData = null;
let mapaSvgD3 = null;

function llenarDatosGenerales() {
    if (!appData) return;

    const datosGenerales = appData.fichaTecnica ? appData.fichaTecnica : appData;
    const bio = datosGenerales.vistas_interactivas.biometria;
    const cons = datosGenerales.vistas_interactivas.conservacion;

    document.getElementById('dato-peso').innerText = `${bio.dimensiones_y_peso.peso_maximo_toneladas_metricas} Toneladas`;
    document.getElementById('dato-longitud').innerText = `${bio.dimensiones_y_peso.longitud_maxima_metros} Metros`;
    document.getElementById('dato-vida').innerText = cons.ciclo_vida_y_longevidad.rango_vida_anos;
    document.getElementById('dato-estado').innerText = cons.estatus_y_amenazas.estado_uicn;
}

function actualizarNarrativa(mesStr) {
    if (!appData || !appData.avistamientos) return;

    const titulo = document.getElementById('titulo-tarjeta');
    const info = document.getElementById('contenido-tarjeta');

    const datosMes = appData.avistamientos.filter(d => d.fecha && d.fecha.split('-')[1] === mesStr);

    const mesesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const nombreMes = mesesNombres[parseInt(mesStr) - 1];

    if (datosMes.length === 0) {
        titulo.innerText = `Reporte de ${nombreMes}`;
        info.innerHTML = `<p>Sin registros de avistamientos confirmados en la base de datos para este periodo.</p>`;
        return;
    }

    const totalAvistamientos = datosMes.length;

    const avgLat = d3.mean(datosMes, d => d.lat);
    const avgLon = d3.mean(datosMes, d => d.lon);
    const regionPrincipal = obtenerRegionGeografica(avgLat, avgLon);

    titulo.innerText = `Reporte de ${nombreMes}`;
    info.innerHTML = `
        <p><strong>Total de avistamientos:</strong> ${totalAvistamientos} registros exactos.</p>
        <p><strong>Concentración principal:</strong> ${regionPrincipal}.</p>
        <p style="margin-top: 15px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
            * Estos datos son extraídos en tiempo real del conjunto de coordenadas geoespaciales analizadas para este mes.
        </p>
    `;
}

const iniciarBotonEsqueleto = () => {
    const btnToggleEsqueleto = document.getElementById('btn-toggle-esqueleto');
    const visorPrincipal = document.getElementById('visor-principal');
    const puntosFlotantes = document.querySelectorAll('#visor-principal .punto-flotante');

    if (btnToggleEsqueleto && visorPrincipal) {
        let mostrandoEsqueleto = false;

        btnToggleEsqueleto.addEventListener('click', () => {
            mostrandoEsqueleto = !mostrandoEsqueleto;

            if (mostrandoEsqueleto) {
                visorPrincipal.src = "3D/Esqueleto/base_basic_pbr.glb"; 
                btnToggleEsqueleto.innerHTML = " Volver a la Ballena Azul";
                btnToggleEsqueleto.style.background = "rgba(255, 0, 127, 0.1)";
                btnToggleEsqueleto.style.borderColor = "var(--accent-pink)";
                btnToggleEsqueleto.style.color = "var(--accent-pink)";
                btnToggleEsqueleto.style.boxShadow = "0 0 15px rgba(255, 0, 127, 0.4)";
                puntosFlotantes.forEach(punto => punto.style.display = 'none');
            } else {
                visorPrincipal.src = "3D/Azul/ballena.glb";
                btnToggleEsqueleto.innerHTML = " Ver Esqueleto Óseo";
                btnToggleEsqueleto.style.background = "rgba(0, 229, 255, 0.05)";
                btnToggleEsqueleto.style.borderColor = "var(--accent-cyan)";
                btnToggleEsqueleto.style.color = "var(--accent-cyan)";
                btnToggleEsqueleto.style.boxShadow = "none";
                puntosFlotantes.forEach(punto => punto.style.display = 'block');
            }
        });
    }
};

setTimeout(iniciarBotonEsqueleto, 600);

const iniciarVisorEspecies = () => {
    const botonesEspecies = document.querySelectorAll('.btn-especie');
    const seccionGrande = document.getElementById('seccion-3d');
    const seccionAcustica = document.getElementById('seccion-acustica');
    const visorSecundario = document.getElementById('visor-secundario');
    const visorPrincipal = document.getElementById('visor-principal');
    const btnExpandir = document.getElementById('btn-expandir-3d');
    const btnCerrarVista = document.getElementById('btn-cerrar-vista');

    let modeloSeleccionadoActualmente = "3D/Minke/minke.glb";
    let nombreSeleccionadoActualmente = "Rorcual Aliblanco (Minke)";

    if (botonesEspecies.length > 0) {
        botonesEspecies.forEach(boton => {
            boton.addEventListener('click', (evento) => {
                evento.preventDefault();

                const especieId = boton.getAttribute('data-id');
                modeloSeleccionadoActualmente = boton.getAttribute('data-src');
                nombreSeleccionadoActualmente = boton.innerText.replace('\n', ' ');
                botonesEspecies.forEach(b => {
                    b.classList.remove('activo');
                    if(b.getAttribute('data-id') === '52hz') {
                        b.style.background = 'transparent';
                        b.style.color = 'var(--accent-pink)';
                    } else {
                        b.style.background = 'transparent';
                        b.style.color = 'var(--accent-cyan)';
                    }
                });
                
                boton.classList.add('activo');
                if(especieId === '52hz') {
                    boton.style.background = 'var(--accent-pink)';
                    boton.style.color = '#020c1b';
                } else {
                    boton.style.background = 'var(--accent-cyan)';
                    boton.style.color = '#020c1b';
                }

                if (especieId === '52hz') {
                    if (visorSecundario) visorSecundario.style.display = 'none';
                    document.getElementById('texto-52hz').classList.remove('hidden');
                    if (btnExpandir) btnExpandir.style.display = 'none';
                } else {
                    if (visorSecundario) {
                        visorSecundario.style.display = 'block';
                        visorSecundario.src = modeloSeleccionadoActualmente;
                    }
                    document.getElementById('texto-52hz').classList.add('hidden');
                    if (btnExpandir) btnExpandir.style.display = 'block';
                }

                if(window.mostrarFichaAcusticaGlobal) {
                    window.mostrarFichaAcusticaGlobal(especieId);
                }
            });
        });
    }

    const prepararVisorGrande = (rutaModelo, nombre) => {
        if (!visorPrincipal) return;
        visorPrincipal.src = rutaModelo;

        const puntosFlotantes = visorPrincipal.querySelectorAll('.punto-flotante');
        const dashboardContainer = document.querySelector('#seccion-3d .dashboard-container');
        const panelLateral = document.querySelector('#seccion-3d .panel-lateral');
        const contenedorDatos = document.getElementById('contenedor-datos-biologicos');
        const textoInformativo = document.getElementById('texto-informativo-azul');
        const subtitulo = document.getElementById('subtitulo-especie');

        if (rutaModelo.includes('Azul')) {
            if (dashboardContainer) dashboardContainer.classList.remove('sin-panel');
            if (panelLateral) panelLateral.style.display = "flex";
            puntosFlotantes.forEach(punto => punto.style.display = 'block');
            if (contenedorDatos) contenedorDatos.style.display = 'block';
            if (textoInformativo) textoInformativo.style.display = 'block';
            if (subtitulo) subtitulo.innerText = "Balaenoptera musculus";
        } else {
            if (dashboardContainer) dashboardContainer.classList.add('sin-panel');
            if (panelLateral) panelLateral.style.display = "none";
            puntosFlotantes.forEach(punto => punto.style.display = 'none');
            if (contenedorDatos) contenedorDatos.style.display = 'none';
            if (textoInformativo) textoInformativo.style.display = 'none';
            if (subtitulo) subtitulo.innerText = nombre;
        }
    };

    if (btnExpandir && seccionGrande) {
        btnExpandir.addEventListener('click', () => {
            prepararVisorGrande(modeloSeleccionadoActualmente, nombreSeleccionadoActualmente);
            if (btnCerrarVista) btnCerrarVista.classList.remove('hidden'); 
            seccionGrande.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
        });
    }

    if (btnCerrarVista && seccionAcustica) {
        btnCerrarVista.addEventListener('click', () => {
            btnCerrarVista.classList.add('hidden'); 
            seccionAcustica.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
            setTimeout(() => {
                prepararVisorGrande("3D/Azul/ballena.glb", "Balaenoptera musculus");
            }, 500);
        });
    }
};

setTimeout(iniciarVisorEspecies, 500);

function mostrarTarjeta(d) {
    if (!appData) return;
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

const botonesMes = document.querySelectorAll('.btn-mes');
if (botonesMes.length > 0) {
    botonesMes.forEach(boton => {
        boton.addEventListener('click', () => {
            if (!appData || !mapaSvgD3) return;
            botonesMes.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');

            const mesSeleccionado = boton.getAttribute('data-mes');

            dibujarPuntos(mapaSvgD3, appData.avistamientos, mesSeleccionado, mostrarTarjeta);
            actualizarNarrativa(mesSeleccionado);
        });
    });
}

function inicializarHoverProfundidad() {
    const tarjetaSup = document.getElementById('tarjeta-superficial');
    const tarjetaProf = document.getElementById('tarjeta-profunda');
    const uiUbicacion = document.getElementById('ubicacion-geografica');
    const seccionMapa = document.getElementById('seccion-mapa');

    if (tarjetaSup && tarjetaProf) {

        tarjetaSup.addEventListener('mouseenter', () => {
            const prof = parseInt(tarjetaSup.dataset.prof) || 0;
            actualizarFondoPorProfundidad(prof);
            tarjetaSup.style.background = "rgba(0, 229, 255, 0.2)";

            if (uiUbicacion && tarjetaSup.dataset.lat) {
                const lat = parseFloat(tarjetaSup.dataset.lat);
                const lon = parseFloat(tarjetaSup.dataset.lon);
                uiUbicacion.innerText = obtenerRegionGeografica(lat, lon);

                d3.selectAll(".current-point").filter(d => d.lat === lat && d.lon === lon)
                    .transition().duration(200)
                    .attr("r", 14)
                    .style("fill", "var(--accent-pink)");
            }

            if (seccionMapa) {
                seccionMapa.style.transition = "background-image 0.5s ease-in-out";
                seccionMapa.style.backgroundSize = "cover";
                seccionMapa.style.backgroundPosition = "center";
                seccionMapa.style.backgroundImage = "linear-gradient(rgba(2, 12, 27, 0.50), rgba(2, 12, 27, 0.50)), url('https://cdn.pixabay.com/photo/2018/02/16/21/06/blue-whale-3158626_1280.png')";
            }
        });

        tarjetaSup.addEventListener('mouseleave', () => {
            const profActual = parseInt(document.body.dataset.profActual) || 0;
            actualizarFondoPorProfundidad(profActual);
            tarjetaSup.style.background = "rgba(0, 229, 255, 0.05)";

            if (uiUbicacion) uiUbicacion.innerText = document.body.dataset.ubicacionActual || "Obteniendo información";
            if (seccionMapa) seccionMapa.style.backgroundImage = "";

            d3.selectAll(".current-point")
                .transition().duration(200)
                .attr("r", 6)
                .style("fill", null);
        });

        tarjetaProf.addEventListener('mouseenter', () => {
            const prof = parseInt(tarjetaProf.dataset.prof) || 0;
            actualizarFondoPorProfundidad(prof);
            tarjetaProf.style.background = "rgba(255, 0, 127, 0.2)";

            if (uiUbicacion && tarjetaProf.dataset.lat) {
                const lat = parseFloat(tarjetaProf.dataset.lat);
                const lon = parseFloat(tarjetaProf.dataset.lon);
                uiUbicacion.innerText = obtenerRegionGeografica(lat, lon);

                d3.selectAll(".current-point").filter(d => d.lat === lat && d.lon === lon)
                    .transition().duration(200)
                    .attr("r", 14)
                    .style("fill", "var(--accent-pink)");
            }

            if (seccionMapa) {
                seccionMapa.style.transition = "background-image 0.5s ease-in-out";
                seccionMapa.style.backgroundSize = "cover";
                seccionMapa.style.backgroundPosition = "center";
                seccionMapa.style.backgroundImage = "linear-gradient(rgba(2, 12, 27, 0.70), rgba(2, 12, 27, 0.70)), url('https://cdn.pixabay.com/photo/2020/03/12/01/49/jellyfish-4923658_1280.jpg')";
            }
        });

        tarjetaProf.addEventListener('mouseleave', () => {
            const profActual = parseInt(document.body.dataset.profActual) || 0;
            actualizarFondoPorProfundidad(profActual);
            tarjetaProf.style.background = "rgba(255, 0, 127, 0.05)";

            if (uiUbicacion) uiUbicacion.innerText = document.body.dataset.ubicacionActual || "Obteniendo información";
            if (seccionMapa) seccionMapa.style.backgroundImage = "";

            d3.selectAll(".current-point")
                .transition().duration(200)
                .attr("r", 6)
                .style("fill", null);
        });
    }
}

async function iniciarApp() {
    try {
        appData = await cargarBasesDeDatos();

        if (appData) {
            llenarDatosGenerales();

            if (appData.mapaMundi && appData.avistamientos) {
                mapaSvgD3 = inicializarMapa("#mapa-svg", appData.mapaMundi);
                dibujarPuntos(mapaSvgD3, appData.avistamientos, "01", mostrarTarjeta);
                actualizarNarrativa("01");
            }

            const datosGenerales = appData.fichaTecnica ? appData.fichaTecnica : appData;
            const datosAcustica = datosGenerales.vistas_interactivas.acustica.especies;

            inicializarAcustica(datosAcustica);
            inicializarHoverProfundidad();
        }
    } catch (error) {
        console.error("Error crítico al arrancar la app:", error);
        document.getElementById('datos-generales-info').innerHTML = `<p style="color:red;">Error cargando la base de datos. Revisa la consola.</p>`;
    }
}

const contenedorScroll = document.getElementById('contenedor-scroll');
let scrollEnProgreso = false;

contenedorScroll.addEventListener('wheel', (e) => {
    if (e.target.closest('model-viewer')) {
        return;
    }

    e.preventDefault();

    if (scrollEnProgreso) return;

    if (Math.abs(e.deltaY) > 5) {
        scrollEnProgreso = true;
        const anchoPantalla = window.innerWidth;

        if (e.deltaY > 0) {
            contenedorScroll.scrollBy({ left: anchoPantalla, behavior: 'smooth' });
        } else {
            contenedorScroll.scrollBy({ left: -anchoPantalla, behavior: 'smooth' });
        }

        setTimeout(() => {
            scrollEnProgreso = false;
        }, 850);
    }
}, { passive: false });

iniciarApp();
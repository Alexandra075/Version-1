// --- JS/comparativa.js ---

export function inicializarComparativa() {
    // Aquí buscaremos los controles de la interfaz para cambiar de ballena
    const botonesSelector = document.querySelectorAll('.btn-selector-especie');
    const visor3D = document.querySelector('#seccion-3d model-viewer');

    if (!botonesSelector || !visor3D) return;

    botonesSelector.forEach(boton => {
        boton.addEventListener('click', (evento) => {
            // Quitamos la clase 'activo' de todos y se la ponemos al que recibió el clic
            botonesSelector.forEach(b => b.classList.remove('activo'));
            evento.target.classList.add('activo');

            // Leemos qué modelo cargar desde el atributo HTML y lo inyectamos al visor
            const archivoModelo = evento.target.getAttribute('data-modelo');
            if (archivoModelo) {
                visor3D.src = archivoModelo;
            }
        });
    });
}
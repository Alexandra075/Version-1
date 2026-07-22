export function inicializarComparativa(datosAcusticos) {
    const contenedorBotones = document.getElementById('contenedor-botones-comparativa');
    const visorSecundario = document.getElementById('visor-secundario');

    if (!contenedorBotones || !visorSecundario) return;

    // Filtramos para que no genere botón de la ballena 52Hz
    const especies3D = datosAcusticos.filter(d => d.id !== "52hz");
    
    // --- DICCIONARIO DE MODELOS 3D ---
    // Aquí enlazas el ID de tu base de datos con el nombre real de tu archivo en tu compu.
    // IMPORTANTE: Si tus archivos se llaman distinto, cámbialos aquí adentro de las comillas.
    const archivosModelos = {
        "minke": "3D/Minke/minke.glb",
        "jorobada": "3D/Jorobada/jorobada.glb",
        "azul": "3D/Azul/ballena.glb",
        "aleta": "3D/Aleta/aleta.glb"
    };

    // Formato de Cuadrícula (Grid) para ahorrar espacio
    contenedorBotones.innerHTML = '';
    contenedorBotones.style.display = "grid";
    contenedorBotones.style.gridTemplateColumns = "1fr 1fr"; 
    contenedorBotones.style.gap = "8px";
    contenedorBotones.style.marginTop = "15px";

    especies3D.forEach((especie) => {
        const btn = document.createElement('button');
        btn.innerText = especie.nombre_comun;
        btn.style.padding = "8px 5px";
        btn.style.borderRadius = "6px";
        btn.style.border = "1px solid var(--accent-cyan)";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "bold";
        btn.style.fontSize = "0.75rem"; 
        btn.style.transition = "background 0.3s";
        
        if(especie.id === "azul") {
            btn.style.background = "var(--accent-cyan)";
            btn.style.color = "#021024";
        } else {
            btn.style.background = "rgba(0, 229, 255, 0.1)";
            btn.style.color = "var(--accent-cyan)";
        }

        btn.addEventListener('click', () => {
            // Resetear colores
            contenedorBotones.childNodes.forEach(b => {
                b.style.background = "rgba(0, 229, 255, 0.1)";
                b.style.color = "var(--accent-cyan)";
            });
            
            // Iluminar botón activo
            btn.style.background = "var(--accent-cyan)";
            btn.style.color = "#021024";

            // Cambiar el modelo 3D en el visor de acústica usando nuestro diccionario
            visorSecundario.src = archivosModelos[especie.id];
        });

        contenedorBotones.appendChild(btn);
    });
}
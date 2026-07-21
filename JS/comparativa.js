export function inicializarComparativa(datosAcusticos) {
    const asidePanel = document.querySelector('#seccion-3d .panel-lateral');
    const visor3D = document.querySelector('#seccion-3d model-viewer');

    if (!asidePanel || !visor3D) return;

    // Filtramos para que no genere botón de la ballena 52Hz que no tiene modelo 3D
    const especies3D = datosAcusticos.filter(d => d.id !== "52hz");
    
    // Limpieza de botones previos por si acaso
    let contenedor = document.getElementById('botones-especies-3d');
    if(contenedor) contenedor.remove();

    const contenedorBotones = document.createElement('div');
    contenedorBotones.id = 'botones-especies-3d';
    contenedorBotones.style.display = "flex";
    contenedorBotones.style.flexDirection = "column";
    contenedorBotones.style.gap = "10px";
    contenedorBotones.style.marginTop = "20px";

    especies3D.forEach((especie) => {
        const btn = document.createElement('button');
        btn.innerText = especie.nombre_comun;
        btn.style.padding = "10px";
        btn.style.borderRadius = "8px";
        btn.style.border = "1px solid var(--accent-cyan)";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "bold";
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

            visor3D.src = `${especie.id}.glb`;
        });

        contenedorBotones.appendChild(btn);
    });

    asidePanel.appendChild(contenedorBotones);
}
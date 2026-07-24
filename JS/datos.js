
export async function cargarBasesDeDatos() {
    try {
        const [geoData, ballenasTsv, datosGenerales] = await Promise.all([
            d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
            d3.tsv("data/Occurrence.tsv"),
            fetch("data/datos_generales.json").then(res => res.json())
        ]);

        const ballenasData = ballenasTsv
            .filter(d => d.decimalLatitude && d.decimalLongitude && d.eventDate)
            .map(d => ({
                lat: +d.decimalLatitude,
                lon: +d.decimalLongitude,
                fecha: d.eventDate,
                especie: d.scientificName,
                profundidad: Math.floor(Math.abs(Math.sin(+d.decimalLatitude) * 500)) 
            }));

        return {
            mapaMundi: geoData,
            avistamientos: ballenasData,
            fichaTecnica: datosGenerales
        };
    } catch (error) {
        console.error("Error al conectar con las bases de datos:", error);
    }
}
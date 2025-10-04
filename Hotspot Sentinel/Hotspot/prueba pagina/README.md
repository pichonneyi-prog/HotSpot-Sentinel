# Proyecto SAR — Plantilla profesional (español)

Esta carpeta contiene una plantilla profesional para un proyecto de teledetección con SAR (Radar de Apertura Sintética).

Contenido
- `index.html` — Informe/plantilla en HTML (español).
- `styles.css` — Estilos para la plantilla.
- `script.js` — Interacciones ligeras (navegación y copiar comandos).
- `process_sar.py` — Ejemplo mínimo: convertir bandas SAR a dB y calcular diferencia VV-VH.
- `sample_visualization.py` — Guardar una visualización PNG desde un GeoTIFF SAR.

Requisitos
- Python 3.8+
- Paquetes: rasterio, numpy, matplotlib

Instalación (recomendado usar virtualenv):

```powershell
# Crear y activar entorno (Windows PowerShell)
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install rasterio numpy matplotlib
```

Descarga de datos SAR
- Sentinel-1 (C-band): Copernicus Open Access Hub o AWS Public Datasets.
- ALOS PALSAR (L-band): JAXA/HPF o repositorios institucionales.
- ASF Data Search: https://search.asf.alaska.edu/

Pasos básicos reproducibles
1. Descargue dos bandas (por ejemplo VV y VH) en GeoTIFF y colóquelas en la carpeta del proyecto.
2. Calcule la diferencia VV-VH en dB:

```powershell
python process_sar.py --vv sentinel_vv.tif --vh sentinel_vh.tif --out vv_minus_vh_db.tif
```

3. Genere una imagen PNG para revisión rápida:

```powershell
python sample_visualization.py vv_minus_vh_db.tif vv_minus_vh.png
```

Siguientes pasos sugeridos
- Añadir scripts para mosaico, reproyección y alineación (gdal/rasterioedio).
- Implementar detección de agua por umbral y clasificación simple (scikit-image, sklearn).
- Crear mapas interactivos con Folium o una app web (Dash/Streamlit).

Mapas interactivos y tiles
---------------------------------
Si quieres mostrar tus GeoTIFFs SAR en el mapa interactivo (`index.html`), debes servirlos como tiles XYZ o WMS. Aquí hay dos opciones rápidas:

1) gdal2tiles (fácil, crea un directorio de tiles):

```powershell
# Requiere GDAL instalado y en PATH
gdal2tiles.py -z 0-14 input.tif output_tiles_folder
```

Después de esto puedes servir `output_tiles_folder` desde un servidor web (por ejemplo, `python -m http.server` en la carpeta padre) y usar la URL:

`http://localhost:8000/output_tiles_folder/{z}/{x}/{y}.png`

2) rio-tiler / titiler (moderno, permite servir tiles dinámicamente):

```powershell
# Instalar
pip install rio-tiler titiler[server]

# Titiler (ejemplo) puede desplegarse con FastAPI/uvicorn y servir tiles a partir de GeoTIFFs
```

Uso en la plantilla
--------------------
Una vez tengas una URL de tiles (XYZ) o WMS, abre `index.html` en tu navegador, pulsa el botón "Agregar capa XYZ/WMS" y pega la URL (por ejemplo `http://localhost:8000/output_tiles_folder/{z}/{x}/{y}.png`). La capa se añadirá al mapa.

Notas de seguridad
------------------
La plantilla solicita al usuario la URL de tiles y no descarga automáticamente recursos de terceros sin tu permiso. Asegúrate de servir tiles desde orígenes de confianza y de respetar la privacidad de tus datos.

Referencias
- ESA Sentinel-1 documentation
- ASF Data Search

Licencia
Plantilla creada para fines educativos. Edítela y úsel a bajo su propio criterio.

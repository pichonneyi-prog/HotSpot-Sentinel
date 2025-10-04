# SAR Project — Professional template (English)

This folder contains a professional template for a remote sensing project using SAR (Synthetic Aperture Radar).

Contents
- `index.html` — Report/template in HTML (English).
- `styles.css` — Styles for the template.
- `script.js` — Lightweight interactions (navigation and copy commands).
- `process_sar.py` — Minimal example: convert SAR bands to dB and compute VV-VH difference.
- `sample_visualization.py` — Save a PNG visualization from a SAR GeoTIFF.

Requirements
- Python 3.8+
- Packages: rasterio, numpy, matplotlib

Installation (recommended: virtualenv):

```powershell
# Create and activate environment (Windows PowerShell)
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install rasterio numpy matplotlib
```

Downloading SAR data
- Sentinel-1 (C-band): Copernicus Open Access Hub or AWS Public Datasets.
- ALOS PALSAR (L-band): JAXA/HPF or institutional repositories.
- ASF Data Search: https://search.asf.alaska.edu/

Reproducible basic steps
1. Download two bands (e.g., VV and VH) as GeoTIFF and place them in the project folder.
2. Compute the VV-VH difference in dB:

```powershell
python process_sar.py --vv sentinel_vv.tif --vh sentinel_vh.tif --out vv_minus_vh_db.tif
```

3. Generate a PNG for quick review:

```powershell
python sample_visualization.py vv_minus_vh_db.tif vv_minus_vh.png
```

Suggested next steps
- Add scripts for mosaicking, reprojection and alignment (gdal/rasterio).
- Implement water detection by threshold and simple classification (scikit-image, sklearn).
- Create interactive maps with Folium or a web app (Dash/Streamlit).

Interactive maps and tiles
---------------------------------
If you want to show your SAR GeoTIFFs on the interactive map (`index.html`), you must serve them as XYZ tiles or WMS. Here are two quick options:

1) gdal2tiles (easy, creates a tile folder):

```powershell
# Requires GDAL installed and on PATH
gdal2tiles.py -z 0-14 input.tif output_tiles_folder
```

After that you can serve `output_tiles_folder` from a web server (for example, `python -m http.server` in the parent folder) and use the URL:

`http://localhost:8000/output_tiles_folder/{z}/{x}/{y}.png`

2) rio-tiler / titiler (modern, serves tiles dynamically):

```powershell
# Install
pip install rio-tiler titiler[server]

# Titiler (example) can be deployed with FastAPI/uvicorn and serve tiles from GeoTIFFs
```

Using the template
--------------------
Once you have a tiles (XYZ) or WMS URL, open `index.html` in your browser, click "Agregar capa XYZ/WMS" and paste the URL (for example `http://localhost:8000/output_tiles_folder/{z}/{x}/{y}.png`). The layer will be added to the map.

Security notes
------------------
The template asks the user for a tiles URL and does not automatically fetch third-party resources without your permission. Make sure you serve tiles from trusted origins and respect data privacy.

References
- ESA Sentinel-1 documentation
- ASF Data Search

License
Template created for educational purposes. Edit and use at your own discretion.

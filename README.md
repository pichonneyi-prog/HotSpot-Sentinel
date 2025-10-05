# HotSpot Sentinel v1.0 - SAR Data Processing and Visualization

Web application for SAR (Synthetic Aperture Radar) data processing and hotspot visualization, developed for remote sensing projects.

🚀 Features
- SAR Data Processing: Convert SAR bands to dB and compute differences (e.g., VV-VH)
- Interactive Maps: Add XYZ/WMS layers for visualization on web interface
- Data Visualization: Generate PNG visualizations from SAR GeoTIFFs
- Weather Integration: Lightweight interactions including weather queries via Open-Meteo API
- Reproducible Workflows: Scripts for basic SAR processing steps

🛠️ Technologies
- Backend: Python 3.8+ with rasterio, numpy, matplotlib
- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Data Sources: Sentinel-1, ALOS PALSAR, FIRMS data
- Tools: GDAL, rio-tiler, titiler for tiling and serving

🚀 Installation and Execution
Option 1: Automated Setup (Recommended)
Windows:
```powershell
# Create and activate virtual environment
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install rasterio numpy matplotlib
```

Option 2: Manual Installation
1. Ensure Python 3.8+ is installed
2. Install dependencies:
```powershell
pip install rasterio numpy matplotlib
```
3. For advanced tiling (optional):
```powershell
pip install rio-tiler titiler[server]
```

🌐 Accessing the Application
- Open `index.html` in your web browser
- For tiled layers, serve tiles locally (e.g., `python -m http.server`) and use URLs like `http://localhost:8000/tiles/{z}/{x}/{y}.png`

📖 Usage
1. Download SAR data (VV and VH bands as GeoTIFF) from sources like Copernicus Open Access Hub or ASF Data Search
2. Process the data:
```powershell
python process_sar.py --vv sentinel_vv.tif --vh sentinel_vh.tif --out vv_minus_vh_db.tif
```
3. Generate visualization:
```powershell
python sample_visualization.py vv_minus_vh_db.tif vv_minus_vh.png
```
4. For interactive maps: Generate tiles using gdal2tiles or rio-tiler, then add the layer URL in the web interface

🏗️ Architecture
HotSpot Sentinel/
├── index.html          # Main web interface
├── styles.css          # CSS styles
├── script.js           # JavaScript interactions
├── process_sar.py      # SAR processing script
├── sample_visualization.py  # Visualization script
├── requirements.txt    # Python dependencies
├── sample_firms.csv    # Sample FIRMS data
└── README.md           # This file

🔧 Development
- Adding new processing scripts: Create Python files in the root directory
- Extending web interface: Modify `index.html`, `styles.css`, or `script.js`
- Implementing advanced features: Add mosaicking, classification, or ML models using scikit-image, sklearn
- Interactive maps: Integrate Folium, Dash, or Streamlit for enhanced visualizations

🤝 Contributing
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
- ESA Sentinel-1 documentation
- ASF Data Search
- Copernicus Open Access Hub
- JAXA ALOS PALSAR
- Open-source Python community.

import streamlit as st
import pandas as pd
import folium
from folium.plugins import MarkerCluster
from streamlit_folium import st_folium

# Configuración de la página
st.set_page_config(page_title="Rastreador de Incendios NASA", layout="wide")

# Título
st.title("🔥 Rastreador de incendios y humo con datos satelitales")
st.markdown(
    """
    Esta aplicación permite **visualizar focos de incendio activos** detectados por satélites 
    (MODIS/VIIRS de la NASA) y explorar sus ubicaciones en un mapa interactivo.
    """
)

# Subida de archivo CSV
archivo_cargado = st.file_uploader("📂 Subí un CSV de FIRMS (MODIS/VIIRS)", type=["csv"])

if archivo_cargado:
    df = pd.read_csv(archivo_cargado)

    st.success(f"✅ {len(df)} focos cargados")

    # Crear mapa centrado en Sudamérica
    m = folium.Map(location=[-20, -60], zoom_start=4, tiles="CartoDB positron")

    # Cluster de marcadores
    marcador_cluster = MarkerCluster().add_to(m)

    # Iterar sobre filas del CSV
    for _, fila in df.iterrows():
        lat = fila.get("latitude", None)
        lon = fila.get("longitude", None)
        brillo = fila.get("bright_ti4", "N/A")
        fecha = fila.get("acq_date", "N/A")
        sat = fila.get("satellite", "N/A")

        if pd.notnull(lat) and pd.notnull(lon):
            folium.Marker(
                location=[lat, lon],
                popup=f"🔥 Brillo: {brillo}<br>📅 Fecha: {fecha}<br>🛰 Satélite: {sat}",
                icon=folium.Icon(color="red", icon="fire"),
            ).add_to(marcador_cluster)

    # Mostrar mapa en Streamlit
    st_folium(m, width=1200, height=700)
else:
    st.warning("⚠️ Por favor subí un archivo CSV con datos de incendios FIRMS (NASA).")

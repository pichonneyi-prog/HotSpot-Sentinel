import streamlit as st
import pandas as pd
import folium
from folium.plugins import MarkerCluster
from streamlit_folium import st_folium

st.set_page_config(page_title="NASA Fire & Smoke Tracker", layout="wide")

st.title("🔥 NASA Fire & Smoke Tracker")
st.markdown("Visualización de focos de incendio activos con datos satelitales (MODIS/VIIRS).")

# Subida de archivo CSV
uploaded_file = st.file_uploader("📂 Subí un CSV de FIRMS (MODIS/VIIRS)", type=["csv"])

if uploaded_file:
    df = pd.read_csv(uploaded_file)
    st.success(f"✅ {len(df)} focos cargados")

    # Crear mapa centrado en Sudamérica
    m = folium.Map(location=[-20, -60], zoom_start=4, tiles="CartoDB positron")

    marker_cluster = MarkerCluster().add_to(m)

    for _, row in df.iterrows():
        lat = row["latitude"]
        lon = row["longitude"]
        brightness = row.get("brightness", "N/A")
        date = row.get("acq_date", "N/A")
        sat = row.get("satellite", "N/A")

        popup_text = f"""
        🔥 <b>Foco detectado</b><br>
        Fecha: {date}<br>
        Satélite: {sat}<br>
        Brillo: {brightness}
        """
        folium.CircleMarker(
            location=[lat, lon],
            radius=3,
            color="red",
            fill=True,
            fill_opacity=0.6,
            popup=popup_text
        ).add_to(marker_cluster)

    st_data = st_folium(m, width=1200, height=600)
else:
    st.info("Subí un archivo CSV de FIRMS para visualizar los incendios.")

// script.js — Interacciones ligeras para la plantilla SAR
document.addEventListener('DOMContentLoaded', function () {
  // Navegación por secciones
  document.querySelectorAll('.toc-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.querySelector(btn.getAttribute('data-target'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Copiar comando
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sel = document.querySelector(btn.getAttribute('data-copy'));
      if (!sel) return;
      var text = sel.innerText || sel.textContent;
      navigator.clipboard?.writeText(text).then(function () {
        btn.textContent = 'Copiado';
        setTimeout(function () { btn.textContent = 'Copiar comando'; }, 1500);
      }, function () {
        // Fallback
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); btn.textContent = 'Copiado'; } catch (e) { alert('No se pudo copiar'); }
        document.body.removeChild(ta);
        setTimeout(function () { btn.textContent = 'Copiar comando'; }, 1500);
      });
    });
  });

  // Enlaces relativos: abrir README local en nueva pestaña (si el navegador lo permite)
  var readmeLinks = document.querySelectorAll('a[href$="README.md"]');
  readmeLinks.forEach(function (a) {
    a.addEventListener('click', function (e) {
      // Dejar comportamiento por defecto; en un servidor local se abrirá el archivo
    });
  });
});
// Nota: se ha eliminado el código de mapa y consulta de clima para evitar errores
// en tiempo de ejecución porque la plantilla actual no incluye el contenedor
// '#map' ni la librería Leaflet. Si quieres reactivar el mapa, puedo:
// 1) añadir el contenedor <div id="map"></div> en `index.html` y cargar Leaflet,
// 2) o bien desplazar el código de mapa a un archivo separado y solicitar la
//    clave API (colocarla entre comillas en la variable apiKey).

// Inicializar mapa solo si el contenedor existe y Leaflet está disponible
;(function () {
  var mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Cargar Leaflet desde CDN dinámicamente si no está presente
  function loadLeaflet(callback) {
    if (window.L) return callback();
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    var script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = callback;
    document.body.appendChild(script);
  }

  loadLeaflet(function () {
    try {
      var map = L.map('map').setView([0, 0], 2);

      var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      var baseLayers = { 'OSM': osm };

      var control = L.control.layers(baseLayers, null, { collapsed: false }).addTo(map);

      // Prompt para añadir una capa XYZ/WMS (segura: solo URL introducida por usuario)
      var addLayerBtn = document.createElement('button');
      addLayerBtn.textContent = 'Agregar capa XYZ/WMS';
      addLayerBtn.style.cssText = 'margin-top:.5rem;padding:.4rem .6rem;border-radius:6px;cursor:pointer;background:#0b6e99;color:#fff;border:none;';
      addLayerBtn.addEventListener('click', function () {
        var url = prompt('Introduce URL de tiles XYZ o WMS (por ejemplo https://.../{z}/{x}/{y}.png)');
        if (!url) return;
        var layer = L.tileLayer(url, { maxZoom: 19 });
        layer.addTo(map);
        control.addOverlay(layer, 'Capa añadida por usuario');
      });

      mapEl.parentNode.insertBefore(addLayerBtn, mapEl.nextSibling);
      
      // Estructura para guardar registros de clics
      var clickLogs = [];

      // Función para descargar CSV
      function downloadCSV(rows, filename) {
        var csv = rows.map(function(r){ return r.join(','); }).join('\n');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a'); a.href = url; a.download = filename || 'clicks.csv';
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      }

      document.getElementById('download-csv').addEventListener('click', function () {
        if (!clickLogs.length) return alert('No hay registros para descargar');
        var header = ['timestamp','lat','lon','temp_C','humidity_pct','wind_kmh','risk'];
        var rows = [header].concat(clickLogs.map(function(r){ return [r.timestamp, r.lat, r.lon, r.temp, r.humidity, r.wind, r.risk]; }));
        downloadCSV(rows, 'weather_clicks.csv');
      });

      // Cargar Chart.js dinámicamente
      function loadChart(callback) {
        if (window.Chart) return callback();
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = callback;
        document.body.appendChild(script);
      }

      loadChart(function () {
        // Crear chart vacío
        var ctx = document.getElementById('weather-chart').getContext('2d');
        var weatherChart = new Chart(ctx, {
          type: 'line',
          data: { labels: [], datasets: [
            { label: 'Temperatura (°C)', data: [], borderColor: '#ef4444', tension:0.3, yAxisID: 'y'},
            { label: 'Humedad (%)', data: [], borderColor: '#3b82f6', tension:0.3, yAxisID: 'y2'}
          ]},
          options: {
            scales: {
              y: { type: 'linear', position: 'left' },
              y2: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } }
            }
          }
        });

        // Manejar clic en el mapa para consultar clima y estimar riesgo de incendio
        map.on('click', async function (e) {
        var lat = e.latlng.lat.toFixed(4);
        var lon = e.latlng.lng.toFixed(4);

        // Open-Meteo API (sin clave) — solicitamos temperatura, humedad y viento horario
        var url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,windspeed_80m&current_weather=true&timezone=UTC`;

        try {
          var res = await fetch(url);
          var data = await res.json();

          // Preferimos current_weather si está disponible
          var temp = data.current_weather?.temperature ?? (data.hourly?.temperature_2m?.[0] ?? null);
          var wind = data.current_weather?.windspeed ?? (data.hourly?.windspeed_10m?.[0] ?? null);
          var humidity = data.hourly?.relativehumidity_2m?.[0] ?? null;

          // Heurística simple de riesgo de incendio
          // Regla: Alto si temp>=30°C, humedad<=30% y viento>=20 km/h
          var risk = 'Desconocido';
          if (temp !== null && humidity !== null && wind !== null) {
            if (temp >= 30 && humidity <= 30 && wind >= 20) risk = 'Alto';
            else if (temp >= 25 && humidity <= 40 && wind >= 10) risk = 'Moderado';
            else risk = 'Bajo';
          }

          var infoHtml = `<p><strong>Ubicación:</strong> ${lat}, ${lon}</p>` +
            `<p><strong>Temperatura:</strong> ${temp ?? '—'} °C</p>` +
            `<p><strong>Humedad:</strong> ${humidity ?? '—'} %</p>` +
            `<p><strong>Viento:</strong> ${wind ?? '—'} km/h</p>` +
            `<p><strong>Riesgo estimado de incendio:</strong> <strong class="risk-${risk.toLowerCase()}">${risk}</strong></p>`;

          var winfo = document.getElementById('weather-info');
          var details = document.getElementById('weather-details');
          if (details) details.innerHTML = infoHtml;

          // Guardar registro
          var now = new Date().toISOString();
          var rec = { timestamp: now, lat: lat, lon: lon, temp: temp, humidity: humidity, wind: wind, risk: risk };
          clickLogs.unshift(rec); // push al frente
          if (clickLogs.length > 200) clickLogs.pop();

          // Actualizar gráfico con hourly si existe, sino con el punto actual
          try {
            if (data.hourly && data.hourly.time) {
              var times = data.hourly.time.slice(0,24);
              var temps = data.hourly.temperature_2m.slice(0,24);
              var hums = data.hourly.relativehumidity_2m.slice(0,24);
              weatherChart.data.labels = times.map(function(t){ return t.replace('T',' '); });
              weatherChart.data.datasets[0].data = temps;
              weatherChart.data.datasets[1].data = hums;
            } else {
              weatherChart.data.labels = [now];
              weatherChart.data.datasets[0].data = [temp];
              weatherChart.data.datasets[1].data = [humidity];
            }
            weatherChart.update();
          } catch (err) {
            console.warn('No se pudo actualizar chart:', err);
          }

          L.popup()
            .setLatLng(e.latlng)
            .setContent(`<strong>Riesgo: ${risk}</strong><br>${temp ?? '—'} °C, ${humidity ?? '—'} % HR`)
            .openOn(map);
        } catch (err) {
          console.error('Error consultando Open-Meteo:', err);
          var winfo = document.getElementById('weather-info');
          if (winfo) winfo.innerHTML = `<p>Error al consultar datos meteorológicos.</p>`;
        }
        });
      });
    } catch (err) {
      console.error('Error inicializando Leaflet:', err);
    }
  });
})();

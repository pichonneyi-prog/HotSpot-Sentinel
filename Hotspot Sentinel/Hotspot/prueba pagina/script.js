// script.js — Lightweight interactions for the SAR template
document.addEventListener('DOMContentLoaded', function () {
  // Navegación por secciones
  // Section navigation
  document.querySelectorAll('.toc-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.querySelector(btn.getAttribute('data-target'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Copy command
      document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sel = document.querySelector(btn.getAttribute('data-copy'));
      if (!sel) return;
      var text = sel.innerText || sel.textContent;
      navigator.clipboard?.writeText(text).then(function () {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = 'Copy command'; }, 1500);
      }, function () {
        // Fallback
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); btn.textContent = 'Copiado'; } catch (e) { alert('No se pudo copiar'); }
        document.body.removeChild(ta);
        setTimeout(function () { btn.textContent = 'Copy command'; }, 1500);
      });
    });
  });
      // Normalize leftover Spanish in fallback copy behavior
      // Replace 'Copiado' and 'No se pudo copiar' with English equivalents
      // The previous code path sets 'Copied' on success; adjust fallback behavior below when used.

  // Relative links: open local README in a new tab (if the browser allows it)
  var readmeLinks = document.querySelectorAll('a[href$="README.md"]');
  readmeLinks.forEach(function (a) {
    a.addEventListener('click', function (e) {
      // Dejar comportamiento por defecto; en un servidor local se abrirá el archivo
    });
  });
});
// Note: the map and weather-fetch code is included but guarded so it won't run
// unless a '#map' container exists and Leaflet is available. To enable the map:
// 1) Ensure <div id="map"></div> is present in `index.html` and allow loading Leaflet,
// 2) Or move the map code to a separate module and provide any required API keys.

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

      // Physical / relief basemap: try OpenTopoMap first (more reliable), fallback to Stamen Terrain on error
      var openTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
        maxZoom: 17
      });

      var stamenTerrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
        attribution: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap contributors',
        maxZoom: 18
      });

      // Classic OSM as an alternative base layer
      var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      });

  var baseLayers = { 'Physical (OpenTopoMap)': openTopo, 'OSM Standard': osm };

      var control = L.control.layers(baseLayers, null, { collapsed: false }).addTo(map);

      // Add the preferred physical basemap by default and attach a one-time error handler
      var openTopoFailed = false;
      openTopo.addTo(map);
      // Small on-map status control to show basemap loading state
      var bmStatus = L.control({ position: 'topright' });
      bmStatus.onAdd = function () {
        var d = L.DomUtil.create('div', 'basemap-status');
        d.style.padding = '6px 8px'; d.style.background = 'rgba(0,0,0,0.5)'; d.style.color = '#fff'; d.style.fontSize = '12px'; d.style.borderRadius = '4px';
        d.innerHTML = 'Loading physical basemap...';
        return d;
      };
      bmStatus.addTo(map);
      var bmStatusEl = document.querySelector('.basemap-status');
      openTopo.on('tileerror', function (err) {
        if (openTopoFailed) return;
        openTopoFailed = true;
        console.warn('OpenTopoMap tiles failed to load, switching to Stamen Terrain as fallback.', err);
        try {
          // switch to Stamen Terrain
          map.addLayer(stamenTerrain);
          map.removeLayer(openTopo);
          if (bmStatusEl) bmStatusEl.innerHTML = 'OpenTopoMap failed — using Stamen Terrain (fallback)';
          // Also show a brief popup to the user
          L.popup({ closeOnClick: true, autoClose: true })
            .setLatLng(map.getCenter())
            .setContent('OpenTopoMap tiles failed to load; switched to Stamen Terrain.')
            .openOn(map);
        } catch (e) { console.error('Failed to switch basemap fallback:', e); }
      });

      // If OpenTopo loads at least one tile, indicate success and remove the loading text
      openTopo.on('tileload', function () {
        if (bmStatusEl) bmStatusEl.innerHTML = 'Physical basemap: OpenTopoMap';
      });
      stamenTerrain.on('tileload', function () {
        if (bmStatusEl) bmStatusEl.innerHTML = 'Physical basemap: Stamen Terrain';
      });

      // Prompt para añadir una capa XYZ/WMS (segura: solo URL introducida por usuario)
      var addLayerBtn = document.createElement('button');
      addLayerBtn.textContent = 'Add XYZ/WMS layer';
      addLayerBtn.className = 'map-control-btn primary';
      addLayerBtn.addEventListener('click', function () {
        var url = prompt('Enter an XYZ/WMS tiles URL (e.g. https://.../{z}/{x}/{y}.png)');
        if (!url) return;
        var layer = L.tileLayer(url, { maxZoom: 19 });
        layer.addTo(map);
        control.addOverlay(layer, 'User-added layer');
      });

      mapEl.parentNode.insertBefore(addLayerBtn, mapEl.nextSibling);

      // Button to clear markers (arrows and fires)
    var clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear markers';
    clearBtn.className = 'map-control-btn warn';
      clearBtn.addEventListener('click', function () {
        if (window.__hotspot_arrows_layer) { window.__hotspot_arrows_layer.clearLayers(); }
        if (window.__hotspot_fires_layer) { window.__hotspot_fires_layer.clearLayers(); }
        if (window.__hotspot_smoke_layer) { window.__hotspot_smoke_layer.clearLayers(); }
        if (window.__appears_layer) { window.__appears_layer.clearLayers(); }
        if (window.__burned_areas_layer) { window.__burned_areas_layer.clearLayers(); }
      });
      mapEl.parentNode.insertBefore(clearBtn, addLayerBtn.nextSibling);

      // APPEARS (NASA) layer placeholder
      if (!window.__appears_layer) window.__appears_layer = L.layerGroup().addTo(map);

      // APPEARS helper functions and UI handlers
      function parseFIRMSCSV(text) {
        var lines = text.split(/\r?\n/).filter(function(l){ return l.trim(); });
        if (!lines.length) return [];
        var header = lines.shift().split(',').map(function(h){ return h.trim(); });
        var rows = lines.map(function(line){
          var cols = line.split(',');
          var obj = {};
          for (var i=0;i<header.length;i++) obj[header[i]] = cols[i];
          return obj;
        });
        return rows;
      }

      var appearsTaskId = null; // store current task ID

      function setAppearsStatus(msg, isError) {
        var appearsStatus = document.getElementById('appears-status');
        if (!appearsStatus) return;
        appearsStatus.textContent = msg || '';
        appearsStatus.style.color = isError ? '#ff6b6b' : 'var(--muted)';
      }

      // Create APPEARS task
      var appearsCreateBtn = document.getElementById('appears-create-task');
      if (appearsCreateBtn) {
        appearsCreateBtn.addEventListener('click', async function () {
          var token = document.getElementById('appears-token')?.value || '';
          var product = document.getElementById('appears-product')?.value || '';
          var startDate = document.getElementById('appears-start-date')?.value || '';
          var endDate = document.getElementById('appears-end-date')?.value || '';
          var bbox = document.getElementById('appears-bbox')?.value || '';
          if (!token || !product || !startDate || !endDate || !bbox) {
            setAppearsStatus('Completa todos los campos.', true);
            return;
          }
          setAppearsStatus('Creando tarea APPEARS...');
          try {
            var taskData = {
              task_type: 'area',
              task_name: 'Hotspots_' + Date.now(),
              params: {
                products: [product],
                startDate: startDate,
                endDate: endDate,
                coordinates: bbox.split(',').map(parseFloat)
              }
            };
            var r = await fetch('https://appeears.earthdatacloud.nasa.gov/api/task', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(taskData)
            });
            if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + await r.text());
            var task = await r.json();
            appearsTaskId = task.task_id;
            setAppearsStatus('Tarea creada: ' + appearsTaskId + '. Consulta el estado.');
          } catch (err) {
            console.error('APPEARS create error', err);
            setAppearsStatus('Error creando tarea: ' + (err.message || err), true);
          }
        });
      }

      // Check APPEARS task status
      var appearsCheckBtn = document.getElementById('appears-check-status');
      if (appearsCheckBtn) {
        appearsCheckBtn.addEventListener('click', async function () {
          if (!appearsTaskId) {
            setAppearsStatus('Primero crea una tarea.', true);
            return;
          }
          var token = document.getElementById('appears-token')?.value || '';
          if (!token) {
            setAppearsStatus('Introduce el token.', true);
            return;
          }
          setAppearsStatus('Consultando estado...');
          try {
            var r = await fetch('https://appeears.earthdatacloud.nasa.gov/api/task/' + appearsTaskId, {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            var task = await r.json();
            setAppearsStatus('Estado: ' + task.status + (task.status === 'done' ? ' - Listo para descargar.' : ''));
          } catch (err) {
            console.error('APPEARS status error', err);
            setAppearsStatus('Error consultando estado: ' + (err.message || err), true);
          }
        });
      }

      // Download APPEARS data
      var appearsDownloadBtn = document.getElementById('appears-download');
      if (appearsDownloadBtn) {
        appearsDownloadBtn.addEventListener('click', async function () {
          if (!appearsTaskId) {
            setAppearsStatus('Primero crea una tarea.', true);
            return;
          }
          var token = document.getElementById('appears-token')?.value || '';
          if (!token) {
            setAppearsStatus('Introduce el token.', true);
            return;
          }
          setAppearsStatus('Descargando datos...');
          try {
            var r = await fetch('https://appeears.earthdatacloud.nasa.gov/api/bundle/' + appearsTaskId, {
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            var bundle = await r.json();
            // Assume bundle has files, download the first CSV or similar
            var fileUrl = bundle.files[0]?.file_url;
            if (!fileUrl) throw new Error('No files in bundle');
            var fileR = await fetch(fileUrl);
            var csvText = await fileR.text();
            // Parse CSV and display on map
            var rows = parseFIRMSCSV(csvText);
            if (!rows.length) { setAppearsStatus('No se encontraron puntos.', true); return; }
            if (!window.__appears_layer) window.__appears_layer = L.layerGroup().addTo(map);
            window.__appears_layer.clearLayers();
            rows.forEach(function(r){
              var lat = parseFloat(r.latitude || r.lat);
              var lon = parseFloat(r.longitude || r.lon);
              if (isNaN(lat) || isNaN(lon)) return;
              var acqDate = r.acq_date || r.acqDate || 'Fecha desconocida';
              var acqTime = r.acq_time || r.acqTime || 'Hora desconocida';
              var popupContent = `<strong>Hotspot APPEARS</strong><br>Lat: ${lat.toFixed(3)}, Lon: ${lon.toFixed(3)}<br>Fecha: ${acqDate}<br>Hora: ${acqTime}`;
              var circle = L.circleMarker([lat, lon], { radius: 6, fillColor: '#ff3300', color: '#111', weight:0.6, fillOpacity: 0.9 });
              circle.bindPopup(popupContent);

              // Tooltip for hover showing date/time
              circle.on('mouseover', function(e) {
                this.openPopup();
              });
              circle.on('mouseout', function(e) {
                this.closePopup();
              });

              circle.addTo(window.__appears_layer);
            });
            setAppearsStatus('Cargados ' + window.__appears_layer.getLayers().length + ' puntos.');
            try { var bounds = window.__appears_layer.getBounds(); if (bounds.isValid()) map.fitBounds(bounds.pad(0.2)); } catch (e) {}
          } catch (err) {
            console.error('APPEARS download error', err);
            setAppearsStatus('Error descargando: ' + (err.message || err), true);
          }
        });
      }

      // Clear APPEARS layer
      var appearsClearBtn = document.getElementById('appears-clear');
      if (appearsClearBtn) {
        appearsClearBtn.addEventListener('click', function () {
          if (window.__appears_layer) window.__appears_layer.clearLayers();
          setAppearsStatus('Capa APPEARS limpiada.');
        });
      }

      // Clear burned areas layer
      var burnedAreasClearBtn = document.getElementById('clear-burned-areas');
      if (burnedAreasClearBtn) {
        burnedAreasClearBtn.addEventListener('click', function () {
          if (window.__burned_areas_layer) window.__burned_areas_layer.clearLayers();
        });
      }

      // Burned areas layer placeholder
      if (!window.__burned_areas_layer) window.__burned_areas_layer = L.layerGroup().addTo(map);

      // The plume controls have been moved to the document DOM (outside the map)

      var smokeSlider = document.getElementById('smoke-slider');
      var smokeMinutesEl = document.getElementById('smoke-minutes');
      var smokeTempEl = document.getElementById('smoke-temp');
      var smokeHumEl = document.getElementById('smoke-hum');
      smokeSlider.disabled = true; // disabled until a point is selected
      var probToggle = document.getElementById('prob-toggle');

  // New visualization controls (DOM elements are in the page now)
  var sampleStepEl = document.getElementById('sample-step');
  var sampleStepVal = document.getElementById('sample-step-val');
  var baseWidthEl = document.getElementById('base-width');
  var baseWidthVal = document.getElementById('base-width-val');
  var timeCoeffEl = document.getElementById('time-coeff');
  var timeCoeffVal = document.getElementById('time-coeff-val');
  var windMultEl = document.getElementById('wind-mult');
  var windMultVal = document.getElementById('wind-mult-val');
  var slopeMultEl = document.getElementById('slope-mult');
  var slopeMultVal = document.getElementById('slope-mult-val');
  var jitterEl = document.getElementById('jitter');
  var jitterVal = document.getElementById('jitter-val');
  var dispSlopeEl = document.getElementById('disp-slope');
  var dispSlopeVal = document.getElementById('disp-slope-val');
  var opacityEl = document.getElementById('plume-opacity');
  var opacityVal = document.getElementById('opacity-val');

      // Initialize displayed values
      if (sampleStepVal) sampleStepVal.textContent = parseFloat(sampleStepEl.value).toFixed(2);
      if (baseWidthVal) baseWidthVal.textContent = baseWidthEl.value;
      if (timeCoeffVal) timeCoeffVal.textContent = timeCoeffEl.value;
      if (windMultVal) windMultVal.textContent = windMultEl.value;
      if (slopeMultVal) slopeMultVal.textContent = slopeMultEl.value;
      if (jitterVal) jitterVal.textContent = jitterEl.value;
      if (dispSlopeVal && dispSlopeEl) dispSlopeVal.textContent = dispSlopeEl.value;
      if (opacityVal) opacityVal.textContent = opacityEl.value;

      // When user changes visualization params, update display and recompute plume (debounced)
      function vizChange() {
        if (sampleStepVal) sampleStepVal.textContent = parseFloat(sampleStepEl.value).toFixed(2);
        if (baseWidthVal) baseWidthVal.textContent = baseWidthEl.value;
        if (timeCoeffVal) timeCoeffVal.textContent = timeCoeffEl.value;
        if (windMultVal) windMultVal.textContent = windMultEl.value;
        if (slopeMultVal) slopeMultVal.textContent = slopeMultEl.value;
        if (jitterVal) jitterVal.textContent = jitterEl.value;
        if (dispSlopeVal && dispSlopeEl) dispSlopeVal.textContent = dispSlopeEl.value;
        if (opacityVal) opacityVal.textContent = opacityEl.value;
        if (lastPlume) debouncedCompute(lastPlume, parseInt(smokeSlider.value, 10) || 10);
      }

  [sampleStepEl, baseWidthEl, timeCoeffEl, windMultEl, slopeMultEl, jitterEl, dispSlopeEl, opacityEl].forEach(function(el){ if (el) el.addEventListener('input', vizChange); });

      // Debounce helper
      function debounce(fn, wait) {
        var t = null;
        return function () {
          var ctx = this, args = arguments;
          clearTimeout(t);
          t = setTimeout(function () { fn.apply(ctx, args); }, wait);
        };
      }

      // Simple spatial cache for lookups (rounded coords)
      var lookupCache = { weather: {}, elevation: {} };
      function cacheKey(lat, lon) { return lat.toFixed(3) + ',' + lon.toFixed(3); }

      // Layer to draw smoke polygons
      if (!window.__hotspot_smoke_layer) window.__hotspot_smoke_layer = L.layerGroup().addTo(map);

      // Utility: destination point given lat, lon, distance (m) and bearing (deg)
      function destinationPoint(lat, lon, distance, bearing) {
        var R = 6378137; // Earth radius in meters
        var brng = bearing * Math.PI / 180.0;
        var lat1 = lat * Math.PI / 180.0;
        var lon1 = lon * Math.PI / 180.0;
        var dDivR = distance / R;
        var lat2 = Math.asin(Math.sin(lat1) * Math.cos(dDivR) + Math.cos(lat1) * Math.sin(dDivR) * Math.cos(brng));
        var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dDivR) * Math.cos(lat1), Math.cos(dDivR) - Math.sin(lat1) * Math.sin(lat2));
        return [lat2 * 180.0 / Math.PI, lon2 * 180.0 / Math.PI];
      }

      var lastPlume = null; // store last clicked point data

      function drawSmokePlume(data, minutes) {
        // data: {lat, lon, dirTo, wind}
        var layer = window.__hotspot_smoke_layer;
        layer.clearLayers();
        if (!data || data.wind == null || data.dirTo == null) return;

        var wind_kmh = parseFloat(data.wind) || 0;
        var speed_m_per_min = wind_kmh * 1000.0 / 60.0; // meters per minute
        var distance = speed_m_per_min * minutes; // meters
        if (distance <= 0) return;

        var dir = parseFloat(data.dirTo);
        // spread angle in degrees (half-angle)
        var spread = 25; // degrees

        // Compute three key points at distance along central and spread bearings
        var tip = destinationPoint(data.lat, data.lon, distance, dir);
        var right = destinationPoint(data.lat, data.lon, distance, dir + spread);
        var left = destinationPoint(data.lat, data.lon, distance, dir - spread);

        // Build polygon: origin -> right -> tip -> left
        var polyPoints = [ [data.lat, data.lon], [right[0], right[1]], [tip[0], tip[1]], [left[0], left[1]] ];

        var plume = L.polygon(polyPoints, { color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.25, weight: 1, dashArray: '4 4' });
        plume.addTo(layer);

        // centerline
        var line = L.polyline([[data.lat, data.lon], [tip[0], tip[1]]], { color: '#b45309', weight: 1.5, opacity: 0.7 });
        line.addTo(layer);

        // marker for tip distance
        var tipMarker = L.circleMarker([tip[0], tip[1]], { radius: 4, fillColor: '#b45309', color: '#fff', weight: 0.5, fillOpacity: 0.9 }).addTo(layer);
        tipMarker.bindPopup(`<strong>Smoke tip</strong><br>Distance: ${Math.round(distance)} m<br>Time: ${minutes} min`);
      }

      // Probabilistic plume (irregular front): sample every 1 km, bend centerline and modulate amplitude
      // The algorithm walks forward in 1 km steps using local wind direction at each sample to bend the path.
      // At each sample the lateral amplitude (half-width) is computed from local wind and slope and
      // right/left offsets are computed to build an irregular polygon similar to the deterministic plume.
      async function computeProbabilisticPlume(data, minutes) {
        var layer = window.__hotspot_smoke_layer;
        layer.clearLayers();
        if (!data || data.wind == null || data.dirTo == null) return drawSmokePlume(data, minutes);
        if (typeof probToggle !== 'undefined' && probToggle && !probToggle.checked) {
          return drawSmokePlume(data, minutes);
        }

        try {
          var originLat = data.lat;
          var originLon = data.lon;
          var base_wind = parseFloat(data.wind) || 0;
          var base_speed_m_per_min = base_wind * 1000.0 / 60.0;
          var total_distance = base_speed_m_per_min * minutes; // meters
          if (total_distance <= 0) return;

          // Walk forward in ~1 km steps, using local wind direction at each sample to determine
          // the next step direction (this creates bends in the centerline).
          // sampling step in meters read from UI (km -> m)
          var sampleKm = (typeof sampleStepEl !== 'undefined' && sampleStepEl) ? parseFloat(sampleStepEl.value) : 1.0;
          var stepMeters = Math.max(50, (sampleKm || 1.0) * 1000.0); // min 50 m to avoid zero
          var remaining = total_distance;
          var currentPos = [originLat, originLon];
          var traveled = 0;
          var samples = [];

          while (remaining > 0) {
            var step = Math.min(stepMeters, remaining);
            // Lookup local weather for the current sample position (cache-aware)
            var latq = currentPos[0], lonq = currentPos[1];
            var wkey = cacheKey(latq, lonq);
            var localWind = base_wind, localWindDir = data.dirTo;
            if (lookupCache.weather[wkey]) {
              localWind = lookupCache.weather[wkey].windspeed;
              localWindDir = lookupCache.weather[wkey].winddir;
            } else {
              try {
                var wurl = `https://api.open-meteo.com/v1/forecast?latitude=${latq}&longitude=${lonq}&hourly=temperature_2m,relative_humidity_2m,precipitation,weather_code,surface_pressure&past_days=92&forecast_days=16`;
                var wr = await fetch(wurl);
                if (wr.ok) {
                  var wj = await wr.json();
                  var lw = wj.current_weather?.windspeed ?? base_wind;
                  var ld = wj.current_weather?.winddirection ?? data.dirTo;
                  lookupCache.weather[wkey] = { windspeed: lw, winddir: ld };
                  localWind = lw; localWindDir = ld;
                }
              } catch (e) {
                // keep defaults
              }
            }

            // convert meta (from) to 'to' bearing
            var bearing = (parseFloat(localWindDir) + 180) % 360;
            // step forward using local bearing
            var nextPos = destinationPoint(currentPos[0], currentPos[1], step, bearing);
            traveled += step;
            remaining -= step;
            var frac = Math.min(1, traveled / total_distance);
            samples.push({ pos: currentPos, nextPos: nextPos, frac: frac, step: step, localWind: localWind, bearing: bearing });
            // advance
            currentPos = nextPos;
          }

          // Try to get elevations for samples (to compute slope factors)
          var elevs = null;
          try {
            var elevLocs = samples.map(function(s){ return `${s.pos[0]},${s.pos[1]}`; }).join('|');
            if (elevLocs) {
              var elevUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${elevLocs}`;
              var er = await fetch(elevUrl);
              if (er.ok) {
                var ej = await er.json();
                elevs = ej.results?.map(function(r){ return r.elevation; });
                // populate cache
                for (var ii=0; ii<samples.length; ii++) {
                  var ek = cacheKey(samples[ii].pos[0], samples[ii].pos[1]);
                  lookupCache.elevation = lookupCache.elevation || {};
                  lookupCache.elevation[ek] = elevs[ii];
                }
              }
            }
          } catch (e) { elevs = null; }

          // compute slopeFactor per sample
          for (var si = 0; si < samples.length; si++) {
            var s = samples[si];
            var sf = 1.0;
            if (elevs && elevs.length === samples.length) {
              var elevHere = elevs[si];
              var elevPrev = si>0 ? elevs[si-1] : elevs[si];
              var de = Math.abs(elevHere - elevPrev);
              sf = 1.0 + Math.min(2.0, de / 100.0);
            }
            s.slopeFactor = sf;
          }

          // Build irregular outline: for each sample compute a lateral offset proportional to local dispersion
          var rightPts = [];
          var leftPts = [];
          var centerCoords = [];
          for (var idx = 0; idx < samples.length; idx++) {
            var s = samples[idx];
            // approximate time to reach this sample (in minutes) using base speed
            var distToHere = (s.frac * total_distance); // meters
            var tmin = (base_speed_m_per_min > 0) ? (distToHere / base_speed_m_per_min) : (minutes * s.frac);
            var lw = parseFloat(s.localWind) || base_wind;
            // read visualization parameters from UI (with sensible defaults)
            var baseHalf = (baseWidthEl && parseFloat(baseWidthEl.value)) ? parseFloat(baseWidthEl.value) : 50;
            var timeCoeff = (timeCoeffEl && parseFloat(timeCoeffEl.value)) ? parseFloat(timeCoeffEl.value) : 6;
            var windMult = (windMultEl && parseFloat(windMultEl.value)) ? parseFloat(windMultEl.value) : 2.5;
            var slopeMult = (slopeMultEl && parseFloat(slopeMultEl.value)) ? parseFloat(slopeMultEl.value) : 1.0;
            var jitterPct = (jitterEl && parseFloat(jitterEl.value)) ? parseFloat(jitterEl.value) / 100.0 : 0.12;
            var dispSlope = (dispSlopeEl && parseFloat(dispSlopeEl.value)) ? parseFloat(dispSlopeEl.value) : 20; // m per km
            // linear dispersion growth term (convert dist to km)
            var distKm = Math.max(0, distToHere / 1000.0);
            var linearDisp = dispSlope * distKm; // meters added per km
            // lateral half-width (meters): base + linear dispersion + time term + wind term scaled by slope multiplier
            var halfWidth = baseHalf + linearDisp + timeCoeff * tmin + (lw * windMult) * (1 + (s.slopeFactor - 1) * slopeMult);
            // add a small random jitter to avoid perfect symmetry
            var jitter = (Math.random() - 0.5) * Math.min(halfWidth * jitterPct, 30);
            halfWidth = Math.max(8, halfWidth + jitter);

            // perpendicular bearings
            var rightB = (s.bearing + 90) % 360;
            var leftB = (s.bearing + 270) % 360;
            var r = destinationPoint(s.pos[0], s.pos[1], halfWidth, rightB);
            var l = destinationPoint(s.pos[0], s.pos[1], halfWidth, leftB);
            rightPts.push([r[0], r[1]]);
            leftPts.push([l[0], l[1]]);
            centerCoords.push([s.pos[0], s.pos[1]]);
          }

          // Determine tip as the last sample's nextPos
          var tipPos = samples.length ? samples[samples.length-1].nextPos : destinationPoint(originLat, originLon, total_distance, data.dirTo);

          // Build polygon points: origin -> rightPts (in order) -> tip -> leftPts (reversed)
          var polyPoints = [];
          polyPoints.push([originLat, originLon]);
          polyPoints = polyPoints.concat(rightPts);
          polyPoints.push([tipPos[0], tipPos[1]]);
          polyPoints = polyPoints.concat(leftPts.slice().reverse());

          // Draw polygon (irregular front)
          var plumeOpacity = (opacityEl && parseFloat(opacityEl.value)) ? parseFloat(opacityEl.value) : 0.26;
          var plume = L.polygon(polyPoints, { color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: plumeOpacity, weight: 1 });
          plume.addTo(layer);

          // Draw centerline following the bent samples and ending in tip
          var centerLine = centerCoords.slice();
          centerLine.push([tipPos[0], tipPos[1]]);
          var line = L.polyline(centerLine, { color: '#b45309', weight: 1.8, opacity: 0.9 });
          line.addTo(layer);

          // Add tip marker with distance info
          var totalDistRound = Math.round(total_distance);
          var tipMarker = L.circleMarker([tipPos[0], tipPos[1]], { radius: 5, fillColor: '#b45309', color: '#fff', weight: 0.6, fillOpacity: 0.95 }).addTo(layer);
          tipMarker.bindPopup(`<strong>Irregular smoke tip</strong><br>Approx. distance: ${totalDistRound} m<br>Samples: ${samples.length}`);
        } catch (err) {
          console.warn('Probabilistic irregular plume failed, falling back to simple plume:', err);
          drawSmokePlume(data, minutes);
        }
      }

      // wire slider
      // Debounced handler for slider to avoid many network calls while dragging
      var debouncedCompute = debounce(function (plume, mins) {
        if (probToggle && probToggle.checked) computeProbabilisticPlume(plume, mins);
        else drawSmokePlume(plume, mins);
      }, 350);

      smokeSlider.addEventListener('input', function () {
        var mins = parseInt(this.value, 10);
        smokeMinutesEl.textContent = mins;
        if (lastPlume) debouncedCompute(lastPlume, mins);
      });

      // Legend intentionally not added to the map; UI legend lives in the controls panel
      
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
        if (!clickLogs.length) return alert('No records to download');
        var header = ['timestamp','lat','lon','temp_C','humidity_pct','wind_kmh','winddir_deg','risk'];
        var rows = [header].concat(clickLogs.map(function(r){ return [r.timestamp, r.lat, r.lon, r.temp, r.humidity, r.wind, r.winddir, r.risk]; }));
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
        var chartCanvas = document.getElementById('weather-chart');
        // add compact class to parent to make chart small by CSS
        var chartWrapper = chartCanvas && chartCanvas.parentElement ? chartCanvas.parentElement : null;
        if (chartWrapper && chartWrapper.classList) chartWrapper.classList.add('compact');

        var ctx = chartCanvas.getContext('2d');
        var weatherChart = new Chart(ctx, {
          type: 'line',
          data: { labels: [], datasets: [
            { label: 'Temperatura (°C)', data: [], borderColor: '#ef4444', tension:0.3, yAxisID: 'y', pointRadius: 2},
            { label: 'Humedad (%)', data: [], borderColor: '#3b82f6', tension:0.3, yAxisID: 'y2', pointRadius: 2}
          ]},
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index' } },
            scales: {
              x: { display: false },
              y: { type: 'linear', position: 'left', ticks: { color: '#fff' } },
              y2: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#fff' } }
            }
          }
        });

        // Manejar clic en el mapa para consultar clima y estimar riesgo de incendio
        map.on('click', async function (e) {
        var lat = e.latlng.lat.toFixed(4);
        var lon = e.latlng.lng.toFixed(4);

  // Open-Meteo API (sin clave) — solicitamos temperatura, humedad, viento y dirección horario
  var url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,windspeed_80m,winddirection_10m&current_weather=true&timezone=UTC`;

        try {
          var res = await fetch(url);
          var data = await res.json();

          // Preferimos current_weather si está disponible
          var temp = data.current_weather?.temperature ?? (data.hourly?.temperature_2m?.[0] ?? null);
          var wind = data.current_weather?.windspeed ?? (data.hourly?.windspeed_10m?.[0] ?? null);
          var humidity = data.hourly?.relativehumidity_2m?.[0] ?? null;
          // Wind direction in degrees (meteorological: from where the wind blows)
          var winddir = data.current_weather?.winddirection ?? (data.hourly?.winddirection_10m?.[0] ?? null);

          // Heurística simple de riesgo de incendio
          // Regla: Alto si temp>=30°C, humedad<=30% y viento>=20 km/h
          var risk = 'Desconocido';
          if (temp !== null && humidity !== null && wind !== null) {
            if (temp >= 30 && humidity <= 30 && wind >= 20) risk = 'Alto';
            else if (temp >= 25 && humidity <= 40 && wind >= 10) risk = 'Moderado';
            else risk = 'Bajo';
          }

          var infoHtml = `<p><strong>Location:</strong> ${lat}, ${lon}</p>` +
            `<p><strong>Temperature:</strong> ${temp ?? '—'} °C</p>` +
            `<p><strong>Humidity:</strong> ${humidity ?? '—'} %</p>` +
            `<p><strong>Wind:</strong> ${wind ?? '—'} km/h</p>` +
            `<p><strong>Wind direction:</strong> ${winddir ?? '—'}°</p>` +
            `<p><strong>Estimated fire risk:</strong> <strong class="risk-${risk.toLowerCase()}">${risk}</strong></p>`;

          var winfo = document.getElementById('weather-info');
          var details = document.getElementById('weather-details');
          if (details) details.innerHTML = infoHtml;

          // Guardar registro (incluye winddir)
          var now = new Date().toISOString();
          var rec = { timestamp: now, lat: lat, lon: lon, temp: temp, humidity: humidity, wind: wind, winddir: winddir, risk: risk };
          clickLogs.unshift(rec); // push al frente
          if (clickLogs.length > 200) clickLogs.pop();

          // Prepare smoke-plume data and enable slider
          try {
            var dirTo = (winddir !== null) ? ((parseFloat(winddir) + 180) % 360) : null;
            lastPlume = { lat: parseFloat(lat), lon: parseFloat(lon), dirTo: dirTo, wind: wind };
            smokeTempEl.textContent = (temp !== null) ? temp : '—';
            smokeHumEl.textContent = (humidity !== null) ? humidity : '—';
            smokeSlider.disabled = false;
            // draw default 10-minute probabilistic plume (async)
            computeProbabilisticPlume(lastPlume, parseInt(smokeSlider.value, 10) || 10);
          } catch (err) { console.warn('Could not prepare smoke plume:', err); }

          // Draw wind arrow (pointing TO the wind direction). Open-Meteo provides direction FROM, so add 180° to get direction TO.
          try {
            // Ensure a single arrows and fires layer exist
            if (!window.__hotspot_arrows_layer) window.__hotspot_arrows_layer = L.layerGroup().addTo(map);
            if (!window.__hotspot_fires_layer) window.__hotspot_fires_layer = L.layerGroup().addTo(map);

            // Clear previous markers so we don't accumulate them
            window.__hotspot_arrows_layer.clearLayers();
            window.__hotspot_fires_layer.clearLayers();

            var arrowsLayer = window.__hotspot_arrows_layer;

            if (winddir !== null) {
              var dirTo = (parseFloat(winddir) + 180) % 360;
              // Scale arrow size by wind speed (min 16, max 64)
              var speed = (wind || 0);
              var size = Math.min(64, Math.max(16, 16 + Math.round(speed)));
              // Simple SVG arrow rotated to dirTo and scaled
              var arrowSvg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24'><g transform='translate(12,12) rotate(${dirTo}) translate(-12,-12)'><path d='M12 2 L16 9 L12 7 L8 9 Z' fill='#0b6e99'/><rect x='11' y='7' width='2' height='10' fill='#0b6e99' rx='1'/></g></svg>`;
              var iconSize = [size, size];
              var iconAnchor = [Math.round(size/2), Math.round(size/2)];
              var arrowIcon = L.divIcon({ html: arrowSvg, className: 'wind-arrow-icon', iconSize: iconSize, iconAnchor: iconAnchor });
              var arrowMarker = L.marker([parseFloat(lat), parseFloat(lon)], { icon: arrowIcon }).addTo(arrowsLayer);
              arrowMarker.bindPopup(`<strong>Wind:</strong> ${wind ?? '—'} km/h<br><strong>Direction (TO):</strong> ${dirTo}°`);
            }
          } catch (err) {
            console.warn('Could not draw wind arrow:', err);
          }

          // Añadir marcador con emoji de fuego si el riesgo es Alto
          try {
            if (risk === 'Alto') {
              var firesLayer = window.__hotspot_fires_layer || L.layerGroup().addTo(map);
              window.__hotspot_fires_layer = firesLayer;
              var fireHtml = `<div style="font-size:28px;line-height:28px;">🔥</div>`;
              var fireIcon = L.divIcon({ html: fireHtml, className: 'fire-emoji-icon', iconSize: [28,28], iconAnchor: [14,14] });
              var fireMarker = L.marker([parseFloat(lat), parseFloat(lon)], { icon: fireIcon }).addTo(firesLayer);
              fireMarker.bindPopup(`<strong>HIGH RISK</strong><br>${lat}, ${lon}`);
            }
          } catch (err) {
            console.warn('Could not add fire marker:', err);
          }

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
          console.error('Error querying Open-Meteo:', err);
          var winfo = document.getElementById('weather-info');
          if (winfo) winfo.innerHTML = `<p>Error querying weather data.</p>`;
        }
        });
      });
    } catch (err) {
      console.error('Error inicializando Leaflet:', err);
    }
  });
})();

document.addEventListener('DOMContentLoaded', function () {
  // Enhance temperature chart rendering
  var chartEl = document.querySelector('#weather-panel .controls-chart');
  if (chartEl) {
    // If a real Chart.js canvas exists inside this container, skip adding the decorative SVG.
    var existingCanvas = chartEl.querySelector('canvas#weather-chart');
    if (!existingCanvas) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '200');

      var tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tempLine.setAttribute('class', 'line temperature');
      tempLine.setAttribute('d', 'M10,10 L100,100'); // Example path data

      var humLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      humLine.setAttribute('class', 'line humidity');
      humLine.setAttribute('d', 'M10,20 L100,120'); // Example path data

      svg.appendChild(tempLine);
      svg.appendChild(humLine);

      // Add interactivity
      svg.addEventListener('mousemove', function (event) {
        var tooltip = document.querySelector('#tooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'tooltip';
          tooltip.style.position = 'absolute';
          tooltip.style.background = 'rgba(0,0,0,0.7)';
          tooltip.style.color = '#fff';
          tooltip.style.padding = '5px';
          tooltip.style.borderRadius = '4px';
          tooltip.style.pointerEvents = 'none';
          document.body.appendChild(tooltip);
        }
        tooltip.style.left = event.pageX + 'px';
        tooltip.style.top = event.pageY + 'px';
        tooltip.textContent = `Temp: ${Math.random().toFixed(2)}°C, Hum: ${Math.random().toFixed(2)}%`;
      });

      svg.addEventListener('mouseleave', function () {
        var tooltip = document.querySelector('#tooltip');
        if (tooltip) {
          tooltip.remove();
        }
      });

      chartEl.appendChild(svg);
    }
  }
});

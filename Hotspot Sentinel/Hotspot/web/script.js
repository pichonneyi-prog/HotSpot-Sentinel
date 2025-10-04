const map = L.map('map').setView([-38.5, -63.0], 4); // Centro de Argentina

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Capa de provincias de Argentina
fetch('https://raw.githubusercontent.com/deldersveld/topojson/master/countries/argentina/argentina-provinces.json')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: '#555',
        weight: 1,
        fillOpacity: 0.1
      }
    }).addTo(map);
  });

// Capas SAR simuladas
const layers = {
  c_hh: L.circle([-31.4, -64.2], { radius: 50000, color: 'red', fillOpacity: 1 }),
  l_hv: L.circle([-34.6, -58.4], { radius: 50000, color: 'blue', fillOpacity: 1 }),
  p_vv: L.circle([-26.8, -65.2], { radius: 50000, color: 'green', fillOpacity: 1 })
};

let currentLayer = layers.c_hh;
currentLayer.addTo(map);

// Selector de capa
document.getElementById('layerSelect').addEventListener('change', function (e) {
  map.removeLayer(currentLayer);
  currentLayer = layers[e.target.value];
  currentLayer.addTo(map);

  const story = document.getElementById('story');
  if (e.target.value === 'c_hh') {
    story.textContent = 'C-HH: Rugosidad superficial como edificios y vegetación densa.';
  } else if (e.target.value === 'l_hv') {
    story.textContent = 'L-HV: Humedad del suelo y sotobosque.';
  } else {
    story.textContent = 'P-VV: Penetración profunda, útil para estudios geológicos.';
  }
});

// Deslizador de opacidad
document.getElementById('slider').addEventListener('input', function (e) {
  const value = e.target.value;
  currentLayer.setStyle({ fillOpacity: value / 100 });
});

// Gráfico con nomenclatura y filtro
const ctx = document.getElementById('sarChart').getContext('2d');

const fullData = {
  labels: ['C-HH', 'L-HV', 'P-VV'],
  datasets: [{
    label: 'Intensidad de retrodispersión (dB)',
    data: [65, 45, 30],
    backgroundColor: ['red', 'blue', 'green'],
    signalKeys: ['c_hh', 'l_hv', 'p_vv']
  }]
};

let sarChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: fullData.labels,
    datasets: [fullData.datasets[0]]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: function(context) {
            const signal = context.label;
            if (signal === 'C-HH') return 'C-HH: Rugosidad superficial';
            if (signal === 'L-HV') return 'L-HV: Humedad del suelo';
            if (signal === 'P-VV') return 'P-VV: Penetración profunda';
            return context.label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Intensidad (dB)' }
      },
      x: {
        title: { display: true, text: 'Señal SAR' }
      }
    }
  }
});

// Filtro de señales
document.getElementById('signalFilter').addEventListener('change', function (e) {
  const value = e.target.value;
  let filteredLabels = [];
  let filteredData = [];
  let filteredColors = [];

  fullData.datasets[0].signalKeys.forEach((key, index) => {
    if (value === 'all' || key === value) {
      filteredLabels.push(fullData.labels[index]);
      filteredData.push(fullData.datasets[0].data[index]);
      filteredColors.push(fullData.datasets[0].backgroundColor[index]);
    }
  });

  sarChart.data.labels = filteredLabels;
  sarChart.data.datasets[0].data = filteredData;
  sarChart.data.datasets[0].backgroundColor = filteredColors;
  sarChart.update();
});

// Simulación de propiedades SAR en un punto
function getSimulatedProperties(lat, lng) {
  const retro = (Math.random() * 30 + 30).toFixed(2);
  const humedad = (Math.random() * 100).toFixed(1);
  const cobertura = ['Vegetación densa', 'Suelo húmedo', 'Zona urbana', 'Agua superficial'];
  const tipo = cobertura[Math.floor(Math.random() * cobertura.length)];

  return {
    lat: lat.toFixed(4),
    lng: lng.toFixed(4),
    retrodispersión: `${retro} dB`,
    humedad: `${humedad}%`,
    tipoCobertura: tipo
  };
}

// Evento de clic en el mapa
map.on('click', function (e) {
  const props = getSimulatedProperties(e.latlng.lat, e.latlng.lng);

  // Mostrar popup en el mapa
  L.popup()
    .setLatLng(e.latlng)
    .setContent(`<strong>${props.tipoCobertura}</strong><br>Retro: ${props.retrodispersión}<br>Humedad: ${props.humedad}`)
    .openOn(map);

  // Mostrar en el panel
  const panel = document.getElementById('pointData');
  panel.innerHTML = `
    <p><strong>Latitud:</strong> ${props.lat}</p>
    <p><strong>Longitud:</strong> ${props.lng}</p>
    <p><strong>Tipo de cobertura:</strong> ${props.tipoCobertura}</p>
    <p><strong>Retrodispersión:</strong> ${props.retrodispersión}</p>
    <p><strong>Humedad estimada:</strong> ${props.humedad}</p>
  `;
});

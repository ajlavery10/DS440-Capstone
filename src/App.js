import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';
import customGeoJSON from './data/custom.geo.json'; 


const countryCoordinates = {
  China: [35, 105],
  USA: [37.0902, -95.7129],
  India: [20.5937, 78.9629],
  Germany: [51.1657, 10.4515],
};

function ChangeView({ center }) {
  const map = useMap();
  map.flyTo(center, 5); 
  return null;
}

function App() {
  const [evAdoptionRate, setEvAdoptionRate] = useState(0); 
  const [selectedCountry, setSelectedCountry] = useState('China'); 
  const [mapCenter, setMapCenter] = useState(countryCoordinates['China']); 
  const [yearRange, setYearRange] = useState([2024, 2099]); 

  // Sample data
  const sampleEmissionsData = {
    China: [
      { year: 2020, emissions: 9500 },
      { year: 2021, emissions: 9300 },
      { year: 2022, emissions: 9100 },
      { year: 2023, emissions: 8900 },
      { year: 2024, emissions: 8700 },
      { year: 2025, emissions: 8500 },
    ],
    USA: [
      { year: 2020, emissions: 6000 },
      { year: 2021, emissions: 5900 },
      { year: 2022, emissions: 5800 },
      { year: 2023, emissions: 5700 },
      { year: 2024, emissions: 5600 },
      { year: 2025, emissions: 5500 },
    ],
    India: [
      { year: 2020, emissions: 5000 },
      { year: 2021, emissions: 4900 },
      { year: 2022, emissions: 4800 },
      { year: 2023, emissions: 4700 },
      { year: 2024, emissions: 4600 },
      { year: 2025, emissions: 4500 },
    ],
    Germany: [
      { year: 2020, emissions: 800 },
      { year: 2021, emissions: 780 },
      { year: 2022, emissions: 760 },
      { year: 2023, emissions: 740 },
      { year: 2024, emissions: 720 },
      { year: 2025, emissions: 700 },
    ],
  };


  const filterDataByYearRange = (data) => {
    return data.filter((d) => d.year >= yearRange[0] && d.year <= yearRange[1]);
  };

  
  const getCountryStyle = (feature) => {
    const isSelected = feature.properties.name === selectedCountry;
    const color = isSelected ? `rgb(${255 - evAdoptionRate * 2.55}, ${evAdoptionRate * 2.55}, 0)` : '#cccccc';
    return {
      fillColor: color,
      weight: 1,
      color: 'black',
      fillOpacity: 0.7,
    };
  };

 
  const handleCountryChange = (event) => {
    const country = event.target.value;
    setSelectedCountry(country);
    setMapCenter(countryCoordinates[country]); 
  };

  
  const handleYearRangeChange = (event, index) => {
    const newRange = [...yearRange];
    newRange[index] = Number(event.target.value);
    setYearRange(newRange);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>EV Adoption and Emissions Dashboard</h2>

      {/* Country Selector */}
      <p>Select Country:</p>
      <select value={selectedCountry} onChange={handleCountryChange}>
        <option value="China">China</option>
        <option value="USA">USA</option>
        <option value="India">India</option>
        <option value="Germany">Germany</option>
        {/* Add more countries as needed */}
      </select>

      {/* EV Adoption Rate Slider */}
      <p>Adjust EV Adoption Rate: {evAdoptionRate}%</p>
      <input
        type="range"
        min="0"
        max="100"
        value={evAdoptionRate}
        onChange={(e) => setEvAdoptionRate(Number(e.target.value))}
      />

      {/* Year Range Sliders */}
      <p>Select Year Range: {yearRange[0]} - {yearRange[1]}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <input
          type="range"
          min="2024"
          max="2099"
          value={yearRange[0]}
          onChange={(e) => handleYearRangeChange(e, 0)}
        />
        <input
          type="range"
          min="2024"
          max="2099"
          value={yearRange[1]}
          onChange={(e) => handleYearRangeChange(e, 1)}
        />
      </div>

      {/* Map Container with limited width and zoom based on selected country */}
      <div style={{ width: '60%', margin: '0 auto', marginTop: '20px' }}>
        <MapContainer style={{ height: '400px', width: '100%' }} center={mapCenter} zoom={4}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={mapCenter} /> {/* Move map based on selection */}
          <GeoJSON data={customGeoJSON} style={getCountryStyle} />
        </MapContainer>
      </div>

      {/* Line Chart for Emissions filtered by year range */}
      <ResponsiveContainer width="100%" height={300} style={{ marginTop: '20px' }}>
        <LineChart data={filterDataByYearRange(sampleEmissionsData[selectedCountry])} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="emissions" stroke="#8884d8" name="Predicted Emissions" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default App;

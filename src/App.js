import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';
import * as d3 from 'd3';


function App() {
  const [co2EmissionsData, setCo2EmissionsData] = useState({});
  const [countryEmissions, setCountryEmissions] = useState([]);
  const [predictionData, setPredictionData] = useState([]);
  const [evAdoptionRate, setEvAdoptionRate] = useState(0); 
  const [selectedCountry, setSelectedCountry] = useState('China'); 
  const [mapCenter, setMapCenter] = useState([20, 0]); 
  const [geoData, setGeoData] = useState(null);


  // Load emissions data
  useEffect(() => {
    d3.csv('/data/co2_emissions_kt_by_country.csv').then(data => {
      const parsedData = data.reduce((acc, item) => {
        const year = +item.year;
        if (!acc[item.country_name]) acc[item.country_name] = [];
        acc[item.country_name].push({ year, emissions: +item.value });
        return acc;
      }, {});
      setCo2EmissionsData(parsedData);
    }).catch(error => console.error("Error loading CO2 emissions data:", error));
  }, []);


  // Load GeoJSON data 
  useEffect(() => {
    fetch('/data/custom.geo.json')
      .then(response => response.json())
      .then(data => setGeoData(data))
      .catch(error => console.error("Error loading GeoJSON:", error));
  }, []);


  // Load prediction data for the selected country
  useEffect(() => {
    if (selectedCountry) {
      fetch(`http://127.0.0.1:5000/predict/${selectedCountry}?start_year=2023&end_year=2050`)
        .then(response => response.json())
        .then(data => setPredictionData(data.predictions || []))
        .catch(error => console.error("Error loading prediction data:", error));
    }
  }, [selectedCountry]);


  // Update line graph data based on selected country and EV rate
  useEffect(() => {
    const emissionsData = co2EmissionsData[selectedCountry] || [];
    const adjustedData = emissionsData.map(d => ({
      ...d,
      adjustedEmissions: d.emissions * (1 - evAdoptionRate / 100)
    }));
    setCountryEmissions(adjustedData);
  }, [selectedCountry, evAdoptionRate, co2EmissionsData]);


  // Combine historical and prediction data for the line chart
  const combinedEmissionsData = [
    ...countryEmissions,
    ...predictionData.map(d => ({
      year: d.year,
      emissions: d.emissions,
      adjustedEmissions: d.emissions * (1 - evAdoptionRate / 100)
    }))
  ].filter((value, index, self) =>
    index === self.findIndex((t) => t.year === value.year) 
  ).sort((a, b) => a.year - b.year); 


  // Calculate color based on adjusted CO2 emissions for the map
  const getAdjustedColor = (emissions) => {
    const adjustedEmissions = emissions * (1 - evAdoptionRate / 100); 
    const colorIntensity = Math.max(0, Math.min(255, 255 - adjustedEmissions / 5000 * 255));
    return `rgb(${255 - colorIntensity}, ${colorIntensity}, 0)`;
  };


  const getCountryStyle = (feature) => {
    const countryName = feature.properties.name;
    const emissions = (co2EmissionsData[countryName] || []).reduce((acc, data) => acc + data.emissions, 0) / (co2EmissionsData[countryName]?.length || 1);
    const color = getAdjustedColor(emissions);
    return {
      fillColor: color,
      weight: 1,
      color: 'black',
      fillOpacity: 0.7,
    };
  };


  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
  };


  const Legend = () => (
    <div style={{ position: 'absolute', bottom: '30px', left: '10px', background: 'white', padding: '10px' }}>
      <h4>CO2 Emissions</h4>
      <div style={{ backgroundColor: 'rgb(255, 0, 0)', color: 'white', padding: '5px' }}>High Emissions</div>
      <div style={{ backgroundColor: 'rgb(0, 255, 0)', color: 'white', padding: '5px' }}>Low Emissions</div>
    </div>
  );


  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <h2>CO2 Emissions and EV Adoption Dashboard</h2>


      {/* EV Adoption Rate Slider */}
      <p>Adjust EV Adoption Rate: {evAdoptionRate}%</p>
      <input
        type="range"
        min="0"
        max="100"
        value={evAdoptionRate}
        onChange={(e) => setEvAdoptionRate(Number(e.target.value))}
      />


      {/* Country Selector for Line Chart */}
      <p>Select Country for Emissions Over Time:</p>
      <select value={selectedCountry} onChange={handleCountryChange}>
        {Object.keys(co2EmissionsData).map(country => (
          <option key={country} value={country}>{country}</option>
        ))}
      </select>


      {/* Map Container with GeoJSON layer */}
      <MapContainer style={{ height: '400px', width: '100%', marginTop: '20px' }} center={mapCenter} zoom={2}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData && <GeoJSON data={geoData} style={getCountryStyle} />}
      </MapContainer>
      <Legend />


      {/* Line Chart for Emissions Over Time */}
      <ResponsiveContainer width="100%" height={300} style={{ marginTop: '20px' }}>
        <LineChart data={combinedEmissionsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="emissions" stroke="#8884d8" name="Original Emissions" />
          <Line type="monotone" dataKey="adjustedEmissions" stroke="#82ca9d" name="Adjusted Emissions" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


export default App;





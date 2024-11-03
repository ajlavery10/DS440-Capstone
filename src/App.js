import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';
import * as d3 from 'd3';

function App() {
  const [co2EmissionsData, setCo2EmissionsData] = useState({});
  const [countryEmissions, setCountryEmissions] = useState([]);
  const [predictionData, setPredictionData] = useState({});
  const [evAdoptionRate, setEvAdoptionRate] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState('China');
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [geoData, setGeoData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2019);

  const countryNameMap = {
    "United States of America": "United States",
    "USA": "United States",
  };

  const normalizeCountryName = (name) => countryNameMap[name] || name;

  // Load emissions data
  useEffect(() => {
    d3.csv('/data/co2_emissions_kt_by_country.csv').then(data => {
      const parsedData = data.reduce((acc, item) => {
        const year = +item.year;
        const countryName = normalizeCountryName(item.country_name);
        if (!acc[countryName]) acc[countryName] = [];
        acc[countryName].push({ year, emissions: +item.value });
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

  // Load prediction data for all countries for years beyond 2019
  useEffect(() => {
    const countries = Object.keys(co2EmissionsData);
    countries.forEach(country => {
      fetch(`http://127.0.0.1:5000/predict/${country}?start_year=2020&end_year=2050`)
        .then(response => response.json())
        .then(data => {
          setPredictionData(prevState => ({
            ...prevState,
            [country]: data.predictions || []
          }));
        })
        .catch(error => console.error(`Error loading prediction data for ${country}:`, error));
    });
  }, [co2EmissionsData]);

  // Adjust CO2 emissions data based on EV adoption rate
  useEffect(() => {
    const emissionsData = co2EmissionsData[selectedCountry] || [];
    const adjustedData = emissionsData.map(d => ({
      ...d,
      adjustedEmissions: d.emissions * (1 - (evAdoptionRate * 0.003))
    }));
    setCountryEmissions(adjustedData);
  }, [selectedCountry, evAdoptionRate, co2EmissionsData]);

  // Combine historical and prediction data for the line chart
  const combinedEmissionsData = [
    ...countryEmissions,
    ...(predictionData[selectedCountry] || []).map(d => ({
      year: d.year,
      emissions: d.emissions,
      adjustedEmissions: d.emissions * (1 - (evAdoptionRate * 0.003))
    }))
  ].filter((value, index, self) =>
    index === self.findIndex((t) => t.year === value.year)
  ).sort((a, b) => a.year - b.year);

  const getAdjustedColor = (emissions) => {
    const adjustedEmissions = emissions * (1 - (evAdoptionRate * 0.003));
    const colorIntensity = Math.log(adjustedEmissions + 1) / Math.log(1000000);
    const redIntensity = Math.min(255, colorIntensity * 255);
    const greenIntensity = 255 - redIntensity;
    return `rgb(${Math.round(redIntensity)}, ${Math.round(greenIntensity)}, 0)`;
  };

  const getCountryStyle = (feature) => {
    const countryName = normalizeCountryName(feature.properties.name);
    const emissionsData = co2EmissionsData[countryName] || [];
    let emissions = 0;

    if (selectedYear > 2019) {
      const prediction = predictionData[countryName]?.find(d => d.year === selectedYear);
      emissions = prediction ? prediction.emissions : 0;
    } else {
      const yearData = emissionsData.find(d => d.year === selectedYear);
      emissions = yearData ? yearData.emissions : 0;
    }

    const color = emissions ? getAdjustedColor(emissions) : 'gray';
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

  const handleYearChange = (event) => {
    setSelectedYear(Number(event.target.value));
  };

  const Legend = () => (
    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'white', padding: '10px' }}>
      <h4>CO2 Emissions</h4>
      <div style={{ backgroundColor: 'rgb(255, 0, 0)', color: 'white', padding: '5px' }}>High Emissions</div>
      <div style={{ backgroundColor: 'rgb(255, 165, 0)', color: 'white', padding: '5px' }}>Moderate Emissions</div>
      <div style={{ backgroundColor: 'rgb(0, 255, 0)', color: 'white', padding: '5px' }}>Low Emissions</div>
      <div style={{ backgroundColor: 'gray', color: 'white', padding: '5px' }}>No Data</div>
    </div>
  );

  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <h2>CO2 Emissions and EV Adoption Dashboard</h2>

      <p>Adjust EV Adoption Rate: {evAdoptionRate}%</p>
      <input
        type="range"
        min="0"
        max="100"
        value={evAdoptionRate}
        onChange={(e) => setEvAdoptionRate(Number(e.target.value))}
      />

      <p>Select Country for Emissions Over Time:</p>
      <select value={selectedCountry} onChange={handleCountryChange}>
        {Object.keys(co2EmissionsData).map(country => (
          <option key={country} value={country}>{country}</option>
        ))}
      </select>

      <p>Select Year: {selectedYear}</p>
      <input
        type="range"
        min="1960"
        max="2050"
        value={selectedYear}
        onChange={handleYearChange}
      />

      <MapContainer style={{ height: '400px', width: '100%', marginTop: '20px' }} center={mapCenter} zoom={2}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData && <GeoJSON data={geoData} style={getCountryStyle} />}
      </MapContainer>
      <Legend />

      <ResponsiveContainer width="100%" height={300} style={{ marginTop: '20px' }}>
        <text x="50%" y="20" textAnchor="middle" fontWeight="bold" fontSize="18">CO2 Emissions Over Time</text>
        <LineChart data={combinedEmissionsData} margin={{ top: 20, right: 30, left: 40, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottomRight', offset: -20 }} />
          <YAxis label={{ value: 'CO2 Emissions (kt)', angle: -90, position: 'insideLeft', offset: -10, dy: 20 }} />
          <Tooltip />
          <Line type="monotone" dataKey="emissions" stroke="#8884d8" name="Original Emissions" />
          <Line type="monotone" dataKey="adjustedEmissions" stroke="#82ca9d" name="Adjusted Emissions" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default App;




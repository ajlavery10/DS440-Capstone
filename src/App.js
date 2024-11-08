import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import 'leaflet/dist/leaflet.css';
import * as d3 from 'd3';

function App() {
  const [co2EmissionsData, setCo2EmissionsData] = useState({});
  const [countryEmissions, setCountryEmissions] = useState([]);
  const [secondCountryEmissions, setSecondCountryEmissions] = useState([]);
  const [predictionData, setPredictionData] = useState({});
  const [evAdoptionRate, setEvAdoptionRate] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState('Switzerland');
  const [secondSelectedCountry, setSecondSelectedCountry] = useState('Portugal');
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [geoData, setGeoData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2019);
  const [showEvMap, setShowEvMap] = useState(false);
  const [evStockData, setEvStockData] = useState({});
  const [topEmitters, setTopEmitters] = useState([]);

  const countryNameMap = {
    "United States of America": "United States",
    "USA": "United States",
    "Russian Federation": "Russia" // Ensure "Russia" matches your CSV data
  };
  

  const normalizeCountryName = (name) => countryNameMap[name] || name;

  const validCountries = new Set([
    'Aruba', 'Afghanistan', 'Angola', 'Albania', 'Andorra', 'United Arab Emirates', 'Argentina', 'Armenia',
    'Antigua and Barbuda', 'Australia', 'Austria', 'Azerbaijan', 'Burundi', 'Belgium', 'Benin', 'Burkina Faso',
    'Bangladesh', 'Bulgaria', 'Bahrain', 'Bosnia and Herzegovina', 'Belarus', 'Belize', 'Brazil', 'Barbados',
    'Brunei Darussalam', 'Bhutan', 'Botswana', 'Central African Republic', 'Canada', 'Switzerland', 'Chile',
    'China', 'Cameroon', 'Colombia', 'Comoros', 'Costa Rica', 'Cuba', 'Cyprus', 'Czechia', 'Germany', 'Djibouti',
    'Denmark', 'Dominican Republic', 'Algeria', 'Ecuador', 'Estonia', 'Ethiopia', 'Finland', 'Fiji', 'France',
    'Gabon', 'United Kingdom', 'Georgia', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guyana', 'Honduras',
    'Croatia', 'Haiti', 'Hungary', 'Indonesia', 'India', 'Ireland', 'Iraq', 'Iceland', 'Israel', 'Italy', 'Jamaica',
    'Jordan', 'Japan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Lebanon', 'Liberia', 'Libya', 'Liechtenstein', 'Sri Lanka',
    'Lesotho', 'Lithuania', 'Luxembourg', 'Latvia', 'Morocco', 'Madagascar', 'Maldives', 'Mexico', 'Montenegro',
    'Mongolia', 'Mozambique', 'Mauritania', 'Mauritius', 'Malawi', 'Malaysia', 'Namibia', 'Niger', 'Nigeria',
    'Netherlands', 'Norway', 'Nepal', 'New Zealand', 'Oman', 'Pakistan', 'Panama', 'Peru', 'Philippines', 'Poland',
    'Portugal', 'Qatar', 'Romania', 'Russian Federation', 'Rwanda', 'Saudi Arabia', 'Sudan', 'Senegal', 'Singapore',
    'Sierra Leone', 'Somalia', 'Serbia', 'South Sudan', 'Suriname', 'Slovenia', 'Sweden', 'Eswatini', 'Seychelles',
    'Syrian Arab Republic', 'Chad', 'Togo', 'Thailand', 'Tajikistan', 'Turkmenistan', 'Trinidad and Tobago',
    'Tunisia', 'Turkey', 'Uganda', 'Ukraine', 'Uruguay', 'United States', 'Uzbekistan', 'Vanuatu', 'Samoa',
    'South Africa', 'Zambia', 'Zimbabwe'
  ]);
  

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

  // Load EV stock data
  useEffect(() => {
    d3.csv('/data/EV_Data_Vehicles_Only.csv').then(data => {
      const parsedData = data.reduce((acc, item) => {
        const countryName = normalizeCountryName(item.region);
        if (item.parameter === "EV stock") {
          const stock = +item.value;
          if (!acc[countryName]) acc[countryName] = 0;
          acc[countryName] += stock;
        }
        return acc;
      }, {});
      setEvStockData(parsedData);
    }).catch(error => console.error("Error loading EV stock data:", error));
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

  // Adjust CO2 emissions data based on EV adoption rate for the first selected country
  useEffect(() => {
    const emissionsData = co2EmissionsData[selectedCountry] || [];
    const adjustedData = emissionsData.map(d => ({
      ...d,
      adjustedEmissions: d.emissions * (1 - (evAdoptionRate * 0.003))
    }));
    const predictions = (predictionData[selectedCountry] || []).map(d => ({
      year: d.year,
      emissions: d.emissions,
      adjustedEmissions: d.emissions * (1 - (evAdoptionRate * 0.003))
    }));
    
    const combinedData = [...adjustedData, ...predictions].filter((v, i, a) => a.findIndex(t => t.year === v.year) === i);
    setCountryEmissions(combinedData);
  }, [selectedCountry, evAdoptionRate, co2EmissionsData, predictionData]);

  // Adjust CO2 emissions data based on EV adoption rate for the second selected country
  useEffect(() => {
    const emissionsData = co2EmissionsData[secondSelectedCountry] || [];
    const adjustedData = emissionsData.map(d => ({
      ...d,
      adjustedEmissions: d.emissions * (1 - (evAdoptionRate * 0.003))
    }));
    const predictions = (predictionData[secondSelectedCountry] || []).map(d => ({
      year: d.year,
      emissions: d.emissions,
      adjustedEmissions: d.emissions * (1 - (evAdoptionRate * 0.003))
    }));

    const combinedData = [...adjustedData, ...predictions].filter((v, i, a) => a.findIndex(t => t.year === v.year) === i);
    setSecondCountryEmissions(combinedData);
  }, [secondSelectedCountry, evAdoptionRate, co2EmissionsData, predictionData]);

  // Update top 5 emitters for the selected year
  useEffect(() => {
    const yearEmissions = Object.entries(selectedYear > 2019 ? predictionData : co2EmissionsData)
      .filter(([country]) => validCountries.has(country))
      .map(([country, data]) => {
        const yearData = data.find(d => d.year === selectedYear);
        if (yearData) {
          const adjustedEmissions = yearData.emissions * (1 - (evAdoptionRate * 0.003)); // Apply EV adoption rate adjustment
          return { country, emissions: adjustedEmissions };
        }
        return null;
      })
      .filter(d => d)
      .sort((a, b) => b.emissions - a.emissions)
      .slice(0, 5);
    
    setTopEmitters(yearEmissions);
  }, [selectedYear, co2EmissionsData, predictionData, evAdoptionRate]);
  
  
  

  // Define getCountryStyle function to style each country based on emissions or EV stock
  const getCountryStyle = (feature) => {
    const countryName = normalizeCountryName(feature.properties.name);
    if (showEvMap) {
      const evStock = evStockData[countryName] || 0;
      const color = evStock ? getEvColor(evStock) : 'gray';
      return {
        fillColor: color,
        weight: 1,
        color: 'black',
        fillOpacity: 0.7,
      };
    } else {
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
    }
  };

  const getAdjustedColor = (emissions) => {
    const adjustedEmissions = emissions * (1 - (evAdoptionRate * 0.003));
    const colorIntensity = Math.log(adjustedEmissions + 1) / Math.log(1000000);
    const redIntensity = Math.min(255, colorIntensity * 255);
    const greenIntensity = 255 - redIntensity;
    return `rgb(${Math.round(redIntensity)}, ${Math.round(greenIntensity)}, 0)`;
  };

  const getEvColor = (evStock) => {
    const colorIntensity = Math.min(255, (evStock / 100000) * 255);
    const redIntensity = Math.max(0, 255 - colorIntensity);
    const greenIntensity = Math.min(255, colorIntensity);
    return `rgb(${redIntensity}, ${greenIntensity}, 0)`;
  };

  const handleCountryChange = (event) => setSelectedCountry(event.target.value);
  const handleSecondCountryChange = (event) => setSecondSelectedCountry(event.target.value);
  const handleYearChange = (event) => setSelectedYear(Number(event.target.value));

  const Legend = () => (
    <div style={{ position: 'absolute', top: '0px', left: '10px', background: 'white', padding: '10px' }}>
      <h4>{showEvMap ? 'EV Adoption Levels' : 'CO2 Emissions'}</h4>
      {showEvMap ? (
        <>
          <div style={{ backgroundColor: 'rgb(0, 255, 0)', color: 'white', padding: '5px' }}>High Adoption</div>
          <div style={{ backgroundColor: 'rgb(255, 165, 0)', color: 'white', padding: '5px' }}>Medium Adoption</div>
          <div style={{ backgroundColor: 'rgb(255, 0, 0)', color: 'white', padding: '5px' }}>Low Adoption</div>
          <div style={{ backgroundColor: 'gray', color: 'white', padding: '5px' }}>No Data</div>
        </>
      ) : (
        <>
          <div style={{ backgroundColor: 'rgb(255, 0, 0)', color: 'white', padding: '5px' }}>High Emissions</div>
          <div style={{ backgroundColor: 'rgb(255, 165, 0)', color: 'white', padding: '5px' }}>Moderate Emissions</div>
          <div style={{ backgroundColor: 'rgb(0, 255, 0)', color: 'white', padding: '5px' }}>Low Emissions</div>
          <div style={{ backgroundColor: 'gray', color: 'white', padding: '5px' }}>No Data</div>
        </>
      )}
    </div>
  );

  const adjustmentFactor = 1 - (evAdoptionRate * 0.003);

const barChartData = [
  {
    country: selectedCountry,
    emissions:
      ((selectedYear > 2019
        ? predictionData[selectedCountry]?.find(d => d.year === selectedYear)?.emissions
        : co2EmissionsData[selectedCountry]?.find(d => d.year === selectedYear)?.emissions) || 0) * adjustmentFactor,
    fill: '#ff4d4d'  // default to red for the first country
  },
  {
    country: secondSelectedCountry,
    emissions:
      ((selectedYear > 2019
        ? predictionData[secondSelectedCountry]?.find(d => d.year === selectedYear)?.emissions
        : co2EmissionsData[secondSelectedCountry]?.find(d => d.year === selectedYear)?.emissions) || 0) * adjustmentFactor,
    fill: '#66c966'  // default to green for the second country
  }
];

// Adjust the color based on emissions to ensure the country with higher emissions is red
if (barChartData[0].emissions < barChartData[1].emissions) {
  barChartData[0].fill = '#66c966';
  barChartData[1].fill = '#ff4d4d';
}

  
return (
  <div style={{ textAlign: 'center', marginTop: '60px' }}> {/* Increase top margin for entire dashboard */}
    <h2>CO2 Emissions and EV Adoption Dashboard</h2>
    <button onClick={() => setShowEvMap(!showEvMap)}>
      Toggle to {showEvMap ? 'CO2 Emissions' : 'EV Adoption'} Map
    </button>

    {/* Adjust top margin for Map Container */}
    <div style={{ display: 'flex', marginTop: '60px' }}> {/* Increase top margin for map and sidebar */}
      {/* Map Container */}
      <div style={{ flex: 1, padding: '10px', marginTop: '40px' }}> {/* Shift map down */}
        <MapContainer style={{ height: '400px', width: '100%' }} center={mapCenter} zoom={2}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geoData && <GeoJSON data={geoData} style={getCountryStyle} />}
        </MapContainer>
        <Legend />
      </div>

      {/* Sidebar with Top 5 Emitters, Country Selectors, Sliders */}
      <div style={{ flex: 1, padding: '10px', textAlign: 'left', marginTop: '40px' }}> {/* Shift sidebar down */}
        {/* Top 5 Emitters Panel */}
        <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
          <h3>Top 5 Emitters in {selectedYear}</h3>
          <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
            {topEmitters.map((emitter, index) => (
              <li key={index} style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
                {index + 1}. {emitter.country}: {emitter.emissions.toLocaleString()} kt
              </li>
            ))}
          </ul>
        </div>

        {/* Country Selectors and Sliders */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '20px' }}>
          {/* Country Selectors */}
          <div style={{ flex: 1 }}>
            <p>Select First Country for Emissions Over Time:</p>
            <select value={selectedCountry} onChange={handleCountryChange}>
              {Object.keys(co2EmissionsData).map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            <p style={{ marginTop: '10px' }}>Select Second Country for Emissions Over Time:</p>
            <select value={secondSelectedCountry} onChange={handleSecondCountryChange}>
              {Object.keys(co2EmissionsData).map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Sliders */}
          <div style={{ flex: 1, marginLeft: '20px' }}>
            <p>Adjust EV Adoption Rate: {evAdoptionRate}%</p>
            <input
              type="range"
              min="0"
              max="100"
              value={evAdoptionRate}
              onChange={(e) => setEvAdoptionRate(Number(e.target.value))}
              style={{ width: '100%' }}
            />

            <p style={{ marginTop: '10px' }}>Select Year: {selectedYear}</p>
            <input
              type="range"
              min="1960"
              max="2050"
              value={selectedYear}
              onChange={handleYearChange}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Section for Emissions Comparison Bar Chart and Line Chart */}
    <div style={{ display: 'flex', marginTop: '60px', padding: '0 10px' }}> {/* Increase top margin for bottom section */}
      {/* Emissions Comparison Bar Chart in Bottom-Left Corner */}
      <div style={{ flex: 1, backgroundColor: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', marginRight: '10px' }}>
        <h4>Emissions Comparison</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="country" />
            <YAxis domain={[0, 60000]} label={{ value: 'Emissions (kt)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar
              dataKey="emissions"
              name="Emissions"
              fill={({ payload }) => payload.fill}  // Use the color specified in barChartData
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart in Bottom-Right Corner */}
      <div style={{ flex: 1, backgroundColor: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart margin={{ top: 20, right: 30, left: 40, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" domain={[1960, 2050]} type="number" label={{ value: 'Year', position: 'insideBottomRight', offset: -10 }} />
            <YAxis domain={[0, 60000]} label={{ value: 'CO2 Emissions (kt)', angle: -90, position: 'insideLeft', dy: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="emissions" data={countryEmissions} stroke="#8884d8" name={`${selectedCountry} Emissions`} />
            <Line type="monotone" dataKey="adjustedEmissions" data={countryEmissions} stroke="#82ca9d" name={`${selectedCountry} Adjusted Emissions`} />
            <Line type="monotone" dataKey="emissions" data={secondCountryEmissions} stroke="#ff7f0e" name={`${secondSelectedCountry} Emissions`} />
            <Line type="monotone" dataKey="adjustedEmissions" data={secondCountryEmissions} stroke="#bcbd22" name={`${secondSelectedCountry} Adjusted Emissions`} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);
   
  
  
}

export default App;

import React, { useState, useEffect } from 'react';
import WordCloud from 'react-wordcloud';

function SentimentAnalysis() {
  const [sentimentData, setSentimentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('http://127.0.0.1:5000/api/news-sentiment')
      .then(response => response.json())
      .then(data => {
        setSentimentData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const wordCloudData = sentimentData.flatMap(item =>
    item.keywords.map(keyword => ({ text: keyword, value: 1 }))
  );

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Sentiment Analysis on Climate News</h2>
      
      {/* Word Cloud */}
      <div style={{ margin: '20px auto', width: '80%', height: '300px' }}>
        <WordCloud words={wordCloudData} />
      </div>

      {/* Sentiment Data Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Title</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Sentiment</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Keywords</th>
          </tr>
        </thead>
        <tbody>
          {sentimentData.map((item, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.title}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.sentiment.toFixed(2)}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.keywords.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SentimentAnalysis;

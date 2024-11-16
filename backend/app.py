from flask import Flask, jsonify, request
import joblib
import os
import numpy as np
from flask_cors import CORS
import requests
from google.cloud import language_v1

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'C:/Users/garen/Documents/ds440/evdashboard/nlp-sentiment-analysis-key.json'
app = Flask(__name__)
CORS(app)

# Load ARIMA models from a saved file in the backend directory
models_path = os.path.join(os.path.dirname(__file__), 'country_emissions_models.pkl')
country_models = joblib.load(models_path)
print("ARIMA models loaded successfully")

# Endpoint to get a list of countries
@app.route('/countries', methods=['GET'])
def get_countries():
    return jsonify(list(country_models.keys()))

# Endpoint for predicting CO2 emissions for a specific country using ARIMA models
@app.route('/predict/<country>', methods=['GET'])
def get_predictions_country(country):
    try:
        if country not in country_models:
            return jsonify({"error": f"No model found for {country}"}), 404

        # Get the ARIMA model for the specified country
        model = country_models[country]
       
        start_year = int(request.args.get('start_year', 2024))  
        end_year = int(request.args.get('end_year', 2050)) 
        years_to_predict = end_year - start_year + 1

        # Generate the forecast
        forecast = model.get_forecast(steps=years_to_predict)
        predicted_values = forecast.predicted_mean

        # Prepare the response data with corresponding years
        response = {
            "country": country,
            "predictions": [{"year": year, "emissions": float(predicted_values[i])} for i, year in enumerate(range(start_year, end_year + 1))]
        }

        return jsonify(response)
    except Exception as e:
        print(f"Error generating predictions: {e}")
        return jsonify({"error": "Error generating predictions"}), 500

# New Endpoint: Sentiment analysis for climate change news
@app.route('/api/news-sentiment', methods=['GET'])
def get_news_sentiment():
    try:
        # Example: Fetch recent climate-related news articles
        news_api_key = "97912b8befb343b7aada334fe9c46f71"  # Replace with your News API key
        news_response = requests.get(
            f'https://newsapi.org/v2/everything?q=climate+change&apiKey={news_api_key}'
        )
        articles = news_response.json().get('articles', [])

        # Initialize Google Cloud Natural Language API client
        client = language_v1.LanguageServiceClient()

        sentiment_data = []
        for article in articles[:10]:  # Limit to 10 articles for simplicity
            title = article.get('title', '')
            if not title:
                continue

            document = language_v1.Document(content=title, type_=language_v1.Document.Type.PLAIN_TEXT)

            # Sentiment analysis
            sentiment = client.analyze_sentiment(document=document).document_sentiment
            keywords = [
                entity.name
                for entity in client.analyze_entities(document=document).entities
            ]

            sentiment_data.append({
                'title': title,
                'sentiment': sentiment.score,
                'keywords': keywords,
            })

        return jsonify(sentiment_data)
    except Exception as e:
        print(f"Error fetching or processing sentiment data: {e}")
        return jsonify({"error": "Error fetching or processing sentiment data"}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)

from flask import Flask, jsonify, request
import joblib
import os
import numpy as np
from flask_cors import CORS


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


# route for predicting CO2 emissions for a specific country using ARIMA models
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


# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)

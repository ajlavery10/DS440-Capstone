import pandas as pd
import joblib
import os
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from pmdarima import auto_arima


# Load and prepare the dataset
data_path = os.path.join('..', 'public', 'data', 'co2_emissions_kt_by_country.csv')
data = pd.read_csv(data_path)
data = data[['country_name', 'year', 'value']]


# Dictionary to hold models for each country
country_models = {}


# Train a model for each country
for country in data['country_name'].unique():
    country_data = data[data['country_name'] == country]
    country_data = country_data.set_index('year').sort_index()  


    # Use emissions as the time series data
    y = country_data['value'].values


    # Use auto_arima to determine the best order for ARIMA
    try:
        arima_model = auto_arima(y, seasonal=False, trace=True, error_action='ignore', suppress_warnings=True)
        best_order = arima_model.order
        print(f"Optimal ARIMA order for {country}: {best_order}")


        # Train ARIMA model with the selected order
        model = ARIMA(y, order=best_order)
        model_fit = model.fit()
        print(f"ARIMA model for {country} trained successfully.")


    except Exception as e:
        print(f"ARIMA model failed for {country} with error: {e}. Trying Exponential Smoothing as fallback.")
       
        try:
            model = ExponentialSmoothing(y, trend="add", seasonal=None, damped_trend=True)
            model_fit = model.fit()
            print(f"Exponential Smoothing model for {country} trained successfully.")
        except Exception as es_error:
            print(f"Both ARIMA and Exponential Smoothing failed for {country} with error: {es_error}")
            continue  


    # Save the fitted model in the dictionary for later use
    country_models[country] = model_fit


# Save all trained models to a file
models_path = os.path.join(os.getcwd(), 'country_emissions_models.pkl')
joblib.dump(country_models, models_path)
print(f"Models saved to {models_path}")



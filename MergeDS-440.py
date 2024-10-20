import os
import subprocess
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Step 1: Set the path to your Downloads folder
downloads_path = os.path.expanduser('~/Downloads/')  # This works for both Mac and Linux

# Step 2: Download the datasets using Kaggle API
try:
    subprocess.run(['kaggle', 'datasets', 'download', '-d', 'patricklford/global-ev-sales-2010-2024'], check=True)
    subprocess.run(['kaggle', 'datasets', 'download', '-d', 'ulrikthygepedersen/co2-emissions-by-country'], check=True)
except subprocess.CalledProcessError as e:
    print(f"Error downloading datasets: {e}")
    exit()

# Unzip the downloaded datasets
os.system(f'unzip -o {downloads_path}global-ev-sales-2010-2024.zip -d {downloads_path}')
os.system(f'unzip -o {downloads_path}co2-emissions-by-country.zip -d {downloads_path}')

# Step 3: Load the datasets
try:
    ev_sales_data = pd.read_csv(os.path.join(downloads_path, 'IEA Global EV Data 2024.csv'))
    emissions_data = pd.read_csv(os.path.join(downloads_path, 'co2_emissions_kt_by_country.csv'))
except FileNotFoundError as e:
    print(f"Error: {e}")
    exit()

# Step 4: Filter for China in EV sales data
ev_sales_china = ev_sales_data[ev_sales_data['region'] == 'China']

# Step 5: Filter for China in emissions data
emissions_china = emissions_data[emissions_data['country_name'] == 'China']

# Step 6: Merge the datasets on a common key, e.g., Year (adjust if needed)
merged_data = pd.merge(emissions_china, ev_sales_china, on='year', how='inner')

# Step 7: Save the merged dataset
merged_data.to_csv(os.path.join(downloads_path, 'china_merged_data.csv'), index=False)

# Step 8: Perform EDA (Exploratory Data Analysis)
print(merged_data.head())

# Summary statistics
print("\nSummary Statistics:")
print(merged_data.describe())

# Check for missing values
print("\nMissing Values:")
print(merged_data.isnull().sum())

# Data types and memory usage
print("\nData Types:")
print(merged_data.info())

# Step 9: Correlation matrix (only numeric columns)
numeric_cols = merged_data.select_dtypes(include=['float64', 'int64'])  # Select only numeric columns
correlation_matrix = numeric_cols.corr()
print("\nCorrelation Matrix:")
print(correlation_matrix)

# Step 10: Plot the heatmap for the correlation matrix
plt.figure(figsize=(8, 6))
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm')
plt.title('Correlation Heatmap')
plt.show()

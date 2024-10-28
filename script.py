import pandas as pd
import os

# Define directory paths
input_dir = "Datasets/"   # Folder containing .xlsx files
output_dir = "CSV/" # Folder to save converted .csv files
os.makedirs(output_dir, exist_ok=True)  # Create output directory if it doesn't exist

# List of .xlsx file names
xlsx_files = ["China_CO2_Inventory_1997-2021_(Apparent_Emissions).xlsx", "County-level_CO2_Emissions_in_China_during_1997–2017.xlsx"]
csv_files = []

# Convert each .xlsx to .csv and store filenames
for file in xlsx_files:
    # Read the .xlsx file from datasets folder
    df = pd.read_excel(os.path.join(input_dir, file))
    
    # Create a .csv filename based on .xlsx filename and save to csv_files folder
    csv_file = os.path.join(output_dir, file.replace(".xlsx", ".csv"))
    csv_files.append(csv_file)
    
    # Save as .csv
    df.to_csv(csv_file, index=False)
    print(f"Converted {file} to {csv_file}")

# Generate HTML table code to display each dataset
html_content = ""
for csv_file in csv_files:
    # Read each CSV for display purposes
    df = pd.read_csv(csv_file)
    
    # Convert DataFrame to HTML table
    html_table = df.to_html(index=False)
    
    # Add to HTML content
    html_content += f"<h3>{os.path.basename(csv_file)}</h3>{html_table}<br><br>"

# Save the HTML content to a file in the root directory
with open("datasets.html", "w") as f:
    f.write(html_content)

print("HTML file generated as datasets.html. Upload it to GitHub Pages to display your datasets.")

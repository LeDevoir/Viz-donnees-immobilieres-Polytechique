import requests

# URLs to the CSV files
csv_urls = [
    'https://www.donneesquebec.ca/recherche/dataset/statistiques-du-registre-foncier-du-quebec-sur-le-marche-immobilier/resource/d1ce4f2f-f5bc-492e-81a5-2347ed9c8c1a/download/donn_hypoth_reqst.csv',
    'https://www.donneesquebec.ca/recherche/dataset/statistiques-du-registre-foncier-du-quebec-sur-le-marche-immobilier/resource/15747fac-ab86-4334-814e-1aa4633430ee/download/donn_prix_vente_reqst.csv',
    'https://www.donneesquebec.ca/recherche/dataset/statistiques-du-registre-foncier-du-quebec-sur-le-marche-immobilier/resource/739ac2bb-e549-4bcd-893d-768e37a03af6/download/donn_hypoth_reqst.csv',
    'https://www.donneesquebec.ca/recherche/dataset/statistiques-du-registre-foncier-du-quebec-sur-le-marche-immobilier/resource/84ed216a-3284-4d05-aa85-d2ef30dd5d0f/download/donn_diff_fin_reqst.csv'
]

# Specify the file paths where the CSVs will be saved
file_paths = [
    'sales/donn_prix_vente_reqst.csv',
    'transfers/donn_transf_prop_reqst.csv',
    'mortgages/donn_hypoth_reqst.csv',
    'difficulties/donn_diff_fin_reqst.csv'
]

# Function to download and save the CSV file
def download_and_save_csv(csv_url, file_path):
    # Send a HTTP request to the URL
    response = requests.get(csv_url)

    # Check if the request was successful
    if response.status_code == 200:
        # Save the content to a CSV file
        with open(file_path, 'wb') as file:
            file.write(response.content)
        print(f'Data has been saved to {file_path}')
    else:
        print(f'Failed to retrieve data from {csv_url}')

# Download and save each CSV file
for csv_url, file_path in zip(csv_urls, file_paths):
    download_and_save_csv(csv_url, file_path)

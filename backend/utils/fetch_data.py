import requests
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()
def fetch_stock_data(api_key, symbol="AAPL", interval="5min"):
    """
    Fetch intraday stock data from Alpha Vantage API
    Valid intervals: 1min, 5min, 15min, 30min, 60min
    """
    url = 'https://www.alphavantage.co/query'
    
    # Valid intraday intervals
    valid_intervals = ['1min', '5min', '15min', '30min', '60min']
    if interval not in valid_intervals:
        raise Exception(f"Invalid interval '{interval}'. Valid intervals: {valid_intervals}")
    
    params = {
        'function': 'TIME_SERIES_INTRADAY',
        'symbol': symbol,
        'interval': interval,
        'apikey': api_key,
        'outputsize': 'full',  # get more historical data
        'datatype': 'json'
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    # Better error handling
    if 'Error Message' in data:
        raise Exception(f"API Error: {data['Error Message']}")
    
    if 'Note' in data:
        raise Exception(f"API Rate Limit: {data['Note']}")
    
    time_series_key = f'Time Series ({interval})'
    if time_series_key not in data:
        raise Exception(f"Failed to fetch data. Available keys: {list(data.keys())}")
    
    return data[time_series_key]

def process_data(data):
    """Process the raw stock data into a clean DataFrame"""
    df = pd.DataFrame.from_dict(data, orient='index')
    df.columns = [col.split('. ')[1] for col in df.columns]  # Clean column names
    df.index = pd.to_datetime(df.index)
    df = df.sort_index()
    # Convert data to numeric
    df = df.apply(pd.to_numeric)
    return df
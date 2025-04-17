from flask import Flask, request, jsonify, render_template
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd
import numpy as np
from functools import wraps
import time

app = Flask(__name__)

# Cache configuration
CACHE_TIMEOUT = 3600  # 1 hour
data_cache = {}

def cache_response(timeout):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            cache_key = f"{request.path}?{request.query_string.decode()}"
            cached_data = data_cache.get(cache_key)
            
            if cached_data and (time.time() - cached_data['timestamp']) < timeout:
                return jsonify(cached_data['data'])
            
            result = f(*args, **kwargs)
            
            if isinstance(result, tuple) and len(result) == 2 and isinstance(result[0], dict):
                data_cache[cache_key] = {
                    'data': result[0],
                    'timestamp': time.time()
                }
                return jsonify(result[0]), result[1]
            elif isinstance(result, dict):
                data_cache[cache_key] = {
                    'data': result,
                    'timestamp': time.time()
                }
                return jsonify(result)
            
            return result
        return decorated_function
    return decorator

def calculate_indicators(data):
    # Simple Moving Average (SMA)
    data['SMA'] = data['Close'].rolling(window=5).mean()
    
    # Exponential Moving Average (EMA)
    data['EMA'] = data['Close'].ewm(span=5, adjust=False).mean()
    
    # Relative Strength Index (RSI)
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    data['RSI'] = 100 - (100 / (1 + rs))
    
    # Moving Average Convergence Divergence (MACD)
    ema12 = data['Close'].ewm(span=12, adjust=False).mean()
    ema26 = data['Close'].ewm(span=26, adjust=False).mean()
    data['MACD'] = ema12 - ema26
    data['Signal'] = data['MACD'].ewm(span=9, adjust=False).mean()
    data['Histogram'] = data['MACD'] - data['Signal']
    
    # Average True Range (ATR)
    high_low = data['High'] - data['Low']
    high_close = (data['High'] - data['Close'].shift()).abs()
    low_close = (data['Low'] - data['Close'].shift()).abs()
    true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    data['ATR'] = true_range.rolling(window=14).mean()
    
    # Bollinger Bands
    data['Upper Band'] = data['SMA'] + (data['ATR'] * 2)
    data['Lower Band'] = data['SMA'] - (data['ATR'] * 2)
    
    return data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stock_data', methods=['GET'])
@cache_response(CACHE_TIMEOUT)
def stock_data():
    try:
        stock = request.args.get('stock', '').upper()
        start = request.args.get('start')
        end = request.args.get('end')
        
        if not stock or not start or not end:
            return {"error": "Stock symbol, start date, and end date are required"}, 400
        
        try:
            start_date = datetime.strptime(start, "%Y-%m-%d")
            end_date = datetime.strptime(end, "%Y-%m-%d")
        except ValueError as ve:
            return {"error": f"Invalid date format: {str(ve)}"}, 400
        
        # Validate dates
        if start_date > datetime.now() or end_date > datetime.now():
            return {"error": "Date range cannot be in the future"}, 400
            
        if start_date > end_date:
            return {"error": "Start date cannot be after end date"}, 400
            
        # Limit date range to 5 years max for performance
        if (end_date - start_date) > timedelta(days=365*5):
            return {"error": "Date range cannot exceed 5 years"}, 400
        
        print(f"Fetching data for stock: {stock}, start: {start_date}, end: {end_date}")
        
        try:
            df = yf.download(stock, start=start_date, end=end_date + timedelta(days=1))
        except Exception as e:
            return {"error": f"Failed to fetch data from Yahoo Finance: {str(e)}"}, 500
        
        if df.empty:
            return {"error": f"No data found for {stock} between {start} and {end}"}, 404
        
        df = calculate_indicators(df)
        df.fillna(method='ffill', inplace=True)
        df = df.dropna(how="any")
        
        # Convert to lists with proper handling of numpy types
        def convert_to_list(series):
            return [float(x) if not np.isnan(x) else None for x in series.values]
        
        response_data = {
            "dates": df.index.strftime('%Y-%m-%d').tolist(),
            "open": convert_to_list(df['Open']),
            "high": convert_to_list(df['High']),
            "low": convert_to_list(df['Low']),
            "close": convert_to_list(df['Close']),
            "volumes": convert_to_list(df['Volume']),
            "SMA": convert_to_list(df['SMA']),
            "EMA": convert_to_list(df['EMA']),
            "RSI": convert_to_list(df['RSI']),
            "MACD": convert_to_list(df['MACD']),
            "Signal": convert_to_list(df['Signal']),
            "Histogram": convert_to_list(df['Histogram']),
            "ATR": convert_to_list(df['ATR']),
            "Upper Band": convert_to_list(df['Upper Band']),
            "Lower Band": convert_to_list(df['Lower Band']),
            "symbol": stock
        }
        
        return response_data
        
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return {"error": f"An unexpected error occurred: {str(e)}"}, 500

if __name__ == '__main__':
    app.run(debug=True)
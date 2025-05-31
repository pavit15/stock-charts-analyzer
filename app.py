from flask import Flask, render_template, jsonify, request
import yfinance as yf
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from functools import lru_cache
import statistics
import json
from typing import Dict, Tuple, List, Optional

app = Flask(__name__)

# Configuration
class Config:
    CACHE_TIMEOUT = 3600  # 1 hour cache
    VALID_TIMEFRAMES = ['1d', '1w', '1mo', '3mo', '6mo', '1y', '5y']
    VALID_INTERVALS = ['1d', '1wk', '1mo']
    MAX_DATA_POINTS = 1000

# Technical Indicators Calculator
class TechnicalIndicators:
    @staticmethod
    def calculate_rsi(prices: List[float], window: int = 14) -> float:
        deltas = np.diff(prices)
        seed = deltas[:window]
        up = seed[seed >= 0].sum()/window
        down = -seed[seed < 0].sum()/window
        rs = up/down
        return 100 - (100/(1+rs))

    @staticmethod
    def moving_average(prices: List[float], window: int) -> List[float]:
        return pd.Series(prices).rolling(window=window).mean().tolist()

    @staticmethod
    def bollinger_bands(prices: List[float], window: int = 20) -> Dict:
        ma = TechnicalIndicators.moving_average(prices, window)[-1]
        std = statistics.stdev(prices[-window:])
        return {
            'upper': ma + (std * 2),
            'middle': ma,
            'lower': ma - (std * 2)
        }

    @staticmethod
    def macd(prices: List[float]) -> Dict:
        exp12 = pd.Series(prices).ewm(span=12, adjust=False).mean()
        exp26 = pd.Series(prices).ewm(span=26, adjust=False).mean()
        macd_line = exp12 - exp26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        return {
            'macd': macd_line.tolist()[-1],
            'signal': signal_line.tolist()[-1],
            'histogram': (macd_line - signal_line).tolist()[-1]
        }

# Trend Analysis Engine
class TrendAnalyzer:
    @staticmethod
    def determine_trend(prices: List[float]) -> str:
        if len(prices) < 5:
            return "Insufficient data"
            
        short_term = TrendAnalyzer._get_trend_strength(prices, 5)
        medium_term = TrendAnalyzer._get_trend_strength(prices, 20)
        long_term = TrendAnalyzer._get_trend_strength(prices, 50)
        
        if short_term > 0.7 and medium_term > 0.5 and long_term > 0.3:
            return "Strong Uptrend"
        elif short_term > 0.5 and medium_term > 0.3:
            return "Uptrend"
        elif short_term < -0.7 and medium_term < -0.5 and long_term < -0.3:
            return "Strong Downtrend"
        elif short_term < -0.5 and medium_term < -0.3:
            return "Downtrend"
        else:
            return "Sideways/Consolidation"

    @staticmethod
    def _get_trend_strength(prices: List[float], window: int) -> float:
        if len(prices) < window:
            return 0
            
        x = np.arange(window)
        y = np.array(prices[-window:])
        slope = np.polyfit(x, y, 1)[0]
        return slope / (y.mean() or 1)  # Normalized slope

# Data Processing Utilities
class DataProcessor:
    @staticmethod
    def normalize_data(dates: List[str], prices: List[float]) -> Tuple[List[str], List[float]]:
        """Reduce data points to manageable size for frontend"""
        if len(prices) <= Config.MAX_DATA_POINTS:
            return dates, prices
            
        step = len(prices) // Config.MAX_DATA_POINTS
        return dates[::step], prices[::step]

    @staticmethod
    def validate_symbol(symbol: str) -> bool:
        """Basic validation for stock symbols"""
        return bool(symbol) and len(symbol) <= 5 and symbol.isalpha()

# Cached Data Fetcher
class DataFetcher:
    @staticmethod
    @lru_cache(maxsize=128)
    def fetch_yfinance_data(symbol: str, start: str, end: str, interval: str) -> pd.DataFrame:
        """LRU cached data fetcher"""
        stock = yf.Ticker(symbol)
        return stock.history(start=start, end=end, interval=interval)

# API Endpoints
@app.route('/api/stock/<symbol>/<timeframe>')
def get_stock_data(symbol: str, timeframe: str) -> jsonify:
    try:
        if not DataProcessor.validate_symbol(symbol):
            return jsonify({'error': 'Invalid stock symbol'}), 400
            
        if timeframe not in Config.VALID_TIMEFRAMES:
            return jsonify({'error': 'Invalid timeframe'}), 400

        end_date = datetime.now()
        start_date = DataFetcher.calculate_start_date(end_date, timeframe)
        interval = DataFetcher.determine_interval(timeframe)

        hist = DataFetcher.fetch_yfinance_data(
            symbol, 
            start_date.strftime('%Y-%m-%d'), 
            end_date.strftime('%Y-%m-%d'), 
            interval
        )

        if hist.empty:
            return jsonify({'error': 'No data available'}), 404

        dates = [date.strftime('%Y-%m-%d') for date in hist.index]
        prices = hist['Close'].fillna(method='ffill').tolist()
        
        dates, prices = DataProcessor.normalize_data(dates, prices)
        
        return jsonify({
            'symbol': symbol.upper(),
            'timeframe': timeframe,
            'dates': dates,
            'prices': prices
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_stock() -> jsonify:
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').upper()
        timeframe = data.get('timeframe', '1mo')

        if not DataProcessor.validate_symbol(symbol):
            return jsonify({'error': 'Invalid stock symbol'}), 400

        # Get stock data
        stock_response = get_stock_data(symbol, timeframe)
        if stock_response.status_code != 200:
            return stock_response

        stock_data = json.loads(stock_response.get_data(as_text=True))
        prices = stock_data['prices']
        
        if len(prices) < 5:
            return jsonify({'error': 'Insufficient data points for analysis'}), 400

        # Calculate all technical indicators
        indicators = {
            'trend': TrendAnalyzer.determine_trend(prices),
            'rsi': TechnicalIndicators.calculate_rsi(prices),
            'moving_averages': {
                '5_day': TechnicalIndicators.moving_average(prices, 5)[-1],
                '20_day': TechnicalIndicators.moving_average(prices, 20)[-1],
                '50_day': TechnicalIndicators.moving_average(prices, 50)[-1]
            },
            'bollinger_bands': TechnicalIndicators.bollinger_bands(prices),
            'macd': TechnicalIndicators.macd(prices),
            'volatility': statistics.stdev(prices[-20:]) / (statistics.mean(prices[-20:]) or 1),
            'performance': {
                '1d': DataFetcher.calculate_performance(prices, 1) if len(prices) > 1 else 0,
                '1w': DataFetcher.calculate_performance(prices, 5) if len(prices) > 5 else 0,
                '1mo': DataFetcher.calculate_performance(prices, 20) if len(prices) > 20 else 0
            }
        }

        return jsonify({
            'symbol': symbol,
            'timeframe': timeframe,
            'analysis': indicators,
            'last_updated': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Helper methods for DataFetcher
def calculate_start_date(end_date: datetime, timeframe: str) -> datetime:
    timeframes = {
        '1d': timedelta(days=1),
        '1w': timedelta(weeks=1),
        '1mo': timedelta(days=30),
        '3mo': timedelta(days=90),
        '6mo': timedelta(days=180),
        '1y': timedelta(days=365),
        '5y': timedelta(days=5*365)
    }
    return end_date - timeframes.get(timeframe, timedelta(days=30))

def determine_interval(timeframe: str) -> str:
    intervals = {
        '1d': '1d',
        '1w': '1d',
        '1mo': '1d',
        '3mo': '1d',
        '6mo': '1wk',
        '1y': '1wk',
        '5y': '1mo'
    }
    return intervals.get(timeframe, '1d')

def calculate_performance(prices: List[float], days: int) -> float:
    if len(prices) <= days:
        return 0
    return ((prices[-1] - prices[-days]) / prices[-days]) * 100

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)

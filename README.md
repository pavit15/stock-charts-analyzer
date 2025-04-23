# Stock Data Charts for Analysis

An interactive stock market data visualization tool that helps analyze various stock data indicators with advanced charting features. This project allows users to view multiple financial indicators such as SMA, EMA, RSI, MACD, and others, over customizable date ranges for different stock symbols.

## Project Features

- **Stock Data Visualization**: Interactive charts displaying stock prices, trading volumes, and various indicators.
- **Technical Indicators**: Includes indicators like Simple Moving Average (SMA), Exponential Moving Average (EMA), Relative Strength Index (RSI), Moving Average Convergence Divergence (MACD), and Bollinger Bands.
- **Custom Date Range**: Select any start and end date for stock data analysis.
- **Dark Mode**: Toggle dark mode for better user experience.
- **Comparison**: Add stocks for side-by-side comparison on the same chart.

### Dark Mode Interface
<img src="https://raw.githubusercontent.com/pavit15/chartsanalyzer/main/images/darkmode.jpg" width="600"/>

### Light Mode Interface
<img src="https://raw.githubusercontent.com/pavit15/chartsanalyzer/main/images/lightmode.jpg" width="600"/>

### Chart with Indicators
<img src="https://raw.githubusercontent.com/pavit15/chartsanalyzer/main/images/plots.jpg" width="600"/>

## Tech Stack

- **Frontend**:
  - **HTML**, **CSS**, **JavaScript** for the user interface and interactions.
  - **Chart.js** for making interactive stock charts.
  - **Plotly.js** for advanced charting and data visualization.
  - **Chart.js Plugin Zoom** for zoomable charts.
  - **chartjs-adapter-date-fns** for date-based charting.
  
- **Backend** 
  - **Python** for data processing and analysis.
  - **Pandas** for data manipulation and handling stock data.
  - **NumPy** for numerical computations and analysis.
  
- **Additional Libraries**:
  - **yfinance** for fetching stock data from Yahoo Finance.
  - **Plotly** for creating interactive visualizations.

## How to use 

To run this project locally, follow these steps:

### 1. Clone the repository
First, clone the repository to your local machine:

```bash
git clone https://github.com/pavit15/chartsanalyzer.git
```

### 2. Navigate to the project folder
Move into the project directory:
```bash
cd chartsanalyzer
```

### 3. Set up a virtual environment (Optional but recommended)
It’s recommended to create a virtual environment for managing dependencies:

- On **Windows**:
    ```bash
    python -m venv venv
    venv\Scripts\activate
    ```
- On **Mac/Linux**:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

### 4. Install required dependencies
Install the necessary dependencies listed in the `requirements.txt` file:

```bash
pip install -r requirements.txt
```

### 5. Run the application
After installing the dependencies, you can run the application using the following command:

```bash
python app.py
```

### 6. Access the application
Once the application is running, open your browser and visit:
```bash
http://localhost:5000
```


## Future Scope
The following features are planned for future updates to enhance the project’s functionality:

- **Predictive Modeling**: Implement machine learning models to predict stock price movements based on historical data, using algorithms like Random Forests, SVM, and LSTM networks.
- **Sentiment Analysis**: Integrate sentiment analysis of news articles and social media to predict stock price trends based on public sentiment.
- **Anomaly Detection**: Use unsupervised learning techniques like Isolation Forest or DBSCAN to detect anomalies in stock data and highlight potential investment opportunities or risks.
- **Portfolio Optimization**: Implement an ML-based portfolio optimization tool using techniques like Markowitz Efficient Frontier and Monte Carlo simulations.
- **Backtesting Framework**: Develop a backtesting feature to evaluate the effectiveness of trading strategies using historical stock data.
- **Advanced Technical Indicators**: Add more advanced technical indicators such as Fibonacci Retracements, Parabolic SAR, and Ichimoku Cloud for deeper analysis.
- **Real-time Data Integration**: Integrate real-time stock market data feeds to perform real-time analysis and trigger alerts for price movements or indicator thresholds.
- **Personalized Stock Recommendations**: Use collaborative filtering or content-based recommendation systems to provide personalized stock recommendations for users based on their preferences and historical behavior.

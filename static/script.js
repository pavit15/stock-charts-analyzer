// Configuration
const config = {
    apiBase: '/api',
    chartElement: '#stockChart',
    maxDataPoints: 500
};

// DOM Elements
const elements = {
    form: '#stockForm',
    symbol: '#stockSymbol',
    timeframe: '#timeframe',
    trend: '#trendIndicator',
    rsi: '#rsiIndicator',
    loading: '#loadingIndicator'
};

// Main Controller
class StockAnalyzer {
    static async analyze() {
        try {
            const symbol = document.querySelector(elements.symbol).value;
            const timeframe = document.querySelector(elements.timeframe).value;
            
            if (!symbol) {
                alert('Please enter a valid stock symbol');
                return;
            }

            StockAnalyzer.showLoading(true);
            
            // Fetch analysis
            const analysis = await StockAnalyzer.fetchAnalysis(symbol, timeframe);
            
            // Update UI
            StockAnalyzer.updateIndicators(analysis);
            StockAnalyzer.renderChart(analysis.chartData);
            
        } catch (error) {
            console.error('Analysis error:', error);
            alert('Failed to analyze stock');
        } finally {
            StockAnalyzer.showLoading(false);
        }
    }

    static async fetchAnalysis(symbol, timeframe) {
        const response = await fetch(`${config.apiBase}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol, timeframe })
        });
        return await response.json();
    }

    static updateIndicators(data) {
        document.querySelector(elements.trend).textContent = `Trend: ${data.analysis.trend}`;
        document.querySelector(elements.rsi).textContent = `RSI: ${data.analysis.rsi.toFixed(2)}`;
        // Add more indicator updates as needed
    }

    static renderChart(data) {
        // Existing chart rendering logic
    }

    static showLoading(show) {
        document.querySelector(elements.loading).style.display = show ? 'block' : 'none';
    }
}

// Event Listeners
document.querySelector(elements.form).addEventListener('submit', (e) => {
    e.preventDefault();
    StockAnalyzer.analyze();
});

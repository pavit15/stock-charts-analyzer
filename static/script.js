// static/js/script.js

async function fetchAndDisplayData() {
    const symbol = document.getElementById('stockSymbol').value;
    const timeframe = document.getElementById('timeframe').value;
    
    if (!symbol) {
        alert('Please enter a stock symbol');
        return;
    }

    try {
        // Fetch stock data
        const stockResponse = await fetch(`/api/stock/${symbol}/${timeframe}`);
        const stockData = await stockResponse.json();
        
        if (stockData.error) {
            throw new Error(stockData.error);
        }
        
        // Fetch analysis
        const analysisResponse = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol, timeframe })
        });
        const analysis = await analysisResponse.json();
        
        // Update UI
        updateChart(stockData);
        updateAnalysis(analysis);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to fetch stock data');
    }
}

function updateChart(data) {
    // Chart rendering logic using existing library
    // ... (keep existing chart code)
}

function updateAnalysis(analysis) {
    document.getElementById('trendIndicator').textContent = 
        `Trend: ${analysis.trend}`;
    document.getElementById('priceIndicator').textContent = 
        `Current Price: $${analysis.last_price.toFixed(2)}`;
    document.getElementById('rsiIndicator').textContent = 
        `RSI: ${analysis.indicators.rsi.toFixed(2)}`;
}

// Initialize
document.getElementById('stockForm').addEventListener('submit', (e) => {
    e.preventDefault();
    fetchAndDisplayData();
});

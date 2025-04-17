let charts = {};
let activeIndicators = {
    volume: true,
    sma: true,
    ema: true,
    rsi: true,
    macd: true,
    signal: true,
    histogram: true,
    atr: true,
    upperBand: true,
    lowerBand: true
};
let comparedStocks = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeDarkMode();
    populateStockList();
    initializeUI();
    loadDefaultData();
});

function populateStockList() {
    const stockList = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'ADBE', 'INTC', 'CSCO',
        'ORCL', 'IBM', 'QCOM', 'AMD', 'TXN', 'AVGO', 'CRM', 'NOW', 'SHOP', 'SNOW',
        'NET', 'DDOG', 'ZS', 'CRWD', 'PANW', 'TEAM', 'OKTA', 'MDB', 'SPLK', 'FSLY',
        'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'BLK', 'AXP', 'V', 'MA',
        'PYPL', 'SQ', 'COIN', 'SCHW', 'ICE', 'MCO', 'FIS', 'FISV', 'GPN', 'DFS',
        'JNJ', 'PFE', 'MRK', 'ABT', 'GILD', 'AMGN', 'BMY', 'LLY', 'VRTX', 'REGN',
        'MRNA', 'BNTX', 'CVS', 'UNH', 'HUM', 'ANTM', 'DHR', 'ISRG', 'IDXX', 'TMO',
        'PG', 'KO', 'PEP', 'NKE', 'SBUX', 'MCD', 'WMT', 'TGT', 'COST', 'HD',
        'LOW', 'NFLX', 'DIS', 'CMCSA', 'T', 'CHTR', 'TMUS', 'VZ', 'DISH', 'ROKU',
        'BA', 'CAT', 'GE', 'HON', 'MMM', 'UNP', 'UPS', 'FDX', 'LMT', 'RTX',
        'XOM', 'CVX', 'COP', 'BP', 'OXY', 'SLB', 'HAL', 'PSX', 'MPC', 'VLO',
        'WMT', 'TGT', 'COST', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD', 'DIS', 'CMCSA',
        'T', 'CHTR', 'TMUS', 'VZ', 'DISH', 'ROKU', 'DAL', 'AAL', 'UAL', 'LUV'
    ];
    const symbolDropdown = document.getElementById('symbol');
    stockList.forEach(stock => {
        const option = document.createElement('option');
        option.value = stock;
        option.textContent = stock;
        symbolDropdown.appendChild(option);
    });
}

function getComparisonColors(index) {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#8A2BE2', '#7CFC00', '#FF4500', '#00CED1', '#FFD700', '#BA55D3',
        '#00FA9A', '#1E90FF', '#FF6347', '#7B68EE', '#20B2AA', '#FF69B4',
        '#9370DB', '#3CB371', '#FF8C00', '#6A5ACD', '#48D1CC', '#C71585'
    ];
    return colors[index % colors.length];
}

function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', isDarkMode);
    darkModeToggle.textContent = isDarkMode ? '🌞' : '🌙';
    darkModeToggle.addEventListener('click', function() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDark);
        this.textContent = isDark ? '🌞' : '🌙';
        updateChartStyles(isDark);
    });
}

function updateChartStyles(isDarkMode) {
    const chartBackgroundColor = isDarkMode ? '#1a1a1a' : '#fff';
    const chartTextColor = isDarkMode ? '#e6e6e6' : '#666';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    Object.values(charts).forEach(chartArray => {
        chartArray.forEach(chart => {
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.y.grid.color = gridColor;
            chart.options.scales.x.ticks.color = chartTextColor;
            chart.options.scales.y.ticks.color = chartTextColor;
            chart.options.plugins.title.color = chartTextColor;
            chart.options.plugins.legend.labels.color = chartTextColor;
            chart.update();
        });
    });
}

function createIndicatorExplanation(indicator) {
    const explanations = {
        volume: "Measures trading activity - high volume confirms price trends",
        sma: "Simple Moving Average - smooths price data to identify trends",
        ema: "Exponential Moving Average - weights recent prices more heavily",
        rsi: "Relative Strength Index (14-day) - identifies overbought (>70) or oversold (<30) conditions",
        macd: "Moving Average Convergence Divergence - shows relationship between two EMAs",
        signal: "Signal Line (9-day EMA of MACD) - generates trade signals when crossed",
        histogram: "MACD Histogram - visualizes difference between MACD and Signal line",
        atr: "Average True Range (14-day) - measures market volatility",
        upperBand: "Bollinger Upper Band - price is relatively high when touching this band",
        lowerBand: "Bollinger Lower Band - price is relatively low when touching this band"
    };
    const chartContainer = document.querySelector(`#${indicator}Chart`).parentElement;
    if (chartContainer && !chartContainer.querySelector('.indicator-explanation')) {
        const explanationElement = document.createElement('p');
        explanationElement.className = 'indicator-explanation';
        explanationElement.textContent = explanations[indicator] || "Technical indicator";
        chartContainer.appendChild(explanationElement);
    }
}

function initializeUI() {
    document.getElementById('loadDataBtn').addEventListener('click', loadData);
    document.getElementById('addStockBtn').addEventListener('click', addStockToComparison);
    Object.keys(activeIndicators).forEach(indicator => {
        const checkbox = document.getElementById(`toggle-${indicator}`);
        if (checkbox) {
            checkbox.checked = activeIndicators[indicator];
            checkbox.addEventListener('change', function() {
                activeIndicators[indicator] = this.checked;
                updateCharts();
            });
        }
    });
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    document.getElementById('end').valueAsDate = endDate;
    document.getElementById('start').valueAsDate = startDate;
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

function loadDefaultData() {
    document.getElementById('loadDataBtn').click();
}

function addStockToComparison() {
    const symbol = document.getElementById('symbol').value;
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;
    if (!symbol || !start || !end) {
        showAlert("Please select a stock and date range first", "error");
        return;
    }
    if (comparedStocks.includes(symbol)) {
        showAlert(`${symbol} is already in comparison`, "warning");
        return;
    }
    if (comparedStocks.length >= 3) {
        showAlert("Maximum of 3 stocks can be compared at once", "error");
        return;
    }
    comparedStocks.push(symbol);
    updateComparisonList();
    loadData();
}

function removeComparedStock(symbol) {
    comparedStocks = comparedStocks.filter(s => s !== symbol);
    updateComparisonList();
    loadData();
}

function updateComparisonList() {
    const container = document.getElementById('comparedStocksContainer');
    container.innerHTML = '';
    if (comparedStocks.length === 0) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';
    comparedStocks.forEach((symbol, index) => {
        const badge = document.createElement('div');
        badge.className = 'stock-badge';
        badge.style.backgroundColor = getComparisonColors(index);
        badge.innerHTML = `
            ${symbol}
            <button onclick="removeComparedStock('${symbol}')" class="remove-stock-btn">
                &times;
            </button>
        `;
        container.appendChild(badge);
    });
}

async function loadData() {
    const symbol = document.getElementById('symbol').value;
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;
    const btn = document.getElementById('loadDataBtn');
    if (!symbol || !start || !end) {
        showAlert("Please enter all the required fields.", "error");
        return;
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    if (startDate > today || endDate > today) {
        showAlert("Date range cannot be in the future", "error");
        return;
    }
    if (startDate > endDate) {
        showAlert("Start date cannot be after end date", "error");
        return;
    }
    btn.disabled = true;
    btn.textContent = "Loading...";
    showAlert(`Fetching data for ${symbol}...`, "info");
    try {
        const mainStockData = await fetchStockData(symbol, start, end);
        const comparisonData = await Promise.all(
            comparedStocks.map(stock => fetchStockData(stock, start, end))
        );
        const processedMainData = processStockData(mainStockData, symbol);
        const processedComparisonData = comparisonData.map((data, i) =>
            processStockData(data, comparedStocks[i])
        );
        createAllCharts(processedMainData, processedComparisonData);
        showAlert(`Data loaded successfully for ${symbol}${comparedStocks.length > 0 ? ` and ${comparedStocks.join(', ')}` : ''}`, "success");
    } catch (error) {
        console.error("Error:", error);
        showAlert(`Error: ${error.message}`, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Load Data";
    }
}

async function fetchStockData(symbol, start, end) {
    const response = await fetch(`/api/stock_data?stock=${symbol}&start=${start}&end=${end}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
    }
    const data = await response.json();
    if (data.error) {
        throw new Error(data.error);
    }
    return data;
}

function processStockData(data, symbol) {
    const roundData = (arr) => arr.map(value => {
        if (typeof value === 'number') {
            return parseFloat(value.toFixed(2));
        }
        return value;
    });
    return {
        symbol: symbol,
        ATR: roundData(data.ATR),
        EMA: roundData(data.EMA),
        Histogram: roundData(data.Histogram),
        LowerBand: roundData(data['Lower Band']),
        MACD: roundData(data.MACD),
        RSI: roundData(data.RSI),
        SMA: roundData(data.SMA),
        Signal: roundData(data.Signal),
        UpperBand: roundData(data['Upper Band']),
        volumes: roundData(data.volumes),
        dates: data.dates,
        high: roundData(data.high),
        low: roundData(data.low),
        open: roundData(data.open),
        close: roundData(data.close)
    };
}

function createAllCharts(mainData, comparisonData) {
    Object.values(charts).forEach(chartArray => {
        chartArray.forEach(chart => chart.destroy());
    });
    charts = {};
    createCandlestickChart(mainData, comparisonData);
    if (activeIndicators.volume) createVolumeChart(mainData, comparisonData);
    if (activeIndicators.sma) createSMAChart(mainData, comparisonData);
    if (activeIndicators.ema) createEMAChart(mainData, comparisonData);
    if (activeIndicators.rsi) createRSIChart(mainData, comparisonData);
    if (activeIndicators.macd) createMACDChart(mainData, comparisonData);
    if (activeIndicators.signal) createSignalChart(mainData, comparisonData);
    if (activeIndicators.histogram) createHistogramChart(mainData, comparisonData);
    if (activeIndicators.atr) createATRChart(mainData, comparisonData);
    if (activeIndicators.upperBand) createUpperBandChart(mainData, comparisonData);
    if (activeIndicators.lowerBand) createLowerBandChart(mainData, comparisonData);
}

function createCandlestickChart(mainData, comparisonData) {
    const mainTrace = {
        x: mainData.dates.map(date => new Date(date)),
        close: mainData.close,
        high: mainData.high,
        low: mainData.low,
        open: mainData.open,
        type: 'candlestick',
        name: mainData.symbol,
        increasing: { line: { color: '#2ECC71' } },
        decreasing: { line: { color: '#E74C3C' } }
    };
    const comparisonTraces = comparisonData.map((data, i) => ({
        x: data.dates.map(date => new Date(date)),
        close: data.close,
        high: data.high,
        low: data.low,
        open: data.open,
        type: 'candlestick',
        name: data.symbol,
        increasing: { line: { color: getComparisonColors(i) } },
        decreasing: { line: { color: getComparisonColors(i + 1) } }
    }));
    const allTraces = [mainTrace, ...comparisonTraces];
    const layout = {
        title: 'Price Comparison',
        xaxis: {
            type: 'date',
            rangeslider: { visible: true }
        },
        yaxis: { title: 'Price' },
        margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.2,
            x: 0.5,
            xanchor: 'center'
        }
    };
    const config = { responsive: true };
    const container = document.getElementById('candlestickChartContainer') || createChartContainer('candlestickChartContainer');
    Plotly.newPlot(container, allTraces, layout, config);
}

function createVolumeChart(mainData, comparisonData) {
    const datasets = [{
        label: `${mainData.symbol} Volume`,
        data: mainData.volumes,
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
    }];
    comparisonData.forEach((data, i) => {
        datasets.push({
            label: `${data.symbol} Volume`,
            data: data.volumes,
            backgroundColor: `${getComparisonColors(i)}80`,
            borderColor: getComparisonColors(i),
            borderWidth: 1
        });
    });
    createChartWithOptions({
        id: 'volumeChart',
        type: 'bar',
        data: {
            labels: mainData.dates,
            datasets: datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Volume Comparison'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Volume' }
                }
            }
        }
    });
}

function createSMAChart(mainData, comparisonData) {
    const datasets = [{
        label: `${mainData.symbol} SMA (5)`,
        data: mainData.SMA,
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderWidth: 2,
        tension: 0.1
    }];
    comparisonData.forEach((data, i) => {
        datasets.push({
            label: `${data.symbol} SMA (5)`,
            data: data.SMA,
            borderColor: getComparisonColors(i),
            backgroundColor: `${getComparisonColors(i)}20`,
            borderWidth: 1,
            tension: 0.1
        });
    });
    createChartWithOptions({
        id: 'smaChart',
        type: 'line',
        data: {
            labels: mainData.dates,
            datasets: datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Simple Moving Average (5-day)'
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Price' }
                }
            }
        }
    });
}

function createEMAChart(mainData, comparisonData) {
    const datasets = [{
        label: `${mainData.symbol} EMA (5)`,
        data: mainData.EMA,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderWidth: 2,
        tension: 0.1
    }];
    comparisonData.forEach((data, i) => {
        datasets.push({
            label: `${data.symbol} EMA (5)`,
            data: data.EMA,
            borderColor: getComparisonColors(i),
            backgroundColor: `${getComparisonColors(i)}20`,
            borderWidth: 1,
            tension: 0.1
        });
    });
    createChartWithOptions({
        id: 'emaChart',
        type: 'line',
        data: {
            labels: mainData.dates,
            datasets: datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Exponential Moving Average (5-day)'
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Price' }
                }
            }
        }
    });
}

function createRSIChart(mainData, comparisonData) {
    const datasets = [{
        label: `${mainData.symbol} RSI (14)`,
        data: mainData.RSI,
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        borderWidth: 2,
        tension: 0.1
    }];
    comparisonData.forEach((data, i) => {
        datasets.push({
            label: `${data.symbol} RSI (14)`,
            data: data.RSI,
            borderColor: getComparisonColors(i),
            backgroundColor: `${getComparisonColors(i)}20`,
            borderWidth: 1,
            tension: 0.1
        });
    });
    createChartWithOptions({
        id: 'rsiChart',
        type: 'line',
        data: {
            labels: mainData.dates,
            datasets: datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Relative Strength Index (14-day)'
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'RSI Value' },
                    ticks: {
                        callback: function(value) {
                            if (value === 30) return 'Oversold';
                            if (value === 70) return 'Overbought';
                            return value;
                        }
                    }
                }
            }
        }
    });
}

function createMACDChart(mainData, comparisonData) {
    const datasets = [{
        label: `${mainData.symbol} MACD`,
        data: mainData.MACD,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        tension: 0.1
    }];
    comparisonData.forEach((data, i) => {
        datasets.push({
            label: `${data.symbol} MACD`,
            data: data.MACD,
            borderColor: getComparisonColors(i),
            backgroundColor: `${getComparisonColors(i)}20`,
            borderWidth: 1,
            tension: 0.1
        });
    });
    createChartWithOptions({
        id: 'macdChart',
        type: 'line',
        data: {
            labels: mainData.dates,
            datasets: datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Moving Average Convergence Divergence'
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'MACD Value' }
                }
            }
        }
    });
}

function createSignalChart(mainData, comparisonData) {
    const datasets = [{
        label: `${mainData.symbol} Signal (9)`,
        data: mainData.Signal,
        borderColor: 'rgba(192, 75, 75, 1)',
        backgroundColor: 'rgba(192, 75, 75, 0.2)',
        borderWidth: 2,
        tension: 0.1
    }];
    comparisonData.forEach((data, i) => {
        datasets.push({
            label: `${data.symbol} Signal (9)`,
            data: data.Signal,
            borderColor: getComparisonColors(i),
            backgroundColor: `${getComparisonColors(i)}20`,
            borderWidth: 1,
            tension: 0.1
        });
    });
    createChartWithOptions({
        id: 'signalChart',
        type: 'line',
        data: {
            labels: mainData.dates,
            datasets: datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'MACD Signal Line (9-day)'
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Signal Value' }
                }
            }
        }
    });
}

function createHistogramChart(mainData, comparisonData) {
    const datasets = [{
        label: `${mainData.symbol} Histogram`,
        data: mainData.Histogram,
        backgroundColor: (context) => {
            const value = context.raw;
            return value >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)';
        },
        borderColor: (context) => {
            const value = context.raw;
            return value >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)';
        },
        borderWidth: 1
    }];
    comparisonData.forEach((data, i) => {
        datasets.push({
            label: `${data.symbol} Histogram`,
            data: data.Histogram,
            backgroundColor: (context) => {
                const value = context.raw;
                return value >= 0 ? `${getComparisonColors(i)}60` : `${getComparisonColors(i + 3)}60`;
            },
            borderColor: (context) => {
                const value = context.raw;
                return value >= 0 ? getComparisonColors(i) : getComparisonColors(i + 3);
            },
            borderWidth: 1
        });
    });
    createChartWithOptions({
        id: 'histogramChart',
        type: 'bar',
        data: {
            labels: mainData.dates,
            datasets: datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'MACD Histogram'
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Histogram Value' }
                }
            }
        }
    });
}

function createATRChart(mainData, comparisonData) {
    const datasets = [{
        label: `${mainData.symbol} ATR (14)`,
        data: mainData.ATR,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 2,
        tension: 0.1
    }];
    comparisonData.forEach((data, i) => {
        datasets.push({
            label: `${data.symbol} ATR (14)`,
            data: data.ATR,
            borderColor: getComparisonColors(i),
            backgroundColor: `${getComparisonColors(i)}20`,
            borderWidth: 1,
            tension: 0.1
        });
    });
    createChartWithOptions({
        id: 'atrChart',
        type: 'line',
        data: {
            labels: mainData.dates,
            datasets: datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Average True Range (14-day)'
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'ATR Value' }
                }
            }
        }
    });
}

function createUpperBandChart(mainData, comparisonData) {
    const datasets = [{
        label: `${mainData.symbol} Upper Band`,
        data: mainData.UpperBand,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        tension: 0.1
    }];
    comparisonData.forEach((data, i) => {
        datasets.push({
            label: `${data.symbol} Upper Band`,
            data: data.UpperBand,
            borderColor: getComparisonColors(i),
            backgroundColor: `${getComparisonColors(i)}20`,
            borderWidth: 1,
            tension: 0.1
        });
    });
    createChartWithOptions({
        id: 'upperBandChart',
        type: 'line',
        data: {
            labels: mainData.dates,
            datasets: datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Bollinger Upper Band'
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Price' }
                }
            }
        }
    });
}

function createLowerBandChart(mainData, comparisonData) {
    const datasets = [{
        label: `${mainData.symbol} Lower Band`,
        data: mainData.LowerBand,
        borderColor: 'rgba(192, 75, 75, 1)',
        backgroundColor: 'rgba(192, 75, 75, 0.2)',
        borderWidth: 2,
        tension: 0.1
    }];
    comparisonData.forEach((data, i) => {
        datasets.push({
            label: `${data.symbol} Lower Band`,
            data: data.LowerBand,
            borderColor: getComparisonColors(i),
            backgroundColor: `${getComparisonColors(i)}20`,
            borderWidth: 1,
            tension: 0.1
        });
    });
    createChartWithOptions({
        id: 'lowerBandChart',
        type: 'line',
        data: {
            labels: mainData.dates,
            datasets: datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Bollinger Lower Band'
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Price' }
                }
            }
        }
    });
}

function createChartWithOptions(config) {
    const ctx = document.getElementById(config.id);
    if (!ctx) return;
    
    destroyChart(config.id);
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e6e6e6' : '#666';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    const chartInstance = new Chart(ctx, {
        type: config.type,
        data: config.data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: config.options.plugins?.title?.text || '',
                    color: textColor,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                ...(config.options.plugins || {})
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                },
                y: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                }
            },
            ...config.options
        }
    });
    
    if (!charts[config.id]) charts[config.id] = [];
    charts[config.id].push(chartInstance);
    
    createIndicatorExplanation(config.id.replace('Chart', ''));
    
    return chartInstance;
}

function destroyChart(chartId) {
    const chartElement = document.getElementById(chartId);
    if (chartElement) {
        const chartInstance = Chart.getChart(chartElement);
        if (chartInstance) {
            chartInstance.destroy();
        }
    }
}

function createChartContainer(id) {
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.id = id;
    document.querySelector('.charts').appendChild(container);
    return container;
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container') || createAlertContainer();
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 500);
    }, 3000);
}

function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alert-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '1000';
    document.body.appendChild(container);
    return container;
}

function updateCharts() {
    const symbol = document.getElementById('symbol').value;
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;
    
    if (symbol && start && end) {
        loadData();
    }
}
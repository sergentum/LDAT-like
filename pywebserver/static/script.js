const portList = document.getElementById('portList');
const startReadingBtn = document.getElementById('startReading');

function calculateStandardDeviation(arr) {
    const n = arr.length;
    const mean = arr.reduce((acc, val) => acc + val, 0) / n;
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    return stdDev;
}

function updateChart(newData) {
    const chartSize = parseInt(document.getElementById('chartSize').value, 10);
    const slicedData = newData.slice(-chartSize);

    chart.data.datasets[0].data = slicedData;
    chart.data.labels = Array.from(Array(slicedData.length).keys());
    chart.update();

    document.getElementById('pointsCount').innerText = `points: ${slicedData.length}`;
    document.getElementById('minValue').innerText = `min: ${Math.min(...slicedData)}`;
    document.getElementById('maxValue').innerText = `max: ${Math.max(...slicedData)}`;
    const average = slicedData.reduce((acc, val) => acc + val, 0) / slicedData.length;
    document.getElementById('averageValue').innerText = `avg: ${average.toFixed(2)}`;
    const standardDeviation = calculateStandardDeviation(slicedData);
    document.getElementById('standardDeviationValue').innerText = `Std dev: ${standardDeviation.toFixed(2)}`;
    const coefficientOfVariation = (standardDeviation / average) * 100;
    document.getElementById('coefficientOfVariation').innerText = `CV: ${coefficientOfVariation.toFixed(2)} %`;
}

function showMessage(message, messageType = 'info') {
    const errorContainer = document.querySelector('.error-container');
    errorContainer.textContent = message;

    if (messageType === 'error') {
        errorContainer.style.backgroundColor = 'red';
        errorContainer.style.color = 'white';
    } else if (messageType === 'info') {
        errorContainer.style.backgroundColor = 'blue';
        errorContainer.style.color = 'white';
    }

    errorContainer.style.display = 'block';

    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}


function startFetchingData() {
    setInterval(() => {
        fetch('/get_data')
            .then(response => response.json())
            .then(newData => {
                updateChart(newData);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }, 1000);
}

function changeColor() {
    var div = document.getElementById('colorDiv');
    div.style.backgroundColor = 'white';
    setTimeout(function() {
        div.style.backgroundColor = 'black';
    }, 100);
}

let isReading = false;

function startReading() {
    var selectedPort = document.getElementById("portList").value;

    fetch('/start_reading', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ port: selectedPort })
    })
    .then(response => {
        response.text().then(data => {
            messageType = 'error'
            if (response.ok) {
                startFetchingData();
                isReading = true;
                messageType = 'info'
            } else if (response.status === 409 && !isReading) {
                    console.info(data)
                    startFetchingData();
                    isReading = true;
            }
            showMessage('' + response.status + ' ' +  data, messageType)
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


function resetData() {
    fetch('/reset_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })
    .then(response => {
        response.text().then(data => {
            messageType = 'error'
            if (response.ok) {
                messageType = 'info'
            } else {
                isReading = true;
            }
            showMessage('' + response.status + ' ' +  data, messageType)
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}



fetch('/get_ports')
    .then(response => response.json())
    .then(ports => {
        ports.forEach(port => {
            const option = document.createElement('option');
            option.text = port;
            portList.add(option);
        });
    });

var ctx = document.getElementById('myChart').getContext('2d');
var initialData = new Array(10).fill(null);
var chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array.from(Array(initialData.length).keys()).fill(''),
        datasets: [{
            label: 'Latency',
            data: initialData,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    },
    options: {
        scales: {
            y: {
                suggestedMin: 0,
                suggestedMax: 100,
                ticks: {
                    callback: function(value, index, values) {
                        return value + ' μs';
                    }
                }
            },
            x: {
                display: false
            }
        }
    }
});


const errorLog = document.getElementById('errorLog');

function fetchLogs() {
    fetch('/events')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.json();
        })
        .then(data => {
            const logTable = document.createElement('table');

            const tableHead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            const headerDate = document.createElement('th');
            const headerMessage = document.createElement('th');
            headerRow.appendChild(headerDate);
            headerRow.appendChild(headerMessage);
            tableHead.appendChild(headerRow);
            logTable.appendChild(tableHead);

            const tableBody = document.createElement('tbody');

            data.forEach(log => {
                const logRow = document.createElement('tr');
                const logDate = document.createElement('td');
                logDate.textContent = log.timestamp;
                logDate.style.padding = '0 10px';
                const logMessage = document.createElement('td');
                logMessage.textContent = log.message;
                logMessage.style.padding = '0 10px';
                logRow.appendChild(logDate);
                logRow.appendChild(logMessage);
                tableBody.appendChild(logRow);
            });

            logTable.appendChild(tableBody);

            const errorLog = document.getElementById('errorLog');
            errorLog.innerHTML = '';

            errorLog.appendChild(logTable);
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
        });
}

fetchLogs();

setInterval(fetchLogs, 1000);
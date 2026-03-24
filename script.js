/*
// Register the datalabels plugin globally (Imported in HTML)
Chart.register(ChartDataLabels);

let myChart = null;

function generateTable() {
    const month = document.getElementById('monthSelect').value;
    const days = document.getElementById('durationSelect').value;

    // Update UI Titles
    document.getElementById('selectedReportTitle').innerText = `${month} (${days} Days)`;
    document.getElementById('chartReportTitle').innerText = `${month} Daylight Analysis`;

    // Show Data Entry Card, Hide Graph Card
    document.getElementById('dataEntryCard').style.display = 'block';
    document.getElementById('graphCard').style.display = 'none';

    // Generate Table HTML
    let html = `<table>
        <thead>
            <tr>
                <th>Day</th>
                <th>Sunrise☀️</th>
                <th>Sunset🌙</th>
            </tr>
        </thead>
        <tbody>`;
    
    // Default values (approximate) - Thoda randomness add kiya hai taaki graph visually change dikhe test karte waqt
    for(let i=1; i<=days; i++) {
        // Example dynamic times for testing variety
        let srTime = "06:00";
        let ssTime = (18 + (i % 3) * 0.5).toString().padStart(2, '0') + ":00"; // sunset will vary between 18:00, 18:30, 19:00

        html += `<tr>
            <td><strong>Day ${i}</strong></td>
            <td><input type="time" class="sunrise-input" value="${srTime}"></td>
            <td><input type="time" class="sunset-input" value="${ssTime}"></td>
        </tr>`;
    }
    
    html += `</tbody></table>`;
    document.getElementById('table-wrapper').innerHTML = html;
}

// Helper to convert time string to decimal hours (e.g., "6:30" -> 6.5)
function timeToDecimal(timeStr) {
    if(!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
}

// Helper to format decimal back to AM/PM (e.g., 6.5 -> "6:30 AM", 18.5 -> "6:30 PM")
function formatTimeAP(decimalHours) {
    if(isNaN(decimalHours)) return "";
    
    let hours = Math.floor(decimalHours);
    let minutes = Math.round((decimalHours - hours) * 60);
    
    if (minutes === 60) {
        hours += 1;
        minutes = 0;
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    let displayHours = hours % 12;
    displayHours = displayHours ? displayHours : 12; // total hour '0' should be '12'
    const displayMinutes = minutes < 10 ? '0'+minutes : minutes;
    
    return `${displayHours}:${displayMinutes}${ampm}`;
}

function createChart() {
    // 1. Get Data from Table
    const sunriseInputs = document.querySelectorAll('.sunrise-input');
    const sunsetInputs = document.querySelectorAll('.sunset-input');
    
    const labels = [];
    const durData = []; // Daylight Duration (This represents the BAR HEIGHT now)
    const rawSunrise = [];
    const rawSunset = [];

    sunriseInputs.forEach((input, index) => {
        const srTime = input.value;
        const ssTime = sunsetInputs[index].value;

        if(!srTime || !ssTime) return; // Skip if empty

        const srDec = timeToDecimal(srTime);
        let ssDec = timeToDecimal(ssTime);

        // Handle case where sunset might be past midnight (e.g., polar regions or very long days)
        if(ssDec < srDec) ssDec += 24; 

        const diff = (ssDec - srDec).toFixed(2); // Duration calculation

        labels.push(`Day ${index + 1}`);
        durData.push(parseFloat(diff)); // Bar Height
        rawSunrise.push(formatTimeAP(srDec)); // Text for Top
        rawSunset.push(formatTimeAP(ssDec)); // Text for Bottom
    });

    if(durData.length === 0) {
        alert("Please enter sunrise and sunset times.");
        return;
    }

    // 2. Show Graph Card
    document.getElementById('graphCard').style.display = 'block';

    // 3. Destroy old chart if exists (important!)
    if(myChart) myChart.destroy();

    // 4. Create New Chart
    const ctx = document.getElementById('daylightChart').getContext('2d');
    
    // Custom Bar Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#818cf8'); // Lighter violet (top)
    gradient.addColorStop(1, '#4f46e5'); // Darker violet (bottom)

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daylight Hours',
                data: durData, // Bar Height directly related to daylight duration
                backgroundColor: gradient,
                borderColor: '#4338ca',
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false, // Apply border radius to all sides
                
                // --- Custom Data attached for DataLabels plugin to use ---
                sunriseTimes: rawSunrise, 
                sunsetTimes: rawSunset
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Use CSS height from .chart-container-relative
            layout: {
                padding: {
                    top: 40, // More Space for Sunrise labels
                    bottom: 40 // More Space for Sunset labels
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    // Dynamic Max based on data + padding
                    max: Math.max(...durData) * 1.2, 
                    title: { display: true, text: 'Daylight Duration (Hours)' },
                    grid: { color: '#f1f5f9' },
                    ticks: {
                        callback: function(value) { return value + 'h'; }
                    }
                },
                x: {
                    grid: { display: false } // Hide vertical grid lines
                }
            },
            plugins: {
                legend: { display: false }, // Hide dataset label
                tooltip: { enabled: false }, // Disable default tooltips
                
                // --- Configure Datalabels Plugin (This creates your custom design) ---
                datalabels: {
                    display: true,
                    // textAlign must be center for all labels
                    textAlign: 'center',
                    
                    // Main Label configuration (we use multiple objects for top/mid/bot)
                    labels: {
                        // 1. Sunrise (Top of the Bar)
                        sunrise: {
                            align: 'top',
                            anchor: 'end', // Position relative to the *end* (top) of the bar
                            color: '#000000',
                            font: {weight: '600', size: 11},
                            formatter: (value, ctx) => ctx.dataset.sunriseTimes[ctx.dataIndex],
                            offset: 5 // Space above bar
                        },
                        // 2. Duration (Middle of the Bar)
                        duration: {
                            align: 'center',
                            anchor: 'center', // Position in the *center* of the bar
                            color: '#ffffff',
                            font: {weight: 'bold', size: 13},
                            formatter: (value) => `${value}h`, // Display the height value
                        },
                        // 3. Sunset (Bottom of the Bar)
                        sunset: {
                            align: 'bottom',
                            anchor: 'start', // Position relative to the *start* (bottom) of the bar
                            color: '#444444',
                            font: {weight: '600', size: 11},
                            formatter: (value, ctx) => ctx.dataset.sunsetTimes[ctx.dataIndex],
                            offset: 5 // Space below bar
                        }
                    }
                }
            }
        }
    });
}

// Download functionality remains the same as previous response
async function downloadImage(format) {
    const element = document.getElementById('capture-area');
    const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff', // Ensure white background
        scale: 2 // Higher quality
    });
    
    const month = document.getElementById('monthSelect').value;
    const fileName = `${month}_Daylight_Chart`;
    
    const link = document.createElement('a');
    
    if (format === 'png') {
        link.href = canvas.toDataURL('image/png');
        link.download = `${fileName}.png`;
    } else {
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.download = `${fileName}.jpg`;
    }
    
    link.click();
}
*/
Chart.register(ChartDataLabels);
let myChart = null;

// Sahi dino ki sankhya nikalne ke liye function
function getDaysInMonth(month, year) {
    const monthIndex = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ].indexOf(month);
    
    // February ke liye 28 ya 29 check karega, baaki ke liye sahi din
    return new Date(year, monthIndex + 1, 0).getDate();
}

function generateTable() {
    const month = document.getElementById('monthSelect').value;
    const durationType = document.getElementById('durationSelect').value;
    const currentYear = new Date().getFullYear();
    
    let days;
    if (durationType === "30") {
        days = getDaysInMonth(month, currentYear); // February fix yaha hai
    } else {
        days = parseInt(durationType);
    }

    document.getElementById('selectedReportTitle').innerText = `${month} (${days} Days)`;
    document.getElementById('chartReportTitle').innerText = `${month} Daylight Analysis`;
    document.getElementById('dataEntryCard').style.display = 'block';
    document.getElementById('graphCard').style.display = 'none';

    let html = `<table><thead><tr><th>Day</th><th>Sunrise☀️</th><th>Sunset🌙</th></tr></thead><tbody>`;
    for(let i=1; i<=days; i++) {
        html += `<tr>
            <td><strong>Day ${i}</strong></td>
            <td><input type="time" class="sunrise-input" value="06:00"></td>
            <td><input type="time" class="sunset-input" value="18:00"></td>
        </tr>`;
    }
    html += `</tbody></table>`;
    document.getElementById('table-wrapper').innerHTML = html;
}

function timeToDecimal(timeStr) {
    if(!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
}

function formatTimeAP(decimalHours) {
    let hours = Math.floor(decimalHours);
    let minutes = Math.round((decimalHours - hours) * 60);
    if (minutes === 60) { hours += 1; minutes = 0; }
    const ampm = hours >= 12 ? 'PM' : 'AM';
    let h = hours % 12; h = h ? h : 12;
    return `${h}:${minutes < 10 ? '0'+minutes : minutes}${ampm}`;
}

function createChart() {
    const sunriseInputs = document.querySelectorAll('.sunrise-input');
    const sunsetInputs = document.querySelectorAll('.sunset-input');
    const labels = [], durData = [], rawSunrise = [], rawSunset = [];

    sunriseInputs.forEach((input, index) => {
        const srDec = timeToDecimal(input.value);
        let ssDec = timeToDecimal(sunsetInputs[index].value);
        if(ssDec < srDec) ssDec += 24; 
        const diff = (ssDec - srDec).toFixed(2);

        labels.push(`D-${index + 1}`);
        durData.push(parseFloat(diff));
        rawSunrise.push(formatTimeAP(srDec));
        rawSunset.push(formatTimeAP(ssDec));
    });

    document.getElementById('graphCard').style.display = 'block';
    if(myChart) myChart.destroy();

    const ctx = document.getElementById('daylightChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#818cf8');
    gradient.addColorStop(1, '#4f46e5');

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: durData,
                backgroundColor: gradient,
                borderColor: '#4338ca',
                borderWidth: 1,
                borderRadius: 8,
                barPercentage: 0.8,      // Bar ko mota karne ke liye
                categoryPercentage: 0.9, // Bars ke beech gap kam karne ke liye
                sunriseTimes: rawSunrise, 
                sunsetTimes: rawSunset
            }]
        },
        /*
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 50, bottom: 50 } },
            scales: {
                y: { 
                    beginAtZero: true, 
                    max: Math.max(...durData) * 1.3,
                    ticks: { callback: v => v + 'h' }
                },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                datalabels: {
                    display: true,
                    textAlign: 'center',
                    labels: {
                        sunrise: {
                            align: 'top', anchor: 'end', color: '#d97706', // Orange for sun
                            font: { weight: 'bold', size: 12 },
                            formatter: (v, ctx) => ctx.dataset.sunriseTimes[ctx.dataIndex],
                            offset: 10
                        },
                        duration: {
                            align: 'center', anchor: 'center', color: '#ffffff',
                            font: { weight: 'bold', size: 14 },
                            formatter: v => v + ' hrs'
                        },
                        sunset: {
                            align: 'bottom', anchor: 'start', color: '#1e293b',
                            font: { weight: 'bold', size: 12 },
                            formatter: (v, ctx) => ctx.dataset.sunsetTimes[ctx.dataIndex],
                            offset: 10
                        }
                    }
                }
            }
        }
        */
            // createChart function ke andar 'options' section ko update karein:
options: {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
        padding: { top: 60, bottom: 60 } // Labels ke liye extra jagah
    },
    scales: {
        y: {
            beginAtZero: false, // Isse difference zyada lamba-chhota dikhega
            // Hum range ko tight rakhenge taaki 12h aur 12.5h me bada farak dikhe
            suggestedMin: Math.min(...durData) - 1, 
            suggestedMax: Math.max(...durData) + 1,
            title: { display: true, text: 'Hours' },
            ticks: { stepSize: 0.5 }
        },
        x: {
            grid: { display: false }
        }
    },
    plugins: {
        legend: { display: false },
        datalabels: {
            display: true,
                    textAlign: 'center',
            // ... pichla wala datalabels code yaha rahega ...
            labels: {
                sunrise: {
                    align: 'top', anchor: 'end', color: '#f59e0b',
                    font: { weight: 'bold', size: 13 },
                    formatter: (v, ctx) => ctx.dataset.sunriseTimes[ctx.dataIndex],
                    offset: 12
                },
                duration: {
                    align: 'center', anchor: 'center', color: '#ffffff',
                    font: { weight: '900', size: 16 }, // Hours ko bada kiya
                    formatter: v => v + 'h'
                },
                sunset: {
                    align: 'bottom', anchor: 'start', color: '#1e293b',
                    font: { weight: 'bold', size: 13 },
                    formatter: (v, ctx) => ctx.dataset.sunsetTimes[ctx.dataIndex],
                    offset: 12
                }
            }
        }
    }
}

    });
}

// Download function remains same
async function downloadImage(format) {
    const element = document.getElementById('capture-area');
    const canvas = await html2canvas(element, { scale: 2 });
    const link = document.createElement('a');
    link.href = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg');
    link.download = `Solar_Report.${format}`;
    link.click();
}

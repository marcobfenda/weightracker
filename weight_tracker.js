let weightData = JSON.parse(localStorage.getItem('weightData')) || [];

const ctx = document.getElementById('weightChart').getContext('2d');
let weightChart = new Chart(ctx, {
	type: 'line',
	data: {
		labels: weightData.map(e => e.dateOnly || e.date.split(',')[0]),
		datasets: [{
			label: 'Weight (kg)',
			data: weightData.map(e => e.weight),
			borderColor: '#3498db',
			backgroundColor: 'rgba(52, 152, 219, 0.2)',
			fill: true,
			tension: 0.1
		}]
	},
	options: {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			x: {
				title: { display: true, text: 'Date' },
				ticks: {
					callback: function (value) {
						return this.getLabelForValue(value);
					}
				}
			},
			y: { title: { display: true, text: 'Weight (kg)' } }
		}
	}
});

function updateRecords() {
	const list = $('#recordList');
	list.empty();
	weightData.forEach((entry, index) => {
		let arrow = '';
		if (index > 0) {
			if (entry.weight > weightData[index - 1].weight) {
				arrow = `<span class="arrow-up" title="Weight increased">▲</span>`;
			} else if (entry.weight < weightData[index - 1].weight) {
				arrow = `<span class="arrow-down" title="Weight decreased">▼</span>`;
			} else {
				arrow = `<span class="arrow-equal" title="Weight unchanged">—</span>`;
			}
		}
		list.append(`
		<div class="record-item">
		  <span>${entry.date}</span>
		  <span>${entry.weight} kg ${arrow}</span>
		</div>
	  `);
	});
}

$('#weightForm').on('submit', function (e) {
	e.preventDefault();
	const weight = parseFloat($('#weightInput').val());
	if (isNaN(weight) || weight <= 0) return;

	const now = new Date();
	const fullDateTime = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
	const dateOnly = now.toLocaleDateString();

	weightData.push({ date: fullDateTime, dateOnly: dateOnly, weight: weight });
	localStorage.setItem('weightData', JSON.stringify(weightData));

	weightChart.data.labels.push(dateOnly);
	weightChart.data.datasets[0].data.push(weight);
	weightChart.update();

	updateRecords();
	$('#weightInput').val('');
});

$('#exportData').on('click', function () {
	const blob = new Blob([JSON.stringify(weightData)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'weight_data.json';
	a.click();
	URL.revokeObjectURL(url);
});

$('#importData').on('click', function () {
	$('#fileInput').click();
});

$('#fileInput').on('change', function (e) {
	const file = e.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = function (e) {
		try {
			weightData = JSON.parse(e.target.result);

			// Normalize: ensure every entry has dateOnly (for chart labels)
			weightData = weightData.map(entry => {
				if (!entry.dateOnly && entry.date) {
					entry.dateOnly = entry.date.split(',')[0];
				}
				return entry;
			});

			localStorage.setItem('weightData', JSON.stringify(weightData));

			weightChart.data.labels = weightData.map(e => e.dateOnly || e.date.split(',')[0]);
			weightChart.data.datasets[0].data = weightData.map(e => e.weight);
			weightChart.update();

			updateRecords();
		} catch (err) {
			alert('Invalid file format');
		}
	};
	reader.readAsText(file);
});

// Initial load
updateRecords();

function updateTable(subject, selected) {
	requireNewCheck();
	// send a requst to the server for timtable data from the database.
	let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			use(this);
		}
	};
	xhttp.open("GET", `timetabledata?set=${selected}&sub=${subject}`, true);
	xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhttp.send();
}

function use(data) {
	rows = JSON.parse(data.response).rows;
	rows.forEach(item => {
		t = document.getElementById("table")
		row = t.firstElementChild.children[2 + parseInt(item.period)]
		box = row.children[parseInt(item.day) - 1]
		teacher = item.teacher == null ? "" : "<br>" + item.teacher;
		box.innerHTML = item.class + teacher;
		box.style.cssText = `background-color: ${colours[item.division]};`
		if (item.override) {
			// resed disabled selects
			let selects = document.getElementsByTagName('select');
			for (i = 0; i < selects.length; i++) {
				selects[i].disabled = false;
			}
			// disable the overriden one
			document.getElementById(item.override).disabled = true;
		}
	})
}

let colours = {
	'Maths': 'rgb(228, 235, 106)',
	'English': 'rgb(104, 255, 106)',
	'Science': 'rgb(114, 228, 219)'
}

function updateTable(subject, set) {
	if (set == 'none') {
		reloadTable();
		return;
	}
	// send a requst to the server for timtable data from the database.
	const xhttp = new XMLHttpRequest();
	xhttp.onload = use
	xhttp.open("GET", `/timetabledata?set=${set}&sub=${subject}`, true);
	xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhttp.send();
}

function use(data) {
	rows = JSON.parse(data.target.response).rows;
	for (item of rows) {
		t = document.getElementById("table")
		row = t.firstElementChild.children[2 + parseInt(item.period)]
		box = row.children[parseInt(item.day) - 1]
		teacher = item.teacher == null ? "" : "<br>" + item.teacher;
		box.innerHTML = item.class + teacher;
		box.style.cssText = `background-color: ${colours[item.division]};`
		if (item.override) {
			// reset disabled selects
			let selects = document.getElementsByTagName('select');
			for (i = 0; i < selects.length; i++) {
				selects[i].disabled = false;
			}
			// disable the overriden one
			document.getElementById(item.override).value = 'none';
			document.getElementById(item.override).disabled = true;
		}
	}
}

const colours = {
	'Maths': 'lavenderblush',
	'English': 'lavender',
	'Science': 'aquamarine'
}

function reloadTable(){

	t = document.getElementById("table")
	for (const row of Array.from(t.firstElementChild.children).slice(3)){
		for (const box of row.children) {
			box.innerHTML = '';
			box.style.cssText = '';
		}
	}
	

	const selects = document.getElementsByTagName('select');
	for (select of selects) {
		if (select.value !== 'none') {
			select.onchange()
		}
	}
}
reloadTable();

// TODO: Cashe timetale data or my server will die.

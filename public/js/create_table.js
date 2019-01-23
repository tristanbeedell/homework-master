
function choose(set, notset) {
	const options = document.getElementsByTagName('option');
	for (option of options) {
		if (option.value === set) {
			option.selected = true;
			option.parentNode.classList.add('flash');
		} else if (option.value === notset) {
			option.selected = false;
		}
	}
	sync();
}
let previous;

function sync () {
	const selects = document.getElementsByTagName('select');
	let taken = [];
	for (const select of selects) {
		if (select.value !== 'none' && !taken.includes(select.value)) {
			taken.push(select.value);
		}
	}
	document.forms['timetable-form'].innerHTML = '';
	for (const subject of taken) {
		const set = subject.split('&');
		let p = document.createElement('input');
		p.value = set[1];
		p.placeholder = p.name = set[0];
		p.className = 'full-width';
		p.onchange = (event) => {
			choose(`${event.target.placeholder}&${event.target.value}`, `${event.target.placeholder}&${set[1]}`)
		};
		document.forms['timetable-form'].appendChild(p);
	}
	let submit = document.createElement('input');
	submit.type = "submit";
	submit.className = 'full-width';
	document.forms['timetable-form'].appendChild(submit);

}

sync();

function deleteAccount() {
	let xhttp = new XMLHttpRequest();
	xhttp.open("DELETE", window.location.pathname);
	xhttp.onload = location.reload;
	xhttp.send();
}

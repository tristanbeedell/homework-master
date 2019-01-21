let allIsValid;
function check(id) {
	allIsValid = true;
	requireNewCheck();
	let password = document.getElementById("password");
	let newpassword = document.getElementById("newpassword");
	let checkPassword = document.getElementById("checkPassword");

	if (id == 'password') { return; }
	throwErrorIf(newpassword.value.length < 5 ? "Use a longer password." : "", newpassword);
	if (id == 'newpassword') { return; }
	throwErrorIf(newpassword.value != checkPassword.value ? "Passwords do not match." : "", checkPassword);

}

function throwErrorIf(error, ele) {
	if (error != "") {
		allIsValid = false;
		ele.previousElementSibling.firstElementChild.innerHTML = error;
	}
}

function signup(formID) {
	check('all');
	if (allIsValid) {
		document.getElementById(formID).submit();
	}
}

function ajaxValidate(url, body) {
	return new Promise((resolve, reject) => {
		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function () {
			if (this.readyState == 4) {
				if (this.status == 200) {
					resolve(this.response);
				} else {
					reject(this.response);
				}
			}
		};
		xhttp.open("POST", url, true);
		xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xhttp.send(body);
	});
}

function requireNewCheck() {
	submitbutton = document.getElementById("submit");
	if (submitbutton) {
		document.getElementById("signup").removeChild(submitbutton);
	}
}

function login() {
	guild = document.getElementById("guild").value;
	name = document.getElementById("name").value;
	password = document.getElementById("password").value;
	ajaxValidate("validateLogin", `password=${password}&guild=${guild}&name=${name}`)
		.then(() => {
			allIsValid = true;
			document.getElementById('login').submit();
		})
		.catch((message) => {
			document.getElementsByClassName('error')[0].innerHTML = message;
			allIsValid = false;
		});
}
function check(id, callback) {
	allIsValid = true
	requireNewCheck()
	let password = document.getElementById("password");
	let newpassword = document.getElementById("newpassword");
	let checkPassword = document.getElementById("checkPassword");

	var url = new URL(window.location.href);
	var memberid = url.searchParams.get("member");
	var guild = url.searchParams.get("guild");
	let body = `password=${password.value}&member=${memberid}&guild=${guild}`;
	ajaxValidate("checkNewUserPassword", body, valid => {
		throwErrorIf(valid != "true" ? "Hmmm, something doesn't look right... Make sure you used the link" : "", password)
		if (callback) {
			callback(allIsValid)
		}
	})
	if (id == 'password') { return }
	throwErrorIf(newpassword.value.length < 5 ? "Use a longer password." : "", newpassword);
	if (id == 'newpassword') { return }
	throwErrorIf(newpassword.value != checkPassword.value ? "Passwords do not match." : "", checkPassword);

}

function throwErrorIf(error, ele) {
	if (error != "") {
		allIsValid = false;
		alert(error)
	}
}

function signup(formID) {
	check('all', valid => {
		if (allIsValid) {
			document.getElementById(formID).submit();
		}
	});
}

function ajaxValidate(url, body, callback) {
	let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			callback(this.response)
		}
	};
	xhttp.open("POST", url, true);
	xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhttp.send(body);
}

function requireNewCheck() {
	submitbutton = document.getElementById("submit");
	if (submitbutton) {
		document.getElementById("signup").removeChild(submitbutton);
	}
}

function validatePassword(passwordEle) {
	guild = document.getElementById("guild").value;
	name = document.getElementById("name").value;
	ajaxValidate("validatePassword", `password=${passwordEle.value}&guild=${guild}&name=${name}`, message => {
		console.log(message)
		throwErrorIf(message != "valid" ? message : "", passwordEle)
	})
}

function validateMember(userEle) {
	guild = document.getElementById("guild").value;
	name = userEle.value;
	ajaxValidate("validateMember", `guild=${guild}&name=${name}`, message => {
		console.log(message)
		throwErrorIf(message != "valid" ? message : "", userEle)
	})
}

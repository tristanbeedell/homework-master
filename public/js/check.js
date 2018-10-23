function check(callback) {
	allIsValid = true
	let password = document.getElementById("password");
	let newpassword = document.getElementById("newpassword");
	let checkPassword = document.getElementById("checkPassword");

	throwErrorIf(newpassword.value.length < 5 ? "Use a longer password." : "", newpassword);
	throwErrorIf(newpassword.value != checkPassword.value ? "Passwords do not match." : "", checkPassword);

	var url = new URL(window.location.href);
	var memberid = url.searchParams.get("member");
	var guild = url.searchParams.get("guild");
	let body = `password=${password.value}&member=${memberid}&guild=${guild}`;
	ajaxValidate("checkNewUserPassword", body, valid => {
		throwErrorIf(valid != "true" ? "Invalid" : "", password)
		if (callback) {
			callback(allIsValid)
		}
	})
}

function throwErrorIf(error, ele) {
	if (error != "") {
		allIsValid = false;
	}
	ele.previousElementSibling.getElementsByClassName("error")[0].innerHTML = error;
}

function signup(formID) {
	check(valid => {
		if (allIsValid) {
			document.getElementById(formID).submit();
		} else {
			alert("there is an error!")
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

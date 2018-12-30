// popouts will use touch if the user is on mobile.
function popout(ele) {
	if (onMobile) {
		ele.style.width = ele.style.width != "100%" ? "100%" : "0%"
	}
}

// I found this piece of code on... you guessed it! Stack Overflow!
let onMobile = (window.mobilecheck = function () {
	var check = false;
	(function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
	return check;
})()

function openInNewTab(url) {
	var win = window.open(url, '_blank');
	win.focus();
}

window.onload = function () {
	// page swipe
	let pageWipeEle = document.getElementsByClassName('page-wipe')[0];
	pageWipeEle.style.width = '0vw';

	// toggle menus
	if (onMobile) {
		forEach('menu-container', item => {
			item.addEventListener('touchstart', togglemenu)
		})
		forEach('menu-tag-content', item => {
			item.addEventListener('touchstart', togglemenu)
		})
		forEachTag('a', link => {
			link.addEventListener('touchstart', touch)
			link.onclick = function (e) {
				e.preventDefault();
				return 0;
			}
		})
	} else {
		forEachTag('a', link => {
			// if its a regular link then do a swipe when it's clicked.
			if (link.attributes.href.textContent[0] == '/'){
				link.onclick = click
			}
		})
	}
	
	// header
	forEach('header', header => {
		let head = header.firstElementChild
		animate(head, 'slide-in', 0.5, 0.6)
	})

	// time = startTime;
	setTimeout(() => {
		let totalHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		forEach('menu-item', item => {
			tagheight = item.firstElementChild.firstElementChild.firstElementChild.clientHeight;
			item.style.height = tagheight + totalHeight * 0.05 + "px";
		})
	}, 500)

	forEach('close', close => {
		close.onclick = closeAllModals;
	})
}

function touch(event) {
	event.preventDefault()
	console.log(event)
	y = window.pageYOffset
	event.target.addEventListener('touchend', e => { release(e, y) })
	return 0;
}

function release(event, prev) {
	if (Math.abs(window.pageYOffset - prev) < 10)
		click(event)
}

function click(event) {
	event.preventDefault()
	link = event.target
	speed = 0.3
	pageSwipe(speed)
	redirect(event.target.href, speed);
}

function forEach(classname, callback) {
	let items = document.getElementsByClassName(classname)
	for (itemi = 0; itemi < items.length; itemi++) {
		callback(items[itemi])
	}
}


function forEachTag(tag, callback) {
	let items = document.getElementsByTagName(tag)
	for (itemi = 0; itemi < items.length; itemi++) {
		callback(items[itemi])
	}
}


function animate(ele, anim, del, dur, curve) {
	ele.style['animation-delay'] = del + 's';
	ele.style['animation-duration'] = dur + 's';
	ele.style['transition-timing-function'] = curve;
	ele.classList.add(anim)
}

function transition(ele, del, dur, curve) {
	ele.style['transition-delay'] = del + 's';
	ele.style['transition-duration'] = dur + 's';
	ele.style['transition-timing-function'] = curve;
}

function toggleModal(event) {
	if (event.target) {
		let classes = event.target.classList;
		if (classes[0] == 'important-link') {
			let modal = document.getElementById(classes[1])
			modal.classList.add('open-modal')
		} else {
			closeAllModals()
		}
	} else {
		closeAllModals()
	}
}
window.onclick = toggleModal;


function closeAllModals() {
	forEach('modal', modal => {
		modal.classList.remove('open-modal')
	})
}


// function openmenu(event) {
// 	target = event.target || event.originalTarget
// 	if (target.classList[0] == 'menu-tag-content') {
// 		target.parentNode.parentNode.lastElementChild.style.width = '30vw';
// 	}
// }


// function closemenu(event) {
// 	// only close when exiting the menu content onto the page
// 	ele = event.fromElement || event.originalTarget
// 	if (event.relatedTarget &&
// 		!(event.relatedTarget.tagName == "A" ||
// 			event.relatedTarget.classList.contains("important-link")
// 		)) {

// 		content = ele.classList[0] == 'menu-content' ? ele :
// 			ele.classList[0] == 'menu-tag-content' && event.relatedTarget.classList[0] !== 'menu-content' ?
// 			ele.parentNode.parentNode.lastElementChild : null;
// 		if (content) content.style.width = '0';
// 	}
// }

// FIXME: Mobile popout menus

function togglemenu(event) {
	// only close when exiting the menu content onto the page
	ele = event.target
	
}

function pageSwipe(delay) {
	let pageWipeEle = document.getElementsByClassName('page-wipe')[0]
	pageWipeEle.style.left = '0';
	pageWipeEle.style.width = '100vw';
	transition(pageWipeEle, 0, delay, 'ease-out')
}

function redirect(url, delay) {
	setTimeout(function () {
		location = url
	}.bind(this), delay * 1000);
}

function toggleEntireMenu() {
	// close menu
	let time = 0;
	forEach('menu-container', (tag) => {
		tag.style['transition-delay'] = time + 's';
		time += 0.1;
		tag.style.right = tag.style.right == '-40vw' ? '-30vw' : '-40vw'
	})
	icon = document.getElementsByClassName('toggle-icon-container')[0]
	icon.style.transform = `rotate(${icon.style.transform == 'rotate(0deg)'?'90':'0'}deg)`
}

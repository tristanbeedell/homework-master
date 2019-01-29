/* eslint-disable no-unused-vars */
/* eslint-env browser */

// popouts will use touch if the user is on mobile.
function popout(ele) {
	ele.style.width = ele.style.width !== "100%" ? "100%" : "0%";
}

forEach('menu-container', (tag) => {
	tag.addEventListener('touchstart', popout);
});

function openInNewTab(url) {
	let win = window.open(url, '_blank');
	win.focus();
}

window.onpageshow = () => {
	// page swipe
	let pageWipeEle = document.getElementsByClassName('page-wipe')[0];
	pageWipeEle.style.width = '0vw';

	// toggle menus
	forEachTag('a', link => {
		link.addEventListener('touchend', touch);
		link.onclick = (e) => {
			e.preventDefault();
			return 0;
		};
		// if its a regular link then do a swipe when it's clicked.
		if (link.attributes.href.textContent[0] === '/'){
			link.onclick = click;
		}
	});

	forEachTag('input', input => {
		if (input.type === 'submit') {
			input.onclick = () => {
				pageSwipe(0.3);
				input.form.submit();
			};
		}
	});
	
	// header
	forEach('header', header => {
		let head = header.firstElementChild;
		animate(head, 'slide-in', 0.5, 0.6);
	});

	const totalHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	forEach('menu-item', item => {
		const tagheight = item.firstElementChild.firstElementChild.firstElementChild.clientHeight;
		item.style.height = tagheight + (totalHeight * 0.05) + "px";
	});

	forEach('close', close => {
		close.onclick = closeAllModals;
	});
};

let moved = false;
function touch(event) {
	event.preventDefault();
	event.target.addEventListener('touchmove', () => { moved = true; });
	event.target.addEventListener('touchend', release);
}

function release(e) {
	if (!moved) 
		click(e);
	moved = false;
}

function click(event) {
	event.preventDefault();
	const link = event.target;
	const speed = 0.3;
	pageSwipe(speed);
	redirect(link.href, speed);
}

function forEach(classname, callback) {
	let items = document.getElementsByClassName(classname);
	for (let itemi = 0; itemi < items.length; itemi++) {
		// eslint-disable-next-line callback-return
		callback(items[itemi]);
	}
}


function forEachTag(tag, callback) {
	let items = document.getElementsByTagName(tag);
	for (let itemi = 0; itemi < items.length; itemi++) {
		// eslint-disable-next-line callback-return
		callback(items[itemi]);
	}
}


function animate(ele, anim, del, dur, curve) {
	ele.style['animation-delay'] = del + 's';
	ele.style['animation-duration'] = dur + 's';
	ele.style['transition-timing-function'] = curve;
	ele.classList.add(anim);
}

function transition(ele, del, dur, curve) {
	ele.style['transition-delay'] = del + 's';
	ele.style['transition-duration'] = dur + 's';
	ele.style['transition-timing-function'] = curve;
}

function toggleModal(event) {
	if (event.target) {
		let classes = event.target.className.split(' ');
		if (classes.includes('important-link')) {
			let modal = document.getElementById(classes[1]);
			modal.classList.add('open-modal');
		} else if (!classes.includes('modal-content')) {
			closeAllModals();
		}
	} else {
		closeAllModals();
	}
}
window.onclick = toggleModal;


function closeAllModals() {
	forEach('modal', modal => {
		modal.classList.remove('open-modal');
	});
}

function pageSwipe(delay) {
	let pageWipeEle = document.getElementsByClassName('page-wipe')[0];
	pageWipeEle.style.left = '0';
	pageWipeEle.style.width = '100vw';
	transition(pageWipeEle, 0, delay, 'ease-out');
}

function redirect(url, delay) {
	setTimeout(() => {
		location = url;
	}, delay * 1000);
}

function toggleEntireMenu() {
	// close menu
	let time = 0;
	forEach('menu-container', (tag) => {
		tag.style['transition-delay'] = time + 's';
		time += 0.1;
		if (window.innerWidth <= 600)
			tag.style.right = tag.style.right === '-100vw' ? '-80vw' : '-100vw';
		else 
			tag.style.right = tag.style.right === '-400px' ? '-300px' : '-400px';
	});
	const icon = document.getElementsByClassName('toggle-icon-container')[0];
	icon.style.transform = `rotate(${icon.style.transform === 'rotate(0deg)'?'90':'0'}deg)`;
}

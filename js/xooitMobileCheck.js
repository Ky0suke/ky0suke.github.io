class XooitMobileCheck {

	constructor() {

		let forceDesktop = this.isKeyExists('forceDesktop'), 
			version = 'desktop';

		this.mobile = this.isMobile();

		version = (!forceDesktop && this.mobile) ? 'mobile' : 'desktop';

		this.eventHandlers();
		this.goTo(version);

	}

	goTo(destination) {

		let search = window.location.search;

		if (destination == 'mobile') {
			if (search.length) {
				if (search.indexOf('theme=test') === -1) {
					window.location.search = search + '&theme=test';
				}
			} else {
				window.location.search = '?theme=test';
			}
		} else {
			if (search.length && search.indexOf('theme=test') !== -1) {
				search = window.location.search.replace('theme=test', '');
				window.location.search = search;
			}
		}

	}

	/**
	 * Gestionnaire d'évènements
	 */
	eventHandlers() {

		if(this.mobile && this.localStorageSupported())
		document.addEventListener('DOMContentLoaded', this.insertLink.bind(this));

	}

	/**
	 * Vérifie si une clé existe
	 * @param  {string}  key nom de la clé
	 * @return {Boolean}
	 */
	isKeyExists(key) {

		let result = false;

		if(typeof Storage !== 'undefined' && localStorage.getItem(key))
			result = true;

		return result;

	}

	/**
	 * Vérifie si le visiteur navigue avec un appareil mobile
	 * @return {Boolean}
	 */
	isMobile() {

		let regExp = /android|webos|iphone|ipad|ipod|blackberry|bada|iemobile|opera mobi|opera mini|mobile safari|tablet os/i,
			ua = navigator.userAgent.toLowerCase();

		return (regExp.test(ua));
	}

	/**
	 * Vérifie si le stockage local est supporté
	 * @return {Boolean}
	 */
	localStorageSupported() {

		let result = false;

		if(typeof Storage !== 'undefined')
			result = true;

		return result;
	
	}

	insertLink() {

		let copyright 	= document.querySelector('.copyright a'),
			version 	= (this.forceDesktop('forceDesktop')) ? 'mobile' : 'bureau';

		copyright.insertAdjacentHTML('beforeBegin', '<a href="#" class="change-version btn" data-version="' + version + '"><b>Version ' + version + '</b></a> | ');

		document.querySelector('a.change-version').addEventListener('click', this.setData);
	}

	setData() {

		let version = this.getAttribute('data-version');

		if (version === 'bureau') {
			localStorage.setItem('forceDesktop', 1);
			this.setAttribute('data-version', 'mobile');
			this.innerHTML = this.innerHTML.replace('bureau', 'mobile');
		} else {
			localStorage.removeItem('forceDesktop');
			this.setAttribute('data-version', 'bureau');
			this.innerHTML = this.innerHTML.replace('mobile', 'bureau');
		}

		document.location.reload();
	}

}


let checkMobile = new XooitMobileCheck();

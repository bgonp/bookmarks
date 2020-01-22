/**
 * La variable editing guarda la referencias al nodo del DOM que se este editando en el form.
 * La variable last lleva un recuento de los bookmarks creados para ponerles un ID único.
 */
let editing, last = 0;

/**
 * Inicializa el programa. Llama a la creación de todos los event listeners necesarios.
 */
function run() {
	formListeners(document.getElementById('bookmark-form'));
	listListeners(document.getElementById('bookmark-container'));
	removeListeners(document.getElementById('bookmark-remove'));
	searchListeners(document.getElementById('bookmark-search'));
}

/**
 * Crea los listeners asociados al formulario de creación o edición de bookmarks sobre el elemento
 * pasado como parámetro.
 * @param {object} form
 */
function formListeners(form) {
	const title = form.querySelector('#bookmark-title');
	const url = form.querySelector('#bookmark-url');
	const color = form.querySelector('#bookmark-color');
	const color_btn = form.querySelector('#bookmark-color-btn');
	const description = form.querySelector('#bookmark-description');
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		if (editing) {
			editing.setTitle(title.value);
			editing.setUrl(url.value);
			editing.setColor(color.value);
			editing.setDescription(description.value);
		} else {
			createBookmark(title.value, url.value, color.value, description.value);
		}
		document.getElementById('bookmark-search').value = '';
		filterBookmarks('');
		formReset(form);
	});
	form.addEventListener('dragover', (e) => { e.preventDefault(); form.classList.add('over'); });
	form.addEventListener('dragleave', () => form.classList.remove('over'));
	form.addEventListener('drop', (e) => {
		e.preventDefault();
		form.classList.remove('over');
		const dragged = getDragged(e);
		if (dragged) {
			editing = dragged;
			form.classList.add('edit');
			title.value = editing.getTitle();
			url.value = editing.getUrl();
			description.value = editing.getDescription();
			color.value = editing.getColor();
			color.onchange();
		} else { 
			const content = e.dataTransfer.getData('text');
			if (isUrl(content)) url.value = content;
			else title.value = content;
		}
	});
	color_btn.addEventListener('click', () => color.click());
	color.onchange = () => {
		if (isDark(color.value)) color_btn.classList.add('dark');
		else color_btn.classList.remove('dark');
		color_btn.style.backgroundColor = color.value;
	}
	url.addEventListener('blur', () => {
		if(url.value && url.value.indexOf('http') !== 0) url.value = 'http://' + url.value;
	});
	form.querySelector('.btn-cancel').addEventListener('click', (e) => { e.preventDefault(); formReset(form); });
}

/**
 * Resetea el formulario de creación o edición de bookmarks sobre el nodo form pasado como parámetro.
 * @param {object} form
 */
function formReset(form) {
	editing = null;
	form.classList.remove('edit');
	form.reset();
	form.querySelector('#bookmark-color').value = '#EEEEEE';
	form.querySelector('#bookmark-color-btn').style.backgroundColor = '#EEEEEE';
	form.querySelector('#bookmark-color-btn').classList.remove('dark');
}

/**
 * Crea los listeners asociados a los eventos drag and drop sobre listas de bookmarks.
 * Actúa sobre el nodo pasado como parámetro siempre que contenga un bookmark-list.
 * @param {object} element
 */
function listListeners(element) {
	element.addEventListener('dragover', (e) => {
		if (e.target === element && getDragged(e) !== element) {
			element.classList.add('over');
			e.preventDefault();
		}
	});
	element.addEventListener('dragleave', () => element.classList.remove('over'));
	element.addEventListener('drop', (e) => {
		e.preventDefault();
		element.classList.remove('over');
		const dragged = getDragged(e);
		if (dragged && e.target === element && dragged !== element)
			try {
				element.querySelector('.bookmark-list').appendChild(dragged);
			} catch (e) {
				alert('Movimiento no permitido');
			}
	});
}

/**
 * Crea los listeners asociados al borrado de bookmarks sobre el botón pasado como parámetro.
 * @param {object} button
 */
function removeListeners(button) {
	button.addEventListener('dragover', (e) => { button.classList.add('over'); e.preventDefault(); });
	button.addEventListener('dragleave', () => button.classList.remove('over'));
	button.addEventListener('drop', (e) => {
		e.preventDefault();
		button.classList.remove('over');
		const dragged = getDragged(e);
		let mensaje = '¿Seguro que quieres borrar este marcador?';
		if (dragged.querySelector('.bookmark-list').innerHTML !== '')
			mensaje += ' (también se borrarán todos sus hijos)';
		if (confirm(mensaje)) dragged.remove();
	});
	button.addEventListener('click', () => alert('Arrastra a este botón un marcador para eliminarlo'));
}

/**
 * Crea el listener asociado a la búsqueda sobre el input pasado como parámetro.
 * @param {object} input
 */
function searchListeners(input) {
	input.addEventListener('keyup', () => {
		const timeout = setTimeout(() => {
			clearTimeout(timeout);
			filterBookmarks(input.value);
		}, 200);
	});
}

/**
 * Filtra los bookmarks que haya en el DOM según el string de búsqueda pasado como parámetro.
 * Busca tanto en el título como en la descripción del bookmark.
 * @param {string} search Palabra o palabras claves por las que buscar
 */
function filterBookmarks(search) {
	search = search.toLowerCase();
	for (let bookmark of document.getElementsByClassName('bookmark')) {
		bookmark.classList.remove('no-match');
		if (bookmark.getTitle().toLowerCase().indexOf(search) < 0 && bookmark.getDescription().toLowerCase().indexOf(search) < 0) {
			bookmark.hidden = true;
			bookmark.classList.add('no-match');
		} else while (bookmark) {
			bookmark.hidden = false;
			if ((bookmark = bookmark.parentNode.closest('.bookmark')) && search !== '')
				bookmark.classList.remove('list-hidden');
		}
	}
}

/**
 * Crea un nuevo nodo bookmark con los datos indicados como parámetros y lo añade al DOM
 * @param {string} title
 * @param {string} url
 * @param {string} color
 * @param {string} description
 */
function createBookmark(title, url, color, description) {
	const bookmark = document.createElement('li');
	const prev = document.createElement('div');
	const name = document.createElement('span');
	const link = document.createElement('a');
	const slide = document.createElement('a');
	const list = document.createElement('ul');

	bookmark.appendChild(prev);
	bookmark.appendChild(link);
	bookmark.appendChild(slide);
	bookmark.appendChild(name);
	bookmark.appendChild(list);

	bookmark.classList.add('bookmark');
	prev.classList.add('prev');
	name.classList.add('titulo');
	link.classList.add('enlace');
	slide.classList.add('slide');
	list.classList.add('bookmark-list');

	link.target = '_blank';
	link.innerHTML = '<i class="fa fa-external-link-square"></i>';
	slide.href = '#';
	slide.innerHTML = '<i class="fa fa-sort-asc"></i><i class="fa fa-sort-desc"></i>';
	bookmark.id = 'bookmark-' + ++last;
	bookmark.draggable = true;
	bookmark.setAttribute('title', description);

	bookmark.getTitle = () => name.innerHTML;
	bookmark.setTitle = (title) => name.innerHTML = title;
	bookmark.getUrl = () => link.getAttribute('href');
	bookmark.setUrl = (url) => {
		if (url) bookmark.classList.remove('folder');
		else bookmark.classList.add('folder');
		link.href = url;
	}
	bookmark.getColor = () => toHex(bookmark.style.backgroundColor);
	bookmark.setColor = (color) => {
		if (isDark(color)) bookmark.classList.add('dark');
		else bookmark.classList.remove('dark');
		bookmark.style.backgroundColor = color;
	}
	bookmark.getDescription = () => bookmark.title;
	bookmark.setDescription = (description) => bookmark.title = description;

	bookmark.setTitle(title);
	bookmark.setUrl(url);
	bookmark.setDescription(description);
	bookmark.setColor(color);

	bookmarkListeners(bookmark);
	document.querySelector('#bookmark-container > .bookmark-list').appendChild(bookmark);
}

/**
 * Crea todos los listeners asociados a los elementos bookmark sobre el nodo recibido como parámetro
 * @param {object} bookmark Nodo sobre el que aplicar los listeners
 */
function bookmarkListeners(bookmark) {
	const prev = bookmark.querySelector('.prev');
	prev.addEventListener('dragover', (e) => {
		if (e.target === prev) {
			const parent = bookmark.parentNode.closest('.bookmark');
			if (parent) parent.classList.add('over');
			e.preventDefault();
		}
	});
	prev.addEventListener('dragleave', () => {
		const parent = bookmark.parentNode.closest('.bookmark');
		if (parent) parent.classList.remove('over');
	});
	prev.addEventListener('drop', (e) => {
		e.preventDefault();
		if (e.target === prev) {
			const parent = bookmark.parentNode.closest('.bookmark');
			if (parent) parent.classList.remove('over');
			bookmark.parentNode.insertBefore(getDragged(e), bookmark);
		}
	});
	bookmark.addEventListener('dragstart', (e) => {
		if (e.target === bookmark) {
			bookmark.classList.add('dragged');
			e.dataTransfer.setData('dragged_id', bookmark.id);
		}
	});
	bookmark.addEventListener('dragend', (e) => {
		if (e.target === bookmark)
			bookmark.classList.remove('dragged');
	});
	bookmark.addEventListener('click', (e) => {
		if (e.target === bookmark)
			alert('Arrastra el marcador al formulario para editarlo');
	});
	bookmark.querySelector('.slide').addEventListener('click', (e) => {
		e.preventDefault();
		if (bookmark.classList.contains('list-hidden')) bookmark.classList.remove('list-hidden');
		else bookmark.classList.add('list-hidden');
	});
	listListeners(bookmark);
}

/**
 * Devuelve el elemento draggeado o false si no se esta arrastrando un bookmark
 * @param  {object} event
 * @return {object|bool}
 */
function getDragged(event) {
	const dragged_id = event.dataTransfer.getData('dragged_id');
	if (dragged_id) return document.getElementById(dragged_id);
	return false;
}

/**
 * Comprueba si el texto pasado como parámetro es una URL.
 * @param {string} content
 * @return {bool}
 */
function isUrl(content) {
	return /^http(s)?:\/\/.+(\..+)+$/.test(content);
}

/**
 * Transforma un string con un color en rgb a hexadecimal
 * @param {string} rgb
 * @return {string}
 */
function toHex(rgb) {
	let hex = '#';
	rgb.match(/\d{1,3}/g).forEach((color) => hex += parseInt(color).toString(16).padStart(2,'0'));
	return hex;
}

/**
 * Calcula si un color representado por un string en hexadecimal es oscuro o no
 * @param {string} hex
 * @return {bool}
 */
function isDark(hex) {
	let suma = 0;
	hex.match(/[0-9A-F]{1,2}/gi).forEach((color) => suma += parseInt('0x'+color));
	return suma < 512;
}

window.onload = run;

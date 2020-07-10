/**
 * La variable editing guarda la referencias al nodo del DOM que se este editando en el form.
 * La variable last lleva un recuento de los bookmarks creados para ponerles un ID único.
 */
let form, editing, last = 0

/**
 * Inicializa el programa. Llama a la creación de todos los event listeners necesarios.
 */
const run = () => {
	form = document.getElementById('bookmark-form')
	formListeners()
	listListeners(document.getElementById('bookmark-container'))
	removeListeners(document.getElementById('bookmark-remove'))
	searchListeners(document.getElementById('bookmark-search'))
	dummyDataListener(document.getElementById('load-dummy-data'))
}

/**
 * Crea los listeners asociados al formulario de creación o edición de bookmarks sobre el elemento
 * pasado como parámetro.
 */
const formListeners = () => {
	form.addEventListener('submit', (e) => submitListener(e))
	form.addEventListener('dragover', (e) => dragoverListener(e))
	form.addEventListener('dragleave', () => dragleaveListener())
	form.addEventListener('drop', (e) => dropListener(e))

	const inputs = form.elements
	const colorBtn = form.querySelector('#bookmark-color-btn')

	colorBtn.addEventListener('click', () => inputs['color'].click())
	inputs['color'].onchange = () => {
		colorBtn.classList[isDark(inputs['color'].value) ? 'add' : 'remove']('dark')
		colorBtn.style.backgroundColor = inputs['color'].value
	}
	inputs['url'].addEventListener('blur', () => {
		if (inputs['url'].value && inputs['url'].value.indexOf('http') !== 0) {
			inputs['url'].value = 'http://' + inputs['url'].value
		}
	})
	form.querySelector('.btn-cancel').addEventListener('click', (e) => {
		e.preventDefault()
		formReset()
	})
}

/**
 * Escucha el evento submit del formulario y crea o edita el bookmark correspondiente.
 * @param {object} e 
 */
const submitListener = (e) => {
	e.preventDefault()
	const inputs = form.elements
	if (editing) {
		editing.setTitle(inputs['title'].value)
		editing.setUrl(inputs['url'].value)
		editing.setColor(inputs['color'].value)
		editing.setDescription(inputs['description'].value)
	} else {
		createBookmark(inputs['title'].value, inputs['url'].value, inputs['color'].value, inputs['description'].value)
	}
	document.getElementById('bookmark-search').value = ''
	filterBookmarks('')
	formReset()
	document.getElementById('load-dummy-data').hidden = true
}

/**
 * Escucha el evento dragover del formulario y permite hacer drop de un bookmark.
 * @param {object} e 
 */
const dragoverListener = (e) => {
	e.preventDefault()
	form.classList.add('over')
}


/**
 * Escucha el evento dragleave del formulario y lo desmarca como over.
 */
const dragleaveListener = () => form.classList.remove('over')

/**
 * Escucha el evento drop del formulario y carga los datos del bookmark depositado.
 * @param {object} e 
 */
const dropListener = (e) => {
	e.preventDefault()
	form.classList.remove('over')
	const dragged = getDragged(e)
	if (dragged) {
		loadBookmark(dragged)
	} else {
		const content = e.dataTransfer.getData('text')
		if (isUrl(content)) {
			form.querySelector('#bookmark-url').value = content
		} else {
			form.querySelector('#bookmark-title').value = content
		}
	}
}

/**
 * Carga un bookmark en el formulario de edición.
 * @param {object} bookmark 
 */
const loadBookmark = (bookmark) => {
	editing = bookmark
	form.classList.add('edit')
	const inputs = form.elements
	inputs['title'].value = editing.getTitle()
	inputs['url'].value = editing.getUrl()
	inputs['description'].value = editing.getDescription()
	inputs['color'].value = editing.getColor()
	inputs['color'].onchange()
}

/**
 * Resetea el formulario de creación o edición de bookmarks sobre el nodo form pasado como parámetro.
 */
const formReset = () => {
	editing = null
	form.classList.remove('edit')
	form.reset()
	form.querySelector('#bookmark-color').value = '#EEEEEE'
	form.querySelector('#bookmark-color-btn').style.backgroundColor = '#EEEEEE'
	form.querySelector('#bookmark-color-btn').classList.remove('dark')
}

/**
 * Crea los listeners asociados a los eventos drag and drop sobre listas de bookmarks.
 * Actúa sobre el nodo pasado como parámetro siempre que contenga un bookmark-list.
 * @param {object} list
 */
const listListeners = (list) => {
	list.addEventListener('dragover', (e) => {
		if (e.target === list && getDragged(e) !== list) {
			list.classList.add('over')
			e.preventDefault()
		}
	})
	list.addEventListener('dragleave', () => list.classList.remove('over'))
	list.addEventListener('drop', (e) => {
		e.preventDefault()
		const dragged = getDragged(e)
		if (dragged && e.target === list && dragged !== list) {
			list.classList.remove('over')
			insertBookmark(list.querySelector('.bookmark-list'), dragged)
		}
	})
}


/**
 * Inserta un bookmark en la lista, opcionalmente se puede indicar la posición en la que insertar.
 * @param {object} list
 * @param {object} bookmark
 * @param {object|undefined} insertBefore
 */
const insertBookmark = (list, bookmark, insertBefore = undefined) => {
	try {
		const parentBefore = bookmark.parentNode.closest('.bookmark')
		const parentAfter = list.closest('.bookmark')
		if (insertBefore) {
			list.insertBefore(bookmark, insertBefore)
		} else {
			list.appendChild(bookmark)
		}
		if (parentBefore && !parentBefore.querySelector('.bookmark-list').hasChildNodes()) {
			parentBefore.classList.remove('has-children')
		}
		if (parentAfter) {
			parentAfter.classList.remove('over')
			parentAfter.classList.add('has-children')
		}
	} catch (e) {
		alert('Movimiento no permitido')
	}
}

/**
 * Crea los listeners asociados al borrado de bookmarks sobre el botón pasado como parámetro.
 * @param {object} button
 */
const removeListeners = (button) => {
	button.addEventListener('dragover', (e) => {
		button.classList.add('over')
		e.preventDefault()
	})
	button.addEventListener('dragleave', () => button.classList.remove('over'))
	button.addEventListener('drop', (e) => {
		e.preventDefault()
		button.classList.remove('over')
		const dragged = getDragged(e)
		let mensaje = '¿Seguro que quieres borrar este marcador?'
		if (dragged.querySelector('.bookmark-list').innerHTML !== '') {
			mensaje += ' (también se borrarán todos sus hijos)'
		}
		if (confirm(mensaje)) {
			dragged.remove()
		}
	})
	button.addEventListener('click', () => alert('Arrastra a este botón un marcador para eliminarlo'))
}

/**
 * Crea el listener asociado a la búsqueda sobre el input pasado como parámetro.
 * @param {object} input
 */
const searchListeners = (input) => {
	input.addEventListener('keyup', () => {
		const timeout = setTimeout(() => {
			clearTimeout(timeout)
			filterBookmarks(input.value)
		}, 200)
	})
}

/**
 * Filtra los bookmarks que haya en el DOM según el string de búsqueda pasado como parámetro.
 * Busca tanto en el título como en la descripción del bookmark.
 * @param {string} search Palabra o palabras claves por las que buscar
 */
const filterBookmarks = (search) => {
	search = search.toLowerCase()
	for (let bookmark of document.getElementsByClassName('bookmark')) {
		bookmark.classList.remove('no-match')
		if (
			bookmark.getTitle().toLowerCase().indexOf(search) < 0 &&
			bookmark.getDescription().toLowerCase().indexOf(search) < 0
		) {
			bookmark.hidden = true
			bookmark.classList.add('no-match')
		} else while (bookmark) {
			bookmark.hidden = false
			if ((bookmark = bookmark.parentNode.closest('.bookmark')) && search !== '') {
				bookmark.classList.remove('list-hidden')
			}
		}
	}
}

/**
 * Crea un nuevo nodo bookmark con los datos indicados como parámetros y lo añade al DOM.
 * @param {string} title
 * @param {string} url
 * @param {string} color
 * @param {string} description
 */
const createBookmark = (title, url, color, description) => {
	const bookmark = document.createElement('li')
	const prev = document.createElement('div')
	const name = document.createElement('span')
	const link = document.createElement('a')
	const slide = document.createElement('a')
	const list = document.createElement('ul')

	bookmark.appendChild(prev)
	bookmark.appendChild(link)
	bookmark.appendChild(slide)
	bookmark.appendChild(name)
	bookmark.appendChild(list)

	bookmark.classList.add('bookmark')
	prev.classList.add('prev')
	name.classList.add('titulo')
	link.classList.add('enlace')
	slide.classList.add('slide')
	list.classList.add('bookmark-list')

	link.target = '_blank'
	link.innerHTML = '<i class="fa fa-external-link-square"></i>'
	slide.href = '#'
	slide.innerHTML = '<i class="fa fa-sort-asc"></i><i class="fa fa-sort-desc"></i>'
	bookmark.id = 'bookmark-' + ++last
	bookmark.draggable = true
	bookmark.setAttribute('title', description)

	bookmark.getTitle = () => name.innerHTML
	bookmark.setTitle = (title) => name.innerHTML = title
	bookmark.getUrl = () => link.getAttribute('href')
	bookmark.setUrl = (url) => {
		if (url) bookmark.classList.remove('folder')
		else bookmark.classList.add('folder')
		link.href = url
	}
	bookmark.getColor = () => toHex(bookmark.style.backgroundColor)
	bookmark.setColor = (color) => {
		if (isDark(color)) bookmark.classList.add('dark')
		else bookmark.classList.remove('dark')
		bookmark.style.backgroundColor = color
	}
	bookmark.getDescription = () => bookmark.title
	bookmark.setDescription = (description) => bookmark.title = description

	bookmark.setTitle(title)
	bookmark.setUrl(url)
	bookmark.setDescription(description)
	bookmark.setColor(color)

	bookmarkListeners(bookmark)
	document.querySelector('#bookmark-container > .bookmark-list').appendChild(bookmark)
}

/**
 * Crea todos los listeners asociados a los elementos bookmark sobre el nodo recibido como parámetro.
 * @param {object} bookmark Nodo sobre el que aplicar los listeners
 */
const bookmarkListeners = (bookmark) => {
	const prev = bookmark.querySelector('.prev')
	prev.addEventListener('dragover', (e) => {
		if (e.target === prev) {
			const parent = bookmark.parentNode.closest('.bookmark')
			if (parent) parent.classList.add('over')
			e.preventDefault()
		}
	})
	prev.addEventListener('dragleave', () => {
		const parent = bookmark.parentNode.closest('.bookmark')
		if (parent) parent.classList.remove('over')
	})
	prev.addEventListener('drop', (e) => {
		e.preventDefault()
		if (e.target === prev) {
			insertBookmark(bookmark.parentNode, getDragged(e), bookmark)
		}
	})
	bookmark.addEventListener('dragstart', (e) => {
		if (e.target === bookmark) {
			bookmark.classList.add('dragged')
			e.dataTransfer.setData('draggedId', bookmark.id)
		}
	})
	bookmark.addEventListener('dragend', (e) => {
		if (e.target === bookmark) {
			bookmark.classList.remove('dragged')
		}
	})
	bookmark.addEventListener('click', (e) => {
		if (e.target === bookmark) {
			loadBookmark(bookmark, document)
		}
	})
	bookmark.querySelector('.slide').addEventListener('click', (e) => {
		e.preventDefault()
		if (bookmark.classList.contains('list-hidden')) {
			bookmark.classList.remove('list-hidden')
		} else {
			bookmark.classList.add('list-hidden')
		}
	})
	listListeners(bookmark)
}

/**
 * Devuelve el elemento draggeado o false si no se esta arrastrando un bookmark.
 * @param  {object} event
 * @return {object|bool}
 */
const getDragged = (event) => {
	const draggedId = event.dataTransfer.getData('draggedId')
	if (draggedId) {
		return document.getElementById(draggedId)
	}
	return false
}

/**
 * Comprueba si el texto pasado como parámetro es una URL.
 * @param {string} content
 * @return {bool}
 */
const isUrl = (content) => {
	return /^http(s)?:\/\/.+(\..+)+$/.test(content)
}

/**
 * Transforma un string con un color en rgb a hexadecimal.
 * @param {string} rgb
 * @return {string}
 */
const toHex = (rgb) => {
	return rgb.match(/\d{1,3}/g).reduce((hex, color) => hex + parseInt(color).toString(16).padStart(2, '0'), '#')
}

/**
 * Calcula si un color representado por un string en hexadecimal es oscuro o no.
 * @param {string} hex
 * @return {bool}
 */
const isDark = (hex) => {
	return 512 > hex.match(/[0-9A-F]{1,2}/gi).reduce((suma, color) => suma + parseInt('0x' + color), 0)
}

/**
 * Carga los datos de prueba.
 * @param {object} element Botón para cargar los datos de prueba
 */
const dummyDataListener = (element) => {
	element.addEventListener('click', (e) => {
		e.preventDefault()
		if (typeof loadDummy === 'function') {
			loadDummy()
		} else {
			console.error('Dummy data not defined')
		}
		element.hidden = true
	})
}

window.onload = run

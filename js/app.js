/* Проверка мобильного браузера */
let isMobile = { Android: function () { return navigator.userAgent.match(/Android/i); }, BlackBerry: function () { return navigator.userAgent.match(/BlackBerry/i); }, iOS: function () { return navigator.userAgent.match(/iPhone|iPad|iPod/i); }, Opera: function () { return navigator.userAgent.match(/Opera Mini/i); }, Windows: function () { return navigator.userAgent.match(/IEMobile/i); }, any: function () { return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()); } };

// Добавление класса _touch для HTML если браузер мобильный
if (isMobile.any()) document.documentElement.classList.add('touch');

// Учет плавающей панели на мобильных устройствах при 100vh
const fullScreens = document.querySelectorAll('[data-fp-section]');
if (fullScreens.length && isMobile.any()) {
	window.addEventListener('resize', fixHeight);
	function fixHeight() {
		let vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--vh', `${vh}px`);
	}
	fixHeight();
}

document.addEventListener("DOMContentLoaded", function (e) {

	// бургер меню
	let burger = document.querySelector(".burger-menu");
	let documentBody = document.documentElement;

	function menuOpen() {
		documentBody.classList.toggle("lock");
		documentBody.classList.toggle("menu-open");
	};

	function menuClose() {
		documentBody.classList.remove("menu-open");
		documentBody.classList.remove("lock");
	};


	burger?.addEventListener("click", function () {
		menuOpen();
	});






	// Клас FullPage
	class FullPage {
		constructor(element, options) {
			let config = {
				//===============================
				// Селектор, на котором не работает событие свайпа / колеса
				noEventSelector: '[data-no-event]',
				//===============================
				// Настройка оболочки
				// Класс при инициализации плагина
				classInit: 'fp-init',
				// Класс для врапера во время листания
				wrapperAnimatedClass: 'fp-switching',
				//===============================
				// Настройка секций
				// СЕЛЕКТОР для секций
				selectorSection: '[data-fp-section]',
				// Класс для активной секции
				activeClass: 'active-section',
				// Класс для предварительной секции
				previousClass: 'previous-section',
				// Класс для следующей секции
				nextClass: 'next-section',
				// id изначально активного класса
				idActiveSection: 0,
				//===============================
				// Другие настройки
				// Свайп мышью
				// touchSimulator: false,
				//===============================
				// Эффекты
				// Эффекты: fade, cards, slider
				mode: element.dataset.fpEffect ? element.dataset.fpEffect : 'slider',
				//===============================
				// буллеты
				// Активация буллетов
				bullets: element.hasAttribute('data-fp-bullets') ? true : false,
				// Класс оболочки буллетов
				bulletsClass: 'fp-bullets',
				// Класс буллета
				bulletClass: 'fp-bullet',
				// Класс активного буллета
				bulletActiveClass: 'fp-bullet-active',
				//===============================
				// События
				// Событие создания
				onInit: function () { },
				// Событие перелистывания секции
				onSwitching: function () { },
				// Событие разрушения плагина
				onDestroy: function () { },
			}
			this.options = Object.assign(config, options);
			// Родительский элемент
			this.wrapper = element;
			this.sections = this.wrapper.querySelectorAll(this.options.selectorSection);
			// Активный слайд
			this.activeSection = false;
			this.activeSectionId = false;
			// Предварительный слайд
			this.previousSection = false;
			this.previousSectionId = false;
			// Следующий слайд
			this.nextSection = false;
			this.nextSectionId = false;
			// Оболочка буллетов
			this.bulletsWrapper = false;
			// Вспомогательная переменная
			this.stopEvent = false;
			if (this.sections.length) {
				// Инициализация элементов
				this.init();
			}
		}
		//===============================
		// Начальная инициализация
		init() {
			if (this.options.idActiveSection > (this.sections.length - 1)) return
			// Расставляем id
			this.setId();
			this.activeSectionId = this.options.idActiveSection;
			// Присвоение классов с разными эффектами
			this.setEffectsClasses();
			// Установка классов
			this.setClasses();
			// Установка стилей
			this.setStyle();
			// Установка буллетов
			if (this.options.bullets) {
				this.setBullets();
				this.setActiveBullet(this.activeSectionId);
			}
			// установка меню ативного пункта
			this.setActiveMenu(this.activeSectionId);

			// Установка событий
			this.events();
			// Устанавливаем init класс
			setTimeout(() => {
				document.documentElement.classList.add(this.options.classInit);
				// Создание кастомного события
				this.options.onInit(this);
				document.dispatchEvent(new CustomEvent("fpinit", {
					detail: {
						fp: this
					}
				}));
			}, 0);
		}
		//===============================
		// Удалить
		destroy() {
			// Удаление событий
			this.removeEvents();
			// Удаление классов в секций
			this.removeClasses();
			// Удаление класса инициализации
			document.documentElement.classList.remove(this.options.classInit);
			// Удаление класса анимации
			this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
			// Удаление классов эффектов
			this.removeEffectsClasses();
			// Удаление z-index в секций
			this.removeZIndex();
			// Удаление стилей
			this.removeStyle();
			// Удаление ID
			this.removeId();
			// Создание кастомного события
			this.options.onDestroy(this);
			document.dispatchEvent(new CustomEvent("fpdestroy", {
				detail: {
					fp: this
				}
			}));
		}
		//===============================
		// Установка ID для секций
		setId() {
			for (let index = 0; index < this.sections.length; index++) {
				const section = this.sections[index];
				section.setAttribute('data-fp-id', index);
			}
		}
		//===============================
		// Удаление ID для секций
		removeId() {
			for (let index = 0; index < this.sections.length; index++) {
				const section = this.sections[index];
				section.removeAttribute('data-fp-id');
			}
		}
		//===============================
		// Функция установки классов для первой, активной и следующей секций
		setClasses() {
			// Сохранение id для предыдущего слайда (если таковой имеется)
			this.previousSectionId = (this.activeSectionId - 1) >= 0 ?
				this.activeSectionId - 1 : false;

			// Сохранение id для следующего слайда (если таковой имеется)
			this.nextSectionId = (this.activeSectionId + 1) < this.sections.length ?
				this.activeSectionId + 1 : false;

			// Установка класса и присвоение элемента для АКТИВНОГО слайда
			this.activeSection = this.sections[this.activeSectionId];
			this.activeSection.classList.add(this.options.activeClass);

			for (let index = 0; index < this.sections.length; index++) {
				document.documentElement.classList.remove(`fp-section-${index}`);
			}
			document.documentElement.classList.add(`fp-section-${this.activeSectionId}`);

			// Установка класса и присвоение элемента для предыдущего слайда
			if (this.previousSectionId !== false) {
				this.previousSection = this.sections[this.previousSectionId];
				this.previousSection.classList.add(this.options.previousClass);
			} else {
				this.previousSection = false;
			}

			// Установка класса и присвоение элемента для следующего слайда
			if (this.nextSectionId !== false) {
				this.nextSection = this.sections[this.nextSectionId];
				this.nextSection.classList.add(this.options.nextClass);
			} else {
				this.nextSection = false;
			}
		}
		//===============================
		// Присвоение классов с разными эффектами
		removeEffectsClasses() {
			switch (this.options.mode) {
				case 'slider':
					this.wrapper.classList.remove('slider-mode');
					break;

				case 'cards':
					this.wrapper.classList.remove('cards-mode');
					this.setZIndex();
					break;

				case 'fade':
					this.wrapper.classList.remove('fade-mode');
					this.setZIndex();
					break;

				default:
					break;
			}
		}
		//===============================
		// Присвоение классов с разными эффектами
		setEffectsClasses() {
			switch (this.options.mode) {
				case 'slider':
					this.wrapper.classList.add('slider-mode');
					break;

				case 'cards':
					this.wrapper.classList.add('cards-mode');
					this.setZIndex();
					break;

				case 'fade':
					this.wrapper.classList.add('fade-mode');
					this.setZIndex();
					break;

				default:
					break;
			}
		}
		//===============================
		// Блокировка направлений скролла
		//===============================
		// Функция установки стилей
		setStyle() {
			switch (this.options.mode) {
				case 'slider':
					this.styleSlider();
					break;

				case 'cards':
					this.styleCards();
					break;

				case 'fade':
					this.styleFade();
					break;
				default:
					break;
			}
		}
		// slider-mode
		styleSlider() {
			for (let index = 0; index < this.sections.length; index++) {
				const section = this.sections[index];
				if (index === this.activeSectionId) {
					section.style.transform = 'translate3D(0,0,0)';
				} else if (index < this.activeSectionId) {
					section.style.transform = 'translate3D(0,-100%,0)';
				} else if (index > this.activeSectionId) {
					section.style.transform = 'translate3D(0,100%,0)';
				}
			}
		}
		// cards mode
		styleCards() {
			for (let index = 0; index < this.sections.length; index++) {
				const section = this.sections[index];
				if (index >= this.activeSectionId) {
					section.style.transform = 'translate3D(0,0,0)';
				} else if (index < this.activeSectionId) {
					section.style.transform = 'translate3D(0,-100%,0)';
				}
			}
		}
		// fade style 
		styleFade() {
			for (let index = 0; index < this.sections.length; index++) {
				const section = this.sections[index];
				if (index === this.activeSectionId) {
					section.style.opacity = '1';
					section.style.pointerEvents = 'all';
					//section.style.visibility = 'visible';
				} else {
					section.style.opacity = '0';
					section.style.pointerEvents = 'none';
					//section.style.visibility = 'hidden';
				}
			}
		}
		//===============================
		// Удаление стилей
		removeStyle() {
			for (let index = 0; index < this.sections.length; index++) {
				const section = this.sections[index];
				section.style.opacity = '';
				section.style.visibility = '';
				section.style.transform = '';
			}
		}
		//===============================
		// Функция проверки полностью ли был прокручен элемент
		checkScroll(yCoord, element) {
			this.goScroll = false;

			// Есть ли элемент и готов ли к работе
			if (!this.stopEvent && element) {
				this.goScroll = true;
				// Если высота секции не равна высоте окна
				if (this.haveScroll(element)) {
					this.goScroll = false;
					const position = Math.round(element.scrollHeight - element.scrollTop);
					// Проверка на то, полностью ли прокручена секция
					if (
						((Math.abs(position - element.scrollHeight) < 2) && yCoord <= 0) ||
						((Math.abs(position - element.clientHeight) < 2) && yCoord >= 0)
					) {
						this.goScroll = true;
					}
				}
			}
		}
		//===============================
		// Проверка высоты 
		haveScroll(element) {
			return element.scrollHeight !== window.innerHeight
		}
		//===============================
		// Удаление классов
		removeClasses() {
			for (let index = 0; index < this.sections.length; index++) {
				const section = this.sections[index];
				section.classList.remove(this.options.activeClass);
				section.classList.remove(this.options.previousClass);
				section.classList.remove(this.options.nextClass);
			}
		}
		//===============================
		// Сборник событий...
		events() {
			this.events = {
				// Колесо мыши
				wheel: this.wheel.bind(this),

				// Свайп
				touchdown: this.touchDown.bind(this),
				touchup: this.touchUp.bind(this),
				touchmove: this.touchMove.bind(this),
				touchcancel: this.touchUp.bind(this),

				// Конец анимации
				transitionEnd: this.transitionend.bind(this),

				// Клик для буллетов
				click: this.clickBullets.bind(this),
			}
			if (isMobile.iOS()) {
				document.addEventListener('touchmove', (e) => {
					e.preventDefault();
				});
			}
			this.setEvents();
		}
		setEvents() {
			// Событие колеса мыши
			this.wrapper.addEventListener('wheel', this.events.wheel);
			// Событие нажатия на экран
			this.wrapper.addEventListener('touchstart', this.events.touchdown);
			// Событие клика по буллетам
			if (this.options.bullets && this.bulletsWrapper) {
				this.bulletsWrapper.addEventListener('click', this.events.click);
			}
		}
		removeEvents() {
			this.wrapper.removeEventListener('wheel', this.events.wheel);
			this.wrapper.removeEventListener('touchdown', this.events.touchdown);
			this.wrapper.removeEventListener('touchup', this.events.touchup);
			this.wrapper.removeEventListener('touchcancel', this.events.touchup);
			this.wrapper.removeEventListener('touchmove', this.events.touchmove);
			if (this.bulletsWrapper) {
				this.bulletsWrapper.removeEventListener('click', this.events.click);
			}
		}
		//===============================
		// Функция клика по буллетам
		clickBullets(e) {
			// Прессованный буллет
			const bullet = e.target.closest(`.${this.options.bulletClass}`);
			if (bullet) {
				// Массив всех буллетов
				const arrayChildren = Array.from(this.bulletsWrapper.children);

				// ID нажатого буллета
				const idClickBullet = arrayChildren.indexOf(bullet)

				// Переключение секции
				this.switchingSection(idClickBullet)
			}
		}
		//===============================
		// Установка стилей для буллетов
		setActiveBullet(idButton) {
			if (!this.bulletsWrapper) return
			// Все буллеты
			const bullets = this.bulletsWrapper.children;

			for (let index = 0; index < bullets.length; index++) {
				const bullet = bullets[index];
				if (idButton === index) bullet.classList.add(this.options.bulletActiveClass);
				else bullet.classList.remove(this.options.bulletActiveClass);
			}
		}
		setActiveMenu(idButton) {
			const items = document.querySelectorAll('.menu__item');
			if (items.length) {
				for (let index = 0; index < items.length; index++) {
					const bullet = items[index];
					if (idButton === (index + 1)) bullet.classList.add('active');
					else bullet.classList.remove('active');
				}
			}
		}
		//===============================
		// Функция нажатия тач/пера / курсора
		touchDown(e) {
			// Переменная для свайпа
			this._yP = e.changedTouches[0].pageY;
			this._eventElement = e.target.closest(`.${this.options.activeClass}`);
			if (this._eventElement) {
				// Повесьте событие touchmove и touchup
				this._eventElement.addEventListener('touchend', this.events.touchup);
				this._eventElement.addEventListener('touchcancel', this.events.touchup);
				this._eventElement.addEventListener('touchmove', this.events.touchmove);
				// Тач произошел
				this.clickOrTouch = true;

				//==============================
				if (isMobile.iOS()) {
					if (this._eventElement.scrollHeight !== this._eventElement.clientHeight) {
						if (this._eventElement.scrollTop === 0) {
							this._eventElement.scrollTop = 1;
						}
						if (this._eventElement.scrollTop === this._eventElement.scrollHeight - this._eventElement.clientHeight) {
							this._eventElement.scrollTop = this._eventElement.scrollHeight - this._eventElement.clientHeight - 1;
						}
					}
					this.allowUp = this._eventElement.scrollTop > 0;
					this.allowDown = this._eventElement.scrollTop < (this._eventElement.scrollHeight - this._eventElement.clientHeight);
					this.lastY = e.changedTouches[0].pageY;
				}
				//===============================

			}


		}
		//===============================
		// Событие движения тач/пера / курсора
		touchMove(e) {
			// Получение секции, на которой срабатывает событие
			const targetElement = e.target.closest(`.${this.options.activeClass}`);
			//===============================
			if (isMobile.iOS()) {
				let up = e.changedTouches[0].pageY > this.lastY;
				let down = !up;
				this.lastY = e.changedTouches[0].pageY;
				if (targetElement) {
					if ((up && this.allowUp) || (down && this.allowDown)) {
						e.stopPropagation();
					} else if (e.cancelable) {
						e.preventDefault();
					}
				}
			}
			//===============================
			// Проверка на завершение анимации и наличие не событийного блока
			if (!this.clickOrTouch || e.target.closest(this.options.noEventSelector)) return
			// Получение направления движения
			let yCoord = this._yP - e.changedTouches[0].pageY;
			// Разрешен ли переход?
			this.checkScroll(yCoord, targetElement);
			// Переход
			if (this.goScroll && Math.abs(yCoord) > 20) {
				this.choiceOfDirection(yCoord);
			}
		}
		//===============================
		// Событие отпускания от экрана тач/пера / курсора
		touchUp(e) {
			// Удаление событий
			this._eventElement.removeEventListener('touchend', this.events.touchup);
			this._eventElement.removeEventListener('touchcancel', this.events.touchup);
			this._eventElement.removeEventListener('touchmove', this.events.touchmove);
			return this.clickOrTouch = false;
		}
		//===============================
		// Конец срабатывания перехода
		transitionend(e) {
			//if (e.target.closest(this.options.selectorSection)) {
			this.stopEvent = false;
			document.documentElement.classList.remove(this.options.wrapperAnimatedClass);
			this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
			//}
		}
		//===============================
		// Событие прокрутки колесом мыши
		wheel(e) {
			// Проверка на наличие не событийного блока
			if (e.target.closest(this.options.noEventSelector)) return
			// Получение направления движения
			const yCoord = e.deltaY;
			// Получение секции, на которой срабатывает событие
			const targetElement = e.target.closest(`.${this.options.activeClass}`);
			// Разрешен ли переход?
			this.checkScroll(yCoord, targetElement);
			// Переход
			if (this.goScroll) this.choiceOfDirection(yCoord);
		}
		//===============================
		// Функция выбора направления
		choiceOfDirection(direction) {
			// Установка нужных id
			if (direction > 0 && this.nextSection !== false) {
				this.activeSectionId = (this.activeSectionId + 1) < this.sections.length ?
					++this.activeSectionId : this.activeSectionId;
			} else if (direction < 0 && this.previousSection !== false) {
				this.activeSectionId = (this.activeSectionId - 1) >= 0 ?
					--this.activeSectionId : this.activeSectionId;
			}
			// Смена слайдов
			this.switchingSection(this.activeSectionId, direction);
		}
		//===============================
		// Функция переключения слайдов
		switchingSection(idSection = this.activeSectionId, direction) {
			if (!direction) {
				if (idSection < this.activeSectionId) {
					direction = -100;
				} else if (idSection > this.activeSectionId) {
					direction = 100;
				}
			}

			this.activeSectionId = idSection;

			// Останавливаем работу событий
			this.stopEvent = true;
			// Если слайд крайние, то разрешаем события
			if (((this.previousSectionId === false) && direction < 0) || ((this.nextSectionId === false) && direction > 0)) {
				this.stopEvent = false;
			}

			if (this.stopEvent) {


				// Установка события окончания проигрывания анимации
				document.documentElement.classList.add(this.options.wrapperAnimatedClass);
				this.wrapper.classList.add(this.options.wrapperAnimatedClass);
				//this.wrapper.addEventListener('transitionend', this.events.transitionEnd);
				// Удаление классов
				this.removeClasses();
				// Смена классов
				this.setClasses();
				// Изменение стилей
				this.setStyle();
				// Установка стилей для буллетов
				if (this.options.bullets) this.setActiveBullet(this.activeSectionId);
				// Установка стилей для меню
				this.setActiveMenu(this.activeSectionId);

				// Устанавливаем задержку переключения
				// Добавляем классы направления движения
				let delaySection;
				if (direction < 0) {
					delaySection = this.activeSection.dataset.fpDirectionUp ? parseInt(this.activeSection.dataset.fpDirectionUp) : 500;
					document.documentElement.classList.add('fp-up');
					document.documentElement.classList.remove('fp-down');
				} else {
					delaySection = this.activeSection.dataset.fpDirectionDown ? parseInt(this.activeSection.dataset.fpDirectionDown) : 500;
					document.documentElement.classList.remove('fp-up');
					document.documentElement.classList.add('fp-down');
				}

				setTimeout(() => {
					this.events.transitionEnd();
				}, delaySection);


				// Создание события
				this.options.onSwitching(this);
				document.dispatchEvent(new CustomEvent("fpswitching", {
					detail: {
						fp: this
					}
				}));
			}
		}
		//===============================
		// Установка буллетов
		setBullets() {
			// Поиск оболочки буллетов
			this.bulletsWrapper = document.querySelector(`.${this.options.bulletsClass}`);

			// Если нет создаем
			if (!this.bulletsWrapper) {
				const bullets = document.createElement('div');
				bullets.classList.add(this.options.bulletsClass);
				this.wrapper.append(bullets);
				this.bulletsWrapper = bullets;
			}

			// Создание буллетов
			if (this.bulletsWrapper) {
				for (let index = 0; index < this.sections.length; index++) {
					const span = document.createElement('span');
					span.classList.add(this.options.bulletClass);
					this.bulletsWrapper.append(span);
				}
			}
		}
		//===============================
		// Z-INDEX
		setZIndex() {
			let zIndex = this.sections.length
			for (let index = 0; index < this.sections.length; index++) {
				const section = this.sections[index];
				section.style.zIndex = zIndex;
				--zIndex;
			}
		}
		removeZIndex() {
			for (let index = 0; index < this.sections.length; index++) {
				const section = this.sections[index];
				section.style.zIndex = ''
			}
		}
	}
	// Запускаем
	if (document.querySelector('[data-fp]')) {
		let fullpage = new FullPage(document.querySelector('[data-fp]'), '');


		// Пролистывание по ссылкам в секциях
		const linksBottom = document.querySelectorAll('.bottom-block__link');

		if (linksBottom.length) {
			linksBottom.forEach((link, index) => {
				link.addEventListener("click", function (e) {
					e.preventDefault();
					let id = (index === linksBottom.length - 1) ? 0 : index + 1;
					fullpage.switchingSection(id);
				});
			});
		}

		// Пролистывание по логотипу к 1 блоку
		const headerLogo = document.querySelector('.header__logo');

		headerLogo?.addEventListener("click", function (e) {
			e.preventDefault();
			let id = 0;
			fullpage.switchingSection(id);
		});



		// Пролистывание по ссылкам меню
		const menuLinks = document.querySelectorAll('.menu__link');

		if (menuLinks.length) {
			menuLinks.forEach((menuLink, index) => {
				menuLink.addEventListener("click", function (e) {
					e.preventDefault();
					document.querySelector('html').classList.contains("menu-open") ? menuClose() : null;
					let id = index + 1;
					fullpage.switchingSection(id);
				});
			});
		}





	}

	//Слайдеры
	function initSliders() {
		if (document.querySelector('.reviews-about__slider')) {
			new Swiper('.reviews-about__slider', {
				observer: true,
				observeParents: true,
				slidesPerView: 1,
				spaceBetween: 10,
				autoHeight: true,
				centeredSlides: false,
				speed: 500,

				// Пагинация
				pagination: {
					el: '.swiper-pagination',
					clickable: true,
				},


				// Брейкпоинты
				/*
				breakpoints: {
					320: {
						slidesPerView: 1,
						spaceBetween: 0,
						autoHeight: true,
					},
					768: {
						slidesPerView: 2,
						spaceBetween: 20,
					},
					992: {
						slidesPerView: 3,
						spaceBetween: 20,
					},
					1268: {
						slidesPerView: 4,
						spaceBetween: 30,
					},
				},
				*/
			});
		}
	}

	window.addEventListener("load", function (e) {
		// Запуск инициализации слайдеров
		initSliders();
	});


	// Вспомогательные модули плавного расскрытия и закрытия объекта ======================================================================================================================================================================
	let _slideUp = (target, duration = 500, showmore = 0) => {
		if (!target.classList.contains('_slide')) {
			target.classList.add('_slide');
			target.style.transitionProperty = 'height, margin, padding';
			target.style.transitionDuration = duration + 'ms';
			target.style.height = `${target.offsetHeight}px`;
			target.offsetHeight;
			target.style.overflow = 'hidden';
			target.style.height = showmore ? `${showmore}px` : `0px`;
			target.style.paddingTop = 0;
			target.style.paddingBottom = 0;
			target.style.marginTop = 0;
			target.style.marginBottom = 0;
			window.setTimeout(() => {
				target.hidden = !showmore ? true : false;
				!showmore ? target.style.removeProperty('height') : null;
				target.style.removeProperty('padding-top');
				target.style.removeProperty('padding-bottom');
				target.style.removeProperty('margin-top');
				target.style.removeProperty('margin-bottom');
				!showmore ? target.style.removeProperty('overflow') : null;
				target.style.removeProperty('transition-duration');
				target.style.removeProperty('transition-property');
				target.classList.remove('_slide');
				// Создаем событие 
				document.dispatchEvent(new CustomEvent("slideUpDone", {
					detail: {
						target: target
					}
				}));
			}, duration);
		}
	}
	let _slideDown = (target, duration = 500, showmore = 0) => {
		if (!target.classList.contains('_slide')) {
			target.classList.add('_slide');
			target.hidden = target.hidden ? false : null;
			showmore ? target.style.removeProperty('height') : null;
			let height = target.offsetHeight;
			target.style.overflow = 'hidden';
			target.style.height = showmore ? `${showmore}px` : `0px`;
			target.style.paddingTop = 0;
			target.style.paddingBottom = 0;
			target.style.marginTop = 0;
			target.style.marginBottom = 0;
			target.offsetHeight;
			target.style.transitionProperty = "height, margin, padding";
			target.style.transitionDuration = duration + 'ms';
			target.style.height = height + 'px';
			target.style.removeProperty('padding-top');
			target.style.removeProperty('padding-bottom');
			target.style.removeProperty('margin-top');
			target.style.removeProperty('margin-bottom');
			window.setTimeout(() => {
				target.style.removeProperty('height');
				target.style.removeProperty('overflow');
				target.style.removeProperty('transition-duration');
				target.style.removeProperty('transition-property');
				target.classList.remove('_slide');
				// Создаем событие 
				document.dispatchEvent(new CustomEvent("slideDownDone", {
					detail: {
						target: target
					}
				}));
			}, duration);
		}
	}
	let _slideToggle = (target, duration = 500) => {
		if (target.hidden) {
			return _slideDown(target, duration);
		} else {
			return _slideUp(target, duration);
		}
	}

	// Обработа медиа запросов из атрибутов 
	function dataMediaQueries(array, dataSetValue) {
		// Получение объектов с медиа запросами
		const media = Array.from(array).filter(function (item, index, self) {
			if (item.dataset[dataSetValue]) {
				return item.dataset[dataSetValue].split(",")[0];
			}
		});
		// Инициализация объектов с медиа запросами
		if (media.length) {
			const breakpointsArray = [];
			media.forEach(item => {
				const params = item.dataset[dataSetValue];
				const breakpoint = {};
				const paramsArray = params.split(",");
				breakpoint.value = paramsArray[0];
				breakpoint.type = paramsArray[1] ? paramsArray[1].trim() : "max";
				breakpoint.item = item;
				breakpointsArray.push(breakpoint);
			});
			// Получаем уникальные брейкпоинты
			let mdQueries = breakpointsArray.map(function (item) {
				return '(' + item.type + "-width: " + item.value + "px)," + item.value + ',' + item.type;
			});
			mdQueries = uniqArray(mdQueries);
			const mdQueriesArray = [];

			if (mdQueries.length) {
				// Работаем с каждым брейкпоинтом
				mdQueries.forEach(breakpoint => {
					const paramsArray = breakpoint.split(",");
					const mediaBreakpoint = paramsArray[1];
					const mediaType = paramsArray[2];
					const matchMedia = window.matchMedia(paramsArray[0]);
					// Объекты с нужными условиями
					const itemsArray = breakpointsArray.filter(function (item) {
						if (item.value === mediaBreakpoint && item.type === mediaType) {
							return true;
						}
					});
					mdQueriesArray.push({
						itemsArray,
						matchMedia
					})
				});
				return mdQueriesArray;
			}
		}
	}

	// Уникализация массива
	function uniqArray(array) {
		return array.filter(function (item, index, self) {
			return self.indexOf(item) === index;
		});
	}


	const spollersArray = document.querySelectorAll('[data-spollers]');
	if (spollersArray.length > 0) {
		// Получение обычных слойлеров
		const spollersRegular = Array.from(spollersArray).filter(function (item, index, self) {
			return !item.dataset.spollers.split(",")[0];
		});
		// Инициализация обычных слойлеров
		if (spollersRegular.length) {
			initSpollers(spollersRegular);
		}
		// Получение слойлеров с медиа запросами
		let mdQueriesArray = dataMediaQueries(spollersArray, "spollers");
		if (mdQueriesArray && mdQueriesArray.length) {
			mdQueriesArray.forEach(mdQueriesItem => {
				// Событие
				mdQueriesItem.matchMedia.addEventListener("change", function () {
					initSpollers(mdQueriesItem.itemsArray, mdQueriesItem.matchMedia);
				});
				initSpollers(mdQueriesItem.itemsArray, mdQueriesItem.matchMedia);
			});
		}
		// Инициализация
		function initSpollers(spollersArray, matchMedia = false) {
			spollersArray.forEach(spollersBlock => {
				spollersBlock = matchMedia ? spollersBlock.item : spollersBlock;
				if (matchMedia.matches || !matchMedia) {
					spollersBlock.classList.add('_spoller-init');
					initSpollerBody(spollersBlock);
					spollersBlock.addEventListener("click", setSpollerAction);
				} else {
					spollersBlock.classList.remove('_spoller-init');
					initSpollerBody(spollersBlock, false);
					spollersBlock.removeEventListener("click", setSpollerAction);
				}
			});
		}
		// Работа с контентом
		function initSpollerBody(spollersBlock, hideSpollerBody = true) {
			let spollerTitles = spollersBlock.querySelectorAll('[data-spoller]');
			if (spollerTitles.length) {
				spollerTitles = Array.from(spollerTitles).filter(item => item.closest('[data-spollers]') === spollersBlock);
				spollerTitles.forEach(spollerTitle => {
					if (hideSpollerBody) {
						spollerTitle.removeAttribute('tabindex');
						if (!spollerTitle.classList.contains('_spoller-active')) {
							spollerTitle.nextElementSibling.hidden = true;
						}
					} else {
						spollerTitle.setAttribute('tabindex', '-1');
						spollerTitle.nextElementSibling.hidden = false;
					}
				});
			}
		}
		function setSpollerAction(e) {
			const el = e.target;
			if (el.closest('[data-spoller]')) {
				const spollerTitle = el.closest('[data-spoller]');
				const spollersBlock = spollerTitle.closest('[data-spollers]');
				const oneSpoller = spollersBlock.hasAttribute('data-one-spoller');
				const spollerSpeed = spollersBlock.dataset.spollersSpeed ? parseInt(spollersBlock.dataset.spollersSpeed) : 500;
				if (!spollersBlock.querySelectorAll('._slide').length) {
					if (oneSpoller && !spollerTitle.classList.contains('_spoller-active')) {
						hideSpollersBody(spollersBlock);
					}
					spollerTitle.classList.toggle('_spoller-active');
					_slideToggle(spollerTitle.nextElementSibling, spollerSpeed);
				}
				e.preventDefault();
			}
		}
		function hideSpollersBody(spollersBlock) {
			const spollerActiveTitle = spollersBlock.querySelector('[data-spoller]._spoller-active');
			const spollerSpeed = spollersBlock.dataset.spollersSpeed ? parseInt(spollersBlock.dataset.spollersSpeed) : 500;
			if (spollerActiveTitle && !spollersBlock.querySelectorAll('._slide').length) {
				spollerActiveTitle.classList.remove('_spoller-active');
				_slideUp(spollerActiveTitle.nextElementSibling, spollerSpeed);
			}
		}
		// Закрытие при клике вне спойлера
		const spollersClose = document.querySelectorAll('[data-spoller-close]');
		if (spollersClose.length) {
			document.addEventListener("click", function (e) {
				const el = e.target;
				if (!el.closest('[data-spollers]')) {
					spollersClose.forEach(spollerClose => {
						const spollersBlock = spollerClose.closest('[data-spollers]');
						const spollerSpeed = spollersBlock.dataset.spollersSpeed ? parseInt(spollersBlock.dataset.spollersSpeed) : 500;
						spollerClose.classList.remove('_spoller-active');
						_slideUp(spollerClose.nextElementSibling, spollerSpeed);
					});
				}
			});
		}
	}



});




/**!
 * @file lite.js
 * @description A lightweight utility library for seamless DOM manipulation and UI animations.
 * @version 1.0.0
 * @author Akintola Jephthah
 * @license MIT
 */

/**
 * The core Lite.js engine.
 * @namespace lite
 */

/* Welcome to lite.js v.1.0, this is a utility library to ease Dom manipulations in web developments*/
/* Author:  Akintola Jephthah */
/* All variables name written in this library are written on purpose so bug off*/
if (typeof window !== "undefined") {
	console.log("%c **Lite.js is actively working* V.1.0", "background: green; color: #fff; padding: 5px; border: 1px solid #fff; border-radius: 20px; box-shadow: 0 0 30px #0f0;");
}
else {
	console.warn("%c **Lite.js needs a window with a document to run** V.1.0", "background: red; color: #fff; padding: 5px; border: 1px solid #fff;");
	lite = null;
}
const lite = (() => {
	"use strict";
	
	function _light_engine(elements) {
		return {
			element: elements,
			design(props, value) {
				if (!props) throw new Error("The first argument is required");
				if (!value) throw new Error("The second argument is required");
				elements.style[props] = value;
			},
			putClass(className) {
				if (!className) throw new Error("the putClass argument cannot contain a whitespace, please fix")
				elements.classList.add(className);
				return this;
			},
			removeClass(removeClassName) {
				elements.classList.remove(removeClassName);
				return this;
			},
			switchClass(toggleClassName) {
				if (!toggleClassName) throw new Error("Please provide a valid className");
			elements.classList.toggle(toggleClassName);
			return this;
			},
			contains(className){
				return elements.classList.contains(className)
			},
			text(returns_the_textContent) {
				return elements.textContent;
				return this;
			},
			write(writeText) {
				elements.textContent = writeText;
				return this;
			},
			html(HTMLContents) {
				elements.innerHTML = HTMLContents;
				return this;
			},
			append(appendChildElement) {
				elements.appendChild(appendChildElement.element);
			},
			cut(cutSelfElements) {
				return elements.remove(cutSelfElements)
			},
			cutChild(cutSelfChildElement) {
				return elements.removeChild(cutSelfChildElement.element)
			},
			setAttr(attributeName, attributeValue) {
				if (!attributeName || !attributeValue) throw new Error("Argument is missing at setAttr")
				elements.setAttribute(attributeName, attributeValue);
				return this;
			},
			getAttr(attributeName) {
				return elements.getAttribute(attributeName);
				/* we won't use **return** this here to prevent errors*/
			},
			on(event, callback) {
				elements.addEventListener(event, callback);
				return this;
			},
			
			/* This are lite animations*/
			bounce() {
				elements.classList.add("bounce");
				navigator.vibrate(500);
				setTimeout(() => {
					elements.classList.remove("bounce")
				}, 600)
			},
			shake() {
				elements.classList.add("shake");
				navigator.vibrate(500);
				setTimeout(() => {
					elements.classList.remove("shake")
				}, 600)
			},
			glaze() {
				elements.classList.add("glaze");
				setTimeout(() => {
					elements.classList.remove("glaze")
				}, 600)
			},
			highlight() {
				elements.classList.add("highlight");
				setTimeout(() => {
					elements.classList.remove("highlight")
				}, 600)
			},
			pulsate() {
				elements.classList.add("pulsate");
				setTimeout(() => {
					elements.classList.remove("pulsate")
				}, 600)
			},
			fadeOut() {
				elements.style.opacity = 0;
				elements.style.transition = "all 1s"
			},
			fadeIn() {
				elements.style.opacity = 1;
				elements.style.transition = "all 1s"
			},
			show() {
				elements.style.display = "block";
			},
			hide() {
				return elements.style.display = "none"
			},
			fold() {
				localStorage.setItem("height", elements.getBoundingClientRect().height)
				elements.style.overflow = "hidden";
				elements.style.height = 0;
				elements.style.transition = "height 1s";
			},
			unfold() {
				elements.style.overflow = "visible";
				elements.style.height = localStorage.getItem("height") + "px";
				elements.style.transition = "height 1s";
			}
		}
	}
	/* Our utility functions to work with*/
	return {
		create(createElements) {
			let el = document.createElement(createElements);
			if (!el) throw new Error("Please provide a valid HTML node type");
			return _light_engine(el);
		},
		pick(element) {
			let el = document.querySelector(element);
			return _light_engine(el)
		},
		pickAll(elements) {
			let els = [...document.querySelectorAll(elements)];
			if (els) {
				return {
					pos(index) {
						let indexElement = els[index];
						return _light_engine(indexElement)
					},
					loop(callback) {
						els.forEach(function(element, index) {
							return callback(_light_engine(element), index);
						})
					}
				}
			}
		}
	}
})();

/*
Let's shorten our methods
*/
window.$ = lite.pick;
window.$$ = lite.pickAll;
window.$$$ = lite.create;
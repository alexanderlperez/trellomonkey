// ==UserScript==
// @name         Show/Hide columns
// @namespace    http://devbrainhack.co/
// @description  Show/Hide cards in columns for Trello
// @author       Alex Perez  
// @match        https://trello.com/*
// ==/UserScript==
/* jshint -W097 */
'use strict';

// run when the site is loaded and after each board change
window.onload = appendShowHide;
document.addEventListener('click', function (e) {
    if (e.target.className.indexOf('text-name') > -1) {
        setTimeout(appendShowHide, 500); // todo: look for Trello internal event
    }
});

function appendShowHide() {
    var columns = document.querySelectorAll('.list-header');

    forEach(columns, function (i, col) {     
        var icon = document.createElement('span');
        icon.className = 'icon-sm icon-remove dark-hover';
        icon.addEventListener('click', handleShowHide);

        col.appendChild(icon);
    });
}

function handleShowHide(evt) {
    var hidings = getSiblings(evt.target.parentNode, function (elem) {
        return elem.className.indexOf('list-cards') > -1 || elem.className.indexOf('open-card-composer') > -1;
    });

    forEach(hidings, function (i, elem) {
        if (elem.style.display !== 'none') {
            elem.style.display = 'none';
        } else {
            elem.style.display = '';
        }
    });
}

// from http://toddmotto.com/ditch-the-array-foreach-call-nodelist-hack/
var forEach = function (array, callback, scope) {
    for (var i = 0; i < array.length; i++) {
        callback.call(scope, i, array[i]); 
    }
};

// from plainjs.com
function getSiblings(el, filter) {
    var siblings = [];
    el = el.parentNode.firstChild;
    do { if (!filter || filter(el)) siblings.push(el); } while (el = el.nextSibling);
    return siblings;
}



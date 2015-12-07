// ==UserScript==
// @name         Show/Hide columns
// @namespace    http://devbrainhack.co/
// @description  Show/Hide cards in columns for Trello
// @author       Alex Perez  
// @match        https://trello.com/*
// ==/UserScript==
/* jshint -W097 */
'use strict';

// TODO: cached queries, more MVC, more granular functions

var State = {
    state: {},
    saveState: function (board, lists) {
        var board = lists[0].getAttribute('data-board');
        this.state[board] = {};

        forEach(lists, function (i, elList) {
            var list = elList.getAttribute('data-list');
            var isHidden = elList.getAttribute('data-ishidden');

            this.state[board][list] = {
                isHidden: isHidden,
            };
        });

        localStorage.setItem('savedata', JSON.stringify(this.state));
    },
    getState: function (board) {
        this.state = localStorage.getItem('savedata');
        return this.state;
    },
}

// run when the site is loaded and after each board change
window.CHECKINTERVAL = setInterval(doIfListsExist, 500);
document.addEventListener('click', function (e) {
    if (e.target.className.indexOf('tile-link') > -1) {
        window.CHECKINTERVAL = setInterval(doIfListsExist, 500);
    }
});


function doIfListsExist() {
    var lists = document.querySelectorAll('.list');
    if (lists.length > 0) {
        clearInterval(window.CHECKINTERVAL);           
        cleanupShowHide();
        appendShowHide();
        // applyMetaData();
        // applySavedState();
    }
}


function appendShowHide() {
    var columns = document.querySelectorAll('.list-header');

    forEach(columns, function (i, col) {     
        var icon = document.createElement('span');
        icon.className = 'show-hide icon-sm icon-remove dark-hover';
        icon.addEventListener('click', handleShowHide);
        col.appendChild(icon);
    });
}

function cleanupShowHide() {
    var icons = document.querySelectorAll('.show-hide');

    forEach(icons, function (i, elem) {
        try {
            elem.parentNode.removeChild(elem);
        } catch (e) {
            console.log(e, elem);
        }
    });
}

function handleShowHide(evt) {
    var hidings = getSiblings(evt.target.parentNode, function (elem) {
        return elem.classList.contains('list-cards') || elem.classList.contains('open-card-composer');
    });

    forEach(hidings, function (i, elem) {
        toggleShowHide(elem);
    });

    applyMetaData();
    saveState();
}

function toggleShowHide(elem) {
        if (!elem.classList.contains('hide')) {
            elem.classList.add('hide');
        } else {
            elem.classList.remove('hide');
        }
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

function applyMetaData() {
    var lists = document.querySelectorAll('.list');

    // naive, recalcs metadata to all lists
    forEach(lists, function (i, elList) {
        var list = elList.querySelector('.list-header-name').textContent;
        var board = window.location.href.split('/').filter(function (s, i, a) { return i == a.length-1; });
        var isHidden = elList.querySelector('.list-cards').classList.contains('hide');

        elList.setAttribute('data-list', list);
        elList.setAttribute('data-board', board);
        elList.setAttribute('data-ishidden', isHidden);
    });
}

function saveState() {
    var lists = document.querySelectorAll('.list');
    var saveData = JSON.parse(localStorage.getItem('savedata'));

    var board = lists[0].getAttribute('data-board');
    saveData[board] = {};

    forEach(lists, function (i, elList) {
        var list = elList.getAttribute('data-list');
        var isHidden = elList.getAttribute('data-ishidden');

        saveData[board][list] = {
            isHidden: isHidden,
        };
    });

    localStorage.setItem('savedata', JSON.stringify(saveData));

    console.log('showing object saveData in saveState', saveData);
}

function applySavedState() {
    var lists = document.querySelectorAll('.list');

    var saveData = JSON.parse(localStorage.getItem('savedata'));
    // console.log('saveData', saveData);

    if (!saveData) {
        saveState();
        saveData = JSON.parse(localStorage.getItem('savedata'));
    }

    // console.log('showing localstorage in applySavedState:', saveData);
    // console.log(lists);

    forEach(lists, function (i, elList) {
        console.log('looping');
        try {
            var board = elList.getAttribute('data-board');
            var list = elList.getAttribute('data-list');
            console.log(elList, board, list);
            var isHidden = saveData[board][list].isHidden;
        } catch (e) {
            console.log(e, board, list, isHidden);
        }

        elList.setAttribute('data-ishidden', isHidden);

        if (isHidden) {
            var hidings = getSiblings(elList.querySelector('.show-hide').parentNode, function (elem) {
                console.log('showing elem', elem);
                return elem.classList.contains('list-cards') || elem.classList.contains('open-card-composer');
            });

            forEach(hidings, function (i, elem) {
                console.log('hiding', elem);
                elem.classList.add('hide');
            });

            applyMetaData();
            saveState();
        }
    });
}

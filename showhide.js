// ==UserScript==
// @name         Show/Hide columns
// @namespace    http://devbrainhack.co/
// @description  Show/Hide cards in columns for Trello
// @author       Alex Perez  
// @match        https://trello.com/*
// ==/UserScript==
'use strict';

// TODO: cached queries, more MVC, more granular functions

var State = {
    state: {},

    saveBoard: function (board, lists) {
        this.state[board] = {};

        forEach(lists, function (i, elList) {
            var list = elList.getAttribute('data-list');
            var isHidden = elList.getAttribute('data-ishidden');

            this.state[board][list] = {
                isHidden: isHidden,
            };
        });
    },

    syncFromLocalStorage: function () {
        this.state = localStorage.getItem('saveData');
    },

    syncToLocalStorage: function () {
        localStorage.setItem('saveData', JSON.stringify(this.state));
    },
};

var VM = {
    lists: function () {
        return document.querySelectorAll('.list');
    },

    buildListMetadata: function (list) {
        var listName = list.querySelector('.list-header-name').textContent;
        var board = window.location.href.split('/').filter(function (s, i, a) { return i == a.length-1; });
        var isHidden = list.querySelector('.list-cards').classList.contains('hide');

        list.setAttribute('data-list', list);
        list.setAttribute('data-board', board);
        list.setAttribute('data-ishidden', isHidden);
    },

    getListMetadata: function (list) {
        return {
            list: list.getAttribute('data-list'),
            board: list.getAttribute('data-board'),
            isHidden: list.getAttribute('data-ishidden'),
        };
    },

    applyListState: function (list, state) {
        // get state of board
        var data = this.getListMetadata(list);
        var listState = state[data.board][data.list];

        // hide list if isHidden
        if (data.isHidden) {
            this.hideList(list);
        }
    },

    hideList: function (list) {
        list.querySelector('.list-cards').classList.add('hide');
        list.querySelector('.open-card-composer').classList.add('hide');
    }, 

    appendListShowHide: function (list) {
        var icon = document.createElement('span');
        icon.className = 'show-hide icon-sm icon-remove dark-hover';

        icon.addEventListener('click', function () {
            this.hideList(list);
        });

        list.querySelector('.list-header').appendChild(icon);
    },
};

/** Main Entry Point**/

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
    }
}

/* ----- */


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
}

function toggleShowHide(elem) {
    if (!elem.classList.contains('hide')) {
        elem.classList.add('hide');
    } else {
        elem.classList.remove('hide');
    }
}


// from http://toddmotto.com/ditch-the-array-foreach-call-nodelist-hack/
function forEach(array, callback, scope) {
    for (var i = 0; i < array.length; i++) {
        callback.call(scope, i, array[i]); 
    }
}

function map(array, callback, scope) {
    var arr = [];

    for (var i = 0; i < array.length; i++) {
        arr.push(callback.call(scope, i, array[i])); 
    }

    return arr;
}

// from plainjs.com
function getSiblings(el, filter) {
    var siblings = [];
    el = el.parentNode.firstChild;
    do { if (!filter || filter(el)) siblings.push(el); } while (el = el.nextSibling);
    return siblings;
}


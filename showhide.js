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
                ishidden: isHidden,
            };
        }.bind(this));
    },

    syncFromLocalStorage: function () {
        this.state = JSON.parse(localStorage.getItem('savedata'));
    },

    syncToLocalStorage: function () {
        localStorage.setItem('savedata', JSON.stringify(this.state));
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

        list.setAttribute('data-list', listName);
        list.setAttribute('data-board', board);
        list.setAttribute('data-ishidden', isHidden);

        return this.getListMetadata(list);
    },

    getListMetadata: function (list) {
        return {
            list: list.getAttribute('data-list'),
            board: list.getAttribute('data-board'),
            isHidden: list.getAttribute('data-ishidden'),
        };
    },

    cleanListMetadata: function (list) {
        list.removeAttribute('data-list');
        list.removeAttribute('data-board');
        list.removeAttribute('data-ishidden');
    },

    hideList: function (list) {
        list.querySelector('.list-cards').classList.add('hide');
        list.querySelector('.open-card-composer').classList.add('hide');
    }, 

    showList: function (list) {
        list.querySelector('.list-cards').classList.remove('hide');
        list.querySelector('.open-card-composer').classList.remove('hide');
    },

    appendListShowHide: function (list) {
        var icon = document.createElement('span');
        icon.className = 'show-hide icon-sm icon-remove dark-hover';

        icon.addEventListener('click', function () {
            this.hideList(list);
        });

        list.querySelector('.list-header').appendChild(icon);
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
        testStateModel();
        testVM();
        // digest();
    }
}

function digest() {
    cleanupShowHide();
    // appendShowHide();

    forEach(VM.lists, function (i, list) {
        appendListShowHide(list);
    })
}
/* ----- */

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



/* --- Tests --- */
 
function testStateModel() {
    console.group('Testing - State Model')

    assert("saveBoard", function () {
        var board = window.location.href.split('/').filter(function (s, i, a) { return i == a.length-1; })[0];
        var lists = document.querySelectorAll('.list');

        forEach(lists, function (i, list) {
            VM.buildListMetadata(list);
        });

        State.saveBoard(board, lists);
        var boardState = State.state[board];

        if (!boardState) 
            return assert('', false, "State object missing");

        if (Object.keys(boardState).length == 0) 
            return assert('', false, "Too few keys");

        if (Object.keys(boardState).length !== lists.length) 
            return assert('', false, "Number of entries don't match");

        // none of the lists should be ishidden
        for (var e in boardState) { if (boardState.hasOwnProperty(e)) {
                if (boardState[e].ishidden == undefined) 
                    return assert('', false, "ishidden field undefined");
                if (boardState[e].ishidden == true)
                    return assert('', false, "ishidden mysteriously true");
        } }

        // clean up metadata
        forEach(lists, function (i, list) {
            VM.cleanListMetadata(list);
        });

        // clean up state
        State.state = {};
        
        return true;
    }, "saveBoard isn't saving the board data correctly");

    assert("syncToLocalStorage", function () {
        var board = window.location.href.split('/').filter(function (s, i, a) { return i == a.length-1; })[0];
        var lists = document.querySelectorAll('.list');

        forEach(lists, function (i, list) {
            VM.buildListMetadata(list);
        });

        State.saveBoard(board, lists);
        State.syncToLocalStorage();

        var lsState = localStorage.getItem('savedata');
        var state = JSON.stringify(State.state);

        if (lsState !== state)
            return assert('', false, "localstorage and State.state aren't the same"); 

        // clean up metadata
        forEach(lists, function (i, list) {
            VM.cleanListMetadata(list);
        });

        // clean up state
        State.state = {};

        return true;
    }, "syncToLocalStorage not working")

    assert("syncFromLocalStorage", function () {
        var board = window.location.href.split('/').filter(function (s, i, a) { return i == a.length-1; })[0];
        var lists = document.querySelectorAll('.list');

        forEach(lists, function (i, list) {
            VM.buildListMetadata(list);
        });

        State.saveBoard(board, lists);
        State.syncToLocalStorage();

        var state = JSON.stringify(State.state);

        State.syncFromLocalStorage();

        var lsState = JSON.stringify(State.state);

        if (lsState !== state)
            return assert('', false, "States aren't the save before and after"); 

        // clean up metadata
        forEach(lists, function (i, list) {
            VM.cleanListMetadata(list);
        });

        // clean up state
        State.state = {};

        return true;

    }, "syncFromLocalStorage isn't retrieving correctly")
    
    console.groupEnd();
}

function testVM() {
    console.group('Testing - VM');

    assert("VM.lists", VM.lists(), 'VM.lists is undefined') 

    var res;
    assert("buildListMetadata", function () {
        res = map(VM.lists(), function (i, list) {
            return VM.buildListMetadata(list);
        });

        for (var i = 0; i < res.length; i++) {
            for (var p in res[i]){
                if (res[i][p] == null) {
                    return false;
                }
            }
        }

        return true;
    }, 
    "buildListMetadata isn't building metadata correctly") 

    var res;
    assert("getListMetadata", function () {
        res = map(VM.lists(), function (i, list) {
            return VM.buildListMetadata(list);
        });
        
        for (var i = 0; i < res.length; i++) {
            if (!res[i].list) return false;
            if (!res[i].board) return false;
            if (res[i].isHidden == null || res[i].isHidden == undefined) 
                return false;
        }

        return true;
    }, "getListMetadata isn't creating metadata object properly")

    assert("hideList", function () {
        var list = VM.lists()[0];
        VM.hideList(list);

        return list.querySelector('.list-cards').classList.contains('hide')
            && list.querySelector('.open-card-composer').classList.contains('hide');
    }, "hideList isn't hiding lists correctly")

    assert("appendListShowHide", function () {
        var list = VM.lists()[0];

        VM.appendListShowHide(list);

        return list.querySelector('.show-hide');
    }, "appendListShowHide isn't creating the icons correctly")

    assert("applyListState", function () {
        var curBoard = window.location.href.split('/').filter(function (s, i, a) { return i == a.length-1; });
        var list = VM.lists()[0];
        var listName = list.querySelector('.list-header-name').textContent;
        var state = {};
        state[curBoard] = {};
        state[curBoard][listName] = {
            ishidden: true
        };

        VM.showList(list);
        
        VM.applyListState(list, state);

        return list.querySelector('.list-cards').classList.contains('hide')
            && list.querySelector('.open-card-composer').classList.contains('hide');
    }, "applyListState isn't working correctly")

    console.groupEnd();
}


function assert(message, assertion, error) {
    var res = undefined;

    if (typeof assertion === 'function') {
        try {
            res = assertion();
        } catch (e) {
            throw new Error('Test failed:\n' + e)
        }
    } else {
        res = assertion;
    }
    
    if (res) {
        console.log('%s %c✓', message, 'color: green;');
        return true;
    }

    throw new Error(error);
}

function xassert(msg) {
    console.log("%c%s", "color: lightgray;", msg);
}

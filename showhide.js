// ==UserScript==
// @name         Show/Hide columns
// @namespace    http://devbrainhack.co/
// @description  Show/Hide cards in columns for Trello
// @author       Alex Perez  
// @match        https://trello.com/*
// @grant unsafeWindow
// ==/UserScript==
'use strict';


var State = {
    state: {},

    saveListState: function (list) {
        var listName = list.getAttribute('data-list');
        var isHidden = list.getAttribute('data-ishidden') == "true";
        var board = list.getAttribute('data-board');
        var state = this.state;

        state[board][listName] = {
            ishidden: isHidden,
        };
    },

    saveBoard: function (board, lists) {
        var state = this.state;

        forEach(lists, function (i, elList) {
            var list = elList.getAttribute('data-list');
            var isHidden = elList.getAttribute('data-ishidden') == "true";

            state[board][list] = {
                ishidden: isHidden,
            };
        });
    },

    syncFromLocalStorage: function () {
        var state = JSON.parse(localStorage.getItem('savedata'));

        if (!state) {
            state = {};
        }

        this.state = state;

        // change this to this.state 
        return localStorage.getItem('savedata');
    },

    syncToLocalStorage: function () {
        localStorage.setItem('savedata', JSON.stringify(this.state));

        // change this to this.state 
        return localStorage.getItem('savedata');
    },
};

var VM = {
    lists: function () {
        return document.querySelectorAll('.list');
    },

    currentBoard: function () {
        return window.location.href.split('/').filter(function (s, i, a) { return i == a.length-1; })[0];
    },

    buildListMetadata: function (list) {
        var board = this.currentBoard();
        var listName = list.querySelector('.list-header-name').textContent;
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
            ishidden: list.getAttribute('data-ishidden') == 'true',
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

    toggleList: function (list) {
        if (list.querySelector('.list-cards').classList.contains('hide')
            || list.querySelector('.open-card-composer').classList.contains('hide')) {
                this.showList(list);
            } else {
                this.hideList(list);
            }
    },

    appendListShowHideAndHandler: function (list, callback) {
        var icon = document.createElement('span');
        icon.className = 'show-hide icon-sm icon-remove dark-hover';
        icon.addEventListener('click', callback);

        list.querySelector('.list-header').appendChild(icon);
    },

    removeListShowHide: function (list) {
        var icon = list.querySelector('.show-hide');
        try {
            icon.remove();
        } catch (e) { /* optimal solution, no need to complicate */}
    },

    applyListState: function (list, state) {
        // hide list if isHidden
        if (state) {
            this.hideList(list);
        } else {
            this.showList(list);
        }
    },
};


/** Main Entry Point**/


// run when the site is loaded, after each board change
window.CHECKINTERVAL = setInterval(doIfListsExist, 500);

// check for clicks on generated menu items (may not exist yet)
document.addEventListener('click', function (e) {
    if (e.target.className.indexOf('tile-link') > -1) {

        console.log('moving to', e.target.textContent, State.state);

        State.saveBoard(VM.lists()[0].getAttribute('data-board'), VM.lists());

        console.log('syncTo:', State.syncToLocalStorage());

        window.CHECKINTERVAL = setInterval(doIfListsExist, 500);
    }
});

// have this match the beginning of the click handler
// window.unload = function () {
    // State.saveBoard(VM.lists()[0].getAttribute('data-board'), VM.lists());
    // State.syncToLocalStorage();
// }

function doIfListsExist() {
    var lists = document.querySelectorAll('.list');
    if (lists.length > 0) {
        clearInterval(window.CHECKINTERVAL);           

        if (window.DEBUG) {
            testStateModel();
            testVM();
            testSavingLoading();
            return;
        }

        // get saved state
        console.log('syncFrom:', State.syncFromLocalStorage(), State.state);

        // create an entry for this board if one doesn't exist

        console.log(State.State, State.state[VM.currentBoard()]);
        if (!State.state[VM.currentBoard()]) {
            console.log('creating new board entry');
            State.state[VM.currentBoard()] = {};
            console.log('State.state[VM.currentBoard()]', State.state[VM.currentBoard()]);
        }


        console.log('------- Syncing with %s -------', VM.currentBoard());
        console.log('Synced, current state:', State.state);


        // Lists: apply state, create the icons and events
        forEach(VM.lists(), function (i, list) {
            var listData = VM.buildListMetadata(list);

            if (!State.state[VM.currentBoard()][listData.list]) {
                State.state[VM.currentBoard()][listData.list] = {};
            }

            if (State.state[VM.currentBoard()][listData.list].ishidden == undefined) {
                State.state[VM.currentBoard()][listData.list].ishidden = false;
            }

            VM.applyListState(list, State.state[VM.currentBoard()][listData.list].ishidden);
 
            // prevent duplicate icons if reloading same board
            VM.removeListShowHide(list);

            // create the icons and set the click handler
            VM.appendListShowHideAndHandler(list, function () {
                VM.toggleList(list);
                var listData = VM.buildListMetadata(list);
                State.saveListState(list);
                console.log(State.state[VM.currentBoard()], State.state[VM.currentBoard()][listData.list]);
            });
        });
    }
}


/* -- Helpers -- */


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

    assert("saveListState", function () {
        var list = document.querySelector('.list');

        // hide a list 
        list.querySelector('.list-cards').classList.add('hide');
        list.querySelector('.open-card-composer').classList.add('hide');

        // build the list metadata
        var listName = list.querySelector('.list-header-name').textContent;
        var board = window.location.href.split('/').filter(function (s, i, a) { return i == a.length-1; });
        var isHidden = list.querySelector('.list-cards').classList.contains('hide');

        list.setAttribute('data-list', listName);
        list.setAttribute('data-board', board);
        list.setAttribute('data-ishidden', isHidden);

        // test our method with the list we set up
        State.saveListState(list);

        // check that the list state is saved in the State model correctly
        if (!State.state[board][listName].ishidden)
            return assert('', false, "ishidden isn't being set");

        // clean up 
        State.state = {};

        list.removeAttribute('data-list');
        list.removeAttribute('data-board');
        list.removeAttribute('data-ishidden');

        list.querySelector('.list-cards').classList.remove('hide');
        list.querySelector('.open-card-composer').classList.remove('hide');

        return true;

    }, "list isn't being saved correctly");

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
            if (res[i].ishidden == null || res[i].ishidden == undefined) 
                return false;
        }

        return true;

    }, "getListMetadata isn't creating metadata object properly")

    assert("hideList", function () {
        var list = VM.lists()[0];
        VM.hideList(list);

        if (!list.querySelector('.list-cards').classList.contains('hide')
            || !list.querySelector('.open-card-composer').classList.contains('hide'))
        return assert('', false, ".hide class not applied correctly");

        // cleanup - show the list again
        list.querySelector('.list-cards').classList.remove('hide');
        list.querySelector('.open-card-composer').classList.remove('hide');

        return true;

    }, "hideList isn't hiding lists correctly")

    assert("toggleList", function () {
        var list = VM.lists()[0];

        // make sure it's visible
        list.querySelector('.list-cards').classList.remove('hide');
        list.querySelector('.open-card-composer').classList.remove('hide');

        VM.toggleList(list);

        if (!list.querySelector('.list-cards').classList.contains('hide')
            || !list.querySelector('.open-card-composer').classList.contains('hide'))
        return assert('', false, ".hide class not applied correctly");

        VM.toggleList(list);

        if (list.querySelector('.list-cards').classList.contains('hide')
            || list.querySelector('.open-card-composer').classList.contains('hide'))
        return assert('', false, ".hide class not removed correctly");

        return true;

    }, "toggleList doesn't toggle show/hide correctly");

    assert("appendListShowHideAndHandler", function () {
        var list = VM.lists()[0];

        VM.appendListShowHideAndHandler(list);

        if (!list.querySelector('.show-hide'))
            return assert('', false, "icons aren't appearing");

        // cleanup - remove the icons
        list.querySelector('.show-hide').remove();

        return true;

    }, "appendListShowHideAndHandler isn't creating the icons correctly")

    assert("removeShowHide", function () {
        var list = VM.lists()[0];

        VM.appendListShowHideAndHandler(list);
        VM.removeListShowHide(list);

        if (list.querySelector('.show-hide')) 
            return assert('', false, "show/hide icon still visible");

        return true;

    }, "removeShowHide doesn't get rid of the show/hide icons");

    assert("applyListState", function () {
        var curBoard = window.location.href.split('/').filter(function (s, i, a) { return i == a.length-1; });
        var list = VM.lists()[0];
        var listName = list.querySelector('.list-header-name').textContent;

        // make sure we start with a shown list
        VM.showList(list);

        // this should hide the list
        VM.applyListState(list, true);

        if (!list.querySelector('.list-cards').classList.contains('hide')
            || !list.querySelector('.open-card-composer').classList.contains('hide'))
        return assert('', false, "list state isn't being applied, not hiding the list");

        // cleanup - show the list again
        list.querySelector('.list-cards').classList.remove('hide');
        list.querySelector('.open-card-composer').classList.remove('hide');

        return true;

    }, "applyListState isn't working correctly")

    console.groupEnd();
}

function testSavingLoading() {
    console.group("Testing - Saving and Loading");



    console.end();
}

/* -- Assertion Functions-- */
// TODO: make this into a standalone lib with grouping method that uses console.group

function assert(message, assertion, error) {
    var res = undefined;

    if (typeof assertion === 'function') {
            res = assertion();
            if (!res){
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

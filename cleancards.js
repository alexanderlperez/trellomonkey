// ==UserScript==
// @name         Clean Cards
// @namespace    http://devbrainhack.co/
// @description  Clean up Trello's cards for single-user boards 
// @author       Alex Perez  
// @match        https://trello.com/*
// ==/UserScript==
'use strict';

// TODO: make a way to add user-specified elements to hide, point-and-click

var style = document.createElement('style');
style.setAttribute('type', 'text/css');
style.appendChild(document.createTextNode('.phenom-other { display: none; }'));
style.appendChild(document.createTextNode('.creator.member { display: none; }'));
style.appendChild(document.createTextNode('.inline-member { display: none; }'));
document.head.appendChild(style);

# trellomonkey
Some useful Tampermonkey scripts for daily Trello use.  Get Tampermonkey here: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo

#Installation
Go to tampermonkey and install these scripts by creating a new userscript, then copy and paste this:

```
// ==UserScript==
// @name         Show/Hide columns
// @namespace    http://devbrainhack.co/
// @description  Show/Hide cards in columns for Trello
// @author       Alex Perez  
// @match        https://trello.com/*
// @require      { ABSOLUTE LOCAL PATH }/showhide.js
// @require      { ABSOLUTE LOCAL PATH }/cleancards.js
// ==/UserScript==
```

Make sure to insert the absolute local path to the scripts correctly.  Don't use '~' to represent home, and for *nix systems, make sure to include the leading '/'.




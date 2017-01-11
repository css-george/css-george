var editor = null;
var styleID = '__GEORGE__Stylepad';

var stylepad = document.createElement('style');
stylepad.setAttribute('id', styleID);
stylepad.appendChild(document.createTextNode(':root { }'));
document.head.appendChild(stylepad);

document.addEventListener('keypress', function(evt) {
    if ((evt.code === 'Backquote' && evt.shiftKey) || (evt.keyCode === 126 && evt.shiftKey)) {
        if (editor && !editor.closed) {
            editor.focus();
        } else {
            openEditor();
        }
    }
});

window.addEventListener('message', function(evt) {
    if (evt.origin !== window.location.origin) {
        return;
    }

    updateVariables(evt.data);
});


function openEditor() {
    var height = window.innerHeight - 100;
    editor = window.open(url, '', 'menubar=no,toolbar=no,location=no,status=no,width=320,height='+height);

    if (!editor) {
        console.error('[george] Failed to open editor window');
        return;
    }

    editor.addEventListener('beforeunload', function(evt) {
        editor = null;
    });

    editor.addEventListener('load', function(evt) {
        var i;

        var inline = document.querySelectorAll('style:not(#' + styleID + ')');
        for (i = 0; i < inline.length; i++) {
            parseStylesheet(inline[i].innerHTML);
        }

        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for (i = 0; i < links.length; i++) {
            fetchStylesheet(links[i].href);
        }
    });
}

function fetchStylesheet(cssUrl) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            parseStylesheet(xhr.responseText);
        }
    };
    xhr.open('GET', cssUrl, true);
    xhr.send();
}

function parseStylesheet(sheetText) {
    var matches = sheetText.match(/georgeMappingURL=(\S+)/);
    if (matches && matches[1]) {
        parseMappingFile(matches[1]);
    }
}

function parseMappingFile(mapUrl) {
    try {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && editor && !editor.closed) {
                editor.postMessage(JSON.parse(xhr.responseText), window.location.origin);
            }
        };
        xhr.open('GET', mapUrl, true);
        xhr.send();
    } catch(e) {
        // If it's a data URI, we can handle it ourselves
        var split = mapUrl.split(',');
        if (split[0].match(/^data:/)) {
            editor.postMessage(JSON.parse(atob(split[1])), window.location.origin);
        } else {
            throw e;
        }
    }
}

function updateVariables(updates) {
    var rule = stylepad.sheet.cssRules[0];

    Object.keys(updates).map(function(key) {
        rule.style.setProperty('--' + key, updates[key]);
    });
}


var blob = new Blob([
<!-- inline:HTML -->
], { type: 'text/html' });
var url = URL.createObjectURL(blob);

var editor = null;
var styleID = '__GEORGE__Stylepad';
var knownVariables = Object.create(null);

var stylepad = document.createElement('style');
stylepad.setAttribute('id', styleID);
stylepad.appendChild(document.createTextNode(':root { }'));
document.head.appendChild(stylepad);

document.addEventListener('keydown', function(evt) {
    if ((evt.code === 'Backquote' && evt.shiftKey) || (evt.code === 'IntlBackslash' && evt.shiftKey) || (evt.keyCode === 126 && evt.shiftKey)) {
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

    if (evt.data == '__INIT__') {
        if (editor && !editor.closed) {
            editor.postMessage(knownVariables, window.location.origin);
        }

    } else {
        updateVariables(evt.data);
    }
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


    if (Object.keys(knownVariables).length === 0) {
        var i;
        var inline = document.querySelectorAll('style:not(#' + styleID + ')');
        for (i = 0; i < inline.length; i++) {
            parseStylesheet(inline[i].innerHTML);
        }

        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for (i = 0; i < links.length; i++) {
            fetchStylesheet(links[i].href);
        }
    }
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
            if (xhr.readyState === 4) {
                var variables = JSON.parse(xhr.responseText);

                Object.keys(variables).forEach(function(varname) {
                    knownVariables[varname] = variables[varname];
                });

                if (editor && !editor.closed) {
                    editor.postMessage(variables, window.location.origin);
                }
            }
        };
        xhr.open('GET', mapUrl, true);
        xhr.send();
    } catch(e) {
        // If it's a data URI, we can handle it ourselves
        var split = mapUrl.split(',');
        if (split[0].match(/^data:/)) {
            var variables = JSON.parse(atob(split[1]));

            Object.keys(variables).forEach(function(varname) {
                knownVariables[varname] = variables[varname];
            });

            if (editor && !editor.closed) {
                editor.postMessage(variables, window.location.origin);
            }
        } else {
            throw e;
        }
    }
}

function updateVariables(updates) {
    var rule = stylepad.sheet.cssRules[0];

    Object.keys(updates).map(function(key) {
        knownVariables[key] = updates[key];
        rule.style.setProperty('--' + key, updates[key]);
    });
}


var blob = new Blob([
<!-- inline:HTML -->
], { type: 'text/html' });
var url = URL.createObjectURL(blob);

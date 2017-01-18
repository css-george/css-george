var origin = window.opener.location.origin;
if (origin.substring(0, 4) !== 'http') {
    origin = null;
} else {
    document.title += ' - ' + origin;
}

var VARIABLES = Object.create(null);

window.opener.addEventListener('beforeunload', function(evt) {
    window.close();
});


window.addEventListener('load', function() {
    window.opener.postMessage('__INIT__', origin || '*');

    var btn = document.getElementById('menuButton');
    if (btn) {
        MenuButton(btn);
    }
});


window.addEventListener('message', function(evt) {
    if ('' + evt.origin !== '' + origin) {
        return;
    }

    if (evt.data) {
        Object.keys(evt.data).forEach(function(name) {
            VARIABLES[name] = evt.data[name];
        });

        defineVariables();
    }
});


function onEdit(input) {
    var name = input.getAttribute('name');

    // First, sync other inputs to the new value
    var other = document.querySelector('input[name="'+name+'"]:not([type="' + input.type +'"])');
    if (other) {
        other.value = input.value;
    }

    VARIABLES[name] = input.value;

    var msg = Object.create(null);
    msg[name] = input.value;

    window.opener.postMessage(msg, origin || '*');
}


function defineVariables() {
    var keys = Object.keys(VARIABLES).sort();
    var par = document.getElementById('editor');

    for (var i = 0; i < keys.length; i++) {
        var data = {
            name: keys[i],
            value: VARIABLES[keys[i]]
        };

        /* Check if element already exists */
        var el = par.querySelector('div[data-variable="' + data.name + '"]');
        if (el) {
            Array.prototype.forEach.call(el.querySelectorAll('input'), function(input) {
                input.value = data.value;
            });
        } else {
            el = bindTemplate(data);

            if (i === 0) {
                par.appendChild(el);
            } else {
                /* We iterate in order, so the previous must exist */
                var sib = par.querySelector('div[data-variable="' + keys[i-1] + '"]');

                if (sib && sib.nextSibling) {
                    par.insertBefore(el, sib.nextSibling);
                } else {
                    par.appendChild(el);
                }
            }
        }
    }
}


function bindTemplate(item) {
    var node = document.getElementById('tpl').content.cloneNode(true);

    function toAttrName(binding) {
        return binding.replace(/^bind([A-Z])/, function(_,x) {
            return x.toLowerCase();
        }).replace(/([A-Z])/g, function(_,x) {
            return '-' + x.toLowerCase();
        });
    }

    // Ugh, this is super inefficient :(
    function templater(el) {
        Object.getOwnPropertyNames(el.dataset)
            .filter(function(_) { return _.match(/^bind/); })
            .map(function(_) { return [toAttrName(_), item[el.dataset[_]]]; })
            .forEach(function(pair) {
                var attr = pair[0];
                var value = pair[1];

                if (attr === 'text') {
                    el.textContent = value;
                } else {
                    el.setAttribute(attr, value);

                    // Workaround for weird Safari color input bug:
                    // https://bugs.webkit.org/show_bug.cgi?id=166930
                    if (attr === 'value') {
                        el.value = '#000000';
                        el.value = value;
                    }
                }
            });
    }

    var children = node.querySelectorAll('*');
    Array.prototype.forEach.call(children, templater);

    return node;
}


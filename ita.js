var fs = require('fs');
var system = require('system');
var args = system.args;

function getPricesForRoute(origin, destination, outDate, inDate, routing) {
    var page = require('webpage').create();
    page.open('https://matrix.itasoftware.com', function(status) {
            if (status === "success") {
                page.evaluate(function(origin, destination, outDate, inDate, routing) {
                    function dispatchChangeForTarget(target) {
                        var event = target.ownerDocument.createEvent('Event');
                        var blurevent = target.ownerDocument.createEvent('FocusEvent');
                        var options = {};

                        var opts = {
                                cancelable:options.cancelable        || false,
                                view:options.view                    || target.ownerDocument.defaultView,
                                detail:options.detail                || 1,
                                screenX:options.screenX              || 0, 
                                screenY:options.screenY              || 0,
                                clientX:options.clientX              || 0, 
                                clientY:options.clientY              || 0,
                                ctrlKey:options.ctrlKey              || false,
                                altKey:options.altKey                || false,
                                shiftKey:options.shiftKey            || false,
                                metaKey:options.metaKey              || false, 
                                button:options.button                || 0, 
                                relatedTarget:options.relatedTarget  || null,
                                currentTarget:options.currentTarget  || null,
                            }

                        event.initEvent(
                                'change',
                                opts.cancelable,
                                opts.view,
                                opts.detail,
                                opts.screenX,
                                opts.screenY,
                                opts.clientX,
                                opts.clientY,
                                opts.ctrlKey,
                                opts.altKey,
                                opts.shiftKey,
                                opts.metaKey,
                                opts.button,
                                opts.relatedTarget,
                                opts.currentTarget
                                );

                        blurevent.initEvent(
                                'blur',
                                opts.cancelable,
                                opts.view,
                                opts.detail,
                                opts.screenX,
                                opts.screenY,
                                opts.clientX,
                                opts.clientY,
                                opts.ctrlKey,
                                opts.altKey,
                                opts.shiftKey,
                                opts.metaKey,
                                opts.button,
                                opts.relatedTarget,
                                opts.currentTarget
                                )

                        target.dispatchEvent(event);
                        target.dispatchEvent(blurevent);
                    }

                    function mouseEvent(target) {
                    }

                    function setValue(target, value) {
                        target.value = value;
                        dispatchChangeForTarget(target);
                    }

                    window.setTimeout(function() {
                        orig = document.getElementById("cityPair-orig-0");
                        dest = document.getElementById("cityPair-dest-0");
                        out = document.getElementById("cityPair-outDate-0");
                        ret = document.getElementById("cityPair-retDate-0");
                        search = document.getElementById("searchButton-0");
                        currency = document.getElementsByClassName("GE-ODR-BB5")[0];

                        setValue(orig, origin);
                        setValue(dest, destination);
                        setValue(out, outDate);
                        setValue(ret, inDate);
                        setValue(currency, "USD");

                        if (routing) {
                            var anchors = document.getElementsByClassName('gwt-Anchor');

                            for (var i = 0; i < anchors.length; i++) {
                                if (anchors[i].innerText == 'Advanced routing codes') {
                                    var showRouting = anchors[i];
                                    showRouting.click();
                                    setTimeout(function() {
                                        outRoute = document.getElementsByClassName('GE-ODR-BPIB GE-ODR-BEJ')[0];
                                        inRoute = document.getElementsByClassName('GE-ODR-BPIB GE-ODR-BEJ')[1];

                                        setValue(outRoute, routing);
                                        setValue(inRoute, routing);
                                        window.setTimeout(function() {
                                            search.click();
                                        }, 500);
                                    }, 500)
                                }
                            }
                        }
                        else {
                            window.setTimeout(function() {
                                search.click();
                            }, 500);
                        }
                    }, 500);

                }, origin, destination, outDate, inDate, routing);

                window.setTimeout(function() {
                    function replaceAll(find, replace, str) {
                        return str.replace(new RegExp(find, 'g'), replace);
                    }

                    var printOutDate = replaceAll('/', '-', outDate);
                    var printInDate = replaceAll('/', '-', inDate);

                    page.render('output/' + origin + ' ✈ ' + destination + ' | ' + printOutDate + ' -> ' + printInDate + '.jpg');
                    price = page.evaluate(function() {
                        elems = document.getElementsByClassName('GE-ODR-BMU');
                        if (elems.length > 0) {
                            return elems[0].innerText
                        }
                        else {
                            return 'Not Found'
                        }
                    })
                    fs.write('output/summary.txt', origin + ' ✈ ' + destination + ' | ' + printOutDate + ' -> ' + printInDate + ' : ' + price + '\n', 'a');
                    fs.write('output/summary.csv', origin + ',' + destination + ',' + printOutDate + ',' + printInDate + ',' + price + '\n', 'a');

                    console.log(price);

                    phantom.exit();
                }, 70000)
            }
            else {
                console.log('Not Found');
                phantom.exit();
            }
    });
}

// Assume format for args
// 1. Origin city
// 2. Destination city
// 3. Outbound date
// 4. Inbound date
// 5. Routing codes

origin = args[1];
destination = args[2];
outDate = args[3];
inDate = args[4];
routing = args[5];

getPricesForRoute(origin, destination, outDate, inDate, routing);

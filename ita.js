var fs = require('fs');
var system = require('system');
var args = system.args;

function getPricesForRoute(origin, destination, outDate, inDate, routing, flexible, stay) {
    var page = require('webpage').create();
    page.open('https://matrix.itasoftware.com', function(status) {
            if (status === "success") {
                page.evaluate(function(origin, destination, outDate, inDate, routing, flexible, stay) {
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
                        cal_button = document.getElementById("gwt-uid-156");
                        cal_date = document.getElementById("calDate-0");
                        cal_stay = document.getElementById("calStay-0");
                        
                        orig = document.getElementById("cityPair-orig-0");
                        dest = document.getElementById("cityPair-dest-0");
                        out = document.getElementById("cityPair-outDate-0");
                        ret = document.getElementById("cityPair-retDate-0");
                        search = document.getElementById("searchButton-0");
                        currency = document.getElementsByClassName("GE-ODR-BB5")[0];

                        setValue(orig, origin);
                        setValue(dest, destination);
                        setValue(currency, "USD");

                        if (!flexible) {
                            setValue(out, outDate);
                            setValue(ret, inDate);
                        }
                        else {
                            cal_button.click();
                            setValue(cal_date, outDate);
                            setValue(cal_stay, stay);
                        }

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

                }, origin, destination, outDate, inDate, routing, flexible, stay);

                window.setTimeout(function() {
                    function genFileName() {
                        function replaceAll(find, replace, str) {
                            return str.replace(new RegExp(find, 'g'), replace);
                        }

                        var printOutDate = replaceAll('/', '-', outDate);
                        var printInDate = replaceAll('/', '-', inDate);

                        return 'output/' + origin + ' ' + 
                            destination + ' ' + printOutDate + 
                            ' ' + printInDate + '.jpg';
                    }

                    page.render(genFileName());

                    price = page.evaluate(function(flexible) {
                        if (!flexible) {
                            elems = document.getElementsByClassName('GE-ODR-BMU');
                        }
                        else {
                            elems = document.getElementsByClassName('GE-ODR-BLO');
                        }
                        if (elems.length > 0) {
                            return elems[0].innerText
                        }
                        else {
                            return 'Not Found'
                        }
                    }, flexible);
                    
                    console.log(price);

                    if (!flexible) {
                        stops = page.evaluate(function() {
                            out_stops = [];
                            ret_stops = [];

                            rows = document.getElementsByClassName('GE-ODR-BOV');

                            out_row = rows[0];
                            out_cols = out_row.getElementsByTagName('td');
                            out_div = out_cols[5];
                            out_stop_divs = out_div.getElementsByClassName('GE-ODR-BPV');

                            ret_row = rows[1];
                            ret_cols = ret_row.getElementsByTagName('td');
                            ret_div = ret_cols[4];
                            ret_stop_divs = ret_div.getElementsByClassName('GE-ODR-BPV');

                            for (var i = 0; i < out_stop_divs.length; i++) {
                                out_stops.push(out_stop_divs[i].innerText);
                            }
                            for (var i = 0; i < ret_stop_divs.length; i++) {
                                ret_stops.push(ret_stop_divs[i].innerText);
                            }

                            return [out_stops, ret_stops];
                        });
                        console.log(stops[0]);
                        console.log(stops[1]);
                    }

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

var origin = args[1];
var destination = args[2];
var outDate = args[3];
var inDate = args[4];
var routing = args[5];
var stay;

var flexible = args[4] == "month";

if (flexible) {
    stay = args[6];
}

getPricesForRoute(origin, destination, outDate, inDate, routing, flexible, stay);

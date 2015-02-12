var page = require('webpage').create();
page.open('https://matrix.itasoftware.com', function(status) {
        console.log("Status: " + status);
        if(status === "success") {
            page.evaluate(function() {
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

                function setValue(target, value) {
                    target.value = value;
                    dispatchChangeForTarget(target);
                }

                orig = document.getElementById("cityPair-orig-0")
                dest = document.getElementById("cityPair-dest-0")
                out = document.getElementById("cityPair-outDate-0")
                ret = document.getElementById("cityPair-retDate-0")
                search = document.getElementById("searchButton-0")

                setValue(orig,  "SFO");
                setValue(dest,  "JFK");
                setValue(out, "08/09/2015");
                setValue(ret, "08/11/2015");

                search.click();
            });

            window.setTimeout(function() {
                page.render('example.png');
                phantom.exit();
            }, 70000)
        }
});

var fs = require('fs');
var exec = require('child_process').exec;
var args = process.argv;

var pairs = []

function launchPhantom(i) {
    function calculateMiles(origin, destination) {
    
    }

    if (i >= pairs.length) {
        process.exit(code=0);
    }

    var args = pairs[0].join(' ');
    console.log(args);

    var options = {
        "timeout": 100000
    }

    var child = exec('phantomjs ita.js ' + args, options,
            function(error, stdout, stderr) {
                var str = stdout.toString('utf8');
                if (str) {
                    var price = str.slice(1);
                    price = parseInt(price);
                }

                launchPhantom(i + 1);
            });
}

function exploreRoutes(origins, destinations, outDates, inDates, routing) {
    fs.writeFile('output/summary.txt', '\n');
    fs.writeFile('output/summary.csv', '\n');

    for (var i = 0; i < origins.length; i++) {
        for (var j = 0; j < destinations.length; j++) {
            for (var k = 0; k < outDates.length; k++) {
                for (var l = 0; l < inDates.length; l++) {
                    pairs.push([origins[i], destinations[j], outDates[k], inDates[l], routing]);
                }
            }
        }
    }
    launchPhantom(0);
}

if (args.length > 2) {
    var origins = [];
    var destinations = [];
    var outboundDates = [];
    var inboundDates = [];
    var routing = "";

    // 0: Origins
    // 1: Destinations
    // 2: Outbound date
    // 3: Inbound date
    // 4: Routing
    
    var state = 0;
    for (var i = 2; i < args.length; i++) {
        switch(state) {
            case 0:
                if (args[i] == 'to') {
                    state++;
                }
                else {
                    origins.push(args[i]);
                }
                break;
            case 1:
                if (args[i] == 'from') {
                    state++;
                }
                else {
                    destinations.push(args[i]);
                }
                break;
            case 2:
                if (args[i] == 'until') {
                    state++;
                }
                else {
                    outboundDates.push(args[i]);
                }
                break;
            case 3:
                if (args[i] == 'routing') {
                    state++;
                }
                else {
                    inboundDates.push(args[i]);
                }
                break;
            case 4:
                routing += (args[i] + ' ');
        }
    }

    exploreRoutes(origins, destinations, outboundDates, inboundDates, routing);
}
else {
    exploreRoutes(["JFK", "LGA", "ORD", "MIA", "YYZ"], ["SFO", "LAX", "SJC", "SEA"], '06/22/2015', '06/26/2015');
}

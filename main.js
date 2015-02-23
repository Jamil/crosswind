var fs = require('fs');
var exec = require('child_process').exec;
var args = process.argv;

var pairs = [];
var targetcpm = 0.10;
var dest_phone = process.env['DEST_PHONE'];
var orig_phone = process.env['ORIG_PHONE'];

function makeCSVLine(cols) {
    return cols.join(', ') + '\n';
}

function launchPhantom(it) {
    function replaceAll(find, replace, str) {
        return str.replace(new RegExp(find, 'g'), replace);
    }
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    var origin = pairs[it][0];
    var destination = pairs[it][1];
    var outDate = pairs[it][2];
    var inDate = pairs[it][3];
    var printOutDate = replaceAll('/', '-', outDate);
    var printInDate = replaceAll('/', '-', inDate);

    if (endsWith(inDate, "days")) {
        var stay = inDate.replace("days", "");
        pairs[it][3] = "month";
        pairs[it].push(stay);
    }

    function makePrettyLine(html, price, mqm, out_stops, ret_stops) {
        var cpm = (price/mqm).toFixed(2);

        var title = origin + ' ✈ ' + destination;
        var dates = printOutDate + ' -> ' + printInDate;
        var price_and_miles = '$' + price + ', ' + mqm + ' ($' + cpm + '/mi)';
        var out_stops_txt = ' outbound via ' + out_stops;
        var ret_stops_txt = ' return via ' + ret_stops;

        var html_open = '<font face="Courier New"><a href=';

        var flexible = endsWith(inDate, "days");

        var filename;

        if (!flexible) {
            filename = '"' + origin + ' ' + destination + ' ' + printOutDate + ' ' + printInDate + '.jpg"';
        }
        else {
            filename = '"' + origin + ' ' + destination + ' ' + printOutDate + ' ' + "month" + '.jpg"';
        }
        var html_close = '>';

        if (!html) {
            var s = title + ' | ' + dates + ' : ' + price_and_miles +
                (out_stops.length > 0 ? out_stops_txt : '') +
                (ret_stops.length > 0 ? ret_stops_txt : '');
            return s
        }
        else {
            var s = html_open + filename + html_close + 
                title + '</a> | ' + dates + ' : ' + price_and_miles +
                (out_stops.length > 0 ? out_stops_txt : '') +
                (ret_stops.length > 0 ? ret_stops_txt : '') + '<br>';
            return s
        }
    }
    
    function calculateMiles(out_stops, ret_stops, callback) {
        var request = require('request');

        var endpoint = "http://fly.qux.us/smcalc/dist.php?route=" + origin;

        for (var j = 0; j < out_stops.length; j++) {
            endpoint += '+' + out_stops[j];
        }
        
        endpoint += '+' + destination ;

        for (var j = 0; j < ret_stops.length; j++) {
            endpoint += '+' + ret_stops[j];
        }
            
        endpoint += "+" + origin + "+&start_mqm=0&start_rdm=0&default_fare=T&elite=peon&default_carrier=DL&ajax";

        request.post(
                endpoint,
                function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var content = JSON.parse(body);
                        callback(content['mqm']);
                    }
                    else {
                        callback(0);
                    }
                }
                );
    }

    function sendMessage(mqm, price, cpm) {
        // Twilio Credentials 
        var accountSid = process.env['TWILIO_SID']; 
        var authToken = process.env['TWILIO_AUTH']; 

        //require the Twilio module and create a REST client 
        var client = require('twilio')(accountSid, authToken); 

        var bodyText = 'Found ' + origin + ' ✈ ' + destination + ' $' + price + ' - ' + mqm + ' miles - $' + cpm.toFixed(2) + '/mile'

        client.messages.create({ 
            to: dest_phone, 
            from: orig_phone, 
            body: bodyText,   
        }, function(err, message) { 
        });
    }

    function writeOut(mqm, price, cpm, out_stops, in_stops) {
        fs.appendFile('output/summary.txt', 
                makePrettyLine(false, price, mqm, out_stops, in_stops));

        var csv = makeCSVLine([origin, destination, printOutDate, 
                printInDate, price, mqm, cpm, out_stops, in_stops])
        fs.appendFile('output/summary.csv', csv);

        var html = makePrettyLine(true, price, mqm, out_stops, in_stops);
        fs.appendFile('output/summary.html', html);

        console.log(makePrettyLine(false, price, mqm, out_stops, in_stops));

        if (cpm < targetcpm) {
            sendMessage(mqm, price, cpm);
        }
    }

    var args = pairs[it].join(' ');
    console.log(args);

    var options = {
        "timeout": 100000
    }

    var child = exec('phantomjs ita.js ' + args, options,
            function(error, stdout, stderr) {
                var str = stdout.toString('utf8');
                if (str) {
                    var elems = str.split('\n');
                    var price = elems[0].slice(1);
                    var out_stops = [];
                    var ret_stops = [];

                    if (elems.length > 2) {
                        out_stops = elems[1].split(',');
                        ret_stops = elems[2].split(',');
                    }

                    // Remove commas
                    price = price.replace(/,/g,"");
                    price = parseInt(price);
                    calculateMiles(out_stops, ret_stops, function(mqm) {
                        writeOut(mqm, price, price/mqm, out_stops, ret_stops);
                        if (it + 1 == pairs.length) {
                            process.exit(code=0);
                        }
                        setTimeout(function() {
                            launchPhantom(it + 1);
                        }, 60000);
                    });
                }
                else {
                    if (it + 1 == pairs.length) {
                        process.exit(code=0);
                    }
                    setTimeout(function() {
                        launchPhantom(it + 1);
                    }, 60000);
                }
            });
}

function exploreRoutes(origins, destinations, outDates, inDates, routing) {
    function shuffle(array) {
      var currentIndex = array.length, temporaryValue, randomIndex ;
    
      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

          // Pick a remaining element...
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex -= 1;

          // And swap it with the current element.
          temporaryValue = array[currentIndex];
          array[currentIndex] = array[randomIndex];
          array[randomIndex] = temporaryValue;
      }

      return array;
    }
    

    fs.writeFile('output/summary.txt', '');
    fs.writeFile('output/summary.csv', makeCSVLine(['Origin', 'Destination', 'Departure', 'Return', 'Price', 'Miles', 'Cost per mile', 'Outbound stops', 'Return stops']));
    fs.writeFile('output/summary.html', '');

    for (var h = 0; h < origins.length; h++) {
        for (var j = 0; j < destinations.length; j++) {
            for (var k = 0; k < outDates.length; k++) {
                for (var l = 0; l < inDates.length; l++) {
                    pairs.push([origins[h], destinations[j], outDates[k], inDates[l], routing]);
                }
            }
        }
    }

    // Shuffle them up to make it interesting
    shuffle(pairs);

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
    // 5: Target CPM
    // 6: Alert phone number
    
    var state = 0;
    for (var j = 2; j < args.length && state < 7; j++) {
        switch(state) {
            case 0:
                if (args[j] == 'to') {
                    state++;
                }
                else {
                    origins.push(args[j]);
                }
                break;
            case 1:
                if (args[j] == 'from') {
                    state++;
                }
                else {
                    destinations.push(args[j]);
                }
                break;
            case 2:
                if (args[j] == 'until') {
                    state++;
                }
                else {
                    outboundDates.push(args[j]);
                }
                break;
            case 3:
                if (args[j] == 'routing') {
                    state++;
                }
                else {
                    inboundDates.push(args[j]);
                }
                break;
            case 4:
                if (args[j] == 'target') {
                    state++;
                }
                else {
                    routing = '"' + args[j] + '"';
                }
                break;
            case 5:
                if (args[j] == 'text') {
                    state++;
                }
                else {
                    targetcpm = args[j];
                }
                break;
            case 6:
                dest_phone = args[j];
                state++;
                break;
        }
    }

    exploreRoutes(origins, destinations, outboundDates, inboundDates, routing);
}
else {
    exploreRoutes(["JFK", "LGA", "ORD", "MIA", "YYZ"], ["SFO", "LAX", "SJC", "SEA"], '06/22/2015', '06/26/2015');
}

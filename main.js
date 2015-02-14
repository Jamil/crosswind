var fs = require('fs');
var exec = require('child_process').exec;
var args = process.argv;

var pairs = []
var targetcpm = 0.10

function launchPhantom(i) {
    function calculateMiles(out_stops, ret_stops, callback) {
        var origin = pairs[i][0];
        var destination = pairs[i][1];

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
        var origin = pairs[i][0];
        var destination = pairs[i][1];
        var outDate = pairs[i][1];
        var inDate = pairs[i][1];

        // Twilio Credentials 
        var accountSid = process.env['TWILIO_SID']; 
        var authToken = process.env['TWILIO_AUTH']; 

        //require the Twilio module and create a REST client 
        var client = require('twilio')(accountSid, authToken); 

        var bodyText = 'Found ' + origin + ' ✈ ' + destination + ' $' + price + ' - ' + mqm + ' miles - $' + cpm.toFixed(2) + '/mile'

        client.messages.create({ 
            to: process.env['DEST_PHONE'], 
            from: "+14159939996", 
            body: bodyText,   
        }, function(err, message) { 
        });
    }

    function writeOut(mqm, price, cpm, out_stops, in_stops) {
        function replaceAll(find, replace, str) {
            return str.replace(new RegExp(find, 'g'), replace);
        }

        var origin = pairs[i][0];
        var destination = pairs[i][1];
        var outDate = pairs[i][2];
        var inDate = pairs[i][3];
        var printOutDate = replaceAll('/', '-', outDate);
        var printInDate = replaceAll('/', '-', inDate);

        console.log(origin + ' ✈ ' + destination + ' | ' + printOutDate + ' -> ' + printInDate + ' : $' + price + ', ' + mqm + ' ($' + cpm.toFixed(2) + '/mi), via ' + out_stops + ' and ' + in_stops);
        fs.appendFile('output/summary.txt', origin + ' ✈ ' + destination + ' | ' + printOutDate + ' -> ' + printInDate + ' : $' + price + ', ' + mqm + ' ($' + cpm.toFixed(2) + '/mi), via ' + out_stops + ' and ' + in_stops + '\n');
        fs.appendFile('output/summary.csv', origin + ',' + destination + ',' + printOutDate + ',' + printInDate + ',' + price + ',' + mqm + ',' + cpm + '\n');

        var html = '<font face="Courier New"><a href="' + origin + ' ' + destination + ' ' + printOutDate + ' ' + printInDate + '.jpg">' + origin + ' &#9992; ' + destination + '</a>' + ' | ' + printOutDate + ' -> ' + printInDate + ' : $' + price + ', ' + mqm + ' ($' + cpm.toFixed(2) + '/mi), via ' + out_stops + ' and ' + in_stops + '<br></font>'
        fs.appendFile('output/summary.html', html);

        if (cpm < targetcpm) {
            sendMessage(mqm, price, cpm);
        }
    }

    if (i >= pairs.length) {
    }
    else {
        var args = pairs[i].join(' ');
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
                        var out_stops = elems[1].split(',')
                        var ret_stops = elems[2].split(',')

                        // Remove commas
                        price = price.replace(/,/g,"");
                        price = parseInt(price);
                        calculateMiles(out_stops, ret_stops, function(mqm) {
                            writeOut(mqm, price, price/mqm, out_stops, ret_stops);
                            setTimeout(function() {
                                launchPhantom(i + 1);
                            }, 60000);
                        });
                    }
                    else {
                        setTimeout(function() {
                            launchPhantom(i + 1);
                        }, 60000);
                    }
                });
    }
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
    fs.writeFile('output/summary.csv', '');
    fs.writeFile('output/summary.html', '');

    for (var i = 0; i < origins.length; i++) {
        for (var j = 0; j < destinations.length; j++) {
            for (var k = 0; k < outDates.length; k++) {
                for (var l = 0; l < inDates.length; l++) {
                    pairs.push([origins[i], destinations[j], outDates[k], inDates[l], routing]);
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
    
    var state = 0;
    for (var i = 2; i < args.length && state != 5; i++) {
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
                routing = '"' + args[i] + '"';
                state++;
                break;
        }
    }

    exploreRoutes(origins, destinations, outboundDates, inboundDates, routing);
}
else {
    exploreRoutes(["JFK", "LGA", "ORD", "MIA", "YYZ"], ["SFO", "LAX", "SJC", "SEA"], '06/22/2015', '06/26/2015');
}

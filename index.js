const { Composer, log, session } = require('micro-bot')
const bot = new Composer()

const parseString = require('xml2js').parseString;
const request = require('request');

// Sets global regex, so that there will always be the custom keyboard triggered
// if the user gives any input to the bot
const everything = new RegExp(/./g)

// The actual custom buttons
const buttonStrings = ["Speiseplan für Heute", "Speiseplan für Morgen"];
const option = {
    "parse_mode": "Markdown",
    "reply_markup": { "keyboard": [[buttonStrings[0]], [buttonStrings[1]]] }
};

var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./client_secret.json');
var doc = new GoogleSpreadsheet('14i-pbeTwRkUslD0BsUink6YiqgW16W0ttDrs9iiXZrI');


//-------------------------------
var express            = require('express');
var app                = express();

//Express Gedöns
//For avoidong $PORT error
app.set('port', (process.env.PORT || 5060));

app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});
//-------------------------------

bot.hears(everything, function(ctx) {

    // Gets current user 
    var currentUser = ctx.message.from.username;
    var message     = ctx.update.message.text;
    if(currentUser === undefined){
        currentUser = ctx.message.from.id;
    }

    // Sends data to Google Spreadsheets
    const currentDate = convertUnixTimestampToDate(ctx.message.date);
    sendUserDataToGoogleSpreadsheets(currentDate, currentUser, message);

    // Sets date adress
    let dateRef;
    var button = false;
    for (let i = 0; i < buttonStrings.length; i++){
        if(message === buttonStrings[i]){
            dateRef = i;
            button  = true;
        }
    }

    if(button) {
        request('http://xml.stw-potsdam.de/xmldata/ka/xmlfhp.php', function (error, response, body) {
            parseString(body, function (err, result) {

                var day = result.menu.datum[dateRef];

                // Checks if the dataset for today is empty
                if(typeof day.angebotnr === 'undefined') {
                    ctx.telegram.sendMessage(ctx.message.chat.id, "So wie es aussieht gibt's in der Mensa *nix* zu essen… 🍽", option);
                    return;
                }

                var angebote = [];
                for (let i = 0; i < day.angebotnr.length; i++){
                    var ref = day.angebotnr[i];

                    
                    var dataIsValid = !(ref.preis_s[0] == '');

                    if(dataIsValid) {

                        angebote[i] = {
                            angebot: ref.titel,
                            beschreibung: ref.beschreibung,
                            labels: foodTypeChecker(ref.labels[0].label[0].$.name)
                        }

                    } else {
                        angebote[i] = { angebot:'', beschreibung:'', labels: ''}
                    }
                }

                var parsedResponse = '';
                for (let i = 0; i < angebote.length; i++){
                    parsedResponse += '*' + angebote[i].angebot + '*: ' + '\n' + angebote[i].beschreibung + '\n'  + angebote[i].labels + '\n' 
                }

                ctx.telegram.sendMessage(ctx.message.chat.id, parsedResponse, option);
            });
        })   
    } else {
        ctx.telegram.sendMessage(ctx.message.chat.id, "Für wann brauchst du den Speiseplan? 🍱", option);
    }
});

function foodTypeChecker(label){
    var vegetarisch = '🌽 - vegetarisch'
    var vegan = '🍆 - vegan';
    var gefluegel = '🐔 - mit Geflügel';
    var schweinefleisch = '🐖 - mit Schweinefleisch';
    var rindfleisch = '🐄 - mit Rindfleisch';
    var fisch = '🐟 - mit Fisch';
    var lamm  = '🐑 - mit Lamm';
  
    var returnValue = '';
    
    if(label == 'schweinefleisch') {
        return schweinefleisch;
    }
    if(label == 'vegetarisch') {
        return vegetarisch;
    }
    if(label == 'gefluegel') {
        return gefluegel;
    }
    if(label == 'lamm') {
        return lamm;
    } 
    if(label == 'rindfleisch') {
        return rindfleisch;
    }
    if(label == 'fisch') {
        return fisch;
    }
    if(label == 'vegan') {
        return vegan;
    }
    return returnValue;
}

function sendUserDataToGoogleSpreadsheets(currentDate, usedUsername, usedCommand){
    doc.useServiceAccountAuth(creds, function (err, command) {
        doc.addRow(1, { msg_date: currentDate, user_name: usedUsername, command: usedCommand}, function(){
            console.log('Sent Userdata to Google Spreadsheet');
        })
    });
}

function convertUnixTimestampToDate(unix_timestamp){
    return new Date(unix_timestamp*1000).toISOString();
}

module.exports = bot

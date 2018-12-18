const { Composer, log, session } = require('micro-bot')
const bot = new Composer()

const Telegraf = require('telegraf')

const parseString = require('xml2js').parseString;
const request = require('request');

/* Lightweight Database init */ 
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)


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
bot.command('heute', function(ctx) {
    handleRequests(ctx);
});

bot.command('filter', function(ctx){
    const testMenu = Telegraf.Extra
        .markdown()
        .markup((m) => m.inlineKeyboard([
            m.callbackButton('vegetarier', 'veggie'),
            m.callbackButton('veganer', 'vegan'),
            m.callbackButton('Wurst', 'saussage')
    ]));

    ctx.reply('Bist du Vegetarier, veganer oder ist dir alles Wurst?', testMenu);

    bot.action('veggie', function(ctx){
        ctx.reply('Deine Einstellungen wurden auf vegetarisch geändert.').then(() => {
            handleUserData(ctx);
        })
    })

    bot.action('vegan', function(ctx){
        ctx.reply('Deine Einstellungen wurden auf vegan geändert.').then(() => {
            handleUserData(ctx);
        })
    })

    bot.action('saussage', function(ctx){
        ctx.reply('Deine Einstellungen wurden zurückgesetzt auf alle Ergebnisse anzeigen.').then(() => {
            handleUserData(ctx);
        })
    })
});

bot.hears(everything, function(ctx) {
    handleRequests(ctx);
}); 

function handleRequests(ctx) {
    // Gets current user 
    var currentUser = ctx.message.from.username;
    var message     = ctx.update.message.text;
    if(currentUser === undefined){
        currentUser = ctx.message.from.id;
    }

    console.log(message);

    // Sends data to Google Spreadsheets
    const currentDate = convertUnixTimestampToDate(ctx.message.date);
    sendUserDataToGoogleSpreadsheets(currentDate, currentUser, message);

    // Get commands
    var todayCommandList = ['/heute', 'heute', 'Heute', 'jetzt', 'Jetzt', 'today', 'Today'];
    var tomorrowCommandList = ['/morgen','morgen', 'Morgen', 'tomorrow', 'Tomorrow'];

    // Sets date adress
    let dateRef;
    var response = false;
    for (let i = 0; i < buttonStrings.length; i++){
        if(message === buttonStrings[i]){
            dateRef = i;
            response  = true;
        }
        else if (todayCommandList.includes(message)) {
            dateRef = i;
            response  = true;
        }
        else if(tomorrowCommandList.includes(message)){
            dateRef = i;
            response  = true;
        }
    }

    if(response) {
        request('http://xml.stw-potsdam.de/xmldata/ka/xmlfhp.php', function (error, response, body) {
            parseString(body, function (err, result) {
                var day = result.menu.datum[dateRef];
                
                console.log(typeof day.angebotnr);

                // Checks if the dataset for today is empty
                if(day.angebotnr === 'undefined' || day.angebotnr == undefined) {
                    ctx.telegram.sendMessage(ctx.message.chat.id, "Computer sagt nein. Für deine Anfrage liegen in der Mensa noch keine Daten vor, versuche es später noch einmal! 😉 Stattdessen gibt's erstmal eine Katze.", option);
                    ctx.replyWithPhoto('https://cataas.com/cat');
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
        });
    } else {
        ctx.telegram.sendMessage(ctx.message.chat.id, "Für wann brauchst du den Speiseplan? 🍱", option);
    }
}

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

function handleUserData(ctx) {
    let userID = ctx.update.callback_query.from.id;
    let user = db.get('user').find({'id': userID}).value();

    /* Check if user has an Entry – if not create one, else update */
    if(typeof user === 'undefined') {
        console.log('Noch kein Eintrag in der Datenbank – Es wird einer erstellt');
        db.get('user')
            .push({ id: userID, preference: ctx.match })
            .write()
    } else {
        db.get('user').find({'id': userID}).set('preference', ctx.match)
            .write()
    }
}

function sendUserDataToGoogleSpreadsheets(currentDate, usedUsername, usedCommand){
    doc.useServiceAccountAuth(creds, function (err, command) {
        doc.addRow(1, { msg_date: currentDate, user_name: usedUsername, command: usedCommand}, function(){
            console.log('Sent Userdata to Google Spreadsheet');
        })
    });
}

function convertUnixTimestampToDate(unix_timestamp){
    var date = new Date(unix_timestamp * 1000);
    var day = date.getDay();
    var month = date.getMonth()
    var year = date.getYear();
    // Changed Date for Google Spreadsheet
    return day + '.' + month + 1 + '.' + year;
}

module.exports = bot

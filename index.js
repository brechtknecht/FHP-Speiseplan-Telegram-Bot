// Token initialisierung
var BOT_TOKEN = '332625630:AAH-zM5ZnzFDFNjbxBqwJ4TozdIs7mcfq2A';

//Deprecated Dependencies
//var botan              = require('botanio')(botan_token);

// Dependencies import
var express            = require('express');
var http               = require('http');
var cheerio            = require('cheerio');
var cheerioTableparser = require('cheerio-tableparser');
const htmlToJson       = require('html-to-json');
const HtmlTableToJson  = require('html-table-to-json');
var app                = express();
const { Composer }     = require('micro-bot')
const application      = new Composer()
var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./client_secret.json');
var doc = new GoogleSpreadsheet('14i-pbeTwRkUslD0BsUink6YiqgW16W0ttDrs9iiXZrI');

// Data Tracker
var isSunday;
var isMonday;
var isTuesday;
var isWednesday;
var isThursday;
var isFriday;
var isSaturday;

//Express Gedöns
//For avoidong Heroku $PORT error
app.set('port', (process.env.PORT || 5000));

app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});
//-------------------------------

const regex = new RegExp(/./g)

const buttonStrings = ["Speiseplan für Heute", "Speiseplan für Morgen"];

application.hears(buttonStrings[0], (ctx) => {
  var currentUser = ctx.message.from.username;
  if(currentUser === undefined){
    currentUser = ctx.message.from.id;
  }
  const currentDate = convertUnixTimestampToDate(ctx.message.date);

  var request = require('request');
    request('http://openmensa.org/c/57#11/52.4041/13.0264', function (error, response, body) {
      displayHTMLResponseForToday(body.toString(), ctx);
  });

  var option = {
    "parse_mode": "Markdown"
  };
  sendUserDataToGoogleSpreadsheets(currentDate, currentUser, buttonStrings[0]);
  ctx.telegram.sendMessage(ctx.message.chat.id, "Speiseplan für *heute* anzeigen", option);
});

application.hears(buttonStrings[1], (ctx) => {
  var currentUser = ctx.message.from.username;n
  if(currentUser === undefined){
    currentUser = ctx.message.from.id;
  }
  const currentDate = convertUnixTimestampToDate(ctx.message.date);

  var request = require('request');
    request('http://openmensa.org/c/57#11/52.4041/13.0264', function (error, response, body) {
      displayHTMLResponseForTomorrow(body.toString(), ctx);
  });
  var option = {
      "parse_mode": "Markdown"
  };
  sendUserDataToGoogleSpreadsheets(currentDate, currentUser, buttonStrings[1]);
  ctx.telegram.sendMessage(ctx.message.chat.id, `Speiseplan für *morgen* anzeigen`, option);
});

application.hears(regex, (ctx) => {
  var option = {
              "parse_mode": "Markdown",
              "reply_markup": {  "keyboard": [[buttonStrings[0]], [buttonStrings[1]]]  }
  };
  ctx.telegram.sendMessage(ctx.message.chat.id, "*Welchen* Speiseplan möchtest du sehen?", option);
});


function displayHTMLResponseForToday(html, ctx){
  $ = cheerio.load(html);

  setCurrentDate();

  // Send message properties
  var option = {
    "parse_mode": "Markdown"
  };

  if(isSaturday || isSunday){
    ctx.telegram.sendMessage(ctx.message.chat.id, 'Am *Wochenende* gibts in der Mensa nix zu futtern', option);
    return;
  }

  var meal = {
    date: $('#remote-canteens-show > header > h2').text(),
    html: $('.meals').eq(0).html(),
    angebot1: {
      title: null,
      name: null
    },
    angebot2: {
      title: null,
      name: null
    },
    angebot3: {
      title: null,
      name: null
    },
    angebot4: {
      title: null,
      name: null
    }
  }

  //reinitialize html table
  $ = cheerio.load(meal.html);
  meal.angebot1.title = $('li:nth-child(1) > h3').text();
  meal.angebot1.name = $('li:nth-child(1) > ul > li > p').text().replace(/(\r\n|\n|\r)/gm,"");

  meal.angebot2.title = $('li:nth-child(2) > h3').text();
  meal.angebot2.name = $('li:nth-child(2) > ul > li > p').text().replace(/(\r\n|\n|\r)/gm,"");

  meal.angebot3.title = $('li:nth-child(3) > h3').text();
  meal.angebot3.name = $('li:nth-child(3) > ul > li > p').text().replace(/(\r\n|\n|\r)/gm,"");

  meal.angebot4.title = $('li:nth-child(4) > h3').text();
  meal.angebot4.name = $('li:nth-child(4) > ul > li > p').text().replace(/(\r\n|\n|\r)/gm,"");

  ctx.telegram.sendMessage(ctx.message.chat.id,
      '*' + meal.angebot1.title + '* : ' + '\n' + meal.angebot1.name + '\n' +
      '*' + meal.angebot2.title + '* : ' + '\n' + meal.angebot2.name + '\n' +
      '*' + meal.angebot3.title + '* : ' + '\n' + meal.angebot3.name + '\n' +
      '*' + meal.angebot4.title + '* : ' + '\n' + meal.angebot4.name + '\n', option);
}

function displayHTMLResponseForTomorrow(html, ctx){
  $ = cheerio.load(html);

  setCurrentDate();

  // Send message properties
  var option = {
    "parse_mode": "Markdown"
  };


  if(isFriday || isSaturday){
    ctx.telegram.sendMessage(ctx.message.chat.id, 'Am *Wochenende* gibts in der Mensa nix zu futtern', option);
    return;
  }

  var meal = {
    date: $('#remote-canteens-show > header > h2').text(),
    html: $('.meals').eq(1).html(),
    angebot1: {
      title: null,
      name: null
    },
    angebot2: {
      title: null,
      name: null
    },
    angebot3: {
      title: null,
      name: null
    },
    angebot4: {
      title: null,
      name: null
    }
  }


  //reinitialize html table
  $ = cheerio.load(meal.html);
  meal.angebot1.title = $('li:nth-child(1) > h3').text();
  meal.angebot1.name = $('li:nth-child(1) > ul > li > p').text().replace(/(\r\n|\n|\r)/gm,"");

  meal.angebot2.title = $('li:nth-child(2) > h3').text();
  meal.angebot2.name = $('li:nth-child(2) > ul > li > p').text().replace(/(\r\n|\n|\r)/gm,"");

  meal.angebot3.title = $('li:nth-child(3) > h3').text();
  meal.angebot3.name = $('li:nth-child(3) > ul > li > p').text().replace(/(\r\n|\n|\r)/gm,"");

  meal.angebot4.title = $('li:nth-child(4) > h3').text();
  meal.angebot4.name = $('li:nth-child(4) > ul > li > p').text().replace(/(\r\n|\n|\r)/gm,"");

  ctx.telegram.sendMessage(ctx.message.chat.id,
      '*' + meal.angebot1.title + '* : ' + '\n' + meal.angebot1.name + '\n' +
      '*' + meal.angebot2.title + '* : ' + '\n' + meal.angebot2.name + '\n' +
      '*' + meal.angebot3.title + '* : ' + '\n' + meal.angebot3.name + '\n' +
      '*' + meal.angebot4.title + '* : ' + '\n' + meal.angebot4.name + '\n', option);
}


/* function that determines the current day triggered by the user request */
function setCurrentDate(){
  var day = new Date().getDay();
  isSunday = (day == 0);
  isMonday = (day == 1);
  isTuesday = (day == 2);
  isWednesday = (day == 3);
  isThursday = (day == 4);
  isFriday = (day == 5);
  isSaturday = (day == 6);
}

function sendUserDataToGoogleSpreadsheets(currentDate, usedUsername, usedCommand){
  doc.useServiceAccountAuth(creds, function (err, command) {
    doc.addRosw(1, { msg_date: currentDate, user_name: usedUsername, command: usedCommand}, function(){
      console.log('geil!');
    })
  });
}

function convertUnixTimestampToDate(unix_timestamp){
  var date = new Date(unix_timestamp*1000);
  /*var day = date.getDay();
  var hours = date.getHours();
  var minutes = "0" + date.getMinutes();
  var seconds = "0" + date.getSeconds();

  return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);*/
  return date.toISOString();
}


//exportiert ALLES!!!!!
module.exports = application

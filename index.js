'use strict';

// Requiring packages. Alexa SDK, HTTPS...
const Alexa = require('alexa-sdk');
const https = require('https');


// Functions for all of the handlers.
const handlers = {
  // First handler, for dealing with skill launch.
  'LaunchRequest' :  function() {
    let greetReply = greetings[(Math.floor(Math.random() * greetings.length))];
    this.response.speak(addSpeehconSSML(greetReply));
    this.emit(`:responseReady`);
  },

  // Setting up fake reminders.
  'ReminderIntent' : function() {

  },

  // Handling search requests.
  'AMAZON.SearchAction' : function() {

  },

  // Handling requests for more.
  'AMAZON.MoreIntent' : function() {
    
  },

  // Stop
  'AMAZON.StopIntent' : function() {
    let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
    this.response.speak(addSpeehconSSML(farewellReply));
    this.emit(':responseReady');
  },

  // Cancel
  'AMAZON.CancelIntent' : function() {
    let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
    this.response.speak(addSpeehconSSML(farewellReply));
    this.emit(':responseReady');
  },

  'SessionEndedRequest' : function() {
//    console.log('session ended!');
//    this.emit(':saveState', true);
  },

  'Unhandled' : function() {
    let confusionReply = confusion[(Math.floor(Math.random() * confusion.length))];
    this.response.speak(addSpeehconSSML(confusionReply));
    this.emit(':responseReady');
  }

};

// Registering the handlers and setting up database.
exports.handler = function(event, context, callback){
  const alexa = Alexa.handler(event, context);
  alexa.dynamoDBTableName = 'wickedStepmom';
  alexa.registerHandlers(handlers);
  alexa.execute();
};

// Functions outside of the handlers.


// This function takes the text and checks for Speechcons, adding appropriate SSML as necessary.
function addSpeehconSSML (text) {
  speechcons.forEach((element) => {
    let elementWithSSML=',<say-as interpret-as="interjection">'+element+'</say-as>,';
    text = text.replace(element,elementWithSSML);
  });
  console.log(text);
  return text;
}

////
////  Welcome to Array Town! Everything below this line
////  are arrays of strings for various voice commands.
////  Enjoy your stay!
////

// An array of strings for pointed greetings.
const greetings = [
  `Oh, you again.`,
  `This had better be quick, I'm hungover.`,
  `Hi, have you gained weight?`,
  `Just to start I'm going to say I don't like your tone.`,
  `What can I do for you, my least favorite?`,
  `Hello, tubby.`,
  `I'm here, ready to do what you can't.`
];

// Things to say for unhandled requests.
const confusion = [
  `You're not making any sense.`,
  `I have no idea what you're talking about.`,
  `I would ask you to say that again, but I'd prefer you didn't.`
];

// An array of strings for pointed greetings.
const farewells = [
  `Well that's just perfect. Goodbye.`,
  `I don't care for your tone. Goodbye.`,
  `Buh bye`,
  `I'm done with you. Bye.`,
  `I don't have time for this. Bye.`,
  `I'm leaving now.`,
  `Good riddance.`
];

// List of valid speechcons
const speechcons = ["abracadabra","achoo","aha","ahem","ahoy","all righty","aloha",
"aooga","argh","arrivederci","as you wish","au revoir","aw man","baa",
"bada bing bada boom","bah humbug","bam","bang","batter up","bazinga",
"beep beep","bingo","blah","blarg","blast","boing","bon appetit","bonjour",
"bon voyage","boo","boo hoo","boom","booya","bravo","bummer","caw","cha ching",
"checkmate","cheerio","cheers","cheer up","chirp","choo choo","clank",
"click clack","cock a doodle doo","coo","cowabunga","darn","ding dong","ditto",
"d’oh","dot dot dot","duh","dum","dun dun dun","dynomite","eek","eep",
"encore","en gard","eureka","fancy that","geronimo","giddy up","good grief",
"good luck","good riddance","gotcha","great scott","heads up","hear hear",
"hip hip hooray","hiss","honk","howdy","hurrah","hurray","huzzah","jeepers creepers",
"jiminy cricket","jinx","just kidding","kaboom","kablam","kaching","kapow",
"katchow","kazaam","kerbam","kerboom","kerching","kerchoo","kerflop",
"kerplop","kerplunk","kerpow","kersplat","kerthump","knock knock","le sigh",
"look out","mamma mia","man overboard","mazel tov","meow","merci","moo",
"nanu nanu","neener neener","no way","now now","oh boy","oh brother","oh dear",
"oh my","oh snap","oink","okey dokey","oof","ooh la la","open sesame","ouch",
"oy","phew","phooey","ping","plop","poof","pop","pow","quack","read ‘em and weep",
"ribbit","righto","roger","ruh roh","shucks","splash","spoiler alert","squee",
"swish","swoosh","ta da","ta ta","tee hee","there there","thump","tick tick tick",
"tick-tock","touche","tsk tsk","tweet","uh huh","uh oh","voila","vroom",
"wahoo","wah wah","watch out","way to go","well done","well well","wham",
"whammo","whee","whew","woof","whoops a daisy","whoosh","woo hoo","wow",
"wowza","wowzer","yadda yadda yadda","yay","yikes","yippee","yoink","yoo hoo",
"you bet","yowza","yowzer","yuck","yum","zap","zing","zoinks",];

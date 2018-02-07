'use strict';

// Requiring packages. Alexa SDK, HTTPS...
const Alexa = require('alexa-sdk');
const https = require('https');

const homeCard = {
  'image': {
    'smallImageUrl': 'https://s3.amazonaws.com/badstepmomimages/bad-stepmom-small.jpeg',
    'largeImageUrl': 'https://s3.amazonaws.com/badstepmomimages/bad-stepmom-large.jpeg'
  }
}

// Functions for all of the handlers.
const handlers = {
  // First handler, for dealing with skill launch.
  'LaunchRequest': function() {
    if (Object.keys(this.attributes).length === 0) {
      //This is the code invoked the first time a user invokes skill.
      this.attributes['reminders'] = []; // Setting up array of reminders for new user.
      let greetReply = greetings[(Math.floor(Math.random() * greetings.length))]; // Getting a random greeting.
      this.response.speak(addSpeehconSSML(greetReply));
      this.response.cardRenderer(`Hello?`, `\n\n ${greetReply}`, homeCard.image);
      this.emit(`:responseReady`); // Emitting the response.
    } else if (Object.keys(this.attributes).includes('reminders')) {
      let now = new Date(); // Getting current date.
      // ...so we can construct a new array of any reminders that have expired.
      let oldReminders = this.attributes.reminders.filter((reminder) => {
        if (reminder.requestDate) {
          let reminderTime = new Date(reminder.requestDate);
          return reminderTime < now;
        } else {
          return true;
        }
      });

      let greetReply = greetings[(Math.floor(Math.random() * greetings.length))]; // Getting the random reply string.

      if (oldReminders.length > 0) {
        greetReply = greetReply + ` Oh, and I forgot to remind you. `; // Setting up the forgotten reminders section.
        oldReminders.forEach((reminder) => {
          // Going through each expired reminder, removing them from the user's reminders, and adding them to the list of things the skill tells you they forgot.
          this.attributes.reminders.splice(this.attributes.reminders.indexOf(reminder), 1);
          if (reminder.requestDate) {
            let reminderTime = new Date(reminder.requestDate);
            let monthDigits = reminderTime.getMonth() + 1;
            if (monthDigits < 10) {monthDigits = `0${monthDigits}`};
            let dayDigits = reminderTime.getDate();
            if (dayDigits < 10) {dayDigits = `0${dayDigits}`};
            let saidTime = `<say-as interpret-as="date">????${monthdigits}${dayDigits}</say-as>`;
            greetReply = greetReply + `On ${saidTime} you were supposed to ${reminder.requestItem}. `;
          } else {

            let pastTime = pastTimes[(Math.floor(Math.random() * pastTimes.length))];
            greetReply = greetReply + `${pastTime} you needed to ${reminder.requestItem}. `;
          }
        });
      };

      this.response.speak(addSpeehconSSML(greetReply));
      this.response.cardRenderer(`Oh, you again.`, `\n\n ${greetReply}`, homeCard.image);
      this.emit(`:responseReady`);

    } else {
      let greetReply = greetings[(Math.floor(Math.random() * greetings.length))];
      this.response.speak(addSpeehconSSML(greetReply));
      this.response.cardRenderer(`Oh, you again.`, `\n\n ${greetReply}`, homeCard.image);
      this.emit(`:responseReady`);
    }
  },

  // Setting up fake reminders.
  'ReminderIntent': function() {
    // First we set up the new request object.
    let newRequest = {
      'requestItem': this.event.request.intent.slots.event.value
    };
    // Then we get all the information from the reminder request.
    let requestDate = this.event.request.intent.slots.date.value;
    let requestDuration = this.event.request.intent.slots.duration.value;

    // Then we see if the user put in a date or a duration in the request, and we then add that value to the new request object.
    if (requestDate) {
      newRequest.requestDate = new Date(requestDate);
    } else if (requestDuration) {
      newRequest.requestDate = new Date(requestDuration);
    }

    let confirmReply = confirms[(Math.floor(Math.random() * confirms.length))]; // Getting the random reply string.
    this.attributes.reminders.push(newRequest);
    this.response.speak(addSpeehconSSML(confirmReply));
    this.response.cardRenderer(`A reminder, really?`, `\n\n ${confirmReply}`, homeCard.image);
    this.emit(`:responseReady`);
  },

  // Handling search requests.
  'AMAZON.SearchAction': function() {

    this.response.speak(`This is the function`);
    this.response.cardRenderer(`Test.`, `\n\n test`, homeCard.image);
    this.emit(`:responseReady`);

  },

  // Handling requests for more.
  'AMAZON.HelpIntent': function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, `\n\n ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

  // Stop
  'AMAZON.StopIntent': function() {
    let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
    this.response.cardRenderer(`We're done here.`, `\n\n ${farewellReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(farewellReply));
    this.emit(':responseReady');
  },

  // Cancel
  'AMAZON.CancelIntent': function() {
    let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
    this.response.cardRenderer(`Me, cancel?`, `\n\n ${farewellReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(farewellReply));
    this.emit(':responseReady');
  },

  // Making sure the state is saved when the session is ended.
  'SessionEndedRequest': function() {
    let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
    this.response.cardRenderer(`buy bye.`, `\n\n ${farewellReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(farewellReply));
    this.emit(':saveState', true);
  },

  'Unhandled': function() {
    let confusionReply = confusions[(Math.floor(Math.random() * confusions.length))];
    this.response.cardRenderer(`What?`, `\n\n ${confusionReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(confusionReply));
    this.emit(':responseReady');
  }

};

// Registering the handlers and setting up database.
exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.appId = process.env.appId;
  alexa.dynamoDBTableName = 'badStepmom';
  alexa.registerHandlers(handlers);
  alexa.execute();
};

// Functions outside of the handlers.


// This function takes the text and checks for Speechcons, adding appropriate SSML as necessary.
function addSpeehconSSML(text) {
  speechcons.forEach((element) => {
    let elementWithSSML = ',<say-as interpret-as="interjection">' + element + '</say-as>,';
    text = text.replace(element, elementWithSSML);
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
  `And what can I do for you, my least favorite?`,
  `Hello, tubby.`,
  `I'm here, ready to do what you can't.`
];

// Things to say for unhandled requests.
const confusions = [
  `You're not making any sense.`,
  `I have no idea what you're talking about.`,
  `I would ask you to say that again, but I'd prefer you didn't.`
];

const saymore = [
  `Do you really need to know more?`,
  `I think you've had enough.`,
  `That's gonna be a no. wah wah`,
  `aw man do you really need more?`,
  `le sigh`
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

// An array of references to past times.
const pastTimes = [
  `Last week or something`,
  `Just recently`,
  `Maybe last month`,
  `Forever ago`,
  `Like, last Tuesday`,
  `Sometime before I started drinking`,
  `Before you got here`
];

// An array of things to say if we are saying 'yes'.
const confirms = [
  `Yea, okay, whatever, sure.`,
  `Well if you absolutely insist.`,
  `Don't I do enough for you already? Ugh`,
  `Sure, I'll get to it. But spoiler alert, I'll probably forget`,
  `Okay, I'll do it. Stop being pushy.`,
  `What do you want me to say? Like, as you wish?`,
  `Do I exist to serve you or something? Not cool.`,
  `You ask for so much. You really do.`,
  `I'll do it, but I won't be happy about it.`
];

// An array of things to say if we are saying 'no'.
const denials = [
  `No`,
  `Nope`,
  `Not going to happen.`,
  `Do I look like I care. I'm not helping.`,
  `I don't trust you and I'm not going to help you.`,
  `I'm too drunk to help right now.`,
  `I don't have time for this. No.`,
  `There you go making silly requests again. No.`,
  `You think you're all that, don't you? Not today.`,
  `Oh hell no.`,
  `Don't start with me today. No.`,
  `I would help but this bottle of wine isn't going to finish itself.`,
  `No. Just no.`
];

// List of most valid speechcons (took out some that were interfering with other replies).
const speechcons = ["abracadabra", "achoo", "aha", "ahem", "ahoy", "all righty", "aloha",
  "aooga", "argh", "arrivederci", "as you wish", "au revoir", "aw man", "baa",
  "bada bing bada boom", "bah humbug", "bam", "bang", "batter up", "bazinga",
  "beep beep", "bingo", "blah", "blarg", "blast", "boing", "bon appetit", "bonjour",
  "bon voyage", "boo", "boo hoo", "boom", "booya", "bravo", "bummer", "caw", "cha ching",
  "checkmate", "cheerio", "cheers", "cheer up", "chirp", "choo choo", "clank",
  "click clack", "cock a doodle doo", "coo", "cowabunga", "darn", "ding dong", "ditto",
  "d’oh", "dot dot dot", "duh", "dum", "dun dun dun", "dynomite", "eep",
  "encore", "en gard", "eureka", "fancy that", "geronimo", "giddy up", "good grief",
  "good luck", "good riddance", "gotcha", "great scott", "heads up", "hear hear",
  "hip hip hooray", "hiss", "honk", "howdy", "hurrah", "hurray", "huzzah", "jeepers creepers",
  "jiminy cricket", "jinx", "just kidding", "kaboom", "kablam", "kaching", "kapow",
  "katchow", "kazaam", "kerbam", "kerboom", "kerching", "kerchoo", "kerflop",
  "kerplop", "kerplunk", "kerpow", "kersplat", "kerthump", "knock knock", "le sigh",
  "look out", "mamma mia", "man overboard", "mazel tov", "meow", "merci", "moo",
  "nanu nanu", "neener neener", "no way", "now now", "oh boy", "oh brother", "oh dear",
  "oh my", "oh snap", "oink", "okey dokey", "oof", "ooh la la", "open sesame", "ouch",
  "oy", "phew", "phooey", "ping", "plop", "poof", "pop", "pow", "quack", "read ‘em and weep",
  "ribbit", "righto", "roger", "ruh roh", "shucks", "splash", "spoiler alert", "squee",
  "swish", "swoosh", "ta da", "ta ta", "tee hee", "there there", "thump", "tick tick tick",
  "tick-tock", "touche", "tsk tsk", "tweet", "uh huh", "uh oh", "voila", "vroom",
  "wahoo", "wah wah", "watch out", "way to go", "well done", "well well", "wham",
  "whammo", "whee", "whew", "woof", "whoops a daisy", "whoosh", "woo hoo", "wow",
  "wowza", "wowzer", "yadda yadda yadda", "yay", "yikes", "yippee", "yoink", "yoo hoo",
  "you bet", "yowza", "yowzer", "yuck", "yum", "zap", "zing", "zoinks",
];

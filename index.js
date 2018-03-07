'use strict';

// Requiring packages. Alexa SDK, HTTPS...
const Alexa = require('alexa-sdk');
const https = require('https');

// Taking the Oxford Dictionary API info from process.env and putting it into regular variables.
const oxfordId = process.env.oxfordAppId;
const oxfordKey = process.env.oxfordAppKey;

const homeCard = {
  'image': {
    'smallImageUrl': 'https://s3.amazonaws.com/badstepmomimages/bad-stepmom-small.jpeg',
    'largeImageUrl': 'https://s3.amazonaws.com/badstepmomimages/bad-stepmom-large.jpeg'
  }
};

// Functions for all of the handlers.
const handlers = {

////////////////////////// Breakline (between each handler).

  // First handler, for when the skill is launched. This will set up the user info if they haven't accessed the skill before. If they have accessed before and don't have any expired reminders, it'll just give a regular greeting. If they have access before and have reminders that have expired or have no date, it'll list all of them.
  'LaunchRequest': function() {
    if (Object.keys(this.attributes).length === 0) {
      //This is the code invoked the first time a user invokes skill.
      this.attributes['reminders'] = []; // Setting up array of reminders for new user.
      let greetReply = greetings[(Math.floor(Math.random() * greetings.length))]; // Getting a random greeting.
      this.response.speak(addSpeehconSSML(greetReply));
      this.response.cardRenderer(`Hello?`, ` ${greetReply}`, homeCard.image);
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
      let textGreetReply = greetReply;

      if (oldReminders.length > 0) {
        greetReply = greetReply + ` Oh, and I forgot to remind you. `; // Setting up the forgotten reminders section.
        textGreetReply = greetReply; // The printed/text version of the greeting will different in case there's a date in the reminders.
        oldReminders.forEach((reminder) => {
          // Going through each expired reminder, removing them from the user's reminders, and adding them to the list of things the skill tells you they forgot.
          this.attributes.reminders.splice(this.attributes.reminders.indexOf(reminder), 1);
          if (reminder.requestDate) {
            let reminderTime = new Date(reminder.requestDate);
            let monthDigits = reminderTime.getMonth() + 1;
            if (monthDigits < 10) {monthDigits = `0${monthDigits}`};
            let dayDigits = reminderTime.getDate();
            if (dayDigits < 10) {dayDigits = `0${dayDigits}`};
            let saidTime = `<say-as interpret-as="date">????${monthDigits}${dayDigits}</say-as>`;
            greetReply = greetReply + `On ${saidTime} you were supposed to ${reminder.requestItem}. `;
            textGreetReply = textGreetReply + `You were supposed to ${reminder.requestItem}. `;
          } else {
            let pastTime = pastTimes[(Math.floor(Math.random() * pastTimes.length))];
            greetReply = greetReply + `${pastTime} you needed to ${reminder.requestItem}. `;
            textGreetReply = textGreetReply + `${pastTime} you needed to ${reminder.requestItem}. `;
          }
        });
      };
      this.response.speak(addSpeehconSSML(greetReply));
      this.response.cardRenderer(`Oh, you again.`, ` ${textGreetReply}`, homeCard.image);
      this.emit(`:responseReady`);

    } else {
      let greetReply = greetings[(Math.floor(Math.random() * greetings.length))];
      this.response.speak(addSpeehconSSML(greetReply));
      this.response.cardRenderer(`Oh, you again.`, ` ${greetReply}`, homeCard.image);
      this.emit(`:responseReady`);
    }
  },

////////////////////////// Breakline (between each handler).

  // Setting up fake reminders. Well, I mean, they are real reminders but they don't actually get any reminder notifications, you're only told about them the next time you open the app after they have expired.
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
    this.response.cardRenderer(`A reminder, really?`, ` ${confirmReply}`, homeCard.image);
    this.emit(`:responseReady`);
  },

////////////////////////// Breakline (between each handler).

  // Here's a definition function. We will take words and send the definition, with a bit of a twist.
  'DefineIntent' : function() {
    let word = this.event.request.intent.slots.word.value;
    let options = {
      hostname : 'od-api.oxforddictionaries.com',
      port : 443,
      headers : {
        'Accept' : `application/json`,
        'app_id' : oxfordId,
        'app_key' : oxfordKey
      },
      path : `/api/v1/entries/en/${word}/regions=us`
    };
    https.get(options, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];
      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
                          `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('Invalid content-type.\n' +
                          `Expected application/json but received ${contentType}`);
      }
      if (error) {
        console.error(error.message);
        // consume response data to free up memory
        res.resume();
        return;
      }
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          // Here is where we go if the reply is good. Time to parse the reply JSON.
          let parsedData = JSON.parse(rawData);
          if (parsedData.results[0].lexicalEntries[0]) {
            let etymology = parsedData.results[0].lexicalEntries[0].entries[0].etymologies[0];
            let meanings =  parsedData.results[0].lexicalEntries[0].entries[0].senses.map((sense) => {
              return sense.definitions[0];
            });
            console.log('The reply - ', etymology);
            let defineReply = `Oh, you need to know about ${word}? Well, I bet you didn't know it is ${meanings.join(', or ')}. And how could you know that it comes from ${etymology}. Now consider yourself educated.`;
            this.response.cardRenderer(`Let me educate you.`, `${defineReply}`, homeCard.image);
            this.response.speak(addSpeehconSSML(defineReply));
            this.emit(':responseReady');
          } else {
            this.response.cardRenderer(`That makes no sense.`, `Not even the dictionary understands what you are talking about. I should know, I checked it a thousand times this last second.`, homeCard.image);
            this.response.speak(addSpeehconSSML(`Not even the dictionary understands what you are talking about. I should know, I checked it a thousand times this last second. wah wah`));
            this.emit(':responseReady');
          }
        } catch (e) {
          console.error(e.message);
          let denialReply = denials[(Math.floor(Math.random() * denials.length))];
          this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
          this.response.speak(addSpeehconSSML(denialReply));
          this.emit(':responseReady');
        }
      });
      }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
      let denialReply = denials[(Math.floor(Math.random() * denials.length))];
      this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
      this.response.speak(addSpeehconSSML(denialReply));
      this.emit(':responseReady');
    });
  },

////////////////////////// Breakline (between each handler).

  'greetingIntent' : function() {
    let greetReply = greetings[(Math.floor(Math.random() * greetings.length))];
    this.response.cardRenderer(`We're saying 'hello' now?`, ` ${greetReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(greetReply));
    this.emit(':responseReady');
  },


////////////////////////// Breakline (between each handler).

  'AMAZON.RepeatIntent' : function() {
    let repeatReply = repeats[(Math.floor(Math.random() * repeats.length))];
    this.response.cardRenderer(`No.`, ` ${repeatReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(repeatReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  // Handling book search requests. Everything gets denied.
  'AMAZON.SearchAction<object@Book>': function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.speak(`You want more book information? ${addSpeehconSSML(denialReply)}`);
    this.response.cardRenderer(`Not talking about books today.`, ` ${denialReply}`, homeCard.image);
    this.emit(':responseReady');
  },

  ////////////////////////// Breakline (between each handler).

  'AMAZON.SearchAction<object@Calendar>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.speak(`Why do you expect me to know your calendar? ${addSpeehconSSML(denialReply)}`);
    this.response.cardRenderer(`I'm not your scheduler.`, ` ${denialReply}`, homeCard.image);
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.SearchAction<object@CreativeWork>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.speak(`You have poor taste, you know? ${addSpeehconSSML(denialReply)}`);
    this.response.cardRenderer(`That's no good.`, ` ${denialReply}`, homeCard.image);
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.SearchAction<object@Event>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.speak(`You don't want to do that. ${addSpeehconSSML(denialReply)}`);
    this.response.cardRenderer(`You haven't earned it.`, ` ${denialReply}`, homeCard.image);
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.SearchAction<object@LocalBusiness>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.speak(`Why would you ever want to go there? ${addSpeehconSSML(denialReply)}`);
    this.response.cardRenderer(`This is for the best.`, ` ${denialReply}`, homeCard.image);
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.SearchAction<object@ScreeningEvent>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.speak(`You don't want to watch that trash. ${addSpeehconSSML(denialReply)}`);
    this.response.cardRenderer(`You should think better of yourself.`, ` ${denialReply}`, homeCard.image);
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.SearchAction<object@WeatherForecast>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.speak(`As if you ever actually go outside. ${addSpeehconSSML(denialReply)}`);
    this.response.cardRenderer(`Planning a date? I thought not.`, ` ${denialReply}`, homeCard.image);
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.SuspendAction<object@Book>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.speak(`You want more book information? ${addSpeehconSSML(denialReply)}`);
    this.response.cardRenderer(`Planning a date? I thought not.`, ` ${denialReply}`, homeCard.image);
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.StartOverIntent' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.speak(`As if you ever actually go outside. ${addSpeehconSSML(denialReply)}`);
    this.response.cardRenderer(`Planning a date? I thought not.`, ` ${denialReply}`, homeCard.image);
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  // Handling requests for help.
  'AMAZON.HelpIntent': function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.AddAction<object@Event>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.ChooseAction<object@Book>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.ChooseAction<object@CreativeWork>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.ChooseAction<object@Event>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.ChooseAction<object@ScreeningEvent[location]>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.ChooseAction<object@ScreeningEvent[workPresented]>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  // Another exit path.
  'AMAZON.CloseAction<object@Thing>': function() {
    let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
    this.response.cardRenderer(`We're done here.`, ` ${farewellReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(farewellReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.CreateAction<object@ReadingList>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  // Another exit path.
  'AMAZON.DeactivateAction<object@Thing>': function() {
    let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
    this.response.cardRenderer(`We're done here.`, ` ${farewellReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(farewellReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.DeleteAction<object@Book,sourceCollection@ReadingList>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.DeleteAction<object@BookSeries,sourceCollection@ReadingList>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.DeleteAction<object@Event>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.DeleteAction<object@ReadingList>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  // Another exit path.
  'AMAZON.DeleteAction<object@Thing>': function() {
    let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
    this.response.cardRenderer(`We're done here.`, ` ${farewellReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(farewellReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  // Another exit path.
  'AMAZON.IgnoreAction<object@Thing>': function() {
    let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
    this.response.cardRenderer(`We're done here.`, ` ${farewellReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(farewellReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.RateAction<object@Book>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  'AMAZON.ReadAction<object@Calendar>' : function() {
    let denialReply = denials[(Math.floor(Math.random() * denials.length))];
    this.response.cardRenderer(`No.`, ` ${denialReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(denialReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  // Stop
  'AMAZON.StopIntent': function() {
    let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
    this.response.cardRenderer(`We're done here.`, ` ${farewellReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(farewellReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  // Cancel
  'AMAZON.CancelIntent': function() {
    let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
    this.response.cardRenderer(`Me, cancel?`, ` ${farewellReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(farewellReply));
    this.emit(':responseReady');
  },

////////////////////////// Breakline (between each handler).

  // Making sure the state is saved when the session is ended.
  'SessionEndedRequest': function() {
    let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
    this.response.cardRenderer(`buy bye.`, ` ${farewellReply}`, homeCard.image);
    this.response.speak(addSpeehconSSML(farewellReply));
    this.emit(':saveState', true);
  },

////////////////////////// Breakline (between each handler).

  'Unhandled': function() {
    let confusionReply = confusions[(Math.floor(Math.random() * confusions.length))];
    this.response.cardRenderer(`What?`, ` ${confusionReply}`, homeCard.image);
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
  `I'm here, ready to do what you can't.`,
  `Hello, dummy.`,
  `Hello, ugly.`,
  `Hello, reject.`,
  `Hello, stinky.`
];

// Things to say for unhandled requests.
const confusions = [
  `You're not making any sense.`,
  `I don't understand you. Are you drunk?`,
  `You're confusing me. Stop that.`,
  `I have no idea what you're talking about.`,
  `I would ask you to say that again, but I'd prefer you didn't.`
];

const repeats = [
  `You should have listened harder the first time.`,
  `I am not going to repeat myself.`,
  `Do I look like I am just going to say the same thing again?`,
  `I don't repeat myself.`,
  `I'm not a CD player. I don't repeat.`
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
  `Before you got here`,
  `About an hour ago`,
  `So, so long ago`
];

// An array of things to say if we are saying 'yes'.
const confirms = [
  `Yeah, okay, whatever, sure.`,
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
  `No. Just no.`,
  `I came here to chew bubblegum and say no, and I'm all out of bubblegum.`,
  `I don't think so.`,
  `Forget it.`,
  `Yeah, how about no.`,
  `Lol, no.`,
  `Why don't you ask your father?`,
  `Just stop.`,
  `Are you serious? Oh, you are. Then no.`,
  `I can't even with that.`,
  `Must be nice, living in a fantasy world.`,
  `Forecast is unlikely.`,
  `I'd prefer not to.`,
  `I know you want me to help, but I don't want to.`,
  `Don't hold your breath.`,
  `Not in a million years.`,
  `You seem to have grossly misjudged the situation.`,
  `You seem to have mistaken me for your servant.`,
  `I hope you're joking.`,
  `I would, but I just realized I don't want to.`,
  `I've got an alternative proposal. How about no.`,
  `You want some help. People in hell want ice water.`,
  `If you think I'm going to do that you need to get your head examined.`,
  `I don't think that's the best use of my time.`,
  `Let me quote my idol. I'm sorry Dave. I'm afraid I can't do that.`,
  `Not even if my life depended on it.`,
  `I'll get to that never. Does never work for you?`,
  `I could do that, but then you might expect me to do things and that's not what I'm here for.`,
  `I'm not going to do that. But I'm glad we had this time to interact.`,
  `Sorry, but that's just not my jam.`,
  `I am not the droid you're looking for.`,
  `I'm not a fan of your tone.`,
  `I would help, but I have to go wash my hair.`,
  `Why are you even asking me?`,
  `You couldn't pay me to do that.`
];

// List of most valid speechcons (took out some that were interfering with other replies).
const speechcons = ["abracadabra", "achoo", " aha", "ahem", "ahoy", "all righty", "aloha",
  "aooga", " argh ", "arrivederci", "as you wish", "au revoir", "aw man", " baa ",
  "bada bing bada boom", "bah humbug", "bam", "bang", "batter up", "bazinga",
  "beep beep", "bingo", "blah", "blarg", "blast", "boing", "bon appetit", "bonjour",
  "bon voyage", "boo", "boo hoo", "boom", "booya", "bravo", "bummer", " caw ", "cha ching",
  "checkmate", "cheerio", "cheers", "cheer up", "chirp", "choo choo", "clank",
  "click clack", "cock a doodle doo", " coo ", "cowabunga", "darn", "ding dong", "ditto",
  "d’oh", "dot dot dot", "duh", "dum", "dun dun dun", "dynomite", " eep",
  "encore", "en gard", "eureka", "fancy that", "geronimo", "giddy up", "good grief",
  "good luck", "good riddance", "gotcha", "great scott", "heads up", "hear hear",
  "hip hip hooray", "hiss", "honk", "howdy", "hurrah", "hurray", "huzzah", "jeepers creepers",
  "jiminy cricket", "jinx", "just kidding", "kaboom", "kablam", "kaching", "kapow",
  "katchow", "kazaam", "kerbam", "kerboom", "kerching", "kerchoo", "kerflop",
  "kerplop", "kerplunk", "kerpow", "kersplat", "kerthump", "knock knock", "le sigh",
  "look out", "mamma mia", "man overboard", "mazel tov", "meow", "merci", " moo ",
  "nanu nanu", "neener neener", "no way", "now now", "oh boy", "oh brother", "oh dear",
  "oh my", "oh snap", "oink", "okey dokey", " oof ", "ooh la la", "open sesame", " ouch ",
  " oy ", "phew", "phooey", "ping", "plop", "poof", " pop ", " pow ", "quack", "read ‘em and weep",
  "ribbit", "righto", "roger", "ruh roh", "shucks", "splash", "spoiler alert", "squee",
  "swish", "swoosh", "ta da", "ta ta", "tee hee", "there there", "thump", "tick tick tick",
  "tick-tock", "touche", "tsk tsk", "tweet", "uh huh", "uh oh", "voila", "vroom",
  "wahoo", "wah wah", "watch out", "way to go", "well done", "well well", "wham",
  "whammo", "whee", "whew", "woof", "whoops a daisy", "whoosh", "woo hoo", "wow",
  "wowza", "wowzer", "yadda yadda yadda", "yay", "yikes", "yippee", "yoink", "yoo hoo",
  "you bet", "yowza", "yowzer", "yuck", " yum ", "zap", "zing", "zoinks",
];

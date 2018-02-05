'use strict';

// Starting up the Alexa SDK.
const Alexa = require('alexa-sdk');

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

const farewells = [
  `Well that's just perfect. Goodbye.`,
  `I don't care for your tone. Goodbye.`,
  `Buh bye`,
  `I'm done with you. Bye.`,
  `I don't have time for this. Bye.`,
  `I'm leaving now.`
];


// Functions for all of the handlers.
const handlers = {
  // First handler, for dealing with skill launch.
  'LaunchRequest' :  function() {
      let greetReply = greetings[(Math.floor(Math.random() * greetings.length))];
      this.response.speak(greetReply);
      this.emit(`:responseReady`);
  },


  // Stop
  'AMAZON.StopIntent': function() {
      let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
      this.response.speak(farewellReply);
      this.emit(':responseReady');
  },

  // Cancel
  'AMAZON.CancelIntent': function() {
      let farewellReply = farewells[(Math.floor(Math.random() * farewells.length))];
      this.response.speak(farewellReply);
      this.emit(':responseReady');
  },

  'SessionEndedRequest': function() {
//    console.log('session ended!');
//    this.emit(':saveState', true);
  }

};

exports.handler = function(event, context, callback){
    const alexa = Alexa.handler(event, context);
//    alexa.dynamoDBTableName = 'wickedStepmom';
    alexa.registerHandlers(handlers);
    alexa.execute();
};

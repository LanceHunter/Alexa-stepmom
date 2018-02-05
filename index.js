'use strict';

var Alexa = require('alexa-sdk');

var handlers = {
  // Functions for all of the handlers.
  'LaunchRequest':


  // Stop
  'AMAZON.StopIntent': function() {
      this.response.speak(`Well that's just perfect. Goodbye.`);
      this.emit(':responseReady');
  },

  // Cancel
  'AMAZON.CancelIntent': function() {
      this.response.speak(`I don't care for your tone. Goodbye.`);
      this.emit(':responseReady');
  },

  'SessionEndedRequest': function() {
    console.log('session ended!');
    this.emit(':saveState', true);
  }

};

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.dynamoDBTableName = 'wickedStepmom';
    alexa.registerHandlers(handlers);
    alexa.execute();
};

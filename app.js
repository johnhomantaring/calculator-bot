'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());
// Create the service wrapper
var conversation = new Conversation({
  version_date: Conversation.VERSION_DATE_2017_04_21
});

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }
  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };

  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
    updateMessage(res,payload, data);
  });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(resHTTP,input, response) {
  var responseText = null;
  if (!response.output) {
  	console.log('No Output');
    response.output = {};
  } else {
  	// Check if the intent returned from Conversation service is add or multiply, // perform the calculation and update the response
    console.log("Opearion=="+response.context.action);
	if (response.context.action!=null ) {
		console.log('Calling getCalculationResult');
              response = getCalculationResult(resHTTP,response);
     }else{
       return resHTTP.json( response);
     }
  }
}

/**
* Get the operands, perform the calculation and update the response text based on the * calculation.
* @param {Object} response The response from the Conversation service
* @return {Object} The response with the updated message
*/
function getCalculationResult(resHTTP,response){ //An array holding the operands
var numbersArr = [];
// In case the user intent is add, perform the addition
// In case the intent is multiply, perform the multiplication
   var result = 0;
   if (response.context.action === 'add') {
     var arr = response.context.number_arr;
     for(var i in arr) { result += arr[i]; }
 } else if (response.context.action === 'multiply') {
   result = 1;
   var arr = response.context.number_arr;
   for(var i in arr) { result = result*arr[i]; }
  }

//send result back to conversation service
var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
var payload = {
    workspace_id: workspace,
    context: {
        conversation_id: response.context.conversation_id,
        system: response.context.system,
        dialog_turn_counter: response.context.dialog_turn_counter,
        dialog_request_counter: response.context.dialog_request_counter,
        action: null,
        result:result
    }
};
console.log("Before calling second iteration=====");
  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
    updateMessage(resHTTP,payload, data);
  });
}

module.exports = app;

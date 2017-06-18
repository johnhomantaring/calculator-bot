/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());
var workspace = '2aca8b40-c85d-43fd-a013-c4cbc0142b4b';
// Create the service wrapper
var conversation = new Conversation({
  // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
   username: 'f73ea4ad-8621-4ae1-87eb-3cab886f46b5',
   password: 'soELvOZZKhEd',
  url: 'https://gateway.watsonplatform.net/conversation/api',
  version_date: Conversation.VERSION_DATE_2017_04_21
});

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
  //var workspace = process.env.WORKSPACE_ID || '06051e21-3033-4e1d-aff6-955531db7b3e';

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
    //return response;
  }
/*  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;*/
  //return response;
}

/**
* Get the operands, perform the calculation and update the response text based on the * calculation.
* @param {Object} response The response from the Conversation service
* @return {Object} The response with the updated message
*/
function getCalculationResult(resHTTP,response){ //An array holding the operands
var numbersArr = [];
//Fill the content of the array with the entities of type 'sys-number'
/*for (var i = 0; i < response.entities.length; i++) {
    if (response.entities[i].entity === 'sys-number')
    {
        numbersArr.push(response.entities[i].value);
      }
}*/
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

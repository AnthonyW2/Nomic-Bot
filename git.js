/**
 * Command definitions module
 * 
 * @author Anthony Wilson
 */



"use strict";

const { exec } = require("child_process");



exports.pull = async (callback) => {
  
  exec("./git-pull-site", (error, stdout, stderr) => {
    
    callback({
      error: error,
      stdout: stdout,
      stderr: stderr
    });
    
  });
  
}

exports.push = async (message, callback) => {
  
  exec("./git-push-site " + SecureInfo.gitToken + " " + "'"+message+"'", (error, stdout, stderr) => {
    
    callback({
      error: error,
      stdout: stdout,
      stderr: stderr
    });
    
  });
  
}

exports.sync = async (callback) => {
  
  //Use git-diff to check whether the local repo is ahead of/behind the remote repo
  //Sync accordingly
  
}

//Identify if the local repo is ahead of or behind the remote repo
exports.status = async (callback) => {
  
  exec("./git-status-site", (error, stdout, stderr) => {
    
    callback({
      error: error,
      stdout: stdout,
      stderr: stderr
    });
    
  });
  
}

//exports.pull((out) => {
//  console.log("Pull:",out);
//});

//exports.push("Updated propositions", (out) => {
//  console.log("Push:",out);
//});



/*
"use strict";

const SecureInfo = require("./secureinfo.json");

const Config = require("./config.json");

const { Octokit } = require("@octokit/rest");

//const { b64encode } = require("base64");

const octokit = new Octokit({
  
  auth: SecureInfo.gitToken,
  
  userAgent: "NomicBot "+Config.version
  
})

exports.test = async () => {
  
  var rateLimit = await octokit.rest.rateLimit.get();
  
  console.log("Remaining requests:",rateLimit.data.rate.remaining);
  
  
  //console.log(Buffer.from("test").toString("base64"));
  
}

exports.updateRules = async (newRules) => {
  
  //Update rules.json
  await octokit.rest.repos.createOrUpdateFileContents(
    "anthonyw2",
    "Nomic",
    "Updated rules list",
    "Rules/rules.json",
    Buffer.from(newRules).toString("base64")
  );
  
}

exports.test();
*/



/*

"use strict";

const SecureInfo = require("./secureinfo.json");

const Config = require("./config.json");
const sitePath = Config.sitePath;

const GitHub = require("github-api");

const GH = new GitHub({
  username: "anthonyw2",
  password: SecureInfo.gitToken
});

//console.log("GH:",GH);

//Print the current rate limit
GH.getRateLimit().getRateLimit((error, result, request) => {
  
  if(error){
    console.error(error);
  }
  
  console.log("Requests used:",result.rate.used);
  console.log("Requests remaining:",result.rate.remaining);
  
});


//const AnthonyW2 = GH.getUser();

//console.log("me:",me);


var site = GH.getRepo("anthonyw2","Nomic");

//console.log("site:",site);

//site.getBranch("main", (error, result, request) => {
//  //console.log("error:",error);
//  console.log("Main branch:",result);
//  //console.log("request:",request);
//});

*/

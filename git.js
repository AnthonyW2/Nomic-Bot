/**
 * Command definitions module
 * 
 * @author Anthony Wilson
 */



"use strict";

const { exec } = require("child_process");



/**
 * @async
 * Pulls changes from the remote copy of the "Nomic" website repo.
 * @param {Function} callback Called when the git command finishes execution
 */
exports.pull = async (callback) => {
  
  exec("./git-pull-site", (error, stdout, stderr) => {
    
    callback({
      error: error,
      stdout: stdout,
      stderr: stderr
    });
    
  });
  
}

/**
 * @async
 * Pushes changes in the local copy of the "Nomic" website repo to the remote repo.
 * @param {string} message The commit message to use
 * @param {Function} callback Called when the git command finishes execution
 */
exports.push = async (message, callback) => {
  
  exec("./git-push-site " + SecureInfo.gitToken + " " + "'"+message+"'", (error, stdout, stderr) => {
    
    callback({
      error: error,
      stdout: stdout,
      stderr: stderr
    });
    
  });
  
}

/**
 * @async
 * Identify if the local repo is ahead of or behind the remote repo.
 * @param {Function} callback Called when the git command finishes execution
 */
exports.sync = async (callback) => {
  
  //Use git-diff to check whether the local repo is ahead of/behind the remote repo
  //Sync accordingly
  
}

/**
 * @async
 * Returns the output of "git status".
 * @param {Function} callback Called when the git command finishes execution
 */
exports.status = async (callback) => {
  
  exec("./git-status-site", (error, stdout, stderr) => {
    
    callback({
      error: error,
      stdout: stdout,
      stderr: stderr
    });
    
  });
  
}

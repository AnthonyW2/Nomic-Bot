/**
 * Magic (spells, plague doctor, syntheses, etc.) functionality module
 * 
 * @author Anthony Wilson
 */



"use strict";



/**
 * Describes the name and requirements for each spell.
 * 
 * The "cost" of a spell is formatted according to the following rules:
 * * XH + YI + ...
 *   where X & Y are (+) integers, and H & I are (usually different) Humors.
 * * A Humor is represented as either: R, B, Y, or K, (for Red, Blue, Yellow or Black, respectively).
 * * An "*" represents any Humor (chosen by the caster).
 * * A "†" or "‡" also represents any Humor, though *, †, and ‡ must be different Humors.
 * 
 * The list of requirements specifies what info the caster needs to provide, being:
 * * H, or P (for Humor or Player, respectively).
 */
exports.spells = [
  {
    name: "Imbue",
    type: "basic",
    cost: "5*",
    requires: ["H","P"]
  },
  {
    name: "Purge",
    type: "basic",
    cost: "5*",
    requires: ["H","P"]
  },
  {
    name: "Transfuse",
    type: "basic",
    cost: "0",
    requires: ["H","P","H","P"]
  },
  {
    name: "Concentrate",
    type: "basic",
    cost: "0",
    requires: ["H"]
  },
  {
    name: "Dilution",
    type: "basic",
    cost: "0",
    requires: ["H"]
  }
];

/**
 * Describes the name an requirement for each effect.
 * 
 * The frequency ("freq") of the effect is formatted according to the following rules:
 * * XS + YT, where X & Y are (+) integers, and S & T are each a period of time.
 * * A period of time is either "o", "s", "c", or "i" (for Oscillations, seconds, constantly, or once-off imediately, respectively).
 * 
 * The way the effect affects the target or caster is formatted according to the following rules:
 * * E1 + E2 + ... where each E is a different effect.
 * * The effect may be XH, where X is an integer, and H is a Humor (R, B, Y, K, or ? - ? is a random Humor).
 * * The effect may be "custom", in which case its functionality is handled wherever necessary.
 */
exports.effects = [
  {
    name: "Bleeding",
    freq: "1o",
    targetEffect: "-5R",
    casterEffect: ""
  },
  {
    name: "Sedated",
    freq: "1i",
    targetEffect: "custom",
    casterEffect: "custom"
  },
  {
    name: "Weakened",
    freq: "1c",
    targetEffect: "custom",
    casterEffect: ""
  },
  {
    name: "Enraged",
    freq: "1o",
    targetEffect: "3?",
    casterEffect: ""
  },
  {
    name: "Cursed",
    freq: "1o",
    targetEffect: "custom",
    casterEffect: ""
  },
  {
    name: "Necrosis",
    freq: "1o",
    targetEffect: "1K",
    casterEffect: ""
  },
  {
    name: "Burned",
    freq: "1c",
    targetEffect: "custom",
    casterEffect: ""
  },
  {
    name: "Starstruck",
    freq: "1c",
    targetEffect: "custom",
    casterEffect: ""
  }
];



/**
 * Given a list of users, return the corresponding player objects and detect illegal votes
 * @param {Message} propositionMsg Main message of the proposition
 * @param {int} propositionID ID of proposition
 * @param {string} options Control extra functionality
 * @returns {MessageEmbed} 
 */
exports.storePlayerSpellCast = (caster, spell, targets, humors) => {
  
  //Create the reply as an embed
  //var response = new MessageEmbed();
  
  //Get the current state of localstorage
  var localStorage = require("./localstorage.json");
  
  //PDData = decodeVaultData(localStorage.pddata);
  var PDData = {};
  
  
  //There are currently 24 spells to account for
  
  
  console.log("caster:",caster);
  console.log("spell:",spell);
  console.log("targets:",targets);
  console.log("humors:",humors);
  
  
  //Store new data in local storage
  localStorage.pddata = encodeVaultData(PDData);
  updateFile("localstorage", localStorage);
  
  
  
  return true;
  
}



/**
 * @async
 * Apply the effects of all relevant spells & effects.
 * This is called by ____ at the end of each oscillation.
 */
exports.applySpellEffects = async () => {
  
  // 24 Spells
  // 8 Effects
  
}



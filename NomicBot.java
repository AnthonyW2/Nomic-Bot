/**
  Anthony Wilson
  
  2021-8-7
  
  Nomic Discord bot
  
  v2.0.2
**/



//Import the Java Discord API
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.exceptions.PermissionException;
import net.dv8tion.jda.api.exceptions.RateLimitedException;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import net.dv8tion.jda.api.requests.restaction.pagination.*;

//Import authentication-related functionality
import javax.security.auth.login.LoginException;

//Import file read/write functionality
import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;

//Import other utilities
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;



public class NomicBot extends ListenerAdapter {
  
  static JDA jda;
  
  //Symbol to indicate a command
  String cmdpref = "$";
  
  static String nomicGuildID = "701269326518419547";
  String generalChannelID    = "827413038239318066";
  String proposalsChannelID  = "827413063287439392";
  String discussionChannelID = "827413100927647765";
  String botChannelID        = "827413269052391454";
  
  static Guild nomicGuild;
  
  //Store a list of all active players
  static ArrayList<Player> players = new ArrayList<Player>();
  
  static ArrayList<String> cards = new ArrayList<String>();
  
  static int totalVotes;
  
  
  
  public static void main(String[] args) {
    
    try {
      
      //Get the token from the "token" file
      File tokenFile = new File("token");
      Scanner tokenReader = new Scanner(tokenFile);
      
      if(tokenReader.hasNextLine()){
        
        String token = tokenReader.nextLine();
        
        //Initialise JDA
        jda = JDABuilder.createDefault(token).addEventListeners(new NomicBot()).build();
        jda.awaitReady();
        System.out.println("Bot initialised successfully");
        
        //Initialise some stuff
        init();
        
      }else{
        
        //Exit with an error message if the token cannot be retrieved
        System.out.println("Failed to retrieve token from file");
        System.exit(1);
        
      }
      
    } catch(LoginException e) {
      
      e.printStackTrace();
      
    } catch(InterruptedException e) {
      
      e.printStackTrace();
      
    } catch(FileNotFoundException e) {
      
      //Exit with an error message if the token cannot be retrieved
      System.out.println("Failed to retrieve token from file");
      e.printStackTrace();
      System.exit(1);
      
    }
    
  }
  
  
  
  //Run on startup
  public static void init(){
    
    //Set the status of the bot's account
    jda.getPresence().setActivity(Activity.playing("Nomic"));
    ///jda.getPresence().setActivity(Activity.playing("Development"));
    System.out.println("Successfully set status");
    
    
    try {
      
      //Get the list of players in the current turn order
      File playersFile = new File("players");
      Scanner playersReader = new Scanner(playersFile);
      
      for(int p = 0;playersReader.hasNextLine();p ++) {
        
        String playerStr = playersReader.nextLine();
        
        if(playerStr.length() > 1){
          //Create a new Player object and add it to the players array
          players.add(new Player(playerStr, p+1));
          
          totalVotes += players.get(p).votes;
        }
        
      }
      
    } catch(FileNotFoundException e) {
      
      //Exit with an error message if the list of players cannot be retrieved
      System.out.println("Failed to retrieve list of players from file");
      e.printStackTrace();
      System.exit(1);
      
    }
    
    System.out.println("Successfully got list of players");
    
    
    try {
      
      //Get the list of players in the current turn order
      File cardsFile = new File("cards");
      Scanner cardsReader = new Scanner(cardsFile);
      
      while(cardsReader.hasNextLine()){
        
        String card = cardsReader.nextLine();
        
        if(card.length() > 1){
          cards.add(card);
        }
        
      }
      
    } catch(FileNotFoundException e) {
      
      //Exit with an error message if the list of players cannot be retrieved
      System.out.println("Failed to retrieve list of cards from file");
      e.printStackTrace();
      System.exit(1);
      
    }
    
    System.out.println("Successfully got list of cards");
    
    
    //Get the Guild object which corresponds to the Nomic server
    nomicGuild = jda.getGuildById(nomicGuildID);
    
    System.out.println("Identified Nomic Guild");
    
  }
  
  
  
  //Define the functionality for when a message is received by the bot
  @Override
  public void onMessageReceived(MessageReceivedEvent event) {
    
    //User that sent the message
    User author = event.getAuthor();
    //The message that was received
    Message message = event.getMessage();
    //The channel the message was sent in
    MessageChannel channel = event.getChannel();
    
    //Contents of the message (exactly what was sent by the author)
    String msg = message.getContentDisplay();
    
    //Test whether or not the message author is a bot
    boolean bot = author.isBot();
    
    
    
    //Test if the message was sent in a text channel in a Guild
    if(event.isFromType(ChannelType.TEXT)) {
      
      //The guild (or "server") that the message was sent in
      Guild guild = event.getGuild();
      //The text channel that the message was sent in
      TextChannel textChannel = event.getTextChannel();
      //The member of the guild that sent the message
      Member member = event.getMember();
      
      //Store the name of the user
      String name;
      if(message.isWebhookMessage()) {
        
        //Get the name of the webhook
        name = author.getName();
        
      } else {
        
        //Get the member's name, or use their guild nickname if applicable
        name = member.getEffectiveName();
        
      }
      
      //Print the message details to stdout
      ///System.out.println("(" + guild.getName() + ")[" + textChannel.getName() + "]<" + name + ">: " + msg);
      
      
    } else if(event.isFromType(ChannelType.PRIVATE)) {
      
      PrivateChannel privateChannel = event.getPrivateChannel();
      
      System.out.println("[PRIVATE]<" + author.getName() + ">: " + msg);
      
      
    } else {
      
      System.out.println("[Invalid channel type]");
      
    }
    
    
    
    //If the user sending the message is not a bot, run the command associated with the message (if applicable)
    if(!bot){
      
      this.handleMessage(event);
      
    }
    
  }
  
  
  
  //Execute any commands associated with a received message
  public void handleMessage(MessageReceivedEvent event) {
    
    JDA jda = event.getJDA();
    
    MessageChannel channel = event.getChannel();
    String messageContents = event.getMessage().getContentDisplay();
    
    if(messageContents.equals(this.cmdpref + "ping")) {
      
      channel.sendMessage("pong").queue();
      
    } else if(messageContents.equals(this.cmdpref + "help")) {
      
      this.helpCommand(event);
      
    } else if(messageContents.equals(this.cmdpref + "players") || messageContents.equals(this.cmdpref + "listplayers")) {
      
      this.playersCommand(event);
      
    } else if(messageContents.length() > (3 + this.cmdpref.length()) && messageContents.substring(0,4 + this.cmdpref.length()).equals(this.cmdpref + "roll")) {
      
      this.rollCommand(event);
      
    } else if(messageContents.equals(this.cmdpref + "card") || messageContents.equals(this.cmdpref + "randomcard")) {
      
      this.cardCommand(event);
      
    } else if(messageContents.equals(this.cmdpref + "rock")) {
      
      this.rockCommand(event);
      
    } else if(messageContents.length() > (4 + this.cmdpref.length()) && messageContents.substring(0,5 + this.cmdpref.length()).equals(this.cmdpref + "votes")) {
      
      this.getVotesCommand(event);
      
    } else if(messageContents.length() > (7 + this.cmdpref.length()) && messageContents.substring(0,8 + this.cmdpref.length()).equals(this.cmdpref + "majority")) {
      
      this.confirmMajorityCommand(event);
      
    } else if(messageContents.length() > (11 + this.cmdpref.length()) && messageContents.substring(0,12 + this.cmdpref.length()).equals(this.cmdpref + "proposaltype")) {
      
      /// For debugging purposes
      String messageID = messageContents.substring(13 + this.cmdpref.length());
      TextChannel proposalsChannel = nomicGuild.getTextChannelById(proposalsChannelID);
      Message proposalMessage = proposalsChannel.retrieveMessageById(messageID).complete();
      
      channel.sendMessage(getProposalType(proposalMessage.getContentDisplay())).queue();
      
    }
    
  }
  
  
  
  //Show a basic help guide for the bot
  public void helpCommand(MessageReceivedEvent event) {
    
    String help = "__Guide to using Nomic Bot:__";
    help += "\nCurrent command prefix is " + this.cmdpref;
    help += "\n\nFor the current turn order and vote amounts, use the `"+this.cmdpref+"players` command";
    help += "\nTo roll a die of size <n>, use the `"+this.cmdpref+"roll <n>` command";
    help += "\nTo throw a rock, use the `"+this.cmdpref+"rock` command";
    help += "\nTo get a random card, use the `"+this.cmdpref+"card` command";
    help += "\nTo get the votes on a rule, use the `"+this.cmdpref+"votes <message ID>` command";
    help += "\nAsk Anthony for details";
    
    event.getChannel().sendMessage(help).queue();
    
  }
  
  
  
  //List the players in the current turn order
  public void playersCommand(MessageReceivedEvent event) {
    
    String response = "**Turn order:**";
    
    for(int p = 0;p < players.size();p ++){
      
      response += "\n" + (p+1) + " - " + players.get(p).name + "  (" + players.get(p).votes + ")";
      //response += "\n" + (p+1) + " - <@" + players.get(p).userIDs[0] + ">  (" + players.get(p).votes + ")";
      
    }
    
    event.getChannel().sendMessage(response).queue();
    
  }
  
  
  
  //Roll a die of a given size
  public void rollCommand(MessageReceivedEvent event) {
    
    //Use a D6 by default
    int die = 6;
    
    if(event.getMessage().getContentDisplay().length() > (5 + this.cmdpref.length())){
      
      String sizeStr = event.getMessage().getContentDisplay().substring(5 + this.cmdpref.length());
      
      try {
        
        //Set the size of the die
        if(sizeStr.charAt(0) == 'd' || sizeStr.charAt(0) == 'D'){
          die = Integer.parseInt(sizeStr.substring(1));
        }else{
          die = Integer.parseInt(sizeStr);
        }
        
      } catch(NumberFormatException e) {
        
        //If the user supplies a non-integer parameter for the die size, send a warning message
        event.getChannel().sendMessage("Invalid die size").queue();
        
      }
      
    }
    
    if(die > 0){
      
      //Generate random integer
      int roll = ThreadLocalRandom.current().nextInt(die) + 1;
      
      //Send the message
      event.getChannel().sendMessage("Rolling **D" + die + "**:\n" + roll).queue();
      
    }
    
  }
  
  
  
  //Generate a random card
  public void cardCommand(MessageReceivedEvent event) {
    
    int cardNum = ThreadLocalRandom.current().nextInt( cards.size() );
    
    event.getChannel().sendMessage("Your card is a **" + cards.get(cardNum) + "**").queue();
    
  }
  
  
  
  //Throw a rock some distance
  public void rockCommand(MessageReceivedEvent event) {
    
    //Guaranteed to travel at least 1 metre
    int distance = 1;
    
    //25% chance of stopping
    while(ThreadLocalRandom.current().nextInt(4) > 0) {
      
      //Rock travelled another metre
      distance ++;
      
    }
    
    event.getChannel().sendMessage("Your rock travelled **" + distance + "m**").queue();
    
  }
  
  
  
  //Check if any active rules have reached majority
  public void getVotesCommand(MessageReceivedEvent event) {
    
    //Check if the message is long enough
    if(event.getMessage().getContentDisplay().length() > (6 + this.cmdpref.length())) {
      
      //The given ID of the proposal message
      String messageID = event.getMessage().getContentDisplay().substring(6 + this.cmdpref.length());
      
      //The TextChannel object representing the #proposals channel
      TextChannel proposalsChannel = nomicGuild.getTextChannelById(proposalsChannelID);
      
      //The proposal message
      Message proposalMessage = proposalsChannel.retrieveMessageById(messageID).complete();
      
      //The Discord profile of the player who made the proposal
      Player proposalAuthor = getMatchingPlayer(proposalMessage.getAuthor());
      
      //Store the amount of votes which the author of the proposal has
      int authorVotes = proposalAuthor.votes;
      
      //Whether or not each user has voted
      boolean[] usersVoted = new boolean[players.size()];
      
      //A list of any illegal or double votes, populated by the getVotes() function
      ArrayList<User> illegalVotes = new ArrayList<User>();
      
      
      //Try to work out the type of proposal, judging by the contents of the message
      String proposalType = getProposalType(proposalMessage.getContentDisplay());
      
      //Annouce that the bot is getting the votes for the author's proposal
      event.getChannel().sendMessage("__Getting votes for " + proposalAuthor.name + "'s " + (proposalType == "edit" ? "rule edit" : proposalType + " proposal") + "__").queue();
      
      
      //Get the amounts of votes on the proposal
      int[] votes = getVotes(proposalMessage, usersVoted, proposalAuthor, illegalVotes);
      
      //Report back the amounts of votes the proposal has
      event.getChannel().sendMessage(
        "Upvotes: "    + votes[0] +
        "\nDownvotes: "  + votes[1] +
        "\nLeftvotes: "  + votes[2] +
        "\nRightvotes: " + votes[3] +
        "\n" + (votes[0] + votes[1] + votes[2] + votes[3]) + " out of " + (this.totalVotes - authorVotes) + " votes cast"
      ).queue();
      
      //Detect majority
      String[] majorityType = detectMajorityFromVotes(votes, this.totalVotes - authorVotes);
      
      //Report which vote has majority (if applicable)
      if(majorityType[1].equals("Majority")) {
        
        event.getChannel().sendMessage("**" + majorityType[0] + "vote majority!**").queue();
        
      } else if(majorityType[1].equals("Tie")) {
        
        event.getChannel().sendMessage("**" + majorityType[0] + "vote tie!**").queue();
        
      }
      
      //Send a list of users who still need to vote
      for(int p = 0;p < usersVoted.length;p ++) {
        
        if(!usersVoted[p] && players.get(p) != proposalAuthor) {
          
          event.getChannel().sendMessage(players.get(p).name + " still needs to vote").queue();
          
        }
        
      }
      
      //Warn about any illegal or double votes made on the proposal
      for(int v = 0;v < illegalVotes.size();v ++) {
        event.getChannel().sendMessage(illegalVotes.get(v).getName() + " has illegally voted!").queue();
      }
      
      
    } else {
      
      event.getChannel().sendMessage("Please supply a valid message ID").queue();
      
    }
    
  }
  
  //Returns the amount of votes as an array of integers
  //0 = upvotes, 1 = downvotes, 2 = leftvotes, 3 = rightvotes
  public int[] getVotes(Message proposalMessage, boolean[] usersVoted, Player author, ArrayList<User> illegalVotes) {
    
    //List of unique reactions to the proposal message
    List<MessageReaction> reactions = proposalMessage.getReactions();
    
    //Keep track of the 3 types of votes
    int upvotes    = 0;
    int downvotes  = 0;
    int leftvotes  = 0;
    int rightvotes = 0;
    
    for(int r = 0;r < reactions.size();r ++){
      
      if(reactions.get(r).toString().contains("thumbsup") || reactions.get(r).toString().contains("1f44d")) {
        
        //Up-votes
        upvotes += getVoteCount(reactions.get(r), usersVoted, author, illegalVotes);
        
      } else if (reactions.get(r).toString().contains("thumbsdown") || reactions.get(r).toString().contains("1f44e")) {
        
        //Down-votes
        downvotes += getVoteCount(reactions.get(r), usersVoted, author, illegalVotes);
        
      } else if (reactions.get(r).toString().contains("thumbsleft")){
        
        //Left-votes
        leftvotes += getVoteCount(reactions.get(r), usersVoted, author, illegalVotes);
        
      } else if (reactions.get(r).toString().contains("thumbsright")){
        
        //Right-votes
        rightvotes += getVoteCount(reactions.get(r), usersVoted, author, illegalVotes);
        
      }
      
    }
    
    int[] votes = {upvotes,downvotes,leftvotes,rightvotes};
    
    return votes;
    
  }
  
  //Get the amount of votes in a MessageReaction object
  public int getVoteCount(MessageReaction reaction, boolean[] usersVoted, Player author, ArrayList<User> illegalVotes) {
    
    int votes = 0;
    
    //Get an iterable list of users that reacted with the given reaction
    ReactionPaginationAction users = reaction.retrieveUsers();
    
    //Loop through the list of users who reacted
    for(User user : users) {
      
      Player matchingPlayer = getMatchingPlayer(user);
      
      //Detect illegal votes (made by non-players or the proposal author)
      if(matchingPlayer == null || matchingPlayer == author) {
        
        illegalVotes.add(user);
        
        System.out.println("Illegal vote!");
        
      } else {
        
        //Detect double-votes
        if(usersVoted[matchingPlayer.turnPosition-1]) {
          
          illegalVotes.add(user);
          
          System.out.println("Double vote!");
          
        } else {
          
          //Increment the vote count
          votes += matchingPlayer.votes;
          
          //Keep track of which players have voted
          usersVoted[matchingPlayer.turnPosition-1] = true;
          
        }
        
      }
      
    }
    
    return votes;
    
  }
  
  
  
  //Report whether a set of votes makes majority
  public String[] detectMajorityFromVotes(int[] votes, int totalPossibleVotes) {
    
    //int[] votes -> 0 = upvotes, 1 = downvotes, 2 = leftvotes, 3 = rightvotes
    
    //Possible values:
    // 0 = "Up", "Down", "Left", "Right", ""
    // 1 = "Majority", "Tie", "Leading", "None"
    String[] output = {"Vote", "Type"};
    
    String[] voteTypeText = {"Up", "Down", "Left", "Right"};
    
    
    //Get the amount of votes that have been cast
    int totalVotesCast = 0;
    for(int v = 0;v < 4;v ++) {
      totalVotesCast += votes[v];
    }
    
    
    //If there are no votes cast, return the relevant response
    if(totalVotesCast == 0) {
      
      output[0] = "";
      output[1] = "None";
      
      return output;
      
    }
    
    
    //Store the amount of votes that are yet to be cast
    int remainingVotes = totalPossibleVotes - totalVotesCast;
    
    
    //Identify the highest amount of votes present
    int highest = 0;
    for(int v = 0;v < 4;v ++) {
      
      if(votes[v] > highest) {
        highest = votes[v];
      }
      
    }
    
    //Create a list of all votes that are at the current highest amount
    ArrayList<Integer> highestVotes = new ArrayList<Integer>();
    for(int v = 0;v < 4;v ++) {
      
      if(votes[v] == highest) {
        highestVotes.add(v);
      }
      
    }
    
    //If only one vote type is leading
    if(highestVotes.size() == 1) {
      
      //Test if the vote type has an unbeatable lead
      boolean majority = true;
      for(int v = 0;v < 4;v ++) {
        
        if(votes[v] + remainingVotes >= votes[highestVotes.get(0)] && v != highestVotes.get(0)) {
          majority = false;
        }
        
      }
      
      //Return the result
      output[0] = voteTypeText[highestVotes.get(0)];
      output[1] = (majority ? "Majority" : "Leading");
      
      return output;
      
    } else {
      
      //Create a list of vote types that are tied
      output[0] = "";
      for(int v = 0;v < highestVotes.size();v ++) {
        
        output[0] += voteTypeText[highestVotes.get(v)] + (v < highestVotes.size()-1 ? "," : "");
        
      }
      
      //Return a tie if there are no remaining votes, or just "Leading" if the tie could still be broken
      if(remainingVotes == 0) {
        output[1] = "Tie";
      } else {
        output[1] = "Leading";
      }
      
      return output;
      
    }
    
  }
  
  
  
  //Check if any active rules have reached majority
  public void confirmMajorityCommand(MessageReceivedEvent event) {
    
    //Check if the message is long enough
    if(event.getMessage().getContentDisplay().length() > (9 + this.cmdpref.length())) {
      
      //The given ID of the proposal message
      String messageID = event.getMessage().getContentDisplay().substring(9 + this.cmdpref.length());
      
      //The TextChannel object representing the #proposals channel
      TextChannel proposalsChannel = nomicGuild.getTextChannelById(proposalsChannelID);
      
      //The proposal message
      Message proposalMessage = proposalsChannel.retrieveMessageById(messageID).complete();
      
      //The Discord profile of the player who made the proposal
      Player proposalAuthor = getMatchingPlayer(proposalMessage.getAuthor());
      
      //Store the amount of votes which the author of the proposal has
      int authorVotes = proposalAuthor.votes;
      
      //Whether or not each user has voted
      boolean[] usersVoted = new boolean[players.size()];
      
      //A list of any illegal or double votes, populated by the getVotes() function
      ArrayList<User> illegalVotes = new ArrayList<User>();
      
      
      //Get the amounts of votes on the proposal
      int[] votes = getVotes(proposalMessage, usersVoted, proposalAuthor, illegalVotes);
      
      
      //Detect majority
      String[] majorityType = detectMajorityFromVotes(votes, this.totalVotes - authorVotes);
      
      
      event.getChannel().sendMessage(majorityType[0] + "vote " + majorityType[1]).queue();
      
    } else {
      
      event.getChannel().sendMessage("Please supply a valid message ID").queue();
      
    }
    
  }
  
  
  
  //Try to work out the type of proposal (rule, edit, item, thematic, etc) from the text in the message
  public String getProposalType(String proposalText) {
    
    String firstLine = proposalText.split("\n")[0].toLowerCase();
    
    String relevantString = firstLine;
    
    //Extract the part of the text which should describe the type of proposal
    if(firstLine.contains(":")) {
      relevantString = firstLine.split(":")[0];
    } else {
      relevantString = firstLine.substring(0, Math.min(48, firstLine.length()));
    }
    
    //Attempt to match the type of proposal by search for matching substrings
    if(relevantString.contains("archive")) {
      
      return "archived";
      
    } else if(relevantString.contains("theme") || relevantString.contains("thematic")) {
      
      return "thematic";
      
    } else if(relevantString.contains("item")) {
      
      return "item";
      
    } else if(relevantString.contains("event")) {
      
      return "event";
      
    } else if(relevantString.contains("visual")) {
      
      return "visual";
      
    } else if(relevantString.contains("proposal") && relevantString.contains("edit")) {
      
      return "modified";
      
    } else if(relevantString.contains("edit")) {
      
      return "edit";
      
    } else if(relevantString.contains("mayor") || relevantString.contains("election")) {
      
      return "election";
      
    } else if(relevantString.contains("clarif")) {
      
      return "clarification";
      
    }
    
    return "rule";
    
  }
  
  
  
  //Object type to store a player's attributes
  public static class Player {
    
    //Attributes should be self-explanatory
    String name;
    String[] userIDs;
    int votes = 1;
    String altName;
    int turnPosition;
    
    public Player(String playerStr, int turnPos) {
      
      String[] splitStr = playerStr.split("	");
      
      this.name = splitStr[1];
      this.userIDs = splitStr[0].split(",");
      this.votes = Integer.parseInt(splitStr[2]);
      this.altName = splitStr[3];
      this.turnPosition = turnPos;
      
    }
    
    
    
    //Method to convert a Player object into a string for debugging
    public String toString() {
      
      String output = "";
      
      output += "userIDs = [";
      for(int id = 0;id < this.userIDs.length;id ++) {
        output += this.userIDs[id] + ",";
      }
      
      output += "]\nname = " + this.name;
      
      output += "\nvotes = " + this.votes;
      
      output += "\naltName = " + this.altName;
      
      return output;
      
    }
    
  }
  
  
  
  public Player getMatchingPlayer(User discordUser) {
    
    String userID = discordUser.getId();
    
    //Loop through all players
    for(int p = 0;p < players.size();p ++) {
      
      //Loop through the player's possible user IDs
      for(int uid = 0;uid < players.get(p).userIDs.length;uid ++) {
        
        //Check if the player's user ID matches the ID of the given user
        if(players.get(p).userIDs[uid].equals(userID)){
          return players.get(p);
        }
        
      }
      
    }
    
    return null;
    
  }
  
  
}










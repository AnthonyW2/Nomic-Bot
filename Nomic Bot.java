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
  
  //Each entry contains the user ID, the player's name and the amount of votes they have
  //static ArrayList<String[]> players = new ArrayList<String[]>();
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
    System.out.println("Successfully set status");
    
    
    try {
      
      //Get the list of players in the current turn order
      File playersFile = new File("players");
      Scanner playersReader = new Scanner(playersFile);
      
      for(int p = 0;playersReader.hasNextLine();p ++) {
        
        String playerStr = playersReader.nextLine();
        
        if(playerStr.length() > 1){
          //Create a new Player object and add it to the players array
          players.add(new Player(playerStr));
          
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
    
    ///Still need to account for the votes of the user who made the proposal
    ///Need to detect double-votes
    ///Once double-vote detection works, list the users who still need to vote
    
    //Check if the message is long enough
    if(event.getMessage().getContentDisplay().length() > (6 + this.cmdpref.length())) {
      
      //The given ID of the proposal message
      String messageID = event.getMessage().getContentDisplay().substring(6 + this.cmdpref.length());
      
      //The TextChannel object representing the #proposals channel
      TextChannel proposalsChannel = nomicGuild.getTextChannelById(proposalsChannelID);
      
      //The proposal message
      Message proposalMessage = proposalsChannel.retrieveMessageById(messageID).complete();
      
      int[] votes = getVotes(proposalMessage);
      
      event.getChannel().sendMessage(
        "Upvotes: "    + votes[0] +
        "\nDownvotes: "  + votes[1] +
        "\nLeftvotes: "  + votes[2] +
        "\nRightvotes: " + votes[3] +
        "\n" + (votes[0] + votes[1] + votes[2] + votes[3]) + " out of " + this.totalVotes + " votes cast"
      ).queue();
      
    } else {
      
      event.getChannel().sendMessage("Please supply a valid message ID").queue();
      
    }
    
  }
  
  //Returns the amount of votes as an array of integers
  //0 = upvotes, 1 = downvotes, 2 = leftvotes, 3 = rightvotes
  public int[] getVotes(Message proposalMessage) {
    
    //List of unique reactions to the proposal message
    List<MessageReaction> reactions = proposalMessage.getReactions();
    
    //Whether or not each user has voted
    ///boolean[this.players.size()] userVoted;
    
    //Keep track of the 3 types of votes
    int upvotes    = 0;
    int downvotes  = 0;
    int leftvotes  = 0;
    int rightvotes = 0;
    
    for(int r = 0;r < reactions.size();r ++){
      
      if(reactions.get(r).toString().contains("thumbsup") || reactions.get(r).toString().contains("1f44d")){
        
        upvotes += getVoteCount(reactions.get(r));
        
      }else if(reactions.get(r).toString().contains("thumbsdown") || reactions.get(r).toString().contains("1f44e")){
        
        downvotes += getVoteCount(reactions.get(r));
        
      }else if(reactions.get(r).toString().contains("thumbsleft")){
        
        leftvotes += getVoteCount(reactions.get(r));
        
      }else if(reactions.get(r).toString().contains("thumbsright")){
        
        rightvotes += getVoteCount(reactions.get(r));
        
      }
      
    }
    
    int[] votes = {upvotes,downvotes,leftvotes,rightvotes};
    
    return votes;
    
  }
  
  //Get the amount of votes in a MessageReaction object
  public int getVoteCount(MessageReaction reaction) {
    
    ///Still need to implement a way to detect double-votes
    
    int votes = 0;
    
    //Get an iterable list of users that reacted with the given reaction
    ReactionPaginationAction users = reaction.retrieveUsers();
    
    //Loop through the list of users who reacted
    for(User user : users) {
      
      //Loop through all players
      for(int p = 0;p < players.size();p ++) {
        
        //Loop through the player's possible user IDs
        for(int uid = 0;uid < players.get(p).userIDs.length;uid ++) {
          
          //Test if the player matches the reaction user
          if(user.getId().equals(players.get(p).userIDs[uid])){
            
            votes += players.get(p).votes;
            
          }
          
        }
        
      }
      
    }
    
    return votes;
    
  }
  
  
  
  //Check if any active rules have reached majority
  public void confirmMajorityCommand(MessageReceivedEvent event) {
    
    //Check if the message is long enough
    if(event.getMessage().getContentDisplay().length() > (9 + this.cmdpref.length())) {
      
      //The given ID of the proposal message
      String messageID = event.getMessage().getContentDisplay().substring(9 + this.cmdpref.length());
      
      //The TextChannel object representing the #proposals channel
      TextChannel proposalsChannel = nomicGuild.getTextChannelById(proposalsChannelID);
      
      
      ///Detect majority here
      
      event.getChannel().sendMessage("Unimplemented").queue();
      
      
    } else {
      
      event.getChannel().sendMessage("Please supply a valid message ID").queue();
      
    }
    
  }
  
  
  
  public static class Player {
    
    String name;
    String[] userIDs;
    int votes = 1;
    String altName;
    
    public Player(String playerStr) {
      
      String[] splitStr = playerStr.split("	");
      
      this.name = splitStr[1];
      this.userIDs = splitStr[0].split(",");
      this.votes = Integer.parseInt(splitStr[2]);
      this.altName = splitStr[3];
      
    }
    
    
    
    public String toString() {
      
      String output = "";
      
      output += "userIDs = [";
      for(int id = 0;id < this.userIDs.length;id ++){
        output += this.userIDs[id] + ",";
      }
      
      output += "]\nname = " + this.name;
      
      output += "\nvotes = " + this.votes;
      
      output += "\naltName = " + this.altName;
      
      return output;
      
    }
    
  }
  
  
  
}










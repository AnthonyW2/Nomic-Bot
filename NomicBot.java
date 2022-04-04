/**
  Anthony Wilson
  
  2021-8-7
  
  Nomic Discord bot
  
  v2.2
**/

//Relevant links:
/// https://github.com/DV8FromTheWorld/JDA/releases
/// https://ci.dv8tion.net/job/JDA/javadoc/net/dv8tion/jda/api/entities/User.html
/// https://stackoverflow.com/questions/63411268/discord-js-ping-command
/// https://ci.dv8tion.net/job/JDA/javadoc/net/dv8tion/jda/api/EmbedBuilder.html

//What was left to do:
/// Implement up+left > down -> leftvote majority detection
/// Automate Wikipedia races
/// Add correct vote detection for all rule types
/// Store more details in files
/// Remember which proposals have reached majority
/// Better votes command which lists all votes for all current active proposals
/// Better players command with more info
/// Automatically send the majority message when the bot turns on if majority was reached
/// Better error handling
/// Add a jop command



//Import the Java Discord API
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.events.message.react.MessageReactionAddEvent;
import net.dv8tion.jda.api.exceptions.PermissionException;
import net.dv8tion.jda.api.exceptions.RateLimitedException;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import net.dv8tion.jda.api.requests.restaction.pagination.*;
import net.dv8tion.jda.api.EmbedBuilder;

//Import authentication-related functionality
import javax.security.auth.login.LoginException;

//Import file read/write functionality
import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;

//Import command processing features
import java.io.InputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.lang.InterruptedException;

//Import other utilities
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;



public class NomicBot extends ListenerAdapter {
  
  static JDA jda;
  
  //Symbol to indicate a command
  String cmdpref = "$";
  
  static boolean enableReactionListeners = true;
  
  static String nomicGuildID = "701269326518419547";
  String generalChannelID    = "827413038239318066";
  String proposalsChannelID  = "827413063287439392";
  String discussionChannelID = "827413100927647765";
  String joppingChannelID    = "895546731415076894";
  String botChannelID        = "827413269052391454";
  
  static Guild nomicGuild;
  
  //Store a list of all active players
  static ArrayList<Player> players = new ArrayList<Player>();
  
  static ArrayList<String> cards = new ArrayList<String>();
  
  static int totalVotes;
  
  String[] voteTypeNames = {"up","down","left","right"};
  String[][] voteTypeReactions = {{"thumbsup","1f44d"},{"thumbsdown","1f44e"},{"thumbsleft"},{"thumbsright"}};
  
  
  
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
    ///jda.getPresence().setActivity(Activity.playing("The Final Countdown"));
    ///jda.getPresence().setActivity(Activity.playing("Development"));
    ///jda.getPresence().setActivity(Activity.watching("your votes"));
    ///jda.getPresence().setActivity(Activity.watching("your grammar"));
    ///jda.getPresence().setActivity(Activity.watching("you"));
    System.out.println("Successfully set status");
    
    
    try {
      
      //Get the list of players in the current turn order
      File playersFile = new File("players");
      Scanner playersReader = new Scanner(playersFile);
      
      for(int p = 0;playersReader.hasNextLine();p ++) {
        
        String playerStr = playersReader.nextLine();
        
        if(playerStr.length() > 1) {
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
      
      //Get the list of cards in the deck
      File cardsFile = new File("cards");
      Scanner cardsReader = new Scanner(cardsFile);
      
      while(cardsReader.hasNextLine()) {
        
        String card = cardsReader.nextLine();
        
        if(card.length() > 1) {
          cards.add(card);
        }
        
      }
      
    } catch(FileNotFoundException e) {
      
      //Exit with an error message if the list of cards cannot be retrieved
      System.out.println("Failed to retrieve list of cards from file");
      e.printStackTrace();
      System.exit(1);
      
    }
    
    System.out.println("Successfully got list of cards");
    
    
    //Get the Guild object which corresponds to the Nomic server
    nomicGuild = jda.getGuildById(nomicGuildID);
    
    System.out.println("Identified Nomic Guild");
    
    
    //Warn the admin if the reaction listeners are disabled
    if(!enableReactionListeners) {
      
      System.out.println("Reaction listeners disabled!");
      
    }
    
    
  }
  
  
  
  //Define the functionality for when a message is received by the bot
  @Override
  public void onMessageReceived(MessageReceivedEvent event) {
    
    //User that sent the message
    User author = event.getAuthor();
    
    //Test whether or not the message author is a bot
    boolean bot = author.isBot();
    
    
    
    //Test if the message was sent in a text channel in a Guild
    if(event.isFromType(ChannelType.PRIVATE)) {
      
      //The message that was received
      Message message = event.getMessage();
      
      //Contents of the message (exactly what was sent by the author)
      String msg = message.getContentDisplay();
      
      PrivateChannel privateChannel = event.getPrivateChannel();
      
      System.out.println("[PRIVATE]<" + author.getName() + ">: " + msg);
      
    }
    
    
    
    //If the user sending the message is not a bot, run the command associated with the message (if applicable)
    ///if(!bot){
      
      this.handleMessage(event);
      
    ///}
    
  }
  
  
  
  //Define the functionality for when a reaction is added to a message
  @Override
  public void onMessageReactionAdd(MessageReactionAddEvent event) {
    
    if(!enableReactionListeners) {
      return;
    }
    
    //Get the reaction object related to the event
    MessageReaction reaction = event.getReaction();
    
    //The message that was received
    String messageID = reaction.getMessageId();
    
    //The channel which the event occurred in
    MessageChannel channel = event.getChannel();
    
    
    //Check if the reaction occurred in the proposals channel
    if(channel.getId().equals(proposalsChannelID)) {
      
      System.out.println("Vote cast on message with ID " + messageID);
      
      TextChannel proposalsChannel = nomicGuild.getTextChannelById(proposalsChannelID);
      Message proposalMessage = proposalsChannel.retrieveMessageById(messageID).complete();
      User proposalAuthorAccount = proposalMessage.getAuthor();
      if(proposalAuthorAccount.isBot()){
        nomicGuild.getTextChannelById(botChannelID).sendMessage("**WARNING**: Non-fatal error encountered while watching votes - proposition author is a bot and does not match any stored player IDs").queue();
        return;
      }
      Player proposalAuthor = getMatchingPlayer(proposalAuthorAccount);
      int authorVotes = proposalAuthor.votes;
      
      boolean[] usersVoted = new boolean[players.size()];
      ArrayList<User> illegalVotes = new ArrayList<User>();
      
      
      String proposalType = getProposalType(proposalMessage.getContentDisplay());
      
      ///Cancel the majority check if the proposal is archived, an election, or a clarification
      if(proposalType.equals("archived") || proposalType.equals("election") || proposalType.equals("clarification")) {
        return;
      }
      
      //Get the amounts of votes on the proposal
      int[] votes = getVotes(proposalMessage, proposalAuthor, true, voteTypeReactions, usersVoted, illegalVotes);
      
      //Detect majority
      String[] majorityType = detectMajorityFromVotes(voteTypeNames, votes, this.totalVotes - authorVotes);
      
      //Report which vote has majority (if applicable)
      if(majorityType[1].equals("Majority")) {
        
        nomicGuild.getTextChannelById(botChannelID).sendMessage(proposalAuthor.name + "'s " + (proposalType.equals("edit") ? "rule edit" : proposalType + " proposal") + " has reached **" + majorityType[0] + "vote " + (ThreadLocalRandom.current().nextInt(50) == 1 ? "majoirty" : "majority") + "**\n" + proposalMessage.getJumpUrl()).queue();
        ///System.out.println(proposalAuthor.name + "'s " + (proposalType == "edit" ? "rule edit" : proposalType + " proposal") + " has reached **" + majorityType[0] + "vote majority**");
        
      } else if(majorityType[1].equals("Tie")) {
        
        nomicGuild.getTextChannelById(botChannelID).sendMessage(proposalAuthor.name + "'s " + (proposalType.equals("edit") ? "rule edit" : proposalType + " proposal") + " has tied between **" + majorityType[0] + "**\n" + proposalMessage.getJumpUrl()).queue();
        ///System.out.println(proposalAuthor.name + "'s " + (proposalType == "edit" ? "rule edit" : proposalType + " proposal") + " has tied between **" + majorityType[0] + "**");
        
      }
      
    }
    
  }
  
  
  
  //Execute any commands associated with a received message
  public void handleMessage(MessageReceivedEvent event) {
    
    JDA jda = event.getJDA();
    
    MessageChannel channel = event.getChannel();
    Message message = event.getMessage();
    String messageContents = message.getContentDisplay();
    
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
      
    } else if(messageContents.equals(this.cmdpref + "stats")) {
      
      this.statsCommand(event);
      
    } else if(messageContents.length() > (7 + this.cmdpref.length()) && messageContents.substring(0,8 + this.cmdpref.length()).equals(this.cmdpref + "majority")) {
      
      this.confirmMajorityCommand(event);
      
    } else if(messageContents.length() > (7 + this.cmdpref.length()) && messageContents.substring(0,8 + this.cmdpref.length()).equals(this.cmdpref + "wikirace")) {
      
      this.wikiRaceCommand(event);
      
    } else if(messageContents.equals(this.cmdpref + "rice")) {
      
      this.riceCommand(event);
      
    } else if(messageContents.equals(this.cmdpref + "soybeans") || messageContents.equals(this.cmdpref + "beans")) {
      
      this.soybeansCommand(event);
      
    } else if(messageContents.length() > (6 + this.cmdpref.length()) && messageContents.substring(0,7 + this.cmdpref.length()).equals(this.cmdpref + "berries")) {
      
      this.berriesCommand(event);
      
    } else if(messageContents.equals(this.cmdpref + "mushrooms")) {
      
      this.mushroomsCommand(event);
      
    } else if(messageContents.equals(this.cmdpref + "peppers")) {
      
      this.peppersCommand(event);
      
    } else if(messageContents.equals(this.cmdpref + "twistturns")) {
      
      this.twistturnsCommand(event);
      
    } else if(messageContents.equals(this.cmdpref + "election")) {
      
      this.electionCommand(event);
      
    } else if(messageContents.toLowerCase().contains("jop")) {
      
      this.automaticJopDetection(event);
      
    } else if(messageContents.equals(this.cmdpref + "scold")) {
      
      this.scoldCommand(event);
      
    }
    
    
    
    // Shhhhh
    if(messageContents.toLowerCase().contains("majoirty")) {
      message.addReaction("U+1f956").queue();
    }
    
  }
  
  
  
  //Show a basic help guide for the bot
  public void helpCommand(MessageReceivedEvent event) {
    
    EmbedBuilder helpMessageBuilder = new EmbedBuilder();
    helpMessageBuilder.setTitle("Nomic Bot Help");
    helpMessageBuilder.getDescriptionBuilder().append("The current command prefix is " + this.cmdpref);
    helpMessageBuilder.addField("Turn Order", "For the current turn order and vote amounts, use the `"+this.cmdpref+"players` command.", false);
    helpMessageBuilder.addField("Votes", "To get the votes on a rule, use the `"+this.cmdpref+"votes <message ID>` command.\nNomic Bot will automatically announce when a proposal reaches majority.", false);
    helpMessageBuilder.addField("Dice Rolling", "To roll a die of size `<n>`, use the `"+this.cmdpref+"roll <n>` command.", false);
    helpMessageBuilder.addField("Rock Skipping", "To throw a rock, use the `"+this.cmdpref+"rock` command.", false);
    helpMessageBuilder.addField("Random Card", "To get a random card, use the `"+this.cmdpref+"card` command.", false);
    helpMessageBuilder.addField(
      "Crops",
      "Use the `"+this.cmdpref+"rice` command to harvest rice.\nUse the `"+this.cmdpref+"soybeans` command to harvest soybeans.\nUse the `"+this.cmdpref+"berries <n>` command to harvest thorned berries, where `<n>` is the amount of food items in your inventory.\nUse the `"+this.cmdpref+"mushrooms` command to harvest biofluorescent mushrooms.\nUse the `"+this.cmdpref+"peppers` command to harvest blue-peppers.",
      false
    );
    helpMessageBuilder.addField("Elections", "To choose 3 random mayor candidates, use the `"+this.cmdpref+"election` command.", false);
    helpMessageBuilder.addField("Turn Twister", "To randomise the turn order, use the `"+this.cmdpref+"twistturns` command.", false);
    helpMessageBuilder.setFooter("Ask Anthony for more details");
    
    event.getChannel().sendMessageEmbeds(helpMessageBuilder.build()).queue();
    
  }
  
  
  
  //List the players in the current turn order
  public void playersCommand(MessageReceivedEvent event) {
    
    String turnOrder = "";
    
    for(int p = 0;p < players.size();p ++){
      
      //turnOrder += "\n" + (p+1) + " - " + players.get(p).name + "  (" + players.get(p).votes + ")";
      //turnOrder += "\n" + (p+1) + " - <@" + players.get(p).userIDs[0] + ">  (" + players.get(p).votes + ")";
      turnOrder += "\n" + (p+1) + " - " + players.get(p).name + " (<@" + players.get(p).userIDs[0] + ">)  (" + players.get(p).votes + ")";
      
    }
    
    EmbedBuilder response = new EmbedBuilder();
    response.addField("Players:", turnOrder, false);
    
    event.getChannel().sendMessageEmbeds(response.build()).queue();
    
    
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
    
    String[] vowels = {"a","e","i","o","u","8"};
    String firstLetter = cards.get(cardNum).substring(0,1).toLowerCase();
    String functionWord = "a";
    for(int l = 0;l < vowels.length;l ++) {
      if(firstLetter.equals(vowels[l])) {
        functionWord = "an";
        l = vowels.length;
      }
    }
    
    event.getChannel().sendMessage("Your card is " + functionWord + " **" + cards.get(cardNum) + "**").queue();
    
  }
  
  
  
  //Harvest rice
  public void riceCommand(MessageReceivedEvent event) {
    
    int roll = ThreadLocalRandom.current().nextInt(6);
    
    if(roll == 0) {
      
      event.getChannel().sendMessage("(Rolled " + (roll+1) + ")\nYou got no rice").queue();
      
    } else if(roll == 5){
      
      event.getChannel().sendMessage("(Rolled " + (roll+1) + ")\nYou got **3** rice - please give 1 rice to another player").queue();
      
    } else {
      
      event.getChannel().sendMessage("(Rolled " + (roll+1) + ")\nYou got **1** rice").queue();
      
    }
    
  }
  
  
  
  //Harvest soybeans
  public void soybeansCommand(MessageReceivedEvent event) {
    
    int roll = ThreadLocalRandom.current().nextInt(4);
    
    if(roll == 0) {
      
      event.getChannel().sendMessage("(Rolled " + (roll+1) + ")\nYou got no soybeans").queue();
      
    } else {
      
      event.getChannel().sendMessage("(Rolled " + (roll+1) + ")\nYou got **1** soybean").queue();
      
    }
    
  }
  
  
  
  //Forage for Thorned Berries
  public void berriesCommand(MessageReceivedEvent event) {
    
    //Use a D7+n
    int die = 7;
    
    //Check if the message is long enough
    if(event.getMessage().getContentDisplay().length() > (8 + this.cmdpref.length())) {
      
      //Get the value of n
      try {
        
        die += Integer.parseInt(event.getMessage().getContentDisplay().substring(8 + this.cmdpref.length()));
        
      } catch(NumberFormatException e) {
        
        //If the user supplies a non-integer parameter for the die size, send a warning message
        event.getChannel().sendMessage("Invalid value for n").queue();
        
      }
      
    }
    
    if(die >= 7){
      
      //Generate random integer
      int roll = ThreadLocalRandom.current().nextInt(die) + 1;
      
      String message;
      
      //Send a message corresponding to the roll
      switch(roll) {
        case 1:
          message = "(Rolled 1)\nYou take **3** damage";
          break;
        case 2:
          message = "(Rolled 2)\nYou take **2** damage";
          break;
        case 3:
        case 4:
          message = "(Rolled " + roll + ")\nYou get **1** thorned berry and take **3** damage";
          break;
        case 5:
        case 6:
          message = "(Rolled " + roll + ")\nYou get **1** thorned berry and take **2** damage";
          break;
        case 7:
          message = "(Rolled 7)\nYou get **2** thorned berries and take **3** damage";
          break;
        default:
          message = "(Rolled " + roll + ")\nYou get **1** thorned berry and take **3** damage";
      }
      
      event.getChannel().sendMessage(message).queue();
      
    }
    
  }
  
  
  
  //Forage for Biofluorescent Mushrooms
  public void mushroomsCommand(MessageReceivedEvent event) {
    
    int roll = ThreadLocalRandom.current().nextInt(10);
    
    if(roll == 9) {
      
      event.getChannel().sendMessage("(Rolled " + (roll+1) + ")\nYou got **2** Biofluorescent Mushrooms").queue();
      
    } else if(roll < 5) {
      
      event.getChannel().sendMessage("(Rolled " + (roll+1) + ")\nYou got no Biofluorescent Mushrooms").queue();
      
    } else {
      
      event.getChannel().sendMessage("(Rolled " + (roll+1) + ")\nYou got **1** Biofluorescent Mushroom").queue();
      
    }
    
  }
  
  
  
  //Forage for Blue-Peppers
  public void peppersCommand(MessageReceivedEvent event) {
    
    int roll = ThreadLocalRandom.current().nextInt(9);
    
    if(roll == 8) {
      
      event.getChannel().sendMessage("(Rolled " + (roll+1) + ")\nYou got **3** Blue-Peppers").queue();
      
    } else if(roll < 3) {
      
      event.getChannel().sendMessage("(Rolled " + (roll+1) + ")\nYou got no Blue-Peppers").queue();
      
    } else if(roll < 6) {
      
      event.getChannel().sendMessage("(Rolled " + (roll+1) + ")\nYou got **1** Blue-Pepper").queue();
      
    } else {
      
      event.getChannel().sendMessage("(Rolled " + (roll+1) + ")\nYou got **2** Blue-Peppers").queue();
      
    }
    
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
  
  
  
  //Randomise the turn order
  public void twistturnsCommand(MessageReceivedEvent event) {
    
    //Duplicate the list of players
    ArrayList<Player> playersList = new ArrayList<Player>(players);
    
    event.getChannel().sendMessage("New players list:").queue();
    
    int num = 1;
    
    while(playersList.size() > 0) {
      
      //Select a random player
      int randomPlayer = ThreadLocalRandom.current().nextInt(playersList.size());
      
      //Send a message with the player and the number in the new turn order
      event.getChannel().sendMessage(num + ": " + playersList.get(randomPlayer).name).queue();
      
      //Remove the randomly selected player from the list
      playersList.remove(randomPlayer);
      
      num ++;
      
    }
    
  }
  
  
  
  //Select 3 random candidates for an election
  public void electionCommand(MessageReceivedEvent event) {
    
    //Duplicate the list of players
    ArrayList<Player> playersList = new ArrayList<Player>(players);
    
    event.getChannel().sendMessage("Election candidates:").queue();
    
    int num = 0;
    
    String[] numberEmojis = {":one:",":two:",":three:"};
    
    while(num < 3) {
      
      //Select a random player
      int randomPlayer = ThreadLocalRandom.current().nextInt(playersList.size());
      
      //Send a message with the randonly selected player
      event.getChannel().sendMessage(numberEmojis[num] + ": " + playersList.get(randomPlayer).name).queue();
      
      //Remove the randomly selected player from the list
      playersList.remove(randomPlayer);
      
      num ++;
      
    }
    
  }
  
  
  
  //Decide whether or not a player dies from jopping
  public void automaticJopDetection(MessageReceivedEvent event) {
    
    if(!event.getAuthor().isBot()) {
      
      MessageChannel channel = event.getChannel();
      
      if(channel.getId().equals(joppingChannelID)) {
        
        boolean died = (ThreadLocalRandom.current().nextInt(80) == 1);
        
        if(event.getMessage().getContentDisplay().toLowerCase().contains("careful")) {
          
          if(died) {
            
            channel.sendMessage("**You died!**").queue();
            try {
              TimeUnit.SECONDS.sleep(3);//Wait for 3 seconds
            } catch(InterruptedException e) {
              e.printStackTrace();
            }
            channel.sendMessage("/j").queue();
            
          } else {
            channel.sendMessage("You are safe").queue();
          }
          
          return;
        }
        
        if(died) {
          
          String[] messageStrings = {
            "**You jopped too hard and died.**",
            "**You tripped over and died.**",
            "**You couldn't handle the power of jopping and died.**",
            "**You passed away when attempting to jop.**"
          };
          int deathMessage = ThreadLocalRandom.current().nextInt(4);
          
          channel.sendMessage(messageStrings[deathMessage]).queue();
          //channel.sendMessage("**LOL U died**").queue();
          
        } else {
          
          //channel.sendMessage("Remember to check if you die!").queue();
          channel.sendMessage("**You lived!**").queue();
          
        }
        
      }
      
    }
    
  }
  
  
  
  //Make Nomic Bot sad
  public void scoldCommand(MessageReceivedEvent event) {
    
    event.getChannel().sendMessage(":sob:").queue();
    
  }
  
  
  
  //Initiate a Wikipedia Race
  public void wikiRaceCommand(MessageReceivedEvent event) {
    
    event.getChannel().sendMessage("Sorry, you'll have to initialise it yourself for now").queue();
    
  }
  
  
  
  //Check if any active rules have reached majority
  public void getVotesCommand(MessageReceivedEvent event) {
    
    MessageChannel eventChannel = event.getChannel();
    String commandContents = event.getMessage().getContentDisplay();
    
    //Check if the message is long enough
    if(commandContents.length() < (7 + this.cmdpref.length())) {
      
      eventChannel.sendMessage("Please supply a valid message ID").queue();
      return;
      
    }
    
    //The given ID of the proposal message
    String messageID = commandContents.substring(6 + this.cmdpref.length());
    
    //The TextChannel object representing the #proposals channel
    TextChannel proposalsChannel = nomicGuild.getTextChannelById(proposalsChannelID);
    
    //The proposal message
    Message proposalMessage = proposalsChannel.retrieveMessageById(messageID).complete();
    
    User proposalAuthorAccount = proposalMessage.getAuthor();
    if(proposalAuthorAccount.isBot()){
      eventChannel.sendMessage("**WARNING**: Non-fatal error encountered when attempting to get votes - proposition author is a bot and does not match any stored player IDs").queue();
      return;
    }
    //The Discord profile of the player who made the proposal
    Player proposalAuthor = getMatchingPlayer(proposalAuthorAccount);
    
    //Store the amount of votes which the author of the proposal has
    int authorVotes = proposalAuthor.votes;
    
    
    //Whether or not each user has voted
    boolean[] usersVoted = new boolean[players.size()];
    
    //A list of any illegal or double votes, populated by the getVotes() function
    ArrayList<User> illegalVotes = new ArrayList<User>();
    
    int[] votes;
    String[] majorityType;
    
    
    //Try to work out the type of proposal, judging by the contents of the message
    String proposalType = getProposalType(proposalMessage.getContentDisplay());
    
    //Different behaviour depending on the type of proposal
    if(proposalType == "archived") {
      
      //Annouce that the bot is getting the votes for the author's proposal
      eventChannel.sendMessage("__Getting votes for [unknown]'s " + (proposalType == "edit" ? "rule edit" : proposalType + " proposal") + "__").queue();
      
      //Get the amounts of votes on the proposal
      votes = getVotes(proposalMessage, new Player(), true, voteTypeReactions, usersVoted, illegalVotes);
      
      //Report back the amounts of votes the proposal has
      eventChannel.sendMessage(
        "Upvotes: "    + votes[0] +
        "\nDownvotes: "  + votes[1] +
        "\nLeftvotes: "  + votes[2] +
        "\nRightvotes: " + votes[3] +
        "\n" + (votes[0] + votes[1] + votes[2] + votes[3]) + " out of " + this.totalVotes + " votes cast"
      ).queue();
      
      //Detect majority
      majorityType = detectMajorityFromVotes(voteTypeNames, votes, this.totalVotes);
      
      
    } else if(proposalType == "election") {
      
      //Annouce that the bot is getting the votes for the election
      eventChannel.sendMessage("__Getting votes for the current election__\n(This feature is incomplete)").queue();
      
      String[][] clarificationVoteTypeReactions = {{"U+31U+fe0fU+20e3"},{"U+32U+fe0fU+20e3"},{"U+33U+fe0fU+20e3"}};
      
      //Get the amounts of votes on the election
      votes = getVotes(proposalMessage, new Player(), false, clarificationVoteTypeReactions, usersVoted, illegalVotes);
      
      //Report back the amounts of votes the proposal has
      eventChannel.sendMessage(
        ":one:: "    + votes[0] +
        "\n:two:: "  + votes[1] +
        "\n:three:: "  + votes[2] +
        "\n" + (votes[0] + votes[1] + votes[2]) + " out of " + (players.size()-3) + " votes cast"
      ).queue();
      
      //Detect majority
      majorityType = detectMajorityFromVotes(voteTypeNames, votes, players.size()-3);
      
      
    } else if(proposalType == "jester") {
      
      //Annouce that the bot is getting the votes for the election
      eventChannel.sendMessage("__Getting votes for the current Court Jester vote__\n(This feature is incomplete)").queue();
      
      String[][] clarificationVoteTypeReactions = {{"U+30U+fe0fU+20e3"},{"U+31U+fe0fU+20e3"},{"U+32U+fe0fU+20e3"},{"U+33U+fe0fU+20e3"},{"U+34U+fe0fU+20e3"},{"U+35U+fe0fU+20e3"}};
      
      //Get the amounts of votes on the election
      votes = getVotes(proposalMessage, new Player(), false, clarificationVoteTypeReactions, usersVoted, illegalVotes);
      
      //Report back the amounts of votes the proposal has
      eventChannel.sendMessage(
        ":zero:: "    + votes[0] +
        "\n:one:: "    + votes[1] +
        "\n:two:: "  + votes[2] +
        "\n:three:: "  + votes[3] +
        "\n:four:: "  + votes[4] +
        "\n:five:: "  + votes[5] +
        "\n" + (votes[0] + votes[1] + votes[2] + votes[3] + votes[4] + votes[5]) + " out of " + (players.size()) + " votes cast"
      ).queue();
      
      //Detect majority
      majorityType = detectMajorityFromVotes(voteTypeNames, votes, players.size());
      
      
    } else if(proposalType == "clarification") {
      
      //Annouce that the bot is getting the votes for the clarification
      eventChannel.sendMessage("__Getting votes for a current clarification__").queue();
      
      String[][] clarificationVoteTypeReactions = {{"thumbsup","1f44d"},{"thumbsdown","1f44e"}};
      
      //Get the amounts of votes on the clarification
      votes = getVotes(proposalMessage, new Player(), false, clarificationVoteTypeReactions, usersVoted, illegalVotes);
      
      //Report back the amounts of votes the proposal has
      eventChannel.sendMessage(
        "Upvotes: "    + votes[0] +
        "\nDownvotes: "  + votes[1] +
        "\n" + (votes[0] + votes[1]) + " out of " + players.size() + " votes cast"
      ).queue();
      
      //Detect majority
      majorityType = detectMajorityFromVotes(voteTypeNames, votes, players.size());
      
      
    } else {
      
      //Annouce that the bot is getting the votes for the author's proposal
      eventChannel.sendMessage("__Getting votes for " + proposalAuthor.name + "'s " + (proposalType == "edit" ? "rule edit" : proposalType + " proposal") + "__").queue();
      
      votes = getVotes(proposalMessage, proposalAuthor, true, voteTypeReactions, usersVoted, illegalVotes);
      
      //Report back the amounts of votes the proposal has
      eventChannel.sendMessage(
        "Upvotes: "    + votes[0] +
        "\nDownvotes: "  + votes[1] +
        "\nLeftvotes: "  + votes[2] +
        "\nRightvotes: " + votes[3] +
        "\n" + (votes[0] + votes[1] + votes[2] + votes[3]) + " out of " + (this.totalVotes - authorVotes) + " votes cast"
      ).queue();
      
      //Detect majority
      majorityType = detectMajorityFromVotes(voteTypeNames, votes, this.totalVotes - authorVotes);
      
    }
    
    
    //Capitalise the first letter of the majority vote type
    if(majorityType[0].length() > 0){
      majorityType[0] = majorityType[0].substring(0,1).toUpperCase() + majorityType[0].substring(1);
    }
    
    //Report which vote has majority (if applicable)
    if(majorityType[1].equals("Majority")) {
      
      eventChannel.sendMessage("**" + majorityType[0] + "vote majority!**").queue();
      
    } else if(majorityType[1].equals("Tie")) {
      
      eventChannel.sendMessage("**" + majorityType[0] + "vote tie!**").queue();
      
    }
    
    //Send a list of users who still need to vote
    for(int p = 0;p < usersVoted.length;p ++) {
      
      if(!usersVoted[p] && players.get(p) != proposalAuthor) {
        
        eventChannel.sendMessage(players.get(p).name + " still needs to vote").queue();
        
      }
      
    }
    
    //Warn about any illegal or double votes made on the proposal
    for(int v = 0;v < illegalVotes.size();v ++) {
      eventChannel.sendMessage(illegalVotes.get(v).getName() + " has illegally voted!").queue();
    }
    
  }
  
  //Returns the amount of votes as an array of integers
  public int[] getVotes(Message proposalMessage, Player author, boolean includeMultipliers, String[][] voteTypes, boolean[] usersVoted, ArrayList<User> illegalVotes) {
    
    //List of unique reactions to the proposal message
    List<MessageReaction> reactions = proposalMessage.getReactions();
    
    //Keep track of the votes
    int[] votes = new int[voteTypes.length];
    
    //Loop through the reaction types on the message
    for(int r = 0;r < reactions.size();r ++) {
      
      ///System.out.println(reactions.get(r).toString());
      
      //Loop through the vote types
      for(int v = 0;v < voteTypes.length;v ++) {
        
        //Loop through the reaction types which count toward a type of vote
        for(int a = 0;a < voteTypes[v].length;a ++) {
          
          if(reactions.get(r).toString().contains(voteTypes[v][a])) {
            
            votes[v] += getVoteCount(reactions.get(r), author, includeMultipliers, usersVoted, illegalVotes);
            
          }
          
        }
        
      }
      
    }
    
    return votes;
    
  }
  
  //Get the amount of votes in a MessageReaction object
  public int getVoteCount(MessageReaction reaction, Player author, boolean includeMultipliers, boolean[] usersVoted, ArrayList<User> illegalVotes) {
    
    int votes = 0;
    
    //Get an iterable list of users that reacted with the given reaction
    ReactionPaginationAction users = reaction.retrieveUsers();
    
    //Loop through the list of users who reacted (this is very slow, but there's nothing I can do about that)
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
          votes += (includeMultipliers ? matchingPlayer.votes : 1);
          
          //Keep track of which players have voted
          usersVoted[matchingPlayer.turnPosition-1] = true;
          
        }
        
      }
      
    }
    
    return votes;
    
  }
  
  
  
  //Report whether a set of votes makes majority
  public String[] detectMajorityFromVotes(String[] voteTypes, int[] votes, int totalPossibleVotes) {
    
    if(voteTypes.length != votes.length) {
      return new String[]{"Error", "Error"};
    }
    
    //Possible values:
    // 0 = The type of vote
    // 1 = "Majority", "Tie", "Leading", "None"
    String[] output = {"Vote", "Type"};
    
    //Get the amount of votes that have been cast
    int totalVotesCast = 0;
    for(int v = 0;v < voteTypes.length;v ++) {
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
    for(int v = 0;v < voteTypes.length;v ++) {
      
      if(votes[v] > highest) {
        highest = votes[v];
      }
      
    }
    
    //Create a list of all votes that are at the current highest amount
    ArrayList<Integer> highestVotes = new ArrayList<Integer>();
    for(int v = 0;v < voteTypes.length;v ++) {
      
      if(votes[v] == highest) {
        highestVotes.add(v);
      }
      
    }
    
    //If only one vote type is leading
    if(highestVotes.size() == 1) {
      
      //Test if the vote type has an unbeatable lead
      boolean majority = true;
      for(int v = 0;v < voteTypes.length;v ++) {
        
        if(votes[v] + remainingVotes >= votes[highestVotes.get(0)] && v != highestVotes.get(0)) {
          majority = false;
        }
        
      }
      
      //Return the result
      output[0] = voteTypes[highestVotes.get(0)];
      output[1] = (majority ? "Majority" : "Leading");
      
      return output;
      
    } else {
      
      //Create a list of vote types that are tied
      output[0] = "";
      for(int v = 0;v < highestVotes.size();v ++) {
        
        output[0] += voteTypes[highestVotes.get(v)] + (v < highestVotes.size()-1 ? "," : "");
        
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
      int[] votes = getVotes(proposalMessage, proposalAuthor, true, voteTypeReactions, usersVoted, illegalVotes);
      
      
      //Detect majority
      String[] majorityType = detectMajorityFromVotes(voteTypeNames, votes, this.totalVotes - authorVotes);
      
      
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
    if(relevantString.contains("theme") || relevantString.contains("thematic")) {
      
      return "thematic";
      
    } else if(relevantString.contains("item")) {
      
      return "item";
      
    } else if(relevantString.contains("event")) {
      
      return "event";
      
    } else if(relevantString.contains("visual")) {
      
      return "visual";
      
    } else if(relevantString.contains("edited") || relevantString.contains("modif") || relevantString.contains("redux")) {
      
      return "modified";
      
    } else if(relevantString.contains("edit")) {
      
      return "edit";
      
    } else if(relevantString.contains("mayor") || relevantString.contains("elect")) {
      
      return "election";
      
    } else if(relevantString.contains("jest") || relevantString.contains("court") || relevantString.contains("fool")) {
      
      return "jester";
      
    } else if(relevantString.contains("delet") || relevantString.contains("remov")) {
      
      return "deletion";
      
    } else if(relevantString.contains("clarif")) {
      
      return "clarification";
      
    } else if(relevantString.contains("cont")) {
      
      return "[continued message]";
      
    } else if(!relevantString.contains("season")) {
      
      return "[invalid rule type]";
      
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
    
    public Player() {
      
      this.name = null;
      
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
  
  
  
  //Match a Discord user to a player
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
  
  
  
  //Dump all vote data from #proposals
  public void statsCommand(MessageReceivedEvent event) {
    
    MessageChannel eventChannel = event.getChannel();
    TextChannel proposalsChannel = nomicGuild.getTextChannelById(proposalsChannelID);
    
    System.out.println("Getting proposal messages...");
    
    MessagePaginationAction messages = proposalsChannel.getIterableHistory();
    
    //First method - convert MessagePaginationAction into list:
    List<Message> messagesList;
    
    try {
      
      //Get the list of all messages in the #proposals channel
      messagesList = messages.takeAsync(500).get();
      
      System.out.println("Getting votes on " + messagesList.size() + " messages...");
      eventChannel.sendMessage("Getting votes on " + messagesList.size() + " messages...").queue();
      
      //Stores the amount of votes of each type that each player has given another player
      //This is a 3D array: [voting player],[proposing player],[vote type]
      int[][][] totalVotes = new int[players.size()+1][players.size()+1][4];
      
      //Stores the amount of proposals each player has made
      int[] totalProposals = new int[players.size()+1];
      
      // Loop through List, creating a ProposalMessageStats object for each element
      for(int m = 0;m < messagesList.size();m ++){
        
        System.out.print(m + ",");
        
        ProposalMessageStats stats = new ProposalMessageStats(messagesList.get(m));
        
        if(stats.author == null){
          totalProposals[players.size()] ++;
        }else{
          totalProposals[stats.author.turnPosition-1] ++;
        }
        
        for(int pv = 0;pv < totalVotes.length;pv ++) {
          totalVotes[pv][stats.author == null ? players.size() : stats.author.turnPosition-1][stats.playerVotes[pv]] ++;
        }
        
      }
      
      String replyMessage = "**Votes**: Up,Down,Left,Right\nProposing: __";
      for(int pv = 0;pv < players.size();pv ++) {
        replyMessage += players.get(pv).name + ",  ";
      }
      replyMessage += "Other__\n";
      for(int pv = 0;pv < players.size()+1;pv ++) {
        
        if(pv == players.size()){
          replyMessage += "**Other**:   ";
        }else{
          replyMessage += "**" + (players.get(pv).name) + "**:   ";
        }
        
        for(int pp = 0;pp < players.size();pp ++) {
          
          replyMessage += totalVotes[pv][pp][0] + "," + totalVotes[pv][pp][1] + "," + totalVotes[pv][pp][2] + "," + totalVotes[pv][pp][3] + "  ";
          
        }
        replyMessage += totalVotes[pv][players.size()][0] + "," + totalVotes[pv][players.size()][1] + "," + totalVotes[pv][players.size()][2] + "," + totalVotes[pv][players.size()][3] + "  ";
        
        replyMessage += "\n";
        
      }
      
      System.out.println(replyMessage);
      
      eventChannel.sendMessage(replyMessage).queue();
      
      //Send total amount of proposals
      replyMessage = "Total proposals: ";
      for(int pv = 0;pv < players.size()+1;pv ++) {
        replyMessage += totalProposals[pv] + "            ";
      }
      eventChannel.sendMessage(replyMessage).queue();
      
    } catch(ExecutionException e) {
      e.printStackTrace();
    } catch(InterruptedException e) {
      e.printStackTrace();
    }
    
    
    
    //Alternate method - use a foreach loop to loop through the MessagePaginationAction object:
    ///for(Message message : messages) {
    ///  
    ///}
    
    
  }
  
  
  
  //Used solely for the statsCommand() function
  public class ProposalMessageStats {
    
    //The author of the proposal
    Player author;
    //How each player voted (integer represents an element in the voteTypeNames array)
    int[] playerVotes = new int[players.size()+1];
    //Type of proposal
    String type;
    
    public ProposalMessageStats(Message proposalMessage) {
      
      author = getMatchingPlayer(proposalMessage.getAuthor());
      type = getProposalType(proposalMessage.getContentDisplay());
      
      for(int p = 0;p < playerVotes.length;p ++) {
        playerVotes[p] = 3;
      }
      if(type != "election" && type != "jester" && type != "clarification" && type != "[continued message]" && type != "[invalid rule type]"){
        ///if(type != "archived" && type != "modified"){
        getPlayerVotes(proposalMessage.getReactions());
        ///}
      }
      
      //System.out.println("Author: " + author.name);
      //System.out.println("Type: " + type);
      //for(int p = 0;p < playerVotes.length;p ++) {
      //  System.out.print(playerVotes[p] + ",");
      //}
      //System.out.println("");
      
    }
    
    public void getPlayerVotes(List<MessageReaction> reactions) {
      
      //Loop through the reaction types on the message
      for(int r = 0;r < reactions.size();r ++) {
        
        //Loop through the vote types
        for(int v = 0;v < voteTypeReactions.length;v ++) {
          
          //Loop through the reaction types which count toward a type of vote
          for(int a = 0;a < voteTypeReactions[v].length;a ++) {
            
            if(reactions.get(r).toString().contains(voteTypeReactions[v][a])) {
              
              ReactionPaginationAction users = reactions.get(r).retrieveUsers();
              
              //Loop through the list of users who reacted (this is very slow, but there's nothing I can do about that)
              for(User user : users) {
                
                boolean matchingPlayer = false;
                
                //Loop through all players
                for(int p = 0;p < players.size();p ++) {
                  
                  //Loop through the player's possible user IDs
                  for(int uid = 0;uid < players.get(p).userIDs.length;uid ++) {
                    
                    //Check if the player's user ID matches the ID of the given user
                    if(players.get(p).userIDs[uid].equals(user.getId())) {
                      
                      playerVotes[p] = v;
                      matchingPlayer = true;
                      
                    }
                    
                  }
                  
                }
                
                if(!matchingPlayer){
                  playerVotes[players.size()] = v;
                }
                
              }
              
            }
            
          }
          
        }
        
      }
      
    }
    
  }
  
  
}










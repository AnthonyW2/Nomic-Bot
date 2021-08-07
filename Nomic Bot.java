/**
  Anthony Wilson
  
  2021-8-7
  
  Nomic Discord bot
  
  v2.0.1
**/



import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.exceptions.PermissionException;
import net.dv8tion.jda.api.exceptions.RateLimitedException;
import net.dv8tion.jda.api.hooks.ListenerAdapter;

import javax.security.auth.login.LoginException;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;



public class TestBot extends ListenerAdapter {
  
  
  String commandPrefix = "$";
  
  
  public static void main(String[] args) {
    
    try {
      
      JDA jda = JDABuilder.createDefault("").addEventListeners(new TestBot()).build();
      jda.awaitReady();
      System.out.println("Bot initialised successfully");
      
      jda.getPresence().setActivity(Activity.playing("Polynomics"));
      System.out.println("Set status\n");
      
    } catch(LoginException e) {
      
      e.printStackTrace();
      
    } catch(InterruptedException e) {
      
      e.printStackTrace();
      
    }
    
  }
  
  
  
  //Define the functionality for when a message is received by the bot
  @Override
  public void onMessageReceived(MessageReceivedEvent event) {
    
    JDA jda = event.getJDA();
    
    //Store the amount of Discord events received since the last reconnect
    long responseNumber = event.getResponseNumber();
    
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
  
  
  
  public void handleMessage(MessageReceivedEvent event) {
    
    JDA jda = event.getJDA();
    
    MessageChannel channel = event.getChannel();
    String messageContents = event.getMessage().getContentDisplay();
    
    if(messageContents.equals(this.commandPrefix + "ping")) {
      
      channel.sendMessage("pong!").queue();
      
    } else if(messageContents.equals(this.commandPrefix + "help")) {
      
      this.helpCommand(event);
      
    } else if(messageContents.length() > (3 + this.commandPrefix.length()) && messageContents.substring(0,4 + this.commandPrefix.length()).equals(this.commandPrefix + "roll")) {
      
      this.rollCommand(event);
      
    } else if(messageContents.equals(this.commandPrefix + "colour")) {
      
      channel.sendMessage( event.getMember().getColor().toString() ).queue();
      
    } else if(messageContents.length() > (6 + this.commandPrefix.length()) && messageContents.substring(0,7 + this.commandPrefix.length()).equals(this.commandPrefix + "replace")) {
      
      this.replaceCommand(event);
      
    }
    
  }
  
  
  
  public void helpCommand(MessageReceivedEvent event) {
    
    event.getChannel().sendMessage("Just ask <@384443337341534212>").queue();
    
  }
  
  
  
  public void rollCommand(MessageReceivedEvent event) {
    
    //Use a D6 by default
    int die = 6;
    
    if(event.getMessage().getContentDisplay().length() > (5 + this.commandPrefix.length())){
      
      String params = event.getMessage().getContentDisplay().substring(6);
      
      try {
        
        //Set the size of the die
        if(params.charAt(0) == 'd' || params.charAt(0) == 'D'){
          die = Integer.parseInt(params.substring(1));
        }else{
          die = Integer.parseInt(params);
        }
        
      } catch(NumberFormatException e) {
        
        //If the user supplies a non-integer parameter for the die size, send a warning message
        event.getChannel().sendMessage("Invalid die size").queue();
        
      }
      
    }
    
    if(die > 0){
      
      //Generate random integer
      int roll = ThreadLocalRandom.current().nextInt(die) + 1;
      
      //Print message
      event.getChannel().sendMessage("Rolling **D" + die + "**:\n" + roll).queue();
      
    }
    
  }
  
  
  
  public void replaceCommand(MessageReceivedEvent event) {
    
    User author = event.getAuthor();
    Message message = event.getMessage();
    MessageChannel channel = event.getChannel();
    
    //Store original message
    String messageContents = message.getContentDisplay();
    
    //Remove original message
    message.delete().queue();
    
    //Send message contents
    if(messageContents.length() > (7 + this.commandPrefix.length())){
      channel.sendMessage("**<" + author.getName() + ">** " + messageContents.substring(9)).queue();
    }
    
  }
  
  
  
}










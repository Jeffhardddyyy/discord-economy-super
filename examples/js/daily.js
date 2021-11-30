/* importing the module */
const economy = require('discord-economy-super');

/* these are the settings for the module */
const eco = new Economy({
  dailyCooldown: 60000 * 60 * 24, /* how often should daily be redeemed in ms? by default, it's every 1d. */
  dailyAmount: 100 /* How much should be given for daily rewards? default: 100 */
})

/* any command handler will work */
module.exports(message){
 name:"daily",
 description:"Get a daily reward!",
 execute(message){
  /* when the user runes [prefix]daily */
   
//   eco.rewards.daily(userID, guildID)
// use "123" for 'global', otherwise, this will be 'per server'
   const daily = eco.rewards.daily(message.author.id, message.guild.id)
   
   if(!daily.status) // the user already claimed their daily
     return message.reply(`You have already claimed your daily reward! You will be allowed to reclaim your daily reward in:**${daily.value.days}** days, **${daily.value.hours}** hours, **${daily.value.minutes}** minutes and **${daily.value.seconds}** seconds.`);
   
   //if they have yet to claim their daily reward, discord-economy-super will have handled everything, all you have to do is let the user know.
   return message.reply(`You have claimed your daily reward of ${daily.reward} coins!`)
     
 }
}

/* written by totallydilly, if you need help, let the "Shadow Development" discord now The link can be found on the Modules Website: https://des-docs.tk/#/
or add totallydilly on discord: totallydilly#1127

*/ 

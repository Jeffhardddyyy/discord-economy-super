/* importing the module */
const economy = require('discord-economy-super');

/* these are the settings for the module */
const eco = new Economy({
  workCooldown: 60000 * 60, /* how often should work be redeemed in ms? by default, it's once an hour. */
  workAmount: [10, 50] /* a range on how much working should provide. By default, it's 10-50 coins. */
})

/* any command handler will work */
module.exports(message){
 name:"daily",
 description:"Get a daily reward!",
 execute(message){
  /* when the user runes [prefix]daily */
   
//   eco.rewards.work(userID, guildID)
// use "123" for 'global', otherwise, this will be 'per server'
  
   const work = eco.rewards.work(message.author.id, message.guild.id)   
   
   if(!work.status) // the user already claimed their work
        if (!work.status) return message.channel.send(`You have already worked! Time left until next work: **${work.value.days}** days, **${work.value.hours}** hours, **${work.value.minutes}** minutes and **${work.value.seconds}** seconds.`)
   
   
   //if they have yet to claim their daily reward, discord-economy-super will have handled everything, all you have to do is let the user know.
   return message.reply(`You have claimed your daily reward of ${daily.reward} coins!`)
     
 }
}

/* written by totallydilly, if you need help, let the "Shadow Development" discord now The link can be found on the Modules Website: https://des-docs.tk/#/
or add totallydilly on discord: totallydilly#1127

*/ 

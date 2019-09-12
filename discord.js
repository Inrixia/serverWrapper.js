const thisModule = 'discord'

// Import core packages
const properties = require('properties');
const discordjs = require("discord.js");
const modul = new [require('./modul.js')][0](thisModule);



// Set defaults
const discord = new discordjs.Client();
let sS = {} // serverSettings
let mS = {} // moduleSettings
let managementChannel = null; // This will be assigned the management channel when the server starts
let chatChannel = null; 
let discordData = "";
let flatMessages = {};
let serverStarted = true;

let fn = {
	init: async message => {
		[sS, mS] = modul.loadSettings(message)
		modul.event.on('serverStdout', message => serverStdout(message))
		modul.event.on('consoleStdout', message => {
			//if (managementChannel) managementChannel.send(`[BOX] > ${message}\n`, { split: true })
		})
		await buildMatches()
		await openDiscord();
	},
	discordStdin: async (message) => {
		let channel = managementChannel;
		if (message.channel) channel = discord.guilds.get('155507830076604416').channels.get(message.channel)
		else if (message.userID) channel = discord.users.get(message.userID);
		await channel.send(message.msg)
	}
}

// Module command handling
process.on('message', async message => {
	switch (message.function) {
		case 'execute':
			if (!(message.func in fn)) modul.reject(new Error(`Command ${message.func} does not exist in module ${thisModule}`), message.promiseId, message.returnModule)
			fn[message.func](message.data)
			.then(data => modul.resolve(data, message.promiseId, message.returnModule))
			.catch(err => modul.reject(err, message.promiseId, message.returnModule))
			break;
		case 'pushSettings':
			[sS, mS] = modul.loadSettings(message)
			break;
	}
});

async function openDiscord() {
	// Fetch discordToken to use and display it at launch
	console.log(`Using Discord Token: ${sS.c[sS.modules['discord'].color].c}${mS.discordToken}${sS.c['reset'].c}`);
	discord.login(mS.discordToken);
}

// On discord client login
discord.on('ready', () => {
	managementChannel = discord.guilds.get('155507830076604416').channels.get(mS.managementChannelId);
	if(mS.chatLink.chatChannelId) chatChannel = discord.guilds.get('155507830076604416').channels.get(mS.chatLink.chatChannelId);
	properties.parse('./server.properties', {path: true}, (err, properties) => {
		if (err) modul.lErr(err);
		else discord.user.setActivity(properties.motd.replace(/§./g, '').replace(/\n.*/g, '').replace('// Von Spookelton - ', '').replace(' \\\\', ''), { type: 'WATCHING' })
	});
})

// On receive message from discord server
discord.on('message', async message => {
	let discordMessage = {
		channel : {
			id: ((message.channel||{}).id||null),
			name: ((message.channel||{}).name||null),
			calculatedPosition: ((message.channel||{}).calculatedPosition||null),
			type: ((message.channel||{}).type||null)
		},
		user: {
			id: ((discord.user||{}).id||null),
			username: ((discord.user||{}).username||null),
			avatar: ((discord.user||{}).avatar||null),
			avatarURL: ((discord.user||{}).avatarURL||null)
		},
		author: {
			id: ((message.author||{}).id||null),
			username: ((message.author||{}).username||null),
			avatarURL: ((message.author||{}).avatarURL||null)
		},
		member: {
			roles: (((message.member||{}).roles||new discordjs.Collection()).array()||null)
		},
		mentions: {
			users: (((message.mentions||{}).users||new discordjs.Collection()).map(function(mentionedUser) {
				return {
					id: ((mentionedUser||{}).id||null),
					username: ((mentionedUser||{}).username||null),
					avatar: ((mentionedUser||{}).avatar||null),
					avatarURL: ((mentionedUser||{}).avatarURL||null)
				};
			})||null),
			roles: (((message.mentions||{}).roles||new discordjs.Collection()).map(function(mentionedRole) {
				return {
					id: ((mentionedRole||{}).id||null),
					name: ((mentionedRole||{}).name||null),
					color: ((mentionedRole||{}).color||null)
				};
			})||null),
			channels: (((message.mentions||{}).channels||new discordjs.Collection()).map(function(mentionedChannel) {
				return {
					id: ((mentionedChannel||{}).id||null),
					name: ((mentionedChannel||{}).name||null),
					calculatedPosition: ((mentionedChannel||{}).calculatedPosition||null),
					type: ((mentionedChannel||{}).type||null)
				};
			})||null),
			everyone: (((message.mentions||{}).everyone||new discordjs.Collection()).array()||null),
		}
	}
	discordMessage.logTo = {
		console: true,
		discord: { channel: discordMessage.channel.id }
	}
	if (message.isMemberMentioned(discord.user)) discordMessage.string = message.toString().trim().slice(message.toString().trim().indexOf(' ')+1, message.toString().trim().length)
	else if (message.channel.id == mS.managementChannelId && message.author.id != discord.user.id) discordMessage.string = message.toString().trim();
	if (discordMessage.string) modul.emit('discordMessage', discordMessage)
	if(chatChannel && discordMessage.channel.id === mS.chatLink.chatChannelId) {
		// modul.pSend(process, {
		// 	function: 'serverStdin',
		// 	string: `/say ${discordMessage.user.username}: ${discordMessage.string}`
		// });
	}
	/*if (message.toString() == '^') {
		message.channel.send(`
		${"```"}javascript
		parentObject: {
			childObject: {
				childTitle: 'Blah'
			}
		}${"```"}`, { split: true }).then(responseMessage => {
			responseMessage.react('⬆');
			responseMessage.react('⬇');

			let reactFilter = (reaction, user) => reaction.emoji.name === '⬆' || ;
			responseMessage.awaitReactions(reactFilter, {time: 5000}).then(reactions => {
				debug((reactions.first().name == '⬆') + 'up')
				debug((reactions.first().name == '⬇') + 'down')
			});
		})
	}*/
})

async function sendChat(msg) { if (chatChannel) chatChannel.send(msg, { split: true }); }
async function serverStdout(string) {
	// every message we send spawns another stdout, so we don't want to infinite loop
	if (string.indexOf('DiscordIntegration') > -1) return;
	let trueString = string.split('\n')
	for (let i = 0; i < trueString.length - 1; i++) {
		flatMessages[trueString[i]+'\n'] = flatMessages[trueString[i]+'\n'] || 0;
		flatMessages[trueString[i]+'\n']++;
	}

	setTimeout(() => {
		if (flatMessages != {}) {
			for (message in flatMessages) {
				if (flatMessages[message] > 1) discordData += `**${flatMessages[message]}x** ${message}`;
				else discordData += message;
				delete flatMessages[message];
			}
			if (discordData != "" && managementChannel) {
				managementChannel.send(discordData, { split: true })
				discordData = "";
			}
		}
	}, mS.messageFlushRate)

	if(!serverStarted) {
		serverStarted = true;
		sendChat("Server Started");
	} else {
		for (eventKey in mS.chatLink.eventTranslation) {
			let event = mS.chatLink.eventTranslation[eventKey];
			if (event.match != false) {
				if ((string.search(event.matchRegex) > -1 && (string.indexOf('>') == -1) )) { // || eventKey == "PlayerMessage"
					let match = Array.from(string.match(event.matchRegex));
					let content = event.content;
					if (event.matchRelation) event.matchRelation.forEach(async (matchedWord, i) => {
						if (event.send.content) content = content.replace(matchedWord, match[i+1]);
						if (event.send.embed) {
							for (key in event.embed) {
								if (typeof event.embed[key] == "object") { 
									for (childKey in event.embed[key]) {
										if (typeof event.embed[key][childKey] == "object") {
											for (granChildKey in event.embed[key][childKey]) {
												if (typeof event.embed[key][childKey] != "object") event.embed[key][childKey][granChildKey].replace(matchedWord, match[i+1])
											}
										} else event.embed[key][childKey] = event.embed[key][childKey].replace(matchedWord, match[i+1])
									}
								} else event.embed[key] = event.embed[key].replace(matchedWord, match[i+1])
							}
						}
					})
				}
			}
		}
	}
}

async function buildMatches() {
	for (key in mS.chatLink.eventTranslation) {
		if (mS.chatLink.eventTranslation[key].match) {
			mS.chatLink.eventTranslation[key].matchRelation = mS.chatLink.eventTranslation[key].match.match(/\%(.*?)\%/g);
			mS.chatLink.eventTranslation[key].matchRegex = `.* ${mS.chatLink.eventTranslation[key].match.replace(/\%(.*?)\%/g, '(.*?)')}\\r\\n$`;
		}
	}
	return;
}
const thisModule = 'moduleName';

// Import core packages
const moment = require('moment');
const modul = new [require('./modul.js')][0](thisModule)
const util = {
	...require('./util/children.js'),
	...require('./util/moment.js')
}

// Set defaults
let sS = {} // serverSettings
let mS = {} // moduleSettings
let fn = {
	startBackupInterval: async () => {
		if (backupInterval) await clearInterval(backupInterval);
		await startBackupInterval();
		return {
			console: `${sS.c[sS.modules['backup'].color].c}Automatic backup's started!${sS.c['reset'].c} Next backup in ${moment(timeToNextBackup).fromNow()}`,
			minecraft: `tellraw ${message.logTo.user} ${JSON.stringify(
				[{
					"text": `Automatic backup's started!`,
					"color": sS.c[sS.modules['backup'].color].m
				}, {
					"text": `Next backup in ${moment(timeToNextBackup).fromNow()}`,
					"color": "white"
				}]
			)}\n`,
			discord : {
				string: null,
				embed: {
					color: parseInt(sS.c[sS.modules['backup'].discordColor||sS.modules['backup'].color].h, 16),
					title: `Automatic backup's started...`,
					description: `Next backup in ${moment(timeToNextBackup).fromNow()}`,
					timestamp: new Date()
				}
			}
		}
	},
	clearBackupInterval: async () => {
		await clearInterval(backupInterval);
		timeToNextBackup = null;
		await pushStats();
		return {
			console: `${sS.c[sS.modules['backup'].color].c}Automatic backup's stopped!${sS.c['reset'].c}`,
			minecraft: `tellraw ${message.logTo.user} ${JSON.stringify(
				{
					"text": `Automatic backup's stopped!`,
					"color": sS.c[sS.modules['backup'].color].m
				}
			)}\n`,
			discord : {
				string: null,
				embed: {
					color: parseInt(sS.c[sS.modules['backup'].discordColor||sS.modules['backup'].color].h, 16),
					title: `Automatic backup's stopped...`,
					description: null,
					timestamp: new Date()
				}
			}
		}
	},
	setBackupInterval: async (data) => {
		await clearInterval(backupInterval);
		mS.backupIntervalInHours = data.args[1];
		timeToNextBackup = moment().add(data.args[1], 'hours');
		if (message.args[2]) await modul.saveSettings(sS, mS);
		return await startBackupInterval()
	},
	setBackupDir: async (data) => {
		mS.overrideBackupDir = data.backupDir;
	},
	getBackupDir: async () => {
		let backupDir =  (mS.overrideBackupDir)?mS.overrideBackupDir:mS.rootBackupDir+sS.serverName
		return {
			discord : {
				string: null,
				embed: {
					color: parseInt(sS.c[sS.modules['backup'].discordColor||sS.modules['backup'].color].h, 16),
					title: `Saving backups in: ${backupDir}`,
					description: null,
					timestamp: new Date()
				}
			},
			console: `Saving backups in: ${sS.c[sS.modules['backup'].color].c}${backupDir}${sS.c['reset'].c}`,
			minecraft: `tellraw ${message.logTo.user} ${JSON.stringify(
				[{
					"text": `Saving backups in: `,
					"color": "white"
				}, {
					"text": backupDir,
					"color": sS.c[sS.modules['backup'].color].m
				}]
			)}\n`
		}
	},
	runBackup: runBackup,
	fetchStats: pushStats,
	nextBackup: async () => {
		return {
			discord : {
				string: null,
				embed: {
					color: parseInt(sS.c[sS.modules['backup'].discordColor||sS.modules['backup'].color].h, 16),
					title: `${timeToNextBackup ? `Next backup in ${moment(timeToNextBackup).fromNow()}` : 'Backups disabled...'}`,
					description: null,
					timestamp: new Date()
				}
			},
			console: `${ timeToNextBackup ? `${sS.c[sS.modules['backup'].color].c}Next backup ${moment(timeToNextBackup).fromNow()}` : `${sS.c[sS.modules['backup'].color].c}Backups disabled...`}${sS.c['reset'].c}`,
			minecraft: `tellraw ${message.logTo.user} ${JSON.stringify(
				[{
					"text": timeToNextBackup ? `Next backup ` : 'Backups disabled...',
					"color": timeToNextBackup ? '' : sS.c[sS.modules['backup'].color].m
				}, {
					"text": timeToNextBackup ? moment(timeToNextBackup).fromNow() : '',
					"color": timeToNextBackup ? sS.c[sS.modules['backup'].color].m : ''
				}]
			)}\n`
		}
	},
	lastBackup: async () => {
		return {
			discord : {
				string: null,
				embed: {
					color: parseInt(sS.c[sS.modules['backup'].discordColor||sS.modules['backup'].color].h, 16),
					title: (lastBackupStartTime) ? `Last backup happened ${moment(lastBackupStartTime).fromNow()}` : "No backup has occoured yet...",
					description: lastBackupDuration ? `Took: ${lastBackupDuration}` : null,
					timestamp: new Date()
				}
			},
			console: `${(lastBackupStartTime) ? `Last backup happened ${sS.c[sS.modules['backup'].color].c}${moment(lastBackupStartTime).fromNow()}` : `${sS.c[sS.modules['backup'].color].c}No backup has occoured yet...`}${sS.c['reset'].c}`,
			minecraft: `tellraw ${message.logTo.user} ${JSON.stringify(
				[{
					"text": `${(lastBackupStartTime) ? 'Last backup happened ' : 'No backup has occoured yet...'}`,
					"color": (lastBackupStartTime) ? '' : sS.c[sS.modules['backup'].color].m
				}, {
					"text": `${(lastBackupStartTime) ? moment(lastBackupStartTime).fromNow() : ''}`,
					"color": (lastBackupStartTime) ? sS.c[sS.modules['backup'].color].m : ''
				}]
			)}\n`
		}
	}
}

let backupInterval = null;
let timeToNextBackup = null;
let lastBackupDuration = null;
let lastBackupStartTime = null;
let lastBackupEndTime = null;
let lastBackupDurationString = null;

// Module command handling
process.on('message', async message => {
	switch (message.function) {
		case 'init':
			[sS, mS] = modul.loadSettings(message)
			startBackupInterval();
			exportCommands();
			break;
		case 'execute':
			fn[message.func](message.data)
			.then(data => modul.resolve(data, message.promiseId, message.returnModule))
			.catch(err => modul.reject(err, message.promiseId, message.returnModule))
			break;
		case 'pushSettings':
			[sS, mS] = modul.loadSettings(message)
			break;
	}
});

async function pushStats() {
	return await modul.send('stats', 'pushStats', { timeToNextBackup: timeToNextBackup ? timeToNextBackup.fromNow() : 'Backups disabled', timeSinceLastBackup: (lastBackupEndTime != null) ? lastBackupEndTime.fromNow() : null, lastBackupDuration: lastBackupDurationString })
}

async function startBackupInterval() {
	timeToNextBackup = moment().add(mS.backupIntervalInHours, 'hours');
	await pushStats();
	backupInterval = setInterval(async () => {
		await runBackup();
		timeToNextBackup = moment().add(mS.backupIntervalInHours, 'hours');
	}, mS.backupIntervalInHours*60*60*1000);
	return timeToNextBackup;
}

async function runBackup() {
	lastBackupStartTime = moment();
	await modul.pSend(process, { function: 'serverStdin', string: 'save-off\n' });
	process.stdout.write(mS.messages.backupStarting.console+'\n');
	await modul.pSend(process, { function: 'serverStdin', string: mS.messages.backupStarting.minecraft+'\n' })
	await modul.send('stats', 'pushStats', { status: 'Backing Up', timeToBackup: timeToNextBackup.fromNow() })
	let backupDir = mS.overrideBackupDir ? mS.overrideBackupDir : mS.rootBackupDir+sS.serverName;
	//children.spawn('robocopy', [sS.modules['properties'].settings.p['level-name'], `${backupDir}/${moment().format('MMMMDDYYYY_h-mm-ssA')}/Cookies`, (mS.threads > 1) ? `/MT:${mS.threads}` : '', '/E'], {shell: true, detached: true}).on('close', function (code) {
	await util.exec(`ssh ${mS.remote.user}@${mS.remote.ip} -p ${mS.remote.port} "mkdir -p ${backupDir} && mkdir -p ${mS.remote.publicBackupDir}${sS.serverName}/"`, {})
	await util.exec(`rsync-snapshot --src ${sS.server_dir} -p ${mS.remote.port} --shell "ssh -p ${mS.remote.port}" --dst ${mS.remote.user}@${mS.remote.ip}:${backupDir} --setRsyncArg exclude='*.log' --setRsyncArg exclude='*.zip' --setRsyncArg exclude='*.rar' --setRsyncArg exclude='*node_modules*' --maxSnapshots 100000`)
	let info = await util.exec(`ssh ${mS.remote.user}@${mS.remote.ip} -p ${mS.remote.port} "ls /mnt/redlive/LiveArchives/${sS.serverName}"`)
	let latestFolder = info.split(/\r?\n/).slice(-3, -2)[0];
	//console.log(`ln -s ${backupDir}/${latestFolder}/${sS.serverName}/${sS.modules['properties'].settings.p['level-name']} ${mS.remote.publicBackupDir}${sS.serverName}/${latestFolder} && ln -s ${backupDir}/latest/${sS.serverName}/${sS.modules['properties'].settings.p['level-name']} ${mS.remote.publicBackupDir}${sS.serverName}/latest`)
	await util.exec(`ssh ${mS.remote.user}@${mS.remote.ip} -p ${mS.remote.port} "ln -s ${backupDir}/${latestFolder}/${sS.serverName}/${sS.modules['properties'].settings.p['level-name']} ${mS.remote.publicBackupDir}${sS.serverName}/${latestFolder} && ln -s ${backupDir}/latest/${sS.serverName}/${sS.modules['properties'].settings.p['level-name']} ${mS.remote.publicBackupDir}${sS.serverName}/latest"`)
	lastBackupEndTime = moment();
	lastBackupDuration = moment.duration(lastBackupEndTime.diff(lastBackupStartTime));
	let t = {
		ms: lastBackupDuration.milliseconds(),
		s: lastBackupDuration.seconds(),
		m: lastBackupDuration.minutes(),
		h: lastBackupDuration.hours()
	}
	lastBackupDurationString = `${(t.m>0) ? `${t.m}min, ` : ''}${(t.s>0) ? `${t.s}sec, ` : ''}${(t.ms>0) ? `${t.ms}ms` : ''}`;
	await modul.pSend(process, { function: 'serverStdin', string: 'save-on\n' });
	process.stdout.write(mS.messages.backupEnded.console.replace("%duration%", lastBackupDurationString)+'\n');
	await modul.pSend(process, { function: 'serverStdin', string: mS.messages.backupEnded.minecraft+'\n' })
	await pushStats();
	return lastBackupDurationString
}

async function exportCommands () {
	modul.send('command', 'importCommands', [{
		name: 'backup',
		exeFunc: 'runBackup',
		module: thisModule,
		description: {
			grouping: 'Backups',
			summary: `Starts a backup.`,
			console: `${sS.c['white'].c}Starts a backup. ${sS.c['reset'].c}Example: ${sS.c['yellow'].c}~backup${sS.c['reset'].c}`,
			minecraft: [{
				"text": `Starts a backup. `,
				"color": sS.c['brightWhite'].m
			}, {
				"text": 'Example: ',
				"color": sS.c['white'].m
			}, {
				"text": '~backup ',
				"color": sS.c['yellow'].m
			}],
			discord: {
				string: null,
				embed: {
					title: "Backup",
					description: "~backup",
					color: parseInt(sS.c['orange'].h, 16),
					timestamp: new Date(),
					fields: [{
						name: "Description",
						value: "Starts a backup."
					}, {
						name: "Example",
						value: "**~backup**"
					}]
				}
			}
		}
	}, {
		name: 'startBackupInterval',
		exeFunc: 'startBackupInterval',
		module: thisModule,
		description: {
			grouping: 'Backups',
			summary: `Starts automatic backups.`,
			console: `${sS.c['white'].c}Starts automatic backups. ${sS.c['reset'].c}Example: ${sS.c['yellow'].c}~startBackupInterval${sS.c['reset'].c}`,
			minecraft: [{
				"text": `Starts automatic backups. `,
				"color": sS.c['brightWhite'].m
			}, {
				"text": 'Example: ',
				"color": sS.c['white'].m
			}, {
				"text": '~startBackupInterval ',
				"color": sS.c['yellow'].m
			}],
			discord: {
				string: null,
				embed: {
					title: "Start Backup Interval",
					description: "~startBackupInterval",
					color: parseInt(sS.c['orange'].h, 16),
					timestamp: new Date(),
					fields: [{
						name: "Description",
						value: "Starts automatic backups."
					}, {
						name: "Example",
						value: "**~startBackupInterval**"
					}]
				}
			}
		}
	}, {
		name: 'clearBackupInterval',
		exeFunc: 'clearBackupInterval',
		module: thisModule,
		description: {
			grouping: 'Backups',
			summary: `Stops automatic backups.`,
			console: `${sS.c['white'].c}Stops automatic backups. ${sS.c['reset'].c}Example: ${sS.c['yellow'].c}~clearBackupInterval${sS.c['reset'].c}`,
			minecraft: [{
				"text": `Stops automatic backups. `,
				"color": sS.c['brightWhite'].m
			}, {
				"text": 'Example: ',
				"color": sS.c['white'].m
			}, {
				"text": '~clearBackupInterval ',
				"color": sS.c['yellow'].m
			}],
			discord: {
				string: null,
				embed: {
					title: "Clear Backup Interval",
					description: "~clearBackupInterval",
					color: parseInt(sS.c['orange'].h, 16),
					timestamp: new Date(),
					fields: [{
						name: "Description",
						value: "Stops automatic backups."
					}, {
						name: "Example",
						value: "**~clearBackupInterval**"
					}]
				}
			}
		}
	}, {
		name: 'setBackupInterval',
		exeFunc: 'setBackupInterval',
		description: {
			grouping: 'Backups',
			summary: `Sets backup interval.`,
			console: `${sS.c['white'].c}Sets backup interval. ${sS.c['reset'].c}Example: ${sS.c['yellow'].c}~setBackupInterval${sS.c['reset'].c}`,
			minecraft: [{
				"text": `Sets backup interval. `,
				"color": sS.c['brightWhite'].m
			}, {
				"text": 'Example: ',
				"color": sS.c['white'].m
			}, {
				"text": '~setBackupInterval ',
				"color": sS.c['yellow'].m
			}],
			discord: {
				string: null,
				embed: {
					title: "Set Backup Interval",
					description: "~setBackupInterval",
					color: parseInt(sS.c['orange'].h, 16),
					timestamp: new Date(),
					fields: [{
						name: "Description",
						value: "Sets backup interval."
					}, {
						name: "Example",
						value: "**~setBackupInterval**"
					}]
				}
			}
		}
	}, {
		name: 'backupDir',
		exeFunc: 'getbackupDir',
		module: thisModule,
		description: {
			grouping: 'Backups',
			summary: `Gets backup directory.`,
			console: `${sS.c['white'].c}Gets backup directory. ${sS.c['reset'].c}Example: ${sS.c['yellow'].c}~backupDir${sS.c['reset'].c}`,
			minecraft: [{
				"text": `Gets backup directory. `,
				"color": sS.c['brightWhite'].m
			}, {
				"text": 'Example: ',
				"color": sS.c['white'].m
			}, {
				"text": '~backupDir',
				"color": sS.c['yellow'].m
			}],
			discord: {
				string: null,
				embed: {
					title: "Get Backup Directory",
					description: "~backupDir",
					color: parseInt(sS.c['orange'].h, 16),
					timestamp: new Date(),
					fields: [{
						name: "Description",
						value: "Gets backup directory."
					}, {
						name: "Example",
						value: "**~backupDir**"
					}]
				}
			}
		}
	}, {
		name: 'nextBackup',
		exeFunc: 'nextBackup',
		description: {
			grouping: 'Backups',
			summary: `Gets time to next backup.`,
			console: `${sS.c['white'].c}Gets time to next backup. ${sS.c['reset'].c}Example: ${sS.c['yellow'].c}~nextBackup${sS.c['reset'].c}`,
			minecraft: [{
				"text": `Gets time to next backup. `,
				"color": sS.c['brightWhite'].m
			}, {
				"text": 'Example: ',
				"color": sS.c['white'].m
			}, {
				"text": '~nextBackup',
				"color": sS.c['yellow'].m
			}],
			discord: {
				string: null,
				embed: {
					title: "Next Backup",
					description: "~nextBackup",
					color: parseInt(sS.c['orange'].h, 16),
					timestamp: new Date(),
					fields: [{
						name: "Description",
						value: "Gets time to next backup."
					}, {
						name: "Example",
						value: "**~nextBackup**"
					}]
				}
			}
		}
	}, {
		name: 'lastBackup',
		exeFunc: 'lastBackup',
		description: {
			grouping: 'Minecraft',
			summary: `Gets last backup info.`,
			console: `${sS.c['white'].c}Gets last backup info. ${sS.c['reset'].c}Example: ${sS.c['yellow'].c}~lastBackup${sS.c['reset'].c}`,
			minecraft: [{
				"text": `Gets last backup info. `,
				"color": sS.c['brightWhite'].m
			}, {
				"text": `Example: `,
				"color": sS.c['white'].m
			}, {
				"text": `~lastBackup`,
				"color": sS.c['yellow'].m
			}],
			discord: {
				string: null,
				embed: {
					title: "Last Backup",
					description: "~lastBackup",
					color: parseInt(sS.c['orange'].h, 16),
					timestamp: new Date(),
					fields: [{
						name: "Description",
						value: "Gets last backup info, time etc."
					}, {
						name: "Example",
						value: "**~lastBackup**"
					}]
				}
			}
		}
	}])
	.catch(err => lErr(err, `Command module failed to import coommands for ${thisModule}`))
}
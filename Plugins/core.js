let mergedCommands = ['help', 'h', 'menu', 'alias', 'aliasmenu'];

module.exports = {
  name: 'others',
  alias: [...mergedCommands],
  uniquecommands: [],
  description: 'All miscleaneous commands',
  start: async (Atlas, m, { pushName, prefix, inputCMD, doReact }) => {
    switch (inputCMD) {
      case 'help':
      case 'h':
      case 'menu':
        // console.time();
        // await doReact('☃️');
        // await Atlas.sendPresenceUpdate('composing', m.from);
        var helpText = `Konnichiwa *${pushName}* senpai,\nI am *${botName}*, a WhatsApp bot at your service.\n\n*🔖 Bot Prefix is* ${prefix}\n\n${formattedCommands}\n\nType \`\`\`${prefix}alias\`\`\` for alias menu.\n\n*©️ Team ATLAS- 2023*\n*👨‍💻 Edo1989*`;
        await Atlas.sendMessage(
          m.from,
          //   { video: { url: botVideo }, gifPlayback: true, caption: helpText },
          { text: helpText },
          { quoted: m }
        );
        // console.timeEnd();
        break;

      case 'alias':
      case 'aliasmenu':
        var helpText = `*Aliases Menu*\n\n${formatAliasses}\n\n*©️ Team ATLAS- 2023*\n*👨‍💻 Edo1989*`;
        await Atlas.sendMessage(m.from, { text: helpText }, { quoted: m });
        break;

      default:
        break;
    }
  },
};

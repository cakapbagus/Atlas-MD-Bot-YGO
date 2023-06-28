const {
  getBanList,
  getRuling,
  searchCard,
  getStatus,
  getArtwork,
  getPrice_TCGplayer,
} = require('../System/YGO/Scraping');

let mergedCommands = [
  'art',
  'a',
  'gallery',
  'artwork',
  'card',
  'c',
  'id',
  'effect',
  'ef',
  'eff',
  'rule',
  'r',
  'faq',
  'tcgbanlist',
  'tcg',
  'ocgbanlist',
  'ocg',
  'goatbanlist',
  'goat',
  //   'tcgplayer',
  //   'tcgp',
  //   'trollandtoad',
  //   'tnt',
];

module.exports = {
  name: 'add-on - ygo',
  alias: [...mergedCommands],
  uniquecommands: [
    'art',
    'gallery',
    'card',
    'effect',
    'rule',
    'tcgbanlist',
    'ocgbanlist',
    'goatbanlist',
    // 'tcgplayer',
    // 'trollandtoad',
  ],
  description: 'Yu-Gi-Oh Add-On',
  start: async (Atlas, m, { inputCMD, text, args, prefix }) => {
    let isBan = false;
    let isLimit = false;
    let isSemi = false;

    switch (inputCMD) {
      case 'art':
        if (!text) {
          return m.reply(
            `Please provide name or id !\n\nExample: *${prefix}art kuribandit or ${prefix}art 7485*`
          );
        }

        try {
          const cards = await searchCard(text.trim());
          if (cards.length == 1) {
            const urlImage = cards[0].card_images[0].image_url_cropped;
            Atlas.sendMessage(
              m.from,
              {
                image: { url: urlImage },
                caption: `*${cards[0].name}*\n\n🌍 ${botName}`,
              },
              { quoted: m }
            );
          } else {
            let message = '🗃️ *Found multiple results:*\n\n';
            for (const card of cards)
              message += `➧ ${card.name} (${card.id})\n`;

            return m.reply(message);
          }
        } catch (e) {
          //   console.error(e);
          return m.reply(
            `Please provide valid input.\n\nExample: *${prefix}art kuribandit or ${prefix}art 7485*`
          );
        }
        break;

      case 'artwork':
      case 'gallery':
        if (!text) {
          return m.reply(
            `Please provide name or id !\n\nExample: *${prefix}gallery kuribandit or ${prefix}artwork 7485*`
          );
        }

        try {
          const cards = await searchCard(text.trim());
          if (cards.length == 1) {
            const gallery = await getArtwork(cards[0].name);

            // if (!artwork[0].length) return m.reply(`Failed to get artworks.`);

            for (const [title, art] of gallery)
              Atlas.sendMessage(
                m.from,
                {
                  image: { url: art },
                  caption: `*${title}*\n\n🌍 ${botName}`,
                },
                { quoted: m }
              );
          } else {
            let message = '🗃️ *Found multiple results:*\n\n';
            for (const card of cards)
              message += `➧ ${card.name} (${card.id})\n`;

            return m.reply(message);
          }
        } catch (e) {
          //   console.error(e);
          return m.reply(
            `Please provide name or id !\n\nExample: *${prefix}gallery kuribandit or ${prefix}artwork 7485*`
          );
        }
        break;

      case 'card':
      case 'c':
      case 'id':
        if (!text) {
          return m.reply(
            `Please provide name or id !\n\nExample: *${prefix}card kuribandit or ${prefix}c 7485*`
          );
        }

        try {
          const cards = await searchCard(text.trim());
          if (cards.length == 1) {
            const urlImage = cards[0].card_images[0].image_url;
            Atlas.sendMessage(
              m.from,
              {
                image: { url: urlImage },
                caption: `${cards[0].desc}\n\n🌍 ${botName}`,
              },
              { quoted: m }
            );
          } else {
            let message = '🗃️ *Found multiple results:*\n\n';
            for (const card of cards)
              message += `➧ ${card.name} (${card.id})\n`;

            return m.reply(message);
          }
        } catch {
          return m.reply(
            `Please provide valid input.\n\nExample: *${prefix}card kuribandit or ${prefix}c 7485*`
          );
        }
        break;

      case 'effect':
      case 'eff':
      case 'ef':
        if (!text) {
          return m.reply(
            `Please provide name or id !\n\nExample: *${prefix}effect kuribandit or ${prefix}eff 7485*`
          );
        }

        try {
          const cards = await searchCard(text.trim());
          if (cards.length == 1) {
            const c = cards[0];

            const name = c.name;
            const type = c.type;
            const status = await getStatus(c.name);
            const desc = c.desc;

            let message = `*${name}*\n\`\`\`[${type}]\`\`\`\n`;
            for (const s of status)
              if (s[1]) message += `\`\`\`${s[0]} : ${s[1]}\`\`\`\n`;
            message += `\n\`\`\`-Description-\`\`\`\n${desc}\n`;
            message += `\n🌍 ${botName}`;
            Atlas.sendMessage(
              m.from,
              {
                text: message,
              },
              { quoted: m }
            );
          } else {
            let message = '🗃️ *Found multiple results:*\n\n';
            for (const card of cards)
              message += `➧ ${card.name} (${card.id})\n`;

            return m.reply(message);
          }
        } catch {
          return m.reply(
            `Please provide valid input.\n\nExample: *${prefix}effect kuribandit or ${prefix}eff 7485*`
          );
        }
        break;

      case 'r':
      case 'rule':
      case 'faq':
        if (!text) {
          return m.reply(
            `Please provide name or id !\n\nExample: *${prefix}rule kuribandit or ${prefix}faq 7485*`
          );
        }

        try {
          const cards = await searchCard(text.trim());
          console.log(cards[0].name);
          if (cards.length == 1) {
            const r = await getRuling(cards[0].name);

            let message = `*${cards[0].name}*\n\n${r[0]}\n\nOfficial:\n_${r[1]}_\n\nExternal:\n_${r[2]}_\n\n🌍 ${botName}`;
            Atlas.sendMessage(
              m.from,
              {
                text: message,
              },
              { quoted: m }
            );
          } else {
            let message = '🗃️ *Found multiple results:*\n\n';
            for (const card of cards)
              message += `➧ ${card.name} (${card.id})\n`;

            return m.reply(message);
          }
        } catch (e) {
          console.error(e);
          return m.reply(
            `Please provide valid input.\n\nExample: *${prefix}rule kuribandit or ${prefix}faq 7485*`
          );
        }
        break;

      case 'tcgbanlist':
      case 'tcg':
        if (args.length > 1) {
          return m.reply(
            `You can use this command with additional argument !\n\nExample list:\n*${prefix}tcg*\n*${prefix}tcg limited*\n*${prefix}tcg semi*\n*${prefix}tcg ban*`
          );
        }

        if (args.length == 1) {
          isBan = args[0].toLowerCase().includes('ban');
          isLimit = args[0].toLowerCase().includes('limit');
          isSemi = args[0].toLowerCase().includes('semi');
        }

        try {
          const fl = await getBanList('tcg');

          let message = '*Current TCG Forbidden and Limited List*\n';

          if (!text || isBan) {
            message += `\n\`\`\`Forbidden:\`\`\`\n`;
            const lists = fl.get('Banned');
            for (const l of lists) message += `⊗ ➧ ${l}\n`;
          }
          if (!text || isLimit) {
            message += `\n\`\`\`Limited:\`\`\`\n`;
            const lists = fl.get('Limited');
            for (const l of lists) message += `⊝ ➧ ${l}\n`;
          }
          if (!text || isSemi) {
            message += `\n\`\`\`Semi-Limited:\`\`\`\n`;
            const lists = fl.get('Semi-Limited');
            for (const l of lists) message += `⊜ ➧ ${l}\n`;
          }

          message += `\n🌍 ${botName}`;

          Atlas.sendMessage(
            m.from,
            {
              text: message,
            },
            { quoted: m }
          );
        } catch (e) {
          console.error(e);
          return m.reply(
            `You can use this command with additional argument !\n\nExample list:\n*${prefix}tcg*\n*${prefix}tcg limited*\n*${prefix}tcg semi*\n*${prefix}tcg ban*`
          );
        }
        break;

      case 'ocgbanlist':
      case 'ocg':
        if (args.length > 1) {
          return m.reply(
            `You can use this command with additional argument !\n\nExample list:\n*${prefix}ocg*\n*${prefix}ocg limited*\n*${prefix}ocg semi*\n*${prefix}ocg ban*`
          );
        }

        if (args.length == 1) {
          isBan = args[0].toLowerCase().includes('ban');
          isLimit = args[0].toLowerCase().includes('limit');
          isSemi = args[0].toLowerCase().includes('semi');
        }

        try {
          const fl = await getBanList('ocg');

          let message = '*Current OCG Forbidden and Limited List*\n';

          if (!text || isBan) {
            message += `\n\`\`\`Forbidden:\`\`\`\n`;
            const lists = fl.get('Banned');
            for (const l of lists) message += `⊗ ➧ ${l}\n`;
          }
          if (!text || isLimit) {
            message += `\n\`\`\`Limited:\`\`\`\n`;
            const lists = fl.get('Limited');
            for (const l of lists) message += `⊝ ➧ ${l}\n`;
          }
          if (!text || isSemi) {
            message += `\n\`\`\`Semi-Limited:\`\`\`\n`;
            const lists = fl.get('Semi-Limited');
            for (const l of lists) message += `⊜ ➧ ${l}\n`;
          }

          message += `\n🌍 ${botName}`;

          Atlas.sendMessage(
            m.from,
            {
              text: message,
            },
            { quoted: m }
          );
        } catch (e) {
          //   console.error(e);
          return m.reply(
            `You can use this command with additional argument !\n\nExample list:\n*${prefix}ocg*\n*${prefix}ocg limited*\n*${prefix}ocg semi*\n*${prefix}ocg ban*`
          );
        }
        break;

      case 'goatbanlist':
      case 'goat':
        if (args.length > 1) {
          return m.reply(
            `You can use this command with additional argument !\n\nExample list:\n*${prefix}goat*\n*${prefix}goat limited*\n*${prefix}goat semi*\n*${prefix}goat ban*`
          );
        }

        if (args.length == 1) {
          isBan = args[0].toLowerCase().includes('ban');
          isLimit = args[0].toLowerCase().includes('limit');
          isSemi = args[0].toLowerCase().includes('semi');
        }

        try {
          const fl = await getBanList('goat');

          let message = '*Current GOAT Forbidden and Limited List*\n';

          if (!text || isBan) {
            message += `\n\`\`\`Forbidden:\`\`\`\n`;
            const lists = fl.get('Banned');
            for (const l of lists) message += `⊗ ➧ ${l}\n`;
          }
          if (!text || isLimit) {
            message += `\n\`\`\`Limited:\`\`\`\n`;
            const lists = fl.get('Limited');
            for (const l of lists) message += `⊝ ➧ ${l}\n`;
          }
          if (!text || isSemi) {
            message += `\n\`\`\`Semi-Limited:\`\`\`\n`;
            const lists = fl.get('Semi-Limited');
            for (const l of lists) message += `⊜ ➧ ${l}\n`;
          }

          message += `\n🌍 ${botName}`;

          Atlas.sendMessage(
            m.from,
            {
              text: message,
            },
            { quoted: m }
          );
        } catch (e) {
          //   console.error(e);
          return m.reply(
            `You can use this command with additional argument !\n\nExample list:\n*${prefix}goat*\n*${prefix}goat limited*\n*${prefix}goat semi*\n*${prefix}goat ban*`
          );
        }
        break;

      //   case 'tcgplayer':
      //   case 'tcgp':
      //     if (!text) {
      //       return m.reply(
      //         `Please provide name or id !\n\nExample: *${prefix}tcgp kuribandit or ${prefix}tcgp 7485*`
      //       );
      //     }

      //     try {
      //       const cards = await searchCard(text.trim());
      //       if (cards.length == 1) {
      //         const tcgPrice = await getPrice_TCGplayer(cards[0].id);

      //         const message = `*${cards[0].name}*\n\n${tcgPrice}\n🌍 ${botName}`;

      //         Atlas.sendMessage(
      //           m.from,
      //           {
      //             text: message,
      //           },
      //           { quoted: m }
      //         );
      //       } else {
      //         let message = '🗃️ *Found multiple results:*\n\n';
      //         for (const card of cards)
      //           message += `➧ ${card.name} (${card.id})\n`;

      //         return m.reply(message);
      //       }
      //     } catch (e) {
      //       console.error(e);
      //       return m.reply(
      //         `Please provide name or id !\n\nExample: *${prefix}tcgp kuribandit or ${prefix}tcgp 7485*`
      //       );
      //     }
      //     break;

      default:
        break;
    }
  },
};

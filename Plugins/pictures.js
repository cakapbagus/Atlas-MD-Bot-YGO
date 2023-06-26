const gis = require('async-g-i-s');
const axios = require('axios');
let mergedCommands = [
  'pic',
  'gig',
  'gimage',
  'googleimage',
  'image',
  'couplepp',
  'ppcouple',
  'gif',
  'gifsearch',
];

module.exports = {
  name: 'pictures',
  alias: [...mergedCommands],
  uniquecommands: ['pic', 'couplepp', 'gif'],
  description: 'All picture related commands',
  start: async (Atlas, m, { inputCMD, text, doReact, prefix }) => {
    switch (inputCMD) {
      case 'ppcouple':
      case 'couplepp':
        // await doReact('❤️');
        let imgRes;
        try {
          imgRes = await axios.get(
            'https://zany-teal-alligator-suit.cyclic.app/couple'
          );
        } catch (e) {
          return m.reply(`Failed retrieving image.`);
        }
        Atlas.sendMessage(
          m.from,
          { image: { url: imgRes.data.male }, caption: `_For Him..._` },
          { quoted: m }
        );
        Atlas.sendMessage(
          m.from,
          { image: { url: imgRes.data.female }, caption: `_For Her..._` },
          { quoted: m }
        );
        break;

      case 'pic':
      case 'gig':
      case 'gimage':
      case 'googleimage':
      case 'image':
        if (!text) {
          //   await doReact('❔');
          return m.reply(
            `Please provide an image Search Term !\n\nExample: *${prefix}pic cheems*`
          );
        }
        // await doReact('🎴');
        (async () => {
          try {
            const n = await gis(text.trim());
            const images = n[Math.floor(Math.random() * n.length)].url;
            const resText = `\n_🎀 Image Search Term:_ *${text}*\n\n_🧩 Powered by_ *${botName}*\n`;
            await Atlas.sendMessage(
              m.from,
              {
                image: { url: images },
                caption: resText,
                //footer: `*${botName}*`,
                //buttons: buttons,
                //headerType: 4,
              },
              { quoted: m }
            );
          } catch (e) {
            return m.reply(`Failed retrieving image.`);
          }
        })();

        break;

      case 'gif':
      case 'gifsearch':
        if (!text) {
          //   await doReact('❔');
          return m.reply(
            `Please provide an Tenor gif Search Term !\n\nExample: *${prefix}gif cheems bonk*`
          );
        }

        let req = `gif_gifsearch__${text.trim().toLowerCase()}`;
        const cacheResults = await redisClient.get(req);
        let gifUrl;

        // await doReact('🎴');
        if (cacheResults) gifUrl = JSON.parse(cacheResults);
        else {
          let resGif = await axios.get(
            `https://tenor.googleapis.com/v2/search?q=${text}&key=${tenorApiKey}&client_key=my_project&limit=12&media_filter=mp4`
          );
          let resultGif = Math.floor(Math.random() * 12);
          gifUrl = resGif.data.results[resultGif].media_formats.mp4.url;
          await redisClient.set(req, JSON.stringify(gifUrl), {
            EX: 180,
            NX: true,
          });
        }
        await Atlas.sendMessage(
          m.from,
          {
            video: { url: gifUrl },
            gifPlayback: true,
            caption: `🎀 Gif serach result for: *${text}*\n`,
          },
          { quoted: m }
        );
        break;

      default:
        break;
    }
  },
};

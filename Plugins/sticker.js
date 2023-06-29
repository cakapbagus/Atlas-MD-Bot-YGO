const fs = require('fs');
const fetch = require('node-fetch');
const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
let { GraphOrg } = require('../System/Uploader');

const {
  fetchJson,
  getBuffer,
  GIFBufferToVideoBuffer,
} = require('../System/Function2.js');
let mergedCommands = [
  'sticker',
  's',
  'steal',
  'take',
  'stickercrop',
  'scrop',
  'stickermeme',
  'smeme',
  'quote',
  'q',
  'emojimix',
  'emix',
];

module.exports = {
  name: 'stickerformat',
  alias: [...mergedCommands],
  uniquecommands: [
    'sticker',
    'steal',
    'stickercrop',
    'stickermeme',
    'quote',
    'emojimix',
  ],
  description: 'All Sticker formatting Commands',
  start: async (
    Atlas,
    m,
    {
      inputCMD,
      text,
      pushName,
      prefix,
      doReact,
      args,
      itsMe,
      participants,
      metadata,
      mentionByTag,
      mime,
      isMedia,
      quoted,
      botNumber,
      isBotAdmin,
      groupAdmin,
      isAdmin,
    }
  ) => {
    switch (inputCMD) {
      case 's':
      case 'sticker':
        try {
          if (/image/.test(mime)) {
            //   await doReact('🔖');
            let mediaMess = await quoted.download();
            let stickerMess = new Sticker(mediaMess, {
              pack: packname,
              author: pushName,
              type: StickerTypes.FULL,
              categories: ['🤩', '🎉'],
              id: '12345',
              quality: 70,
              background: 'transparent',
            });
            const stickerBuffer = await stickerMess.toBuffer();
            Atlas.sendMessage(
              m.from,
              { sticker: stickerBuffer },
              { quoted: m }
            );
          } else if (/video/.test(mime)) {
            //   await doReact('🔖');
            let mediaMess = await quoted.download();
            if ((quoted.msg || quoted).seconds > 15) {
              // await doReact('❌');
              return Atlas.sendMessage(
                m.from,
                { text: 'Please send video less than 15 seconds.' },
                { quoted: m }
              );
            }
            let stickerMess = new Sticker(mediaMess, {
              pack: packname,
              author: pushName,
              type: StickerTypes.FULL,
              categories: ['🤩', '🎉'],
              id: '12345',
              quality: 70,
              background: 'transparent',
            });
            const stickerBuffer2 = await stickerMess.toBuffer();
            Atlas.sendMessage(
              m.from,
              { sticker: stickerBuffer2 },
              { quoted: m }
            );
          } else {
            //   await doReact('❌');
            m.reply(
              `Please mention an *image/video* and type *${prefix}s* to create sticker.`
            );
          }
        } catch (err) {
          return m.reply(`An error occured, please try again.`);
        }
        break;

      case 'steal':
      case 'take':
        if (!m.quoted) {
          //   await doReact('❔');
          return m.reply(`Please mention a sticker to steal it.`);
        }
        // await doReact('🀄️');
        try {
          if (!args.join(' ')) {
            var packName = pushName;
            var authorName = pushName;
          } else if (args.join(' ').includes(',')) {
            var packName = args.join(' ').split(',')[0];
            var authorName = args.join(' ').split(',')[1];
          } else {
            var packName = args.join(' ');
            var authorName = args.join(' ');
          }
          if (/webp/.test(mime)) {
            let mediaMess = await quoted.download();
            let stickerMess = new Sticker(mediaMess, {
              pack: packName,
              author: authorName,
              type: StickerTypes.FULL,
              categories: ['🤩', '🎉'],
              id: '12345',
              quality: 70,
              background: 'transparent',
            });
            const stickerBuffer = await stickerMess.toBuffer();
            Atlas.sendMessage(
              m.from,
              { sticker: stickerBuffer },
              { quoted: m }
            );
          } else {
            //   await doReact('❌');
            m.reply(
              `Please mention a *Sticker* and type *${prefix}steal <packname , authorname>* to create sticker with your name.`
            );
          }
        } catch (e) {
          return m.reply(`Please mention a sticker from others to steal it.`);
        }

        break;

      case 'scrop':
      case 'stickercrop':
        try {
          if (/image/.test(mime)) {
            //   await doReact('🃏');
            let mediaMess = await quoted.download();
            let stickerMess = new Sticker(mediaMess, {
              pack: packname,
              author: pushName,
              type: StickerTypes.CROPPED,
              categories: ['🤩', '🎉'],
              id: '12345',
              quality: 70,
              background: 'transparent',
            });
            const stickerBuffer = await stickerMess.toBuffer();
            Atlas.sendMessage(
              m.from,
              { sticker: stickerBuffer },
              { quoted: m }
            );
          } else if (/video/.test(mime)) {
            //   await doReact('🃏');
            let mediaMess = await quoted.download();
            if ((quoted.msg || quoted).seconds > 15) {
              // await doReact('❌');
              return m.reply('Please send video less than 15 seconds.');
            }
            let stickerMess = new Sticker(mediaMess, {
              pack: packname,
              author: pushName,
              type: StickerTypes.CROPPED,
              categories: ['🤩', '🎉'],
              id: '12345',
              quality: 70,
              background: 'transparent',
            });
            const stickerBuffer2 = await stickerMess.toBuffer();
            Atlas.sendMessage(
              m.from,
              { sticker: stickerBuffer2 },
              { quoted: m }
            );
          } else {
            //   await doReact('❌');
            m.reply(
              `Please mention an *imade/video* and type *${prefix}s* to create cropped sticker.`
            );
          }
        } catch (err) {
          return m.reply(`An error occured, please try again.`);
        }
        break;

      case 'smeme':
      case 'stickermeme':
        if (!m.quoted || !text) {
          // await doReact('❔');
          return m.reply(
            `Please mention an *image* and type *${prefix}smeme <text1|text2>* to create sticker meme.`
          );
        }

        let media;
        try {
          media = await Atlas.downloadAndSaveMediaMessage(quoted);
        } catch (error) {
          // await doReact('❌');
          return m.reply(
            `Please mention an *image* and type *${prefix}smeme <text1|text2>* to create sticker meme.`
          );
        }

        if (/image/.test(mime)) {
          //   await doReact('📮');
          let indexSep = text.indexOf('|');
          let u, l;
          if (indexSep != -1) {
            u = encodeURIComponent(text.slice(0, indexSep));
            l = encodeURIComponent(text.slice(indexSep + 1));
          } else {
            l = encodeURIComponent(text);
          }
          u = !u ? '_' : u;
          l = !l ? '_' : l;

          let meme;
          try {
            let anu = await GraphOrg(media);
            meme = `https://api.memegen.link/images/custom/${u}/${l}.png?background=${anu}`;
          } catch {
            // await doReact('❌');
            return m.reply(
              `Please mention an *image* and type *${prefix}smeme <text1|text2>* to create sticker meme.`
            );
          }

          let stickerMess = new Sticker(meme, {
            pack: packname,
            author: pushName,
            type: StickerTypes.FULL,
            categories: ['🤩', '🎉'],
            id: '12345',
            quality: 70,
            background: 'transparent',
          });

          const stickerBuffer2 = await stickerMess.toBuffer();
          await Atlas.sendMessage(
            m.from,
            { sticker: stickerBuffer2 },
            { quoted: m }
          )
            .then((result) => {
              if (fs.existsSync(meme)) fs.unlinkSync(meme);
            })
            .catch((err) => {
              //   m.reply('An error occured!');
              console.error(err);
            });
        } else {
          //   await doReact('❌');
          m.reply(
            `Please mention an *image* and type *${prefix}smeme <text1|text2>* to create sticker meme.`
          );
        }
        break;

      case 'q':
      case 'quote':
        if (!text && !m.quoted) {
          //   await doReact('❔');
          return m.reply(
            `Please provide a text (Type or mention a message) !\n\nExample: ${prefix}q Atlas YGO is OP`
          );
        }

        if (m.quoted) {
          try {
            userPfp = await Atlas.profilePictureUrl(m.quoted.sender, 'image');
          } catch (e) {
            userPfp = botImage3;
          }
        } else {
          try {
            userPfp = await Atlas.profilePictureUrl(m.sender, 'image');
          } catch (e) {
            userPfp = botImage3;
          }
        }
        // await doReact('📮');
        var waUserName = pushName;

        const quoteText = m.quoted ? m.quoted.msg : args ? args.join(' ') : '';

        var quoteJson = {
          type: 'quote',
          format: 'png',
          backgroundColor: '#FFFFFF',
          width: 700,
          height: 580,
          scale: 2,
          messages: [
            {
              entities: [],
              avatar: true,
              from: {
                id: 1,
                name: waUserName,
                photo: {
                  url: userPfp,
                },
              },
              text: quoteText,
              replyMessage: {},
            },
          ],
        };

        let quoteResponse;
        try {
          quoteResponse = await axios.post(
            'https://bot.lyo.su/quote/generate',
            quoteJson,
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (err) {
          return m.reply(`An error occured, please try again.`);
        }

        fs.writeFileSync(
          'quote.png',
          quoteResponse.data.result.image,
          'base64'
        );

        let stickerMess = new Sticker('quote.png', {
          pack: packname,
          author: pushName,
          type: StickerTypes.FULL,
          categories: ['🤩', '🎉'],
          id: '12345',
          quality: 70,
          background: 'transparent',
        });

        const stickerBuffer2 = await stickerMess.toBuffer();
        await Atlas.sendMessage(
          m.from,
          { sticker: stickerBuffer2 },
          { quoted: m }
        )
          .then((result) => {
            if (fs.existsSync('quote.png')) fs.unlinkSync('quote.png');
          })
          .catch((err) => {
            // m.reply('An error occured!');
            console.error(err);
          });

        break;

      case 'emojimix':
      case 'emix':
        if (!args[0]) {
          //   await doReact("❔");
          return m.reply(
            `Please provide one or two emojis to combine using "+".\n*Example:* ${
              prefix + 'emojimix'
            } 😅 or ${prefix + 'emojimix'} 🦉+🤣`
          );
        }

        // await doReact("🔖");
        const [emoji1, emoji2] = args[0].split`+`;
        const emoji1_enc = encodeURIComponent(emoji1);
        const emoji2_enc = emoji2 ? encodeURIComponent(emoji2) : '';

        if (emoji1_enc === emoji1 || emoji2_enc === emoji2) {
          return m.reply(
            `Please provide one or two emojis to combine using "+".\n*Example:* ${
              prefix + 'emojimix'
            } 😅 or ${prefix + 'emojimix'} 🦉+🤣`
          );
        }

        const req = `emojimix_${emoji1_enc}_${emoji2_enc}`;
        const cacheResults = await redisClient.get(req);

        let imgUrl;
        if (cacheResults) imgUrl = JSON.parse(cacheResults);
        else {
          let jsonData = await fetch(
            `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${emoji1_enc}${
              emoji2 ? '_' : ''
            }${emoji2_enc}`
          ).then((res) => res.json());

          try {
            const n = jsonData.results;
            imgUrl = n[Math.floor(Math.random() * n.length)].url;
            await redisClient.set(req, JSON.stringify(imgUrl), {
              EX: 180,
              NX: true,
            });
          } catch {
            return m.reply(`Sticker not found.`);
          }
        }

        let stcBuff = await getBuffer(imgUrl);
        fs.writeFileSync('emoji.png', stcBuff);

        let stickerMess2 = new Sticker('emoji.png', {
          pack: packname,
          author: pushName,
          type: StickerTypes.FULL,
          categories: ['🤩', '🎉'],
          id: '12345',
          quality: 70,
          background: 'transparent',
        });

        const stickerBuffer = await stickerMess2.toBuffer();
        await Atlas.sendMessage(
          m.from,
          { sticker: stickerBuffer },
          { quoted: m }
        )
          .then((result) => {
            if (fs.existsSync('emoji.png')) fs.unlinkSync('emoji.png');
          })
          .catch((err) => {
            // m.reply('An error occured!');
            console.error(err);
          });
        break;

      default:
        break;
    }
  },
};

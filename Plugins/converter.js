const fs = require('fs');
const PDFDocument = require('pdfkit');
let { GraphOrg } = require('../System/Uploader');

const util = require('util');
let mergedCommands = ['tourl', 'imgtourl', 'topdf', 'imgtopdf'];

module.exports = {
  name: 'converters',
  alias: [...mergedCommands],
  uniquecommands: ['tourl', 'topdf'],
  description: 'All converter related commands',
  start: async (
    Atlas,
    m,
    { inputCMD, text, quoted, doReact, prefix, mime }
  ) => {
    switch (inputCMD) {
      case 'tourl':
        if (!m.quoted) {
          //   await doReact('❔');
          return m.reply(
            `Plese provide an *Image* / *Video* to generate a link! With Caption ${prefix}tourl`
          );
        }

        let media5;
        try {
          media5 = await Atlas.downloadAndSaveMediaMessage(quoted);
        } catch (error) {
          // await doReact('❌');
          return m.reply(
            `Plese provide an *Image* / *Video* to generate a link!`
          );
        }

        if (/image/.test(mime)) {
          //   await doReact('🔗');
          try {
            let anu = await GraphOrg(media5);
            m.reply(`*Generated Image URL:* \n\n${util.format(anu)}\n`);
          } catch {
            // await doReact('❌');
            return m.reply(
              `Plese provide an *Image* / *Video* to generate a link!`
            );
          }
        } else if (/video/.test(mime)) {
          //   await doReact('▶️');
          try {
            let anu = await GraphOrg(media5);
            m.reply(`*Generated Video URL:* \n\n${util.format(anu)}\n`);
          } catch (e) {
            // await doReact('❌');
            fs.unlinkSync(media5);
            return Atlas.sendMessage(
              m.from,
              {
                text: `*Your video size is too big!*\n\n*Max video size:* 5MB`,
              },
              { quoted: m }
            );
          }
        } else {
          //   await doReact('❌');
          return m.reply(
            `Plese provide an *Image* / *Video* to generate a link!`
          );
        }
        fs.unlinkSync(media5);
        break;

      case 'topdf':
      case 'imgtopdf':
        if (/image/.test(mime)) {
          //   await doReact('📑');
          let mediaMess4;
          try {
            mediaMess4 = await Atlas.downloadAndSaveMediaMessage(quoted);
          } catch (error) {
            return m.reply(`Please reply to an *Image* to convert it to PDF!`);
          }

          async function generatePDF(path) {
            return new Promise((resolve, reject) => {
              const doc = new PDFDocument();

              const imageFilePath = mediaMess4.replace(/\\/g, '/');
              doc.image(imageFilePath, 0, 0, {
                width: 612, // It will make your image to horizontally fill the page - Change it as per your requirement
                align: 'center',
                valign: 'center',
              });

              doc.pipe(fs.createWriteStream(path));

              doc.on('end', () => {
                resolve(path);
              });

              doc.end();
            });
          }

          try {
            let randomFileName = `./${Math.floor(
              Math.random() * 1000000000
            )}.pdf`;
            const pdfPATH = randomFileName;
            await generatePDF(pdfPATH);
            pdf = fs.readFileSync(pdfPATH);

            setTimeout(async () => {
              let pdf = fs.readFileSync(pdfPATH);

              Atlas.sendMessage(
                m.from,
                {
                  document: pdf,
                  fileName: `Converted By ${botName}.pdf`,
                },
                { quoted: m }
              );

              fs.unlinkSync(mediaMess4);
              fs.unlinkSync(pdfPATH);
            }, 1000);
          } catch (error) {
            // await doReact('❌');
            console.error(error);
            return m.reply(
              `An error occurred while converting the image to PDF.`
            );
          }
        } else {
          //   await doReact('❔');
          return m.reply(`Please reply to an *Image* to convert it to PDF!`);
        }
        break;

      default:
        break;
    }
  },
};

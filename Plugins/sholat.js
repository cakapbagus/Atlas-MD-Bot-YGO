const axios = require('axios');

let mergedCommands = ['jadwal', 'sholat', 'kota', 'city'];

module.exports = {
  name: 'sholat',
  alias: [...mergedCommands],
  uniquecommands: ['jadwal', 'kota'],
  description: 'Sholat schedule commands',
  start: async (Atlas, m, { inputCMD, text, doReact, prefix }) => {
    let formattedText;
    let url_kota;
    let kota;
    let nama;
    let namaKota;
    let message;

    switch (inputCMD) {
      case 'jadwal':
      case 'sholat':
        if (!text) {
          //   await doReact('❔');
          return m.reply(
            `Please provide city name or id !\n\nExample: *${prefix}jadwal jakarta or ${prefix}jadwal 773*`
          );
        }

        const date_ob = new Date();
        const date = ('0' + date_ob.getDate()).slice(-2);
        const month = ('0' + (date_ob.getMonth() + 1)).slice(-2);
        const year = date_ob.getFullYear();

        let req = `jadwal_sholat_${year}-${month}-${date}_${text
          .trim()
          .toLowerCase()}`;
        const cacheResults = await redisClient.get(req);

        if (cacheResults) return m.reply(JSON.parse(cacheResults));
        else {
          if (/^\d+$/.test(text)) {
            url_kota = `https://api.banghasan.com/sholat/format/json/kota/kode/${text}`;
            kota = (await axios.get(url_kota)).data.kota;
            if (kota.length == 0)
              return m.reply(
                `ID/City not found, please using *${prefix}city* to search ID/City`
              );

            nama = kota[0].nama.toLowerCase();
            namaKota = nama.split(' ');
            for (let i = 0; i < namaKota.length; i += 1)
              namaKota[i] =
                namaKota[i].charAt(0).toUpperCase() + namaKota[i].slice(1);
            namaKota = namaKota.join(' ');

            const url_jadwal = `https://api.banghasan.com/sholat/format/json/jadwal/kota/${text}/tanggal/${year}-${month}-${date}`;
            const jadwal = (await axios.get(url_jadwal)).data.jadwal.data;

            if (jadwal == 'kosong')
              return m.reply(
                `ID/City not found, please using *${prefix}city* to search ID/City`
              );

            message = `*${namaKota}*\n${jadwal.tanggal}\n\nSubuh  ${jadwal.subuh}\nTerbit  ${jadwal.terbit}\nDhuha  ${jadwal.dhuha}\nDzuhur  ${jadwal.dzuhur}\nAshar  ${jadwal.ashar}\nMaghrib  ${jadwal.maghrib}\nIsya  ${jadwal.isya}`;
            message += `\n\n🌍 ${botName}`;
            await redisClient.set(req, JSON.stringify(message), {
              EX: 86400,
              NX: true,
            });
            return m.reply(message);
          }

          formattedText = text.trim().split(' ').join('+');
          url_kota = `https://api.banghasan.com/sholat/format/json/kota/nama/${formattedText}`;
          kota = (await axios.get(url_kota)).data.kota;

          if (kota.length == 0) {
            return m.reply(
              `ID/City not found, please using *${prefix}city* to search ID/City`
            );
          }

          nama = kota[0].nama.toLowerCase();
          namaKota = nama.split(' ');
          for (let i = 0; i < namaKota.length; i += 1)
            namaKota[i] =
              namaKota[i].charAt(0).toUpperCase() + namaKota[i].slice(1);
          namaKota = namaKota.join(' ');

          const id = kota[0].id;

          const url_jadwal = `https://api.banghasan.com/sholat/format/json/jadwal/kota/${id}/tanggal/${year}-${month}-${date}`;
          const jadwal = (await axios.get(url_jadwal)).data.jadwal.data;

          message = `*${namaKota}*\n${jadwal.tanggal}\n\nSubuh  ${jadwal.subuh}\nTerbit  ${jadwal.terbit}\nDhuha  ${jadwal.dhuha}\nDzuhur  ${jadwal.dzuhur}\nAshar  ${jadwal.ashar}\nMaghrib  ${jadwal.maghrib}\nIsya  ${jadwal.isya}`;
          message += `\n\n🌍 ${botName}`;
          await redisClient.set(req, JSON.stringify(message), {
            EX: 86400,
            NX: true,
          });
          await Atlas.sendMessage(m.from, { text: message }, { quoted: m });
        }
        break;

      case 'kota':
      case 'city':
        if (!text) {
          //   await doReact('❔');
          return m.reply(
            `Please provide city name !\n\nExample: *${prefix}city bogor*`
          );
        }

        formattedText = text.trim().split(' ').join('+');
        url_kota = `https://api.banghasan.com/sholat/format/json/kota/nama/${formattedText}`;
        kota = (await axios.get(url_kota)).data.kota;

        if (kota.length == 0) {
          return m.reply(`Data not found !`);
        }

        message = `*ID*   : City Name\n\n`;
        for (const data of kota) {
          message += `*${data.id}* : ${data.nama.toLowerCase()}`;
          message += data != kota[kota.length - 1] ? `\n` : '';
        }

        message += `\n\n🌍 ${botName}`;

        await Atlas.sendMessage(m.from, { text: message }, { quoted: m });

        break;

      default:
        break;
    }
  },
};

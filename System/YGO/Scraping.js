const axios = require('axios');
const cheerio = require('cheerio');
const jsGoogleTranslateFree = require('@kreisler/js-google-translate-free');

const ruleText = async (url) => {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const jp = $('#supplement').text().trim();
    const eng = await jsGoogleTranslateFree.translate('ja', 'en', jp);

    const ret = `*Official Ruling*\n${jp}\n\n*Translated by Google*\n${eng}`;

    return ret;
  } catch (err) {
    throw err;
  }
};

exports.getRuling = async (card_id) => {
  try {
    const req = `getRuling_${card_id}`;
    const cacheResults = await redisClient.get(req);
    if (cacheResults) {
      //   const r = JSON.parse(cacheResults);
      //   console.log(`${r[0]}\n${r[1]}`);
      return JSON.parse(cacheResults);
    }

    const url = `https://yugipedia.com/wiki/${card_id}`;
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const official = $(
      '.below.hlist.plainlinks .external.text:nth-child(2)'
    ).attr('href');
    const external = $('.below.hlist.plainlinks ul')
      .children('li:nth-child(2)')
      .children('a')
      .attr('href');

    const text = await ruleText(official);

    const rule = [text, official, external];

    await redisClient.set(req, JSON.stringify(rule));

    return rule;
  } catch (err) {
    throw err;
  }
};

exports.getKonamiId = async (card_id) => {
  try {
    const req = `getKonamiId_${card_id}`;
    const cacheResults = await redisClient.get(req);
    if (cacheResults) return JSON.parse(cacheResults);

    const rulings = await this.getRuling(card_id);
    const id = rulings[2].split('#')[1];

    await redisClient.set(req, JSON.stringify(id));

    return id;
  } catch (err) {
    throw err;
  }
};

exports.searchCard = async (card) => {
  try {
    const req = `searchCard_${card}`;
    const cacheResults = await redisClient.get(req);
    if (cacheResults) return JSON.parse(cacheResults);

    let res;
    let url;
    if (/^\d+$/.test(card) && card.length > 1) {
      const id = await this.getKonamiId(card);
      url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?konami_id=${id}`;
    } else {
      card = encodeURIComponent(card);
      try {
        url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${card}`;
        res = await axios.get(url);
      } catch {
        url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${card}`;
      }
    }
    if (!res) res = await axios.get(url);

    await redisClient.set(req, JSON.stringify(res.data.data));

    return res.data.data;
  } catch (err) {
    throw err;
  }
};

exports.getBanList = async (text) => {
  try {
    const req = `getBanList_${text}`;
    const cacheResults = await redisClient.get(req);
    if (cacheResults) {
      const obj = JSON.parse(cacheResults);
      return new Map(Object.entries(obj));
    }

    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=${text}`;
    const res = await axios.get(url);

    let fl = new Map();
    fl.set('Banned', []);
    fl.set('Limited', []);
    fl.set('Semi-Limited', []);

    const banlist = res.data.data;

    for (const d of banlist) {
      let list;
      if (text.toLowerCase() == 'tcg') {
        list = fl.get(d.banlist_info.ban_tcg);
        list.push(d.name);
      } else if (text.toLowerCase() == 'ocg') {
        list = fl.get(d.banlist_info.ban_ocg);
        list.push(d.name);
      } else {
        list = fl.get(d.banlist_info.ban_goat);
        list.push(d.name);
      }
    }

    await redisClient.set(req, JSON.stringify(Object.fromEntries(fl)), {
      EX: 86400,
      NX: true,
    });

    return fl;
  } catch (err) {
    throw err;
  }
};

exports.getStatus = async (card_id) => {
  try {
    const url = `https://yugipedia.com/wiki/${card_id}`;
    const res = await axios.get(url);
    const html = res.data;
    const $ = cheerio.load(html);
    let tcg_status;
    let ocg_status;

    const unl = '.status-unlimited';
    $(unl).each((idx, el) => {
      const tex = $(el).children('i').children('a').text();
      if (tex.toLowerCase() == 'ocg') ocg_status = 'Unlimited';
      else if (tex.toLowerCase() == 'tcg') tcg_status = 'Unlimited';
    });

    const semi = '.status-semi-limited';
    $(semi).each((idx, el) => {
      const tex = $(el).children('i').children('a').text();
      if (tex.toLowerCase() == 'ocg') ocg_status = 'Semi-Limited';
      else if (tex.toLowerCase() == 'tcg') tcg_status = 'Semi-Limited';
    });

    const lim = '.status-limited';
    $(lim).each((idx, el) => {
      const tex = $(el).children('i').children('a').text();
      if (tex.toLowerCase() == 'ocg') ocg_status = 'Limited';
      else if (tex.toLowerCase() == 'tcg') tcg_status = 'Limited';
    });

    const ban = '.status-forbidden';
    $(ban).each((idx, el) => {
      const tex = $(el).children('i').children('a').text();
      if (tex.toLowerCase() == 'ocg') ocg_status = 'Forbidden';
      else if (tex.toLowerCase() == 'tcg') tcg_status = 'Forbidden';
    });

    const status = new Map([
      ['OCG', ocg_status],
      ['TCG', tcg_status],
    ]);

    return status;
  } catch (err) {
    throw err;
  }
};

exports.getArtwork = async (card) => {
  try {
    const req = `getArtwork_${card}`;
    const cacheResults = await redisClient.get(req);
    if (cacheResults) {
      const obj = JSON.parse(cacheResults);
      return new Map(Object.entries(obj));
    }

    const baseUrl = `https://yugipedia.com/wiki/Card_Artworks:${encodeURIComponent(
      card
    )}`;

    const res = await axios.get(baseUrl);
    const html = res.data;
    const $ = cheerio.load(html);

    let title = $('.gallerytext')
      .children('p')
      .text()
      .split('\n')
      .filter(Boolean);

    let artwork = [];
    const sel = '.thumb';
    $(sel).each((idx, el) => {
      const u = $(el).children('div').children('a').children('img').attr('src');
      artwork.push(u);
    });

    title = title.filter(function (el, idx) {
      if (/^\d+$/.test(el[0])) return el;
      else artwork[idx] = null;
    });

    artwork = artwork.filter(Boolean);

    let gallery = new Map();

    for (let i = 0; i < title.length; i += 1) {
      gallery.set(title[i], artwork[i]);
    }

    await redisClient.set(req, JSON.stringify(Object.fromEntries(gallery)), {
      EX: 86400,
      NX: true,
    });

    return gallery;
  } catch (err) {
    throw err;
  }
};

///////TESTING/////////
// const id = '59438930';
// const kId = '11708';
// const nama = 'snow';

// getBanList('TCG')
//   .then((res) => console.log(res.get('Limited')))
//   .catch((err) => {
//     console.log('E!');
//     // console.error(err);
//   });

const axios = require('axios');
const cheerio = require('cheerio');
const jsGoogleTranslateFree = require('@kreisler/js-google-translate-free');
// const google = require('googlethis');

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

const getKonamiId = async (card_name) => {
  try {
    const req = `getKonamiId_${card_name}`;
    const cacheResults = await redisClient.get(req);
    if (cacheResults) return JSON.parse(cacheResults);

    const rulings = await this.getRuling(card_name);
    const id = rulings[2].split('#')[1];

    await redisClient.set(req, JSON.stringify(id));

    return id;
  } catch (err) {
    throw err;
  }
};

const getTcgSet = async (card_id) => {
  try {
    const req = `getTcgSet_${card_id}`;
    const cacheResults = await redisClient.get(req);
    if (cacheResults) return JSON.parse(cacheResults);

    const baseUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${card_id}`;
    const res = await axios.get(baseUrl);

    const pricelist = res.data.data[0].card_sets;

    let set_codes = [];
    for (const p of pricelist) set_codes.push(p.set_code);

    const uniqueSet = [...new Set(set_codes)];

    await redisClient.set(req, JSON.stringify(uniqueSet), {
      EX: 86400,
      NX: true,
    });

    return uniqueSet;
  } catch (err) {
    throw err;
  }
};

const getOcgName = async (card_id) => {
  try {
    const req = `getOcgName_${card_id}`;
    const cacheResults = await redisClient.get(req);
    if (cacheResults) return JSON.parse(cacheResults);

    const url = `https://yugipedia.com/wiki/${card_id}`;
    const res = await axios.get(url);
    const html = res.data;
    const $ = cheerio.load(html);

    const name1 = $('.hlist span:nth(1)').text();
    const name2 = $('.hlist span').first().text();

    const name = encodeURIComponent(name1) || encodeURIComponent(name2);

    return name;
  } catch (err) {
    throw err;
  }
};

//EXPORTS//

exports.getRuling = async (card_name) => {
  try {
    const req = `getRuling_${card_name}`;
    const cacheResults = await redisClient.get(req);
    if (cacheResults) {
      //   const r = JSON.parse(cacheResults);
      //   console.log(`${r[0]}\n${r[1]}`);
      return JSON.parse(cacheResults);
    }

    const url = `https://yugipedia.com/wiki/${encodeURIComponent(card_name)}`;
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

    await redisClient.set(req, JSON.stringify(rule), {
      EX: 86400,
      NX: true,
    });

    return rule;
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
      try {
        url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${card}`;
        res = await axios.get(url);
      } catch {
        url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?konami_id=${card}`;
      }
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

exports.getStatus = async (card_name) => {
  try {
    const req = `getStatus_${card_name}`;
    const cacheResults = await redisClient.get(req);
    if (cacheResults) {
      const obj = JSON.parse(cacheResults);
      return new Map(Object.entries(obj));
    }

    const url = `https://yugipedia.com/wiki/${encodeURIComponent(card_name)}`;
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

    await redisClient.set(req, JSON.stringify(Object.fromEntries(status)), {
      EX: 86400,
      NX: true,
    });

    return status;
  } catch (err) {
    throw err;
  }
};

exports.getArtwork = async (card_name) => {
  try {
    const req = `getArtwork_${card_name}`;
    const cacheResults = await redisClient.get(req);
    if (cacheResults) {
      const obj = JSON.parse(cacheResults);
      return new Map(Object.entries(obj));
    }

    const baseUrl = `https://yugipedia.com/wiki/Card_Artworks:${encodeURIComponent(
      card_name
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
      if (/^\d+$/.test(el[0]) && el.toLowerCase().indexOf('rush') < 0)
        return el;
      else artwork[idx] = null;
    });

    artwork = artwork.filter(Boolean);

    let unsorted_gallery = new Map();

    for (let i = 0; i < title.length; i += 1) {
      unsorted_gallery.set(title[i], artwork[i]);
    }

    const sorted_gallery = new Map([...unsorted_gallery].sort());

    await redisClient.set(
      req,
      JSON.stringify(Object.fromEntries(sorted_gallery)),
      {
        EX: 86400,
        NX: true,
      }
    );

    return sorted_gallery;
  } catch (err) {
    throw err;
  }
};

exports.getPriceLink = async (card) => {
  try {
    const req = `getPriceLink_${card}`;
    const cacheResults = await redisClient.get(req);
    if (cacheResults) return JSON.parse(cacheResults);

    const card_name = card.name;
    const card_id = card.id;
    let result = '';

    //TCGplayer
    result += '\n_*TCGplayer (TCG)*_\n';
    result += `https://www.tcgplayer.com/search/yugioh/product?Language=English&productLineName=yugioh&q=${card_name
      .split(' ')
      .join('+')}&view=grid\n`;

    //Troll and Toad
    result += '\n_*Troll and Toad (TCG)*_\n';
    result += `https://www.trollandtoad.com/category.php?selected-cat=4736&search-words=${card_name
      .split(' ')
      .join('+')}\n`;

    const ocg_name = await getOcgName(card_id);

    //Suruga-ya
    result += '\n_*Suruga-ya (OCG)*_\n';
    result += `https://www.suruga-ya.jp/search?category=5&search_word=${ocg_name}}\n`;

    //Yuyu-tei
    result += '\n_*Yuyu-tei (OCG)*_\n';
    result += `https://yuyu-tei.jp/game_ygo/sell/sell_price.php?name=${ocg_name}\n`;

    await redisClient.set(req, JSON.stringify(result.trim()));

    return result.trim();
  } catch (err) {
    throw err;
  }
};

//TODO: Pending Implementation for searching price directly

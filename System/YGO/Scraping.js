const axios = require('axios');
const cheerio = require('cheerio');
const jsGoogleTranslateFree = require('@kreisler/js-google-translate-free');
const google = require('googlethis');

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

//BUG
exports.getPrice_TCGplayer = async (card_id) => {
  try {
    const url =
      'https://ygoprodeck.com/card/lyna-the-light-charmer-lustrous-11919';
    const res = await axios.get(url);
    const html = res.data;
    const $ = cheerio.load(html);

    const p$ = $('.text-right').text();
    console.log(p$);

    // price.each((i, el) => {
    //     $(el).children('a').
    //   console.log($(el).text());
    //   //   id_set_list.push($(el).find('div:first > p > a').text().trim());
    //   //   let n = encodeURIComponent($(el).find('div:nth(1) > p > a').text());
    // });

    // var price = $('span')
    //   .filter(function () {
    //     return $(this).text().trim() === 'Market Price:';
    //   })
    //   .next()
    //   .text();
    return '';

    const uniqueSet = await getTcgSet(card_id);

    const options = {
      page: 0,
      safe: false,
      parse_ads: false,
      additional_params: {
        // add additional parameters here, see https://moz.com/blog/the-ultimate-guide-to-the-google-search-parameters and https://www.seoquake.com/blog/google-search-param/
        hl: 'en',
      },
    };

    //gather url
    let final_url = [];
    for (const set of uniqueSet) {
      const search_res = await google.search(
        `$ "${set}" site:https://www.tcgplayer.com/product`,
        options
      );
      const data = search_res.results;
      for (const d of data) {
        if (d.description.includes(set)) final_url.push(d.url);
      }
    }

    let result = '_*TCGplayer Price (TCG)*_\n';
    //start scraping
    for (const url of final_url) {
      //   console.log(url);
      const res = await axios.get(`${url}?Language=English`);
      const html = res.data;
      const $ = cheerio.load(html);

      //   const set_code = $('.product__item-details__attributes')
      //     .children('li:first > span')
      //     .text();
      //   const set_rarity = $('.product__item-details__attributes')
      //     .children('li:nth[1] > span')
      //     .text();
      //   const price = $('span:contains("$")');
      var title = $('title').text();
      console.log(title);

      var price = $('span')
        .filter(function () {
          return $(this).text().trim() === 'Market Price:';
        })
        .next()
        .text();
      console.log(price);

      // result += `${set_code} _${set_rarity} ${set_rarity_code}_ *${
      //     price ? price : 'out of stock'
      //   }*\n`;
    }

    return result;
  } catch (err) {
    throw err;
  }
};

// // TODO:Redis
// exports.getOcgPrice = async (card_name) => {
//   try {
//     const card_sets = await getCardSet(card_name);

//     // console.log(card_sets);

//     const options = {
//       page: 0,
//       safe: false, // Safe Search
//       parse_ads: false, // If set to true sponsored results will be parsed
//       additional_params: {
//         // add additional parameters here, see https://moz.com/blog/the-ultimate-guide-to-the-google-search-parameters and https://www.seoquake.com/blog/google-search-param/
//         hl: 'jp',
//       },
//     };

//     const response = await google.search(
//       '20TH-JPC58 $ -B site:suruga-ya.jp/product/detail',
//       options
//     );
//     console.log(response);

//     // suruga-ya
//     // for (const set of card_sets) {
//     //   const gUrl = `https://www.google.co.jp/search?q=%24+${set}+-B+site%3Asuruga-ya.jp%2Fproduct%2Fdetail`;

//     //   //     const baseUrl = `https://www.suruga-ya.jp/search?category=5&search_word=${set[0]}`;
//     //   const res = await axios.get(gUrl);
//     //   const html = res.data;
//     //   const $ = cheerio.load(html);
//     //   const $p = $('span:contains("JP¥")').first().text();

//     //   console.log($p);

//     //   //   console.log(
//     //   //     $('.title')
//     //   //       .filter((i, element) => {
//     //   //         // console.log($(element).text());
//     //   //         return $(element).text().toLowerCase().includes('JP¥25.800').text();
//     //   //       })
//     //   //       .text()
//     //   //   );

//     //   //   const listing = $(`a:contains("${set}")`).text();
//     //   //   console.log(listing);
//     //   //   listing
//     //   //     .parent('.item')
//     //   //     .find('.text-red')
//     //   //     .each((i, el) => {
//     //   //       console.log($(el).text());
//     //   //       //   id_set_list.push($(el).find('div:first > p > a').text().trim());
//     //   //       //   let n = encodeURIComponent($(el).find('div:nth(1) > p > a').text());
//     //   //     });
//     // }
//     // // yuyu-tei
//     // const baseUrl = `https://yuyu-tei.jp/game_ygo/sell/sell_price.php?name=${ja_name}`;
//     // const res = await axios.get(baseUrl);
//     // const html = res.data;
//     // const $ = cheerio.load(html);

//     // let id_set_list = [];
//     // let name_list = [];
//     // let price_list = [];
//     // let qty_list = [];

//     // const pricelist = $('.card_list_box div');

//     // pricelist.find('div > ul > li').each((i, el) => {
//     //   id_set_list.push($(el).find('div:first > p > a').text().trim());
//     //   let n = encodeURIComponent($(el).find('div:nth(1) > p > a').text());
//     //   n = n.slice(n.indexOf('(') + 1, -1);
//     //   name_list.push(n);
//     //   price_list.push($(el).find('div:nth(2) > form > p:first').text().trim());
//     //   qty_list.push($(el).find('div:nth(2) > form > p:nth(2)').text().trim());
//     // });

//     // console.log(name_list);

//     let ret = '';
//     // for (let i = 0; i < id_set_list.length; i += 1) {
//     //   // const id = id_set_list[i];
//     //   // const n = await jsGoogleTranslateFree.translate('ja', 'en', name_list[i]);
//     //   // const price = `¥${price_list[i].replace('円', '')}`;
//     //   // const qty = /^\d+$/.test(qty) ? qty : 'Out of Stock';

//     //   // console.log(`${id} ${n} ${price} ${qty}`);
//     // }

//     return ret;
//   } catch (err) {
//     throw err;
//   }
// };

// const getCardSet = async (card_name) => {
//   try {
//     const url = `https://yugipedia.com/wiki/${encodeURIComponent(card_name)}`;
//     const res = await axios.get(url);
//     const html = res.data;
//     const $ = cheerio.load(html);

//     let card_sets = [];

//     const setlist = $('#cts--JP tbody tr');
//     setlist.each((i, el) => {
//       const set = $(el).find('td:nth(1) > a').text();
//       if (!set) return;

//       card_sets.push(set);
//     });

//     return card_sets;
//   } catch (err) {
//     throw err;
//   }
// };

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

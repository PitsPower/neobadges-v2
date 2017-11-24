var request = require('request');
var cheerio = require('cheerio');
var neocities = require('./neocities');

var allBadges = require('../config/badges.json');

var stats = [
    {
        name: 'views',
        url: 'https://neocities.org/api/info?sitename={{sitename}}',
        type: 'json',
        useData: function(data) {
            return data.info.views;
        }
    }, 
    {
        name: 'followers',
        url: 'https://neocities.org/site/{{sitename}}',
        type: 'site',
        useData: function($) {
            return parseInt($('.stat').eq(1).text().replace(',', ''));
        }
    }, 
    {
        name: 'updates',
        url: 'https://neocities.org/site/{{sitename}}',
        type: 'site',
        useData: function($) {
            return parseInt($('.stat').eq(2).text().replace(',', ''));
        }
    }
];
var siteCache = {};

function parseStatData(stat, data) {
    if (stat.type == 'json') {
        var dataObj = JSON.parse(data);
        return stat.useData(dataObj);
    } else if (stat.type == 'site') {
        var $ = cheerio.load(data);
        return stat.useData($);
    }
}
function getStat(name, site, cb) {
    var stat = stats.find(function(element) {
        return element.name == name;
    });
    
    if (stat) {
        var url = stat.url.replace('{{sitename}}', site);
        if (siteCache.url) {
            cb(parseStatData(stat, siteCache.url));
        } else {
            request(url, function(err, response, body) {
                if (err) return console.log(err);
                
                siteCache.url = body;
                cb(parseStatData(stat, body));
            });
        }
    } else {
        cb();
    }
}

getStat('views', 'project2', function(stat) {
    console.log(stat);
});
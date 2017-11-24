var request = require('request');
var cheerio = require('cheerio');
var neocities = require('./neocities');

var allBadges = require('../config/badges.json');

var stats = [
    {
        name: 'views',
        url: 'https://neocities.org/site/{{sitename}}',
        useData: function($) {
            return parseInt($('.stat').eq(0).text().replace(',', ''));
        }
    }, 
    {
        name: 'followers',
        url: 'https://neocities.org/site/{{sitename}}',
        useData: function($) {
            return parseInt($('.stat').eq(1).text().replace(',', ''));
        }
    }, 
    {
        name: 'updates',
        url: 'https://neocities.org/site/{{sitename}}',
        useData: function($) {
            return parseInt($('.stat').eq(2).text().replace(',', ''));
        }
    }
];
var siteCache = {};

function getStat(name, site, cb) {
    var stat = stats.find(function(element) {
        return element.name == name;
    });
    
    if (stat) {
        var url = stat.url.replace('{{sitename}}', site);
        if (siteCache.url) {
            var $ = cheerio.load(siteCache.url);
            cb(stat.useData($));
        } else {
            request(url, function(err, response, body) {
                if (err) return console.log(err);
                
                siteCache.url = body;
                
                var $ = cheerio.load(body);
                cb(stat.useData($));
            });
        }
    } else {
        cb();
    }
}

getStat('followers', 'project2', function(stat) {
    console.log(stat);
});
var request = require('request');
var cheerio = require('cheerio');
var neocities = require('./neocities');

var allBadges = require('../config/badges.json');
var allStats = [
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
    }, 
    {
        name: 'yearsold',
        url: 'https://neocities.org/api/info?sitename={{sitename}}',
        type: 'json',
        useData: function(data) {
            var currentTime = new Date().getTime();
            var creationTime = new Date(data.info.created_at).getTime();
            
            var millisecondsOld = currentTime - creationTime;
            return ~~(millisecondsOld/(1000*60*60*24*365));
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
    var stat = allStats.find(function(element) {
        return element.name == name;
    });
    
    if (stat) {
        var url = stat.url.replace('{{sitename}}', site);
        if (siteCache[url]) {
            cb(parseStatData(stat, siteCache[url]));
        } else {
            request(url, function(err, response, body) {
                if (err) return console.log(err);
                
                siteCache[url] = body;
                cb(parseStatData(stat, body));
            });
        }
    } else {
        cb();
    }
}
function getStats(names, site, cb) {
    if (names.length > 0) {
        var name = names.shift();
        getStats(names, site, function(stats) {
            getStat(name, site, function(stat) {
                stats[name] = stat;
                cb(stats);
            });
        });
    } else {
        cb({});
    }
}

function getBadges(site, cb) {
    request('https://'+process.env.NEOCITIES_NAME+'.neocities.org/data/users.json', function(err, response, body) {
        if (err) return console.log(err);
        
        var data = JSON.parse(body);
        if (data.users[site]) {
            cb(data.users[site].badges);
        } else {
            cb([]);
        }
    });
}
function findNewBadges(site, cb) {
    var neededStats = [];
    allBadges.forEach(function(badge) {
        badge.needs.forEach(function(stat) {
            if (neededStats.indexOf(stat) == -1) neededStats.push(stat);
        });
    });
    
    getStats(neededStats, site, function(stats) {
        var badges = [];
        
        allBadges.forEach(function(badge) {
            if (eval(badge.condition)) badges.push(badge.name);
        });
        
        cb(badges);
    });
}

getBadges('palutena', function(badges) {
    console.log(badges);
});
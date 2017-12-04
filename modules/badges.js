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
    }, 
    {
        name: 'saysneobadges',
        url: 'https://neocities.org/site/{{sitename}}',
        type: 'site',
        useData: function($, site) {
            var saysNeobadges = false;
            $('.comment').each(function() {
                if ($(this).find('.user').text() == site && $(this).find('.content').text().toLowerCase().indexOf('neobadges') > 0) {
                    saysNeobadges = true;
                    return false;
                }
            });
            return saysNeobadges;
        }
    }, 
    {
        name: 'featured',
        url: 'https://neocities.org/browse?sort_by=featured',
        type: 'site',
        useData: function($, site) {
            var featured = false;
            $('.username').each(function() {
                if ($(this).text().trim() == site) {
                    featured = true;
                    return false;
                }
            });
            return featured;
        }
    }, 
    {
        name: 'wizard',
        url: 'https://neocities.org/site/{{sitename}}',
        type: 'site',
        useData: function($, site) {
            return $('.follower-list').find('a[href="/site/'+site+'"]').length > 0;
        }
    }
];
var siteCache = {};

function parseStatData(stat, data, site) {
    if (stat.type == 'json') {
        var dataObj = JSON.parse(data);
        return stat.useData(dataObj);
    } else if (stat.type == 'site') {
        var $ = cheerio.load(data);
        return stat.useData($, site);
    }
}
function getStat(name, site, cb) {
    var stat = allStats.find(function(element) {
        return element.name == name;
    });
    
    if (stat) {
        var url = stat.url.replace('{{sitename}}', site);
        if (siteCache[url]) {
            cb(parseStatData(stat, siteCache[url], site));
        } else {
            request(url, function(err, response, body) {
                if (err) return console.log(err);
                
                siteCache[url] = body;
                cb(parseStatData(stat, body, site));
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
    getBadges(site, function(userBadges) {
        console.log(userBadges);
        var neededStats = [];
        allBadges.forEach(function(badge) {
            if (userBadges.indexOf(badge.name) == -1) {
                badge.needs.forEach(function(stat) {
                    if (neededStats.indexOf(stat) == -1) neededStats.push(stat);
                });
            }
        });
        
        getStats(neededStats, site, function(stats) {
            var badges = [];
            
            allBadges.forEach(function(badge) {
                if (eval(badge.condition) && userBadges.indexOf(badge.name) == -1) badges.push(badge.name);
            });
            
            if (badges.length > 0) {
                neocities.editJSON('/data/users.json', function(data) {
                    if (!data.users[site]) {
                        data.users[site] = {badges:[]};
                    }
                    data.users[site].badges = data.users[site].badges.concat(badges);
                    return data;
                }, function() {
                    cb(badges);
                });
            } else {
                cb(badges);
            }
        });
    });
}

findNewBadges('project2', function(badges) {
    console.log(badges);
});
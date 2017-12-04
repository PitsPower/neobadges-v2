var fs = require('fs');
var request = require('request');

module.exports.editJSON = function(name, modify, cb) {
	request('https://'+process.env.NEOCITIES_NAME+'.neocities.org'+name, function(err, response, body) {
		if (err) return console.log(err);
		
		var newData = modify(JSON.parse(body));
		module.exports.uploadString(name, JSON.stringify(newData), cb);
	});
}

module.exports.uploadString = function(name, str, cb) {
	var temp = __dirname+'/temp.txt';
	
	fs.writeFile(temp, str, function(err) {
		if (err) return console.log(err);
		
		module.exports.uploadFile(name, temp, function(result) {
			cb(result);
			fs.unlink(temp);
		});
	});
}

module.exports.uploadFile = function(name, path, cb) {
	var formData = {};
	formData[name] = fs.createReadStream(path);
	
	request.post({
		url: 'https://neocities.org/api/upload',
		formData: formData,
		headers: {
			Authorization: 'Bearer '+process.env.NEOCITIES_KEY
		}
	}, function(err, response, body) {
		if (err) return console.log(err);
		cb(JSON.parse(body));
	});
}
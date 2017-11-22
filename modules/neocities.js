var fs = require('fs');
var request = require('request');

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
			Authorization: 'Bearer '+process.env.NEOCITIES
		}
	}, function(err, response, body) {
		if (err) return console.log(err);
		cb(JSON.parse(body));
	});
}
var neocities = require('./modules/neocities');

neocities.uploadString('test.txt', 'this is a test', function() {
    console.log('Done!');
});
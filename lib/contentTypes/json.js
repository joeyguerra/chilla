var trim = require('../trim');
var Path = require('path');
function readFromFile(filePath, result, callback){
	Fs.readFile(filePath, {encoding: "utf-8"}
		, function(err, data){
			if(err) throw err;
			var output = Ejs.render(data, result);
			output = trim(output);
			callback(output);
		});
}

module.exports = {
	key: "application/json"
	, execute: function(exists, filePath, chilla, result, callback){
		var output = null;
		if(!exists){
			callback(JSON.stringify(result.model));
		}else{
			readFromFile(filePath, result, function(output){
				result.output = output;
				var layout = chilla.layoutRoot + Path.sep + result.resource.layout + ".json";
				Fs.exists(layout, function(exists){
					if(!exists) return callback(output);
					readFromFile(layout, result, function(output){
						callback(output);					
					});
				});
			});
		}
	}
};

var Path = require('path');
module.exports = function(path){
	return path.replace(/\//ig, Path.sep);
};
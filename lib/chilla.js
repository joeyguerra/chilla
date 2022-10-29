var Path = require('path');
var Fs = require('fs');
var Mime = require('mime');
var Url = require('url');
var Mimeparse = require('./mimeparse');
var makePath = require('./pathMaker');
function Chilla(configuration){
	if(!configuration) configuration = {};
	this.appPath = configuration.appPath || process.cwd();
	this.contentTypes = {};
	this.themeRoot = configuration.themeRoot || this.appPath + makePath('/themes/default');
	this.templatesRoot = configuration.templatesRoot || this.themeRoot + makePath('/templates');
	this.layoutRoot = configuration.layoutRoot || this.templatesRoot + makePath('/layouts');
	this.contentTypesFolder = configuration.contentTypesFolder || __dirname + makePath('/contentTypes');
	this.defaultExt = '.html';
	this.endpoints = {
		get: []
		, post: []
		, delete: []
		, options: []
		, head: []
		, trace: []
	};
	var self = this;
	Fs.readdirSync(this.contentTypesFolder).forEach(function(file) {
		var contentType = require(self.contentTypesFolder + "/" + file);
		self.contentTypes[contentType.key] = contentType;
	});
}
Chilla.prototype.fromTheAcceptHeader = function(method, headers){
	var key = null;
	if(['GET','HEAD'].indexOf(method) > -1) key = 'accept';
	else key = 'Content-Type';
	var ext = null;
	if(headers[key]){
		var bestMatch = Mimeparse.bestMatch(['text/html', 'application/json', 'application/xml', '*/*'], headers[key]);
		ext = Mime.getExtension(bestMatch);
	}
	if(ext !== null && ext !== undefined) return '.' + ext;
	return null;
};
Chilla.prototype.lookupMediaTypeViaExt = function(ext){
	return Mime.getType(ext);
};
Chilla.prototype.extensionViaContentNegotation = function(request){
	var urlExt = this.fromUrl(request.url);
	if(urlExt.length > 1) return urlExt;
	var ext = this.fromTheAcceptHeader(request.method, request.headers);
	return ext;
};
Chilla.prototype.fromUrl = function(url){
	var parsed = Url.parse(url, true, true);
	return Path.extname(parsed.pathname);
};
Chilla.prototype.execute = function(result, callback){
	var output = null;
	var ext = this.extensionViaContentNegotation(result.request);
	if(ext === null) ext = this.defaultExt;
	ext = ext === ".phtml" ? ".html" : ext;
	var filePath = this.templatesRoot + makePath('/' + result.template) + ext;
	for(var prop in result.resource.header) result.response.setHeader(prop, result.resource.header[prop]);
	var contentTypeKey = this.lookupMediaTypeViaExt(ext);
	var contentType = this.contentTypes[contentTypeKey];
	if(!result.resource.header["Content-Type"]) result.response.setHeader("Content-Type", contentTypeKey);
	if(!contentType){
		return callback(406);
	}
	var self = this;
	Fs.exists(filePath, function(exists){
		contentType.execute(exists, filePath, self, result, function(output){
			callback(output);
		});
	});
};
module.exports = function(configuration){
	if(!configuration) configuration = {};
	return new Chilla(configuration);
};
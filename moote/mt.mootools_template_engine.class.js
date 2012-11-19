var MooTE = new Class({

	Implements: [Options],

	options: {
		update: '',
		template: '',
		templateURL: undefined,
		helper: {},
		substitude: {},
	},

	initialize: function(options) {
		this.setOptions(options);
		this.loadTemplate();

	},
		
	parse: function() {
		var options = this.options;
	
		// does a template exist
		if (!options.template && !options.templateURL) {
			return false;
		}
	
		// get template if needed
		this.loadTemplate();
		
		if (!options.template) { 
			return false;
		}
				
		// substitute
		tmp = this.render();

		var template = Elements.from(tmp, false);
		
		// add templatze to DOM
		if (options.update) {
			if(template.length != 0) {
				$(this.options.update).empty().adopt(template);
			}
			else {
				$(this.options.update).empty().set('text', tmp);
			}
		}
		else if (options.append) {
			//console.log(options.append);
			//document.id(options.append).adopt(template);
		}

		//console.log('[TEMPLATE][SUCCESS]');

		return true;
		
	},
	
	loadTemplate: function() {
		var options = this.options;
		
		if (!options.template && !options.templateURL) { 
			// DO NOTHING
		}
		else if (!options.template) {
			new Request({
				async: false,
				url: this.options.templateURL,
				evalScripts: true,
				onRequest: function() {
					//console.log('[TEMPLATE][REQUEST] attempt to load template from '+options.templateURL);
				},
				onSuccess: function(template) {
					//console.log('[TEMPLATE][SUCCESS] template loaded from '+options.templateURL);
					//console.log('[TEMPLATE][SUCCESS] '+template);
					options.template = template;
				},
				onFailure: function(xhr) {
					//console.log('[TEMPLATE][FAILURE] attempt to load template from '+options.templateURL);
					console.log('[XHR:FAILURE] '+JSON.encode(xhr));
				}
			}).send();
		}
	},
	
	getTemplate: function() {
		return this.options.template;
	},
	
	render: function() {
		return this.replaceVariables(this.findTags(this.options.template));
	},

	findTags: function(string) {
		var expression = /{{(\w*)( [^{}]*){0,}}}(.*){{\/\1}}/gi;

		tagBlocks = string.match(expression);

		if (tagBlocks == undefined || tagBlocks.length == 0) {
			return string;
		}

		var workOnTag = this.workOnTag.bind(this);
		return string.replace(expression, workOnTag);

	},

	workOnTag: function(match, tag, arguments, inner, offset, string) {
		if (arguments != undefined) {
			arguments = arguments.trim().split(' ');
		}
		else {
			arguments = new Array();
		}

		var returnValue = '';
		var functions = this.options.functions;

		switch(tag) {
			case 'if': 
				returnValue = this.ifFunction(inner, arguments);
				break;

			default:
				returnValue = this.findTags(inner);
				break;
		}
		
		return returnValue;
	},

	getElseCase: function(string) {
		var expression = /(.*){{else}}(.*)/i;
		var returnValue = new Array(false);


		var elseResult = string.match(expression);

		if (elseResult && elseResult.length == 3) {
			returnValue = elseResult;
			returnValue[0] = true;
		} 

		return returnValue;
	},

	replaceVariables: function(string) {
		var expression = /\\?\{{:([^{}]+)\}}/g; // /{{:(.*)}}/i;

		return string.substitute(this.options.substitute, expression);
	},

	execFunctions: function(string, object) {
		var expression =  /\\?\{{#([^{}]+)\}}/g; ///{{fn:(.*)}}/i;

		string.substitute(object, expression);

		return string;
	},

	ifFunction: function(inner, conditions) {
		returnValue = '';

		var elseCase = this.getElseCase(inner);
		var cond = eval(conditions.join(' '));
		if (elseCase[0] == false && cond) {
			returnValue = findTags(inner);

		} 
		else if (elseCase[0] == true) {
			if (eval(conditions.join(' '))) {
				returnValue = this.findTags(elseCase[1]);
			}
			else {
				returnValue = this.findTags(elseCase[2]);
			}
		}
		return returnValue;
	},
});
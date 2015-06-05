'use strict';
var promise = require("promise");
var _ = require('lodash');

module.exports = function(db, config) {
	return new QuBui(db, config);
};

function QuBui(db, config){
	this.db = db;
	this.clear();
	
	if(config&&config.co){
 		this.db.__query = this.db.query;
 	} else {
		this.db.__query = promise.denodeify(this.db.query);
 	}
	if(config&&config.debug) this._debug=config.debug;
}

module.exports.QuBui = QuBui;

QuBui.prototype.clear = function() {
	this.command = '';
	this._debug = false;
	
	this.Q = {
		'field':	[]
	,	'table':	[]
	,	'join':		[]
	,	'on':		[]
	,	'having':	[]
	,	'group':	[]
	,	'where':	[]
	,	'operator':	[]
	,	'order':	[]
	,	'limit':	[]
	};
	
	this.V = {
		'on':		[]
	,	'having':	[]
	,	'where':	[]
	,	'order':	[]
	,	'limit':	[]
	}
	
	this.query = '';
	this.args = [];

	return this;
};

QuBui.prototype.build = function() {
	//allaways skip index 0
	if(this.Q.where.length>1){
		var i = 1;
		var max = this.Q.where.length;
		do{
			var operator = this.Q.operator[i].toUpperCase();
			if( operator !== 'AND' ){
				this.Q.where.splice(i-1,0,this.Q.where[i-1]+' '+operator+' '+this.Q.where[i]);
				this.Q.where.splice(i,2);
				this.Q.operator.splice(i,1);
				i--;
				max--;
			}
		}
		while((++i)<max);
	}
	
	var where = (this.Q.where.length>0)?' WHERE '+		this.Q.where.join(' AND '):'';
	var order = (this.Q.order.length>0)?' ORDER BY '+	this.Q.order.join():'';
	var limit = (this.Q.limit.length>0)?' LIMIT '+		this.Q.limit.join():'';
	var group = (this.Q.group.length>0)?' GROUP BY '+	this.Q.group.join():'';
	var having= (this.Q.having.length>0)?' HAVING '+	this.Q.having.join():'';

	if(this.command){
		switch(this.command) {
			case 'SELECT':
				var field = (this.Q.field.length>0)?this.Q.field.join():'*';
				var joins = (this.Q.join.length>0 )?_.chain(this.Q.join).zip(this.Q.on).flatten().join('').value():'';

				this.query = 'SELECT '+field+(this.Q.table.length>0?' FROM '+this.Q.table.join()+joins+where+group+having+order+limit:'');
				this.args = this.args.concat(this.V.on, this.V.where, this.V.having, this.V.order, this.V.limit);
			break;
			case 'INSERT':
				if(this.Q.field.length<1){
					var check = [];
					_.each(_.values(this.data),function(v){
						check.push( _.isString(v) && v.indexOf('NOW()')>-1 );
					});
					if( _.indexOf(check,true) > -1){
						this.Q.field = _.keys(this.data);
						this.data = _.values(this.data);
					}
				}

				if(this.Q.field.length>0){
					var q = [];
					var data = [];
					var check = [];
					_.each(this.data, function(value){
						if( _.isString(value) && value.indexOf('NOW()')>-1 ){
							q.push(value);
						} else {
							q.push('?');
							data.push(value);
						}
					});
					this.data = data;
								
					this.query = 'INSERT INTO '+this.Q.table[0]+'('+this.Q.field.join()+') VALUES ('+q.join()+')';
					this.args = this.data;
				} else {
					this.query = 'INSERT INTO '+this.Q.table[0]+' SET ? ';
					this.args = this.data;
				}
			break;
			case 'UPDATE':
				if(!_.isString(this.data)){
					var ctx = this;
					var check = [];
					_.each(_.values(this.data),function(v){
						check.push( _.isString(v) && v.indexOf('NOW()')>-1 );
					});
					if( _.indexOf(check,true) > -1){
						var q = [];
						_.each(this.data, function(value,key){
							if(_.isString(value) && value.indexOf('NOW()')>-1){
								q.push('`'+key+'`='+value);
							} else {
								q.push('`'+key+'`=?');
								ctx.args.push(value);
							}
						});
						ctx.data = q.join();
					}
				}

				if(_.isString(this.data)){
					this.query = 'UPDATE '+this.Q.table[0]+' SET '+this.data+' '+where;
					this.args = this.args.concat(this.V.where);
				} else {		
					this.query = 'UPDATE '+this.Q.table[0]+' SET ? '+where;
					this.args = this.args.concat(this.data,this.V.where);
				}
			break;
			case 'DELETE':
				this.query = 'DELETE FROM '+this.Q.table[0]+where;
				this.args = this.V.where;
			break;
			case 'UPSERT':
				if( _.indexOf(_.values(this.data),'NOW()') > -1){
					var q = [];
					var data = [];
					var k = [];

					_.each(this.data, function(value,key){
						if(value!=='NOW()'){
							q.push('?');
							data.push(value);
							k.push(key+'=?');
						} else {
							q.push('NOW()');
							k.push(key+'=NOW()');
						}
					});

					this.query = 'INSERT INTO '+this.Q.table[0]+'('+_.keys(this.data).join()+') VALUES ('+q.join()+') ON DUPLICATE KEY UPDATE '+k.join();
					this.args = data.concat(data);
				} else {
					this.query = 'INSERT INTO '+this.Q.table[0]+' SET ? ON DUPLICATE KEY UPDATE ?';
					this.args = this.data.concat(this.data);
				}
			break;
		}
	}
	if(this._debug){
		console.log('qb debug::'+this._debug);
		console.log({query:this.query, args:this.args});
	}
	return this;
};
QuBui.prototype.debug = function(flag) {
	this._debug = flag||false;
	return this;
};

QuBui.prototype.where =
QuBui.prototype.and = function(value,args,operator) {
	this.Q.where.push(value);
	if(args){
		if(typeof(args)=='string'){
			this.V.where.push(args); 
		} else {
			this.V.where = this.V.where.concat(args);
		}
	}
	this.Q.operator.push(operator||'AND');
	return this;
};

QuBui.prototype.or = function(value,args) {
	this.where(value,args,'OR');
	return this;
};

QuBui.prototype.group =
QuBui.prototype.groupBy = function(value,alias) {
	this.Q.group.push(value+(alias?' '+alias:''));
	return this; 
};
QuBui.prototype.having = function(value,args) {
	this.Q.having.push(value);
	if(args){ this.V.having.push(args); }
	return this; 
};
QuBui.prototype.order = 
QuBui.prototype.orderBy = function(value,args) {
	this.Q.order.push(value);
	if(args){ this.V.order.push(args); }
	return this; 
};
QuBui.prototype.limit = function(value,args) {
	this.Q.limit.push(value);
	if(args){ this.V.limit.push(args); }
	return this;
};

QuBui.prototype.set =
QuBui.prototype.values = function(value) {
	this.data = value;
	return this;
};

QuBui.prototype.all = function(reset) {
	if(reset) this.Q.field=[];
	this.field('*');
	return this;
};
QuBui.prototype.count = function(alias, reset) {
	if(reset) this.Q.field=[];
	this.field('count(*)'+((alias)?' as `'+alias+'`':' '));
	return this;
};
QuBui.prototype.field = function(value, reset) {
	if(reset) this.Q.field=[];
	if( _.isArray(value) ){
		this.Q.field=this.Q.field.concat(value);
	} else {
		this.Q.field.push(value);
	}
	return this;
};

QuBui.prototype.from = 
QuBui.prototype.into = 
QuBui.prototype.table = function(value) {
	if( _.isArray(value) ){
		this.Q.table=this.Q.table.concat(value);
	} else {
		this.Q.table.push(value);
	}
	return this;
};

QuBui.prototype.leftjoin = 
QuBui.prototype.leftJoin = function(value,on,args) {
	this.Q.join.push(' LEFT OUTER JOIN '+value);
	if(on){ this.Q.on.push(' ON '+on); }
	if(args){ this.V.on.push(args); }
	return this;
};
QuBui.prototype.rightjoin = 
QuBui.prototype.rightJoin = function(value,on,args) {
	this.Q.join.push(' RIGHT OUTER JOIN '+value);
	if(on){ this.Q.on.push(' ON '+on); }
	if(args){ this.V.on.push(args); }
	return this;
};
QuBui.prototype.innerjoin = 
QuBui.prototype.innerJoin = function(value,on,args) {
	this.Q.join.push(' INNER JOIN '+value);
	if(on){ this.Q.on.push(' ON '+on); }
	if(args){ this.V.on.push(args); }
	return this;
};
QuBui.prototype.outerjoin = 
QuBui.prototype.outerJoin = function(value,on,args) {
	this.Q.join.push(' FULL OUTER JOIN '+value);
	if(on){ this.Q.on.push(' ON '+on); }
	if(args){ this.V.on.push(args); }
	return this;
};

QuBui.prototype.on = function(on,args) {
	this.Q.on.push(' ON '+on);
	if(args){ this.V.on.push(args); }
	return this;
};

QuBui.prototype.select = function() {
	this.command = 'SELECT';
	return this;
};
QuBui.prototype.insert = function() {
	this.command = 'INSERT';
	return this;
};
QuBui.prototype.update = function() {
	this.command = 'UPDATE';
	return this;
};
QuBui.prototype.delete = function() {
	this.command = 'DELETE';
	return this;
};
QuBui.prototype.insertOrUpdate =
QuBui.prototype.upsert = function() {
	this.command = 'UPSERT';
	return this;
};

QuBui.prototype._successHandler = function(errors, result){
	if(errors) return errors;
	return result||false;
};
QuBui.prototype._errorHandler = function(e) {
	console.log(e);
	return {errors:e};
};
QuBui.prototype.sub =
QuBui.prototype.subQuery = function(name) {
	this.build();
	return '('+this.query+') '+(name?name:'');
};
QuBui.prototype.getAll =
QuBui.prototype.getList = function(callback) {
	callback = callback||this._successHandler;
	this.command = 'SELECT';
	this.build();
	
	return this.db.__query(this.query, this.args).then(function(result){
		return callback(false, result);
	}).catch(this._errorHandler);
};
QuBui.prototype.getOne =
QuBui.prototype.getRow = function(callback) {
	callback = callback||this._successHandler;
	this.command = 'SELECT';
	this.build();
	
	return this.db.__query(this.query, this.args).then(function(result){
		return callback(false, result[0]);
	}).catch(this._errorHandler);
};
QuBui.prototype.getFirstColumn = function(callback) {
	callback = callback||this._successHandler;
	this.command = 'SELECT';
	this.build();
	
	return this.db.__query(this.query, this.args).then(function(result){
		return callback(false, result[0][Object.keys(result[0])[0]]);
	}).catch(this._errorHandler);
};
QuBui.prototype.do =
QuBui.prototype.run = function(callback) {
	callback = callback||this._successHandler;
	this.build();
	
	return this.db.__query(this.query, this.args).then(function(result){
		return callback(false, result);
	}).catch(this._errorHandler);
};

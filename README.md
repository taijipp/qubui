# qubui

QuBui is flexible query builder.

### Version
1.0.5

### Change Log

* fix error!

### Installation

```
$ npm i qubui
```

### Example 

Initialize (in Express)
```
var qubui = require('qubui');
var DB = mysql.createConnection(~~);

var qb = qubui(DB);
```

Initialize (in Koajs)
```
var qubui = require('qubui');
app.use(function* (next){
    this.qubui=function(){
        return new qubui(this.db, {co:true});
    }
    yield next;
 });
```

Select:
```
// SELECT * FROM TEST
var express = qubui(DB).select().from('TEST').getList( HANDLER );
var koajs = yield this.qubui().select().from('TEST').getList();

// And...
var qb = qubui(DB).select().from('TEST');
if(req.use){ qb.where('use<?', req.id); }
if(req.zip){ qb.where('zip=?', req.zip); }
if(req.cnt){ qb.limit(req.cnt); }
if(req.srt){ qb.order(req.srt); }
qb.getList( HANDLER );
```

Insert:
```
// INSERT INTO TEST SET ?
var data = {foo:'bar',today:'NOW()',tomorrow:'NOW()+INTERVAL 1 DAY'};

var express = qubui(DB).insert().into('TEST').set(data).run( HANDLER );
var koajs = yield this.qubui().insert().into('TEST').set(data).run();
```

Update:
```
// UPDATE TEST SET ? WHERE foo=?
var data = {foo:'bar',today:'NOW()',tomorrow:'NOW()+INTERVAL 1 DAY'};

var express = qubui(DB).update().from('TEST').set(data).where('foo=?','bar').run( HANDLER );
var koajs = yield this.qubui().update().from('TEST').set(data).where('foo=?','bar').run();
```

Delete:
```
// DELETE FROM TEST WHERE foo=?
var express = qubui(DB).delete().from('TEST').where('foo=?','bar').run( HANDLER );
var koajs = yield this.qubui().delete().from('TEST')..where('foo=?','bar').run();
```


License
----

MIT


[npmjs]:https://www.npmjs.com/

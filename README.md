# qubui

QuBui is flexible query builder.

### Version
1.0.1

### Change Log

* fix Subquery
* fix select Builder

### Installation

```sh
$ npm i qubui
```

### Example 

Initialize (in Express)
```sh
var qubui = require('qubui');
var DB = mysql.createConnection(~~);

var qb = qubui(DB);
```

Initialize (in Koajs)
```sh
var qubui = require('qubui');
app.use(function* (next){
    this.qubui=function(){
        return new qubui(this.db, {co:true});
    }
    yield next;
 });
```

Select:
```sh
// SELECT * FROM TEST
var express = qubui(DB).select().from('TEST').getList( HANDLER );
var koajs = yield this.qubui().select().from('TEST').getList();
```

Insert:
```sh
// INSERT INTO TEST SET ?
var data = {foo:'bar',today:'NOW()',tomorrow:'NOW()+INTERVAL 1 DAY'};

var express = qubui(DB).insert().into('TEST').set(data).run( HANDLER );
var koajs = yield this.qubui().insert().into('TEST').set(data).run();
```

Update:
```sh
// UPDATE TEST SET ? WHERE foo=?
var data = {foo:'bar',today:'NOW()',tomorrow:'NOW()+INTERVAL 1 DAY'};

var express = qubui(DB).update().from('TEST').set(data).where('foo=?','bar').run( HANDLER );
var koajs = yield this.qubui().update().from('TEST').set(data).where('foo=?','bar').run();
```

Delete:
```sh
// DELETE FROM TEST WHERE foo=?
var express = qubui(DB).delete().from('TEST').where('foo=?','bar').run( HANDLER );
var koajs = yield this.qubui().delete().from('TEST')..where('foo=?','bar').run();
```


License
----

MIT


[npmjs]:https://www.npmjs.com/

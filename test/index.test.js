var assert  = require('assert');
var qubui = require("../index");
var bracket = qubui.Bracket;
var db = {};
 
describe('index.js', function() {
    describe('SELECT', function() {
        it('test select', function() {
            var qb = qubui(db).select().from('test').build();
            assert.equal(qb.query, 'SELECT * FROM test');
        });
        it('test select field', function() {
            var qb = qubui(db).select().field('test').from('test').build();
            assert.equal(qb.query, 'SELECT test FROM test');
        });
        it('test select fields', function() {
            var qb = qubui(db).select().field(['test','test2']).from('test').build();
            assert.equal(qb.query, 'SELECT test,test2 FROM test');
        });
        it('test select where', function() {
            var qb = qubui(db).select().from('test')
                    .where('test=?','args').build();
            assert.equal(qb.query, 'SELECT * FROM test WHERE test=?');
            assert.deepEqual(qb.args, ['args']);
        });
        it('test select where array', function() {
            var qb = qubui(db).select().from('test')
                    .where('test=? and test2=?',['args','args2']).build();
            assert.equal(qb.query, 'SELECT * FROM test WHERE test=? and test2=?');
            assert.deepEqual(qb.args, ['args','args2']);
        });
        it('test select order & limit', function() {
            var qb = qubui(db).select().from('test')
                    .order('data DESC').limit(10).build();
            assert.equal(qb.query, 'SELECT * FROM test ORDER BY data DESC LIMIT 10');
        });
        it('test select left join', function() {
            var qb = qubui(db).select().from('test')
                    .leftJoin('ljoin').on('test.x=?','ljoin.x').where('test=?','args').build();
            assert.equal(qb.query, 'SELECT * FROM test LEFT OUTER JOIN ljoin ON test.x=? WHERE test=?');
            assert.deepEqual(qb.args, ['ljoin.x','args']);
        });
        it('test select left join using', function() {
            var qb = qubui(db).select().from('test')
                    .leftJoin('ljoin').using(['x','y']).where('test=?','args').build();
            assert.equal(qb.query, 'SELECT * FROM test LEFT OUTER JOIN ljoin USING (x,y) WHERE test=?');
            assert.deepEqual(qb.args, ['args']);
        });
        it('test select group', function() {
            var qb = qubui(db).select().from('test').group('key').where('test=?','args').build();
            assert.equal(qb.query, 'SELECT * FROM test WHERE test=? GROUP BY key');
            assert.deepEqual(qb.args, ['args']);
        });
    });
    describe('INSERT', function() {
        it('test insert', function() {
            var qb = qubui(db).insert().into('test')
                    .set({data:'values'}).build();
            assert.equal(qb.query, 'INSERT INTO test SET ? ');
            assert.deepEqual(qb.args, {data:'values'});
        });
        it('test insert with TimeStamp', function() {
            var qb = qubui(db).insert().into('test')
                    .set({data:'values', today:'NOW()'}).build();
            assert.equal(qb.query, 'INSERT INTO test(data,today) VALUES (?,NOW())');
            assert.deepEqual(qb.args, ['values']);
        });
        it('test insert with TimeStamp Interval', function() {
            var qb = qubui(db).insert().into('test')
            .set({data:'values', today:'NOW()', tomorrow:'NOW()+INTERVAL 1 DAY', data2:'args'}).build();
            assert.equal(qb.query, 'INSERT INTO test(data,today,tomorrow,data2) VALUES (?,NOW(),NOW()+INTERVAL 1 DAY,?)');
            assert.deepEqual(qb.args, ['values','args']);
        });
    });
    describe('UPDATE', function() {
        it('make update', function() {
            var qb = qubui(db).update().from('test')
                    .set({data:'values'}).where('test=?','args').build();
            assert.equal(qb.query, 'UPDATE test SET ?  WHERE test=?');
            assert.deepEqual(qb.args, [{data:'values'},'args']);
        });
        it('make update with TimeStamp', function() {
            var qb = qubui(db).update().from('test')
                    .set({data:'values', today:'NOW()'}).where('test=?','args').build();
            assert.equal(qb.query, 'UPDATE test SET `data`=?,`today`=NOW()  WHERE test=?');
            assert.deepEqual(qb.args, ['values','args']);
        });
    });
    describe('DELETE', function() {
        it('make delete', function() {
            var qb = qubui(db).delete().from('test')
                    .where('test=?','args').build();
            assert.equal(qb.query, 'DELETE FROM test WHERE test=?');
            assert.deepEqual(qb.args, ['args']);
        });
    });
    describe('SUB QUERY', function() {
        it('test sub query 1', function() {
            var sb = qubui().select().field('name').from('sub').where('sub.id=?','test.id');
            var qb = qubui(db).select().field(['id', bracket(sb,'test_name')]).from('test')
                    .where('test=?','args').build();
            assert.equal(qb.query, 'SELECT id,(SELECT name FROM sub WHERE sub.id=test.id) test_name FROM test WHERE test=?');
            assert.deepEqual(qb.args, ['args']);
        });
        it('test sub query 2', function() {
            var sb = qubui().select().field('name').from('sub');
            var qb = qubui(db).select().from(['test', bracket(sb,'name')]).where('test=?','args').build();
            assert.equal(qb.query, 'SELECT * FROM test,(SELECT name FROM sub) name WHERE test=?');
            assert.deepEqual(qb.args, ['args']);
        });
    });
});
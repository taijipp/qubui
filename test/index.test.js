var assert  = require('assert');
var qubui = require("../index");
var db = {};
 
describe('index.js', function() {
    describe('SELECT', function() {
        it('test select', function() {
            var qb = qubui(db).select().from('test').build();
            assert.equal(qb.query, 'SELECT * FROM test');
        });
        it('test select where', function() {
            var qb = qubui(db).select().from('test')
                    .where('test=?','args').build();
            assert.equal(qb.query, 'SELECT * FROM test WHERE test=?');
            assert.deepEqual(qb.args, ['args']);
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
});
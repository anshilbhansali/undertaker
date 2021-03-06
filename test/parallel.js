'use strict';

var expect = require('expect');

var Undertaker = require('../');

function fn1(done) {
  done(null, 1);
}

function fn2(done) {
  setTimeout(function() {
    done(null, 2);
  }, 500);
}

function fn3(done) {
  done(null, 3);
}

function fnError(done) {
  done(new Error('An Error Occurred'));
}

describe('parallel', function() {
  var taker;

  beforeEach(function(done) {
    taker = new Undertaker();
    taker.task('test1', fn1);
    taker.task('test2', fn2);
    taker.task('test3', fn3);
    taker.task('error', fnError);
    done();
  });

  it('should not take an empty argument', function(done) {
    function emptyArgument() {
      taker.parallel();
    }

    expect(emptyArgument).toThrow('Empty array as argument or no argument');
    done();
  });

  it('should not take an empty array', function(done) {
    function emptyArray() {
      taker.parallel([]);
    }

    expect(emptyArray).toThrow('Empty array as argument or no argument');
    done();
  });

  it('should not take objects', function(done) {
    function objectAsArgument() {
      taker.parallel(['test1',{}]);
    }

    expect(objectAsArgument).toThrow('Task never defined:');
    done();
  });

  it('should take only one array of registered tasks', function(done) {
    taker.parallel(['test1', 'test2', 'test3'])(function(err, results) {
      expect(results).toEqual([1, 2, 3]);
      done(err);
    });
  });

  it('should take all string names', function(done) {
    taker.parallel('test1', 'test2', 'test3')(function(err, results) {
      expect(results).toEqual([1, 2, 3]);
      done(err);
    });
  });

  it('should take all functions', function(done) {
    taker.parallel(fn1, fn2, fn3)(function(err, results) {
      expect(results).toEqual([1, 2, 3]);
      done(err);
    });
  });

  it('should take string names and functions', function(done) {
    taker.parallel('test1', fn2, 'test3')(function(err, results) {
      expect(results).toEqual([1, 2, 3]);
      done(err);
    });
  });

  it('should take nested parallel', function(done) {
    var parallel1 = taker.parallel('test1', 'test2', 'test3');
    taker.parallel('test1', parallel1, 'test3')(function(err, results) {
      expect(results).toEqual([1, [1, 2, 3], 3]);
      done(err);
    });
  });

  it('should stop processing on error', function(done) {
    taker.on('error', function() {
      // To keep the test from catching the emitted errors
    });
    taker.parallel('test1', 'error', 'test3')(function(err, results) {
      expect(err).toBeAn(Error);
      expect(results).toEqual([1, undefined, undefined]);
      done();
    });
  });

  it('should throw on unregistered task', function(done) {
    function unregistered() {
      taker.parallel('unregistered');
    }

    expect(unregistered).toThrow('Task never defined: unregistered');
    done();
  });

  it('should process all functions if settle flag is true', function(done) {
    taker.on('error', function() {
      // To keep the test from catching the emitted errors
    });
    taker._settle = true;
    taker.parallel(taker.parallel('test1', 'error'), 'test3')(function(err, results) {
      expect(err[0][0]).toBeAn(Error);
      expect(results).toEqual([3]);
      done();
    });
  });
});

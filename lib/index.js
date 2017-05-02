'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.replayLastValue = replayLastValue;
exports.shared = shared;
exports.listen = listen;
exports.withMutations = withMutations;
exports.filterSet = filterSet;
exports.latestValue = latestValue;
exports.reloadInto = reloadInto;

var _Observable = require('rxjs/Observable');

var _Subject = require('rxjs/Subject');

var _multicast = require('rxjs/operator/multicast');

var _first = require('rxjs/operator/first');

var _toPromise = require('rxjs/operator/toPromise');

function nullFunction() {}

function replayLastValue() {
  var _this = this;

  var captured = undefined;

  var observable = _Observable.Observable.create(function (observer) {
    if (captured !== undefined) observer.next(captured);

    return _this.subscribe({
      next: function next(v) {
        captured = v;
        observer.next(v);
      },
      error: function error(err) {
        return observer.error(err);
      },
      complete: function complete() {
        return observer.complete();
      }
    });
  });

  observable.subscribe({ next: nullFunction });

  return observable;
}

function shared() {
  var singleSubject = new _Subject.Subject();

  return _multicast.multicast.call(this, singleSubject).refCount();
}

function listen(fn) {
  var optional = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var next = fn.setState ? function (s) {
    return fn.setState(Object.assign({}, s));
  } : fn;
  var subscription = this.subscribe(_extends({}, optional, { next: next }));
  return function () {
    return subscription.unsubscribe();
  };
}

function withMutations() {
  var _this2 = this;

  return _Observable.Observable.create(function (observer) {
    var captured = undefined;

    return _this2.subscribe({
      next: function next(v) {
        if (captured && typeof v === 'function') {
          v(captured);
          observer.next(captured);
          return;
        }

        captured = v;
        observer.next(v);
      },
      error: function error(err) {
        return observer.error(err);
      },
      complete: function complete() {
        return observer.complete();
      }
    });
  });
}

function filterSet(fn) {
  var _this3 = this;

  return _Observable.Observable.create(function (observer) {
    var captured = undefined;

    return _this3.subscribe({
      next: function next(v) {
        if (!captured) {
          captured = v;
          observer.next(v);
          return;
        }

        if (fn(captured, v)) {
          captured = v;
          observer.next(v);
        }
      },
      error: function error(err) {
        return observer.error(err);
      },
      complete: function complete() {
        return observer.complete();
      }
    });
  });
}

function latestValue() {
  var result = undefined;
  var receivedValue = false;
  var subscription = _first.first.call(this).subscribe({ next: function next(s) {
      receivedValue = true;
      result = s;
    } });
  subscription.unsubscribe();
  return { result: result, receivedValue: receivedValue };
}

function reloadInto(subject, fn) {
  var _context;

  var _ref = latestValue.call(this),
      result = _ref.result,
      receivedValue = _ref.receivedValue;

  if (receivedValue) {
    subject.next(fn(result));
    return when(null);
  }

  return (_context = _first.first.call(this), _toPromise.toPromise).call(_context).then(function (s) {
    return subject.next(fn(s));
  });
}
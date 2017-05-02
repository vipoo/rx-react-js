'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.replayLastValue = replayLastValue;
exports.shared = shared;
exports.listen = listen;

var _Observable = require('rxjs/Observable');

var _Subject = require('rxjs/Subject');

require('rxjs/add/operator/multicast');

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

  return this.multicast(singleSubject).refCount();
}

function listen(fn) {
  var optional = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var subject = new _Subject.Subject();
  var obs = this.multicast(subject).refCount();

  var next = fn.setState ? function (s) {
    return fn.setState(Object.assign({}, s));
  } : fn;
  var subscription = obs.subscribe(_extends({}, optional, { next: next }));
  return function () {
    return subscription.unsubscribe();
  };
}
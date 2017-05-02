'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.replayLastValue = replayLastValue;

var _Observable = require('rxjs/Observable');

var _Subject = require('rxjs/Subject');

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
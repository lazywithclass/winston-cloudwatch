var buffer = [];

function add(obj) {
  buffer.push(obj);
}

function canFree(lastFree) {
  var msBetweenFree = 1000;
  return new Date().getTime() - msBetweenFree > lastFree;
}

function free(action, cb) {
  var maxFreeableAmount = 10;
  action.call(null, buffer.splice(0, maxFreeableAmount), cb);
}

function isEmpty() {
  return buffer.length === 0;
}

function schedule(interval, action) {
  var lastFree = new Date().getTime();
  setInterval(function() {
    if (canFree(lastFree)) {
      free(action, function() {
        lastFree = new Date().getTime();
      });
    }
  }, interval || 1000);
}

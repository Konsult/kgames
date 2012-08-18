(function () {
  function Stats () {
    this.entries = {};
  };

  // Data Entry
  Stats.prototype.addScalar = function (id, val) {
    this.entries[id] = {
      id: id,
      type: "scale",
      val: val
    };
  };
  Stats.prototype.addEventSeries = function (id) {
    this.entries[id] = {
      id: id,
      type: "timeseries",
      times: [],
      history: false,
      currPt: null,
      prevPt: null,
      stats: {
        eps: {
          type: "ewma",
          alpha: 0.01,
          val: 0,
          recording: true
        }
      },
    };
  };
  Stats.prototype.recordEvent = function (id, data) {
    var entry = this.entries[id];
    var pt = {
      time: (new Date()).getTime(),
      data: data
    };
    var prev = entry.prevPt = entry.currPt || pt;
    var curr = entry.currPt = pt;
    if (entry.history) entry.times.push(pt);

    // Update any stats set to record
    for (statID in entry.stats) {
      var stat = entry.stats[statID];
      if (!stat.recording) continue;

      var ms = (curr.time - prev.time);
      var val = (ms == 0) ? 0 : 1000/ms;
      this.compute(stat, {val:val});
    }
  };

  // Data/Stat Access
  Stats.prototype.getStat = function (id, name) {
    var entry = this.entries[id];
    var stat = entry.stats[name];
    return stat ? stat.val : null;
  };

  // Stat Computation
  Stats.prototype.compute = function (stat, data) {
    var type = stat.type;

    switch (type) {
      case "ewma":
        var A = data.val;
        var B = stat.val;
        var a = stat.alpha;
        var val = (a * A) + ((1 - a) * B);
        stat.val = isNaN(val) ? stat.val : val;
        return stat.val;
        break;
      default:
        break;
    }
  };

  // Stat Tracking
  // TODO: Clean this up
  Stats.prototype.startStat = function (id, stat) {
    var entry = this.entries[id];
    var type = stat.type;
    entry.recording[type] = true;

    switch (type) {
      case "ewma":
        var index = entry.times.length - 1;
        var val = index < 0 ? 0 : entry.times[index].val;
        entry.stats[type] = {
          alpha: stat.alpha,
          val: val
        };
        break;
      default:
        break;
    }
  };
  Stats.prototype.stopStat = function (id, stat) {
    var entry = this.entries[id];
    var type = stat.type;
    delete entry.recording[type];
  };

  window.Stats = new Stats();
})();
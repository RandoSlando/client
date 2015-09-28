// Generated by IcedCoffeeScript 108.0.8
(function() {
  var Buffer, L, Logger, default_level, default_logger_class, stringify, util;

  util = require('util');

  Buffer = (require('buffer')).Buffer;

  exports.levels = L = {
    NONE: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    FATAL: 5,
    TOP: 6
  };

  default_level = L.INFO;

  stringify = function(o) {
    if (o == null) {
      return "";
    } else if (Buffer.isBuffer(o)) {
      return o.toString('utf8');
    } else if (util.isError(o)) {
      return o.toString();
    } else {
      return "" + o;
    }
  };

  exports.Logger = Logger = (function() {
    function Logger(_arg) {
      this.prefix = _arg.prefix, this.remote = _arg.remote, this.level = _arg.level;
      if (!this.prefix) {
        this.prefix = "RPC";
      }
      if (!this.remote) {
        this.remote = "-";
      }
      this.output_hook = function(m) {
        return console.log(m);
      };
      this.level = this.level != null ? this.level : default_level;
    }

    Logger.prototype.set_level = function(l) {
      return this.level = l;
    };

    Logger.prototype.set_remote = function(r) {
      return this.remote = r;
    };

    Logger.prototype.set_prefix = function(p) {
      return this.prefix = p;
    };

    Logger.prototype.debug = function(m) {
      if (this.level <= L.DEBUG) {
        return this._log(m, "D");
      }
    };

    Logger.prototype.info = function(m) {
      if (this.level <= L.INFO) {
        return this._log(m, "I");
      }
    };

    Logger.prototype.warn = function(m) {
      if (this.level <= L.WARN) {
        return this._log(m, "W");
      }
    };

    Logger.prototype.error = function(m) {
      if (this.level <= L.ERROR) {
        return this._log(m, "E");
      }
    };

    Logger.prototype.fatal = function(m) {
      if (this.level <= L.FATAL) {
        return this._log(m, "F");
      }
    };

    Logger.prototype._log = function(m, l, ohook) {
      var parts;
      parts = [];
      if (this.prefix != null) {
        parts.push(this.prefix);
      }
      if (l) {
        parts.push("[" + l + "]");
      }
      if (this.remote) {
        parts.push(this.remote);
      }
      parts.push(stringify(m));
      if (!ohook) {
        ohook = this.output_hook;
      }
      return ohook(parts.join(" "));
    };

    Logger.prototype.make_child = function(d) {
      return new Logger(d);
    };

    return Logger;

  })();

  default_logger_class = Logger;

  exports.set_default_level = function(l) {
    return default_level = l;
  };

  exports.set_default_logger_class = function(k) {
    return default_logger_class = k;
  };

  exports.new_default_logger = function(d) {
    if (d == null) {
      d = {};
    }
    return new default_logger_class(d);
  };

}).call(this);

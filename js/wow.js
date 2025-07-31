

(function () {

  var MutationObserver, Util, WeakMap, getComputedStyle, getComputedStyleRX,
      slice = [].slice,
      indexOf = [].indexOf || function (item) {
        for (var i = 0, l = this.length; i < l; i++) {
          if (this[i] === item) return i;
        }
        return -1;
      };

  Util = (function () {
    function Util() {}

    Util.prototype.extend = function (custom, defaults) {
      for (var key in defaults) {
        if (custom[key] == null) {
          custom[key] = defaults[key];
        }
      }
      return custom;
    };

    Util.prototype.isMobile = function (agent) {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(agent);
    };

    return Util;
  })();

  WeakMap = this.WeakMap || this.MozWeakMap || (function () {
    function WeakMap() {
      this.keys = [];
      this.values = [];
    }

    WeakMap.prototype.get = function (key) {
      for (var i = 0; i < this.keys.length; i++) {
        if (this.keys[i] === key) return this.values[i];
      }
    };

    WeakMap.prototype.set = function (key, value) {
      for (var i = 0; i < this.keys.length; i++) {
        if (this.keys[i] === key) {
          this.values[i] = value;
          return;
        }
      }
      this.keys.push(key);
      this.values.push(value);
    };

    return WeakMap;
  })();

  MutationObserver = this.MutationObserver || this.WebkitMutationObserver || this.MozMutationObserver || (function () {
    function MutationObserver() {
      if (console && console.warn) {
        console.warn("MutationObserver is not supported by your browser.");
        console.warn("WOW.js cannot detect dom mutations, please call .sync() after loading new content.");
      }
    }

    MutationObserver.notSupported = true;

    MutationObserver.prototype.observe = function () {};

    return MutationObserver;
  })();

  getComputedStyle = function (el, prop) {
    if (el.currentStyle) {
      return el.currentStyle[prop];
    } else if (window.getComputedStyle) {
      return getComputedStyle(el, null).getPropertyValue(prop);
    } else {
      return el.style[prop];
    }
  };

  getComputedStyleRX = /^(?:webkit|moz|ms|o)(?=[A-Z])/;

  this.WOW = (function () {
    function WOW(options) {
      if (options == null) options = {};
      this.scrollCallback = this.scrollCallback.bind(this);
      this.scrollHandler = this.scrollHandler.bind(this);
      this.resetAnimation = this.resetAnimation.bind(this);
      this.start = this.start.bind(this);

      this.config = new Util().extend(options, this.defaults);
      this.animationNameCache = new WeakMap();
      this.wowEvent = this.config.boxClass + '-visible';
      this.util = new Util();
    }

    WOW.prototype.defaults = {
      boxClass: 'wow',
      animateClass: 'animated',
      offset: 0,
      mobile: true,
      live: true,
      callback: null,
      scrollContainer: null,
      resetAnimation: true
    };

    WOW.prototype.init = function () {
      this.element = window.document.documentElement;
      if (['interactive', 'complete'].indexOf(document.readyState) > -1) {
        this.start();
      } else {
        document.addEventListener('DOMContentLoaded', this.start);
      }
      this.finished = [];
    };

    WOW.prototype.start = function () {
      var box, j, len, ref;
      this.stopped = false;
      this.boxes = function () {
        var ref, results;
        ref = this.element.querySelectorAll("." + this.config.boxClass);
        results = [];
        for (var i = 0; i < ref.length; i++) {
          results.push(ref[i]);
        }
        return results;
      }.call(this);

      this.all = function () {
        var results = [];
        for (var i = 0; i < this.boxes.length; i++) {
          results.push(this.boxes[i]);
        }
        return results;
      }.call(this);

      if (this.boxes.length) {
        if (this.disabled()) return;
        for (j = 0, len = this.boxes.length; j < len; j++) {
          box = this.boxes[j];
          this.applyStyle(box, true);
        }
      }

      if (!this.disabled()) {
        this.scrollContainer = this.config.scrollContainer || window;
        this.scrollContainer.addEventListener('scroll', this.scrollHandler);
        this.scrollContainer.addEventListener('resize', this.scrollHandler);
        this.interval = setInterval(this.scrollCallback, 50);
      }

      if (this.config.live) {
        return new MutationObserver((function (_this) {
          return function (records) {
            var addedNode, j, len, node, record, results;
            results = [];
            for (j = 0, len = records.length; j < len; j++) {
              record = records[j];
              addedNode = record.addedNodes || [];
              for (var k = 0; k < addedNode.length; k++) {
                node = addedNode[k];
                results.push(_this.doSync(node));
              }
            }
            return results;
          };
        })(this)).observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    };

    WOW.prototype.stop = function () {
      this.stopped = true;
      if (this.scrollContainer) {
        this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
        this.scrollContainer.removeEventListener('resize', this.scrollHandler);
      }
      if (this.interval != null) clearInterval(this.interval);
    };

    WOW.prototype.sync = function (element) {
      if (MutationObserver.notSupported) return this.doSync(this.element);
    };

    WOW.prototype.doSync = function (element) {
      var box, j, len, ref, results;
      if (element == null) element = this.element;
      if (element.nodeType !== 1) return;
      element = element.parentNode || element;
      ref = element.querySelectorAll("." + this.config.boxClass);
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        box = ref[j];
        if (indexOf.call(this.all, box) < 0) {
          this.boxes.push(box);
          this.all.push(box);
          if (this.stopped || this.disabled()) continue;
          this.applyStyle(box, true);
          results.push(this.scrolled = true);
        }
      }
      return results;
    };

    WOW.prototype.show = function (box) {
      this.applyStyle(box);
      box.className = box.className + " " + this.config.animateClass;
      if (this.config.callback != null) {
        this.config.callback(box);
      }
      if (this.config.resetAnimation) {
        box.addEventListener('animationend', this.resetAnimation);
      }
    };

    WOW.prototype.applyStyle = function (box, hidden) {
      var delay, duration, iteration;
      duration = box.getAttribute('data-wow-duration');
      delay = box.getAttribute('data-wow-delay');
      iteration = box.getAttribute('data-wow-iteration');

      return this.animate((function (_this) {
        return function () {
          return _this.customStyle(box, hidden, duration, delay, iteration);
        };
      })(this));
    };

    WOW.prototype.animate = (function () {
      return 'requestAnimationFrame' in window ?
        function (callback) {
          return window.requestAnimationFrame(callback);
        } :
        function (callback) {
          return callback();
        };
    })();

    WOW.prototype.resetAnimation = function (event) {
      var target;
      if (event.type.toLowerCase().indexOf('animationend') >= 0) {
        target = event.target || event.srcElement;
        return target.className = target.className.replace(this.config.animateClass, '').trim();
      }
    };

    WOW.prototype.customStyle = function (box, hidden, duration, delay, iteration) {
      if (hidden) this.cacheAnimationName(box);
      box.style.visibility = hidden ? 'hidden' : 'visible';
      if (duration) this.vendorSet(box.style, { animationDuration: duration });
      if (delay) this.vendorSet(box.style, { animationDelay: delay });
      if (iteration) this.vendorSet(box.style, { animationIterationCount: iteration });
      this.vendorSet(box.style, { animationName: hidden ? 'none' : this.cachedAnimationName(box) });
      return box;
    };

    WOW.prototype.vendors = ['moz', 'webkit'];

    WOW.prototype.vendorSet = function (elem, properties) {
      for (var name in properties) {
        var value = properties[name];
        elem[name] = value;
        for (var i = 0; i < this.vendors.length; i++) {
          var vendor = this.vendors[i];
          elem[vendor + name.charAt(0).toUpperCase() + name.substr(1)] = value;
        }
      }
    };

    WOW.prototype.vendorCSS = function (elem, name) {
      var style = getComputedStyle(elem);
      var result = style.getPropertyValue(name);
      for (var i = 0; i < this.vendors.length; i++) {
        var vendor = this.vendors[i];
        result = result || style.getPropertyValue("-" + vendor + "-" + name);
      }
      return result;
    };

    WOW.prototype.animationName = function (box) {
      try {
        return this.vendorCSS(box, 'animation-name');
      } catch (_error) {
        return getComputedStyle(box).getPropertyValue('animation-name');
      }
    };

    WOW.prototype.cacheAnimationName = function (box) {
      return this.animationNameCache.set(box, this.animationName(box));
    };

    WOW.prototype.cachedAnimationName = function (box) {
      return this.animationNameCache.get(box);
    };

    WOW.prototype.scrollHandler = function () {
      return this.scrolled = true;
    };

    WOW.prototype.scrollCallback = function () {
      if (!this.scrolled) return;
      this.scrolled = false;
      var box;
      for (var i = 0; i < this.boxes.length; i++) {
        box = this.boxes[i];
        if (box && this.isVisible(box)) {
          this.show(box);
          this.boxes[i] = null;
        }
      }
      this.boxes = this.boxes.filter(function (box) { return box !== null; });
      if (!this.boxes.length && !this.config.live) this.stop();
    };

    WOW.prototype.offsetTop = function (element) {
      var top = 0;
      while (element) {
        top += element.offsetTop;
        element = element.offsetParent;
      }
      return top;
    };

    WOW.prototype.isVisible = function (box) {
      var offset = box.getAttribute('data-wow-offset') || this.config.offset;
      var viewTop = this.scrollContainer.pageYOffset || this.scrollContainer.scrollTop || 0;
      var viewBottom = viewTop + Math.min(this.element.clientHeight, window.innerHeight) - offset;
      var top = this.offsetTop(box);
      var bottom = top + box.clientHeight;

      return viewBottom >= top && bottom >= viewTop;
    };

    WOW.prototype.util = function () {
      return this.util;
    };

    WOW.prototype.disabled = function () {
      return !this.config.mobile && this.util.isMobile(navigator.userAgent);
    };

    return WOW;
  })();
}).call(this);

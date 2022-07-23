/**
* vue3-virtual-scroll-list v0.2.0
* open source under the MIT license
* https://github.com/reactjser/vue3-virtual-scroll-list#readme
*/
import { computed, onMounted, onUpdated, onUnmounted, defineComponent, ref, createVNode, getCurrentInstance, nextTick, customRef, watch, onBeforeMount, onActivated } from 'vue';

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }

  return target;
}

function _typeof(obj) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

/**
 * virtual list core calculating center
 */
var DIRECTION_TYPE = {
  FRONT: 'FRONT',
  // scroll up or left
  BEHIND: 'BEHIND' // scroll down or right

};
var CALC_TYPE = {
  INIT: 'INIT',
  FIXED: 'FIXED',
  DYNAMIC: 'DYNAMIC'
};
var LEADING_BUFFER = 2;

var Virtual = /*#__PURE__*/function () {
  function Virtual(param, callUpdate) {
    _classCallCheck(this, Virtual);

    this.init(param, callUpdate);
  }

  _createClass(Virtual, [{
    key: "init",
    value: function init(param, callUpdate) {
      // param data
      this.param = param;
      this.callUpdate = callUpdate; // size data

      this.sizes = new Map();
      this.firstRangeTotalSize = 0;
      this.firstRangeAverageSize = 0;
      this.lastCalcIndex = 0;
      this.fixedSizeValue = 0;
      this.calcType = CALC_TYPE.INIT; // scroll data

      this.offset = 0;
      this.direction = ''; // range data

      this.range = Object.create(null);

      if (param) {
        this.checkRange(0, param.keeps - 1);
      } // benchmark test data
      // this.__bsearchCalls = 0
      // this.__getIndexOffsetCalls = 0

    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.init(null, null);
    } // return current render range

  }, {
    key: "getRange",
    value: function getRange() {
      var range = Object.create(null);
      range.start = this.range.start;
      range.end = this.range.end;
      range.padFront = this.range.padFront;
      range.padBehind = this.range.padBehind;
      return range;
    }
  }, {
    key: "isBehind",
    value: function isBehind() {
      return this.direction === DIRECTION_TYPE.BEHIND;
    }
  }, {
    key: "isFront",
    value: function isFront() {
      return this.direction === DIRECTION_TYPE.FRONT;
    } // return start index offset

  }, {
    key: "getOffset",
    value: function getOffset(start) {
      return (start < 1 ? 0 : this.getIndexOffset(start)) + this.param.slotHeaderSize;
    }
  }, {
    key: "updateParam",
    value: function updateParam(key, value) {
      var _this = this;

      if (this.param && key in this.param) {
        // if uniqueIds change, find out deleted id and remove from size map
        if (key === 'uniqueIds') {
          this.sizes.forEach(function (v, key) {
            if (!value.includes(key)) {
              _this.sizes["delete"](key);
            }
          });
        }

        this.param[key] = value;
      }
    } // save each size map by id

  }, {
    key: "saveSize",
    value: function saveSize(id, size) {
      this.sizes.set(id, size); // we assume size type is fixed at the beginning and remember first size value
      // if there is no size value different from this at next comming saving
      // we think it's a fixed size list, otherwise is dynamic size list

      if (this.calcType === CALC_TYPE.INIT) {
        this.fixedSizeValue = size;
        this.calcType = CALC_TYPE.FIXED;
      } else if (this.calcType === CALC_TYPE.FIXED && this.fixedSizeValue !== size) {
        this.calcType = CALC_TYPE.DYNAMIC; // it's no use at all

        delete this.fixedSizeValue;
      } // calculate the average size only in the first range


      if (this.calcType !== CALC_TYPE.FIXED && typeof this.firstRangeTotalSize !== 'undefined') {
        if (this.sizes.size < Math.min(this.param.keeps, this.param.uniqueIds.length)) {
          this.firstRangeTotalSize = _toConsumableArray(this.sizes.values()).reduce(function (acc, val) {
            return acc + val;
          }, 0);
          this.firstRangeAverageSize = Math.round(this.firstRangeTotalSize / this.sizes.size);
        } else {
          // it's done using
          delete this.firstRangeTotalSize;
        }
      }
    } // in some special situation (e.g. length change) we need to update in a row
    // try goiong to render next range by a leading buffer according to current direction

  }, {
    key: "handleDataSourcesChange",
    value: function handleDataSourcesChange() {
      var start = this.range.start;

      if (this.isFront()) {
        start = start - LEADING_BUFFER;
      } else if (this.isBehind()) {
        start = start + LEADING_BUFFER;
      }

      start = Math.max(start, 0);
      this.updateRange(this.range.start, this.getEndByStart(start));
    } // when slot size change, we also need force update

  }, {
    key: "handleSlotSizeChange",
    value: function handleSlotSizeChange() {
      this.handleDataSourcesChange();
    } // calculating range on scroll

  }, {
    key: "handleScroll",
    value: function handleScroll(offset) {
      this.direction = offset < this.offset ? DIRECTION_TYPE.FRONT : DIRECTION_TYPE.BEHIND;
      this.offset = offset;

      if (!this.param) {
        return;
      }

      if (this.direction === DIRECTION_TYPE.FRONT) {
        this.handleFront();
      } else if (this.direction === DIRECTION_TYPE.BEHIND) {
        this.handleBehind();
      }
    } // ----------- public method end -----------

  }, {
    key: "handleFront",
    value: function handleFront() {
      var overs = this.getScrollOvers(); // should not change range if start doesn't exceed overs

      if (overs > this.range.start) {
        return;
      } // move up start by a buffer length, and make sure its safety


      var start = Math.max(overs - this.param.buffer, 0);
      this.checkRange(start, this.getEndByStart(start));
    }
  }, {
    key: "handleBehind",
    value: function handleBehind() {
      var overs = this.getScrollOvers(); // range should not change if scroll overs within buffer

      if (overs < this.range.start + this.param.buffer) {
        return;
      }

      this.checkRange(overs, this.getEndByStart(overs));
    } // return the pass overs according to current scroll offset

  }, {
    key: "getScrollOvers",
    value: function getScrollOvers() {
      // if slot header exist, we need subtract its size
      var offset = this.offset - this.param.slotHeaderSize;

      if (offset <= 0) {
        return 0;
      } // if is fixed type, that can be easily


      if (this.isFixedType()) {
        return Math.floor(offset / this.fixedSizeValue);
      }

      var low = 0;
      var middle = 0;
      var middleOffset = 0;
      var high = this.param.uniqueIds.length;

      while (low <= high) {
        // this.__bsearchCalls++
        middle = low + Math.floor((high - low) / 2);
        middleOffset = this.getIndexOffset(middle);

        if (middleOffset === offset) {
          return middle;
        } else if (middleOffset < offset) {
          low = middle + 1;
        } else if (middleOffset > offset) {
          high = middle - 1;
        }
      }

      return low > 0 ? --low : 0;
    } // return a scroll offset from given index, can efficiency be improved more here?
    // although the call frequency is very high, its only a superposition of numbers

  }, {
    key: "getIndexOffset",
    value: function getIndexOffset(givenIndex) {
      if (!givenIndex) {
        return 0;
      }

      var offset = 0;
      var indexSize = 0;

      for (var index = 0; index < givenIndex; index++) {
        // this.__getIndexOffsetCalls++
        indexSize = this.sizes.get(this.param.uniqueIds[index]);
        offset = offset + (typeof indexSize === 'number' ? indexSize : this.getEstimateSize());
      } // remember last calculate index


      this.lastCalcIndex = Math.max(this.lastCalcIndex, givenIndex - 1);
      this.lastCalcIndex = Math.min(this.lastCalcIndex, this.getLastIndex());
      return offset;
    } // is fixed size type

  }, {
    key: "isFixedType",
    value: function isFixedType() {
      return this.calcType === CALC_TYPE.FIXED;
    } // return the real last index

  }, {
    key: "getLastIndex",
    value: function getLastIndex() {
      return this.param.uniqueIds.length - 1;
    } // in some conditions range is broke, we need correct it
    // and then decide whether need update to next range

  }, {
    key: "checkRange",
    value: function checkRange(start, end) {
      var keeps = this.param.keeps;
      var total = this.param.uniqueIds.length; // datas less than keeps, render all

      if (total <= keeps) {
        start = 0;
        end = this.getLastIndex();
      } else if (end - start < keeps - 1) {
        // if range length is less than keeps, corrent it base on end
        start = end - keeps + 1;
      }

      if (this.range.start !== start) {
        this.updateRange(start, end);
      }
    } // setting to a new range and rerender

  }, {
    key: "updateRange",
    value: function updateRange(start, end) {
      this.range.start = start;
      this.range.end = end;
      this.range.padFront = this.getPadFront();
      this.range.padBehind = this.getPadBehind();
      this.callUpdate(this.getRange());
    } // return end base on start

  }, {
    key: "getEndByStart",
    value: function getEndByStart(start) {
      var theoryEnd = start + this.param.keeps - 1;
      var truelyEnd = Math.min(theoryEnd, this.getLastIndex());
      return truelyEnd;
    } // return total front offset

  }, {
    key: "getPadFront",
    value: function getPadFront() {
      if (this.isFixedType()) {
        return this.fixedSizeValue * this.range.start;
      } else {
        return this.getIndexOffset(this.range.start);
      }
    } // return total behind offset

  }, {
    key: "getPadBehind",
    value: function getPadBehind() {
      var end = this.range.end;
      var lastIndex = this.getLastIndex();

      if (this.isFixedType()) {
        return (lastIndex - end) * this.fixedSizeValue;
      } // if it's all calculated, return the exactly offset


      if (this.lastCalcIndex === lastIndex) {
        return this.getIndexOffset(lastIndex) - this.getIndexOffset(end);
      } else {
        // if not, use a estimated value
        return (lastIndex - end) * this.getEstimateSize();
      }
    } // get the item estimate size

  }, {
    key: "getEstimateSize",
    value: function getEstimateSize() {
      return this.isFixedType() ? this.fixedSizeValue : this.firstRangeAverageSize || this.param.estimateSize;
    }
  }]);

  return Virtual;
}();

/**
 * props declaration for default, item and slot component
 */
var VirtualProps = {
  dataKey: {
    type: [String, Function],
    required: true
  },
  dataSources: {
    type: Array,
    required: true,
    "default": function _default() {
      return [];
    }
  },
  dataComponent: {
    type: [Object, Function],
    required: true
  },
  keeps: {
    type: Number,
    "default": 30
  },
  extraProps: {
    type: Object
  },
  estimateSize: {
    type: Number,
    "default": 50
  },
  direction: {
    type: String,
    "default": 'vertical' // the other value is horizontal

  },
  start: {
    type: Number,
    "default": 0
  },
  offset: {
    type: Number,
    "default": 0
  },
  topThreshold: {
    type: Number,
    "default": 0
  },
  bottomThreshold: {
    type: Number,
    "default": 0
  },
  pageMode: {
    type: Boolean,
    "default": false
  },
  rootTag: {
    type: String,
    "default": 'div'
  },
  wrapTag: {
    type: String,
    "default": 'div'
  },
  wrapClass: {
    type: String,
    "default": 'wrap'
  },
  wrapStyle: {
    type: Object
  },
  itemTag: {
    type: String,
    "default": 'div'
  },
  itemClass: {
    type: String,
    "default": ''
  },
  itemClassAdd: {
    type: Function
  },
  itemStyle: {
    type: Object
  },
  headerTag: {
    type: String,
    "default": 'div'
  },
  headerClass: {
    type: String,
    "default": ''
  },
  headerStyle: {
    type: Object
  },
  footerTag: {
    type: String,
    "default": 'div'
  },
  footerClass: {
    type: String,
    "default": ''
  },
  footerStyle: {
    type: Object
  },
  itemScopedSlots: {
    type: Object
  }
};
var ItemProps = {
  index: {
    type: Number
  },
  event: {
    type: String
  },
  tag: {
    type: String
  },
  horizontal: {
    type: Boolean
  },
  source: {
    type: Object
  },
  component: {
    type: [Object, Function]
  },
  uniqueKey: {
    type: [String, Number]
  },
  extraProps: {
    type: Object
  },
  scopedSlots: {
    type: Object
  }
};
var SlotProps = {
  event: {
    type: String
  },
  uniqueKey: {
    type: String
  },
  tag: {
    type: String
  },
  horizontal: {
    type: Boolean
  }
};

var useResizeChange = (function (props, rootRef, emit) {
  var resizeObserver = null;
  var shapeKey = computed(function () {
    return props.horizontal ? 'offsetWidth' : 'offsetHeight';
  });

  var getCurrentSize = function getCurrentSize() {
    return rootRef.value ? rootRef.value[shapeKey.value] : 0;
  }; // tell parent current size identify by unqiue key


  var dispatchSizeChange = function dispatchSizeChange() {
    var event = props.event,
        uniqueKey = props.uniqueKey,
        hasInitial = props.hasInitial;
    emit(event, uniqueKey, getCurrentSize(), hasInitial);
  };

  onMounted(function () {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(function () {
        dispatchSizeChange();
      });
      rootRef.value && resizeObserver.observe(rootRef.value);
    }
  });
  onUpdated(function () {
    dispatchSizeChange();
  });
  onUnmounted(function () {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  });
});

var Slot = defineComponent({
  name: 'VirtualListSlot',
  props: SlotProps,
  emits: ['slotResize'],
  setup: function setup(props, _ref) {
    var slots = _ref.slots,
        emit = _ref.emit;
    var rootRef = ref(null);
    useResizeChange(props, rootRef, emit);
    return function () {
      var _slots$default;

      var Tag = props.tag,
          uniqueKey = props.uniqueKey;
      return createVNode(Tag, {
        "ref": rootRef,
        "key": uniqueKey
      }, {
        "default": function _default() {
          return [(_slots$default = slots["default"]) === null || _slots$default === void 0 ? void 0 : _slots$default.call(slots)];
        }
      });
    };
  }
});

var Item = defineComponent({
  name: 'VirtualListItem',
  props: ItemProps,
  emits: ['itemResize'],
  setup: function setup(props, _ref) {
    var emit = _ref.emit;
    var rootRef = ref(null);
    useResizeChange(props, rootRef, emit);
    return function () {
      var Tag = props.tag,
          Comp = props.component,
          _props$extraProps = props.extraProps,
          extraProps = _props$extraProps === void 0 ? {} : _props$extraProps,
          index = props.index,
          source = props.source,
          _props$scopedSlots = props.scopedSlots,
          scopedSlots = _props$scopedSlots === void 0 ? {} : _props$scopedSlots,
          uniqueKey = props.uniqueKey;

      var mergedProps = _objectSpread2(_objectSpread2({}, extraProps), {}, {
        source: source,
        index: index
      });

      return createVNode(Tag, {
        "key": uniqueKey,
        "ref": rootRef
      }, {
        "default": function _default() {
          return [createVNode(Comp, _objectSpread2(_objectSpread2({}, mergedProps), {}, {
            "scopedSlots": scopedSlots
          }), null)];
        }
      });
    };
  }
});

var _a;
const isClient = typeof window !== "undefined";
isClient && ((_a = window == null ? void 0 : window.navigator) == null ? void 0 : _a.userAgent) && /iP(ad|hone|od)/.test(window.navigator.userAgent);

function tryOnMounted(fn, sync = true) {
  if (getCurrentInstance())
    onMounted(fn);
  else if (sync)
    fn();
  else
    nextTick(fn);
}

isClient ? window : void 0;
isClient ? window.document : void 0;
isClient ? window.navigator : void 0;
isClient ? window.location : void 0;

function templateRef(key, initialValue = null) {
  const instance = getCurrentInstance();
  let _trigger = () => {
  };
  const element = customRef((track, trigger) => {
    _trigger = trigger;
    return {
      get() {
        var _a, _b;
        track();
        return (_b = (_a = instance == null ? void 0 : instance.proxy) == null ? void 0 : _a.$refs[key]) != null ? _b : initialValue;
      },
      set() {
      }
    };
  });
  tryOnMounted(_trigger);
  onUpdated(_trigger);
  return element;
}

const _global = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey = "__vueuse_ssr_handlers__";
_global[globalKey] = _global[globalKey] || {};
_global[globalKey];

var SwipeDirection;
(function(SwipeDirection2) {
  SwipeDirection2["UP"] = "UP";
  SwipeDirection2["RIGHT"] = "RIGHT";
  SwipeDirection2["DOWN"] = "DOWN";
  SwipeDirection2["LEFT"] = "LEFT";
  SwipeDirection2["NONE"] = "NONE";
})(SwipeDirection || (SwipeDirection = {}));

function userAgent(pattern) {
  if (typeof window !== 'undefined' && window.navigator) {
    return !! /*@__PURE__*/navigator.userAgent.match(pattern);
  }
}

var IE11OrLess = userAgent(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i);
var Edge = userAgent(/Edge/i);
var Safari = userAgent(/safari/i) && !userAgent(/chrome/i) && !userAgent(/android/i);
var IOS = userAgent(/iP(ad|od|hone)/i);
var ChromeForAndroid = userAgent(/chrome/i) && userAgent(/android/i);

var captureMode = {
  capture: false,
  passive: false
};
var R_SPACE = /\s+/g;
var CSSTRANSITIONS = ['-webkit-transition', '-moz-transition', '-ms-transition', '-o-transition', 'transition'];
var CSSTRANSFORMS = ['-webkit-transform', '-moz-transform', '-ms-transform', '-o-transform', 'transform'];
var SUPPORTPASSIVE = supportPassive();
/**
 * set transition style
 * @param {HTMLElement} el 
 * @param {String | Function} transition 
 */

function setTransition(el, transition) {
  if (transition) {
    if (transition === 'none') CSSTRANSITIONS.forEach(function (ts) {
      return css(el, ts, 'none');
    });else CSSTRANSITIONS.forEach(function (ts) {
      return css(el, ts, "".concat(ts.split('transition')[0], "transform ").concat(transition));
    });
  } else CSSTRANSITIONS.forEach(function (ts) {
    return css(el, ts, '');
  });
}
/**
 * set transform style
 * @param {HTMLElement} el 
 * @param {String} transform 
 */

function setTransform(el, transform) {
  if (transform) CSSTRANSFORMS.forEach(function (tf) {
    return css(el, tf, "".concat(tf.split('transform')[0]).concat(transform));
  });else CSSTRANSFORMS.forEach(function (tf) {
    return css(el, tf, '');
  });
}
/**
 * get touch event and current event
 * @param {Event} evt 
 */

function getEvent(evt) {
  var touch = evt.touches && evt.touches[0] || evt.pointerType && evt.pointerType === 'touch' && evt;
  var e = touch || evt;
  var target = touch ? document.elementFromPoint(e.clientX, e.clientY) : e.target;
  return {
    touch: touch,
    e: e,
    target: target
  };
}
/**
 * detect passive event support
 */

function supportPassive() {
  // https://github.com/Modernizr/Modernizr/issues/1894
  var supportPassive = false;
  document.addEventListener('checkIfSupportPassive', null, {
    get passive() {
      supportPassive = true;
      return true;
    }

  });
  return supportPassive;
}
/**
* add specified event listener
* @param {HTMLElement} el 
* @param {String} event 
* @param {Function} fn 
* @param {Boolean} sp
*/

function on(el, event, fn) {
  if (window.addEventListener) {
    el.addEventListener(event, fn, SUPPORTPASSIVE || !IE11OrLess ? captureMode : false);
  } else if (window.attachEvent) {
    el.attachEvent('on' + event, fn);
  }
}
/**
* remove specified event listener
* @param {HTMLElement} el 
* @param {String} event 
* @param {Function} fn 
* @param {Boolean} sp
*/

function off(el, event, fn) {
  if (window.removeEventListener) {
    el.removeEventListener(event, fn, SUPPORTPASSIVE || !IE11OrLess ? captureMode : false);
  } else if (window.detachEvent) {
    el.detachEvent('on' + event, fn);
  }
}
/**
 * get element's offetTop
 * @param {HTMLElement} el 
 */

function getOffset(el) {
  var result = {
    top: 0,
    left: 0,
    height: 0,
    width: 0
  };
  result.height = el.offsetHeight;
  result.width = el.offsetWidth;
  result.top = el.offsetTop;
  result.left = el.offsetLeft;
  var parent = el.offsetParent;

  while (parent !== null) {
    result.top += parent.offsetTop;
    result.left += parent.offsetLeft;
    parent = parent.offsetParent;
  }

  return result;
}
/**
 * get scroll element
 * @param {HTMLElement} el 
 * @param {Boolean} includeSelf whether to include the passed element
 * @returns {HTMLElement} scroll element
 */

function getParentAutoScrollElement(el, includeSelf) {
  // skip to window
  if (!el || !el.getBoundingClientRect) return getWindowScrollingElement();
  var elem = el;
  var gotSelf = false;

  do {
    // we don't need to get elem css if it isn't even overflowing in the first place (performance)
    if (elem.clientWidth < elem.scrollWidth || elem.clientHeight < elem.scrollHeight) {
      var elemCSS = css(elem);

      if (elem.clientWidth < elem.scrollWidth && (elemCSS.overflowX == 'auto' || elemCSS.overflowX == 'scroll') || elem.clientHeight < elem.scrollHeight && (elemCSS.overflowY == 'auto' || elemCSS.overflowY == 'scroll')) {
        if (!elem.getBoundingClientRect || elem === document.body) return getWindowScrollingElement();
        if (gotSelf || includeSelf) return elem;
        gotSelf = true;
      }
    }
  } while (elem = elem.parentNode);

  return getWindowScrollingElement();
}
function getWindowScrollingElement() {
  var scrollingElement = document.scrollingElement;

  if (scrollingElement) {
    return scrollingElement.contains(document.body) ? document : scrollingElement;
  } else {
    return document;
  }
}
/**
 * Returns the "bounding client rect" of given element
 * @param {HTMLElement} el  The element whose boundingClientRect is wanted
 */

function getRect(el) {
  if (!el.getBoundingClientRect && el !== window) return;
  var rect = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    height: 0,
    width: 0
  };
  var elRect;

  if (el !== window && el.parentNode && el !== getWindowScrollingElement()) {
    elRect = el.getBoundingClientRect();
    rect.top = elRect.top;
    rect.left = elRect.left;
    rect.bottom = elRect.bottom;
    rect.right = elRect.right;
    rect.height = elRect.height;
    rect.width = elRect.width;
  } else {
    rect.top = 0;
    rect.left = 0;
    rect.bottom = window.innerHeight;
    rect.right = window.innerWidth;
    rect.height = window.innerHeight;
    rect.width = window.innerWidth;
  }

  return rect;
}
/**
 * get target Element in group
 * @param {HTMLElement} group 
 * @param {HTMLElement} el 
 * @param {Boolean} onlyEl only get element
 */

function getElement(group, el, onlyEl) {
  var children = _toConsumableArray(Array.from(group.children)); // If it can be found directly in the child element, return


  var index = children.indexOf(el);
  if (index > -1) return onlyEl ? children[index] : {
    index: index,
    el: children[index],
    rect: getRect(children[index]),
    offset: getOffset(children[index])
  }; // When the dom cannot be found directly in children, need to look down

  for (var i = 0; i < children.length; i++) {
    if (isChildOf(el, children[i])) {
      return onlyEl ? children[i] : {
        index: i,
        el: children[i],
        rect: getRect(children[i]),
        offset: getOffset(children[i])
      };
    }
  }

  return onlyEl ? null : {
    index: -1,
    el: null,
    rect: {},
    offset: {}
  };
}
/**
 * Check if child element is contained in parent element
 * @param {HTMLElement} child 
 * @param {HTMLElement} parent 
 * @returns {Boolean} true | false
 */

function isChildOf(child, parent) {
  var parentNode;

  if (child && parent) {
    parentNode = child.parentNode;

    while (parentNode) {
      if (parent === parentNode) return true;
      parentNode = parentNode.parentNode;
    }
  }

  return false;
}
/**
 * add or remove element's class
 * @param {HTMLElement} el element
 * @param {String} name class name
 * @param {Boolean} state true: add, false: remove
 */

function toggleClass(el, name, state) {
  if (el && name) {
    if (el.classList) {
      el.classList[state ? 'add' : 'remove'](name);
    } else {
      var className = (' ' + el.className + ' ').replace(R_SPACE, ' ').replace(' ' + name + ' ', ' ');
      el.className = (className + (state ? ' ' + name : '')).replace(R_SPACE, ' ');
    }
  }
}
/**
 * Check if a DOM element matches a given selector
 * @param {HTMLElement} el 
 * @param {String} selector 
 * @returns 
 */

function matches(el, selector) {
  if (!selector) return;
  selector[0] === '>' && (selector = selector.substring(1));

  if (el) {
    try {
      if (el.matches) {
        return el.matches(selector);
      } else if (el.msMatchesSelector) {
        return el.msMatchesSelector(selector);
      } else if (el.webkitMatchesSelector) {
        return el.webkitMatchesSelector(selector);
      }
    } catch (error) {
      return false;
    }
  }

  return false;
}
function css(el, prop, val) {
  var style = el && el.style;

  if (style) {
    if (val === void 0) {
      if (document.defaultView && document.defaultView.getComputedStyle) {
        val = document.defaultView.getComputedStyle(el, '');
      } else if (el.currentStyle) {
        val = el.currentStyle;
      }

      return prop === void 0 ? val : val[prop];
    } else {
      if (!(prop in style) && prop.indexOf('webkit') === -1) {
        prop = '-webkit-' + prop;
      }

      style[prop] = val + (typeof val === 'string' ? '' : 'px');
    }
  }
}
function debounce(fn, delay, immediate) {
  var timer = null;
  return function () {
    var context = this,
        args = arguments;
    timer && clearTimeout(timer);
    immediate && !timer && fn.apply(context, args);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}
function throttle(fn, delay) {
  var timer = null;
  return function () {
    var context = this,
        args = arguments;

    if (!timer) {
      timer = setTimeout(function () {
        timer = null;
        fn.apply(context, args);
      }, delay);
    }
  };
}
function _nextTick(fn) {
  return setTimeout(fn, 0);
}

var State = /*#__PURE__*/_createClass(function State() {
  _classCallCheck(this, State);

  this.sortableDown = undefined;
  this.sortableMove = undefined;
  this.animationEnd = undefined;
});
/**
 * 拖拽前后差异初始化
 */

var Differ = /*#__PURE__*/function () {
  function Differ() {
    _classCallCheck(this, Differ);

    this.from = {
      node: null,
      rect: {},
      offset: {}
    };
    this.to = {
      node: null,
      rect: {},
      offset: {}
    };
  }

  _createClass(Differ, [{
    key: "get",
    value: function get(key) {
      return this[key];
    }
  }, {
    key: "set",
    value: function set(key, value) {
      this[key] = value;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.from = {
        node: null,
        rect: {},
        offset: {}
      };
      this.to = {
        node: null,
        rect: {},
        offset: {}
      };
    }
  }]);

  return Differ;
}();
/**
 * 拖拽中的元素
 */

var Ghost = /*#__PURE__*/function () {
  function Ghost(sortable) {
    _classCallCheck(this, Ghost);

    this.$el = null;
    this.distance = {
      x: 0,
      y: 0
    };
    this.options = sortable.options;
    this.container = sortable.container;
  }

  _createClass(Ghost, [{
    key: "init",
    value: function init(el, rect) {
      var append = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      this.$el = el;
      var _this$options = this.options,
          ghostClass = _this$options.ghostClass,
          _this$options$ghostSt = _this$options.ghostStyle,
          ghostStyle = _this$options$ghostSt === void 0 ? {} : _this$options$ghostSt;
      toggleClass(this.$el, ghostClass, true);
      css(this.$el, 'box-sizing', 'border-box');
      css(this.$el, 'margin', 0);
      css(this.$el, 'top', rect.top);
      css(this.$el, 'left', rect.left);
      css(this.$el, 'width', rect.width);
      css(this.$el, 'height', rect.height);
      css(this.$el, 'opacity', '0.8'); // css(this.$el, 'position', IOS ? 'absolute' : 'fixed')

      css(this.$el, 'position', 'fixed');
      css(this.$el, 'zIndex', '100000');
      css(this.$el, 'pointerEvents', 'none');
      this.setStyle(ghostStyle);
      setTransition(this.$el, 'none');
      setTransform(this.$el, 'translate3d(0px, 0px, 0px)');
      if (append) this.container.appendChild(this.$el);
      css(this.$el, 'transform-origin', this.distance.x / parseInt(this.$el.style.width) * 100 + '% ' + this.distance.y / parseInt(this.$el.style.height) * 100 + '%');
    }
  }, {
    key: "setStyle",
    value: function setStyle(style) {
      for (var key in style) {
        css(this.$el, key, style[key]);
      }
    }
  }, {
    key: "rect",
    value: function rect() {
      return getRect(this.$el);
    }
  }, {
    key: "move",
    value: function move(x, y) {
      var smooth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      if (!this.$el) return;
      setTransition(this.$el, smooth ? "".concat(this.options.ghostAnimation, "ms") : 'none');
      setTransform(this.$el, "translate3d(".concat(x, "px, ").concat(y, "px, 0)"));
    }
  }, {
    key: "destroy",
    value: function destroy(rect) {
      var _this = this;

      if (!this.$el) return;
      var left = parseInt(this.$el.style.left);
      var top = parseInt(this.$el.style.top);
      this.move(rect.left - left, rect.top - top, true);
      var ghostAnimation = this.options.ghostAnimation;
      ghostAnimation ? setTimeout(function () {
        return _this.clear();
      }, ghostAnimation) : this.clear();
    }
  }, {
    key: "clear",
    value: function clear() {
      this.$el && this.$el.remove();
      this.distance = {
        x: 0,
        y: 0
      };
      this.$el = null;
    }
  }]);

  return Ghost;
}();

function AutoScroll() {
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      return setTimeout(callback, 17);
    };
  }

  return {
    _autoScroll: throttle(function (_this) {
      // check if is moving now
      if (!(_this.state.sortableDown && _this.state.sortableMove)) return;
      var _this$state$sortableM = _this.state.sortableMove,
          clientX = _this$state$sortableM.clientX,
          clientY = _this$state$sortableM.clientY;
      if (clientX === void 0 || clientY === void 0) return;

      if (_this.scrollEl === _this.ownerDocument) ; else {
        var _this$scrollEl = _this.scrollEl,
            scrollTop = _this$scrollEl.scrollTop,
            scrollLeft = _this$scrollEl.scrollLeft,
            scrollHeight = _this$scrollEl.scrollHeight,
            scrollWidth = _this$scrollEl.scrollWidth;

        var _getRect = getRect(_this.scrollEl),
            top = _getRect.top,
            right = _getRect.right,
            bottom = _getRect.bottom,
            left = _getRect.left,
            height = _getRect.height,
            width = _getRect.width;

        var _this$options = _this.options,
            scrollStep = _this$options.scrollStep,
            scrollThreshold = _this$options.scrollThreshold; // check direction

        var totop = scrollTop > 0 && clientY >= top && clientY <= top + scrollThreshold;
        var toleft = scrollLeft > 0 && clientX >= left && clientX <= left + scrollThreshold;
        var toright = scrollLeft + width < scrollWidth && clientX <= right && clientX >= right - scrollThreshold;
        var tobottom = scrollTop + height < scrollHeight && clientY <= bottom && clientY >= bottom - scrollThreshold; // scroll position

        var position = {
          x: scrollLeft,
          y: scrollTop
        };

        if (totop) {
          if (toleft) {
            // to top-left
            position.x = scrollLeft - scrollStep;
          } else if (toright) {
            // to top-right
            position.x = scrollLeft + scrollStep;
          } else {
            // to top
            position.x = scrollLeft;
          }

          position.y = scrollTop - scrollStep;
        } else if (tobottom) {
          if (toleft) {
            // to bottom-left
            position.x = scrollLeft - scrollStep;
          } else if (toright) {
            // to bottom-right
            position.x = scrollLeft + scrollStep;
          } else {
            // to bottom
            position.x = scrollLeft;
          }

          position.y = scrollTop + scrollStep;
        } else if (toleft) {
          // to left
          position.x = scrollLeft - scrollStep;
          position.y = scrollTop;
        } else if (toright) {
          // to right
          position.x = scrollLeft + scrollStep;
          position.y = scrollTop;
        } // if need to scroll


        if (totop || toleft || toright || tobottom) {
          requestAnimationFrame(function () {
            _this.scrollEl.scrollTo(position.x, position.y);

            _this._autoScroll(_this);
          });
        }
      }
    }, 10)
  };
}

function Animation() {
  var animationState = [];

  function getRange(children, drag, drop) {
    var start = children.indexOf(drag);
    var end = children.indexOf(drop);
    return start < end ? {
      start: start,
      end: end
    } : {
      start: end,
      end: start
    };
  }

  return {
    captureAnimationState: function captureAnimationState() {
      var children = _toConsumableArray(Array.from(this.rootEl.children));

      var _getRange = getRange(children, this.dragEl, this.dropEl),
          start = _getRange.start,
          end = _getRange.end;

      animationState.length = 0; // reset

      children.slice(start, end + 1).forEach(function (child) {
        animationState.push({
          target: child,
          rect: getRect(child)
        });
      });
    },
    animateRange: function animateRange() {
      var _this = this;

      animationState.forEach(function (state) {
        var target = state.target,
            rect = state.rect;

        _this.animate(target, rect, _this.options.animation);
      });
    },
    animate: function animate(el, preRect) {
      var animation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 150;
      var curRect = getRect(el);
      var left = preRect.left - curRect.left;
      var top = preRect.top - curRect.top;
      setTransition(el, 'none');
      setTransform(el, "translate3d(".concat(left, "px, ").concat(top, "px, 0)"));
      el.offsetLeft; // trigger repaint

      setTransition(el, "".concat(animation, "ms"));
      setTransform(el, 'translate3d(0px, 0px, 0px)');
      clearTimeout(el.animated);
      el.animated = setTimeout(function () {
        setTransition(el, '');
        setTransform(el, '');
        el.animated = null;
      }, animation);
    }
  };
}

function DNDEvent() {
  return {
    _bindEventListener: function _bindEventListener() {
      this._onDrag = this._onDrag.bind(this);
      this._onMove = this._onMove.bind(this);
      this._onDrop = this._onDrop.bind(this);
      var _this$options = this.options,
          supportPointer = _this$options.supportPointer,
          supportTouch = _this$options.supportTouch;

      if (supportPointer) {
        on(this.rootEl, 'pointerdown', this._onDrag);
      } else if (supportTouch) {
        on(this.rootEl, 'touchstart', this._onDrag);
      } else {
        on(this.rootEl, 'mousedown', this._onDrag);
      }
    },
    _clearEvent: function _clearEvent() {
      off(this.rootEl, 'pointerdown', this._onDrag);
      off(this.rootEl, 'touchstart', this._onDrag);
      off(this.rootEl, 'mousedown', this._onDrag);
    },
    _bindMoveEvents: function _bindMoveEvents(touch) {
      if (this.options.supportPointer) {
        on(this.ownerDocument, 'pointermove', this._onMove);
      } else if (touch) {
        on(this.ownerDocument, 'touchmove', this._onMove);
      } else {
        on(this.ownerDocument, 'mousemove', this._onMove);
      }
    },
    _unbindMoveEvents: function _unbindMoveEvents() {
      off(this.ownerDocument, 'pointermove', this._onMove);
      off(this.ownerDocument, 'touchmove', this._onMove);
      off(this.ownerDocument, 'mousemove', this._onMove);
    },
    _unbindDropEvents: function _unbindDropEvents() {
      off(this.ownerDocument, 'pointerup', this._onDrop);
      off(this.ownerDocument, 'pointercancel', this._onDrop);
      off(this.ownerDocument, 'touchend', this._onDrop);
      off(this.ownerDocument, 'touchcancel', this._onDrop);
      off(this.ownerDocument, 'mouseup', this._onDrop);
    },
    _unbindDragEvents: function _unbindDragEvents() {
      if (this.nativeDraggable) {
        off(this.rootEl, 'dragstart', this._onDragStart);
        off(this.rootEl, 'dragover', this._onDragOver);
        off(this.rootEl, 'dragend', this._onDrop);
      }
    }
  };
}

var documentExists = typeof document !== 'undefined';
var supportDraggable = documentExists && !ChromeForAndroid && !IOS && 'draggable' in document.createElement('div');
/**
 * @class  Sortable
 * @param  {HTMLElement}  el group element
 * @param  {Object}       options
 */

function Sortable(el, options) {
  if (!(el && el.nodeType && el.nodeType === 1)) {
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(el));
  }

  this.rootEl = el; // root element

  this.scrollEl = getParentAutoScrollElement(el, true); // scroll element

  this.options = options = Object.assign({}, options);
  this.ownerDocument = el.ownerDocument;
  var defaults = {
    autoScroll: true,
    // Auto scrolling when dragging to the edge of the container
    scrollStep: 5,
    // The distance to scroll each frame
    scrollThreshold: 15,
    // Autoscroll threshold
    delay: 0,
    // Defines the delay time after which the mouse-selected list cell can start dragging
    delayOnTouchOnly: false,
    // only delay if user is using touch
    disabled: false,
    // Defines whether the sortable object is available or not. When it is true, the sortable object cannot drag and drop sorting and other functions. When it is false, it can be sorted, which is equivalent to a switch.
    animation: 150,
    // Define the timing of the sorting animation
    ghostAnimation: 0,
    // Animation when the ghost element is destroyed
    ghostClass: '',
    // Ghost element class name
    ghostStyle: {},
    // Ghost element style
    chosenClass: '',
    // Chosen element style
    draggable: undefined,
    // String: css selector, Function: (e) => return true
    dragging: undefined,
    // Set the drag element, must be a function and must return an HTMLElement: (e) => return e.target
    onDrag: undefined,
    // The callback function triggered when dragging starts: () => {}
    onMove: undefined,
    // The callback function during drag and drop: (from, to) => {}
    onDrop: undefined,
    // The callback function when the drag is completed: (from, to, changed) => {}
    onChange: undefined,
    // The callback function when dragging an element to change its position: (from, to) => {}
    fallbackOnBody: false,
    forceFallback: false,
    // Ignore HTML5 drag and drop behavior, force callback to proceed
    stopPropagation: false,
    // Prevents further propagation of the current event in the capture and bubbling phases
    supportPointer: 'PointerEvent' in window && !Safari,
    supportTouch: 'ontouchstart' in window
  }; // Set default options

  for (var name in defaults) {
    !(name in this.options) && (this.options[name] = defaults[name]);
  }

  this.container = this.options.fallbackOnBody ? document.body : this.rootEl;
  this.nativeDraggable = this.options.forceFallback ? false : supportDraggable;
  this.move = {
    x: 0,
    y: 0
  };
  this.state = new State(); // Status record during drag and drop

  this.differ = new Differ(); // Record the difference before and after dragging

  this.ghost = new Ghost(this); // Mask element while dragging

  this.dragEl = null; // Drag element

  this.dropEl = null; // Drop element

  this.dragStartTimer = null; // setTimeout timer

  this.autoScrollTimer = null;
  Object.assign(this, DNDEvent(), Animation(), AutoScroll());

  this._bindEventListener();
}

Sortable.prototype = {
  constructor: Sortable,

  /**
   * Destroy
   */
  destroy: function destroy() {
    this._clearState();

    this._clearEvent(); // Remove draggable attributes


    Array.prototype.forEach.call(this.rootEl.querySelectorAll('[draggable]'), function (el) {
      el.removeAttribute('draggable');
    });
  },

  /**
   * set value for options by key
   */
  set: function set(key, value) {
    this.options[key] = value;
  },

  /**
   * get value from options by key
   */
  get: function get(key) {
    return this.options[key];
  },
  // -------------------------------- prepare start ----------------------------------
  _onDrag: function _onDrag(
  /** Event|TouchEvent */
  evt) {
    var _this2 = this;

    if (/mousedown|pointerdown/.test(evt.type) && evt.button !== 0 || this.options.disabled) return; // only left button and enabled

    var _getEvent = getEvent(evt),
        touch = _getEvent.touch,
        e = _getEvent.e,
        target = _getEvent.target; // Safari ignores further event handling after mousedown


    if (!this.nativeDraggable && Safari && target && target.tagName.toUpperCase() === 'SELECT') return;
    if (target === this.rootEl) return true;
    if (this.options.stopPropagation) evt.stopPropagation();
    var _this$options = this.options,
        draggable = _this$options.draggable,
        dragging = _this$options.dragging;

    if (typeof draggable === 'function') {
      if (!draggable(e)) return true;
    } else if (typeof draggable === 'string') {
      if (!matches(target, draggable)) return true;
    } else if (draggable !== undefined) {
      throw new Error("draggable expected \"function\" or \"string\" but received \"".concat(_typeof(draggable), "\""));
    } // Get the dragged element               


    if (dragging) {
      if (typeof dragging === 'function') this.dragEl = dragging(e);else throw new Error("dragging expected \"function\" or \"string\" but received \"".concat(_typeof(dragging), "\""));
    } else {
      this.dragEl = getElement(this.rootEl, target, true);
    } // No dragging is allowed when there is no dragging element


    if (!this.dragEl || this.dragEl.animated) return true; // solve the problem that the mobile cannot be dragged

    if (touch) this.dragEl.style['touch-action'] = 'none'; // get the position of the dragged element in the list

    var _getElement = getElement(this.rootEl, this.dragEl),
        rect = _getElement.rect,
        offset = _getElement.offset;

    this.move = {
      x: e.clientX,
      y: e.clientY
    };
    this.differ.from = {
      node: this.dragEl,
      rect: rect,
      offset: offset
    };
    this.ghost.distance = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    this.state.sortableDown = e; // sortable state down is active
    // Solve the problem that `dragend` does not take effect when the `dragover` event is not triggered

    on(this.ownerDocument, 'pointerup', this._onDrop);
    on(this.ownerDocument, 'touchend', this._onDrop);
    on(this.ownerDocument, 'mouseup', this._onDrop);
    var _this$options2 = this.options,
        delay = _this$options2.delay,
        delayOnTouchOnly = _this$options2.delayOnTouchOnly;

    if (delay && (!delayOnTouchOnly || touch) && (!this.nativeDraggable || !(Edge || IE11OrLess))) {
      clearTimeout(this.dragStartTimer); // delay to start

      this.dragStartTimer = setTimeout(function () {
        return _this2._onStart(e, touch);
      }, delay);
    } else {
      this._onStart(e, touch);
    }
  },
  _onStart: function _onStart(
  /** Event|TouchEvent */
  e, touch) {
    if (!this.nativeDraggable || touch) {
      this._bindMoveEvents(touch);

      on(this.ownerDocument, 'pointercancel', this._onDrop);
      on(this.ownerDocument, 'touchcancel', this._onDrop);
    } else {
      // allow HTML5 drag event
      this.dragEl.draggable = true;
      this._onDragStart = this._onDragStart.bind(this);
      this._onDragOver = this._onDragOver.bind(this);
      on(this.rootEl, 'dragstart', this._onDragStart);
    } // clear selection


    try {
      if (document.selection) {
        // Timeout neccessary for IE9
        _nextTick(function () {
          document.selection.empty();
        });
      } else {
        window.getSelection().removeAllRanges();
      }
    } catch (error) {//
    }
  },
  // -------------------------------- drag event ----------------------------------
  _onDragStart: function _onDragStart(evt) {
    // elements can only be dragged after firefox sets setData
    evt.dataTransfer.setData('te', evt.target.innerText);
    on(this.rootEl, 'dragover', this._onDragOver);
    on(this.rootEl, 'dragend', this._onDrop);
  },
  _onDragOver: function _onDragOver(evt) {
    if (!this.state.sortableDown) return;
    var stopPropagation = this.options.stopPropagation;
    stopPropagation && evt.stopPropagation && evt.stopPropagation(); // prevent events from bubbling

    evt.preventDefault !== void 0 && evt.cancelable && evt.preventDefault(); // prevent scrolling

    var clientX = evt.clientX,
        clientY = evt.clientY;
    var distanceX = clientX - this.move.x;
    var distanceY = clientY - this.move.y;

    if (clientX !== void 0 && Math.abs(distanceX) <= 0 && clientY !== void 0 && Math.abs(distanceY) <= 0) {
      return;
    } // truly started


    this._onStarted(evt, evt);

    if (evt.target === this.rootEl) return;

    this._onChange(this, evt.target, evt, evt);
  },
  // -------------------------------- on move ----------------------------------
  _onMove: function _onMove(
  /** Event|TouchEvent */
  evt) {
    var _this3 = this;

    if (!this.state.sortableDown) return;

    var _getEvent2 = getEvent(evt),
        e = _getEvent2.e,
        target = _getEvent2.target;

    var clientX = e.clientX,
        clientY = e.clientY;
    var distanceX = clientX - this.move.x;
    var distanceY = clientY - this.move.y;

    if (clientX !== void 0 && Math.abs(distanceX) <= 0 && clientY !== void 0 && Math.abs(distanceY) <= 0) {
      return;
    }

    var stopPropagation = this.options.stopPropagation;
    stopPropagation && evt.stopPropagation && evt.stopPropagation(); // prevent events from bubbling

    evt.preventDefault !== void 0 && evt.cancelable && evt.preventDefault(); // prevent scrolling

    this._onStarted(e, evt);

    this.ghost.move(distanceX, distanceY); // onMove callback

    var onMove = this.options.onMove;
    if (onMove && typeof onMove === 'function') onMove(this.differ.from, this.ghost.$el, e, evt); // boundary value judgment

    if (clientX < 0 || clientY < 0) return;

    var _getRect = getRect(this.rootEl),
        top = _getRect.top,
        right = _getRect.right,
        bottom = _getRect.bottom,
        left = _getRect.left;

    if (clientX < left || clientX > right || clientY < top || clientY > bottom) return; // check if element will exchange

    this._onChange(this, target, e, evt); // auto scroll


    this.autoScrollTimer && clearTimeout(this.autoScrollTimer);

    if (this.options.autoScroll) {
      this.autoScrollTimer = setTimeout(function () {
        return _this3._autoScroll(_this3);
      }, 0);
    }
  },
  _onStarted: function _onStarted(e,
  /** originalEvent */
  evt) {
    this.state.sortableMove = e; // sortable state move is active

    if (!this.ghost.$el) {
      // onDrag callback
      var onDrag = this.options.onDrag;
      if (onDrag && typeof onDrag === 'function') onDrag(this.dragEl, e, evt); // Init in the move event to prevent conflict with the click event

      var rect = this.differ.from.rect;
      var ghostEl = this.dragEl.cloneNode(true);
      this.ghost.init(ghostEl, rect, !this.nativeDraggable); // add class for drag element

      toggleClass(this.dragEl, this.options.chosenClass, true);
      this.dragEl.style['will-change'] = 'transform';
      if (Safari) css(document.body, 'user-select', 'none');
      if (this.nativeDraggable) this._unbindDropEvents();
    }
  },
  _onChange: debounce(function (_this, target, e, evt) {
    var _getElement2 = getElement(_this.rootEl, target),
        el = _getElement2.el,
        rect = _getElement2.rect,
        offset = _getElement2.offset;

    if (!el || el && el.animated) return;
    _this.dropEl = el;
    var clientX = e.clientX,
        clientY = e.clientY;
    var left = rect.left,
        right = rect.right,
        top = rect.top,
        bottom = rect.bottom;

    if (clientX > left && clientX < right && clientY > top && clientY < bottom) {
      // swap when the elements before and after the drag are inconsistent
      if (el !== _this.dragEl) {
        _this.differ.to = {
          node: _this.dropEl,
          rect: rect,
          offset: offset
        };

        _this.captureAnimationState();

        var onChange = _this.options.onChange;

        var _offset = getOffset(_this.dragEl); // onChange callback


        if (onChange && typeof onChange === 'function') onChange(_this.differ.from, _this.differ.to, e, evt); // the top value is compared first, and the left is compared if the top value is the same

        if (_offset.top < offset.top || _offset.left < offset.left) {
          _this.rootEl.insertBefore(_this.dragEl, el.nextElementSibling);
        } else {
          _this.rootEl.insertBefore(_this.dragEl, el);
        }

        _this.animateRange();
      }
    }
  }, 5),
  // -------------------------------- on drop ----------------------------------
  _onDrop: function _onDrop(
  /** Event|TouchEvent */
  evt) {
    this._unbindDragEvents();

    this._unbindMoveEvents();

    this._unbindDropEvents();

    this.dragStartTimer && clearTimeout(this.dragStartTimer);
    var stopPropagation = this.options.stopPropagation;
    stopPropagation && evt.stopPropagation();
    evt.preventDefault && evt.preventDefault();

    var _getEvent3 = getEvent(evt),
        touch = _getEvent3.touch; // clear style and class


    toggleClass(this.dragEl, this.options.chosenClass, false);
    if (this.nativeDraggable) this.dragEl.draggable = false;
    if (touch) this.dragEl.style['touch-action'] = '';
    this.dragEl.style['will-change'] = '';

    if (this.state.sortableDown && this.state.sortableMove) {
      // re-acquire the offset and rect values of the dragged element as the value after the drag is completed
      this.differ.to.offset = getOffset(this.dragEl);
      this.differ.to.rect = getRect(this.dragEl);
      var _this$differ = this.differ,
          from = _this$differ.from,
          to = _this$differ.to; // compare whether the element is swapped by offset

      var changed = from.offset.top !== to.offset.top || from.offset.left !== to.offset.left; // onDrop callback

      var onDrop = this.options.onDrop;
      if (onDrop && typeof onDrop === 'function') onDrop(changed, evt);
    }

    if (Safari) css(document.body, 'user-select', '');
    this.ghost.destroy(this.differ.to.rect);
    this.state = new State();
  },
  // -------------------------------- clear ----------------------------------
  _clearState: function _clearState() {
    this.state = new State();
    this.differ.destroy();
    this.dragEl = null;
    this.dropEl = null;
  }
};
Sortable.prototype.utils = {
  getRect: getRect,
  getOffset: getOffset,
  debounce: debounce,
  throttle: throttle,
  getParentAutoScrollElement: getParentAutoScrollElement
};

var EVENT_TYPE;

(function (EVENT_TYPE) {
  EVENT_TYPE["ITEM"] = "itemResize";
  EVENT_TYPE["SLOT"] = "slotResize";
})(EVENT_TYPE || (EVENT_TYPE = {}));

var SLOT_TYPE;

(function (SLOT_TYPE) {
  SLOT_TYPE["HEADER"] = "thead";
  SLOT_TYPE["FOOTER"] = "tfoot";
})(SLOT_TYPE || (SLOT_TYPE = {}));

var VirtualList = defineComponent({
  name: 'VirtualList',
  props: VirtualProps,
  setup: function setup(props, _ref) {
    var emit = _ref.emit,
        slots = _ref.slots,
        expose = _ref.expose;
    var isHorizontal = props.direction === 'horizontal';
    var directionKey = isHorizontal ? 'scrollLeft' : 'scrollTop';
    var range = ref(null);
    var root = ref();
    var shepherd = ref(null);
    var virtual;
    /**
     * watch
     */

    watch(function () {
      return props.dataSources.length;
    }, function () {
      virtual.updateParam('uniqueIds', getUniqueIdFromDataSources());
      virtual.handleDataSourcesChange();
    });
    watch(function () {
      return props.keeps;
    }, function (newValue) {
      virtual.updateParam('keeps', newValue);
      virtual.handleSlotSizeChange();
    });
    watch(function () {
      return props.start;
    }, function (newValue) {
      scrollToIndex(newValue);
    });
    watch(function () {
      return props.offset;
    }, function (newValue) {
      return scrollToOffset(newValue);
    });
    /**
     * methods
     */
    // get item size by id

    var getSize = function getSize(id) {
      return virtual.sizes.get(id);
    };

    var getOffset = function getOffset() {
      if (props.pageMode) {
        return document.documentElement[directionKey] || document.body[directionKey];
      } else {
        return root.value ? Math.ceil(root.value[directionKey]) : 0;
      }
    }; // return client viewport size


    var getClientSize = function getClientSize() {
      var key = isHorizontal ? 'clientWidth' : 'clientHeight';

      if (props.pageMode) {
        return document.documentElement[key] || document.body[key];
      } else {
        return root.value ? Math.ceil(root.value[key]) : 0;
      }
    }; // return all scroll size


    var getScrollSize = function getScrollSize() {
      var key = isHorizontal ? 'scrollWidth' : 'scrollHeight';

      if (props.pageMode) {
        return document.documentElement[key] || document.body[key];
      } else {
        return root.value ? Math.ceil(root.value[key]) : 0;
      }
    };

    var emitEvent = function emitEvent(offset, clientSize, scrollSize, evt) {
      emit('scroll', evt, virtual.getRange());

      if (virtual.isFront() && !!props.dataSources.length && offset - props.topThreshold <= 0) {
        emit('totop');
      } else if (virtual.isBehind() && offset + clientSize + props.bottomThreshold >= scrollSize) {
        emit('tobottom');
      }
    };

    var onScroll = function onScroll(evt) {
      var offset = getOffset();
      var clientSize = getClientSize();
      var scrollSize = getScrollSize(); // iOS scroll-spring-back behavior will make direction mistake

      if (offset < 0 || offset + clientSize > scrollSize + 1 || !scrollSize) {
        return;
      }

      virtual.handleScroll(offset);
      emitEvent(offset, clientSize, scrollSize, evt);
    };

    var getUniqueIdFromDataSources = function getUniqueIdFromDataSources() {
      var dataKey = props.dataKey,
          _props$dataSources = props.dataSources,
          dataSources = _props$dataSources === void 0 ? [] : _props$dataSources;
      return dataSources.map(function (dataSource) {
        return typeof dataKey === 'function' ? dataKey(dataSource) : dataSource[dataKey];
      });
    };

    var onRangeChanged = function onRangeChanged(newRange) {
      range.value = newRange;
    };

    var installVirtual = function installVirtual() {
      virtual = new Virtual({
        slotHeaderSize: 0,
        slotFooterSize: 0,
        keeps: props.keeps,
        estimateSize: props.estimateSize,
        buffer: Math.round(props.keeps / 3),
        // recommend for a third of keeps
        uniqueIds: getUniqueIdFromDataSources()
      }, onRangeChanged); // sync initial range

      range.value = virtual.getRange();
    }; // set current scroll position to a expectant index


    var scrollToIndex = function scrollToIndex(index) {
      // scroll to bottom
      if (index >= props.dataSources.length - 1) {
        scrollToBottom();
      } else {
        var offset = virtual.getOffset(index);
        scrollToOffset(offset);
      }
    }; // set current scroll position to a expectant offset


    var scrollToOffset = function scrollToOffset(offset) {
      if (props.pageMode) {
        document.body[directionKey] = offset;
        document.documentElement[directionKey] = offset;
      } else {
        if (root.value) {
          root.value[directionKey] = offset;
        }
      }
    }; // get the real render slots based on range data
    // in-place patch strategy will try to reuse components as possible
    // so those components that are reused will not trigger lifecycle mounted


    var getRenderSlots = function getRenderSlots() {
      var slots = [];
      var _range$value = range.value,
          start = _range$value.start,
          end = _range$value.end;
      var dataSources = props.dataSources,
          dataKey = props.dataKey,
          itemClass = props.itemClass,
          itemTag = props.itemTag,
          itemStyle = props.itemStyle,
          extraProps = props.extraProps,
          dataComponent = props.dataComponent,
          itemScopedSlots = props.itemScopedSlots;

      for (var index = start; index <= end; index++) {
        var dataSource = dataSources[index];

        if (dataSource) {
          var uniqueKey = typeof dataKey === 'function' ? dataKey(dataSource) : dataSource[dataKey];

          if (typeof uniqueKey === 'string' || typeof uniqueKey === 'number') {
            slots.push(createVNode(Item, {
              "index": index,
              "tag": itemTag,
              "event": EVENT_TYPE.ITEM,
              "horizontal": isHorizontal,
              "uniqueKey": uniqueKey,
              "source": dataSource,
              "extraProps": extraProps,
              "component": dataComponent,
              "scopedSlots": itemScopedSlots,
              "style": itemStyle,
              "class": "".concat(itemClass).concat(props.itemClassAdd ? ' ' + props.itemClassAdd(index) : ''),
              "onItemResize": onItemResized
            }, null));
          } else {
            console.warn("Cannot get the data-key '".concat(dataKey, "' from data-sources."));
          }
        } else {
          console.warn("Cannot get the index '".concat(index, "' from data-sources."));
        }
      }

      return slots;
    }; // event called when each item mounted or size changed


    var onItemResized = function onItemResized(id, size) {
      virtual.saveSize(id, size);
      emit('resized', id, size);
    }; // event called when slot mounted or size changed


    var onSlotResized = function onSlotResized(type, size, hasInit) {
      if (type === SLOT_TYPE.HEADER) {
        virtual.updateParam('slotHeaderSize', size);
      } else if (type === SLOT_TYPE.FOOTER) {
        virtual.updateParam('slotFooterSize', size);
      }

      if (hasInit) {
        virtual.handleSlotSizeChange();
      }
    }; // set current scroll position to bottom


    var scrollToBottom = function scrollToBottom() {
      if (shepherd.value) {
        var offset = shepherd.value[isHorizontal ? 'offsetLeft' : 'offsetTop'];
        scrollToOffset(offset); // check if it's really scrolled to the bottom
        // maybe list doesn't render and calculate to last range
        // so we need retry in next event loop until it really at bottom

        setTimeout(function () {
          if (getOffset() + getClientSize() < getScrollSize()) {
            scrollToBottom();
          }
        }, 3);
      }
    }; // when using page mode we need update slot header size manually
    // taking root offset relative to the browser as slot header size


    var updatePageModeFront = function updatePageModeFront() {
      if (root.value) {
        var rect = root.value.getBoundingClientRect();
        var defaultView = root.value.ownerDocument.defaultView;
        var offsetFront = isHorizontal ? rect.left + defaultView.pageXOffset : rect.top + defaultView.pageYOffset;
        virtual.updateParam('slotHeaderSize', offsetFront);
      }
    }; // get the total number of stored (rendered) items


    var getSizes = function getSizes() {
      return virtual.sizes.size;
    };
    /**
     * Sortable
     */


    var sortable = ref();
    var wrapper = templateRef('wrapper');
    onMounted(function () {
      return console.log('wrapper', wrapper.value);
    });
    onMounted(function () {
      sortable.value = new Sortable(wrapper.value, {});
      console.log('sortable', sortable.value);
    });
    /**
     * life cycles
     */

    onBeforeMount(function () {
      installVirtual();
    }); // set back offset when awake from keep-alive

    onActivated(function () {
      scrollToOffset(virtual.offset);
    });
    onMounted(function () {
      // set position
      if (props.start) {
        scrollToIndex(props.start);
      } else if (props.offset) {
        scrollToOffset(props.offset);
      } // in page mode we bind scroll event to document


      if (props.pageMode) {
        updatePageModeFront();
        document.addEventListener('scroll', onScroll, {
          passive: false
        });
      }
    });
    onUnmounted(function () {
      virtual.destroy();

      if (props.pageMode) {
        document.removeEventListener('scroll', onScroll);
      }
    });
    /**
     * public methods
     */

    expose({
      scrollToBottom: scrollToBottom,
      getSizes: getSizes,
      getSize: getSize,
      getScrollSize: getScrollSize,
      getClientSize: getClientSize,
      scrollToOffset: scrollToOffset,
      scrollToIndex: scrollToIndex
    });
    return function () {
      var pageMode = props.pageMode,
          RootTag = props.rootTag,
          WrapTag = props.wrapTag,
          wrapClass = props.wrapClass,
          wrapStyle = props.wrapStyle,
          headerTag = props.headerTag,
          headerClass = props.headerClass,
          headerStyle = props.headerStyle,
          footerTag = props.footerTag,
          footerClass = props.footerClass,
          footerStyle = props.footerStyle;
      var _ref2 = range.value,
          padFront = _ref2.padFront,
          padBehind = _ref2.padBehind;
      var paddingStyle = {
        padding: isHorizontal ? "0px ".concat(padBehind, "px 0px ").concat(padFront, "px") : "".concat(padFront, "px 0px ").concat(padBehind, "px")
      };
      var wrapperStyle = wrapStyle ? Object.assign({}, wrapStyle, paddingStyle) : paddingStyle;
      var header = slots.header,
          footer = slots.footer;
      return createVNode(RootTag, {
        "ref": root,
        "onScroll": !pageMode && onScroll
      }, {
        "default": function _default() {
          return [header && createVNode(Slot, {
            "class": headerClass,
            "style": headerStyle,
            "tag": headerTag,
            "event": EVENT_TYPE.SLOT,
            "uniqueKey": SLOT_TYPE.HEADER,
            "onSlotResize": onSlotResized
          }, {
            "default": function _default() {
              return [header()];
            }
          }), createVNode(WrapTag, {
            "ref": "wrapper",
            "class": wrapClass,
            "style": wrapperStyle
          }, {
            "default": function _default() {
              return [getRenderSlots()];
            }
          }), footer && createVNode(Slot, {
            "class": footerClass,
            "style": footerStyle,
            "tag": footerTag,
            "event": EVENT_TYPE.SLOT,
            "uniqueKey": SLOT_TYPE.FOOTER,
            "onSlotResize": onSlotResized
          }, {
            "default": function _default() {
              return [footer()];
            }
          }), createVNode("div", {
            "ref": shepherd,
            "style": {
              width: isHorizontal ? '0px' : '100%',
              height: isHorizontal ? '100%' : '0px'
            }
          }, null)];
        }
      });
    };
  }
});

export { VirtualList as default };
//# sourceMappingURL=index.js.map

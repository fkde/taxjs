
  // node_modules/big.js/big.mjs
  var DP = 20;
  var RM = 1;
  var MAX_DP = 1e6;
  var MAX_POWER = 1e6;
  var NE = -7;
  var PE = 21;
  var STRICT = false;
  var NAME = "[big.js] ";
  var INVALID = NAME + "Invalid ";
  var INVALID_DP = INVALID + "decimal places";
  var INVALID_RM = INVALID + "rounding mode";
  var DIV_BY_ZERO = NAME + "Division by zero";
  var P = {};
  var UNDEFINED = void 0;
  var NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
  function _Big_() {
    function Big2(n) {
      var x = this;
      if (!(x instanceof Big2))
        return n === UNDEFINED ? _Big_() : new Big2(n);
      if (n instanceof Big2) {
        x.s = n.s;
        x.e = n.e;
        x.c = n.c.slice();
      } else {
        if (typeof n !== "string") {
          if (Big2.strict === true && typeof n !== "bigint") {
            throw TypeError(INVALID + "value");
          }
          n = n === 0 && 1 / n < 0 ? "-0" : String(n);
        }
        parse(x, n);
      }
      x.constructor = Big2;
    }
    Big2.prototype = P;
    Big2.DP = DP;
    Big2.RM = RM;
    Big2.NE = NE;
    Big2.PE = PE;
    Big2.strict = STRICT;
    Big2.roundDown = 0;
    Big2.roundHalfUp = 1;
    Big2.roundHalfEven = 2;
    Big2.roundUp = 3;
    return Big2;
  }
  function parse(x, n) {
    var e, i, nl;
    if (!NUMERIC.test(n)) {
      throw Error(INVALID + "number");
    }
    x.s = n.charAt(0) == "-" ? (n = n.slice(1), -1) : 1;
    if ((e = n.indexOf(".")) > -1)
      n = n.replace(".", "");
    if ((i = n.search(/e/i)) > 0) {
      if (e < 0)
        e = i;
      e += +n.slice(i + 1);
      n = n.substring(0, i);
    } else if (e < 0) {
      e = n.length;
    }
    nl = n.length;
    for (i = 0; i < nl && n.charAt(i) == "0"; )
      ++i;
    if (i == nl) {
      x.c = [x.e = 0];
    } else {
      for (; nl > 0 && n.charAt(--nl) == "0"; )
        ;
      x.e = e - i - 1;
      x.c = [];
      for (e = 0; i <= nl; )
        x.c[e++] = +n.charAt(i++);
    }
    return x;
  }
  function round(x, sd, rm, more) {
    var xc = x.c;
    if (rm === UNDEFINED)
      rm = x.constructor.RM;
    if (rm !== 0 && rm !== 1 && rm !== 2 && rm !== 3) {
      throw Error(INVALID_RM);
    }
    if (sd < 1) {
      more = rm === 3 && (more || !!xc[0]) || sd === 0 && (rm === 1 && xc[0] >= 5 || rm === 2 && (xc[0] > 5 || xc[0] === 5 && (more || xc[1] !== UNDEFINED)));
      xc.length = 1;
      if (more) {
        x.e = x.e - sd + 1;
        xc[0] = 1;
      } else {
        xc[0] = x.e = 0;
      }
    } else if (sd < xc.length) {
      more = rm === 1 && xc[sd] >= 5 || rm === 2 && (xc[sd] > 5 || xc[sd] === 5 && (more || xc[sd + 1] !== UNDEFINED || xc[sd - 1] & 1)) || rm === 3 && (more || !!xc[0]);
      xc.length = sd;
      if (more) {
        for (; ++xc[--sd] > 9; ) {
          xc[sd] = 0;
          if (sd === 0) {
            ++x.e;
            xc.unshift(1);
            break;
          }
        }
      }
      for (sd = xc.length; !xc[--sd]; )
        xc.pop();
    }
    return x;
  }
  function stringify(x, doExponential, isNonzero) {
    var e = x.e, s = x.c.join(""), n = s.length;
    if (doExponential) {
      s = s.charAt(0) + (n > 1 ? "." + s.slice(1) : "") + (e < 0 ? "e" : "e+") + e;
    } else if (e < 0) {
      for (; ++e; )
        s = "0" + s;
      s = "0." + s;
    } else if (e > 0) {
      if (++e > n) {
        for (e -= n; e--; )
          s += "0";
      } else if (e < n) {
        s = s.slice(0, e) + "." + s.slice(e);
      }
    } else if (n > 1) {
      s = s.charAt(0) + "." + s.slice(1);
    }
    return x.s < 0 && isNonzero ? "-" + s : s;
  }
  P.abs = function() {
    var x = new this.constructor(this);
    x.s = 1;
    return x;
  };
  P.cmp = function(y) {
    var isneg, x = this, xc = x.c, yc = (y = new x.constructor(y)).c, i = x.s, j = y.s, k = x.e, l = y.e;
    if (!xc[0] || !yc[0])
      return !xc[0] ? !yc[0] ? 0 : -j : i;
    if (i != j)
      return i;
    isneg = i < 0;
    if (k != l)
      return k > l ^ isneg ? 1 : -1;
    j = (k = xc.length) < (l = yc.length) ? k : l;
    for (i = -1; ++i < j; ) {
      if (xc[i] != yc[i])
        return xc[i] > yc[i] ^ isneg ? 1 : -1;
    }
    return k == l ? 0 : k > l ^ isneg ? 1 : -1;
  };
  P.div = function(y) {
    var x = this, Big2 = x.constructor, a = x.c, b = (y = new Big2(y)).c, k = x.s == y.s ? 1 : -1, dp = Big2.DP;
    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
      throw Error(INVALID_DP);
    }
    if (!b[0]) {
      throw Error(DIV_BY_ZERO);
    }
    if (!a[0]) {
      y.s = k;
      y.c = [y.e = 0];
      return y;
    }
    var bl, bt, n, cmp, ri, bz = b.slice(), ai = bl = b.length, al = a.length, r = a.slice(0, bl), rl = r.length, q = y, qc = q.c = [], qi = 0, p = dp + (q.e = x.e - y.e) + 1;
    q.s = k;
    k = p < 0 ? 0 : p;
    bz.unshift(0);
    for (; rl++ < bl; )
      r.push(0);
    do {
      for (n = 0; n < 10; n++) {
        if (bl != (rl = r.length)) {
          cmp = bl > rl ? 1 : -1;
        } else {
          for (ri = -1, cmp = 0; ++ri < bl; ) {
            if (b[ri] != r[ri]) {
              cmp = b[ri] > r[ri] ? 1 : -1;
              break;
            }
          }
        }
        if (cmp < 0) {
          for (bt = rl == bl ? b : bz; rl; ) {
            if (r[--rl] < bt[rl]) {
              ri = rl;
              for (; ri && !r[--ri]; )
                r[ri] = 9;
              --r[ri];
              r[rl] += 10;
            }
            r[rl] -= bt[rl];
          }
          for (; !r[0]; )
            r.shift();
        } else {
          break;
        }
      }
      qc[qi++] = cmp ? n : ++n;
      if (r[0] && cmp)
        r[rl] = a[ai] || 0;
      else
        r = [a[ai]];
    } while ((ai++ < al || r[0] !== UNDEFINED) && k--);
    if (!qc[0] && qi != 1) {
      qc.shift();
      q.e--;
      p--;
    }
    if (qi > p)
      round(q, p, Big2.RM, r[0] !== UNDEFINED);
    return q;
  };
  P.eq = function(y) {
    return this.cmp(y) === 0;
  };
  P.gt = function(y) {
    return this.cmp(y) > 0;
  };
  P.gte = function(y) {
    return this.cmp(y) > -1;
  };
  P.lt = function(y) {
    return this.cmp(y) < 0;
  };
  P.lte = function(y) {
    return this.cmp(y) < 1;
  };
  P.minus = P.sub = function(y) {
    var i, j, t, xlty, x = this, Big2 = x.constructor, a = x.s, b = (y = new Big2(y)).s;
    if (a != b) {
      y.s = -b;
      return x.plus(y);
    }
    var xc = x.c.slice(), xe = x.e, yc = y.c, ye = y.e;
    if (!xc[0] || !yc[0]) {
      if (yc[0]) {
        y.s = -b;
      } else if (xc[0]) {
        y = new Big2(x);
      } else {
        y.s = 1;
      }
      return y;
    }
    if (a = xe - ye) {
      if (xlty = a < 0) {
        a = -a;
        t = xc;
      } else {
        ye = xe;
        t = yc;
      }
      t.reverse();
      for (b = a; b--; )
        t.push(0);
      t.reverse();
    } else {
      j = ((xlty = xc.length < yc.length) ? xc : yc).length;
      for (a = b = 0; b < j; b++) {
        if (xc[b] != yc[b]) {
          xlty = xc[b] < yc[b];
          break;
        }
      }
    }
    if (xlty) {
      t = xc;
      xc = yc;
      yc = t;
      y.s = -y.s;
    }
    if ((b = (j = yc.length) - (i = xc.length)) > 0)
      for (; b--; )
        xc[i++] = 0;
    for (b = i; j > a; ) {
      if (xc[--j] < yc[j]) {
        for (i = j; i && !xc[--i]; )
          xc[i] = 9;
        --xc[i];
        xc[j] += 10;
      }
      xc[j] -= yc[j];
    }
    for (; xc[--b] === 0; )
      xc.pop();
    for (; xc[0] === 0; ) {
      xc.shift();
      --ye;
    }
    if (!xc[0]) {
      y.s = 1;
      xc = [ye = 0];
    }
    y.c = xc;
    y.e = ye;
    return y;
  };
  P.mod = function(y) {
    var ygtx, x = this, Big2 = x.constructor, a = x.s, b = (y = new Big2(y)).s;
    if (!y.c[0]) {
      throw Error(DIV_BY_ZERO);
    }
    x.s = y.s = 1;
    ygtx = y.cmp(x) == 1;
    x.s = a;
    y.s = b;
    if (ygtx)
      return new Big2(x);
    a = Big2.DP;
    b = Big2.RM;
    Big2.DP = Big2.RM = 0;
    x = x.div(y);
    Big2.DP = a;
    Big2.RM = b;
    return this.minus(x.times(y));
  };
  P.neg = function() {
    var x = new this.constructor(this);
    x.s = -x.s;
    return x;
  };
  P.plus = P.add = function(y) {
    var e, k, t, x = this, Big2 = x.constructor;
    y = new Big2(y);
    if (x.s != y.s) {
      y.s = -y.s;
      return x.minus(y);
    }
    var xe = x.e, xc = x.c, ye = y.e, yc = y.c;
    if (!xc[0] || !yc[0]) {
      if (!yc[0]) {
        if (xc[0]) {
          y = new Big2(x);
        } else {
          y.s = x.s;
        }
      }
      return y;
    }
    xc = xc.slice();
    if (e = xe - ye) {
      if (e > 0) {
        ye = xe;
        t = yc;
      } else {
        e = -e;
        t = xc;
      }
      t.reverse();
      for (; e--; )
        t.push(0);
      t.reverse();
    }
    if (xc.length - yc.length < 0) {
      t = yc;
      yc = xc;
      xc = t;
    }
    e = yc.length;
    for (k = 0; e; xc[e] %= 10)
      k = (xc[--e] = xc[e] + yc[e] + k) / 10 | 0;
    if (k) {
      xc.unshift(k);
      ++ye;
    }
    for (e = xc.length; xc[--e] === 0; )
      xc.pop();
    y.c = xc;
    y.e = ye;
    return y;
  };
  P.pow = function(n) {
    var x = this, one = new x.constructor("1"), y = one, isneg = n < 0;
    if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) {
      throw Error(INVALID + "exponent");
    }
    if (isneg)
      n = -n;
    for (; ; ) {
      if (n & 1)
        y = y.times(x);
      n >>= 1;
      if (!n)
        break;
      x = x.times(x);
    }
    return isneg ? one.div(y) : y;
  };
  P.prec = function(sd, rm) {
    if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
      throw Error(INVALID + "precision");
    }
    return round(new this.constructor(this), sd, rm);
  };
  P.round = function(dp, rm) {
    if (dp === UNDEFINED)
      dp = 0;
    else if (dp !== ~~dp || dp < -MAX_DP || dp > MAX_DP) {
      throw Error(INVALID_DP);
    }
    return round(new this.constructor(this), dp + this.e + 1, rm);
  };
  P.sqrt = function() {
    var r, c, t, x = this, Big2 = x.constructor, s = x.s, e = x.e, half = new Big2("0.5");
    if (!x.c[0])
      return new Big2(x);
    if (s < 0) {
      throw Error(NAME + "No square root");
    }
    s = Math.sqrt(x + "");
    if (s === 0 || s === 1 / 0) {
      c = x.c.join("");
      if (!(c.length + e & 1))
        c += "0";
      s = Math.sqrt(c);
      e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
      r = new Big2((s == 1 / 0 ? "5e" : (s = s.toExponential()).slice(0, s.indexOf("e") + 1)) + e);
    } else {
      r = new Big2(s + "");
    }
    e = r.e + (Big2.DP += 4);
    do {
      t = r;
      r = half.times(t.plus(x.div(t)));
    } while (t.c.slice(0, e).join("") !== r.c.slice(0, e).join(""));
    return round(r, (Big2.DP -= 4) + r.e + 1, Big2.RM);
  };
  P.times = P.mul = function(y) {
    var c, x = this, Big2 = x.constructor, xc = x.c, yc = (y = new Big2(y)).c, a = xc.length, b = yc.length, i = x.e, j = y.e;
    y.s = x.s == y.s ? 1 : -1;
    if (!xc[0] || !yc[0]) {
      y.c = [y.e = 0];
      return y;
    }
    y.e = i + j;
    if (a < b) {
      c = xc;
      xc = yc;
      yc = c;
      j = a;
      a = b;
      b = j;
    }
    for (c = new Array(j = a + b); j--; )
      c[j] = 0;
    for (i = b; i--; ) {
      b = 0;
      for (j = a + i; j > i; ) {
        b = c[j] + yc[i] * xc[j - i - 1] + b;
        c[j--] = b % 10;
        b = b / 10 | 0;
      }
      c[j] = b;
    }
    if (b)
      ++y.e;
    else
      c.shift();
    for (i = c.length; !c[--i]; )
      c.pop();
    y.c = c;
    return y;
  };
  P.toExponential = function(dp, rm) {
    var x = this, n = x.c[0];
    if (dp !== UNDEFINED) {
      if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
        throw Error(INVALID_DP);
      }
      x = round(new x.constructor(x), ++dp, rm);
      for (; x.c.length < dp; )
        x.c.push(0);
    }
    return stringify(x, true, !!n);
  };
  P.toFixed = function(dp, rm) {
    var x = this, n = x.c[0];
    if (dp !== UNDEFINED) {
      if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
        throw Error(INVALID_DP);
      }
      x = round(new x.constructor(x), dp + x.e + 1, rm);
      for (dp = dp + x.e + 1; x.c.length < dp; )
        x.c.push(0);
    }
    return stringify(x, false, !!n);
  };
  P[Symbol.for("nodejs.util.inspect.custom")] = P.toJSON = P.toString = function() {
    var x = this, Big2 = x.constructor;
    return stringify(x, x.e <= Big2.NE || x.e >= Big2.PE, !!x.c[0]);
  };
  P.toNumber = function() {
    var n = Number(stringify(this, true, true));
    if (this.constructor.strict === true && !this.eq(n.toString())) {
      throw Error(NAME + "Imprecise conversion");
    }
    return n;
  };
  P.toPrecision = function(sd, rm) {
    var x = this, Big2 = x.constructor, n = x.c[0];
    if (sd !== UNDEFINED) {
      if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
        throw Error(INVALID + "precision");
      }
      x = round(new Big2(x), sd, rm);
      for (; x.c.length < sd; )
        x.c.push(0);
    }
    return stringify(x, sd <= x.e || x.e <= Big2.NE || x.e >= Big2.PE, !!n);
  };
  P.valueOf = function() {
    var x = this, Big2 = x.constructor;
    if (Big2.strict === true) {
      throw Error(NAME + "valueOf disallowed");
    }
    return stringify(x, x.e <= Big2.NE || x.e >= Big2.PE, true);
  };
  var Big = _Big_();
  var big_default = Big;

  // dist/es2015/Lohnsteuer2024Big.js
  var Lohnsteuer2024 = class _Lohnsteuer2024 {
    constructor() {
      this.Z_0 = new big_default(0);
      this.Z_1 = new big_default(1);
      this.Z_10 = new big_default(10);
      this.af = 1;
      this.ENTSCH = this.Z_0;
      this.f = 1;
      this.PKPV = this.Z_0;
      this.PKV = 0;
      this.PVA = this.Z_0;
      this.PVS = 0;
      this.PVZ = 0;
      this.JRE4ENT = this.Z_0;
      this.SONSTENT = this.Z_0;
      this.BK = this.Z_0;
      this.BKS = this.Z_0;
      this.BKV = this.Z_0;
      this.LSTLZZ = this.Z_0;
      this.SOLZLZZ = this.Z_0;
      this.SOLZS = this.Z_0;
      this.SOLZV = this.Z_0;
      this.STS = this.Z_0;
      this.STV = this.Z_0;
      this.VKVLZZ = this.Z_0;
      this.VKVSONST = this.Z_0;
      this.VFRB = this.Z_0;
      this.VFRBS1 = this.Z_0;
      this.VFRBS2 = this.Z_0;
      this.WVFRB = this.Z_0;
      this.WVFRBO = this.Z_0;
      this.WVFRBM = this.Z_0;
      this.ALTE = this.Z_0;
      this.ANP = this.Z_0;
      this.ANTEIL1 = this.Z_0;
      this.BMG = this.Z_0;
      this.BBGKVPV = this.Z_0;
      this.BBGRV = this.Z_0;
      this.DIFF = this.Z_0;
      this.EFA = this.Z_0;
      this.FVB = this.Z_0;
      this.FVBSO = this.Z_0;
      this.FVBZ = this.Z_0;
      this.FVBZSO = this.Z_0;
      this.GFB = this.Z_0;
      this.HBALTE = this.Z_0;
      this.HFVB = this.Z_0;
      this.HFVBZ = this.Z_0;
      this.HFVBZSO = this.Z_0;
      this.J = 0;
      this.JBMG = this.Z_0;
      this.JLFREIB = this.Z_0;
      this.JLHINZU = this.Z_0;
      this.JW = this.Z_0;
      this.K = 0;
      this.KENNVMT = 0;
      this.KFB = this.Z_0;
      this.KVSATZAG = this.Z_0;
      this.KVSATZAN = this.Z_0;
      this.KZTAB = 0;
      this.LSTJAHR = this.Z_0;
      this.LST1 = this.Z_0;
      this.LST2 = this.Z_0;
      this.LST3 = this.Z_0;
      this.LSTOSO = this.Z_0;
      this.LSTSO = this.Z_0;
      this.MIST = this.Z_0;
      this.PVSATZAG = this.Z_0;
      this.PVSATZAN = this.Z_0;
      this.RVSATZAN = this.Z_0;
      this.RW = this.Z_0;
      this.SAP = this.Z_0;
      this.SOLZFREI = this.Z_0;
      this.SOLZJ = this.Z_0;
      this.SOLZMIN = this.Z_0;
      this.SOLZSBMG = this.Z_0;
      this.SOLZSZVE = this.Z_0;
      this.SOLZVBMG = this.Z_0;
      this.ST = this.Z_0;
      this.ST1 = this.Z_0;
      this.ST2 = this.Z_0;
      this.STOVMT = this.Z_0;
      this.TBSVORV = this.Z_0;
      this.VBEZB = this.Z_0;
      this.VBEZBSO = this.Z_0;
      this.VHB = this.Z_0;
      this.VSP = this.Z_0;
      this.VSPN = this.Z_0;
      this.VSP1 = this.Z_0;
      this.VSP2 = this.Z_0;
      this.VSP3 = this.Z_0;
      this.W1STKL5 = this.Z_0;
      this.W2STKL5 = this.Z_0;
      this.W3STKL5 = this.Z_0;
      this.VSPMAX1 = this.Z_0;
      this.VSPMAX2 = this.Z_0;
      this.VSPO = this.Z_0;
      this.VSPREST = this.Z_0;
      this.VSPVOR = this.Z_0;
      this.X = this.Z_0;
      this.Y = this.Z_0;
      this.ZRE4 = this.Z_0;
      this.ZRE4J = this.Z_0;
      this.ZRE4VP = this.Z_0;
      this.ZTABFB = this.Z_0;
      this.ZVBEZ = this.Z_0;
      this.ZVBEZJ = this.Z_0;
      this.ZVE = this.Z_0;
      this.ZX = this.Z_0;
      this.ZZX = this.Z_0;
      this.HOCH = this.Z_0;
      this.VERGL = this.Z_0;
      this.VKV = this.Z_0;
      this.TAB1 = [new big_default(0), new big_default(0.4), new big_default(0.384), new big_default(0.368), new big_default(0.352), new big_default(0.336), new big_default(0.32), new big_default(0.304), new big_default(0.288), new big_default(0.272), new big_default(0.256), new big_default(0.24), new big_default(0.224), new big_default(0.208), new big_default(0.192), new big_default(0.176), new big_default(0.16), new big_default(0.152), new big_default(0.144), new big_default(0.136), new big_default(0.128), new big_default(0.12), new big_default(0.112), new big_default(0.104), new big_default(0.096), new big_default(0.088), new big_default(0.08), new big_default(0.072), new big_default(0.064), new big_default(0.056), new big_default(0.048), new big_default(0.04), new big_default(0.032), new big_default(0.024), new big_default(0.016), new big_default(8e-3), new big_default(0)];
      this.TAB2 = [new big_default(0), new big_default(3e3), new big_default(2880), new big_default(2760), new big_default(2640), new big_default(2520), new big_default(2400), new big_default(2280), new big_default(2160), new big_default(2040), new big_default(1920), new big_default(1800), new big_default(1680), new big_default(1560), new big_default(1440), new big_default(1320), new big_default(1200), new big_default(1140), new big_default(1080), new big_default(1020), new big_default(960), new big_default(900), new big_default(840), new big_default(780), new big_default(720), new big_default(660), new big_default(600), new big_default(540), new big_default(480), new big_default(420), new big_default(360), new big_default(300), new big_default(240), new big_default(180), new big_default(120), new big_default(60), new big_default(0)];
      this.TAB3 = [new big_default(0), new big_default(900), new big_default(864), new big_default(828), new big_default(792), new big_default(756), new big_default(720), new big_default(684), new big_default(648), new big_default(612), new big_default(576), new big_default(540), new big_default(504), new big_default(468), new big_default(432), new big_default(396), new big_default(360), new big_default(342), new big_default(324), new big_default(306), new big_default(288), new big_default(270), new big_default(252), new big_default(234), new big_default(216), new big_default(198), new big_default(180), new big_default(162), new big_default(144), new big_default(126), new big_default(108), new big_default(90), new big_default(72), new big_default(54), new big_default(36), new big_default(18), new big_default(0)];
      this.TAB4 = [new big_default(0), new big_default(0.4), new big_default(0.384), new big_default(0.368), new big_default(0.352), new big_default(0.336), new big_default(0.32), new big_default(0.304), new big_default(0.288), new big_default(0.272), new big_default(0.256), new big_default(0.24), new big_default(0.224), new big_default(0.208), new big_default(0.192), new big_default(0.176), new big_default(0.16), new big_default(0.152), new big_default(0.144), new big_default(0.136), new big_default(0.128), new big_default(0.12), new big_default(0.112), new big_default(0.104), new big_default(0.096), new big_default(0.088), new big_default(0.08), new big_default(0.072), new big_default(0.064), new big_default(0.056), new big_default(0.048), new big_default(0.04), new big_default(0.032), new big_default(0.024), new big_default(0.016), new big_default(8e-3), new big_default(0)];
      this.TAB5 = [new big_default(0), new big_default(1900), new big_default(1824), new big_default(1748), new big_default(1672), new big_default(1596), new big_default(1520), new big_default(1444), new big_default(1368), new big_default(1292), new big_default(1216), new big_default(1140), new big_default(1064), new big_default(988), new big_default(912), new big_default(836), new big_default(760), new big_default(722), new big_default(684), new big_default(646), new big_default(608), new big_default(570), new big_default(532), new big_default(494), new big_default(456), new big_default(418), new big_default(380), new big_default(342), new big_default(304), new big_default(266), new big_default(228), new big_default(190), new big_default(152), new big_default(114), new big_default(76), new big_default(38), new big_default(0)];
      this.ZAHL1 = this.Z_1;
      this.ZAHL2 = new big_default(2);
      this.ZAHL5 = new big_default(5);
      this.ZAHL7 = new big_default(7);
      this.ZAHL12 = new big_default(12);
      this.ZAHL100 = new big_default(100);
      this.ZAHL360 = new big_default(360);
      this.ZAHL500 = new big_default(500);
      this.ZAHL700 = new big_default(700);
      this.ZAHL1000 = new big_default(1e3);
      this.ZAHL10000 = new big_default(1e4);
    }
    /**  PROGRAMMABLAUFPLAN, PAP Seite 14  */
    calculate() {
      this.MPARA();
      this.MRE4JL();
      this.VBEZBSO = this.Z_0;
      this.KENNVMT = 0;
      this.MRE4();
      this.MRE4ABZ();
      this.MBERECH();
      this.MSONST();
      this.MVMT();
    }
    /**  Zuweisung von Werten für bestimmte Sozialversicherungsparameter  PAP Seite 15  */
    MPARA() {
      if (this.KRV < 2) {
        if (this.KRV == 0) {
          this.BBGRV = new big_default(90600);
        } else {
          this.BBGRV = new big_default(89400);
        }
        this.RVSATZAN = new big_default(0.093);
      } else {
      }
      this.BBGKVPV = new big_default(62100);
      this.KVSATZAN = this.KVZ.div(this.ZAHL2).div(this.ZAHL100).add(new big_default(0.07));
      this.KVSATZAG = new big_default(85e-4).add(new big_default(0.07));
      if (this.PVS == 1) {
        this.PVSATZAN = new big_default(0.022);
        this.PVSATZAG = new big_default(0.012);
      } else {
        this.PVSATZAN = new big_default(0.017);
        this.PVSATZAG = new big_default(0.017);
      }
      if (this.PVZ == 1) {
        this.PVSATZAN = this.PVSATZAN.add(new big_default(6e-3));
      } else {
        this.PVSATZAN = this.PVSATZAN.sub(this.PVA.mul(new big_default(25e-4)));
      }
      this.W1STKL5 = new big_default(13279);
      this.W2STKL5 = new big_default(33380);
      this.W3STKL5 = new big_default(222260);
      this.GFB = new big_default(11604);
      this.SOLZFREI = new big_default(18130);
    }
    /**  Ermittlung des Jahresarbeitslohns nach § 39 b Abs. 2 Satz 2 EStG, PAP Seite 16  */
    MRE4JL() {
      if (this.LZZ == 1) {
        this.ZRE4J = this.RE4.div(this.ZAHL100).round(2, big_default.roundDown);
        this.ZVBEZJ = this.VBEZ.div(this.ZAHL100).round(2, big_default.roundDown);
        this.JLFREIB = this.LZZFREIB.div(this.ZAHL100).round(2, big_default.roundDown);
        this.JLHINZU = this.LZZHINZU.div(this.ZAHL100).round(2, big_default.roundDown);
      } else {
        if (this.LZZ == 2) {
          this.ZRE4J = this.RE4.mul(this.ZAHL12).div(this.ZAHL100).round(2, big_default.roundDown);
          this.ZVBEZJ = this.VBEZ.mul(this.ZAHL12).div(this.ZAHL100).round(2, big_default.roundDown);
          this.JLFREIB = this.LZZFREIB.mul(this.ZAHL12).div(this.ZAHL100).round(2, big_default.roundDown);
          this.JLHINZU = this.LZZHINZU.mul(this.ZAHL12).div(this.ZAHL100).round(2, big_default.roundDown);
        } else {
          if (this.LZZ == 3) {
            this.ZRE4J = this.RE4.mul(this.ZAHL360).div(this.ZAHL700).round(2, big_default.roundDown);
            this.ZVBEZJ = this.VBEZ.mul(this.ZAHL360).div(this.ZAHL700).round(2, big_default.roundDown);
            this.JLFREIB = this.LZZFREIB.mul(this.ZAHL360).div(this.ZAHL700).round(2, big_default.roundDown);
            this.JLHINZU = this.LZZHINZU.mul(this.ZAHL360).div(this.ZAHL700).round(2, big_default.roundDown);
          } else {
            this.ZRE4J = this.RE4.mul(this.ZAHL360).div(this.ZAHL100).round(2, big_default.roundDown);
            this.ZVBEZJ = this.VBEZ.mul(this.ZAHL360).div(this.ZAHL100).round(2, big_default.roundDown);
            this.JLFREIB = this.LZZFREIB.mul(this.ZAHL360).div(this.ZAHL100).round(2, big_default.roundDown);
            this.JLHINZU = this.LZZHINZU.mul(this.ZAHL360).div(this.ZAHL100).round(2, big_default.roundDown);
          }
        }
      }
      if (this.af == 0) {
        this.f = 1;
      }
    }
    /**  Freibeträge für Versorgungsbezüge, Altersentlastungsbetrag (§ 39b Abs. 2 Satz 3 EStG), PAP Seite 17  */
    MRE4() {
      if (this.ZVBEZJ.cmp(this.Z_0) == 0) {
        this.FVBZ = this.Z_0;
        this.FVB = this.Z_0;
        this.FVBZSO = this.Z_0;
        this.FVBSO = this.Z_0;
      } else {
        if (this.VJAHR < 2006) {
          this.J = 1;
        } else {
          if (this.VJAHR < 2040) {
            this.J = this.VJAHR - 2004;
          } else {
            this.J = 36;
          }
        }
        if (this.LZZ == 1) {
          this.VBEZB = this.VBEZM.mul(new big_default(this.ZMVB)).add(this.VBEZS);
          this.HFVB = this.TAB2[this.J].div(this.ZAHL12).mul(new big_default(this.ZMVB));
          this.FVBZ = this.TAB3[this.J].div(this.ZAHL12).mul(new big_default(this.ZMVB)).round(0, big_default.roundUp);
        } else {
          this.VBEZB = this.VBEZM.mul(this.ZAHL12).add(this.VBEZS).round(2, big_default.roundDown);
          this.HFVB = this.TAB2[this.J];
          this.FVBZ = this.TAB3[this.J];
        }
        this.FVB = this.VBEZB.mul(this.TAB1[this.J]).div(this.ZAHL100).round(2, big_default.roundUp);
        if (this.FVB.cmp(this.HFVB) == 1) {
          this.FVB = this.HFVB;
        }
        if (this.FVB.cmp(this.ZVBEZJ) == 1) {
          this.FVB = this.ZVBEZJ;
        }
        this.FVBSO = this.FVB.add(this.VBEZBSO.mul(this.TAB1[this.J]).div(this.ZAHL100)).round(2, big_default.roundUp);
        if (this.FVBSO.cmp(this.TAB2[this.J]) == 1) {
          this.FVBSO = this.TAB2[this.J];
        }
        this.HFVBZSO = this.VBEZB.add(this.VBEZBSO).div(this.ZAHL100).sub(this.FVBSO).round(2, big_default.roundDown);
        this.FVBZSO = this.FVBZ.add(this.VBEZBSO.div(this.ZAHL100)).round(0, big_default.roundUp);
        if (this.FVBZSO.cmp(this.HFVBZSO) == 1) {
          this.FVBZSO = this.HFVBZSO.round(0, big_default.roundUp);
        }
        if (this.FVBZSO.cmp(this.TAB3[this.J]) == 1) {
          this.FVBZSO = this.TAB3[this.J];
        }
        this.HFVBZ = this.VBEZB.div(this.ZAHL100).sub(this.FVB).round(2, big_default.roundDown);
        if (this.FVBZ.cmp(this.HFVBZ) == 1) {
          this.FVBZ = this.HFVBZ.round(0, big_default.roundUp);
        }
      }
      this.MRE4ALTE();
    }
    /**  Altersentlastungsbetrag (§ 39b Abs. 2 Satz 3 EStG), PAP Seite 18  */
    MRE4ALTE() {
      if (this.ALTER1 == 0) {
        this.ALTE = this.Z_0;
      } else {
        if (this.AJAHR < 2006) {
          this.K = 1;
        } else {
          if (this.AJAHR < 2040) {
            this.K = this.AJAHR - 2004;
          } else {
            this.K = 36;
          }
        }
        this.BMG = this.ZRE4J.sub(this.ZVBEZJ);
        this.ALTE = this.BMG.mul(this.TAB4[this.K]).round(0, big_default.roundUp);
        this.HBALTE = this.TAB5[this.K];
        if (this.ALTE.cmp(this.HBALTE) == 1) {
          this.ALTE = this.HBALTE;
        }
      }
    }
    /**  Ermittlung des Jahresarbeitslohns nach Abzug der Freibeträge nach § 39 b Abs. 2 Satz 3 und 4 EStG, PAP Seite 20  */
    MRE4ABZ() {
      this.ZRE4 = this.ZRE4J.sub(this.FVB).sub(this.ALTE).sub(this.JLFREIB).add(this.JLHINZU).round(2, big_default.roundDown);
      if (this.ZRE4.cmp(this.Z_0) == -1) {
        this.ZRE4 = this.Z_0;
      }
      this.ZRE4VP = this.ZRE4J;
      if (this.KENNVMT == 2) {
        this.ZRE4VP = this.ZRE4VP.sub(this.ENTSCH.div(this.ZAHL100)).round(2, big_default.roundDown);
      }
      this.ZVBEZ = this.ZVBEZJ.sub(this.FVB).round(2, big_default.roundDown);
      if (this.ZVBEZ.cmp(this.Z_0) == -1) {
        this.ZVBEZ = this.Z_0;
      }
    }
    /**  Berechnung fuer laufende Lohnzahlungszeitraueme Seite 21 */
    MBERECH() {
      this.MZTABFB();
      this.VFRB = this.ANP.add(this.FVB.add(this.FVBZ)).mul(this.ZAHL100).round(0, big_default.roundDown);
      this.MLSTJAHR();
      this.WVFRB = this.ZVE.sub(this.GFB).mul(this.ZAHL100).round(0, big_default.roundDown);
      if (this.WVFRB.cmp(this.Z_0) == -1) {
        this.WVFRB = new big_default(0);
      }
      this.LSTJAHR = this.ST.mul(new big_default(this.f)).round(0, big_default.roundDown);
      this.UPLSTLZZ();
      this.UPVKVLZZ();
      if (this.ZKF.cmp(this.Z_0) == 1) {
        this.ZTABFB = this.ZTABFB.add(this.KFB);
        this.MRE4ABZ();
        this.MLSTJAHR();
        this.JBMG = this.ST.mul(new big_default(this.f)).round(0, big_default.roundDown);
      } else {
        this.JBMG = this.LSTJAHR;
      }
      this.MSOLZ();
    }
    /**  Ermittlung der festen Tabellenfreibeträge (ohne Vorsorgepauschale), PAP Seite 22  */
    MZTABFB() {
      this.ANP = this.Z_0;
      if (this.ZVBEZ.cmp(this.Z_0) >= 0 && this.ZVBEZ.cmp(this.FVBZ) == -1) {
        this.FVBZ = new big_default(this.ZVBEZ.toNumber());
      }
      if (this.STKL < 6) {
        if (this.ZVBEZ.cmp(this.Z_0) == 1) {
          if (this.ZVBEZ.sub(this.FVBZ).cmp(new big_default(102)) == -1) {
            this.ANP = this.ZVBEZ.sub(this.FVBZ).round(0, big_default.roundUp);
          } else {
            this.ANP = new big_default(102);
          }
        }
      } else {
        this.FVBZ = new big_default(0);
        this.FVBZSO = new big_default(0);
      }
      if (this.STKL < 6) {
        if (this.ZRE4.cmp(this.ZVBEZ) == 1) {
          if (this.ZRE4.sub(this.ZVBEZ).cmp(new big_default(1230)) == -1) {
            this.ANP = this.ANP.add(this.ZRE4).sub(this.ZVBEZ).round(0, big_default.roundUp);
          } else {
            this.ANP = this.ANP.add(new big_default(1230));
          }
        }
      }
      this.KZTAB = 1;
      if (this.STKL == 1) {
        this.SAP = new big_default(36);
        this.KFB = this.ZKF.mul(new big_default(9312)).round(0, big_default.roundDown);
      } else {
        if (this.STKL == 2) {
          this.EFA = new big_default(4260);
          this.SAP = new big_default(36);
          this.KFB = this.ZKF.mul(new big_default(9312)).round(0, big_default.roundDown);
        } else {
          if (this.STKL == 3) {
            this.KZTAB = 2;
            this.SAP = new big_default(36);
            this.KFB = this.ZKF.mul(new big_default(9312)).round(0, big_default.roundDown);
          } else {
            if (this.STKL == 4) {
              this.SAP = new big_default(36);
              this.KFB = this.ZKF.mul(new big_default(4656)).round(0, big_default.roundDown);
            } else {
              if (this.STKL == 5) {
                this.SAP = new big_default(36);
                this.KFB = this.Z_0;
              } else {
                this.KFB = this.Z_0;
              }
            }
          }
        }
      }
      this.ZTABFB = this.EFA.add(this.ANP).add(this.SAP).add(this.FVBZ).round(2, big_default.roundDown);
    }
    /**  Ermittlung Jahreslohnsteuer, PAP Seite 23  */
    MLSTJAHR() {
      this.UPEVP();
      if (this.KENNVMT != 1) {
        this.ZVE = this.ZRE4.sub(this.ZTABFB).sub(this.VSP).round(2, big_default.roundDown);
        this.UPMLST();
      } else {
        this.ZVE = this.ZRE4.sub(this.ZTABFB).sub(this.VSP).sub(this.VMT.div(this.ZAHL100)).sub(this.VKAPA.div(this.ZAHL100)).round(2, big_default.roundDown);
        if (this.ZVE.cmp(this.Z_0) == -1) {
          this.ZVE = this.ZVE.add(this.VMT.div(this.ZAHL100)).add(this.VKAPA.div(this.ZAHL100)).div(this.ZAHL5).round(2, big_default.roundDown);
          this.UPMLST();
          this.ST = this.ST.mul(this.ZAHL5).round(0, big_default.roundDown);
        } else {
          this.UPMLST();
          this.STOVMT = this.ST;
          this.ZVE = this.ZVE.add(this.VMT.add(this.VKAPA).div(this.ZAHL500)).round(2, big_default.roundDown);
          this.UPMLST();
          this.ST = this.ST.sub(this.STOVMT).mul(this.ZAHL5).add(this.STOVMT).round(0, big_default.roundDown);
        }
      }
    }
    /**  PAP Seite 24  */
    UPVKVLZZ() {
      this.UPVKV();
      this.JW = this.VKV;
      this.UPANTEIL();
      this.VKVLZZ = this.ANTEIL1;
    }
    /**  PAP Seite 24  */
    UPVKV() {
      if (this.PKV > 0) {
        if (this.VSP2.cmp(this.VSP3) == 1) {
          this.VKV = this.VSP2.mul(this.ZAHL100);
        } else {
          this.VKV = this.VSP3.mul(this.ZAHL100);
        }
      } else {
        this.VKV = this.Z_0;
      }
    }
    /**  PAP Seite 25  */
    UPLSTLZZ() {
      this.JW = this.LSTJAHR.mul(this.ZAHL100);
      this.UPANTEIL();
      this.LSTLZZ = this.ANTEIL1;
    }
    /**  Ermittlung der Jahreslohnsteuer aus dem Einkommensteuertarif. PAP Seite 26  */
    UPMLST() {
      if (this.ZVE.cmp(this.ZAHL1) == -1) {
        this.ZVE = this.Z_0;
        this.X = this.Z_0;
      } else {
        this.X = this.ZVE.div(new big_default(this.KZTAB)).round(0, big_default.roundDown);
      }
      if (this.STKL < 5) {
        this.UPTAB24();
      } else {
        this.MST5_6();
      }
    }
    /**  	Vorsorgepauschale (§ 39b Absatz 2 Satz 5 Nummer 3 und Absatz 4 EStG) PAP Seite 27   */
    UPEVP() {
      if (this.KRV > 1) {
        this.VSP1 = this.Z_0;
      } else {
        if (this.ZRE4VP.cmp(this.BBGRV) == 1) {
          this.ZRE4VP = this.BBGRV;
        }
        this.VSP1 = this.ZRE4VP.mul(this.RVSATZAN).round(2, big_default.roundDown);
      }
      this.VSP2 = this.ZRE4VP.mul(new big_default(0.12)).round(2, big_default.roundDown);
      if (this.STKL == 3) {
        this.VHB = new big_default(3e3);
      } else {
        this.VHB = new big_default(1900);
      }
      if (this.VSP2.cmp(this.VHB) == 1) {
        this.VSP2 = this.VHB;
      }
      this.VSPN = this.VSP1.add(this.VSP2).round(0, big_default.roundUp);
      this.MVSP();
      if (this.VSPN.cmp(this.VSP) == 1) {
        this.VSP = this.VSPN.round(2, big_default.roundDown);
      }
    }
    /**  Vorsorgepauschale (§39b Abs. 2 Satz 5 Nr 3 EStG) Vergleichsberechnung fuer Guenstigerpruefung, PAP Seite 28  */
    MVSP() {
      if (this.ZRE4VP.cmp(this.BBGKVPV) == 1) {
        this.ZRE4VP = this.BBGKVPV;
      }
      if (this.PKV > 0) {
        if (this.STKL == 6) {
          this.VSP3 = this.Z_0;
        } else {
          this.VSP3 = this.PKPV.mul(this.ZAHL12).div(this.ZAHL100);
          if (this.PKV == 2) {
            this.VSP3 = this.VSP3.sub(this.ZRE4VP.mul(this.KVSATZAG.add(this.PVSATZAG))).round(2, big_default.roundDown);
          }
        }
      } else {
        this.VSP3 = this.ZRE4VP.mul(this.KVSATZAN.add(this.PVSATZAN)).round(2, big_default.roundDown);
      }
      this.VSP = this.VSP3.add(this.VSP1).round(0, big_default.roundUp);
    }
    /**  Lohnsteuer fuer die Steuerklassen V und VI (§ 39b Abs. 2 Satz 7 EStG), PAP Seite 29  */
    MST5_6() {
      this.ZZX = this.X;
      if (this.ZZX.cmp(this.W2STKL5) == 1) {
        this.ZX = this.W2STKL5;
        this.UP5_6();
        if (this.ZZX.cmp(this.W3STKL5) == 1) {
          this.ST = this.ST.add(this.W3STKL5.sub(this.W2STKL5).mul(new big_default(0.42))).round(0, big_default.roundDown);
          this.ST = this.ST.add(this.ZZX.sub(this.W3STKL5).mul(new big_default(0.45))).round(0, big_default.roundDown);
        } else {
          this.ST = this.ST.add(this.ZZX.sub(this.W2STKL5).mul(new big_default(0.42))).round(0, big_default.roundDown);
        }
      } else {
        this.ZX = this.ZZX;
        this.UP5_6();
        if (this.ZZX.cmp(this.W1STKL5) == 1) {
          this.VERGL = this.ST;
          this.ZX = this.W1STKL5;
          this.UP5_6();
          this.HOCH = this.ST.add(this.ZZX.sub(this.W1STKL5).mul(new big_default(0.42))).round(0, big_default.roundDown);
          if (this.HOCH.cmp(this.VERGL) == -1) {
            this.ST = this.HOCH;
          } else {
            this.ST = this.VERGL;
          }
        }
      }
    }
    /**  Unterprogramm zur Lohnsteuer fuer die Steuerklassen V und VI (§ 39b Abs. 2 Satz 7 EStG), PAP Seite 30  */
    UP5_6() {
      this.X = this.ZX.mul(new big_default(1.25)).round(2, big_default.roundDown);
      this.UPTAB24();
      this.ST1 = this.ST;
      this.X = this.ZX.mul(new big_default(0.75)).round(2, big_default.roundDown);
      this.UPTAB24();
      this.ST2 = this.ST;
      this.DIFF = this.ST1.sub(this.ST2).mul(this.ZAHL2);
      this.MIST = this.ZX.mul(new big_default(0.14)).round(0, big_default.roundDown);
      if (this.MIST.cmp(this.DIFF) == 1) {
        this.ST = this.MIST;
      } else {
        this.ST = this.DIFF;
      }
    }
    /**  Solidaritaetszuschlag, PAP Seite 31  */
    MSOLZ() {
      this.SOLZFREI = this.SOLZFREI.mul(new big_default(this.KZTAB));
      if (this.JBMG.cmp(this.SOLZFREI) == 1) {
        this.SOLZJ = this.JBMG.mul(new big_default(5.5)).div(this.ZAHL100).round(2, big_default.roundDown);
        this.SOLZMIN = this.JBMG.sub(this.SOLZFREI).mul(new big_default(11.9)).div(this.ZAHL100).round(2, big_default.roundDown);
        if (this.SOLZMIN.cmp(this.SOLZJ) == -1) {
          this.SOLZJ = this.SOLZMIN;
        }
        this.JW = this.SOLZJ.mul(this.ZAHL100).round(0, big_default.roundDown);
        this.UPANTEIL();
        this.SOLZLZZ = this.ANTEIL1;
      } else {
        this.SOLZLZZ = this.Z_0;
      }
      if (this.R > 0) {
        this.JW = this.JBMG.mul(this.ZAHL100);
        this.UPANTEIL();
        this.BK = this.ANTEIL1;
      } else {
        this.BK = this.Z_0;
      }
    }
    /**  Anteil von Jahresbetraegen fuer einen LZZ (§ 39b Abs. 2 Satz 9 EStG), PAP Seite 32  */
    UPANTEIL() {
      if (this.LZZ == 1) {
        this.ANTEIL1 = this.JW;
      } else {
        if (this.LZZ == 2) {
          this.ANTEIL1 = this.JW.div(this.ZAHL12).round(0, big_default.roundDown);
        } else {
          if (this.LZZ == 3) {
            this.ANTEIL1 = this.JW.mul(this.ZAHL7).div(this.ZAHL360).round(0, big_default.roundDown);
          } else {
            this.ANTEIL1 = this.JW.div(this.ZAHL360).round(0, big_default.roundDown);
          }
        }
      }
    }
    /**  Berechnung sonstiger Bezuege nach § 39b Abs. 3 Saetze 1 bis 8 EStG), PAP Seite 33  */
    MSONST() {
      this.LZZ = 1;
      if (this.ZMVB == 0) {
        this.ZMVB = 12;
      }
      if (this.SONSTB.cmp(this.Z_0) == 0 && this.MBV.cmp(this.Z_0) == 0) {
        this.VKVSONST = this.Z_0;
        this.LSTSO = this.Z_0;
        this.STS = this.Z_0;
        this.SOLZS = this.Z_0;
        this.BKS = this.Z_0;
      } else {
        this.MOSONST();
        this.UPVKV();
        this.VKVSONST = this.VKV;
        this.ZRE4J = this.JRE4.add(this.SONSTB).div(this.ZAHL100).round(2, big_default.roundDown);
        this.ZVBEZJ = this.JVBEZ.add(this.VBS).div(this.ZAHL100).round(2, big_default.roundDown);
        this.VBEZBSO = this.STERBE;
        this.MRE4SONST();
        this.MLSTJAHR();
        this.WVFRBM = this.ZVE.sub(this.GFB).mul(this.ZAHL100).round(2, big_default.roundDown);
        if (this.WVFRBM.cmp(this.Z_0) == -1) {
          this.WVFRBM = this.Z_0;
        }
        this.UPVKV();
        this.VKVSONST = this.VKV.sub(this.VKVSONST);
        this.LSTSO = this.ST.mul(this.ZAHL100);
        this.STS = this.LSTSO.sub(this.LSTOSO).mul(new big_default(this.f)).div(this.ZAHL100).round(0, big_default.roundDown).mul(this.ZAHL100);
        this.STSMIN();
      }
    }
    /**  Neu für 2022, PAP Seite 34  */
    STSMIN() {
      if (this.STS.cmp(this.Z_0) == -1) {
        if (this.MBV.cmp(this.Z_0) == 0) {
        } else {
          this.LSTLZZ = this.LSTLZZ.add(this.STS);
          if (this.LSTLZZ.cmp(this.Z_0) == -1) {
            this.LSTLZZ = this.Z_0;
          }
          this.SOLZLZZ = this.SOLZLZZ.add(this.STS.mul(new big_default(5.5).div(this.ZAHL100))).round(0, big_default.roundDown);
          if (this.SOLZLZZ.cmp(this.Z_0) == -1) {
            this.SOLZLZZ = this.Z_0;
          }
          this.BK = this.BK.add(this.STS);
          if (this.BK.cmp(this.Z_0) == -1) {
            this.BK = this.Z_0;
          }
        }
        this.STS = this.Z_0;
        this.SOLZS = this.Z_0;
      } else {
        this.MSOLZSTS();
      }
      if (this.R > 0) {
        this.BKS = this.STS;
      } else {
        this.BKS = this.Z_0;
      }
    }
    /**  Berechnung des SolZ auf sonstige Bezüge, PAP Seite 35, Neu ab 2021  */
    MSOLZSTS() {
      if (this.ZKF.cmp(this.Z_0) == 1) {
        this.SOLZSZVE = this.ZVE.sub(this.KFB);
      } else {
        this.SOLZSZVE = this.ZVE;
      }
      if (this.SOLZSZVE.cmp(this.ZAHL1) == -1) {
        this.SOLZSZVE = this.Z_0;
        this.X = this.Z_0;
      } else {
        this.X = this.SOLZSZVE.div(new big_default(this.KZTAB)).round(0, big_default.roundDown);
      }
      if (this.STKL < 5) {
        this.UPTAB24();
      } else {
        this.MST5_6();
      }
      this.SOLZSBMG = this.ST.mul(new big_default(this.f)).round(0, big_default.roundDown);
      if (this.SOLZSBMG.cmp(this.SOLZFREI) == 1) {
        this.SOLZS = this.STS.mul(new big_default(5.5)).div(this.ZAHL100).round(0, big_default.roundDown);
      } else {
        this.SOLZS = this.Z_0;
      }
    }
    /**  Berechnung der Verguetung fuer mehrjaehrige Taetigkeit nach § 39b Abs. 3 Satz 9 und 10 EStG), PAP Seite 36  */
    MVMT() {
      if (this.VKAPA.cmp(this.Z_0) == -1) {
        this.VKAPA = this.Z_0;
      }
      if (this.VMT.add(this.VKAPA).cmp(this.Z_0) == 1) {
        if (this.LSTSO.cmp(this.Z_0) == 0) {
          this.MOSONST();
          this.LST1 = this.LSTOSO;
        } else {
          this.LST1 = this.LSTSO;
        }
        this.VBEZBSO = this.STERBE.add(this.VKAPA);
        this.ZRE4J = this.JRE4.add(this.SONSTB).add(this.VMT).add(this.VKAPA).div(this.ZAHL100).round(2, big_default.roundDown);
        this.ZVBEZJ = this.JVBEZ.add(this.VBS).add(this.VKAPA).div(this.ZAHL100).round(2, big_default.roundDown);
        this.KENNVMT = 2;
        this.MRE4SONST();
        this.MLSTJAHR();
        this.LST3 = this.ST.mul(this.ZAHL100);
        this.MRE4ABZ();
        this.ZRE4VP = this.ZRE4VP.sub(this.JRE4ENT.div(this.ZAHL100)).sub(this.SONSTENT.div(this.ZAHL100));
        this.KENNVMT = 1;
        this.MLSTJAHR();
        this.LST2 = this.ST.mul(this.ZAHL100);
        this.STV = this.LST2.sub(this.LST1);
        this.LST3 = this.LST3.sub(this.LST1);
        if (this.LST3.cmp(this.STV) == -1) {
          this.STV = this.LST3;
        }
        if (this.STV.cmp(this.Z_0) == -1) {
          this.STV = this.Z_0;
        } else {
          this.STV = this.STV.mul(new big_default(this.f)).div(this.ZAHL100).round(0, big_default.roundDown).mul(this.ZAHL100);
        }
        this.SOLZVBMG = this.STV.div(this.ZAHL100).round(0, big_default.roundDown).add(this.JBMG);
        if (this.SOLZVBMG.cmp(this.SOLZFREI) == 1) {
          this.SOLZV = this.STV.mul(new big_default(5.5)).div(this.ZAHL100).round(0, big_default.roundDown);
        } else {
          this.SOLZV = this.Z_0;
        }
        if (this.R > 0) {
          this.BKV = this.STV;
        } else {
          this.BKV = this.Z_0;
        }
      } else {
        this.STV = this.Z_0;
        this.SOLZV = this.Z_0;
        this.BKV = this.Z_0;
      }
    }
    /**  Sonderberechnung ohne sonstige Bezüge für Berechnung bei sonstigen Bezügen oder Vergütung für mehrjährige Tätigkeit, PAP Seite 37  */
    MOSONST() {
      this.ZRE4J = this.JRE4.div(this.ZAHL100).round(2, big_default.roundDown);
      this.ZVBEZJ = this.JVBEZ.div(this.ZAHL100).round(2, big_default.roundDown);
      this.JLFREIB = this.JFREIB.div(this.ZAHL100).round(2, big_default.roundDown);
      this.JLHINZU = this.JHINZU.div(this.ZAHL100).round(2, big_default.roundDown);
      this.MRE4();
      this.MRE4ABZ();
      this.ZRE4VP = this.ZRE4VP.sub(this.JRE4ENT.div(this.ZAHL100));
      this.MZTABFB();
      this.VFRBS1 = this.ANP.add(this.FVB.add(this.FVBZ)).mul(this.ZAHL100).round(2, big_default.roundDown);
      this.MLSTJAHR();
      this.WVFRBO = this.ZVE.sub(this.GFB).mul(this.ZAHL100).round(2, big_default.roundDown);
      if (this.WVFRBO.cmp(this.Z_0) == -1) {
        this.WVFRBO = this.Z_0;
      }
      this.LSTOSO = this.ST.mul(this.ZAHL100);
    }
    /**  Sonderberechnung mit sonstige Bezüge für Berechnung bei sonstigen Bezügen oder Vergütung für mehrjährige Tätigkeit, PAP Seite 38  */
    MRE4SONST() {
      this.MRE4();
      this.FVB = this.FVBSO;
      this.MRE4ABZ();
      this.ZRE4VP = this.ZRE4VP.add(this.MBV.div(this.ZAHL100)).sub(this.JRE4ENT.div(this.ZAHL100)).sub(this.SONSTENT.div(this.ZAHL100));
      this.FVBZ = this.FVBZSO;
      this.MZTABFB();
      this.VFRBS2 = this.ANP.add(this.FVB).add(this.FVBZ).mul(this.ZAHL100).sub(this.VFRBS1);
    }
    /**  Komplett Neu 2020  */
    /**  Tarifliche Einkommensteuer §32a EStG, PAP Seite 39  */
    UPTAB24() {
      if (this.X.cmp(this.GFB.add(this.ZAHL1)) == -1) {
        this.ST = this.Z_0;
      } else {
        if (this.X.cmp(new big_default(17006)) == -1) {
          this.Y = this.X.sub(this.GFB).div(this.ZAHL10000).round(6, big_default.roundDown);
          this.RW = this.Y.mul(new big_default(922.98));
          this.RW = this.RW.add(new big_default(1400));
          this.ST = this.RW.mul(this.Y).round(0, big_default.roundDown);
        } else {
          if (this.X.cmp(new big_default(66761)) == -1) {
            this.Y = this.X.sub(new big_default(17005)).div(this.ZAHL10000).round(6, big_default.roundDown);
            this.RW = this.Y.mul(new big_default(181.19));
            this.RW = this.RW.add(new big_default(2397));
            this.RW = this.RW.mul(this.Y);
            this.ST = this.RW.add(new big_default(1025.38)).round(0, big_default.roundDown);
          } else {
            if (this.X.cmp(new big_default(277826)) == -1) {
              this.ST = this.X.mul(new big_default(0.42)).sub(new big_default(10602.13)).round(0, big_default.roundDown);
            } else {
              this.ST = this.X.mul(new big_default(0.45)).sub(new big_default(18936.88)).round(0, big_default.roundDown);
            }
          }
        }
      }
      this.ST = this.ST.mul(new big_default(this.KZTAB));
    }
    /**
     * Getter for af.
     * <p>
     *  1, wenn die Anwendung des Faktorverfahrens gewählt wurden (nur in Steuerklasse IV)
     * <p>
     * @return the value
     */
    getAf() {
      return this.af;
    }
    /**
     * Setter for af.
     * <p>
     *  1, wenn die Anwendung des Faktorverfahrens gewählt wurden (nur in Steuerklasse IV)
     * <p>
     * @param {number} af input value
     */
    setAf(af) {
      this.af = af;
    }
    /**
     * Getter for AJAHR.
     * <p>
     *  Auf die Vollendung des 64. Lebensjahres folgende
                 Kalenderjahr (erforderlich, wenn ALTER1=1)
     * <p>
     * @return the value
     */
    getAJAHR() {
      return this.AJAHR;
    }
    /**
     * Setter for AJAHR.
     * <p>
     *  Auf die Vollendung des 64. Lebensjahres folgende
                 Kalenderjahr (erforderlich, wenn ALTER1=1)
     * <p>
     * @param {number} AJAHR input value
     */
    setAJAHR(AJAHR) {
      this.AJAHR = AJAHR;
    }
    /**
     * Getter for ALTER1.
     * <p>
     *  1, wenn das 64. Lebensjahr zu Beginn des Kalenderjahres vollendet wurde, in dem
                 der Lohnzahlungszeitraum endet (§ 24 a EStG), sonst = 0
     * <p>
     * @return the value
     */
    getALTER1() {
      return this.ALTER1;
    }
    /**
     * Setter for ALTER1.
     * <p>
     *  1, wenn das 64. Lebensjahr zu Beginn des Kalenderjahres vollendet wurde, in dem
                 der Lohnzahlungszeitraum endet (§ 24 a EStG), sonst = 0
     * <p>
     * @param {number} ALTER1 input value
     */
    setALTER1(ALTER1) {
      this.ALTER1 = ALTER1;
    }
    /**
     * Getter for ENTSCH.
     * <p>
     *  in VKAPA und VMT enthaltene Entschädigungen nach §24 Nummer 1 EStG
                 sowie tarifermäßigt zu besteuernde Vorteile bei Vermögensbeteiligungen
                 (§ 19a Absatz 4 EStG) in Cent
     * <p>
     * @return the value
     */
    getENTSCH() {
      return this.ENTSCH;
    }
    /**
     * Setter for ENTSCH.
     * <p>
     *  in VKAPA und VMT enthaltene Entschädigungen nach §24 Nummer 1 EStG
                 sowie tarifermäßigt zu besteuernde Vorteile bei Vermögensbeteiligungen
                 (§ 19a Absatz 4 EStG) in Cent
     * <p>
     * @param {Big} ENTSCH input value
     */
    setENTSCH(ENTSCH) {
      this.ENTSCH = ENTSCH;
    }
    /**
     * Getter for f.
     * <p>
     *  eingetragener Faktor mit drei Nachkommastellen
     * <p>
     * @return the value
     */
    getF() {
      return this.f;
    }
    /**
     * Setter for f.
     * <p>
     *  eingetragener Faktor mit drei Nachkommastellen
     * <p>
     * @param {number} f input value
     */
    setF(f) {
      this.f = f;
    }
    /**
     * Getter for JFREIB.
     * <p>
     *  Jahresfreibetrag für die Ermittlung der Lohnsteuer für die sonstigen Bezüge
                 sowie für Vermögensbeteiligungen nach § 19a Absatz 1 und 4 EStG nach Maßgabe der
                 elektronischen Lohnsteuerabzugsmerkmale nach § 39e EStG oder der Eintragung
                 auf der Bescheinigung für den Lohnsteuerabzug 2024 in Cent (ggf. 0)
     * <p>
     * @return the value
     */
    getJFREIB() {
      return this.JFREIB;
    }
    /**
     * Setter for JFREIB.
     * <p>
     *  Jahresfreibetrag für die Ermittlung der Lohnsteuer für die sonstigen Bezüge
                 sowie für Vermögensbeteiligungen nach § 19a Absatz 1 und 4 EStG nach Maßgabe der
                 elektronischen Lohnsteuerabzugsmerkmale nach § 39e EStG oder der Eintragung
                 auf der Bescheinigung für den Lohnsteuerabzug 2024 in Cent (ggf. 0)
     * <p>
     * @param {Big} JFREIB input value
     */
    setJFREIB(JFREIB) {
      this.JFREIB = JFREIB;
    }
    /**
     * Getter for JHINZU.
     * <p>
     *  Jahreshinzurechnungsbetrag für die Ermittlung der Lohnsteuer für die sonstigen Bezüge
                 sowie für Vermögensbeteiligungen nach § 19a Absatz 1 und 4 EStG nach Maßgabe der
                 elektronischen Lohnsteuerabzugsmerkmale nach § 39e EStG oder der Eintragung auf der
                 Bescheinigung für den Lohnsteuerabzug 2024 in Cent (ggf. 0)
     * <p>
     * @return the value
     */
    getJHINZU() {
      return this.JHINZU;
    }
    /**
     * Setter for JHINZU.
     * <p>
     *  Jahreshinzurechnungsbetrag für die Ermittlung der Lohnsteuer für die sonstigen Bezüge
                 sowie für Vermögensbeteiligungen nach § 19a Absatz 1 und 4 EStG nach Maßgabe der
                 elektronischen Lohnsteuerabzugsmerkmale nach § 39e EStG oder der Eintragung auf der
                 Bescheinigung für den Lohnsteuerabzug 2024 in Cent (ggf. 0)
     * <p>
     * @param {Big} JHINZU input value
     */
    setJHINZU(JHINZU) {
      this.JHINZU = JHINZU;
    }
    /**
     * Getter for JRE4.
     * <p>
     *  Voraussichtlicher Jahresarbeitslohn ohne sonstige Bezüge (d.h. auch ohne Vergütung
                 für mehrjährige Tätigkeit und ohne die zu besteuernden Vorteile bei Vermögensbeteiligungen,
                 § 19a Absatz 4 EStG) in Cent.
                 Anmerkung: Die Eingabe dieses Feldes (ggf. 0) ist erforderlich bei Eingaben zu sonstigen
                 Bezügen (Felder SONSTB, VMT oder VKAPA).
                 Sind in einem vorangegangenen Abrechnungszeitraum bereits sonstige Bezüge gezahlt worden,
                 so sind sie dem voraussichtlichen Jahresarbeitslohn hinzuzurechnen. Gleiches gilt für zu
                 besteuernde Vorteile bei Vermögensbeteiligungen (§ 19a Absatz 4 EStG). Vergütungen für
                 mehrjährige Tätigkeit aus einem vorangegangenen Abrechnungszeitraum werden in voller
                 Höhe hinzugerechnet.
     * <p>
     * @return the value
     */
    getJRE4() {
      return this.JRE4;
    }
    /**
     * Setter for JRE4.
     * <p>
     *  Voraussichtlicher Jahresarbeitslohn ohne sonstige Bezüge (d.h. auch ohne Vergütung
                 für mehrjährige Tätigkeit und ohne die zu besteuernden Vorteile bei Vermögensbeteiligungen,
                 § 19a Absatz 4 EStG) in Cent.
                 Anmerkung: Die Eingabe dieses Feldes (ggf. 0) ist erforderlich bei Eingaben zu sonstigen
                 Bezügen (Felder SONSTB, VMT oder VKAPA).
                 Sind in einem vorangegangenen Abrechnungszeitraum bereits sonstige Bezüge gezahlt worden,
                 so sind sie dem voraussichtlichen Jahresarbeitslohn hinzuzurechnen. Gleiches gilt für zu
                 besteuernde Vorteile bei Vermögensbeteiligungen (§ 19a Absatz 4 EStG). Vergütungen für
                 mehrjährige Tätigkeit aus einem vorangegangenen Abrechnungszeitraum werden in voller
                 Höhe hinzugerechnet.
     * <p>
     * @param {Big} JRE4 input value
     */
    setJRE4(JRE4) {
      this.JRE4 = JRE4;
    }
    /**
     * Getter for JVBEZ.
     * <p>
     *  In JRE4 enthaltene Versorgungsbezuege in Cents (ggf. 0)
     * <p>
     * @return the value
     */
    getJVBEZ() {
      return this.JVBEZ;
    }
    /**
     * Setter for JVBEZ.
     * <p>
     *  In JRE4 enthaltene Versorgungsbezuege in Cents (ggf. 0)
     * <p>
     * @param {Big} JVBEZ input value
     */
    setJVBEZ(JVBEZ) {
      this.JVBEZ = JVBEZ;
    }
    /**
     * Getter for KRV.
     * <p>
     * Merker für die Vorsorgepauschale
                2 = der Arbeitnehmer ist NICHT in der gesetzlichen Rentenversicherung versichert.
                
                1 = der Arbeitnehmer ist in der gesetzlichen Rentenversicherung versichert, es gilt die
                    Beitragsbemessungsgrenze OST.
                    
                0 = der Arbeitnehmer ist in der gesetzlichen Rentenversicherung versichert, es gilt die
                    Beitragsbemessungsgrenze WEST.
     * <p>
     * @return the value
     */
    getKRV() {
      return this.KRV;
    }
    /**
     * Setter for KRV.
     * <p>
     * Merker für die Vorsorgepauschale
                2 = der Arbeitnehmer ist NICHT in der gesetzlichen Rentenversicherung versichert.
                
                1 = der Arbeitnehmer ist in der gesetzlichen Rentenversicherung versichert, es gilt die
                    Beitragsbemessungsgrenze OST.
                    
                0 = der Arbeitnehmer ist in der gesetzlichen Rentenversicherung versichert, es gilt die
                    Beitragsbemessungsgrenze WEST.
     * <p>
     * @param {number} KRV input value
     */
    setKRV(KRV) {
      this.KRV = KRV;
    }
    /**
     * Getter for KVZ.
     * <p>
     *  Kassenindividueller Zusatzbeitragssatz bei einem gesetzlich krankenversicherten Arbeitnehmer
             in Prozent (bspw. 1,70 für 1,70 %) mit 2 Dezimalstellen.
             Es ist der volle Zusatzbeitragssatz anzugeben. Die Aufteilung in Arbeitnehmer- und Arbeitgeber-
             anteil erfolgt im Programmablauf.
     * <p>
     * @return the value
     */
    getKVZ() {
      return this.KVZ;
    }
    /**
     * Setter for KVZ.
     * <p>
     *  Kassenindividueller Zusatzbeitragssatz bei einem gesetzlich krankenversicherten Arbeitnehmer
             in Prozent (bspw. 1,70 für 1,70 %) mit 2 Dezimalstellen.
             Es ist der volle Zusatzbeitragssatz anzugeben. Die Aufteilung in Arbeitnehmer- und Arbeitgeber-
             anteil erfolgt im Programmablauf.
     * <p>
     * @param {Big} KVZ input value
     */
    setKVZ(KVZ) {
      this.KVZ = KVZ;
    }
    /**
     * Getter for LZZ.
     * <p>
     *  Lohnzahlungszeitraum:
                 1 = Jahr
                 2 = Monat
                 3 = Woche
                 4 = Tag
     * <p>
     * @return the value
     */
    getLZZ() {
      return this.LZZ;
    }
    /**
     * Setter for LZZ.
     * <p>
     *  Lohnzahlungszeitraum:
                 1 = Jahr
                 2 = Monat
                 3 = Woche
                 4 = Tag
     * <p>
     * @param {number} LZZ input value
     */
    setLZZ(LZZ) {
      this.LZZ = LZZ;
    }
    /**
     * Getter for LZZFREIB.
     * <p>
     *  Der als elektronisches Lohnsteuerabzugsmerkmal für den Arbeitgeber nach § 39e EStG festgestellte
                 oder in der Bescheinigung für den Lohnsteuerabzug 2024 eingetragene Freibetrag für den
                 Lohnzahlungszeitraum in Cent
     * <p>
     * @return the value
     */
    getLZZFREIB() {
      return this.LZZFREIB;
    }
    /**
     * Setter for LZZFREIB.
     * <p>
     *  Der als elektronisches Lohnsteuerabzugsmerkmal für den Arbeitgeber nach § 39e EStG festgestellte
                 oder in der Bescheinigung für den Lohnsteuerabzug 2024 eingetragene Freibetrag für den
                 Lohnzahlungszeitraum in Cent
     * <p>
     * @param {Big} LZZFREIB input value
     */
    setLZZFREIB(LZZFREIB) {
      this.LZZFREIB = LZZFREIB;
    }
    /**
     * Getter for LZZHINZU.
     * <p>
     *  Der als elektronisches Lohnsteuerabzugsmerkmal für den Arbeitgeber nach § 39e EStG festgestellte
                 oder in der Bescheinigung für den Lohnsteuerabzug 2024 eingetragene Hinzurechnungsbetrag für den
                 Lohnzahlungszeitraum in Cent
     * <p>
     * @return the value
     */
    getLZZHINZU() {
      return this.LZZHINZU;
    }
    /**
     * Setter for LZZHINZU.
     * <p>
     *  Der als elektronisches Lohnsteuerabzugsmerkmal für den Arbeitgeber nach § 39e EStG festgestellte
                 oder in der Bescheinigung für den Lohnsteuerabzug 2024 eingetragene Hinzurechnungsbetrag für den
                 Lohnzahlungszeitraum in Cent
     * <p>
     * @param {Big} LZZHINZU input value
     */
    setLZZHINZU(LZZHINZU) {
      this.LZZHINZU = LZZHINZU;
    }
    /**
     * Getter for MBV.
     * <p>
     *  Nicht zu besteuernde Vorteile bei Vermögensbeteiligungen
                 (§ 19a Absatz 1 Satz 4 EStG) in Cent
     * <p>
     * @return the value
     */
    getMBV() {
      return this.MBV;
    }
    /**
     * Setter for MBV.
     * <p>
     *  Nicht zu besteuernde Vorteile bei Vermögensbeteiligungen
                 (§ 19a Absatz 1 Satz 4 EStG) in Cent
     * <p>
     * @param {Big} MBV input value
     */
    setMBV(MBV) {
      this.MBV = MBV;
    }
    /**
     * Getter for PKPV.
     * <p>
     *  Dem Arbeitgeber mitgeteilte Zahlungen des Arbeitnehmers zur privaten
                 Kranken- bzw. Pflegeversicherung im Sinne des §10 Abs. 1 Nr. 3 EStG 2010
                 als Monatsbetrag in Cent (der Wert ist inabhängig vom Lohnzahlungszeitraum immer
                 als Monatsbetrag anzugeben).
     * <p>
     * @return the value
     */
    getPKPV() {
      return this.PKPV;
    }
    /**
     * Setter for PKPV.
     * <p>
     *  Dem Arbeitgeber mitgeteilte Zahlungen des Arbeitnehmers zur privaten
                 Kranken- bzw. Pflegeversicherung im Sinne des §10 Abs. 1 Nr. 3 EStG 2010
                 als Monatsbetrag in Cent (der Wert ist inabhängig vom Lohnzahlungszeitraum immer
                 als Monatsbetrag anzugeben).
     * <p>
     * @param {Big} PKPV input value
     */
    setPKPV(PKPV) {
      this.PKPV = PKPV;
    }
    /**
     * Getter for PKV.
     * <p>
     *  Krankenversicherung:
                 0 = gesetzlich krankenversicherte Arbeitnehmer
                 1 = ausschließlich privat krankenversicherte Arbeitnehmer OHNE Arbeitgeberzuschuss
                 2 = ausschließlich privat krankenversicherte Arbeitnehmer MIT Arbeitgeberzuschuss
     * <p>
     * @return the value
     */
    getPKV() {
      return this.PKV;
    }
    /**
     * Setter for PKV.
     * <p>
     *  Krankenversicherung:
                 0 = gesetzlich krankenversicherte Arbeitnehmer
                 1 = ausschließlich privat krankenversicherte Arbeitnehmer OHNE Arbeitgeberzuschuss
                 2 = ausschließlich privat krankenversicherte Arbeitnehmer MIT Arbeitgeberzuschuss
     * <p>
     * @param {number} PKV input value
     */
    setPKV(PKV) {
      this.PKV = PKV;
    }
    /**
     * Getter for PVA.
     * <p>
     *  Zahl der beim Arbeitnehmer zu berücksichtigenden Beitragsabschläge in der sozialen Pflegeversicherung
                 bei mehr als einem Kind
                 0 = kein Abschlag
                 1 = Beitragsabschlag für das 2. Kind
                 2 = Beitragsabschläge für das 2. und 3. Kind
                 3 = Beitragsabschläge für 2. bis 4. Kinder
                 4 = Beitragsabschläge für 2. bis 5. oder mehr Kinder
     * <p>
     * @return the value
     */
    getPVA() {
      return this.PVA;
    }
    /**
     * Setter for PVA.
     * <p>
     *  Zahl der beim Arbeitnehmer zu berücksichtigenden Beitragsabschläge in der sozialen Pflegeversicherung
                 bei mehr als einem Kind
                 0 = kein Abschlag
                 1 = Beitragsabschlag für das 2. Kind
                 2 = Beitragsabschläge für das 2. und 3. Kind
                 3 = Beitragsabschläge für 2. bis 4. Kinder
                 4 = Beitragsabschläge für 2. bis 5. oder mehr Kinder
     * <p>
     * @param {Big} PVA input value
     */
    setPVA(PVA) {
      this.PVA = PVA;
    }
    /**
     * Getter for PVS.
     * <p>
     *  1, wenn bei der sozialen Pflegeversicherung die Besonderheiten in Sachsen zu berücksichtigen sind bzw.
                    zu berücksichtigen wären, sonst 0.
     * <p>
     * @return the value
     */
    getPVS() {
      return this.PVS;
    }
    /**
     * Setter for PVS.
     * <p>
     *  1, wenn bei der sozialen Pflegeversicherung die Besonderheiten in Sachsen zu berücksichtigen sind bzw.
                    zu berücksichtigen wären, sonst 0.
     * <p>
     * @param {number} PVS input value
     */
    setPVS(PVS) {
      this.PVS = PVS;
    }
    /**
     * Getter for PVZ.
     * <p>
     *  1, wenn er der Arbeitnehmer den Zuschlag zur sozialen Pflegeversicherung
                    zu zahlen hat, sonst 0.
     * <p>
     * @return the value
     */
    getPVZ() {
      return this.PVZ;
    }
    /**
     * Setter for PVZ.
     * <p>
     *  1, wenn er der Arbeitnehmer den Zuschlag zur sozialen Pflegeversicherung
                    zu zahlen hat, sonst 0.
     * <p>
     * @param {number} PVZ input value
     */
    setPVZ(PVZ) {
      this.PVZ = PVZ;
    }
    /**
     * Getter for R.
     * <p>
     *  Religionsgemeinschaft des Arbeitnehmers lt. elektronischer Lohnsteuerabzugsmerkmale oder der
                 Bescheinigung für den Lohnsteuerabzug 2024 (bei keiner Religionszugehörigkeit = 0)
     * <p>
     * @return the value
     */
    getR() {
      return this.R;
    }
    /**
     * Setter for R.
     * <p>
     *  Religionsgemeinschaft des Arbeitnehmers lt. elektronischer Lohnsteuerabzugsmerkmale oder der
                 Bescheinigung für den Lohnsteuerabzug 2024 (bei keiner Religionszugehörigkeit = 0)
     * <p>
     * @param {number} R input value
     */
    setR(R) {
      this.R = R;
    }
    /**
     * Getter for RE4.
     * <p>
     *  Steuerpflichtiger Arbeitslohn für den Lohnzahlungszeitraum vor Berücksichtigung des
                 Versorgungsfreibetrags und des Zuschlags zum Versorgungsfreibetrag, des Altersentlastungsbetrags
                 und des als elektronisches Lohnsteuerabzugsmerkmal festgestellten oder in der Bescheinigung für
                 den Lohnsteuerabzug 2024 für den Lohnzahlungszeitraum eingetragenen Freibetrags bzw.
                 Hinzurechnungsbetrags in Cent
     * <p>
     * @return the value
     */
    getRE4() {
      return this.RE4;
    }
    /**
     * Setter for RE4.
     * <p>
     *  Steuerpflichtiger Arbeitslohn für den Lohnzahlungszeitraum vor Berücksichtigung des
                 Versorgungsfreibetrags und des Zuschlags zum Versorgungsfreibetrag, des Altersentlastungsbetrags
                 und des als elektronisches Lohnsteuerabzugsmerkmal festgestellten oder in der Bescheinigung für
                 den Lohnsteuerabzug 2024 für den Lohnzahlungszeitraum eingetragenen Freibetrags bzw.
                 Hinzurechnungsbetrags in Cent
     * <p>
     * @param {Big} RE4 input value
     */
    setRE4(RE4) {
      this.RE4 = RE4;
    }
    /**
     * Getter for SONSTB.
     * <p>
     *  Sonstige Bezüge (ohne Vergütung aus mehrjähriger Tätigkeit) einschließlich nicht tarifermäßigt
                 zu besteuernde Vorteile bei Vermögensbeteiligungen und Sterbegeld bei Versorgungsbezügen sowie
                 Kapitalauszahlungen/Abfindungen, soweit es sich nicht um Bezüge für mehrere Jahre handelt,
                 in Cent (ggf. 0)
     * <p>
     * @return the value
     */
    getSONSTB() {
      return this.SONSTB;
    }
    /**
     * Setter for SONSTB.
     * <p>
     *  Sonstige Bezüge (ohne Vergütung aus mehrjähriger Tätigkeit) einschließlich nicht tarifermäßigt
                 zu besteuernde Vorteile bei Vermögensbeteiligungen und Sterbegeld bei Versorgungsbezügen sowie
                 Kapitalauszahlungen/Abfindungen, soweit es sich nicht um Bezüge für mehrere Jahre handelt,
                 in Cent (ggf. 0)
     * <p>
     * @param {Big} SONSTB input value
     */
    setSONSTB(SONSTB) {
      this.SONSTB = SONSTB;
    }
    /**
     * Getter for STERBE.
     * <p>
     *  Sterbegeld bei Versorgungsbezuegen sowie Kapitalauszahlungen/Abfindungen,
                 soweit es sich nicht um Bezuege fuer mehrere Jahre handelt
                 (in SONSTB enthalten) in Cents
     * <p>
     * @return the value
     */
    getSTERBE() {
      return this.STERBE;
    }
    /**
     * Setter for STERBE.
     * <p>
     *  Sterbegeld bei Versorgungsbezuegen sowie Kapitalauszahlungen/Abfindungen,
                 soweit es sich nicht um Bezuege fuer mehrere Jahre handelt
                 (in SONSTB enthalten) in Cents
     * <p>
     * @param {Big} STERBE input value
     */
    setSTERBE(STERBE) {
      this.STERBE = STERBE;
    }
    /**
     * Getter for STKL.
     * <p>
     *  Steuerklasse:
                 1 = I
                 2 = II
                 3 = III
                 4 = IV
                 5 = V
                 6 = VI
     * <p>
     * @return the value
     */
    getSTKL() {
      return this.STKL;
    }
    /**
     * Setter for STKL.
     * <p>
     *  Steuerklasse:
                 1 = I
                 2 = II
                 3 = III
                 4 = IV
                 5 = V
                 6 = VI
     * <p>
     * @param {number} STKL input value
     */
    setSTKL(STKL) {
      this.STKL = STKL;
    }
    /**
     * Getter for VBEZ.
     * <p>
     *  In RE4 enthaltene Versorgungsbezuege in Cents (ggf. 0)
     * <p>
     * @return the value
     */
    getVBEZ() {
      return this.VBEZ;
    }
    /**
     * Setter for VBEZ.
     * <p>
     *  In RE4 enthaltene Versorgungsbezuege in Cents (ggf. 0)
     * <p>
     * @param {Big} VBEZ input value
     */
    setVBEZ(VBEZ) {
      this.VBEZ = VBEZ;
    }
    /**
     * Getter for VBEZM.
     * <p>
     *  Vorsorgungsbezug im Januar 2005 bzw. fuer den ersten vollen Monat
                 in Cents
     * <p>
     * @return the value
     */
    getVBEZM() {
      return this.VBEZM;
    }
    /**
     * Setter for VBEZM.
     * <p>
     *  Vorsorgungsbezug im Januar 2005 bzw. fuer den ersten vollen Monat
                 in Cents
     * <p>
     * @param {Big} VBEZM input value
     */
    setVBEZM(VBEZM) {
      this.VBEZM = VBEZM;
    }
    /**
     * Getter for VBEZS.
     * <p>
     *  Voraussichtliche Sonderzahlungen im Kalenderjahr des Versorgungsbeginns
                 bei Versorgungsempfaengern ohne Sterbegeld, Kapitalauszahlungen/Abfindungen
                 bei Versorgungsbezuegen in Cents
     * <p>
     * @return the value
     */
    getVBEZS() {
      return this.VBEZS;
    }
    /**
     * Setter for VBEZS.
     * <p>
     *  Voraussichtliche Sonderzahlungen im Kalenderjahr des Versorgungsbeginns
                 bei Versorgungsempfaengern ohne Sterbegeld, Kapitalauszahlungen/Abfindungen
                 bei Versorgungsbezuegen in Cents
     * <p>
     * @param {Big} VBEZS input value
     */
    setVBEZS(VBEZS) {
      this.VBEZS = VBEZS;
    }
    /**
     * Getter for VBS.
     * <p>
     *  In SONSTB enthaltene Versorgungsbezuege einschliesslich Sterbegeld
                in Cents (ggf. 0)
     * <p>
     * @return the value
     */
    getVBS() {
      return this.VBS;
    }
    /**
     * Setter for VBS.
     * <p>
     *  In SONSTB enthaltene Versorgungsbezuege einschliesslich Sterbegeld
                in Cents (ggf. 0)
     * <p>
     * @param {Big} VBS input value
     */
    setVBS(VBS) {
      this.VBS = VBS;
    }
    /**
     * Getter for VJAHR.
     * <p>
     *  Jahr, in dem der Versorgungsbezug erstmalig gewaehrt wurde; werden
                 mehrere Versorgungsbezuege gezahlt, so gilt der aelteste erstmalige Bezug
     * <p>
     * @return the value
     */
    getVJAHR() {
      return this.VJAHR;
    }
    /**
     * Setter for VJAHR.
     * <p>
     *  Jahr, in dem der Versorgungsbezug erstmalig gewaehrt wurde; werden
                 mehrere Versorgungsbezuege gezahlt, so gilt der aelteste erstmalige Bezug
     * <p>
     * @param {number} VJAHR input value
     */
    setVJAHR(VJAHR) {
      this.VJAHR = VJAHR;
    }
    /**
     * Getter for VKAPA.
     * <p>
     *  Kapitalauszahlungen / Abfindungen / Nachzahlungen bei Versorgungsbezügen
                 für mehrere Jahre in Cent (ggf. 0)
     * <p>
     * @return the value
     */
    getVKAPA() {
      return this.VKAPA;
    }
    /**
     * Setter for VKAPA.
     * <p>
     *  Kapitalauszahlungen / Abfindungen / Nachzahlungen bei Versorgungsbezügen
                 für mehrere Jahre in Cent (ggf. 0)
     * <p>
     * @param {Big} VKAPA input value
     */
    setVKAPA(VKAPA) {
      this.VKAPA = VKAPA;
    }
    /**
     * Getter for VMT.
     * <p>
     *  Entschädigungen und Vergütung für mehrjährige Tätigkeit sowie tarifermäßigt
                 zu besteuernde Vorteile bei Vermögensbeteiligungen (§ 19a Absatz 4 Satz 2 EStG)
                 ohne Kapitalauszahlungen und ohne Abfindungen bei Versorgungsbezügen
                 in Cent (ggf. 0)
     * <p>
     * @return the value
     */
    getVMT() {
      return this.VMT;
    }
    /**
     * Setter for VMT.
     * <p>
     *  Entschädigungen und Vergütung für mehrjährige Tätigkeit sowie tarifermäßigt
                 zu besteuernde Vorteile bei Vermögensbeteiligungen (§ 19a Absatz 4 Satz 2 EStG)
                 ohne Kapitalauszahlungen und ohne Abfindungen bei Versorgungsbezügen
                 in Cent (ggf. 0)
     * <p>
     * @param {Big} VMT input value
     */
    setVMT(VMT) {
      this.VMT = VMT;
    }
    /**
     * Getter for ZKF.
     * <p>
     *  Zahl der Freibetraege fuer Kinder (eine Dezimalstelle, nur bei Steuerklassen
                 I, II, III und IV)
     * <p>
     * @return the value
     */
    getZKF() {
      return this.ZKF;
    }
    /**
     * Setter for ZKF.
     * <p>
     *  Zahl der Freibetraege fuer Kinder (eine Dezimalstelle, nur bei Steuerklassen
                 I, II, III und IV)
     * <p>
     * @param {Big} ZKF input value
     */
    setZKF(ZKF) {
      this.ZKF = ZKF;
    }
    /**
     * Getter for ZMVB.
     * <p>
     *  Zahl der Monate, fuer die Versorgungsbezuege gezahlt werden (nur
                 erforderlich bei Jahresberechnung (LZZ = 1)
     * <p>
     * @return the value
     */
    getZMVB() {
      return this.ZMVB;
    }
    /**
     * Setter for ZMVB.
     * <p>
     *  Zahl der Monate, fuer die Versorgungsbezuege gezahlt werden (nur
                 erforderlich bei Jahresberechnung (LZZ = 1)
     * <p>
     * @param {number} ZMVB input value
     */
    setZMVB(ZMVB) {
      this.ZMVB = ZMVB;
    }
    /**
     * Getter for JRE4ENT.
     * <p>
     *  In JRE4 enthaltene Entschädigungen nach § 24 Nummer 1 EStG und zu besteuernde
                 Vorteile bei Vermögensbeteiligungen (§ 19a Absatz 4 EStG in Cent
     * <p>
     * @return the value
     */
    getJRE4ENT() {
      return this.JRE4ENT;
    }
    /**
     * Setter for JRE4ENT.
     * <p>
     *  In JRE4 enthaltene Entschädigungen nach § 24 Nummer 1 EStG und zu besteuernde
                 Vorteile bei Vermögensbeteiligungen (§ 19a Absatz 4 EStG in Cent
     * <p>
     * @param {Big} JRE4ENT input value
     */
    setJRE4ENT(JRE4ENT) {
      this.JRE4ENT = JRE4ENT;
    }
    /**
     * Getter for SONSTENT.
     * <p>
     *  In SONSTB enthaltene Entschädigungen nach § 24 Nummer 1 EStG sowie nicht
                 tarifermäßigt zu besteuernde Vorteile bei Vermögensbeteiligungen in Cent
     * <p>
     * @return the value
     */
    getSONSTENT() {
      return this.SONSTENT;
    }
    /**
     * Setter for SONSTENT.
     * <p>
     *  In SONSTB enthaltene Entschädigungen nach § 24 Nummer 1 EStG sowie nicht
                 tarifermäßigt zu besteuernde Vorteile bei Vermögensbeteiligungen in Cent
     * <p>
     * @param {Big} SONSTENT input value
     */
    setSONSTENT(SONSTENT) {
      this.SONSTENT = SONSTENT;
    }
    /**
     * Getter for BK.
     * <p>
     *  Bemessungsgrundlage fuer die Kirchenlohnsteuer in Cents
     * <p>
     * @return the value
     */
    getBK() {
      return this.BK;
    }
    /**
     * Getter for BKS.
     * <p>
     *  Bemessungsgrundlage der sonstigen Bezüge (ohne Vergütung für mehrjährige Tätigkeit)
                 für die Kirchenlohnsteuer in Cent.
                 Hinweis: Negativbeträge, die aus nicht zu besteuernden Vorteilen bei
                 Vermögensbeteiligungen (§ 19a Absatz 1 Satz 4 EStG) resultieren, mindern BK
                 (maximal bis 0). Der Sonderausgabenabzug für tatsächlich erbrachte Vorsorgeaufwendungen
                 im Rahmen der Veranlagung zur Einkommensteuer bleibt unberührt.
     * <p>
     * @return the value
     */
    getBKS() {
      return this.BKS;
    }
    /**
     * Getter for BKV.
     * <p>
     *  Bemessungsgrundlage der Vergütung für mehrjährige Tätigkeit und der tarifermäßigt
                 zu besteuernden Vorteile bei Vermögensbeteiligungen für die Kirchenlohnsteuer in Cent
     * <p>
     * @return the value
     */
    getBKV() {
      return this.BKV;
    }
    /**
     * Getter for LSTLZZ.
     * <p>
     *  Fuer den Lohnzahlungszeitraum einzubehaltende Lohnsteuer in Cents
     * <p>
     * @return the value
     */
    getLSTLZZ() {
      return this.LSTLZZ;
    }
    /**
     * Getter for SOLZLZZ.
     * <p>
     *  Fuer den Lohnzahlungszeitraum einzubehaltender Solidaritaetszuschlag
                 in Cents
     * <p>
     * @return the value
     */
    getSOLZLZZ() {
      return this.SOLZLZZ;
    }
    /**
     * Getter for SOLZS.
     * <p>
     *  Solidaritätszuschlag für sonstige Bezüge (ohne Vergütung für mehrjährige Tätigkeit in Cent.
                 Hinweis: Negativbeträge, die aus nicht zu besteuernden Vorteilen bei Vermögensbeteiligungen
                 (§ 19a Absatz 1 Satz 4 EStG) resultieren, mindern SOLZLZZ (maximal bis 0). Der
                 Sonderausgabenabzug für tatsächlich erbrachte Vorsorgeaufwendungen im Rahmen der
                 Veranlagung zur Einkommensteuer bleibt unberührt.
     * <p>
     * @return the value
     */
    getSOLZS() {
      return this.SOLZS;
    }
    /**
     * Getter for SOLZV.
     * <p>
     *  Solidaritätszuschlag für die Vergütung für mehrjährige Tätigkeit und der tarifermäßigt
                 zu besteuernden Vorteile bei Vermögensbeteiligungen in Cent
     * <p>
     * @return the value
     */
    getSOLZV() {
      return this.SOLZV;
    }
    /**
     * Getter for STS.
     * <p>
     *  Lohnsteuer für sonstige Bezüge (ohne Vergütung für mehrjährige Tätigkeit und ohne
                 tarifermäßigt zu besteuernde Vorteile bei Vermögensbeteiligungen) in Cent
                 Hinweis: Negativbeträge, die aus nicht zu besteuernden Vorteilen bei Vermögensbeteiligungen
                 (§ 19a Absatz 1 Satz 4 EStG) resultieren, mindern LSTLZZ (maximal bis 0). Der
                 Sonderausgabenabzug für tatsächlich erbrachte Vorsorgeaufwendungen im Rahmen der
                 Veranlagung zur Einkommensteuer bleibt unberührt.
     * <p>
     * @return the value
     */
    getSTS() {
      return this.STS;
    }
    /**
     * Getter for STV.
     * <p>
     *  Lohnsteuer für die Vergütung für mehrjährige Tätigkeit und der tarifermäßigt zu besteuernden
                 Vorteile bei Vermögensbeteiligungen in Cent
     * <p>
     * @return the value
     */
    getSTV() {
      return this.STV;
    }
    /**
     * Getter for VKVLZZ.
     * <p>
     *  Für den Lohnzahlungszeitraum berücksichtigte Beiträge des Arbeitnehmers zur
                 privaten Basis-Krankenversicherung und privaten Pflege-Pflichtversicherung (ggf. auch
                 die Mindestvorsorgepauschale) in Cent beim laufenden Arbeitslohn. Für Zwecke der Lohn-
                 steuerbescheinigung sind die einzelnen Ausgabewerte außerhalb des eigentlichen Lohn-
                 steuerbescheinigungsprogramms zu addieren; hinzuzurechnen sind auch die Ausgabewerte
                 VKVSONST
     * <p>
     * @return the value
     */
    getVKVLZZ() {
      return this.VKVLZZ;
    }
    /**
     * Getter for VKVSONST.
     * <p>
     *  Für den Lohnzahlungszeitraum berücksichtigte Beiträge des Arbeitnehmers
                 zur privaten Basis-Krankenversicherung und privaten Pflege-Pflichtversicherung (ggf.
                 auch die Mindestvorsorgepauschale) in Cent bei sonstigen Bezügen. Der Ausgabewert kann
                 auch negativ sein. Für tarifermäßigt zu besteuernde Vergütungen für mehrjährige
                 Tätigkeiten enthält der PAP keinen entsprechenden Ausgabewert.
     * <p>
     * @return the value
     */
    getVKVSONST() {
      return this.VKVSONST;
    }
    /**
     * Getter for VFRB.
     * <p>
     *  Verbrauchter Freibetrag bei Berechnung des laufenden Arbeitslohns, in Cent
     * <p>
     * @return the value
     */
    getVFRB() {
      return this.VFRB;
    }
    /**
     * Getter for VFRBS1.
     * <p>
     *  Verbrauchter Freibetrag bei Berechnung des voraussichtlichen Jahresarbeitslohns, in Cent
     * <p>
     * @return the value
     */
    getVFRBS1() {
      return this.VFRBS1;
    }
    /**
     * Getter for VFRBS2.
     * <p>
     *  Verbrauchter Freibetrag bei Berechnung der sonstigen Bezüge, in Cent
     * <p>
     * @return the value
     */
    getVFRBS2() {
      return this.VFRBS2;
    }
    /**
     * Getter for WVFRB.
     * <p>
     *  Für die weitergehende Berücksichtigung des Steuerfreibetrags nach dem DBA Türkei verfügbares ZVE über
                dem Grundfreibetrag bei der Berechnung des laufenden Arbeitslohns, in Cent
     * <p>
     * @return the value
     */
    getWVFRB() {
      return this.WVFRB;
    }
    /**
     * Getter for WVFRBO.
     * <p>
     *  Für die weitergehende Berücksichtigung des Steuerfreibetrags nach dem DBA Türkei verfügbares ZVE über dem Grundfreibetrag
                bei der Berechnung des voraussichtlichen Jahresarbeitslohns, in Cent
     * <p>
     * @return the value
     */
    getWVFRBO() {
      return this.WVFRBO;
    }
    /**
     * Getter for WVFRBM.
     * <p>
     *  Für die weitergehende Berücksichtigung des Steuerfreibetrags nach dem DBA Türkei verfügbares ZVE
                über dem Grundfreibetrag bei der Berechnung der sonstigen Bezüge, in Cent
     * <p>
     * @return the value
     */
    getWVFRBM() {
      return this.WVFRBM;
    }
    /**
     * Initialize all inputs values with zero.
     */
    initInputs() {
      this.ENTSCH = this.JFREIB = this.JHINZU = this.JRE4 = this.JVBEZ = this.KVZ = this.LZZFREIB = this.LZZHINZU = this.MBV = this.PKPV = this.PVA = this.RE4 = this.SONSTB = this.STERBE = this.VBEZ = this.VBEZM = this.VBEZS = this.VBS = this.VKAPA = this.VMT = this.ZKF = this.JRE4ENT = this.SONSTENT = this.Z_0;
      this.af = this.AJAHR = this.ALTER1 = this.f = this.KRV = this.LZZ = this.PKV = this.PVS = this.PVZ = this.R = this.STKL = this.VJAHR = this.ZMVB = 0;
    }
    // not realy clean, but for ts compiler
    isBigInput(name, value) {
      return value instanceof big_default;
    }
    /**
     * Setter for Big or number input parameters.
     *
     * @param {string} name Variable name to set.
     * @param {number} value Value to set.
     */
    set(name, value) {
      if (!this.hasOwnProperty(name)) {
        throw new Error("Unknown parameter " + name);
      }
      if (this.isBigInput(name, value)) {
        if (value instanceof big_default) {
          this[name] = value;
        }
      } else if (!(value instanceof big_default)) {
        this[name] = value;
      }
    }
    /**
     * Getter for all output parameters. You get a value of type "number or "Big".
     *
     * @param {string} name Variable name to get.
     */
    get(name) {
      if (this.hasOwnProperty(name)) {
        return this[name];
      }
      throw new Error("Unknown parameter " + name);
    }
    /**
     * Get all fields with types.
     */
    getDirectory() {
      return _Lohnsteuer2024.typeDirectory;
    }
    /**
     * Converts a value (number or Big) in the correct type (number or Big).
     *
     * @param {string} name the name of the value
     * @param {TaxJsValueType} value the value to convert
     */
    toType(name, value) {
      const info = _Lohnsteuer2024.typeDirectory[name];
      if (!info) {
        throw new Error("Unknown parameter " + name);
      }
      if (typeof value == "number" && info.type != "number") {
        return new big_default(value);
      }
      if (typeof value == "object" && info.type == "number") {
        return value.toNumber();
      }
      return value;
    }
  };
  Lohnsteuer2024._n = "number";
  Lohnsteuer2024._b = "Big";
  Lohnsteuer2024._i = "input";
  Lohnsteuer2024._o = "output";
  Lohnsteuer2024._s = "STANDARD";
  Lohnsteuer2024._d = "DBA";
  Lohnsteuer2024.typeDirectory = {
    "af": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "AJAHR": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "ALTER1": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "ENTSCH": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "f": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "JFREIB": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "JHINZU": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "JRE4": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "JVBEZ": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "KRV": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "KVZ": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "LZZ": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "LZZFREIB": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "LZZHINZU": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "MBV": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "PKPV": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "PKV": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "PVA": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "PVS": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "PVZ": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "R": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "RE4": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "SONSTB": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "STERBE": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "STKL": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "VBEZ": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "VBEZM": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "VBEZS": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "VBS": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "VJAHR": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "VKAPA": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "VMT": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "ZKF": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "ZMVB": { type: Lohnsteuer2024._n, direction: Lohnsteuer2024._i },
    "JRE4ENT": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "SONSTENT": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._i },
    "BK": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._s },
    "BKS": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._s },
    "BKV": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._s },
    "LSTLZZ": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._s },
    "SOLZLZZ": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._s },
    "SOLZS": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._s },
    "SOLZV": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._s },
    "STS": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._s },
    "STV": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._s },
    "VKVLZZ": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._s },
    "VKVSONST": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._s },
    "VFRB": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._d },
    "VFRBS1": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._d },
    "VFRBS2": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._d },
    "WVFRB": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._d },
    "WVFRBO": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._d },
    "WVFRBM": { type: Lohnsteuer2024._b, direction: Lohnsteuer2024._o, group: Lohnsteuer2024._d }
  };
//# sourceMappingURL=Lohnsteuer2024Big.js.map

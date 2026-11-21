// node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: ee, getOwnPropertySymbols: te, getPrototypeOf: ne } = Object, f = globalThis, re = f.trustedTypes, ie = re ? re.emptyScript : "", ae = f.reactiveElementPolyfillSupport, p = (e, t) => e, m = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? ie : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, h = (e, t) => !l(e, t), oe = {
	attribute: !0,
	type: String,
	converter: m,
	reflect: !1,
	useDefault: !1,
	hasChanged: h
};
Symbol.metadata ??= Symbol("metadata"), f.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var g = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = oe) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? oe;
	}
	static _$Ei() {
		if (this.hasOwnProperty(p("elementProperties"))) return;
		let e = ne(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(p("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(p("properties"))) {
			let e = this.properties, t = [...ee(e), ...te(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? m : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? m : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? h)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
g.elementStyles = [], g.shadowRootOptions = { mode: "open" }, g[p("elementProperties")] = /* @__PURE__ */ new Map(), g[p("finalized")] = /* @__PURE__ */ new Map(), ae?.({ ReactiveElement: g }), (f.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var _ = globalThis, v = (e) => e, y = _.trustedTypes, b = y ? y.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, x = "$lit$", S = `lit$${Math.random().toFixed(9).slice(2)}$`, se = "?" + S, ce = `<${se}>`, C = document, w = () => C.createComment(""), T = (e) => e === null || typeof e != "object" && typeof e != "function", E = Array.isArray, le = (e) => E(e) || typeof e?.[Symbol.iterator] == "function", D = "[ 	\n\f\r]", O = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, k = /-->/g, A = />/g, j = RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), M = /'/g, N = /"/g, P = /^(?:script|style|textarea|title)$/i, F = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), I = Symbol.for("lit-noChange"), L = Symbol.for("lit-nothing"), R = /* @__PURE__ */ new WeakMap(), z = C.createTreeWalker(C, 129);
function B(e, t) {
	if (!E(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return b === void 0 ? t : b.createHTML(t);
}
var ue = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = O;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === O ? c[1] === "!--" ? o = k : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = j) : (P.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = j) : o = A : o === j ? c[0] === ">" ? (o = i ?? O, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? j : c[3] === "\"" ? N : M) : o === N || o === M ? o = j : o === k || o === A ? o = O : (o = j, i = void 0);
		let d = o === j && e[t + 1].startsWith("/>") ? " " : "";
		a += o === O ? n + ce : l >= 0 ? (r.push(s), n.slice(0, l) + x + n.slice(l) + S + d) : n + S + (l === -2 ? t : d);
	}
	return [B(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, V = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = ue(t, n);
		if (this.el = e.createElement(l, r), z.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = z.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(x)) {
					let t = u[o++], n = i.getAttribute(e).split(S), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? fe : r[1] === "?" ? pe : r[1] === "@" ? me : W
					}), i.removeAttribute(e);
				} else e.startsWith(S) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (P.test(i.tagName)) {
					let e = i.textContent.split(S), t = e.length - 1;
					if (t > 0) {
						i.textContent = y ? y.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], w()), z.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], w());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === se) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(S, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += S.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = C.createElement("template");
		return n.innerHTML = e, n;
	}
};
function H(e, t, n = e, r) {
	if (t === I) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = T(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = H(e, i._$AS(e, t.values), i, r)), t;
}
var de = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? C).importNode(t, !0);
		z.currentNode = r;
		let i = z.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new U(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new he(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = z.nextNode(), a++);
		}
		return z.currentNode = C, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, U = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = L, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = H(this, e, t), T(e) ? e === L || e == null || e === "" ? (this._$AH !== L && this._$AR(), this._$AH = L) : e !== this._$AH && e !== I && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? le(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== L && T(this._$AH) ? this._$AA.nextSibling.data = e : this.T(C.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = V.createElement(B(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new de(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = R.get(e.strings);
		return t === void 0 && R.set(e.strings, t = new V(e)), t;
	}
	k(t) {
		E(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(w()), this.O(w()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = v(e).nextSibling;
			v(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, W = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = L, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = L;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = H(this, e, t, 0), a = !T(e) || e !== this._$AH && e !== I, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = H(this, r[n + o], t, o), s === I && (s = this._$AH[o]), a ||= !T(s) || s !== this._$AH[o], s === L ? e = L : e !== L && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === L ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, fe = class extends W {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === L ? void 0 : e;
	}
}, pe = class extends W {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== L);
	}
}, me = class extends W {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = H(this, e, t, 0) ?? L) === I) return;
		let n = this._$AH, r = e === L && n !== L || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== L && (n === L || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, he = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		H(this, e);
	}
}, ge = _.litHtmlPolyfillSupport;
ge?.(V, U), (_.litHtmlVersions ??= []).push("3.3.3");
var _e = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new U(t.insertBefore(w(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, G = globalThis, K = class extends g {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = _e(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return I;
	}
};
K._$litElement$ = !0, K.finalized = !0, G.litElementHydrateSupport?.({ LitElement: K });
var ve = G.litElementPolyfillSupport;
ve?.({ LitElement: K }), (G.litElementVersions ??= []).push("4.2.2");
// src/api.ts
function ye(e, t) {
	return e.callWS({
		type: "boopli/settings_save",
		settings: t
	});
}
function be(e, t) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "light",
		light: t
	});
}
function xe(e, t) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "phone",
		phone: t
	});
}
function Se(e, t, n) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "speaker",
		speaker: t,
		level: n
	});
}
function Ce(e, t) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "alarm_device",
		alarm_device: t
	});
}
function we(e, t) {
	return e.connection.subscribeMessage(t, { type: "boopli/subscribe" });
}
function Te(e, t) {
	return e.callWS({
		type: "boopli/chore_save",
		chore: t
	});
}
function Ee(e, t) {
	return e.callWS({
		type: "boopli/chore_delete",
		chore_id: t
	});
}
function De(e, t) {
	return e.callWS({
		type: "boopli/chore_start",
		chore_id: t
	});
}
function Oe(e, t, n) {
	return e.callWS({
		type: "boopli/step_complete",
		run_id: t,
		step_id: n
	});
}
function q(e) {
	return e && typeof e == "object" && "message" in e ? String(e.message) : "Something went wrong.";
}
// src/time.ts
var J = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun"
], Y = J;
function X(e, t) {
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: t,
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).format(new Date(e));
}
function Z(e, t) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: t,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(e);
}
function ke(e) {
	let [t, n, r] = e.split("-").map(Number);
	return Math.round(Date.UTC(t, n - 1, r) / 864e5);
}
function Ae(e, t, n) {
	let r = new Date(e), i = ke(Z(r, n)) - ke(Z(new Date(t), n)), a = X(e, n);
	return i === 0 ? `today ${a}` : i === 1 ? `tomorrow ${a}` : `${new Intl.DateTimeFormat("en-GB", {
		timeZone: n,
		weekday: "short",
		day: "numeric",
		month: "short"
	}).format(r)}, ${a}`;
}
function je(e, t, n) {
	return Z(new Date(e), n) === Z(new Date(t), n);
}
function Me(e) {
	let t = Math.max(0, Math.round(e));
	if (t < 1) return "less than a minute";
	if (t < 60) return `${t} min`;
	let n = Math.floor(t / 60), r = t % 60;
	return r === 0 ? `${n}h` : `${n}h ${r}m`;
}
function Ne(e, t) {
	let n = (new Date(e).getTime() - t) / 6e4;
	return n <= .5 ? "any moment now" : `in ${Me(n)}`;
}
function Pe(e, t) {
	return `since ${X(e, t)}`;
}
function Fe(e) {
	switch (e.type) {
		case "none": return "On demand";
		case "daily": return `Every day at ${e.time}`;
		case "weekly": return `Every ${[...e.weekdays].sort((e, t) => e - t).map((e) => J[e]).join(", ")} at ${e.time}`;
		case "every_n_days": return e.every_n_days === 1 ? `Every day after you finish, at ${e.time}` : `${e.every_n_days} days after you finish, at ${e.time}`;
	}
}
// src/today.ts
function Ie(e, t) {
	let n = e.time_zone, r = e.runs.flatMap((e) => e.steps.filter((e) => e.status === "active").map((t) => ({
		run: e,
		step: t
	}))).sort((e, t) => (e.step.active_at ? Date.parse(e.step.active_at) : Infinity) - (t.step.active_at ? Date.parse(t.step.active_at) : Infinity))[0] ?? null, i = [...e.runs].sort((e, t) => Date.parse(e.started_at) - Date.parse(t.started_at)).map((e) => ({
		run: e,
		steps: e.steps.filter((t) => t.status !== "done" && !(r && r.run.id === e.id && r.step.step_id === t.step_id)).map((e) => {
			let n = "";
			return e.status === "active" ? n = "ready now" : e.status === "waiting" && e.active_at ? n = Ne(e.active_at, t) : e.wait_minutes > 0 && (n = `${Me(e.wait_minutes)} after the step before`), {
				title: e.title,
				status: e.status,
				hint: n
			};
		})
	})).filter((e) => e.steps.length > 0), a = new Set(e.runs.map((e) => e.chore_id));
	return {
		now: r,
		groups: i,
		dueToday: e.chores.filter((e) => e.enabled && e.next_due !== null && !a.has(e.id) && je(e.next_due, t, n)).map((e) => ({
			chore: e,
			at: e.next_due
		})).sort((e, t) => Date.parse(e.at) - Date.parse(t.at))
	};
}
// src/styles.ts
var Q = o`
  :host {
    display: block;
    color: var(--primary-text-color);
    font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
  }
  * {
    box-sizing: border-box;
  }
  h2,
  h3 {
    margin: 0;
    font-weight: 500;
  }
  .muted {
    color: var(--secondary-text-color);
  }
  .dim {
    opacity: 0.6;
  }
  .card {
    background: var(--card-background-color, var(--primary-background-color));
    border: 1px solid var(--divider-color);
    border-radius: 14px;
    padding: 16px;
  }
  button {
    font: inherit;
    cursor: pointer;
    color: var(--primary-text-color);
    background: transparent;
    border: 1px solid var(--divider-color);
    border-radius: 10px;
    padding: 8px 14px;
    min-height: 40px;
  }
  button:hover {
    background: var(--secondary-background-color);
  }
  button.primary {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-primary-color, #fff);
    font-weight: 500;
  }
  button.primary:hover {
    filter: brightness(1.08);
  }
  button.danger {
    color: var(--error-color, #db4437);
    border-color: var(--error-color, #db4437);
  }
  button.chip {
    border-radius: 999px;
    padding: 6px 12px;
    min-height: 34px;
    font-size: 14px;
  }
  button.chip.on {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  input,
  select {
    font: inherit;
    color: var(--primary-text-color);
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 10px;
    padding: 8px 10px;
    min-height: 40px;
    width: 100%;
  }
  label {
    display: block;
    font-size: 13px;
    color: var(--secondary-text-color);
    margin-bottom: 4px;
  }
  .error {
    color: var(--error-color, #db4437);
    font-size: 14px;
    margin: 8px 0;
  }
`, Le = {
	happy: "✨",
	content: "",
	sleepy: "💤",
	sad: "💧",
	hibernating: "🌙💤"
}, Re = class extends K {
	static {
		this.properties = {
			mood: { type: String },
			level: { type: Number }
		};
	}
	constructor() {
		super(), this.mood = "content", this.level = 1;
	}
	_art() {
		return F`<span class="bear" aria-hidden="true">🐻</span>
      <span class="badge" aria-hidden="true">${Le[this.mood]}</span>`;
	}
	render() {
		return F`<div class="pet ${this.mood}" role="img" aria-label="Your pet is ${this.mood}">
      ${this._art()}
    </div>`;
	}
	static {
		this.styles = o`
    :host {
      display: inline-block;
    }
    .pet {
      position: relative;
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bear {
      font-size: 54px;
      line-height: 1;
    }
    .badge {
      position: absolute;
      right: -6px;
      top: -4px;
      font-size: 22px;
    }
    .sad .bear {
      filter: grayscale(0.5);
    }
    .hibernating .bear {
      opacity: 0.55;
      filter: grayscale(0.7);
      transform: scale(0.85);
    }
  `;
	}
};
customElements.define("boopli-pet", Re);
// src/boopli-today.ts
function ze(e) {
	return {
		happy: "Nice, you got things done today.",
		content: "Ready when you are.",
		sleepy: `${e.name} is a bit sleepy.`,
		sad: `${e.name} misses you. One step is enough.`,
		hibernating: `${e.name} is curled up, resting until you are back. One step wakes it.`
	}[e.mood];
}
var Be = class extends K {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			nowMs: { type: Number },
			_busy: { state: !0 },
			_error: { state: !0 },
			_toast: { state: !0 }
		};
	}
	constructor() {
		super(), this.nowMs = Date.now(), this._busy = !1, this._error = "", this._toast = "";
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearTimeout(this._toastTimer);
	}
	willUpdate(e) {
		if (!e.has("snapshot") || !this.snapshot?.pet) return;
		let t = this.snapshot.pet, n = this._lastPet;
		if (this._lastPet = t, !n || t.total_xp <= n.total_xp) return;
		let r = [`+${t.total_xp - n.total_xp} XP`];
		t.level > n.level && r.push(`Level ${t.level}!`), (n.mood === "sad" || n.mood === "hibernating") && r.push(`${t.name} is awake. Welcome back!`), this._toast = r.join("  ·  "), window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 5e3);
	}
	_renderPet() {
		let e = this.snapshot?.pet;
		if (!e) return L;
		let t = e.xp_for_level > 0 ? Math.round(e.xp_in_level / e.xp_for_level * 100) : 0;
		return F`
      <section class="card pet-card">
        <boopli-pet .mood=${e.mood} .level=${e.level}></boopli-pet>
        <div class="pet-info">
          <div class="pet-name">${e.name} <span class="muted">· Level ${e.level}</span></div>
          <div class="bar" role="progressbar" aria-valuenow=${t} aria-valuemin="0" aria-valuemax="100">
            <div class="fill" style="width:${t}%"></div>
          </div>
          <div class="muted small">${e.xp_in_level} / ${e.xp_for_level} XP to the next level</div>
          <div class="small">${ze(e)}</div>
        </div>
      </section>
      ${this._toast ? F`<div class="toast" role="status">${this._toast}</div>` : L}
    `;
	}
	async _done(e, t) {
		if (this.hass && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				await Oe(this.hass, e, t);
			} catch (e) {
				this._error = q(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderAuto() {
		let e = this.snapshot;
		if (!e) return L;
		let t = this.nowMs - 864e5, n = e.history.filter((e) => e.kind === "step_done" && e.by === "auto" && Date.parse(e.ts) >= t).slice(-3).reverse();
		return n.length === 0 ? L : F`
      <section class="auto dim">
        <h3>Done by itself</h3>
        ${n.map((t) => F`<div class="row">
            <span>✓ ${t.chore_name}: ${t.step_title}</span>
            <span class="hint">${t.reason ? `${t.reason}, ` : ""}${X(t.ts, e.time_zone)}</span>
          </div>`)}
      </section>
    `;
	}
	render() {
		if (!this.snapshot) return F`<p class="muted">Loading…</p>`;
		let e = this.snapshot.time_zone, t = Ie(this.snapshot, this.nowMs), n = this.snapshot.chores.length > 0;
		return F`
      ${this._renderPet()}
      ${t.now ? F`
            <section class="card now">
              <div class="muted small">${t.now.run.chore_name}</div>
              <h2>${t.now.step.title}</h2>
              ${t.now.step.active_at ? F`<div class="muted small">
                    ${Pe(t.now.step.active_at, e)}
                  </div>` : L}
              ${t.now.step.snoozed_until && Date.parse(t.now.step.snoozed_until) > this.nowMs ? F`<div class="muted small">
                    Snoozed until ${X(t.now.step.snoozed_until, e)}
                  </div>` : L}
              <button
                class="primary done"
                ?disabled=${this._busy}
                @click=${() => this._done(t.now.run.id, t.now.step.step_id)}
              >
                Done
              </button>
              ${this._error ? F`<div class="error">${this._error}</div>` : L}
            </section>
          ` : F`
            <section class="card empty">
              <h2>Nothing needs you right now</h2>
              <p class="muted">
                ${n ? "Enjoy the quiet. What is coming up shows below." : "Add your first chore in the Chores tab."}
              </p>
            </section>
          `}
      ${this._renderAuto()}
      ${t.groups.length > 0 || t.dueToday.length > 0 ? F`
            <section class="later dim">
              <h3>Still to do today</h3>
              ${t.groups.map((e) => F`
                  <div class="group">
                    <div class="group-name">${e.run.chore_name}</div>
                    ${e.steps.map((e) => F`
                        <div class="row">
                          <span>${e.title}</span>
                          <span class="hint">${e.hint}</span>
                        </div>
                      `)}
                  </div>
                `)}
              ${t.dueToday.map((t) => F`
                  <div class="group">
                    <div class="row">
                      <span class="group-name">${t.chore.name}</span>
                      <span class="hint">at ${X(t.at, e)}</span>
                    </div>
                  </div>
                `)}
            </section>
          ` : L}
    `;
	}
	static {
		this.styles = [Q, o`
      .small {
        font-size: 14px;
      }
      .pet-card {
        display: flex;
        gap: 14px;
        align-items: center;
        margin-bottom: 16px;
        padding: 12px 16px;
      }
      .pet-info {
        flex: 1;
        min-width: 0;
      }
      .pet-name {
        font-size: 17px;
        font-weight: 500;
      }
      .bar {
        height: 8px;
        border-radius: 999px;
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        overflow: hidden;
        margin: 6px 0 4px;
      }
      .fill {
        height: 100%;
        background: var(--primary-color);
        border-radius: 999px;
        transition: width 0.4s ease;
      }
      .toast {
        position: fixed;
        left: 50%;
        bottom: 28px;
        transform: translateX(-50%);
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
        padding: 10px 18px;
        border-radius: 999px;
        font-weight: 500;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        z-index: 10;
        max-width: 90vw;
        text-align: center;
      }
      .now,
      .empty {
        text-align: center;
        padding: 28px 16px;
      }
      .now h2 {
        font-size: 28px;
        margin: 8px 0;
      }
      .done {
        margin-top: 20px;
        min-width: 180px;
        min-height: 56px;
        font-size: 20px;
        border-radius: 14px;
      }
      .later,
      .auto {
        margin-top: 28px;
      }
      .auto h3 {
        font-size: 15px;
        font-weight: 500;
        color: var(--secondary-text-color);
        margin-bottom: 8px;
      }
      .auto .row {
        padding-left: 0;
      }
      .auto .hint {
        white-space: normal;
        text-align: right;
      }
      .later h3 {
        font-size: 15px;
        font-weight: 500;
        color: var(--secondary-text-color);
        margin-bottom: 8px;
      }
      .group {
        padding: 8px 0;
        border-top: 1px solid var(--divider-color);
      }
      .group-name {
        font-size: 15px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 14px;
        padding: 2px 0 2px 12px;
      }
      .group > .row:only-child {
        padding-left: 0;
      }
      .hint {
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
    `];
	}
};
customElements.define("boopli-today", Be);
// src/boopli-triggers.ts
var Ve = {
	binary_sensor: ["on", "off"],
	switch: ["on", "off"],
	input_boolean: ["on", "off"],
	light: ["on", "off"],
	cover: ["open", "closed"],
	lock: ["locked", "unlocked"],
	person: ["home", "not_home"],
	device_tracker: ["home", "not_home"]
}, He = [
	"event",
	"input_button",
	"button"
];
function Ue(e) {
	return e.state ? "state" : e.above !== null && e.below !== null ? "between" : e.below === null ? e.above === null ? "state" : "above" : "below";
}
function We(e) {
	return {
		kind: e,
		entity_id: "",
		mode: "happens",
		state: "",
		above: null,
		below: null,
		for_minutes: 0,
		tag_id: "",
		press: ""
	};
}
var Ge = class extends K {
	static {
		this.properties = {
			hass: { attribute: !1 },
			triggers: { attribute: !1 },
			_tags: { state: !0 },
			_scanning: { state: !0 },
			_note: { state: !0 }
		};
	}
	constructor() {
		super(), this.triggers = [], this._tags = [], this._scanning = -1, this._note = "";
	}
	connectedCallback() {
		super.connectedCallback(), this._loadTags();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._cancelScan();
	}
	async _loadTags() {
		if (this.hass) try {
			let e = await this.hass.callWS({ type: "tag/list" });
			this._tags = Array.isArray(e) ? e : [];
		} catch {
			this._tags = [];
		}
	}
	_emit(e) {
		this.dispatchEvent(new CustomEvent("triggers-change", {
			detail: e,
			bubbles: !0,
			composed: !0
		}));
	}
	_patch(e, t) {
		this._emit(this.triggers.map((n, r) => r === e ? {
			...n,
			...t
		} : n));
	}
	_add(e) {
		this._emit([...this.triggers, We(e)]);
	}
	_remove(e) {
		this._cancelScan(), this._emit(this.triggers.filter((t, n) => n !== e));
	}
	_entityIds(e) {
		return Object.keys(this.hass?.states ?? {}).filter((t) => !e || e.includes(t.split(".")[0])).sort();
	}
	_friendly(e) {
		let t = this.hass?.states[e]?.attributes?.friendly_name;
		return typeof t == "string" && t ? t : e;
	}
	_numberOrNull(e) {
		if (e.trim() === "") return null;
		let t = Number(e);
		return Number.isFinite(t) ? t : null;
	}
	_setCondition(e, t) {
		let n = this.triggers[e];
		t === "state" && this._patch(e, {
			state: n.state || "on",
			above: null,
			below: null
		}), t === "above" && this._patch(e, {
			state: "",
			above: n.above ?? 0,
			below: null
		}), t === "below" && this._patch(e, {
			state: "",
			above: null,
			below: n.below ?? 0
		}), t === "between" && this._patch(e, {
			state: "",
			above: n.above ?? 0,
			below: n.below ?? 100
		});
	}
	_cancelScan() {
		this._stopScan?.(), this._stopScan = void 0, this._scanning = -1;
	}
	async _scan(e) {
		if (this.hass) {
			this._cancelScan(), this._note = "", this._scanning = e;
			try {
				let t = await this.hass.connection.subscribeEvents((t) => {
					let n = t.data?.tag_id;
					n && (this._patch(e, { tag_id: n }), this._cancelScan(), this._loadTags());
				}, "tag_scanned");
				this._scanning === e ? this._stopScan = t : t();
			} catch (e) {
				this._scanning = -1, this._note = `Scanning did not start (${q(e)}). Pick the tag from the list instead.`;
			}
		}
	}
	_renderState(e, t) {
		let n = e.entity_id.split(".")[0], r = this.hass?.states[e.entity_id], i = Ve[n] ?? [], a = Ue(e);
		return F`
      <div class="field">
        <label>Which entity?</label>
        <input
          list="states-list"
          placeholder="Start typing a name, for example door"
          .value=${e.entity_id}
          @change=${(e) => this._patch(t, { entity_id: e.target.value.trim() })}
        />
        ${e.entity_id ? r ? F`<div class="muted small">
                ${this._friendly(e.entity_id)}: now <b>${r.state}</b>
              </div>` : F`<div class="warn small">Not found right now. Check the name.</div>` : L}
      </div>
      <div class="field">
        <label>It finishes the step when it…</label>
        <select
          .value=${a}
          @change=${(e) => this._setCondition(t, e.target.value)}
        >
          <option value="state" ?selected=${a === "state"}>is in this state</option>
          <option value="above" ?selected=${a === "above"}>goes above a number</option>
          <option value="below" ?selected=${a === "below"}>goes below a number</option>
          <option value="between" ?selected=${a === "between"}>is between two numbers</option>
        </select>
      </div>
      ${a === "state" ? F`<div class="field">
            <label>State</label>
            <input
              placeholder="for example on, off, open"
              .value=${e.state}
              @input=${(e) => this._patch(t, { state: e.target.value })}
            />
            <div class="chips">
              ${i.map((n) => F`<button
                  type="button"
                  class="chip ${e.state === n ? "on" : ""}"
                  @click=${() => this._patch(t, { state: n })}
                >
                  ${n}
                </button>`)}
              ${r && !i.includes(r.state) ? F`<button
                    type="button"
                    class="chip"
                    @click=${() => this._patch(t, { state: r.state })}
                  >
                    now: ${r.state}
                  </button>` : L}
            </div>
          </div>` : F`<div class="row2">
            ${a === "above" || a === "between" ? F`<div>
                  <label>Above</label>
                  <input
                    type="number"
                    step="any"
                    .value=${e.above === null ? "" : String(e.above)}
                    @input=${(e) => this._patch(t, { above: this._numberOrNull(e.target.value) })}
                  />
                </div>` : L}
            ${a === "below" || a === "between" ? F`<div>
                  <label>Below</label>
                  <input
                    type="number"
                    step="any"
                    .value=${e.below === null ? "" : String(e.below)}
                    @input=${(e) => this._patch(t, { below: this._numberOrNull(e.target.value) })}
                  />
                </div>` : L}
          </div>`}
      <div class="field">
        <label>…and stays that way for (minutes, 0 = right away)</label>
        <input
          type="number"
          min="0"
          max="1440"
          .value=${String(e.for_minutes)}
          @input=${(e) => this._patch(t, { for_minutes: Math.max(0, Number(e.target.value) || 0) })}
        />
      </div>
      <details class="advanced">
        <summary>Advanced</summary>
        <label class="inline">
          <input
            type="checkbox"
            .checked=${e.mode === "is"}
            @change=${(e) => this._patch(t, { mode: e.target.checked ? "is" : "happens" })}
          />
          Also count it if it is already true when the step starts
        </label>
        <div class="muted small">
          Off (the usual): it has to happen after the step starts, so a door that was already open
          does not finish "open it to dry". On: good for "windows are shut" or "plant is fine".
        </div>
      </details>
    `;
	}
	_renderTag(e, t) {
		let n = this._tags.find((t) => t.tag_id === e.tag_id);
		return F`
      <div class="field">
        <label>Which NFC tag?</label>
        <div class="scan">
          <select
            @change=${(e) => this._patch(t, { tag_id: e.target.value })}
          >
            <option value="" .selected=${!e.tag_id}>Pick a tag…</option>
            ${this._tags.map((t) => F`<option value=${t.tag_id} .selected=${t.tag_id === e.tag_id}>
                ${t.name || t.tag_id}
              </option>`)}
            ${e.tag_id && !n ? F`<option value=${e.tag_id} .selected=${!0}>${e.tag_id}</option>` : L}
          </select>
          ${this._scanning === t ? F`<button type="button" @click=${() => this._cancelScan()}>Cancel</button>` : F`<button type="button" @click=${() => this._scan(t)}>Scan now</button>`}
        </div>
        ${this._scanning === t ? F`<div class="muted small">Hold your phone to the tag now…</div>` : L}
      </div>
    `;
	}
	_renderButton(e, t) {
		let n = this.hass?.states[e.entity_id], r = n?.attributes?.event_types;
		return F`
      <div class="field">
        <label>Which button?</label>
        <input
          list="buttons-list"
          placeholder="Start typing a name, for example button"
          .value=${e.entity_id}
          @change=${(e) => this._patch(t, { entity_id: e.target.value.trim() })}
        />
        ${e.entity_id && !n ? F`<div class="warn small">Not found right now. Check the name.</div>` : L}
      </div>
      <div class="field">
        <label>Only this kind of press (empty = any press)</label>
        <input
          placeholder="for example single or double"
          .value=${e.press}
          @input=${(e) => this._patch(t, { press: e.target.value })}
        />
        ${Array.isArray(r) && r.length ? F`<div class="chips">
              ${r.map((n) => F`<button
                  type="button"
                  class="chip ${e.press === n ? "on" : ""}"
                  @click=${() => this._patch(t, { press: n })}
                >
                  ${String(n)}
                </button>`)}
            </div>` : L}
      </div>
    `;
	}
	_title(e) {
		return e.kind === "tag" ? "An NFC tag is scanned" : e.kind === "button" ? "A button is pressed" : "An entity changes";
	}
	render() {
		return F`
      <datalist id="states-list">
        ${this._entityIds().map((e) => F`<option value=${e}>${this._friendly(e)}</option>`)}
      </datalist>
      <datalist id="buttons-list">
        ${this._entityIds(He).map((e) => F`<option value=${e}>${this._friendly(e)}</option>`)}
      </datalist>
      ${this.triggers.length === 0 ? F`<div class="muted small">
            Nothing yet: only you finish this step (with Done). Add one below to let it finish by
            itself.
          </div>` : this.triggers.map((e, t) => F`
              ${t > 0 ? F`<div class="or muted small">or</div>` : L}
              <div class="trigger">
                <div class="trigger-head">
                  <b>${this._title(e)}</b>
                  <button type="button" aria-label="Remove" @click=${() => this._remove(t)}>✕</button>
                </div>
                ${e.kind === "tag" ? this._renderTag(e, t) : e.kind === "button" ? this._renderButton(e, t) : this._renderState(e, t)}
              </div>
            `)}
      ${this._note ? F`<div class="warn small">${this._note}</div>` : L}
      <div class="chips add">
        <button type="button" @click=${() => this._add("state")}>+ An entity changes</button>
        <button type="button" @click=${() => this._add("tag")}>+ NFC tag</button>
        <button type="button" @click=${() => this._add("button")}>+ Button</button>
      </div>
    `;
	}
	static {
		this.styles = [Q, o`
      .small {
        font-size: 13px;
      }
      .warn {
        color: var(--warning-color, #b26a00);
      }
      .trigger {
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px;
        margin: 8px 0;
      }
      .trigger-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .trigger-head button {
        padding: 2px 10px;
        min-height: 32px;
      }
      .or {
        text-align: center;
      }
      .field {
        margin: 10px 0;
      }
      .row2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin: 10px 0;
      }
      .scan {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 6px;
      }
      .chips.add {
        margin-top: 10px;
      }
      .advanced summary {
        cursor: pointer;
        color: var(--secondary-text-color);
        font-size: 13px;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--primary-text-color);
        margin: 8px 0 4px;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
    `];
	}
};
customElements.define("boopli-triggers", Ge);
// src/boopli-chore-editor.ts
var Ke = [
	{
		value: "quiet",
		label: "Quiet: only shown in Boopli, no nudges"
	},
	{
		value: "one",
		label: "One nudge"
	},
	{
		value: "escalating",
		label: "Escalating: gets more frequent, then stops"
	},
	{
		value: "persistent",
		label: "Persistent: every 5 minutes until done"
	}
], qe = [
	{
		minutes: 0,
		label: "No wait"
	},
	{
		minutes: 15,
		label: "15 min"
	},
	{
		minutes: 30,
		label: "30 min"
	},
	{
		minutes: 60,
		label: "1 h"
	},
	{
		minutes: 180,
		label: "3 h"
	}
], Je = [
	{
		value: "none",
		label: "On demand (I start it)"
	},
	{
		value: "daily",
		label: "Every day"
	},
	{
		value: "weekly",
		label: "On certain weekdays"
	},
	{
		value: "every_n_days",
		label: "Every N days after I finish"
	}
], Ye = class extends K {
	static {
		this.properties = {
			hass: { attribute: !1 },
			draft: { attribute: !1 },
			defaultStyle: { attribute: !1 },
			_error: { state: !0 },
			_busy: { state: !0 },
			_confirmDelete: { state: !0 }
		};
	}
	constructor() {
		super(), this.defaultStyle = "one", this._error = "", this._busy = !1, this._confirmDelete = !1;
	}
	_update(e) {
		this.draft = {
			...this.draft,
			...e
		};
	}
	_updateRepeat(e) {
		this._update({ repeat: {
			...this.draft.repeat,
			...e
		} });
	}
	_updateStep(e, t) {
		let n = this.draft.steps.map((n, r) => r === e ? {
			...n,
			...t
		} : n);
		this._update({ steps: n });
	}
	_moveStep(e, t) {
		let n = e + t;
		if (n < 0 || n >= this.draft.steps.length) return;
		let r = [...this.draft.steps];
		[r[e], r[n]] = [r[n], r[e]], this._update({ steps: r });
	}
	_removeStep(e) {
		this.draft.steps.length <= 1 || this._update({ steps: this.draft.steps.filter((t, n) => n !== e) });
	}
	_addStep() {
		this._update({ steps: [...this.draft.steps, {
			title: "",
			wait_minutes: 0
		}] });
	}
	_toggleWeekday(e) {
		let t = new Set(this.draft.repeat.weekdays);
		t.has(e) ? t.delete(e) : t.add(e), this._updateRepeat({ weekdays: [...t].sort((e, t) => e - t) });
	}
	_close() {
		this.dispatchEvent(new CustomEvent("editor-close", {
			bubbles: !0,
			composed: !0
		}));
	}
	async _save() {
		if (this.hass && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				await Te(this.hass, {
					...this.draft,
					nudge_style: this.draft.nudge_style ?? this.defaultStyle,
					ignore_quiet_hours: this.draft.ignore_quiet_hours ?? !1,
					name: this.draft.name.trim(),
					steps: this.draft.steps.map((e) => ({
						...e,
						title: e.title.trim()
					}))
				}), this._close();
			} catch (e) {
				this._error = q(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	async _delete() {
		if (this.hass && this.draft.id && !this._busy) {
			this._busy = !0;
			try {
				await Ee(this.hass, this.draft.id), this._close();
			} catch (e) {
				this._error = q(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderRepeat() {
		let e = this.draft.repeat;
		return F`
      <div class="field">
        <label for="repeat">Repeats</label>
        <select
          id="repeat"
          .value=${e.type}
          @change=${(e) => this._updateRepeat({ type: e.target.value })}
        >
          ${Je.map((t) => F`<option value=${t.value} ?selected=${t.value === e.type}>${t.label}</option>`)}
        </select>
      </div>
      ${e.type === "weekly" ? F`<div class="field">
            <label>On these days</label>
            <div class="chips">
              ${Y.map((t, n) => F`<button
                  type="button"
                  class="chip ${e.weekdays.includes(n) ? "on" : ""}"
                  @click=${() => this._toggleWeekday(n)}
                >
                  ${t}
                </button>`)}
            </div>
          </div>` : L}
      ${e.type === "every_n_days" ? F`<div class="field">
            <label for="n">Number of days</label>
            <input
              id="n"
              type="number"
              min="1"
              max="365"
              .value=${String(e.every_n_days)}
              @input=${(e) => this._updateRepeat({ every_n_days: Number(e.target.value) || 1 })}
            />
          </div>` : L}
      ${e.type === "none" ? L : F`<div class="field">
            <label for="time">At</label>
            <input
              id="time"
              type="time"
              .value=${e.time}
              @input=${(e) => this._updateRepeat({ time: e.target.value })}
            />
          </div>`}
    `;
	}
	_renderStep(e) {
		let t = this.draft.steps[e], n = this.draft.steps.length - 1;
		return F`
      <div class="step">
        <div class="step-head">
          <span class="num">${e + 1}</span>
          <input
            aria-label="Step ${e + 1} title"
            placeholder="What to do"
            .value=${t.title}
            @input=${(t) => this._updateStep(e, { title: t.target.value })}
          />
          <button type="button" aria-label="Move up" ?disabled=${e === 0} @click=${() => this._moveStep(e, -1)}>↑</button>
          <button type="button" aria-label="Move down" ?disabled=${e === n} @click=${() => this._moveStep(e, 1)}>↓</button>
          <button type="button" aria-label="Remove step" ?disabled=${n === 0} @click=${() => this._removeStep(e)}>✕</button>
        </div>
        <div class="wait">
          <span class="muted small">Wait before this step:</span>
          <div class="chips">
            ${qe.map((n) => F`<button
                type="button"
                class="chip ${t.wait_minutes === n.minutes ? "on" : ""}"
                @click=${() => this._updateStep(e, { wait_minutes: n.minutes })}
              >
                ${n.label}
              </button>`)}
            <span class="custom">
              <input
                aria-label="Custom wait in minutes"
                type="number"
                min="0"
                max="10080"
                .value=${String(t.wait_minutes)}
                @input=${(t) => this._updateStep(e, { wait_minutes: Math.max(0, Number(t.target.value) || 0) })}
              />
              <span class="muted small">min</span>
            </span>
          </div>
        </div>
        <details class="auto" ?open=${(t.triggers ?? []).length > 0}>
          <summary>
            Finishes by itself when…
            ${(t.triggers ?? []).length > 0 ? F`<span class="muted small">(${(t.triggers ?? []).length} set)</span>` : L}
          </summary>
          <boopli-triggers
            .hass=${this.hass}
            .triggers=${t.triggers ?? []}
            @triggers-change=${(t) => this._updateStep(e, { triggers: t.detail })}
          ></boopli-triggers>
        </details>
      </div>
    `;
	}
	render() {
		let e = this.draft;
		return e ? F`
      <section class="card">
        <h2>${e.id ? "Edit chore" : "New chore"}</h2>

        <div class="field">
          <label for="name">Name</label>
          <input
            id="name"
            placeholder="For example: Dishwasher"
            .value=${e.name}
            @input=${(e) => this._update({ name: e.target.value })}
          />
        </div>

        <div class="field">
          <label for="where">Where does it make sense?</label>
          <select
            id="where"
            .value=${e.where}
            @change=${(e) => this._update({ where: e.target.value })}
          >
            <option value="home" ?selected=${e.where === "home"}>Home only</option>
            <option value="anywhere" ?selected=${e.where === "anywhere"}>Anywhere (for example pills)</option>
          </select>
        </div>

        ${this._renderRepeat()}

        <div class="field">
          <label for="style">How should Boopli nudge you?</label>
          <select
            id="style"
            .value=${e.nudge_style ?? this.defaultStyle}
            @change=${(e) => this._update({ nudge_style: e.target.value })}
          >
            ${Ke.map((t) => F`<option
                value=${t.value}
                ?selected=${t.value === (e.nudge_style ?? this.defaultStyle)}
              >
                ${t.label}
              </option>`)}
          </select>
        </div>
        <div class="field check">
          <label class="inline">
            <input
              type="checkbox"
              .checked=${e.ignore_quiet_hours ?? !1}
              @change=${(e) => this._update({ ignore_quiet_hours: e.target.checked })}
            />
            Nudge even in quiet hours (for example pills)
          </label>
        </div>

        <h3 class="steps-title">Steps</h3>
        ${e.steps.map((e, t) => this._renderStep(t))}
        <button type="button" @click=${() => this._addStep()}>+ Add a step</button>

        ${this._error ? F`<div class="error">${this._error}</div>` : L}

        <div class="actions">
          <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
          <button ?disabled=${this._busy} @click=${() => this._close()}>Cancel</button>
          ${e.id ? this._confirmDelete ? F`<span class="muted small">Delete it, and anything in progress?</span>
                  <button class="danger" ?disabled=${this._busy} @click=${() => this._delete()}>Yes, delete</button>
                  <button @click=${() => this._confirmDelete = !1}>No</button>` : F`<button class="danger" @click=${() => this._confirmDelete = !0}>Delete</button>` : L}
        </div>
      </section>
    ` : L;
	}
	static {
		this.styles = [Q, o`
      .field {
        margin: 14px 0;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--primary-text-color);
        margin: 0;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      .small {
        font-size: 13px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .steps-title {
        margin: 24px 0 8px;
      }
      .step {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 10px;
        margin-bottom: 10px;
      }
      .step-head {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .step-head button {
        padding: 4px 10px;
        min-width: 38px;
      }
      .num {
        min-width: 22px;
        text-align: center;
        color: var(--secondary-text-color);
      }
      .wait {
        margin-top: 10px;
      }
      .wait .chips {
        margin-top: 6px;
      }
      details.auto {
        margin-top: 12px;
      }
      details.auto summary {
        cursor: pointer;
        font-size: 14px;
      }
      .custom {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .custom input {
        width: 84px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        margin-top: 20px;
      }
    `];
	}
};
customElements.define("boopli-chore-editor", Ye);
// src/templates.ts
var $ = {
	type: "none",
	time: "09:00",
	weekdays: [],
	every_n_days: 1
}, Xe = [
	{
		label: "Dishwasher",
		draft: {
			name: "Dishwasher",
			where: "home",
			enabled: !0,
			one_off: !1,
			repeat: {
				...$,
				weekdays: []
			},
			steps: [
				{
					title: "Load the dishwasher",
					wait_minutes: 0
				},
				{
					title: "Start the dishwasher",
					wait_minutes: 0
				},
				{
					title: "Open it so it can dry",
					wait_minutes: 0
				},
				{
					title: "Empty the dishwasher",
					wait_minutes: 180
				}
			]
		}
	},
	{
		label: "Laundry",
		draft: {
			name: "Laundry",
			where: "home",
			enabled: !0,
			one_off: !1,
			repeat: {
				...$,
				weekdays: []
			},
			steps: [
				{
					title: "Start the washing machine",
					wait_minutes: 0
				},
				{
					title: "Move the laundry to the dryer",
					wait_minutes: 60
				},
				{
					title: "Take the laundry out and fold it",
					wait_minutes: 90
				}
			]
		}
	},
	{
		label: "Trash",
		draft: {
			name: "Take out the trash",
			where: "home",
			enabled: !0,
			one_off: !1,
			repeat: {
				type: "weekly",
				time: "19:00",
				weekdays: [3],
				every_n_days: 1
			},
			steps: [{
				title: "Take out the trash",
				wait_minutes: 0
			}]
		}
	},
	{
		label: "Pills",
		draft: {
			name: "Take pills",
			where: "anywhere",
			enabled: !0,
			one_off: !1,
			repeat: {
				type: "daily",
				time: "08:00",
				weekdays: [],
				every_n_days: 1
			},
			nudge_style: "escalating",
			ignore_quiet_hours: !0,
			steps: [{
				title: "Take your pills",
				wait_minutes: 0
			}]
		}
	}
];
function Ze() {
	return {
		name: "",
		where: "home",
		enabled: !0,
		one_off: !1,
		repeat: {
			type: "none",
			time: "09:00",
			weekdays: [],
			every_n_days: 1
		},
		steps: [{
			title: "",
			wait_minutes: 0
		}]
	};
}
// src/boopli-chores.ts
var Qe = class extends K {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			nowMs: { type: Number },
			_editing: { state: !0 },
			_error: { state: !0 }
		};
	}
	constructor() {
		super(), this.nowMs = Date.now(), this._editing = null, this._error = "";
	}
	_edit(e) {
		this._editing = {
			id: e.id,
			name: e.name,
			where: e.where,
			enabled: e.enabled,
			one_off: e.one_off,
			repeat: {
				...e.repeat,
				weekdays: [...e.repeat.weekdays]
			},
			nudge_style: e.nudge_style,
			ignore_quiet_hours: e.ignore_quiet_hours,
			steps: e.steps.map((e) => ({
				id: e.id,
				title: e.title,
				wait_minutes: e.wait_minutes,
				triggers: (e.triggers ?? []).map((e) => ({ ...e }))
			}))
		};
	}
	async _start(e) {
		if (this.hass) {
			this._error = "";
			try {
				await De(this.hass, e.id);
			} catch (e) {
				this._error = q(e);
			}
		}
	}
	render() {
		if (!this.snapshot) return F`<p class="muted">Loading…</p>`;
		if (this._editing) return F`<boopli-chore-editor
        .hass=${this.hass}
        .draft=${this._editing}
        .defaultStyle=${this.snapshot.settings.default_style}
        @editor-close=${() => this._editing = null}
      ></boopli-chore-editor>`;
		let e = this.snapshot.time_zone, t = new Set(this.snapshot.runs.map((e) => e.chore_id)), n = [...this.snapshot.chores].sort((e, t) => e.name.localeCompare(t.name));
		return F`
      <div class="toolbar">
        <button class="primary" @click=${() => this._editing = Ze()}>
          + New chore
        </button>
      </div>

      <div class="templates">
        <span class="muted small">Start from a template:</span>
        ${Xe.map((e) => F`<button
            class="chip"
            @click=${() => this._editing = structuredClone(e.draft)}
          >
            ${e.label}
          </button>`)}
      </div>

      ${this._error ? F`<div class="error">${this._error}</div>` : L}
      ${n.length === 0 ? F`<p class="muted empty">
            No chores yet. Pick a template above or create your own.
          </p>` : n.map((n) => F`
              <section class="card chore">
                <div class="chore-main">
                  <div class="name">${n.name}</div>
                  <div class="muted small">
                    ${Fe(n.repeat)} · ${n.where === "home" ? "Home only" : "Anywhere"}
                    · ${n.steps.length} ${n.steps.length === 1 ? "step" : "steps"}
                  </div>
                  <div class="muted small">
                    ${t.has(n.id) ? "In progress" : n.enabled && n.next_due ? `Next: ${Ae(n.next_due, this.nowMs, e)}` : n.repeat.type === "none" ? "" : "Not scheduled"}
                  </div>
                </div>
                <div class="chore-actions">
                  ${t.has(n.id) ? L : F`<button @click=${() => this._start(n)}>Start now</button>`}
                  <button @click=${() => this._edit(n)}>Edit</button>
                </div>
              </section>
            `)}
    `;
	}
	static {
		this.styles = [Q, o`
      .small {
        font-size: 13px;
      }
      .toolbar {
        margin-bottom: 12px;
      }
      .templates {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-bottom: 18px;
      }
      .empty {
        text-align: center;
        padding: 24px 0;
      }
      .chore {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        margin-bottom: 10px;
      }
      .name {
        font-size: 17px;
        font-weight: 500;
        margin-bottom: 2px;
      }
      .chore-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
    `];
	}
};
customElements.define("boopli-chores", Qe);
// src/boopli-speakers.ts
var $e = "amzn_sfx_scifi_alarm_01", et = "amzn_sfx_doorbell_chime_01", tt = "https://developer.amazon.com/en-US/docs/alexa/custom-skills/ask-soundlibrary.html", nt = [
	"siren",
	"switch",
	"input_boolean",
	"script"
], rt = [{
	value: "alexa",
	label: "Alexa sound"
}, {
	value: "file",
	label: "File in my media folder"
}], it = [
	{
		value: "alexa_media",
		label: "Alexa Media Player"
	},
	{
		value: "alexa_devices",
		label: "Alexa Devices (notify entity)"
	},
	{
		value: "tts",
		label: "A TTS voice on this speaker"
	}
], at = class extends K {
	static {
		this.properties = {
			hass: { attribute: !1 },
			settings: { attribute: !1 },
			_addSpeaker: { state: !0 },
			_addDevice: { state: !0 },
			_notes: { state: !0 }
		};
	}
	constructor() {
		super(), this._addSpeaker = "", this._addDevice = "", this._notes = {};
	}
	_patch(e) {
		this.dispatchEvent(new CustomEvent("settings-patch", {
			detail: e,
			bubbles: !0,
			composed: !0
		}));
	}
	_friendly(e) {
		let t = this.hass?.states[e]?.attributes?.friendly_name;
		return typeof t == "string" && t ? t : e;
	}
	_ids(e, t = []) {
		return Object.keys(this.hass?.states ?? {}).filter((n) => e.includes(n.split(".")[0]) && !t.includes(n)).sort((e, t) => this._friendly(e).localeCompare(this._friendly(t)));
	}
	_note(e, t) {
		this._notes = {
			...this._notes,
			[e]: t
		};
	}
	_targets(e, t) {
		let n = [];
		return n = e === "alexa_media" ? Object.keys(this.hass?.services?.notify ?? {}).filter((e) => e.startsWith("alexa_media_") && e !== "alexa_media").sort().map((e) => ({
			value: e,
			label: e.replace("alexa_media_", "")
		})) : e === "alexa_devices" ? Object.keys(this.hass?.states ?? {}).filter((e) => e.startsWith("notify.") && /_(speak|announce)$/.test(e)).sort().map((e) => ({
			value: e,
			label: this._friendly(e)
		})) : this._ids(["tts"]).map((e) => ({
			value: e,
			label: this._friendly(e)
		})), t && !n.some((e) => e.value === t) && n.unshift({
			value: t,
			label: `${t} (not found)`
		}), n;
	}
	_num(e, t, n) {
		let r = Math.round(Number(e));
		if (!(e.trim() === "" || Number.isNaN(r))) return Math.min(n, Math.max(t, r));
	}
	_speakers() {
		return this.settings?.speakers ?? [];
	}
	_updateSpeaker(e, t) {
		this._patch({ speakers: this._speakers().map((n) => n.entity_id === e ? t(n) : n) });
	}
	_newSpeaker(e) {
		return {
			entity_id: e,
			cue: {
				enabled: !1,
				kind: "alexa",
				sound: et,
				start_at: 1,
				seconds: 30,
				repeat_s: 5
			},
			speech: {
				enabled: !1,
				route: "alexa_media",
				target: "",
				announce: !1,
				start_at: 2
			},
			alarm: {
				enabled: !1,
				kind: "alexa",
				sound: $e,
				start_at: 4,
				seconds: 30,
				repeat_s: 5
			}
		};
	}
	_add() {
		this._addSpeaker &&= (this._patch({ speakers: [...this._speakers(), this._newSpeaker(this._addSpeaker)] }), "");
	}
	_setSound(e, t, n) {
		this._updateSpeaker(e, (e) => ({
			...e,
			[t]: {
				...e[t],
				...n
			}
		}));
	}
	_setSpeech(e, t) {
		this._updateSpeaker(e, (e) => ({
			...e,
			speech: {
				...e.speech,
				...t
			}
		}));
	}
	async _test(e, t) {
		if (!this.hass) return;
		let n = `speaker:${e.entity_id}:${t}`;
		this._note(n, "Sending…");
		try {
			this._note(n, (await Se(this.hass, e, t)).note);
		} catch (e) {
			this._note(n, q(e));
		}
	}
	_startAt(e, t, n = "Starts at nudge #") {
		return F`
      <label class="num">
        ${n}
        <input
          type="number"
          min="1"
          max="20"
          .value=${String(e)}
          @change=${(e) => {
			let n = this._num(e.target.value, 1, 20);
			n !== void 0 && t(n);
		}}
        />
      </label>
    `;
	}
	_soundRow(e, t) {
		let n = e[t], r = e.entity_id, i = `speaker:${r}:${t}`, a = t === "alarm", o = a ? "Alarm sound (loud, repeats)" : "Ding (a small sound)";
		return F`
      <div class="level">
        <label class="inline">
          <input
            type="checkbox"
            .checked=${n.enabled}
            @change=${(e) => this._setSound(r, t, { enabled: e.target.checked })}
          />
          ${o}
        </label>
        ${n.enabled ? F`
              <div class="fields">
                <label class="num wide">
                  Sound type
                  <select
                    .value=${n.kind}
                    @change=${(e) => this._setSound(r, t, { kind: e.target.value })}
                  >
                    ${rt.map((e) => F`<option value=${e.value} ?selected=${e.value === n.kind}>${e.label}</option>`)}
                  </select>
                </label>
                <label class="num wide">
                  ${n.kind === "alexa" ? "Alexa sound id" : "File (for example boopli/ding.mp3)"}
                  <input
                    type="text"
                    .value=${n.sound}
                    placeholder=${n.kind === "alexa" ? "amzn_sfx_…" : "boopli/ding.mp3"}
                    @change=${(e) => this._setSound(r, t, { sound: e.target.value.trim() })}
                  />
                </label>
                ${n.kind === "alexa" ? F`<div class="muted small libhint">
                      Pick a sound from the
                      <a href=${tt} target="_blank" rel="noopener noreferrer">Alexa sound library</a>.
                      The id is <code>amzn_sfx_</code> + the sound's name in lower case with underscores
                      + a two-digit number, for example "Doorbell Chime (1)" is
                      <code>amzn_sfx_doorbell_chime_01</code>. Press Test to hear it. Some ids stay silent.
                    </div>` : L}
                ${this._startAt(n.start_at, (e) => this._setSound(r, t, { start_at: e }))}
                ${a ? F`
                      <label class="num">
                        Rings for (seconds)
                        <input
                          type="number"
                          min="3"
                          max="600"
                          .value=${String(n.seconds)}
                          @change=${(e) => {
			let n = this._num(e.target.value, 3, 600);
			n !== void 0 && this._setSound(r, t, { seconds: n });
		}}
                        />
                      </label>
                      <label class="num">
                        Repeat every (seconds, 0 = once)
                        <input
                          type="number"
                          min="0"
                          max="60"
                          .value=${String(n.repeat_s)}
                          @change=${(e) => {
			let n = this._num(e.target.value, 0, 60);
			n !== void 0 && this._setSound(r, t, { repeat_s: n });
		}}
                        />
                      </label>
                    ` : L}
                <button @click=${() => this._test(e, t)}>Test</button>
              </div>
            ` : L}
        ${this._notes[i] ? F`<div class="note muted small">${this._notes[i]}</div>` : L}
      </div>
    `;
	}
	_speechRow(e) {
		let t = e.speech, n = e.entity_id, r = `speaker:${n}:speech`, i = this._targets(t.route, t.target);
		return F`
      <div class="level">
        <label class="inline">
          <input
            type="checkbox"
            .checked=${t.enabled}
            @change=${(e) => this._setSpeech(n, { enabled: e.target.checked })}
          />
          Speak a sentence
        </label>
        ${t.enabled ? F`
              <div class="fields">
                <label class="num wide">
                  How
                  <select
                    .value=${t.route}
                    @change=${(e) => this._setSpeech(n, {
			route: e.target.value,
			target: ""
		})}
                  >
                    ${it.map((e) => F`<option value=${e.value} ?selected=${e.value === t.route}>${e.label}</option>`)}
                  </select>
                </label>
                <label class="num wide">
                  ${t.route === "tts" ? "Voice" : "Alexa device"}
                  <select
                    .value=${t.target}
                    @change=${(e) => this._setSpeech(n, { target: e.target.value })}
                  >
                    <option value="" ?selected=${t.target === ""}>Choose…</option>
                    ${i.map((e) => F`<option value=${e.value} ?selected=${e.value === t.target}>${e.label}</option>`)}
                  </select>
                </label>
                ${t.route === "alexa_media" ? F`
                      <label class="inline small">
                        <input
                          type="checkbox"
                          .checked=${t.announce}
                          @change=${(e) => this._setSpeech(n, { announce: e.target.checked })}
                        />
                        Announce (with chime). Some Alexas stay silent, so test it.
                      </label>
                    ` : L}
                ${this._startAt(t.start_at, (e) => this._setSpeech(n, { start_at: e }))}
                <button @click=${() => this._test(e, "speech")}>Test</button>
              </div>
            ` : L}
        ${this._notes[r] ? F`<div class="note muted small">${this._notes[r]}</div>` : L}
      </div>
    `;
	}
	_renderSpeakers(e) {
		let t = e.speakers.map((e) => e.entity_id), n = this._ids(["media_player"], t);
		return F`
      <section class="card">
        <h2>Speakers</h2>
        <p class="muted small">
          Each speaker can play a small ding, speak a sentence, and sound an
          alarm. A speaker plays the highest level that has been reached. Press
          Test on each one to hear it.
        </p>
        ${e.speakers.map((t) => F`
            <div class="speaker">
              <div class="row">
                <div class="grow"><strong>${this._friendly(t.entity_id)}</strong></div>
                <button
                  aria-label="Remove speaker"
                  @click=${() => this._patch({ speakers: e.speakers.filter((e) => e.entity_id !== t.entity_id) })}
                >
                  ✕
                </button>
              </div>
              ${this._soundRow(t, "cue")} ${this._speechRow(t)}
              ${this._soundRow(t, "alarm")}
            </div>
          `)}
        <div class="row add">
          <select
            aria-label="Add a speaker"
            .value=${this._addSpeaker}
            @change=${(e) => this._addSpeaker = e.target.value}
          >
            <option value="">Add a speaker…</option>
            ${n.map((e) => F`<option value=${e} ?selected=${e === this._addSpeaker}>${this._friendly(e)}</option>`)}
          </select>
          <button ?disabled=${!this._addSpeaker} @click=${() => this._add()}>Add</button>
        </div>
        <div class="field">
          <label for="sentence">What the speakers say</label>
          <input
            id="sentence"
            type="text"
            .value=${e.speech_template}
            @change=${(e) => this._patch({ speech_template: e.target.value.trim() })}
          />
          <div class="muted small">
            Use {chore} for the chore name and {step} for the step. Example: "{chore}: {step}".
          </div>
        </div>
      </section>
    `;
	}
	_updateDevice(e, t) {
		this._patch({ alarm_devices: (this.settings?.alarm_devices ?? []).map((n) => n.entity_id === e ? {
			...n,
			...t
		} : n) });
	}
	async _testDevice(e) {
		if (!this.hass) return;
		let t = `device:${e.entity_id}`;
		this._note(t, "Sending…");
		try {
			this._note(t, (await Ce(this.hass, e)).note);
		} catch (e) {
			this._note(t, q(e));
		}
	}
	_renderDevices(e) {
		let t = e.alarm_devices.map((e) => e.entity_id), n = this._ids(nt, t);
		return F`
      <section class="card">
        <h2>Alarm devices</h2>
        <p class="muted small">
          A siren, switch or script that sounds the alarm. Boopli switches it on
          for the time you set and then off again, and off when you answer or
          when Home Assistant restarts.
        </p>
        ${e.alarm_devices.map((t) => {
			let n = `device:${t.entity_id}`;
			return F`
            <div class="row">
              <div class="grow">${this._friendly(t.entity_id)}</div>
              ${this._startAt(t.start_at, (e) => this._updateDevice(t.entity_id, { start_at: e }))}
              <label class="num">
                On for (seconds)
                <input
                  type="number"
                  min="3"
                  max="600"
                  .value=${String(t.seconds)}
                  @change=${(e) => {
				let n = this._num(e.target.value, 3, 600);
				n !== void 0 && this._updateDevice(t.entity_id, { seconds: n });
			}}
                />
              </label>
              <button @click=${() => this._testDevice(t)}>Test</button>
              <button
                aria-label="Remove alarm device"
                @click=${() => this._patch({ alarm_devices: e.alarm_devices.filter((e) => e.entity_id !== t.entity_id) })}
              >
                ✕
              </button>
            </div>
            ${this._notes[n] ? F`<div class="note muted small">${this._notes[n]}</div>` : L}
          `;
		})}
        <div class="row add">
          <select
            aria-label="Add an alarm device"
            .value=${this._addDevice}
            @change=${(e) => this._addDevice = e.target.value}
          >
            <option value="">Add a siren, switch or script…</option>
            ${n.map((e) => F`<option value=${e} ?selected=${e === this._addDevice}>${this._friendly(e)}</option>`)}
          </select>
          <button
            ?disabled=${!this._addDevice}
            @click=${() => {
			this._patch({ alarm_devices: [...e.alarm_devices, {
				entity_id: this._addDevice,
				seconds: 30,
				start_at: 4
			}] }), this._addDevice = "";
		}}
          >
            Add
          </button>
        </div>
      </section>
    `;
	}
	render() {
		let e = this.settings;
		return e ? F`${this._renderSpeakers(e)} ${this._renderDevices(e)}` : L;
	}
	static {
		this.styles = [Q, o`
      section.card {
        margin-bottom: 16px;
      }
      h2 {
        font-size: 18px;
        margin-bottom: 6px;
      }
      .small {
        font-size: 13px;
      }
      .speaker {
        border-top: 1px solid var(--divider-color);
        padding: 10px 0 4px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        padding: 6px 0;
      }
      .row.add {
        border-top: 1px solid var(--divider-color);
      }
      .row select {
        flex: 1 1 200px;
        width: auto;
      }
      .grow {
        flex: 1 1 160px;
      }
      .level {
        padding: 6px 0;
      }
      .fields {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: flex-end;
        padding: 6px 0 4px 28px;
      }
      label.num {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        margin: 0;
        width: 150px;
      }
      label.num.wide {
        width: 220px;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--primary-text-color);
        margin: 0;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      .note {
        padding: 2px 0 6px 28px;
      }
      .libhint {
        flex: 1 1 100%;
      }
      .libhint a {
        color: var(--primary-color);
      }
      code {
        font-size: 12px;
      }
      .field {
        margin: 14px 0 4px;
      }
    `];
	}
};
customElements.define("boopli-speakers", at);
// src/boopli-settings.ts
var ot = [
	{
		value: "normal",
		label: "Normal notification"
	},
	{
		value: "high",
		label: "High priority (pops up)"
	},
	{
		value: "alarm",
		label: "Alarm volume"
	},
	{
		value: "alarm_max",
		label: "Max volume (not on every phone)"
	}
], st = [{
	value: "blink",
	label: "Blink"
}, {
	value: "indicator",
	label: "Indicator lamp (on until done)"
}], ct = [
	{
		value: "quiet",
		label: "Quiet (no nudges)"
	},
	{
		value: "one",
		label: "One nudge"
	},
	{
		value: "escalating",
		label: "Escalating"
	},
	{
		value: "persistent",
		label: "Persistent"
	}
], lt = {
	start: "07:00",
	stop: "22:00"
}, ut = class extends K {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			_draft: { state: !0 },
			_addLight: { state: !0 },
			_busy: { state: !0 },
			_message: { state: !0 },
			_error: { state: !0 },
			_notes: { state: !0 }
		};
	}
	constructor() {
		super(), this._addLight = "", this._busy = !1, this._message = "", this._error = "", this._notes = {};
	}
	willUpdate() {
		!this._draft && this.snapshot && (this._draft = structuredClone(this.snapshot.settings));
	}
	_set(e) {
		this._draft && (this._draft = {
			...this._draft,
			...e
		}, this._message = "");
	}
	_friendly(e) {
		let t = this.hass?.states[e]?.attributes?.friendly_name;
		return typeof t == "string" && t ? t : e;
	}
	_phoneServices() {
		let e = Object.keys(this.hass?.services?.notify ?? {}).filter((e) => e.startsWith("mobile_app_")), t = this._draft?.phones.map((e) => e.service) ?? [];
		return [.../* @__PURE__ */ new Set([...e, ...t])].sort();
	}
	_lightChoices() {
		let e = new Set(this._draft?.lights.map((e) => e.entity_id));
		return Object.keys(this.hass?.states ?? {}).filter((t) => t.startsWith("light.") && !e.has(t)).sort((e, t) => this._friendly(e).localeCompare(this._friendly(t)));
	}
	_persons() {
		return Object.keys(this.hass?.states ?? {}).filter((e) => e.startsWith("person.")).sort();
	}
	_note(e, t) {
		this._notes = {
			...this._notes,
			[e]: t
		};
	}
	_togglePhone(e, t) {
		if (!this._draft) return;
		let n = this._draft.phones.filter((t) => t.service !== e);
		this._set({ phones: t ? [...n, {
			service: e,
			level: "normal",
			start_at: 1
		}] : n });
	}
	_startAtField(e, t) {
		return F`
      <label class="startat">
        Starts at nudge #
        <input
          type="number"
          min="1"
          max="20"
          .value=${String(e)}
          @change=${(e) => {
			let n = Math.round(Number(e.target.value));
			Number.isNaN(n) || t(Math.min(20, Math.max(1, n)));
		}}
        />
      </label>
    `;
	}
	_setPhoneStart(e, t) {
		this._draft && this._set({ phones: this._draft.phones.map((n) => n.service === e ? {
			...n,
			start_at: t
		} : n) });
	}
	_setPhoneLevel(e, t) {
		this._draft && this._set({ phones: this._draft.phones.map((n) => n.service === e ? {
			...n,
			level: t
		} : n) });
	}
	async _testPhone(e) {
		if (!this.hass || !this._draft) return;
		let t = this._draft.phones.find((t) => t.service === e)?.level ?? "normal";
		this._note(`phone:${e}`, "Sending…");
		try {
			let n = await xe(this.hass, {
				service: e,
				level: t,
				start_at: 1
			});
			this._note(`phone:${e}`, n.note);
		} catch (t) {
			this._note(`phone:${e}`, q(t));
		}
	}
	_addSelectedLight() {
		if (!this._draft || !this._addLight) return;
		let e = {
			entity_id: this._addLight,
			mode: "blink",
			color: [
				255,
				90,
				0
			],
			blink_ms: 1500,
			repeats: 1,
			gap_ms: 1e3,
			start_at: 1
		};
		this._set({ lights: [...this._draft.lights, e] }), this._addLight = "";
	}
	_patchLight(e, t) {
		this._draft && this._set({ lights: this._draft.lights.map((n) => n.entity_id === e ? {
			...n,
			...t
		} : n) });
	}
	_setLightMode(e, t) {
		this._patchLight(e, { mode: t });
	}
	_setLightNumber(e, t, n, r, i) {
		let a = Math.round(Number(n));
		n.trim() === "" || Number.isNaN(a) || this._patchLight(e, { [t]: Math.min(i, Math.max(r, a)) });
	}
	_hexToRgb(e) {
		let t = parseInt(e.replace("#", ""), 16);
		return [
			t >> 16 & 255,
			t >> 8 & 255,
			t & 255
		];
	}
	_rgbToHex(e) {
		return "#" + e.map((e) => e.toString(16).padStart(2, "0")).join("");
	}
	_removeLight(e) {
		this._draft && this._set({ lights: this._draft.lights.filter((t) => t.entity_id !== e) });
	}
	async _testLight(e) {
		if (this.hass) {
			this._note(`light:${e.entity_id}`, "Testing…");
			try {
				let t = await be(this.hass, e);
				this._note(`light:${e.entity_id}`, t.note);
			} catch (t) {
				this._note(`light:${e.entity_id}`, q(t));
			}
		}
	}
	_setQuiet(e) {
		if (!this._draft) return;
		let t = this._draft.quiet_hours.days;
		e && Object.keys(t).length === 0 && (t = Object.fromEntries(Y.map((e, t) => [String(t), { ...lt }]))), this._set({ quiet_hours: {
			enabled: e,
			days: t
		} });
	}
	_setDay(e, t) {
		if (!this._draft) return;
		let n = this._draft.quiet_hours;
		this._set({ quiet_hours: {
			...n,
			days: {
				...n.days,
				[String(e)]: t
			}
		} });
	}
	_copyMondayToAll() {
		if (!this._draft) return;
		let e = this._draft.quiet_hours, t = e.days[0], n = Object.fromEntries(Y.map((e, n) => [String(n), t ? { ...t } : null]));
		this._set({ quiet_hours: {
			...e,
			days: n
		} });
	}
	async _save() {
		if (this.hass && this._draft && !this._busy) {
			this._busy = !0, this._error = "", this._message = "";
			try {
				await ye(this.hass, this._draft), this._message = "Saved.";
			} catch (e) {
				this._error = q(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderPhones(e) {
		let t = this._phoneServices();
		return F`
      <section class="card">
        <h2>Phones</h2>
        <p class="muted small">
          Boopli sends a notification with Done and Snooze buttons through the
          Home Assistant app on the phones you turn on.
        </p>
        ${t.length === 0 ? F`<p class="muted">No phones with the Home Assistant app found.</p>` : t.map((t) => {
			let n = e.phones.find((e) => e.service === t), r = this._notes[`phone:${t}`];
			return F`
                <div class="row">
                  <label class="inline">
                    <input
                      type="checkbox"
                      .checked=${!!n}
                      @change=${(e) => this._togglePhone(t, e.target.checked)}
                    />
                    ${t.replace("mobile_app_", "")}
                  </label>
                  <select
                    aria-label="Notification level"
                    ?disabled=${!n}
                    .value=${n?.level ?? "normal"}
                    @change=${(e) => this._setPhoneLevel(t, e.target.value)}
                  >
                    ${ot.map((e) => F`<option value=${e.value} ?selected=${e.value === (n?.level ?? "normal")}>${e.label}</option>`)}
                  </select>
                  <button @click=${() => this._testPhone(t)}>Test</button>
                </div>
                ${n ? F`<div class="startrow">
                      ${this._startAtField(n.start_at ?? 1, (e) => this._setPhoneStart(t, e))}
                    </div>` : L}
                ${r ? F`<div class="note muted small">${r}</div>` : L}
              `;
		})}
      </section>
    `;
	}
	_renderLights(e) {
		let t = this._lightChoices();
		return F`
      <section class="card">
        <h2>Lights</h2>
        <p class="muted small">
          Boopli blinks a light itself and puts it back exactly as it was, or
          uses it as an indicator lamp that stays on in a color until you are
          done. Press Test to see what a light really does: lights differ a lot.
        </p>
        ${e.lights.map((e) => {
			let t = this._notes[`light:${e.entity_id}`], n = e.entity_id, r = e.mode === "blink";
			return F`
            <div class="row">
              <div class="grow">
                <div>${this._friendly(n)}</div>
                ${this.hass?.states[n] ? L : F`<div class="muted small">Not found right now</div>`}
              </div>
              <select
                aria-label="Light mode"
                .value=${e.mode}
                @change=${(e) => this._setLightMode(n, e.target.value)}
              >
                ${st.map((t) => F`<option value=${t.value} ?selected=${t.value === e.mode}>${t.label}</option>`)}
              </select>
              <input
                type="color"
                class="swatch"
                aria-label="Color"
                .value=${this._rgbToHex(e.color)}
                @input=${(e) => this._patchLight(n, { color: this._hexToRgb(e.target.value) })}
              />
              <button @click=${() => this._testLight(e)}>Test</button>
              <button aria-label="Remove light" @click=${() => this._removeLight(n)}>✕</button>
            </div>
            <div class="startrow">
              ${this._startAtField(e.start_at ?? 1, (e) => this._patchLight(n, { start_at: e }))}
            </div>
            ${r ? F`
                  <div class="blinkopts">
                    <label>
                      Blink length (ms)
                      <input
                        type="number"
                        min="100"
                        max="30000"
                        step="100"
                        .value=${String(e.blink_ms)}
                        @change=${(e) => this._setLightNumber(n, "blink_ms", e.target.value, 100, 3e4)}
                      />
                    </label>
                    <label>
                      Blinks
                      <input
                        type="number"
                        min="1"
                        max="5"
                        .value=${String(e.repeats)}
                        @change=${(e) => this._setLightNumber(n, "repeats", e.target.value, 1, 5)}
                      />
                    </label>
                    <label>
                      Pause between (ms)
                      <input
                        type="number"
                        min="0"
                        max="30000"
                        step="100"
                        .value=${String(e.gap_ms)}
                        @change=${(e) => this._setLightNumber(n, "gap_ms", e.target.value, 0, 3e4)}
                      />
                    </label>
                  </div>
                  <div class="muted small hint">
                    A light in your home can follow a few hundred milliseconds. A
                    light that goes through a cloud service needs about a second
                    or more, so find its limit with Test.
                  </div>
                ` : L}
            ${t ? F`<div class="note muted small">${t}</div>` : L}
          `;
		})}
        <div class="row add">
          <select
            aria-label="Add a light"
            .value=${this._addLight}
            @change=${(e) => this._addLight = e.target.value}
          >
            <option value="">Add a light…</option>
            ${t.map((e) => F`<option value=${e} ?selected=${e === this._addLight}>${this._friendly(e)}</option>`)}
          </select>
          <button ?disabled=${!this._addLight} @click=${() => this._addSelectedLight()}>Add</button>
        </div>
      </section>
    `;
	}
	_renderQuiet(e) {
		let t = e.quiet_hours;
		return F`
      <section class="card">
        <h2>Quiet hours</h2>
        <p class="muted small">
          Nudges wait outside these times. Set different hours for each day.
          A chore can opt out (for example pills).
        </p>
        <label class="inline">
          <input
            type="checkbox"
            .checked=${t.enabled}
            @change=${(e) => this._setQuiet(e.target.checked)}
          />
          Hold nudges outside these hours
        </label>
        ${t.enabled ? F`
              ${Y.map((e, n) => {
			let r = t.days[String(n)] ?? null;
			return F`
                  <div class="row day">
                    <span class="dayname">${e}</span>
                    <label class="inline small">
                      <input
                        type="checkbox"
                        .checked=${r === null}
                        @change=${(e) => this._setDay(n, e.target.checked ? null : { ...lt })}
                      />
                      No limit
                    </label>
                    ${r ? F`
                          <span class="muted small">from</span>
                          <input
                            type="time"
                            aria-label="${e} nudges start"
                            .value=${r.start}
                            @input=${(e) => this._setDay(n, {
				...r,
				start: e.target.value
			})}
                          />
                          <span class="muted small">until</span>
                          <input
                            type="time"
                            aria-label="${e} nudges stop"
                            .value=${r.stop}
                            @input=${(e) => this._setDay(n, {
				...r,
				stop: e.target.value
			})}
                          />
                        ` : L}
                  </div>
                `;
		})}
              <button class="chip" @click=${() => this._copyMondayToAll()}>Copy Monday to all days</button>
            ` : L}
      </section>
    `;
	}
	_renderOther(e) {
		return F`
      <section class="card">
        <h2>Presence, snooze and defaults</h2>
        <div class="field">
          <label for="presence">Presence (optional)</label>
          <select
            id="presence"
            .value=${e.presence_entity}
            @change=${(e) => this._set({ presence_entity: e.target.value })}
          >
            <option value="" ?selected=${e.presence_entity === ""}>None (assume I am home)</option>
            ${this._persons().map((t) => F`<option value=${t} ?selected=${t === e.presence_entity}>${this._friendly(t)}</option>`)}
          </select>
          <div class="muted small">
            At home Boopli uses everything above. Away, it only uses your phone,
            and only for chores marked "anywhere".
            ${this.snapshot ? this.snapshot.is_home ? "Right now: home." : "Right now: away." : L}
          </div>
        </div>
        <div class="field">
          <label for="petname">Your pet's name</label>
          <input
            id="petname"
            maxlength="30"
            .value=${e.pet_name ?? "Boopli"}
            @input=${(e) => this._set({ pet_name: e.target.value })}
          />
        </div>
        <div class="field">
          <label for="snooze">Snooze length (minutes)</label>
          <input
            id="snooze"
            type="number"
            min="1"
            max="720"
            .value=${String(e.snooze_minutes)}
            @input=${(e) => this._set({ snooze_minutes: Number(e.target.value) || 15 })}
          />
        </div>
        <div class="field">
          <label for="style">Default nudge style for new chores</label>
          <select
            id="style"
            .value=${e.default_style}
            @change=${(e) => this._set({ default_style: e.target.value })}
          >
            ${ct.map((t) => F`<option value=${t.value} ?selected=${t.value === e.default_style}>${t.label}</option>`)}
          </select>
        </div>
      </section>
    `;
	}
	render() {
		let e = this._draft;
		return e ? F`
      ${this._renderPhones(e)} ${this._renderLights(e)}
      <boopli-speakers
        .hass=${this.hass}
        .settings=${e}
        @settings-patch=${(e) => this._set(e.detail)}
      ></boopli-speakers>
      ${this._renderQuiet(e)} ${this._renderOther(e)}
      ${this._error ? F`<div class="error">${this._error}</div>` : L}
      <div class="save">
        <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save settings</button>
        ${this._message ? F`<span class="muted">${this._message}</span>` : L}
      </div>
    ` : F`<p class="muted">Loading…</p>`;
	}
	static {
		this.styles = [Q, o`
      section.card {
        margin-bottom: 16px;
      }
      h2 {
        font-size: 18px;
        margin-bottom: 6px;
      }
      .small {
        font-size: 13px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        padding: 8px 0;
        border-top: 1px solid var(--divider-color);
      }
      .row select {
        flex: 1 1 200px;
        width: auto;
      }
      .grow {
        flex: 1 1 160px;
      }
      .note {
        padding: 0 0 8px;
      }
      .startrow {
        padding: 0 0 8px;
      }
      label.startat {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        margin: 0;
      }
      label.startat input {
        width: 80px;
      }
      .blinkopts {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        padding: 0 0 4px;
      }
      .blinkopts label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        margin: 0;
      }
      .blinkopts input {
        width: 130px;
      }
      .hint {
        padding: 0 0 8px;
      }
      .swatch {
        width: 44px;
        min-height: 36px;
        padding: 2px;
        flex: 0 0 auto;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--primary-text-color);
        margin: 0;
        flex: 1 1 140px;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      .day input[type="time"] {
        width: 120px;
      }
      .dayname {
        width: 36px;
        font-weight: 500;
      }
      .field {
        margin: 14px 0;
      }
      .add {
        border-top: 1px solid var(--divider-color);
      }
      .save {
        display: flex;
        align-items: center;
        gap: 14px;
        margin: 8px 0 24px;
      }
    `];
	}
};
customElements.define("boopli-settings", ut);
// src/boopli-panel.ts
var dt = {
	today: "Today",
	chores: "Chores",
	settings: "Settings"
}, ft = class extends K {
	static {
		this.properties = {
			hass: { attribute: !1 },
			narrow: { type: Boolean },
			_snapshot: { state: !0 },
			_tab: { state: !0 },
			_nowMs: { state: !0 },
			_connectionError: { state: !0 }
		};
	}
	constructor() {
		super(), this._subscribing = !1, this.narrow = !1, this._tab = "today", this._nowMs = Date.now(), this._connectionError = "";
	}
	connectedCallback() {
		super.connectedCallback(), this._timer = window.setInterval(() => this._nowMs = Date.now(), 3e4);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearInterval(this._timer), this._unsub?.(), this._unsub = void 0, this._subscribing = !1;
	}
	updated() {
		this.hass && !this._unsub && !this._subscribing && (this._subscribing = !0, we(this.hass, (e) => {
			this._snapshot = e, this._nowMs = Date.now(), this._connectionError = "";
		}).then((e) => {
			this._unsub = e;
		}).catch(() => {
			this._connectionError = "Could not reach Boopli. Is the integration set up?";
		}).finally(() => {
			this._subscribing = !1;
		}));
	}
	_toggleSidebar() {
		this.dispatchEvent(new CustomEvent("hass-toggle-menu", {
			bubbles: !0,
			composed: !0
		}));
	}
	render() {
		return F`
      <header>
        ${this.narrow ? F`<button
              class="menu"
              aria-label="Open sidebar"
              @click=${this._toggleSidebar}
            >
              ☰
            </button>` : L}
        <h1>Boopli</h1>
        <nav>
          ${Object.keys(dt).map((e) => F`<button
              class="tab ${this._tab === e ? "on" : ""}"
              @click=${() => this._tab = e}
            >
              ${dt[e]}
            </button>`)}
        </nav>
      </header>
      <main>
        ${this._connectionError ? F`<p class="error">${this._connectionError}</p>` : this._tab === "today" ? F`<boopli-today
                .hass=${this.hass}
                .snapshot=${this._snapshot}
                .nowMs=${this._nowMs}
              ></boopli-today>` : this._tab === "chores" ? F`<boopli-chores
                  .hass=${this.hass}
                  .snapshot=${this._snapshot}
                  .nowMs=${this._nowMs}
                ></boopli-chores>` : F`<boopli-settings
                  .hass=${this.hass}
                  .snapshot=${this._snapshot}
                ></boopli-settings>`}
      </main>
    `;
	}
	static {
		this.styles = [Q, o`
      :host {
        min-height: 100%;
        background: var(--primary-background-color);
      }
      header {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 56px;
        padding: 0 16px;
        background: var(--app-header-background-color, var(--primary-color));
        color: var(--app-header-text-color, #fff);
      }
      header h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
        margin-right: 8px;
      }
      header .menu {
        background: none;
        border: 0;
        color: inherit;
        font-size: 22px;
        padding: 8px;
        min-height: 0;
      }
      nav {
        display: flex;
        gap: 4px;
      }
      .tab {
        background: none;
        border: 0;
        border-radius: 10px;
        color: inherit;
        opacity: 0.75;
        padding: 8px 14px;
      }
      .tab:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .tab.on {
        opacity: 1;
        background: rgba(255, 255, 255, 0.2);
        font-weight: 500;
      }
      main {
        max-width: 640px;
        margin: 0 auto;
        padding: 20px 16px 48px;
      }
    `];
	}
};
customElements.define("boopli-panel", ft);
export { ft as BoopliPanel };

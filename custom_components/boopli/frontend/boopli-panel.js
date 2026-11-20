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
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: ee, getOwnPropertySymbols: te, getPrototypeOf: ne } = Object, f = globalThis, p = f.trustedTypes, re = p ? p.emptyScript : "", ie = f.reactiveElementPolyfillSupport, m = (e, t) => e, h = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? re : null;
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
}, g = (e, t) => !l(e, t), _ = {
	attribute: !0,
	type: String,
	converter: h,
	reflect: !1,
	useDefault: !1,
	hasChanged: g
};
Symbol.metadata ??= Symbol("metadata"), f.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var v = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = _) {
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
		return this.elementProperties.get(e) ?? _;
	}
	static _$Ei() {
		if (this.hasOwnProperty(m("elementProperties"))) return;
		let e = ne(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(m("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(m("properties"))) {
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
			let i = (n.converter?.toAttribute === void 0 ? h : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? h : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? g)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
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
v.elementStyles = [], v.shadowRootOptions = { mode: "open" }, v[m("elementProperties")] = /* @__PURE__ */ new Map(), v[m("finalized")] = /* @__PURE__ */ new Map(), ie?.({ ReactiveElement: v }), (f.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var y = globalThis, ae = (e) => e, b = y.trustedTypes, x = b ? b.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, S = "$lit$", C = `lit$${Math.random().toFixed(9).slice(2)}$`, w = "?" + C, oe = `<${w}>`, T = document, E = () => T.createComment(""), D = (e) => e === null || typeof e != "object" && typeof e != "function", O = Array.isArray, se = (e) => O(e) || typeof e?.[Symbol.iterator] == "function", k = "[ 	\n\f\r]", A = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, j = /-->/g, ce = />/g, M = RegExp(`>|${k}(?:([^\\s"'>=/]+)(${k}*=${k}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), N = /'/g, P = /"/g, F = /^(?:script|style|textarea|title)$/i, I = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), L = Symbol.for("lit-noChange"), R = Symbol.for("lit-nothing"), z = /* @__PURE__ */ new WeakMap(), B = T.createTreeWalker(T, 129);
function V(e, t) {
	if (!O(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return x === void 0 ? t : x.createHTML(t);
}
var le = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = A;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === A ? c[1] === "!--" ? o = j : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = M) : (F.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = M) : o = ce : o === M ? c[0] === ">" ? (o = i ?? A, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? M : c[3] === "\"" ? P : N) : o === P || o === N ? o = M : o === j || o === ce ? o = A : (o = M, i = void 0);
		let d = o === M && e[t + 1].startsWith("/>") ? " " : "";
		a += o === A ? n + oe : l >= 0 ? (r.push(s), n.slice(0, l) + S + n.slice(l) + C + d) : n + C + (l === -2 ? t : d);
	}
	return [V(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, H = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = le(t, n);
		if (this.el = e.createElement(l, r), B.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = B.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(S)) {
					let t = u[o++], n = i.getAttribute(e).split(C), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? de : r[1] === "?" ? fe : r[1] === "@" ? pe : G
					}), i.removeAttribute(e);
				} else e.startsWith(C) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (F.test(i.tagName)) {
					let e = i.textContent.split(C), t = e.length - 1;
					if (t > 0) {
						i.textContent = b ? b.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], E()), B.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], E());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === w) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(C, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += C.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = T.createElement("template");
		return n.innerHTML = e, n;
	}
};
function U(e, t, n = e, r) {
	if (t === L) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = D(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = U(e, i._$AS(e, t.values), i, r)), t;
}
var ue = class {
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? T).importNode(t, !0);
		B.currentNode = r;
		let i = B.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new W(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new me(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = B.nextNode(), a++);
		}
		return B.currentNode = T, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, W = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = R, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = U(this, e, t), D(e) ? e === R || e == null || e === "" ? (this._$AH !== R && this._$AR(), this._$AH = R) : e !== this._$AH && e !== L && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? se(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== R && D(this._$AH) ? this._$AA.nextSibling.data = e : this.T(T.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = H.createElement(V(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new ue(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = z.get(e.strings);
		return t === void 0 && z.set(e.strings, t = new H(e)), t;
	}
	k(t) {
		O(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(E()), this.O(E()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = ae(e).nextSibling;
			ae(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, G = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = R, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = R;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = U(this, e, t, 0), a = !D(e) || e !== this._$AH && e !== L, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = U(this, r[n + o], t, o), s === L && (s = this._$AH[o]), a ||= !D(s) || s !== this._$AH[o], s === R ? e = R : e !== R && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === R ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, de = class extends G {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === R ? void 0 : e;
	}
}, fe = class extends G {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== R);
	}
}, pe = class extends G {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = U(this, e, t, 0) ?? R) === L) return;
		let n = this._$AH, r = e === R && n !== R || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== R && (n === R || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, me = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		U(this, e);
	}
}, he = y.litHtmlPolyfillSupport;
he?.(H, W), (y.litHtmlVersions ??= []).push("3.3.3");
var ge = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new W(t.insertBefore(E(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, K = globalThis, q = class extends v {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ge(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return L;
	}
};
q._$litElement$ = !0, q.finalized = !0, K.litElementHydrateSupport?.({ LitElement: q });
var _e = K.litElementPolyfillSupport;
_e?.({ LitElement: q }), (K.litElementVersions ??= []).push("4.2.2");
// src/api.ts
function ve(e, t) {
	return e.connection.subscribeMessage(t, { type: "boopli/subscribe" });
}
function ye(e, t) {
	return e.callWS({
		type: "boopli/chore_save",
		chore: t
	});
}
function be(e, t) {
	return e.callWS({
		type: "boopli/chore_delete",
		chore_id: t
	});
}
function xe(e, t) {
	return e.callWS({
		type: "boopli/chore_start",
		chore_id: t
	});
}
function Se(e, t, n) {
	return e.callWS({
		type: "boopli/step_complete",
		run_id: t,
		step_id: n
	});
}
function J(e) {
	return e && typeof e == "object" && "message" in e ? String(e.message) : "Something went wrong.";
}
// src/time.ts
var Y = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun"
], Ce = Y;
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
function Q(e) {
	let [t, n, r] = e.split("-").map(Number);
	return Math.round(Date.UTC(t, n - 1, r) / 864e5);
}
function we(e, t, n) {
	let r = new Date(e), i = Q(Z(r, n)) - Q(Z(new Date(t), n)), a = X(e, n);
	return i === 0 ? `today ${a}` : i === 1 ? `tomorrow ${a}` : `${new Intl.DateTimeFormat("en-GB", {
		timeZone: n,
		weekday: "short",
		day: "numeric",
		month: "short"
	}).format(r)}, ${a}`;
}
function Te(e, t, n) {
	return Z(new Date(e), n) === Z(new Date(t), n);
}
function Ee(e) {
	let t = Math.max(0, Math.round(e));
	if (t < 1) return "less than a minute";
	if (t < 60) return `${t} min`;
	let n = Math.floor(t / 60), r = t % 60;
	return r === 0 ? `${n}h` : `${n}h ${r}m`;
}
function De(e, t) {
	let n = (new Date(e).getTime() - t) / 6e4;
	return n <= .5 ? "any moment now" : `in ${Ee(n)}`;
}
function Oe(e, t) {
	return `since ${X(e, t)}`;
}
function ke(e) {
	switch (e.type) {
		case "none": return "On demand";
		case "daily": return `Every day at ${e.time}`;
		case "weekly": return `Every ${[...e.weekdays].sort((e, t) => e - t).map((e) => Y[e]).join(", ")} at ${e.time}`;
		case "every_n_days": return e.every_n_days === 1 ? `Every day after you finish, at ${e.time}` : `${e.every_n_days} days after you finish, at ${e.time}`;
	}
}
// src/today.ts
function Ae(e, t) {
	let n = e.time_zone, r = e.runs.flatMap((e) => e.steps.filter((e) => e.status === "active").map((t) => ({
		run: e,
		step: t
	}))).sort((e, t) => (e.step.active_at ? Date.parse(e.step.active_at) : Infinity) - (t.step.active_at ? Date.parse(t.step.active_at) : Infinity))[0] ?? null, i = [...e.runs].sort((e, t) => Date.parse(e.started_at) - Date.parse(t.started_at)).map((e) => ({
		run: e,
		steps: e.steps.filter((t) => t.status !== "done" && !(r && r.run.id === e.id && r.step.step_id === t.step_id)).map((e) => {
			let n = "";
			return e.status === "active" ? n = "ready now" : e.status === "waiting" && e.active_at ? n = De(e.active_at, t) : e.wait_minutes > 0 && (n = `${Ee(e.wait_minutes)} after the step before`), {
				title: e.title,
				status: e.status,
				hint: n
			};
		})
	})).filter((e) => e.steps.length > 0), a = new Set(e.runs.map((e) => e.chore_id));
	return {
		now: r,
		groups: i,
		dueToday: e.chores.filter((e) => e.enabled && e.next_due !== null && !a.has(e.id) && Te(e.next_due, t, n)).map((e) => ({
			chore: e,
			at: e.next_due
		})).sort((e, t) => Date.parse(e.at) - Date.parse(t.at))
	};
}
// src/styles.ts
var $ = o`
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
`, je = class extends q {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			nowMs: { type: Number },
			_busy: { state: !0 },
			_error: { state: !0 }
		};
	}
	constructor() {
		super(), this.nowMs = Date.now(), this._busy = !1, this._error = "";
	}
	async _done(e, t) {
		if (this.hass && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				await Se(this.hass, e, t);
			} catch (e) {
				this._error = J(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	render() {
		if (!this.snapshot) return I`<p class="muted">Loading…</p>`;
		let e = this.snapshot.time_zone, t = Ae(this.snapshot, this.nowMs), n = this.snapshot.chores.length > 0;
		return I`
      ${t.now ? I`
            <section class="card now">
              <div class="muted small">${t.now.run.chore_name}</div>
              <h2>${t.now.step.title}</h2>
              ${t.now.step.active_at ? I`<div class="muted small">
                    ${Oe(t.now.step.active_at, e)}
                  </div>` : R}
              <button
                class="primary done"
                ?disabled=${this._busy}
                @click=${() => this._done(t.now.run.id, t.now.step.step_id)}
              >
                Done
              </button>
              ${this._error ? I`<div class="error">${this._error}</div>` : R}
            </section>
          ` : I`
            <section class="card empty">
              <h2>Nothing needs you right now</h2>
              <p class="muted">
                ${n ? "Enjoy the quiet. What is coming up shows below." : "Add your first chore in the Chores tab."}
              </p>
            </section>
          `}
      ${t.groups.length > 0 || t.dueToday.length > 0 ? I`
            <section class="later dim">
              <h3>Still to do today</h3>
              ${t.groups.map((e) => I`
                  <div class="group">
                    <div class="group-name">${e.run.chore_name}</div>
                    ${e.steps.map((e) => I`
                        <div class="row">
                          <span>${e.title}</span>
                          <span class="hint">${e.hint}</span>
                        </div>
                      `)}
                  </div>
                `)}
              ${t.dueToday.map((t) => I`
                  <div class="group">
                    <div class="row">
                      <span class="group-name">${t.chore.name}</span>
                      <span class="hint">at ${X(t.at, e)}</span>
                    </div>
                  </div>
                `)}
            </section>
          ` : R}
    `;
	}
	static {
		this.styles = [$, o`
      .small {
        font-size: 14px;
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
      .later {
        margin-top: 28px;
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
customElements.define("boopli-today", je);
// src/boopli-chore-editor.ts
var Me = [
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
], Ne = [
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
], Pe = class extends q {
	static {
		this.properties = {
			hass: { attribute: !1 },
			draft: { attribute: !1 },
			_error: { state: !0 },
			_busy: { state: !0 },
			_confirmDelete: { state: !0 }
		};
	}
	constructor() {
		super(), this._error = "", this._busy = !1, this._confirmDelete = !1;
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
				await ye(this.hass, {
					...this.draft,
					name: this.draft.name.trim(),
					steps: this.draft.steps.map((e) => ({
						...e,
						title: e.title.trim()
					}))
				}), this._close();
			} catch (e) {
				this._error = J(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	async _delete() {
		if (this.hass && this.draft.id && !this._busy) {
			this._busy = !0;
			try {
				await be(this.hass, this.draft.id), this._close();
			} catch (e) {
				this._error = J(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderRepeat() {
		let e = this.draft.repeat;
		return I`
      <div class="field">
        <label for="repeat">Repeats</label>
        <select
          id="repeat"
          .value=${e.type}
          @change=${(e) => this._updateRepeat({ type: e.target.value })}
        >
          ${Ne.map((t) => I`<option value=${t.value} ?selected=${t.value === e.type}>${t.label}</option>`)}
        </select>
      </div>
      ${e.type === "weekly" ? I`<div class="field">
            <label>On these days</label>
            <div class="chips">
              ${Ce.map((t, n) => I`<button
                  type="button"
                  class="chip ${e.weekdays.includes(n) ? "on" : ""}"
                  @click=${() => this._toggleWeekday(n)}
                >
                  ${t}
                </button>`)}
            </div>
          </div>` : R}
      ${e.type === "every_n_days" ? I`<div class="field">
            <label for="n">Number of days</label>
            <input
              id="n"
              type="number"
              min="1"
              max="365"
              .value=${String(e.every_n_days)}
              @input=${(e) => this._updateRepeat({ every_n_days: Number(e.target.value) || 1 })}
            />
          </div>` : R}
      ${e.type === "none" ? R : I`<div class="field">
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
		return I`
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
            ${Me.map((n) => I`<button
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
      </div>
    `;
	}
	render() {
		let e = this.draft;
		return e ? I`
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

        <h3 class="steps-title">Steps</h3>
        ${e.steps.map((e, t) => this._renderStep(t))}
        <button type="button" @click=${() => this._addStep()}>+ Add a step</button>

        ${this._error ? I`<div class="error">${this._error}</div>` : R}

        <div class="actions">
          <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
          <button ?disabled=${this._busy} @click=${() => this._close()}>Cancel</button>
          ${e.id ? this._confirmDelete ? I`<span class="muted small">Delete it, and anything in progress?</span>
                  <button class="danger" ?disabled=${this._busy} @click=${() => this._delete()}>Yes, delete</button>
                  <button @click=${() => this._confirmDelete = !1}>No</button>` : I`<button class="danger" @click=${() => this._confirmDelete = !0}>Delete</button>` : R}
        </div>
      </section>
    ` : R;
	}
	static {
		this.styles = [$, o`
      .field {
        margin: 14px 0;
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
customElements.define("boopli-chore-editor", Pe);
// src/templates.ts
var Fe = {
	type: "none",
	time: "09:00",
	weekdays: [],
	every_n_days: 1
}, Ie = [
	{
		label: "Dishwasher",
		draft: {
			name: "Dishwasher",
			where: "home",
			enabled: !0,
			one_off: !1,
			repeat: {
				...Fe,
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
				...Fe,
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
			steps: [{
				title: "Take your pills",
				wait_minutes: 0
			}]
		}
	}
];
function Le() {
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
var Re = class extends q {
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
			steps: e.steps.map((e) => ({
				id: e.id,
				title: e.title,
				wait_minutes: e.wait_minutes
			}))
		};
	}
	async _start(e) {
		if (this.hass) {
			this._error = "";
			try {
				await xe(this.hass, e.id);
			} catch (e) {
				this._error = J(e);
			}
		}
	}
	render() {
		if (!this.snapshot) return I`<p class="muted">Loading…</p>`;
		if (this._editing) return I`<boopli-chore-editor
        .hass=${this.hass}
        .draft=${this._editing}
        @editor-close=${() => this._editing = null}
      ></boopli-chore-editor>`;
		let e = this.snapshot.time_zone, t = new Set(this.snapshot.runs.map((e) => e.chore_id)), n = [...this.snapshot.chores].sort((e, t) => e.name.localeCompare(t.name));
		return I`
      <div class="toolbar">
        <button class="primary" @click=${() => this._editing = Le()}>
          + New chore
        </button>
      </div>

      <div class="templates">
        <span class="muted small">Start from a template:</span>
        ${Ie.map((e) => I`<button
            class="chip"
            @click=${() => this._editing = structuredClone(e.draft)}
          >
            ${e.label}
          </button>`)}
      </div>

      ${this._error ? I`<div class="error">${this._error}</div>` : R}
      ${n.length === 0 ? I`<p class="muted empty">
            No chores yet. Pick a template above or create your own.
          </p>` : n.map((n) => I`
              <section class="card chore">
                <div class="chore-main">
                  <div class="name">${n.name}</div>
                  <div class="muted small">
                    ${ke(n.repeat)} · ${n.where === "home" ? "Home only" : "Anywhere"}
                    · ${n.steps.length} ${n.steps.length === 1 ? "step" : "steps"}
                  </div>
                  <div class="muted small">
                    ${t.has(n.id) ? "In progress" : n.enabled && n.next_due ? `Next: ${we(n.next_due, this.nowMs, e)}` : n.repeat.type === "none" ? "" : "Not scheduled"}
                  </div>
                </div>
                <div class="chore-actions">
                  ${t.has(n.id) ? R : I`<button @click=${() => this._start(n)}>Start now</button>`}
                  <button @click=${() => this._edit(n)}>Edit</button>
                </div>
              </section>
            `)}
    `;
	}
	static {
		this.styles = [$, o`
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
customElements.define("boopli-chores", Re);
// src/boopli-panel.ts
var ze = class extends q {
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
		this.hass && !this._unsub && !this._subscribing && (this._subscribing = !0, ve(this.hass, (e) => {
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
		return I`
      <header>
        ${this.narrow ? I`<button
              class="menu"
              aria-label="Open sidebar"
              @click=${this._toggleSidebar}
            >
              ☰
            </button>` : R}
        <h1>Boopli</h1>
        <nav>
          ${["today", "chores"].map((e) => I`<button
              class="tab ${this._tab === e ? "on" : ""}"
              @click=${() => this._tab = e}
            >
              ${e === "today" ? "Today" : "Chores"}
            </button>`)}
        </nav>
      </header>
      <main>
        ${this._connectionError ? I`<p class="error">${this._connectionError}</p>` : this._tab === "today" ? I`<boopli-today
                .hass=${this.hass}
                .snapshot=${this._snapshot}
                .nowMs=${this._nowMs}
              ></boopli-today>` : I`<boopli-chores
                .hass=${this.hass}
                .snapshot=${this._snapshot}
                .nowMs=${this._nowMs}
              ></boopli-chores>`}
      </main>
    `;
	}
	static {
		this.styles = [$, o`
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
customElements.define("boopli-panel", ze);
export { ze as BoopliPanel };

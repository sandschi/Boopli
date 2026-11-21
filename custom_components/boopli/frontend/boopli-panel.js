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
}, oe = (e, t) => !l(e, t), se = {
	attribute: !0,
	type: String,
	converter: m,
	reflect: !1,
	useDefault: !1,
	hasChanged: oe
};
Symbol.metadata ??= Symbol("metadata"), f.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var h = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = se) {
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
		return this.elementProperties.get(e) ?? se;
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
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? oe)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
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
h.elementStyles = [], h.shadowRootOptions = { mode: "open" }, h[p("elementProperties")] = /* @__PURE__ */ new Map(), h[p("finalized")] = /* @__PURE__ */ new Map(), ae?.({ ReactiveElement: h }), (f.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var g = globalThis, ce = (e) => e, _ = g.trustedTypes, le = _ ? _.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, ue = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, de = "?" + v, fe = `<${de}>`, y = document, b = () => y.createComment(""), x = (e) => e === null || typeof e != "object" && typeof e != "function", S = Array.isArray, pe = (e) => S(e) || typeof e?.[Symbol.iterator] == "function", C = "[ 	\n\f\r]", w = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, me = /-->/g, he = />/g, T = RegExp(`>|${C}(?:([^\\s"'>=/]+)(${C}*=${C}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), ge = /'/g, _e = /"/g, ve = /^(?:script|style|textarea|title)$/i, E = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), D = Symbol.for("lit-noChange"), O = Symbol.for("lit-nothing"), ye = /* @__PURE__ */ new WeakMap(), k = y.createTreeWalker(y, 129);
function be(e, t) {
	if (!S(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return le === void 0 ? t : le.createHTML(t);
}
var xe = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = w;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === w ? c[1] === "!--" ? o = me : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = T) : (ve.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = T) : o = he : o === T ? c[0] === ">" ? (o = i ?? w, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? T : c[3] === "\"" ? _e : ge) : o === _e || o === ge ? o = T : o === me || o === he ? o = w : (o = T, i = void 0);
		let d = o === T && e[t + 1].startsWith("/>") ? " " : "";
		a += o === w ? n + fe : l >= 0 ? (r.push(s), n.slice(0, l) + ue + n.slice(l) + v + d) : n + v + (l === -2 ? t : d);
	}
	return [be(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, A = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = xe(t, n);
		if (this.el = e.createElement(l, r), k.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = k.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(ue)) {
					let t = u[o++], n = i.getAttribute(e).split(v), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Ce : r[1] === "?" ? we : r[1] === "@" ? Te : N
					}), i.removeAttribute(e);
				} else e.startsWith(v) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (ve.test(i.tagName)) {
					let e = i.textContent.split(v), t = e.length - 1;
					if (t > 0) {
						i.textContent = _ ? _.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], b()), k.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], b());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === de) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(v, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += v.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = y.createElement("template");
		return n.innerHTML = e, n;
	}
};
function j(e, t, n = e, r) {
	if (t === D) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = x(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = j(e, i._$AS(e, t.values), i, r)), t;
}
var Se = class {
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? y).importNode(t, !0);
		k.currentNode = r;
		let i = k.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new M(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Ee(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = k.nextNode(), a++);
		}
		return k.currentNode = y, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, M = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = O, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = j(this, e, t), x(e) ? e === O || e == null || e === "" ? (this._$AH !== O && this._$AR(), this._$AH = O) : e !== this._$AH && e !== D && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? pe(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== O && x(this._$AH) ? this._$AA.nextSibling.data = e : this.T(y.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = A.createElement(be(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Se(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = ye.get(e.strings);
		return t === void 0 && ye.set(e.strings, t = new A(e)), t;
	}
	k(t) {
		S(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(b()), this.O(b()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = ce(e).nextSibling;
			ce(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, N = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = O, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = O;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = j(this, e, t, 0), a = !x(e) || e !== this._$AH && e !== D, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = j(this, r[n + o], t, o), s === D && (s = this._$AH[o]), a ||= !x(s) || s !== this._$AH[o], s === O ? e = O : e !== O && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === O ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Ce = class extends N {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === O ? void 0 : e;
	}
}, we = class extends N {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== O);
	}
}, Te = class extends N {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = j(this, e, t, 0) ?? O) === D) return;
		let n = this._$AH, r = e === O && n !== O || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== O && (n === O || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Ee = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		j(this, e);
	}
}, De = g.litHtmlPolyfillSupport;
De?.(A, M), (g.litHtmlVersions ??= []).push("3.3.3");
var Oe = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new M(t.insertBefore(b(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, P = globalThis, F = class extends h {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Oe(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return D;
	}
};
F._$litElement$ = !0, F.finalized = !0, P.litElementHydrateSupport?.({ LitElement: F });
var ke = P.litElementPolyfillSupport;
ke?.({ LitElement: F }), (P.litElementVersions ??= []).push("4.2.2");
// src/api.ts
function I(e, t) {
	return e.callWS({
		type: "boopli/settings_save",
		settings: t
	});
}
function L(e, t, n = "") {
	return e.callWS({
		type: "boopli/setup_save",
		status: t,
		step: n
	});
}
function R(e, t) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "light",
		light: t
	});
}
function z(e, t) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "phone",
		phone: t
	});
}
function B(e, t, n) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "speaker",
		speaker: t,
		level: n
	});
}
function V(e, t) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "alarm_device",
		alarm_device: t
	});
}
function Ae(e, t) {
	return e.connection.subscribeMessage(t, { type: "boopli/subscribe" });
}
function je(e, t) {
	return e.callWS({
		type: "boopli/chore_save",
		chore: t
	});
}
function Me(e, t) {
	return e.callWS({
		type: "boopli/chore_delete",
		chore_id: t
	});
}
function Ne(e, t) {
	return e.callWS({
		type: "boopli/chore_start",
		chore_id: t
	});
}
function Pe(e, t, n) {
	return e.callWS({
		type: "boopli/step_complete",
		run_id: t,
		step_id: n
	});
}
function H(e) {
	return e && typeof e == "object" && "message" in e ? String(e.message) : "Something went wrong.";
}
// src/time.ts
var Fe = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun"
], U = Fe;
function W(e, t) {
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: t,
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).format(new Date(e));
}
function G(e, t) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: t,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(e);
}
function Ie(e) {
	let [t, n, r] = e.split("-").map(Number);
	return Math.round(Date.UTC(t, n - 1, r) / 864e5);
}
function Le(e, t, n) {
	let r = new Date(e), i = Ie(G(r, n)) - Ie(G(new Date(t), n)), a = W(e, n);
	return i === 0 ? `today ${a}` : i === 1 ? `tomorrow ${a}` : `${new Intl.DateTimeFormat("en-GB", {
		timeZone: n,
		weekday: "short",
		day: "numeric",
		month: "short"
	}).format(r)}, ${a}`;
}
function Re(e, t, n) {
	return G(new Date(e), n) === G(new Date(t), n);
}
function ze(e) {
	let t = Math.max(0, Math.round(e));
	if (t < 1) return "less than a minute";
	if (t < 60) return `${t} min`;
	let n = Math.floor(t / 60), r = t % 60;
	return r === 0 ? `${n}h` : `${n}h ${r}m`;
}
function Be(e, t) {
	let n = (new Date(e).getTime() - t) / 6e4;
	return n <= .5 ? "any moment now" : `in ${ze(n)}`;
}
function Ve(e, t) {
	return `since ${W(e, t)}`;
}
function He(e) {
	switch (e.type) {
		case "none": return "On demand";
		case "daily": return `Every day at ${e.time}`;
		case "weekly": return `Every ${[...e.weekdays].sort((e, t) => e - t).map((e) => Fe[e]).join(", ")} at ${e.time}`;
		case "every_n_days": return e.every_n_days === 1 ? `Every day after you finish, at ${e.time}` : `${e.every_n_days} days after you finish, at ${e.time}`;
	}
}
// src/today.ts
function Ue(e, t) {
	let n = e.time_zone, r = e.runs.flatMap((e) => e.steps.filter((e) => e.status === "active").map((t) => ({
		run: e,
		step: t
	}))).sort((e, t) => (e.step.active_at ? Date.parse(e.step.active_at) : Infinity) - (t.step.active_at ? Date.parse(t.step.active_at) : Infinity))[0] ?? null, i = [...e.runs].sort((e, t) => Date.parse(e.started_at) - Date.parse(t.started_at)).map((e) => ({
		run: e,
		steps: e.steps.filter((t) => t.status !== "done" && !(r && r.run.id === e.id && r.step.step_id === t.step_id)).map((e) => {
			let n = "";
			return e.status === "active" ? n = "ready now" : e.status === "waiting" && e.active_at ? n = Be(e.active_at, t) : e.wait_minutes > 0 && (n = `${ze(e.wait_minutes)} after the step before`), {
				title: e.title,
				status: e.status,
				hint: n
			};
		})
	})).filter((e) => e.steps.length > 0), a = new Set(e.runs.map((e) => e.chore_id));
	return {
		now: r,
		groups: i,
		dueToday: e.chores.filter((e) => e.enabled && e.next_due !== null && !a.has(e.id) && Re(e.next_due, t, n)).map((e) => ({
			chore: e,
			at: e.next_due
		})).sort((e, t) => Date.parse(e.at) - Date.parse(t.at))
	};
}
// src/styles.ts
var K = o`
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
`, We = {
	happy: "✨",
	content: "",
	sleepy: "💤",
	sad: "💧",
	hibernating: "🌙💤"
}, Ge = class extends F {
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
		return E`<span class="bear" aria-hidden="true">🐻</span>
      <span class="badge" aria-hidden="true">${We[this.mood]}</span>`;
	}
	render() {
		return E`<div class="pet ${this.mood}" role="img" aria-label="Your pet is ${this.mood}">
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
customElements.define("boopli-pet", Ge);
// src/boopli-today.ts
function Ke(e) {
	return {
		happy: "Nice, you got things done today.",
		content: "Ready when you are.",
		sleepy: `${e.name} is a bit sleepy.`,
		sad: `${e.name} misses you. One step is enough.`,
		hibernating: `${e.name} is curled up, resting until you are back. One step wakes it.`
	}[e.mood];
}
var qe = class extends F {
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
		if (!e) return O;
		let t = e.xp_for_level > 0 ? Math.round(e.xp_in_level / e.xp_for_level * 100) : 0;
		return E`
      <section class="card pet-card">
        <boopli-pet .mood=${e.mood} .level=${e.level}></boopli-pet>
        <div class="pet-info">
          <div class="pet-name">${e.name} <span class="muted">· Level ${e.level}</span></div>
          <div class="bar" role="progressbar" aria-valuenow=${t} aria-valuemin="0" aria-valuemax="100">
            <div class="fill" style="width:${t}%"></div>
          </div>
          <div class="muted small">${e.xp_in_level} / ${e.xp_for_level} XP to the next level</div>
          <div class="small">${Ke(e)}</div>
        </div>
      </section>
      ${this._toast ? E`<div class="toast" role="status">${this._toast}</div>` : O}
    `;
	}
	async _done(e, t) {
		if (this.hass && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				await Pe(this.hass, e, t);
			} catch (e) {
				this._error = H(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderAuto() {
		let e = this.snapshot;
		if (!e) return O;
		let t = this.nowMs - 864e5, n = e.history.filter((e) => e.kind === "step_done" && e.by === "auto" && Date.parse(e.ts) >= t).slice(-3).reverse();
		return n.length === 0 ? O : E`
      <section class="auto dim">
        <h3>Done by itself</h3>
        ${n.map((t) => E`<div class="row">
            <span>✓ ${t.chore_name}: ${t.step_title}</span>
            <span class="hint">${t.reason ? `${t.reason}, ` : ""}${W(t.ts, e.time_zone)}</span>
          </div>`)}
      </section>
    `;
	}
	render() {
		if (!this.snapshot) return E`<p class="muted">Loading…</p>`;
		let e = this.snapshot.time_zone, t = Ue(this.snapshot, this.nowMs), n = this.snapshot.chores.length > 0, r = this.snapshot.setup?.status;
		return E`
      <div class="cols"><div class="col">
      ${r === "skipped" || r === "in_progress" ? E`<section class="card banner">
            <span>Boopli is not fully set up yet.</span>
            <button
              class="primary"
              @click=${() => this.dispatchEvent(new CustomEvent("open-wizard", {
			bubbles: !0,
			composed: !0
		}))}
            >
              Finish setting up
            </button>
          </section>` : O}
      ${this._renderPet()}
      ${t.now ? E`
            <section class="card now">
              <div class="muted small">${t.now.run.chore_name}</div>
              <h2>${t.now.step.title}</h2>
              ${t.now.step.active_at ? E`<div class="muted small">
                    ${Ve(t.now.step.active_at, e)}
                  </div>` : O}
              ${t.now.step.snoozed_until && Date.parse(t.now.step.snoozed_until) > this.nowMs ? E`<div class="muted small">
                    Snoozed until ${W(t.now.step.snoozed_until, e)}
                  </div>` : O}
              <button
                class="primary done"
                ?disabled=${this._busy}
                @click=${() => this._done(t.now.run.id, t.now.step.step_id)}
              >
                Done
              </button>
              ${this._error ? E`<div class="error">${this._error}</div>` : O}
            </section>
          ` : E`
            <section class="card empty">
              <h2>Nothing needs you right now</h2>
              <p class="muted">
                ${n ? "Enjoy the quiet. What is coming up shows below." : "Add your first chore in the Chores tab."}
              </p>
            </section>
          `}
      </div><div class="col">
      ${this._renderAuto()}
      ${t.groups.length > 0 || t.dueToday.length > 0 ? E`
            <section class="later dim">
              <h3>Still to do today</h3>
              ${t.groups.map((e) => E`
                  <div class="group">
                    <div class="group-name">${e.run.chore_name}</div>
                    ${e.steps.map((e) => E`
                        <div class="row">
                          <span>${e.title}</span>
                          <span class="hint">${e.hint}</span>
                        </div>
                      `)}
                  </div>
                `)}
              ${t.dueToday.map((t) => E`
                  <div class="group">
                    <div class="row">
                      <span class="group-name">${t.chore.name}</span>
                      <span class="hint">at ${W(t.at, e)}</span>
                    </div>
                  </div>
                `)}
            </section>
          ` : O}
      </div></div>
    `;
	}
	static {
		this.styles = [K, o`
      .small {
        font-size: 14px;
      }
      .banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;
        padding: 12px 16px;
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
      .cols {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 24px;
        align-items: start;
      }
      .col {
        min-width: 0;
      }
      .now,
      .empty {
        padding: 24px 20px;
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
        margin-bottom: 24px;
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
customElements.define("boopli-today", qe);
// src/boopli-triggers.ts
var Je = {
	binary_sensor: ["on", "off"],
	switch: ["on", "off"],
	input_boolean: ["on", "off"],
	light: ["on", "off"],
	cover: ["open", "closed"],
	lock: ["locked", "unlocked"],
	person: ["home", "not_home"],
	device_tracker: ["home", "not_home"]
}, Ye = [
	"event",
	"input_button",
	"button"
];
function Xe(e) {
	return e.state ? "state" : e.above !== null && e.below !== null ? "between" : e.below === null ? e.above === null ? "state" : "above" : "below";
}
function Ze(e) {
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
var Qe = class extends F {
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
		this._emit([...this.triggers, Ze(e)]);
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
				this._scanning = -1, this._note = `Scanning did not start (${H(e)}). Pick the tag from the list instead.`;
			}
		}
	}
	_renderState(e, t) {
		let n = e.entity_id.split(".")[0], r = this.hass?.states[e.entity_id], i = Je[n] ?? [], a = Xe(e);
		return E`
      <div class="field">
        <label>Which entity?</label>
        <input
          list="states-list"
          placeholder="Start typing a name, for example door"
          .value=${e.entity_id}
          @change=${(e) => this._patch(t, { entity_id: e.target.value.trim() })}
        />
        ${e.entity_id ? r ? E`<div class="muted small">
                ${this._friendly(e.entity_id)}: now <b>${r.state}</b>
              </div>` : E`<div class="warn small">Not found right now. Check the name.</div>` : O}
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
      ${a === "state" ? E`<div class="field">
            <label>State</label>
            <input
              placeholder="for example on, off, open"
              .value=${e.state}
              @input=${(e) => this._patch(t, { state: e.target.value })}
            />
            <div class="chips">
              ${i.map((n) => E`<button
                  type="button"
                  class="chip ${e.state === n ? "on" : ""}"
                  @click=${() => this._patch(t, { state: n })}
                >
                  ${n}
                </button>`)}
              ${r && !i.includes(r.state) ? E`<button
                    type="button"
                    class="chip"
                    @click=${() => this._patch(t, { state: r.state })}
                  >
                    now: ${r.state}
                  </button>` : O}
            </div>
          </div>` : E`<div class="row2">
            ${a === "above" || a === "between" ? E`<div>
                  <label>Above</label>
                  <input
                    type="number"
                    step="any"
                    .value=${e.above === null ? "" : String(e.above)}
                    @input=${(e) => this._patch(t, { above: this._numberOrNull(e.target.value) })}
                  />
                </div>` : O}
            ${a === "below" || a === "between" ? E`<div>
                  <label>Below</label>
                  <input
                    type="number"
                    step="any"
                    .value=${e.below === null ? "" : String(e.below)}
                    @input=${(e) => this._patch(t, { below: this._numberOrNull(e.target.value) })}
                  />
                </div>` : O}
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
		return E`
      <div class="field">
        <label>Which NFC tag?</label>
        <div class="scan">
          <select
            @change=${(e) => this._patch(t, { tag_id: e.target.value })}
          >
            <option value="" .selected=${!e.tag_id}>Pick a tag…</option>
            ${this._tags.map((t) => E`<option value=${t.tag_id} .selected=${t.tag_id === e.tag_id}>
                ${t.name || t.tag_id}
              </option>`)}
            ${e.tag_id && !n ? E`<option value=${e.tag_id} .selected=${!0}>${e.tag_id}</option>` : O}
          </select>
          ${this._scanning === t ? E`<button type="button" @click=${() => this._cancelScan()}>Cancel</button>` : E`<button type="button" @click=${() => this._scan(t)}>Scan now</button>`}
        </div>
        ${this._scanning === t ? E`<div class="muted small">Hold your phone to the tag now…</div>` : O}
      </div>
    `;
	}
	_renderButton(e, t) {
		let n = this.hass?.states[e.entity_id], r = n?.attributes?.event_types;
		return E`
      <div class="field">
        <label>Which button?</label>
        <input
          list="buttons-list"
          placeholder="Start typing a name, for example button"
          .value=${e.entity_id}
          @change=${(e) => this._patch(t, { entity_id: e.target.value.trim() })}
        />
        ${e.entity_id && !n ? E`<div class="warn small">Not found right now. Check the name.</div>` : O}
      </div>
      <div class="field">
        <label>Only this kind of press (empty = any press)</label>
        <input
          placeholder="for example single or double"
          .value=${e.press}
          @input=${(e) => this._patch(t, { press: e.target.value })}
        />
        ${Array.isArray(r) && r.length ? E`<div class="chips">
              ${r.map((n) => E`<button
                  type="button"
                  class="chip ${e.press === n ? "on" : ""}"
                  @click=${() => this._patch(t, { press: n })}
                >
                  ${String(n)}
                </button>`)}
            </div>` : O}
      </div>
    `;
	}
	_title(e) {
		return e.kind === "tag" ? "An NFC tag is scanned" : e.kind === "button" ? "A button is pressed" : "An entity changes";
	}
	render() {
		return E`
      <datalist id="states-list">
        ${this._entityIds().map((e) => E`<option value=${e}>${this._friendly(e)}</option>`)}
      </datalist>
      <datalist id="buttons-list">
        ${this._entityIds(Ye).map((e) => E`<option value=${e}>${this._friendly(e)}</option>`)}
      </datalist>
      ${this.triggers.length === 0 ? E`<div class="muted small">
            Nothing yet: only you finish this step (with Done). Add one below to let it finish by
            itself.
          </div>` : this.triggers.map((e, t) => E`
              ${t > 0 ? E`<div class="or muted small">or</div>` : O}
              <div class="trigger">
                <div class="trigger-head">
                  <b>${this._title(e)}</b>
                  <button type="button" aria-label="Remove" @click=${() => this._remove(t)}>✕</button>
                </div>
                ${e.kind === "tag" ? this._renderTag(e, t) : e.kind === "button" ? this._renderButton(e, t) : this._renderState(e, t)}
              </div>
            `)}
      ${this._note ? E`<div class="warn small">${this._note}</div>` : O}
      <div class="chips add">
        <button type="button" @click=${() => this._add("state")}>+ An entity changes</button>
        <button type="button" @click=${() => this._add("tag")}>+ NFC tag</button>
        <button type="button" @click=${() => this._add("button")}>+ Button</button>
      </div>
    `;
	}
	static {
		this.styles = [K, o`
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
customElements.define("boopli-triggers", Qe);
// src/boopli-chore-editor.ts
var $e = [
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
], et = [
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
], tt = [
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
], nt = class extends F {
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
		super(), this._lastDirty = !1, this.defaultStyle = "one", this._error = "", this._busy = !1, this._confirmDelete = !1;
	}
	willUpdate() {
		this._base === void 0 && this.draft && (this._base = JSON.stringify(this.draft));
	}
	updated() {
		let e = this._isDirty();
		e !== this._lastDirty && (this._lastDirty = e, this.dispatchEvent(new CustomEvent("dirty-change", {
			detail: {
				source: "chore",
				dirty: e
			},
			bubbles: !0,
			composed: !0
		})));
	}
	_isDirty() {
		return this._base !== void 0 && !!this.draft && JSON.stringify(this.draft) !== this._base;
	}
	async save() {
		return this._save();
	}
	discard() {
		this._close();
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
		if (!this.hass || this._busy) return !1;
		this._busy = !0, this._error = "";
		try {
			return await je(this.hass, {
				...this.draft,
				nudge_style: this.draft.nudge_style ?? this.defaultStyle,
				ignore_quiet_hours: this.draft.ignore_quiet_hours ?? !1,
				name: this.draft.name.trim(),
				steps: this.draft.steps.map((e) => ({
					...e,
					title: e.title.trim()
				}))
			}), this._close(), !0;
		} catch (e) {
			return this._error = H(e), !1;
		} finally {
			this._busy = !1;
		}
	}
	async _delete() {
		if (this.hass && this.draft.id && !this._busy) {
			this._busy = !0;
			try {
				await Me(this.hass, this.draft.id), this._close();
			} catch (e) {
				this._error = H(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderRepeat() {
		let e = this.draft.repeat;
		return E`
      <div class="field">
        <label for="repeat">Repeats</label>
        <select
          id="repeat"
          .value=${e.type}
          @change=${(e) => this._updateRepeat({ type: e.target.value })}
        >
          ${tt.map((t) => E`<option value=${t.value} ?selected=${t.value === e.type}>${t.label}</option>`)}
        </select>
      </div>
      ${e.type === "weekly" ? E`<div class="field">
            <label>On these days</label>
            <div class="chips">
              ${U.map((t, n) => E`<button
                  type="button"
                  class="chip ${e.weekdays.includes(n) ? "on" : ""}"
                  @click=${() => this._toggleWeekday(n)}
                >
                  ${t}
                </button>`)}
            </div>
          </div>` : O}
      ${e.type === "every_n_days" ? E`<div class="field">
            <label for="n">Number of days</label>
            <input
              id="n"
              type="number"
              min="1"
              max="365"
              .value=${String(e.every_n_days)}
              @input=${(e) => this._updateRepeat({ every_n_days: Number(e.target.value) || 1 })}
            />
          </div>` : O}
      ${e.type === "none" ? O : E`<div class="field">
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
		return E`
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
            ${et.map((n) => E`<button
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
            ${(t.triggers ?? []).length > 0 ? E`<span class="muted small">(${(t.triggers ?? []).length} set)</span>` : O}
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
		return e ? E`
      <section class="card ${this._isDirty() ? "changed" : ""}">
        <h2>
          ${e.id ? "Edit chore" : "New chore"}
          ${this._isDirty() ? E`<span class="unsaved-badge">Unsaved</span>` : O}
        </h2>

        <div class="editor-grid">
        <div class="col-a">
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
            ${$e.map((t) => E`<option
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

        </div>
        <div class="col-b">
        <h3 class="steps-title">Steps</h3>
        ${e.steps.map((e, t) => this._renderStep(t))}
        <button type="button" @click=${() => this._addStep()}>+ Add a step</button>
        </div>
        </div>

        ${this._error ? E`<div class="error">${this._error}</div>` : O}

        <div class="actions">
          <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
          <button ?disabled=${this._busy} @click=${() => this._close()}>Cancel</button>
          ${e.id ? this._confirmDelete ? E`<span class="muted small">Delete it, and anything in progress?</span>
                  <button class="danger" ?disabled=${this._busy} @click=${() => this._delete()}>Yes, delete</button>
                  <button @click=${() => this._confirmDelete = !1}>No</button>` : E`<button class="danger" @click=${() => this._confirmDelete = !0}>Delete</button>` : O}
        </div>
      </section>
      ${this._isDirty() ? E`<div class="savebar" role="status">
            <span><b>●</b> You have unsaved changes</span>
            <span class="spacer"></span>
            <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
            <button ?disabled=${this._busy} @click=${() => this._close()}>Discard</button>
          </div>` : O}
    ` : O;
	}
	static {
		this.styles = [K, o`
      .editor-grid {
        display: grid;
        grid-template-columns: minmax(280px, 400px) minmax(0, 1fr);
        gap: 8px 32px;
        align-items: start;
      }
      @media (max-width: 900px) {
        .editor-grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      .steps-title {
        margin-top: 14px;
      }
      section.card.changed {
        border-color: var(--warning-color, #ffa600);
        box-shadow: inset 4px 0 0 var(--warning-color, #ffa600);
      }
      .unsaved-badge {
        display: inline-block;
        margin-left: 8px;
        padding: 1px 8px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        color: #000;
        background: var(--warning-color, #ffa600);
        vertical-align: middle;
      }
      .savebar {
        position: sticky;
        bottom: 12px;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 20px;
        padding: 12px 16px;
        border-radius: 14px;
        border: 2px solid var(--warning-color, #ffa600);
        background: var(--card-background-color, var(--primary-background-color));
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
      }
      .savebar b {
        color: var(--warning-color, #ffa600);
      }
      .spacer {
        flex: 1;
      }
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
customElements.define("boopli-chore-editor", nt);
// src/templates.ts
var rt = {
	type: "none",
	time: "09:00",
	weekdays: [],
	every_n_days: 1
}, q = [
	{
		label: "Dishwasher",
		draft: {
			name: "Dishwasher",
			where: "home",
			enabled: !0,
			one_off: !1,
			repeat: {
				...rt,
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
				...rt,
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
function it() {
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
var at = class extends F {
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
	async save() {
		return await this.renderRoot.querySelector("boopli-chore-editor")?.save?.() ?? !1;
	}
	discard() {
		this._editing = null;
	}
	async _start(e) {
		if (this.hass) {
			this._error = "";
			try {
				await Ne(this.hass, e.id);
			} catch (e) {
				this._error = H(e);
			}
		}
	}
	render() {
		if (!this.snapshot) return E`<p class="muted">Loading…</p>`;
		if (this._editing) return E`<boopli-chore-editor
        .hass=${this.hass}
        .draft=${this._editing}
        .defaultStyle=${this.snapshot.settings.default_style}
        @editor-close=${() => {
			this._editing = null, this.dispatchEvent(new CustomEvent("dirty-change", {
				detail: {
					source: "chore",
					dirty: !1
				},
				bubbles: !0,
				composed: !0
			}));
		}}
      ></boopli-chore-editor>`;
		let e = this.snapshot.time_zone, t = new Set(this.snapshot.runs.map((e) => e.chore_id)), n = [...this.snapshot.chores].sort((e, t) => e.name.localeCompare(t.name));
		return E`
      <div class="toolbar">
        <button class="primary" @click=${() => this._editing = it()}>
          + New chore
        </button>
      </div>

      <div class="templates">
        <span class="muted small">Start from a template:</span>
        ${q.map((e) => E`<button
            class="chip"
            @click=${() => this._editing = structuredClone(e.draft)}
          >
            ${e.label}
          </button>`)}
      </div>

      ${this._error ? E`<div class="error">${this._error}</div>` : O}
      ${n.length === 0 ? E`<p class="muted empty">
            No chores yet. Pick a template above or create your own.
          </p>` : E`<div class="chore-list">${n.map((n) => E`
              <section class="card chore">
                <div class="chore-main">
                  <div class="name">${n.name}</div>
                  <div class="muted small">
                    ${He(n.repeat)} · ${n.where === "home" ? "Home only" : "Anywhere"}
                    · ${n.steps.length} ${n.steps.length === 1 ? "step" : "steps"}
                  </div>
                  <div class="muted small">
                    ${t.has(n.id) ? "In progress" : n.enabled && n.next_due ? `Next: ${Le(n.next_due, this.nowMs, e)}` : n.repeat.type === "none" ? "" : "Not scheduled"}
                  </div>
                </div>
                <div class="chore-actions">
                  ${t.has(n.id) ? O : E`<button @click=${() => this._start(n)}>Start now</button>`}
                  <button @click=${() => this._edit(n)}>Edit</button>
                </div>
              </section>
            `)}</div>`}
    `;
	}
	static {
		this.styles = [K, o`
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
        padding: 24px 0;
      }
      .chore-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 12px;
        align-items: start;
      }
      .chore {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
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
customElements.define("boopli-chores", at);
// src/helpers.ts
var ot = "amzn_sfx_scifi_alarm_01", st = "amzn_sfx_doorbell_chime_01", ct = [
	"siren",
	"switch",
	"input_boolean",
	"script"
], lt = {
	start: "07:00",
	stop: "22:00"
};
function J(e, t) {
	let n = e?.states[t]?.attributes?.friendly_name;
	return typeof n == "string" && n ? n : t;
}
function Y(e, t, n = []) {
	return Object.keys(e?.states ?? {}).filter((e) => t.includes(e.split(".")[0]) && !n.includes(e)).sort((t, n) => J(e, t).localeCompare(J(e, n)));
}
function ut(e, t, n) {
	let r;
	return r = t === "alexa_media" ? Object.keys(e?.services?.notify ?? {}).filter((e) => e.startsWith("alexa_media_") && e !== "alexa_media").sort().map((e) => ({
		value: e,
		label: e.replace("alexa_media_", "")
	})) : t === "alexa_devices" ? Object.keys(e?.states ?? {}).filter((e) => e.startsWith("notify.") && /_(speak|announce)$/.test(e)).sort().map((t) => ({
		value: t,
		label: J(e, t)
	})) : Y(e, ["tts"]).map((t) => ({
		value: t,
		label: J(e, t)
	})), n && !r.some((e) => e.value === n) && r.unshift({
		value: n,
		label: `${n} (not found)`
	}), r;
}
function dt(e) {
	return {
		entity_id: e,
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
}
function ft(e) {
	return {
		entity_id: e,
		cue: {
			enabled: !1,
			kind: "alexa",
			sound: st,
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
			sound: ot,
			start_at: 4,
			seconds: 30,
			repeat_s: 5
		}
	};
}
function pt(e) {
	return {
		entity_id: e,
		seconds: 30,
		start_at: 4
	};
}
function mt(e) {
	let t = parseInt(e.replace("#", ""), 16);
	return [
		t >> 16 & 255,
		t >> 8 & 255,
		t & 255
	];
}
function ht(e) {
	return "#" + e.map((e) => e.toString(16).padStart(2, "0")).join("");
}
function X(e) {
	return e.replace("mobile_app_", "");
}
var Z = {
	normal: "normal",
	high: "high priority",
	alarm: "alarm volume",
	alarm_max: "max volume"
}, gt = {
	quiet: "Quiet",
	one: "One nudge",
	escalating: "Escalating",
	persistent: "Persistent"
};
function _t(e) {
	if (!e.enabled) return "Off: Boopli nudges at any time";
	let t = [], n = 0;
	for (; n < 7;) {
		let r = e.days[String(n)] ?? null, i = n;
		for (; i + 1 < 7 && (e.days[String(i + 1)] ?? null)?.start === r?.start && (e.days[String(i + 1)] ?? null)?.stop === r?.stop;) i++;
		let a = n === i ? U[n] : `${U[n]} to ${U[i]}`;
		t.push(r ? `${a} ${r.start} to ${r.stop}` : `${a} no limit`), n = i + 1;
	}
	return "Nudges allowed " + t.join(", ");
}
function vt(e) {
	let t = [
		e.cue.enabled ? `ding (from nudge ${e.cue.start_at})` : "",
		e.speech.enabled ? `speech (from nudge ${e.speech.start_at})` : "",
		e.alarm.enabled ? `alarm (from nudge ${e.alarm.start_at})` : ""
	].filter(Boolean);
	return t.length ? t.join(", ") : "nothing switched on yet";
}
function Q(e) {
	return e.mode === "indicator" ? "status light (stays on until done)" : "blinks";
}
// src/boopli-speakers.ts
var yt = "amzn_sfx_scifi_alarm_01", bt = "amzn_sfx_doorbell_chime_01", xt = "https://developer.amazon.com/en-US/docs/alexa/custom-skills/ask-soundlibrary.html", St = [
	"siren",
	"switch",
	"input_boolean",
	"script"
], Ct = [{
	value: "alexa",
	label: "Alexa sound"
}, {
	value: "file",
	label: "File in my media folder"
}], wt = [
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
], Tt = class extends F {
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
				sound: bt,
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
				sound: yt,
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
			this._note(n, (await B(this.hass, e, t)).note);
		} catch (e) {
			this._note(n, H(e));
		}
	}
	_startAt(e, t, n = "Starts at nudge #") {
		return E`
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
		return E`
      <div class="level">
        <label class="inline">
          <input
            type="checkbox"
            .checked=${n.enabled}
            @change=${(e) => this._setSound(r, t, { enabled: e.target.checked })}
          />
          ${o}
        </label>
        ${n.enabled ? E`
              <div class="fields">
                <label class="num wide">
                  Sound type
                  <select
                    .value=${n.kind}
                    @change=${(e) => this._setSound(r, t, { kind: e.target.value })}
                  >
                    ${Ct.map((e) => E`<option value=${e.value} ?selected=${e.value === n.kind}>${e.label}</option>`)}
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
                ${n.kind === "alexa" ? E`<div class="muted small libhint">
                      Pick a sound from the
                      <a href=${xt} target="_blank" rel="noopener noreferrer">Alexa sound library</a>.
                      The id is <code>amzn_sfx_</code> + the sound's name in lower case with underscores
                      + a two-digit number, for example "Doorbell Chime (1)" is
                      <code>amzn_sfx_doorbell_chime_01</code>. Press Test to hear it. Some ids stay silent.
                    </div>` : O}
                ${this._startAt(n.start_at, (e) => this._setSound(r, t, { start_at: e }))}
                ${a ? E`
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
                    ` : O}
                <button @click=${() => this._test(e, t)}>Test</button>
              </div>
            ` : O}
        ${this._notes[i] ? E`<div class="note muted small">${this._notes[i]}</div>` : O}
      </div>
    `;
	}
	_speechRow(e) {
		let t = e.speech, n = e.entity_id, r = `speaker:${n}:speech`, i = this._targets(t.route, t.target);
		return E`
      <div class="level">
        <label class="inline">
          <input
            type="checkbox"
            .checked=${t.enabled}
            @change=${(e) => this._setSpeech(n, { enabled: e.target.checked })}
          />
          Speak a sentence
        </label>
        ${t.enabled ? E`
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
                    ${wt.map((e) => E`<option value=${e.value} ?selected=${e.value === t.route}>${e.label}</option>`)}
                  </select>
                </label>
                <label class="num wide">
                  ${t.route === "tts" ? "Voice" : "Alexa device"}
                  <select
                    .value=${t.target}
                    @change=${(e) => this._setSpeech(n, { target: e.target.value })}
                  >
                    <option value="" ?selected=${t.target === ""}>Choose…</option>
                    ${i.map((e) => E`<option value=${e.value} ?selected=${e.value === t.target}>${e.label}</option>`)}
                  </select>
                </label>
                ${t.route === "alexa_media" ? E`
                      <label class="inline small">
                        <input
                          type="checkbox"
                          .checked=${t.announce}
                          @change=${(e) => this._setSpeech(n, { announce: e.target.checked })}
                        />
                        Announce (with chime). Some Alexas stay silent, so test it.
                      </label>
                    ` : O}
                ${this._startAt(t.start_at, (e) => this._setSpeech(n, { start_at: e }))}
                <button @click=${() => this._test(e, "speech")}>Test</button>
              </div>
            ` : O}
        ${this._notes[r] ? E`<div class="note muted small">${this._notes[r]}</div>` : O}
      </div>
    `;
	}
	_renderSpeakers(e) {
		let t = e.speakers.map((e) => e.entity_id), n = this._ids(["media_player"], t);
		return E`
      <section class="card">
        <h2>Speakers</h2>
        <p class="muted small">
          Each speaker can play a small ding, speak a sentence, and sound an
          alarm. A speaker plays the highest level that has been reached. Press
          Test on each one to hear it.
        </p>
        ${e.speakers.map((t) => E`
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
            ${n.map((e) => E`<option value=${e} ?selected=${e === this._addSpeaker}>${this._friendly(e)}</option>`)}
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
			this._note(t, (await V(this.hass, e)).note);
		} catch (e) {
			this._note(t, H(e));
		}
	}
	_renderDevices(e) {
		let t = e.alarm_devices.map((e) => e.entity_id), n = this._ids(St, t);
		return E`
      <section class="card">
        <h2>Alarm devices</h2>
        <p class="muted small">
          A siren, switch or script that sounds the alarm. Boopli switches it on
          for the time you set and then off again, and off when you answer or
          when Home Assistant restarts.
        </p>
        ${e.alarm_devices.map((t) => {
			let n = `device:${t.entity_id}`;
			return E`
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
            ${this._notes[n] ? E`<div class="note muted small">${this._notes[n]}</div>` : O}
          `;
		})}
        <div class="row add">
          <select
            aria-label="Add an alarm device"
            .value=${this._addDevice}
            @change=${(e) => this._addDevice = e.target.value}
          >
            <option value="">Add a siren, switch or script…</option>
            ${n.map((e) => E`<option value=${e} ?selected=${e === this._addDevice}>${this._friendly(e)}</option>`)}
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
		return e ? E`${this._renderSpeakers(e)} ${this._renderDevices(e)}` : O;
	}
	static {
		this.styles = [K, o`
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
customElements.define("boopli-speakers", Tt);
// src/boopli-settings.ts
var Et = "boopli.settings_mode";
function Dt() {
	try {
		return localStorage.getItem(Et) === "advanced" ? "advanced" : "simple";
	} catch {
		return "simple";
	}
}
var Ot = [
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
], kt = [{
	value: "blink",
	label: "Blink"
}, {
	value: "indicator",
	label: "Indicator lamp (on until done)"
}], At = [
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
], jt = {
	start: "07:00",
	stop: "22:00"
}, Mt = class extends F {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			_draft: { state: !0 },
			_addLight: { state: !0 },
			_busy: { state: !0 },
			_message: { state: !0 },
			_error: { state: !0 },
			_notes: { state: !0 },
			_mode: { state: !0 }
		};
	}
	constructor() {
		super(), this._justSaved = !1, this._lastDirty = !1, this._addLight = "", this._busy = !1, this._message = "", this._error = "", this._notes = {}, this._mode = Dt();
	}
	willUpdate() {
		let e = this.snapshot?.settings;
		e && (!this._draft || !this._base ? (this._base = structuredClone(e), this._draft = structuredClone(e)) : this._justSaved && JSON.stringify(e) !== JSON.stringify(this._base) && (this._base = structuredClone(e), this._draft = structuredClone(e), this._justSaved = !1));
	}
	updated() {
		let e = this._isDirty();
		e !== this._lastDirty && (this._lastDirty = e, this.dispatchEvent(new CustomEvent("dirty-change", {
			detail: {
				source: "settings",
				dirty: e
			},
			bubbles: !0,
			composed: !0
		})));
	}
	_isDirty() {
		return !!this._draft && !!this._base && JSON.stringify(this._draft) !== JSON.stringify(this._base);
	}
	_changed(...e) {
		let t = this._draft, n = this._base;
		return !t || !n ? !1 : e.some((e) => JSON.stringify(t[e]) !== JSON.stringify(n[e]));
	}
	_badge(...e) {
		return this._changed(...e) ? E`<span class="unsaved-badge">Unsaved</span>` : O;
	}
	_cardClass(...e) {
		return this._changed(...e) ? "card changed" : "card";
	}
	async save() {
		if (!this.hass || !this._draft || this._busy) return !1;
		this._busy = !0, this._error = "", this._message = "";
		try {
			return await I(this.hass, this._draft), this._justSaved = !0, this._base = structuredClone(this._draft), this._message = "Saved.", !0;
		} catch (e) {
			return this._error = H(e), !1;
		} finally {
			this._busy = !1;
		}
	}
	discard() {
		this._base && (this._draft = structuredClone(this._base)), this._message = "", this._error = "";
	}
	_setMode(e) {
		this._mode = e;
		try {
			localStorage.setItem(Et, e);
		} catch {}
	}
	_openWizard(e) {
		this.dispatchEvent(new CustomEvent("open-wizard", {
			detail: e ? { wizard: e } : {},
			bubbles: !0,
			composed: !0
		}));
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
		return E`
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
			let n = await z(this.hass, {
				service: e,
				level: t,
				start_at: 1
			});
			this._note(`phone:${e}`, n.note);
		} catch (t) {
			this._note(`phone:${e}`, H(t));
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
				let t = await R(this.hass, e);
				this._note(`light:${e.entity_id}`, t.note);
			} catch (t) {
				this._note(`light:${e.entity_id}`, H(t));
			}
		}
	}
	_setQuiet(e) {
		if (!this._draft) return;
		let t = this._draft.quiet_hours.days;
		e && Object.keys(t).length === 0 && (t = Object.fromEntries(U.map((e, t) => [String(t), { ...jt }]))), this._set({ quiet_hours: {
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
		let e = this._draft.quiet_hours, t = e.days[0], n = Object.fromEntries(U.map((e, n) => [String(n), t ? { ...t } : null]));
		this._set({ quiet_hours: {
			...e,
			days: n
		} });
	}
	async _save() {
		await this.save();
	}
	_renderPhones(e) {
		let t = this._phoneServices();
		return E`
      <section class=${this._cardClass("phones")}>
        <h2>Phones ${this._badge("phones")}</h2>
        <p class="muted small">
          Boopli sends a notification with Done and Snooze buttons through the
          Home Assistant app on the phones you turn on.
        </p>
        ${t.length === 0 ? E`<p class="muted">No phones with the Home Assistant app found.</p>` : t.map((t) => {
			let n = e.phones.find((e) => e.service === t), r = this._notes[`phone:${t}`];
			return E`
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
                    ${Ot.map((e) => E`<option value=${e.value} ?selected=${e.value === (n?.level ?? "normal")}>${e.label}</option>`)}
                  </select>
                  <button @click=${() => this._testPhone(t)}>Test</button>
                </div>
                ${n ? E`<div class="startrow">
                      ${this._startAtField(n.start_at ?? 1, (e) => this._setPhoneStart(t, e))}
                    </div>` : O}
                ${r ? E`<div class="note muted small">${r}</div>` : O}
              `;
		})}
      </section>
    `;
	}
	_renderLights(e) {
		let t = this._lightChoices();
		return E`
      <section class=${this._cardClass("lights")}>
        <h2>Reminder lights ${this._badge("lights")}</h2>
        <p class="muted small">
          Boopli blinks a light itself and puts it back exactly as it was, or
          uses it as an indicator lamp that stays on in a color until you are
          done. Press Test to see what a light really does: lights differ a lot.
        </p>
        ${e.lights.map((e) => {
			let t = this._notes[`light:${e.entity_id}`], n = e.entity_id, r = e.mode === "blink";
			return E`
            <div class="row">
              <div class="grow">
                <div>${this._friendly(n)}</div>
                ${this.hass?.states[n] ? O : E`<div class="muted small">Not found right now</div>`}
              </div>
              <select
                aria-label="Light mode"
                .value=${e.mode}
                @change=${(e) => this._setLightMode(n, e.target.value)}
              >
                ${kt.map((t) => E`<option value=${t.value} ?selected=${t.value === e.mode}>${t.label}</option>`)}
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
            ${r ? E`
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
                ` : O}
            ${t ? E`<div class="note muted small">${t}</div>` : O}
          `;
		})}
        <div class="row add">
          <select
            aria-label="Add a light"
            .value=${this._addLight}
            @change=${(e) => this._addLight = e.target.value}
          >
            <option value="">Add a light…</option>
            ${t.map((e) => E`<option value=${e} ?selected=${e === this._addLight}>${this._friendly(e)}</option>`)}
          </select>
          <button ?disabled=${!this._addLight} @click=${() => this._addSelectedLight()}>Add</button>
        </div>
      </section>
    `;
	}
	_renderQuiet(e) {
		let t = e.quiet_hours;
		return E`
      <section class=${this._cardClass("quiet_hours")}>
        <h2>Quiet hours ${this._badge("quiet_hours")}</h2>
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
        ${t.enabled ? E`
              ${U.map((e, n) => {
			let r = t.days[String(n)] ?? null;
			return E`
                  <div class="row day">
                    <span class="dayname">${e}</span>
                    <label class="inline small">
                      <input
                        type="checkbox"
                        .checked=${r === null}
                        @change=${(e) => this._setDay(n, e.target.checked ? null : { ...jt })}
                      />
                      No limit
                    </label>
                    ${r ? E`
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
                        ` : O}
                  </div>
                `;
		})}
              <button class="chip" @click=${() => this._copyMondayToAll()}>Copy Monday to all days</button>
            ` : O}
      </section>
    `;
	}
	_renderOther(e) {
		return E`
      <section class=${this._cardClass("presence_entity", "pet_name", "snooze_minutes", "default_style")}>
        <h2>Where you are, snooze and defaults ${this._badge("presence_entity", "pet_name", "snooze_minutes", "default_style")}</h2>
        <div class="field">
          <label for="presence">Where you are (optional)</label>
          <select
            id="presence"
            .value=${e.presence_entity}
            @change=${(e) => this._set({ presence_entity: e.target.value })}
          >
            <option value="" ?selected=${e.presence_entity === ""}>None (assume I am home)</option>
            ${this._persons().map((t) => E`<option value=${t} ?selected=${t === e.presence_entity}>${this._friendly(t)}</option>`)}
          </select>
          <div class="muted small">
            At home Boopli uses everything above. Away, it only uses your phone,
            and only for chores marked "anywhere".
            ${this.snapshot ? this.snapshot.is_home ? "Right now: home." : "Right now: away." : O}
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
            ${At.map((t) => E`<option value=${t.value} ?selected=${t.value === e.default_style}>${t.label}</option>`)}
          </select>
        </div>
      </section>
    `;
	}
	_overviewCard(e, t, n, r, i = "Set up step by step") {
		return E`<section class="card overview">
      <h2>${e}</h2>
      <div class="summary">
        ${n.length ? n.map((e) => E`<div>${e}</div>`) : E`<div class="muted">${r}</div>`}
      </div>
      <button type="button" class="primary" @click=${() => this._openWizard(t)}>${i}</button>
    </section>`;
	}
	_renderSimple() {
		let e = this.snapshot?.settings;
		if (!e) return O;
		let t = (e) => J(this.hass, e);
		return E`
      <div class="cards">
        ${this._overviewCard("Your pet", "pet", [e.pet_name], "", "Rename")}
        ${this._overviewCard("Phone", "phone", e.phones.map((e) => `${X(e.service)}: ${Z[e.level] ?? e.level}, from nudge ${e.start_at}`), "No phone set up yet.")}
        ${this._overviewCard("Quiet hours", "quiet", [_t(e.quiet_hours)], "")}
        ${this._overviewCard("Snooze and style", "nudging", [`Snooze ${e.snooze_minutes} minutes`, `New chores: ${gt[e.default_style] ?? e.default_style}`], "")}
        ${this._overviewCard("Reminder lights", "lights", e.lights.map((e) => `${t(e.entity_id)}: ${Q(e)}`), "No reminder lights yet.")}
        ${this._overviewCard("Speakers", "speakers", e.speakers.map((e) => `${t(e.entity_id)}: ${vt(e)}`), "No speakers yet.")}
        ${this._overviewCard("Alarm devices", "alarms", e.alarm_devices.map((e) => `${t(e.entity_id)}: on for ${e.seconds} s, from nudge ${e.start_at}`), "No alarm devices yet.")}
        ${this._overviewCard("Where you are", "presence", e.presence_entity ? [t(e.presence_entity)] : [], "Not set. Boopli assumes you are home.")}
      </div>
      <p class="muted small">
        Want to do all of it again from the start?
        <button type="button" class="chip" @click=${() => this._openWizard("first")}>Run the first setup again</button>
      </p>
    `;
	}
	_renderSaveBar() {
		return this._isDirty() ? E`<div class="savebar" role="status">
      <span><b>●</b> You have unsaved changes</span>
      <span class="spacer"></span>
      <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
      <button ?disabled=${this._busy} @click=${() => this.discard()}>Discard</button>
    </div>` : O;
	}
	render() {
		let e = this._draft;
		if (!e) return E`<p class="muted">Loading…</p>`;
		let t = this._mode === "simple";
		return E`
      <div class="toolbar">
        <h2 class="page-title">${t ? "Settings" : "Settings: advanced"}</h2>
        <button type="button" @click=${() => this._setMode(t ? "advanced" : "simple")}>
          ${t ? "Advanced settings" : "Back to the simple view"}
        </button>
      </div>
      ${t ? this._renderSimple() : E`
            <div class="cards">
              ${this._renderPhones(e)} ${this._renderLights(e)}
              <boopli-speakers
                class=${this._changed("speakers", "alarm_devices", "speech_template") ? "changed" : ""}
                .hass=${this.hass}
                .settings=${e}
                @settings-patch=${(e) => this._set(e.detail)}
              ></boopli-speakers>
              ${this._renderQuiet(e)} ${this._renderOther(e)}
            </div>
            ${this._error ? E`<div class="error">${this._error}</div>` : O}
            <div class="save">
              <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save settings</button>
              ${this._message ? E`<span class="muted">${this._message}</span>` : O}
            </div>
          `}
      ${this._renderSaveBar()}
    `;
	}
	static {
		this.styles = [K, o`
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .page-title {
        font-size: 22px;
        margin: 0;
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 16px;
        align-items: start;
      }
      .overview {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .overview h2 {
        margin: 0;
      }
      .summary {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        font-size: 15px;
      }
      .overview button {
        align-self: flex-start;
      }
      .spacer {
        flex: 1;
      }
      section.card {
        margin: 0;
      }
      section.card.changed,
      boopli-speakers.changed {
        border-color: var(--warning-color, #ffa600);
        box-shadow: inset 4px 0 0 var(--warning-color, #ffa600);
      }
      boopli-speakers.changed::before {
        content: "● Unsaved changes in speakers and alarm devices";
        display: block;
        color: var(--warning-color, #ffa600);
        font-size: 13px;
        font-weight: 500;
        padding: 0 0 6px 4px;
      }
      .unsaved-badge {
        display: inline-block;
        margin-left: 8px;
        padding: 1px 8px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        color: #000;
        background: var(--warning-color, #ffa600);
        vertical-align: middle;
      }
      .savebar {
        position: sticky;
        bottom: 12px;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 20px;
        padding: 12px 16px;
        border-radius: 14px;
        border: 2px solid var(--warning-color, #ffa600);
        background: var(--card-background-color, var(--primary-background-color));
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
      }
      .savebar b {
        color: var(--warning-color, #ffa600);
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
customElements.define("boopli-settings", Mt);
// src/diff.ts
function $(e, t, n) {
	let r = new Map(e.map((e) => [n(e), e])), i = new Map(t.map((e) => [n(e), e]));
	return {
		added: [...i].filter(([e]) => !r.has(e)).map(([, e]) => e),
		removed: [...r].filter(([e]) => !i.has(e)).map(([, e]) => e),
		kept: [...i].filter(([e]) => r.has(e)).map(([e, t]) => ({
			before: r.get(e),
			after: t
		}))
	};
}
function Nt(e, t, n, r) {
	let i = [];
	return t.enabled !== n.enabled && i.push(`${e} ${n.enabled ? "on" : "off"}`), n.enabled && (t.sound !== n.sound && i.push(`${e} sound ${t.sound} → ${n.sound}`), t.start_at !== n.start_at && i.push(`${e} starts at nudge ${t.start_at} → ${n.start_at}`), r && t.seconds !== n.seconds && i.push(`${e} lasts ${t.seconds} → ${n.seconds} s`), r && t.repeat_s !== n.repeat_s && i.push(`${e} repeats every ${t.repeat_s} → ${n.repeat_s} s`)), i;
}
function Pt(e, t) {
	let n = [...Nt("ding", e.cue, t.cue, !1), ...Nt("alarm", e.alarm, t.alarm, !0)];
	return e.speech.enabled !== t.speech.enabled && n.push(`speech ${t.speech.enabled ? "on" : "off"}`), t.speech.enabled && ((e.speech.target !== t.speech.target || e.speech.route !== t.speech.route) && n.push(`speech goes to ${t.speech.target || "nothing"}`), e.speech.start_at !== t.speech.start_at && n.push(`speech starts at nudge ${e.speech.start_at} → ${t.speech.start_at}`)), n;
}
function Ft(e, t, n) {
	let r = (e) => J(n, e), i = [];
	e.pet_name !== t.pet_name && i.push(`Pet name: ${e.pet_name} → ${t.pet_name}`);
	let a = $(e.phones, t.phones, (e) => e.service);
	a.added.forEach((e) => i.push(`Phone added: ${X(e.service)} (${Z[e.level] ?? e.level})`)), a.removed.forEach((e) => i.push(`Phone removed: ${X(e.service)}`)), a.kept.forEach(({ before: e, after: t }) => {
		e.level !== t.level && i.push(`${X(t.service)}: level ${Z[e.level]} → ${Z[t.level]}`), e.start_at !== t.start_at && i.push(`${X(t.service)}: starts at nudge ${e.start_at} → ${t.start_at}`);
	});
	let o = e.quiet_hours, s = t.quiet_hours;
	if (o.enabled !== s.enabled && i.push(`Quiet hours: ${o.enabled ? "on" : "off"} → ${s.enabled ? "on" : "off"}`), s.enabled) {
		let e = (e, t) => {
			let n = e.days[String(t)] ?? null;
			return n ? `${n.start} to ${n.stop}` : "no limit";
		};
		U.forEach((t, n) => {
			let r = o.enabled ? e(o, n) : "any time", a = e(s, n);
			r !== a && i.push(`${t}: ${r} → ${a}`);
		});
	}
	e.snooze_minutes !== t.snooze_minutes && i.push(`Snooze: ${e.snooze_minutes} → ${t.snooze_minutes} min`), e.default_style !== t.default_style && i.push(`Default style: ${gt[e.default_style]} → ${gt[t.default_style]}`);
	let c = $(e.lights, t.lights, (e) => e.entity_id);
	c.added.forEach((e) => i.push(`Reminder light added: ${r(e.entity_id)} (${Q(e)})`)), c.removed.forEach((e) => i.push(`Reminder light removed: ${r(e.entity_id)}`)), c.kept.forEach(({ before: e, after: t }) => {
		let n = r(t.entity_id);
		e.mode !== t.mode && i.push(`${n}: ${Q(e)} → ${Q(t)}`), e.color.join() !== t.color.join() && i.push(`${n}: color changed`), e.blink_ms !== t.blink_ms && i.push(`${n}: blink length ${e.blink_ms} → ${t.blink_ms} ms`), e.repeats !== t.repeats && i.push(`${n}: blinks ${e.repeats} → ${t.repeats}`), e.gap_ms !== t.gap_ms && i.push(`${n}: pause ${e.gap_ms} → ${t.gap_ms} ms`), e.start_at !== t.start_at && i.push(`${n}: starts at nudge ${e.start_at} → ${t.start_at}`);
	});
	let l = $(e.speakers, t.speakers, (e) => e.entity_id);
	l.added.forEach((e) => i.push(`Speaker added: ${r(e.entity_id)}`)), l.removed.forEach((e) => i.push(`Speaker removed: ${r(e.entity_id)}`)), l.kept.forEach(({ before: e, after: t }) => Pt(e, t).forEach((e) => i.push(`${r(t.entity_id)}: ${e}`))), e.speech_template !== t.speech_template && i.push(`Spoken sentence: ${e.speech_template} → ${t.speech_template}`);
	let u = $(e.alarm_devices, t.alarm_devices, (e) => e.entity_id);
	if (u.added.forEach((e) => i.push(`Alarm device added: ${r(e.entity_id)}`)), u.removed.forEach((e) => i.push(`Alarm device removed: ${r(e.entity_id)}`)), u.kept.forEach(({ before: e, after: t }) => {
		e.seconds !== t.seconds && i.push(`${r(t.entity_id)}: on for ${e.seconds} → ${t.seconds} s`), e.start_at !== t.start_at && i.push(`${r(t.entity_id)}: starts at nudge ${e.start_at} → ${t.start_at}`);
	}), e.presence_entity !== t.presence_entity) {
		let n = (e) => e ? r(e) : "not set";
		i.push(`Where you are: ${n(e.presence_entity)} → ${n(t.presence_entity)}`);
	}
	return i;
}
// src/boopli-wizard.ts
var It = {
	first: [
		"welcome",
		"phone",
		"quiet",
		"nudging",
		"lights",
		"speaker_gate",
		"presence",
		"chores",
		"done"
	],
	phone: [
		"phone",
		"phone_detail",
		"done"
	],
	quiet: ["quiet", "done"],
	lights: [
		"lights",
		"lights_detail",
		"done"
	],
	speakers: [
		"spk_pick",
		"spk_ding",
		"spk_speech",
		"spk_alarm",
		"spk_when",
		"done"
	],
	alarms: [
		"alarm_devices",
		"alarm_detail",
		"done"
	],
	presence: ["presence", "done"],
	nudging: ["nudging", "done"],
	pet: ["pet", "done"]
}, Lt = [
	"spk_pick",
	"spk_ding",
	"spk_speech",
	"spk_alarm",
	"alarm_devices"
], Rt = {
	first: "First setup",
	phone: "Phone setup",
	quiet: "Quiet hours setup",
	lights: "Reminder lights setup",
	speakers: "Speaker setup",
	alarms: "Alarm devices setup",
	presence: "Where you are",
	nudging: "Snooze and style",
	pet: "Your pet"
}, zt = {
	welcome: "Welcome",
	phone: "Your phone",
	phone_detail: "Phone details",
	quiet: "Quiet hours",
	nudging: "Snooze and style",
	lights: "Reminder lights",
	lights_detail: "Light details",
	speaker_gate: "Speaker reminders",
	spk_pick: "Pick a speaker",
	spk_ding: "A small ding",
	spk_speech: "A spoken sentence",
	spk_alarm: "An alarm sound",
	spk_when: "When it joins in",
	alarm_devices: "Alarm devices",
	alarm_detail: "Alarm device details",
	presence: "Where you are",
	pet: "Your pet",
	chores: "First chores",
	done: "All set"
}, Bt = [
	"phone_detail",
	"lights_detail",
	"spk_when",
	"alarm_detail"
], Vt = [
	{
		value: "one",
		label: "One nudge",
		text: "A single nudge, then quiet."
	},
	{
		value: "escalating",
		label: "Escalating",
		text: "Gets more frequent, then stops."
	},
	{
		value: "persistent",
		label: "Persistent",
		text: "Every 5 minutes until it is done."
	},
	{
		value: "quiet",
		label: "Quiet",
		text: "Only shown in Boopli, never nudges."
	}
], Ht = [
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
], Ut = [
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
], Wt = [{
	value: "alexa",
	label: "Alexa sound"
}, {
	value: "file",
	label: "File in my media folder"
}], Gt = "https://developer.amazon.com/en-US/docs/alexa/custom-skills/ask-soundlibrary.html", Kt = [
	0,
	1,
	2,
	3,
	4,
	5,
	6
], qt = class extends F {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			wizard: { type: String },
			startAt: { type: String },
			_draft: { state: !0 },
			_steps: { state: !0 },
			_index: { state: !0 },
			_busy: { state: !0 },
			_error: { state: !0 },
			_notes: { state: !0 },
			_picked: { state: !0 },
			_speaker: { state: !0 },
			_addDevice: { state: !0 }
		};
	}
	constructor() {
		super(), this._started = !1, this.wizard = "first", this.startAt = "", this._steps = [], this._index = 0, this._busy = !1, this._error = "", this._notes = {}, this._picked = [], this._speaker = "", this._addDevice = "";
	}
	get _first() {
		return this.wizard === "first";
	}
	get _step() {
		return this._steps[Math.min(this._index, this._steps.length - 1)] ?? "done";
	}
	willUpdate() {
		if (this._started || !this.snapshot) return;
		this._started = !0, this._saved = structuredClone(this.snapshot.settings), this._baseline = structuredClone(this.snapshot.settings), this._draft = structuredClone(this.snapshot.settings), this._steps = [...It[this.wizard]];
		let e = this.startAt;
		if (this._first && Lt.includes(e)) {
			let e = this._steps.indexOf("speaker_gate");
			this._steps.splice(e + 1, 0, ...Lt);
		}
		let t = this._steps.indexOf(e);
		this._index = t >= 0 ? t : 0, this._picked = q.filter((e) => !this.snapshot.chores.some((t) => t.name === e.draft.name)).map((e) => e.label), this.snapshot.settings.speakers.length === 1 && (this._speaker = this.snapshot.settings.speakers[0].entity_id), this._enter();
	}
	_set(e) {
		this._draft &&= {
			...this._draft,
			...e
		};
	}
	_note(e, t) {
		this._notes = {
			...this._notes,
			[e]: t
		};
	}
	_fn(e) {
		return J(this.hass, e);
	}
	_phones() {
		let e = Object.keys(this.hass?.services?.notify ?? {}).filter((e) => e.startsWith("mobile_app_")), t = this._draft?.phones.map((e) => e.service) ?? [];
		return [.../* @__PURE__ */ new Set([...e, ...t])].sort();
	}
	_num(e, t, n) {
		let r = Math.round(Number(e));
		if (!(e.trim() === "" || Number.isNaN(r))) return Math.min(n, Math.max(t, r));
	}
	_numField(e, t, n, r, i, a = 1) {
		return E`<label class="num">
      ${e}
      <input
        type="number"
        min=${n}
        max=${r}
        step=${a}
        .value=${String(t)}
        @change=${(e) => {
			let t = this._num(e.target.value, n, r);
			t !== void 0 && i(t);
		}}
      />
    </label>`;
	}
	_currentSpeaker() {
		return this._draft?.speakers.find((e) => e.entity_id === this._speaker);
	}
	_patchSpeaker(e) {
		this._draft && this._set({ speakers: this._draft.speakers.map((t) => t.entity_id === this._speaker ? e(t) : t) });
	}
	_patchSound(e, t) {
		this._patchSpeaker((n) => ({
			...n,
			[e]: {
				...n[e],
				...t
			}
		}));
	}
	_enter() {
		this._error = "";
		let e = this._draft;
		if (e && this._step === "phone" && e.phones.length === 0) {
			let e = this._phones();
			e.length === 1 && this._set({ phones: [{
				service: e[0],
				level: "normal",
				start_at: 1
			}] });
		}
	}
	async _go(e, t = "next") {
		if (this.hass && this._draft && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				if (e === 1 && t === "next") {
					if (this._step === "spk_pick" && !this._speaker) throw Error("Pick a speaker, or press Skip.");
					await I(this.hass, this._draft), this._saved = structuredClone(this._draft);
				}
				e === 1 && t === "skip" && (this._draft = structuredClone(this._saved), this._step === "chores" && (this._picked = [])), t === "gate" && (this._steps = [
					...this._steps.slice(0, this._index + 1),
					...Lt,
					...this._steps.slice(this._index + 1)
				]);
				let n = Math.max(0, Math.min(this._index + e, this._steps.length - 1));
				this._first && await L(this.hass, "in_progress", this._steps[n]), this._index = n, this._enter();
			} catch (e) {
				this._error = H(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_jump(e) {
		this._busy || e >= this._index || (this._index = e, this._enter());
	}
	_close() {
		this.dispatchEvent(new CustomEvent("wizard-close", {
			bubbles: !0,
			composed: !0
		}));
	}
	async _leave() {
		if (this.hass && !this._busy) {
			this._busy = !0;
			try {
				this._first && await L(this.hass, "skipped", this._step), this._close();
			} catch (e) {
				this._error = H(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	async _finish() {
		if (this.hass && this._draft && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				if (await I(this.hass, this._draft), this._first) {
					for (let e of q.filter((e) => this._picked.includes(e.label))) await je(this.hass, {
						...e.draft,
						repeat: {
							type: "none",
							time: "09:00",
							weekdays: [],
							every_n_days: 1
						}
					});
					await L(this.hass, "done", "");
				}
				this._close();
			} catch (e) {
				this._error = H(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_setQuiet(e) {
		if (!this._draft) return;
		let t = this._draft.quiet_hours.days;
		e && Object.keys(t).length === 0 && (t = Object.fromEntries(Kt.map((e) => [String(e), { ...lt }]))), this._set({ quiet_hours: {
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
	_copyDayAbove(e) {
		if (!this._draft || e === 0) return;
		let t = this._draft.quiet_hours.days[String(e - 1)] ?? null;
		this._setDay(e, t ? { ...t } : null);
	}
	_copyMondayToAll() {
		if (!this._draft) return;
		let e = this._draft.quiet_hours, t = e.days[0] ?? null;
		this._set({ quiet_hours: {
			...e,
			days: Object.fromEntries(Kt.map((e) => [String(e), t ? { ...t } : null]))
		} });
	}
	async _try(e, t) {
		this._note(e, "Testing…");
		try {
			this._note(e, (await t()).note);
		} catch (t) {
			this._note(e, H(t));
		}
	}
	_noteLine(e) {
		let t = this._notes[e];
		return t ? E`<div class="muted small note">${t}</div>` : O;
	}
	_renderWelcome(e) {
		return E`
      <p>
        Boopli breaks chores into small steps and nudges you with the lights, speakers and phone
        you already have. A few quick questions, and you can skip any of them. Nothing leaves your
        home, and nothing is sent to a device until you press a Test button.
      </p>
      ${this._renderPet(e)}
    `;
	}
	_renderPet(e) {
		return E`<div class="field">
      <label for="petname">What should your pet be called?</label>
      <input
        id="petname"
        maxlength="30"
        .value=${e.pet_name ?? "Boopli"}
        @input=${(e) => this._set({ pet_name: e.target.value })}
      />
    </div>`;
	}
	_renderPhone(e) {
		let t = this._phones();
		return E`
      <p>
        Which phone should get Boopli's notifications? They have <b>Done</b> and <b>Snooze</b>
        buttons, so you can answer without opening anything.
      </p>
      ${t.length === 0 ? E`<p class="muted">
            No phone with the Home Assistant app found. Install the app and sign in, then come back.
            You can skip this for now.
          </p>` : E`<div class="list">
            ${t.map((t) => {
			let n = e.phones.find((e) => e.service === t);
			return E`<div class="choice">
                <label class="inline">
                  <input
                    type="checkbox"
                    .checked=${!!n}
                    @change=${(n) => {
				let r = n.target.checked, i = e.phones.filter((e) => e.service !== t);
				this._set({ phones: r ? [...i, {
					service: t,
					level: "normal",
					start_at: 1
				}] : i });
			}}
                  />
                  ${X(t)}
                </label>
                <button type="button" @click=${() => this._try(`phone:${t}`, () => z(this.hass, {
				service: t,
				level: n?.level ?? "normal",
				start_at: 1
			}))}>
                  Send a test
                </button>
                ${this._noteLine(`phone:${t}`)}
              </div>`;
		})}
          </div>`}
    `;
	}
	_renderPhoneDetail(e) {
		return e.phones.length === 0 ? E`<p class="muted">No phone is set up yet. Skip this.</p>` : E`
      <p>
        How loud should each phone be, and from which nudge on? Nudge 1 is the first one for a step.
        You can leave the defaults.
      </p>
      <div class="list">
        ${e.phones.map((t) => E`<div class="choice col">
            <b>${X(t.service)}</b>
            <label class="num">
              Notification level
              <select
                @change=${(n) => this._set({ phones: e.phones.map((e) => e.service === t.service ? {
			...e,
			level: n.target.value
		} : e) })}
              >
                ${Ht.map((e) => E`<option value=${e.value} .selected=${e.value === t.level}>${e.label}</option>`)}
              </select>
            </label>
            ${this._numField("Starts at nudge #", t.start_at ?? 1, 1, 20, (n) => this._set({ phones: e.phones.map((e) => e.service === t.service ? {
			...e,
			start_at: n
		} : e) }))}
            <button type="button" @click=${() => this._try(`phone:${t.service}`, () => z(this.hass, t))}>Send a test</button>
            ${this._noteLine(`phone:${t.service}`)}
          </div>`)}
      </div>
    `;
	}
	_renderQuiet(e) {
		let t = e.quiet_hours;
		return E`
      <p>
        Should Boopli stay quiet at certain times, like at night? Set the times Boopli may nudge you
        for each day on its own. Outside them, nudges wait. A chore can opt out later, for example
        pills.
      </p>
      <label class="inline option">
        <input
          type="checkbox"
          .checked=${t.enabled}
          @change=${(e) => this._setQuiet(e.target.checked)}
        />
        Hold nudges outside the times below
      </label>
      ${t.enabled ? E`
            <div class="days">
              ${Kt.map((e) => {
			let n = t.days[String(e)] ?? null;
			return E`<div class="dayrow">
                  <span class="dayname">${U[e]}</span>
                  <label class="inline small">
                    <input
                      type="checkbox"
                      .checked=${n === null}
                      @change=${(t) => this._setDay(e, t.target.checked ? null : { ...lt })}
                    />
                    No limit
                  </label>
                  ${n ? E`<span class="muted small">from</span>
                        <input
                          type="time"
                          aria-label="${U[e]} from"
                          .value=${n.start}
                          @input=${(t) => this._setDay(e, {
				...n,
				start: t.target.value
			})}
                        />
                        <span class="muted small">until</span>
                        <input
                          type="time"
                          aria-label="${U[e]} until"
                          .value=${n.stop}
                          @input=${(t) => this._setDay(e, {
				...n,
				stop: t.target.value
			})}
                        />` : O}
                  ${e > 0 ? E`<button type="button" class="chip" @click=${() => this._copyDayAbove(e)}>Same as ${U[e - 1]}</button>` : O}
                </div>`;
		})}
            </div>
            <button type="button" class="chip" @click=${() => this._copyMondayToAll()}>Copy Monday to all days</button>
          ` : O}
    `;
	}
	_renderNudging(e) {
		return E`
      <div class="field">
        <label for="snooze">When you press Snooze, how many minutes until the next nudge?</label>
        <div class="chips">
          ${[
			5,
			10,
			15,
			30
		].map((t) => E`<button type="button" class="chip ${e.snooze_minutes === t ? "on" : ""}" @click=${() => this._set({ snooze_minutes: t })}>${t} min</button>`)}
          <input
            id="snooze"
            class="short"
            type="number"
            min="1"
            max="720"
            .value=${String(e.snooze_minutes)}
            @input=${(e) => this._set({ snooze_minutes: Number(e.target.value) || 15 })}
          />
        </div>
      </div>
      <p>How should new chores nudge you, unless you say otherwise?</p>
      ${Vt.map((t) => E`<label class="inline option">
          <input type="radio" name="style" .checked=${e.default_style === t.value} @change=${() => this._set({ default_style: t.value })} />
          <span><b>${t.label}</b> <span class="muted small">${t.text}</span></span>
        </label>`)}
    `;
	}
	_renderLights(e) {
		let t = Y(this.hass, ["light"]);
		return E`
      <p>
        Which lights should remind you? Each one either <b>blinks</b> when a step is your turn, or
        is a <b>status light</b> that turns on and stays on until you are done. This is optional.
      </p>
      ${t.length === 0 ? E`<p class="muted">No lights found.</p>` : E`<div class="list grid">
            ${t.map((t) => {
			let n = e.lights.find((e) => e.entity_id === t);
			return E`<div class="choice col">
                <label class="inline">
                  <input
                    type="checkbox"
                    .checked=${!!n}
                    @change=${(n) => {
				let r = n.target.checked, i = e.lights.filter((e) => e.entity_id !== t);
				this._set({ lights: r ? [...i, dt(t)] : i });
			}}
                  />
                  ${this._fn(t)}
                </label>
                ${n ? E`<div class="radios">
                      ${["blink", "indicator"].map((r) => E`<label class="inline small">
                          <input
                            type="radio"
                            name="mode-${t}"
                            .checked=${n.mode === r}
                            @change=${() => this._set({ lights: e.lights.map((e) => e.entity_id === t ? {
				...e,
				mode: r
			} : e) })}
                          />
                          ${r === "blink" ? "Blinks" : "Status light (stays on until done)"}
                        </label>`)}
                      <button type="button" @click=${() => this._try(`light:${t}`, () => R(this.hass, n))}>Test</button>
                    </div>
                    ${this._noteLine(`light:${t}`)}` : O}
              </div>`;
		})}
          </div>`}
    `;
	}
	_renderLightDetail(e) {
		return e.lights.length === 0 ? E`<p class="muted">No reminder light is set up yet. Skip this.</p>` : E`
      <p>
        Fine-tune each light. A light in your home can follow a few hundred milliseconds; a
        cloud-connected light needs about a second or more, so find its limit with Test.
      </p>
      <div class="list grid">
        ${e.lights.map((t) => {
			let n = (n) => this._set({ lights: e.lights.map((e) => e.entity_id === t.entity_id ? {
				...e,
				...n
			} : e) });
			return E`<div class="choice col">
            <b>${this._fn(t.entity_id)}</b>
            <label class="num">
              Color
              <input type="color" class="swatch" .value=${ht(t.color)} @input=${(e) => n({ color: mt(e.target.value) })} />
            </label>
            ${t.mode === "blink" ? E`${this._numField("Blink length (ms)", t.blink_ms, 100, 3e4, (e) => n({ blink_ms: e }), 100)}
                ${this._numField("Number of blinks", t.repeats, 1, 5, (e) => n({ repeats: e }))}
                ${this._numField("Pause between blinks (ms)", t.gap_ms, 0, 3e4, (e) => n({ gap_ms: e }), 100)}` : E`<span class="muted small">A status light has no blink settings.</span>`}
            ${this._numField("Starts at nudge #", t.start_at ?? 1, 1, 20, (e) => n({ start_at: e }))}
            <button type="button" @click=${() => this._try(`light:${t.entity_id}`, () => R(this.hass, t))}>Test</button>
            ${this._noteLine(`light:${t.entity_id}`)}
          </div>`;
		})}
      </div>
    `;
	}
	_renderGate() {
		return E`
      <p>
        Do you want speaker reminders? A speaker can play a small ding, say the step out loud, or
        sound an alarm if you keep ignoring it. You can also use a siren or a switch as an alarm.
        If you only want lights and your phone, skip this.
      </p>
      <div class="gate">
        <button type="button" class="primary big" ?disabled=${this._busy} @click=${() => this._go(1, "gate")}>Set up speakers</button>
        <button type="button" class="big" ?disabled=${this._busy} @click=${() => this._go(1, "skip")}>Skip</button>
      </div>
    `;
	}
	_renderSpkPick(e) {
		let t = Y(this.hass, ["media_player"]);
		return E`
      <p>Which speaker do you want to set up? You can add more speakers afterwards.</p>
      ${t.length === 0 ? E`<p class="muted">No speakers (media players) found.</p>` : E`<div class="list grid">
            ${t.map((t) => {
			let n = e.speakers.find((e) => e.entity_id === t);
			return E`<label class="inline option card-choice">
                <input
                  type="radio"
                  name="speaker"
                  .checked=${this._speaker === t}
                  @change=${() => {
				this._speaker = t, n || this._set({ speakers: [...e.speakers, ft(t)] });
			}}
                />
                <span>
                  ${this._fn(t)}
                  ${n ? E`<span class="muted small"><br />set up: ${vt(n)}</span>` : O}
                </span>
              </label>`;
		})}
          </div>`}
    `;
	}
	_noSpeaker() {
		return E`<p class="muted">Pick a speaker first. Press Back.</p>`;
	}
	_soundBlock(e, t, n, r) {
		let i = t[e];
		return E`
      <p>${n}</p>
      <label class="inline option">
        <input type="checkbox" .checked=${i.enabled} @change=${(t) => this._patchSound(e, { enabled: t.target.checked })} />
        Use this on ${this._fn(t.entity_id)}
      </label>
      ${i.enabled ? E`<div class="fields">
            <label class="num">
              Sound type
              <select @change=${(t) => this._patchSound(e, { kind: t.target.value })}>
                ${Wt.map((e) => E`<option value=${e.value} .selected=${e.value === i.kind}>${e.label}</option>`)}
              </select>
            </label>
            <label class="num wide">
              ${i.kind === "alexa" ? "Alexa sound id" : "File in the media folder (or a URL)"}
              <input .value=${i.sound} @input=${(t) => this._patchSound(e, { sound: t.target.value })} />
            </label>
            ${i.kind === "alexa" ? E`<div class="muted small">
                  Pick a sound from the <a href=${Gt} target="_blank" rel="noreferrer">Amazon sound library</a>. The id is
                  <code>amzn_sfx_</code> plus the sound's name in lower case with underscores and a two-digit number, for example
                  <code>amzn_sfx_doorbell_chime_01</code>. Some sounds stay silent on some Echo devices, so press Test.
                </div>` : E`<div class="muted small">For example <code>boopli/ding.mp3</code> in your Home Assistant media folder.</div>`}
            ${e === "alarm" ? E`${this._numField("Lasts (seconds)", i.seconds, 3, 600, (e) => this._patchSound("alarm", { seconds: e }))}
                ${this._numField("Repeats every (seconds, 0 = once)", i.repeat_s, 0, 60, (e) => this._patchSound("alarm", { repeat_s: e }))}` : O}
            <div><button type="button" @click=${() => this._try(`spk:${r}`, () => B(this.hass, t, r))}>Test</button></div>
            ${this._noteLine(`spk:${r}`)}
          </div>` : O}
    `;
	}
	_renderSpkSpeech(e, t) {
		let n = e.speech, r = (e) => this._patchSpeaker((t) => ({
			...t,
			speech: {
				...t.speech,
				...e
			}
		})), i = ut(this.hass, n.route, n.target);
		return E`
      <p>The speaker says the step out loud, for example "Dishwasher: Empty it".</p>
      <label class="inline option">
        <input type="checkbox" .checked=${n.enabled} @change=${(e) => r({ enabled: e.target.checked })} />
        Say it on ${this._fn(e.entity_id)}
      </label>
      ${n.enabled ? E`<div class="fields">
            <label class="num">
              How
              <select @change=${(e) => r({
			route: e.target.value,
			target: ""
		})}>
                ${Ut.map((e) => E`<option value=${e.value} .selected=${e.value === n.route}>${e.label}</option>`)}
              </select>
            </label>
            <label class="num">
              ${n.route === "tts" ? "Voice" : "Alexa device"}
              <select @change=${(e) => r({ target: e.target.value })}>
                <option value="" .selected=${n.target === ""}>Choose…</option>
                ${i.map((e) => E`<option value=${e.value} .selected=${e.value === n.target}>${e.label}</option>`)}
              </select>
            </label>
            ${n.route === "alexa_media" ? E`<label class="inline small">
                  <input type="checkbox" .checked=${n.announce} @change=${(e) => r({ announce: e.target.checked })} />
                  Announce with a chime (some Alexas stay silent, so test it)
                </label>` : O}
            <label class="num wide">
              The sentence ({chore} and {step} are filled in)
              <input .value=${t.speech_template} @input=${(e) => this._set({ speech_template: e.target.value })} />
            </label>
            <div><button type="button" @click=${() => this._try("spk:speech", () => B(this.hass, e, "speech"))}>Test</button></div>
            ${this._noteLine("spk:speech")}
          </div>` : O}
    `;
	}
	_renderSpkWhen(e) {
		let t = [
			{
				label: "Ding",
				on: e.cue.enabled,
				value: e.cue.start_at,
				set: (e) => this._patchSound("cue", { start_at: e })
			},
			{
				label: "Spoken sentence",
				on: e.speech.enabled,
				value: e.speech.start_at,
				set: (e) => this._patchSpeaker((t) => ({
					...t,
					speech: {
						...t.speech,
						start_at: e
					}
				}))
			},
			{
				label: "Alarm sound",
				on: e.alarm.enabled,
				value: e.alarm.start_at,
				set: (e) => this._patchSound("alarm", { start_at: e })
			}
		].filter((e) => e.on);
		return E`
      <p>
        From which nudge does each thing join in on ${this._fn(e.entity_id)}? Nudge 1 is the first
        for a step. A speaker plays the highest one reached.
      </p>
      ${t.length === 0 ? E`<p class="muted">Nothing is switched on for this speaker yet.</p>` : E`<div class="fields">${t.map((e) => this._numField(`${e.label} starts at nudge #`, e.value, 1, 20, e.set))}</div>`}
      <div class="actions inline-actions">
        <button type="button" ?disabled=${this._busy} @click=${() => this._addAnotherSpeaker()}>Add another speaker</button>
      </div>
    `;
	}
	async _addAnotherSpeaker() {
		if (this.hass && this._draft && !this._busy) {
			this._busy = !0;
			try {
				await I(this.hass, this._draft), this._saved = structuredClone(this._draft), this._speaker = "", this._index = this._steps.indexOf("spk_pick"), this._enter();
			} catch (e) {
				this._error = H(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderAlarmDevices(e) {
		let t = Y(this.hass, ct, e.alarm_devices.map((e) => e.entity_id));
		return E`
      <p>
        Optional: a siren, switch or script that Boopli switches on for a while if you keep ignoring
        a step, and off again. It also stops when you answer.
      </p>
      <div class="list">
        ${e.alarm_devices.map((t) => E`<div class="choice">
            <span class="grow">${this._fn(t.entity_id)}</span>
            <button type="button" @click=${() => this._try(`alarm:${t.entity_id}`, () => V(this.hass, t))}>Test (3 s)</button>
            <button type="button" aria-label="Remove" @click=${() => this._set({ alarm_devices: e.alarm_devices.filter((e) => e.entity_id !== t.entity_id) })}>✕</button>
            ${this._noteLine(`alarm:${t.entity_id}`)}
          </div>`)}
      </div>
      <div class="choice">
        <select class="grow" @change=${(e) => this._addDevice = e.target.value}>
          <option value="" .selected=${this._addDevice === ""}>Add a siren, switch or script…</option>
          ${t.map((e) => E`<option value=${e} .selected=${e === this._addDevice}>${this._fn(e)}</option>`)}
        </select>
        <button
          type="button"
          ?disabled=${!this._addDevice}
          @click=${() => {
			this._set({ alarm_devices: [...e.alarm_devices, pt(this._addDevice)] }), this._addDevice = "";
		}}
        >
          Add
        </button>
      </div>
    `;
	}
	_renderAlarmDetail(e) {
		return e.alarm_devices.length === 0 ? E`<p class="muted">No alarm device is set up yet. Skip this.</p>` : E`
      <p>How long should each device stay on, and from which nudge on?</p>
      <div class="list grid">
        ${e.alarm_devices.map((t) => {
			let n = (n) => this._set({ alarm_devices: e.alarm_devices.map((e) => e.entity_id === t.entity_id ? {
				...e,
				...n
			} : e) });
			return E`<div class="choice col">
            <b>${this._fn(t.entity_id)}</b>
            ${this._numField("On for (seconds)", t.seconds, 1, 600, (e) => n({ seconds: e }))}
            ${this._numField("Starts at nudge #", t.start_at ?? 4, 1, 20, (e) => n({ start_at: e }))}
            <button type="button" @click=${() => this._try(`alarm:${t.entity_id}`, () => V(this.hass, t))}>Test (3 s)</button>
            ${this._noteLine(`alarm:${t.entity_id}`)}
          </div>`;
		})}
      </div>
    `;
	}
	_renderPresence(e) {
		let t = Y(this.hass, ["person"]);
		return E`
      <p>
        If Boopli knows where you are, it reminds you with lights and speakers only when you are
        home, and only on your phone when you are away. This is optional. Without it, Boopli assumes
        you are home.
      </p>
      <div class="field">
        <label for="presence">Which person are you?</label>
        <select id="presence" @change=${(e) => this._set({ presence_entity: e.target.value })}>
          <option value="" .selected=${e.presence_entity === ""}>Skip (assume I am home)</option>
          ${t.map((t) => E`<option value=${t} .selected=${t === e.presence_entity}>${this._fn(t)}</option>`)}
        </select>
      </div>
    `;
	}
	_renderChores() {
		let e = new Set(this.snapshot?.chores.map((e) => e.name));
		return E`
      <p>
        Some chores to start with. Untick what you do not want. They are added without a schedule,
        so nothing nudges you until you set a time (in the Chores tab) or start one yourself.
      </p>
      <div class="list">
        ${q.map((t) => {
			let n = e.has(t.draft.name);
			return E`<label class="inline option">
            <input
              type="checkbox"
              ?disabled=${n}
              .checked=${!n && this._picked.includes(t.label)}
              @change=${(e) => {
				let n = e.target.checked;
				this._picked = n ? [...this._picked, t.label] : this._picked.filter((e) => e !== t.label);
			}}
            />
            <span>
              <b>${t.draft.name}</b>
              <span class="muted small">${n ? "already added" : t.draft.steps.map((e) => e.title).join(" → ")}</span>
            </span>
          </label>`;
		})}
      </div>
    `;
	}
	_renderDone(e) {
		let t = this._baseline ? Ft(this._baseline, e, this.hass) : [], n = q.filter((e) => this._picked.includes(e.label)).map((e) => e.draft.name);
		return this._first && n.length && t.push(`Chores added: ${n.join(", ")}`), E`
      <p><b>What changed</b> ${this._first ? "from before this setup" : "in this setup"}:</p>
      ${t.length === 0 ? E`<p class="muted">Nothing changed.</p>` : E`<ul>${t.map((e) => E`<li>${e}</li>`)}</ul>`}
      <p class="muted small">
        Everything can be changed again in Settings, step by step or in the full forms.
      </p>
    `;
	}
	_renderStep(e) {
		let t = this._currentSpeaker();
		switch (this._step) {
			case "welcome": return this._renderWelcome(e);
			case "pet": return this._renderPet(e);
			case "phone": return this._renderPhone(e);
			case "phone_detail": return this._renderPhoneDetail(e);
			case "quiet": return this._renderQuiet(e);
			case "nudging": return this._renderNudging(e);
			case "lights": return this._renderLights(e);
			case "lights_detail": return this._renderLightDetail(e);
			case "speaker_gate": return this._renderGate();
			case "spk_pick": return this._renderSpkPick(e);
			case "spk_ding": return t ? this._soundBlock("cue", t, "A short, friendly sound, the gentlest reminder.", "cue") : this._noSpeaker();
			case "spk_speech": return t ? this._renderSpkSpeech(t, e) : this._noSpeaker();
			case "spk_alarm": return t ? this._soundBlock("alarm", t, "A loud sound that repeats for a while, for when a step keeps being ignored.", "alarm") : this._noSpeaker();
			case "spk_when": return t ? this._renderSpkWhen(t) : this._noSpeaker();
			case "alarm_devices": return this._renderAlarmDevices(e);
			case "alarm_detail": return this._renderAlarmDetail(e);
			case "presence": return this._renderPresence(e);
			case "chores": return this._renderChores();
			default: return this._renderDone(e);
		}
	}
	render() {
		let e = this._draft;
		if (!e) return E`<p class="muted">Loading…</p>`;
		let t = this._step, n = t === "done", r = t === "speaker_gate", i = this._steps.length - 1;
		return E`
      <div class="shell">
        <nav class="rail" aria-label="Steps">
          <div class="rail-title">${Rt[this.wizard]}</div>
          ${this._steps.map((e, t) => E`<button
              type="button"
              class="rail-item ${t === this._index ? "current" : ""} ${t < this._index ? "past" : ""}"
              ?disabled=${t >= this._index}
              @click=${() => this._jump(t)}
            >
              <span class="mark">${t < this._index ? "✓" : t + 1}</span>
              <span>${zt[e]}</span>
            </button>`)}
        </nav>
        <section class="card main">
          <div class="top">
            <span class="muted small">Step ${this._index + 1} of ${this._steps.length}</span>
            ${n && this._first ? O : E`<button type="button" class="link" ?disabled=${this._busy} @click=${() => this._leave()}>
                  ${this._first ? "Skip for now" : "Close"}
                </button>`}
          </div>
          <div class="bar"><div class="fill" style="width:${(this._index + 1) / this._steps.length * 100}%"></div></div>
          <h2>${zt[t]}</h2>
          ${Bt.includes(t) ? E`<div class="muted small optional">Optional details. Skip if the defaults are fine.</div>` : O}
          ${this._renderStep(e)}
          ${this._error ? E`<div class="error">${this._error}</div>` : O}
          <div class="actions">
            ${this._index > 0 ? E`<button type="button" ?disabled=${this._busy} @click=${() => this._go(-1)}>Back</button>` : O}
            <span class="spacer"></span>
            ${n ? E`<button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._finish()}>
                  ${this._first ? "Finish" : "Save and close"}
                </button>` : r ? O : E`<button type="button" ?disabled=${this._busy} @click=${() => this._go(1, "skip")}>Skip</button>
                    <button type="button" class="primary" ?disabled=${this._busy || this._index >= i} @click=${() => this._go(1)}>Next</button>`}
          </div>
        </section>
      </div>
    `;
	}
	static {
		this.styles = [K, o`
      .shell {
        display: grid;
        grid-template-columns: 240px minmax(0, 1fr);
        gap: 24px;
        align-items: start;
      }
      .rail {
        position: sticky;
        top: 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .rail-title {
        font-size: 13px;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 0 0 8px 8px;
      }
      .rail-item {
        display: flex;
        align-items: center;
        gap: 10px;
        text-align: left;
        border: 0;
        background: none;
        border-radius: 10px;
        padding: 8px 10px;
        min-height: 0;
        color: var(--secondary-text-color);
      }
      .rail-item.current {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
        font-weight: 500;
      }
      .rail-item.past {
        color: var(--primary-text-color);
        cursor: pointer;
      }
      .rail-item:disabled {
        opacity: 1;
        cursor: default;
      }
      .rail-item.past:disabled {
        cursor: default;
      }
      .mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        flex: 0 0 24px;
        border-radius: 50%;
        border: 1px solid var(--divider-color);
        font-size: 12px;
      }
      .past .mark {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }
      .main {
        padding: 24px;
        min-width: 0;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .link {
        border: 0;
        background: none;
        color: var(--secondary-text-color);
        text-decoration: underline;
        min-height: 0;
        padding: 4px 6px;
      }
      .bar {
        height: 6px;
        border-radius: 999px;
        background: var(--secondary-background-color);
        overflow: hidden;
        margin-bottom: 18px;
      }
      .fill {
        height: 100%;
        background: var(--primary-color);
        transition: width 0.3s ease;
      }
      h2 {
        font-size: 22px;
        margin-bottom: 10px;
      }
      p {
        margin: 10px 0;
        line-height: 1.5;
        max-width: 760px;
      }
      .small {
        font-size: 13px;
      }
      .optional {
        margin-bottom: 8px;
      }
      .field {
        margin: 14px 0;
        max-width: 420px;
      }
      .list {
        display: flex;
        flex-direction: column;
      }
      .list.grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 10px;
        margin-top: 6px;
        align-items: start;
      }
      .choice {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        margin: 4px 0;
      }
      .list.grid .choice {
        margin: 0;
      }
      .choice.col {
        flex-direction: column;
        align-items: stretch;
      }
      .choice .inline {
        flex: 1;
        min-width: 160px;
      }
      .choice select.grow,
      .grow {
        flex: 1;
        min-width: 0;
      }
      .radios {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-left: 28px;
      }
      .note {
        flex-basis: 100%;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 15px;
        color: var(--primary-text-color);
        margin: 0;
      }
      label.inline.small {
        font-size: 14px;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      label.option {
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        margin: 6px 0;
        max-width: 760px;
      }
      label.card-choice {
        margin: 0;
        max-width: none;
      }
      label.num {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        margin: 0;
      }
      label.num.wide {
        max-width: 560px;
      }
      .fields {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 12px 0;
        max-width: 560px;
      }
      .swatch {
        width: 56px;
        min-height: 36px;
        padding: 2px;
      }
      code {
        background: var(--secondary-background-color);
        padding: 1px 5px;
        border-radius: 5px;
      }
      a {
        color: var(--primary-color);
      }
      .days {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin: 12px 0;
      }
      .dayrow {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        max-width: 760px;
      }
      .dayname {
        width: 40px;
        font-weight: 500;
      }
      .dayrow input[type="time"] {
        width: 130px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      input.short {
        width: 84px;
      }
      .gate {
        display: flex;
        gap: 12px;
        margin-top: 16px;
      }
      button.big {
        min-height: 52px;
        padding: 0 24px;
        font-size: 16px;
      }
      .actions {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 24px;
      }
      .actions.inline-actions {
        margin-top: 8px;
      }
      .actions button {
        min-width: 84px;
        min-height: 46px;
      }
      .spacer {
        flex: 1;
      }
      ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      li {
        margin: 6px 0;
      }
      @media (max-width: 860px) {
        .shell {
          grid-template-columns: minmax(0, 1fr);
        }
        .rail {
          display: none;
        }
      }
    `];
	}
};
customElements.define("boopli-wizard", qt);
// src/boopli-panel.ts
var Jt = {
	today: "Today",
	chores: "Chores",
	settings: "Settings"
}, Yt = class extends F {
	static {
		this.properties = {
			hass: { attribute: !1 },
			narrow: { type: Boolean },
			_snapshot: { state: !0 },
			_tab: { state: !0 },
			_nowMs: { state: !0 },
			_connectionError: { state: !0 },
			_wizard: { state: !0 },
			_dirty: { state: !0 },
			_confirm: { state: !0 }
		};
	}
	constructor() {
		super(), this._subscribing = !1, this._autoChecked = !1, this._onDirty = (e) => {
			let { source: t, dirty: n } = e.detail;
			this._dirty = {
				...this._dirty,
				[t]: n
			};
		}, this._beforeUnload = (e) => {
			this._hasUnsaved && (e.preventDefault(), e.returnValue = "");
		}, this._onOpenWizard = async (e) => {
			let t = e.detail ?? {}, n = t.wizard ?? "first";
			if (!await this._guard()) return;
			let r = this._snapshot?.setup;
			this._openWizard({
				wizard: n,
				startAt: t.startAt ?? (n === "first" && r && (r.status === "skipped" || r.status === "in_progress") ? r.step : "")
			});
		}, this.narrow = !1, this._tab = "today", this._nowMs = Date.now(), this._connectionError = "", this._wizard = null, this._dirty = {
			settings: !1,
			chore: !1
		}, this._confirm = null;
	}
	get _hasUnsaved() {
		return this._dirty.settings || this._dirty.chore;
	}
	_editable() {
		let e = this._tab === "settings" ? "boopli-settings" : this._tab === "chores" ? "boopli-chores" : "";
		return e ? this.renderRoot.querySelector(e) : null;
	}
	async _guard() {
		if (!this._hasUnsaved) return !0;
		let e = await new Promise((e) => {
			this._confirm = e;
		});
		if (this._confirm = null, e === "stay") return !1;
		let t = this._editable();
		if (e === "save") {
			if (!(await t?.save?.() ?? !1)) return !1;
		} else t?.discard?.();
		return this._dirty = {
			settings: !1,
			chore: !1
		}, !0;
	}
	async _selectTab(e) {
		(e !== this._tab || this._wizard) && await this._guard() && (this._wizard = null, this._tab = e);
	}
	_openWizard(e) {
		this._wizard = e, this.hass && e.wizard === "first" && L(this.hass, "in_progress", e.startAt).catch(() => void 0);
	}
	connectedCallback() {
		super.connectedCallback(), this._timer = window.setInterval(() => this._nowMs = Date.now(), 3e4), window.addEventListener("beforeunload", this._beforeUnload);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearInterval(this._timer), window.removeEventListener("beforeunload", this._beforeUnload), this._unsub?.(), this._unsub = void 0, this._subscribing = !1;
	}
	updated() {
		this.hass && !this._unsub && !this._subscribing && (this._subscribing = !0, Ae(this.hass, (e) => {
			this._snapshot = e, this._nowMs = Date.now(), this._connectionError = "", this._autoChecked || (this._autoChecked = !0, e.setup?.status === "new" && this._openWizard({
				wizard: "first",
				startAt: ""
			}));
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
	_renderConfirm() {
		if (!this._confirm) return O;
		let e = (e) => () => this._confirm?.(e);
		return E`<div class="backdrop" role="dialog" aria-modal="true" aria-label="Unsaved changes">
      <div class="card dialog">
        <h2>You have unsaved changes</h2>
        <p class="muted">Leave without saving and they are lost.</p>
        <div class="dialog-actions">
          <button class="primary" @click=${e("save")}>Save</button>
          <button class="danger" @click=${e("discard")}>Discard</button>
          <button @click=${e("stay")}>Stay</button>
        </div>
      </div>
    </div>`;
	}
	render() {
		let e = {
			today: !1,
			chores: this._dirty.chore,
			settings: this._dirty.settings
		};
		return E`
      <header>
        ${this.narrow ? E`<button class="menu" aria-label="Open sidebar" @click=${this._toggleSidebar}>☰</button>` : O}
        <h1>Boopli</h1>
        <nav>
          ${Object.keys(Jt).map((t) => E`<button
              class="tab ${this._tab === t && !this._wizard ? "on" : ""}"
              @click=${() => this._selectTab(t)}
            >
              ${Jt[t]}
              ${e[t] ? E`<span class="dot" title="Unsaved changes" aria-label="Unsaved changes"></span>` : O}
            </button>`)}
        </nav>
      </header>
      <main @open-wizard=${this._onOpenWizard} @dirty-change=${this._onDirty}>
        ${this._connectionError ? E`<p class="error">${this._connectionError}</p>` : this._wizard ? E`<boopli-wizard
                .hass=${this.hass}
                .snapshot=${this._snapshot}
                .wizard=${this._wizard.wizard}
                .startAt=${this._wizard.startAt}
                @wizard-close=${() => this._wizard = null}
              ></boopli-wizard>` : this._tab === "today" ? E`<boopli-today .hass=${this.hass} .snapshot=${this._snapshot} .nowMs=${this._nowMs}></boopli-today>` : this._tab === "chores" ? E`<boopli-chores .hass=${this.hass} .snapshot=${this._snapshot} .nowMs=${this._nowMs}></boopli-chores>` : E`<boopli-settings .hass=${this.hass} .snapshot=${this._snapshot}></boopli-settings>`}
      </main>
      ${this._renderConfirm()}
    `;
	}
	static {
		this.styles = [K, o`
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
        position: relative;
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
      .dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        margin-left: 6px;
        border-radius: 50%;
        background: var(--warning-color, #ffa600);
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.25);
      }
      main {
        padding: 20px 24px 64px;
      }
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        padding: 16px;
      }
      .dialog {
        max-width: 420px;
        width: 100%;
        padding: 20px;
      }
      .dialog-actions {
        display: flex;
        gap: 10px;
        margin-top: 16px;
        flex-wrap: wrap;
      }
    `];
	}
};
customElements.define("boopli-panel", Yt);
export { Yt as BoopliPanel };

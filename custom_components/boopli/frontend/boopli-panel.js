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
var g = globalThis, ce = (e) => e, _ = g.trustedTypes, le = _ ? _.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, ue = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, de = "?" + v, fe = `<${de}>`, y = document, b = () => y.createComment(""), x = (e) => e === null || typeof e != "object" && typeof e != "function", pe = Array.isArray, me = (e) => pe(e) || typeof e?.[Symbol.iterator] == "function", he = "[ 	\n\f\r]", S = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ge = /-->/g, _e = />/g, C = RegExp(`>|${he}(?:([^\\s"'>=/]+)(${he}*=${he}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), ve = /'/g, ye = /"/g, be = /^(?:script|style|textarea|title)$/i, w = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), T = Symbol.for("lit-noChange"), E = Symbol.for("lit-nothing"), xe = /* @__PURE__ */ new WeakMap(), D = y.createTreeWalker(y, 129);
function Se(e, t) {
	if (!pe(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return le === void 0 ? t : le.createHTML(t);
}
var Ce = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = S;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === S ? c[1] === "!--" ? o = ge : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = C) : (be.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = C) : o = _e : o === C ? c[0] === ">" ? (o = i ?? S, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? C : c[3] === "\"" ? ye : ve) : o === ye || o === ve ? o = C : o === ge || o === _e ? o = S : (o = C, i = void 0);
		let d = o === C && e[t + 1].startsWith("/>") ? " " : "";
		a += o === S ? n + fe : l >= 0 ? (r.push(s), n.slice(0, l) + ue + n.slice(l) + v + d) : n + v + (l === -2 ? t : d);
	}
	return [Se(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, we = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = Ce(t, n);
		if (this.el = e.createElement(l, r), D.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = D.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(ue)) {
					let t = u[o++], n = i.getAttribute(e).split(v), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? De : r[1] === "?" ? Oe : r[1] === "@" ? ke : k
					}), i.removeAttribute(e);
				} else e.startsWith(v) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (be.test(i.tagName)) {
					let e = i.textContent.split(v), t = e.length - 1;
					if (t > 0) {
						i.textContent = _ ? _.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], b()), D.nextNode(), c.push({
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
function O(e, t, n = e, r) {
	if (t === T) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = x(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = O(e, i._$AS(e, t.values), i, r)), t;
}
var Te = class {
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
		D.currentNode = r;
		let i = D.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new Ee(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Ae(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = D.nextNode(), a++);
		}
		return D.currentNode = y, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, Ee = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = E, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = O(this, e, t), x(e) ? e === E || e == null || e === "" ? (this._$AH !== E && this._$AR(), this._$AH = E) : e !== this._$AH && e !== T && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? me(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== E && x(this._$AH) ? this._$AA.nextSibling.data = e : this.T(y.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = we.createElement(Se(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Te(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = xe.get(e.strings);
		return t === void 0 && xe.set(e.strings, t = new we(e)), t;
	}
	k(t) {
		pe(this._$AH) || (this._$AH = [], this._$AR());
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
}, k = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = E, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = E;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = O(this, e, t, 0), a = !x(e) || e !== this._$AH && e !== T, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = O(this, r[n + o], t, o), s === T && (s = this._$AH[o]), a ||= !x(s) || s !== this._$AH[o], s === E ? e = E : e !== E && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === E ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, De = class extends k {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === E ? void 0 : e;
	}
}, Oe = class extends k {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== E);
	}
}, ke = class extends k {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = O(this, e, t, 0) ?? E) === T) return;
		let n = this._$AH, r = e === E && n !== E || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== E && (n === E || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Ae = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		O(this, e);
	}
}, je = g.litHtmlPolyfillSupport;
je?.(we, Ee), (g.litHtmlVersions ??= []).push("3.3.3");
var Me = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new Ee(t.insertBefore(b(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Ne = globalThis, A = class extends h {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Me(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return T;
	}
};
A._$litElement$ = !0, A.finalized = !0, Ne.litElementHydrateSupport?.({ LitElement: A });
var Pe = Ne.litElementPolyfillSupport;
Pe?.({ LitElement: A }), (Ne.litElementVersions ??= []).push("4.2.2");
// src/api.ts
function j(e, t) {
	return e.callWS({
		type: "boopli/settings_save",
		settings: t
	});
}
function Fe(e, t, n, r, i = "", a) {
	return e.callWS({
		type: "boopli/ai_questions",
		task: t,
		kind: n,
		answers: r,
		notes: i,
		...a ? { rooms: a } : {}
	});
}
function M(e, t, n, r, i = "", a) {
	return e.callWS({
		type: "boopli/ai_steps",
		task: t,
		kind: n,
		answers: r,
		notes: i,
		...a ? { rooms: a } : {}
	});
}
function Ie(e, t, n, r, i, a) {
	return e.callWS({
		type: "boopli/ai_preview",
		task: t,
		kind: n,
		answers: r,
		notes: i,
		rooms: a
	});
}
async function Le(e, t) {
	return (await e.callWS({
		type: "boopli/rooms_guess",
		task: t
	})).rooms;
}
function Re(e, t) {
	return e.callWS({
		type: "boopli/home_save",
		home: t
	});
}
function ze(e) {
	return e.callWS({ type: "boopli/home_sync" });
}
function Be(e, t, n, r) {
	return e.callWS({
		type: "boopli/room_questions",
		room: t,
		notes: n,
		answers: r
	});
}
function Ve(e, t, n, r) {
	return e.callWS({
		type: "boopli/room_notes",
		room: t,
		notes: n,
		answers: r
	});
}
function He(e) {
	return e.callWS({ type: "boopli/ai_defaults" });
}
function Ue(e, t, n, r = "") {
	return e.callWS({
		type: "boopli/task_add",
		title: t,
		steps: n,
		notes: r
	});
}
async function We(e, t, n = 5) {
	return (await e.callWS({
		type: "boopli/schedule_preview",
		repeat: t,
		count: n
	})).times;
}
function N(e, t, n = "") {
	return e.callWS({
		type: "boopli/setup_save",
		status: t,
		step: n
	});
}
function P(e, t) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "light",
		light: t
	});
}
function F(e, t) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "phone",
		phone: t
	});
}
function I(e, t, n) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "speaker",
		speaker: t,
		level: n
	});
}
function L(e, t) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "alarm_device",
		alarm_device: t
	});
}
function Ge(e, t) {
	return e.connection.subscribeMessage(t, { type: "boopli/subscribe" });
}
function R(e, t) {
	return e.callWS({
		type: "boopli/chore_save",
		chore: t
	});
}
function Ke(e, t) {
	return e.callWS({
		type: "boopli/chore_delete",
		chore_id: t
	});
}
function qe(e, t) {
	return e.callWS({
		type: "boopli/chore_start",
		chore_id: t
	});
}
function Je(e, t, n) {
	return e.callWS({
		type: "boopli/step_complete",
		run_id: t,
		step_id: n
	});
}
function z(e) {
	return e && typeof e == "object" && "message" in e ? String(e.message) : "Something went wrong.";
}
function Ye(e, t, n, r) {
	return e.callWS({
		type: "boopli/room_photos",
		room: t,
		notes: n,
		photos: r
	});
}
async function Xe(e, t, n = "", r = "", i) {
	return (await e.callWS({
		type: "boopli/chat_prompt",
		room: n,
		notes: r,
		include_notes: t,
		...i ? { rooms: i } : {}
	})).prompt;
}
function Ze(e, t) {
	return e.callWS({
		type: "boopli/paste_notes",
		text: t
	});
}
async function Qe(e, t, n) {
	return (await e.callWS({
		type: "boopli/paste_notes",
		text: t,
		whole_home: !0,
		rooms: n
	})).rooms;
}
// src/time.ts
var B = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun"
], V = B;
function H(e, t) {
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: t,
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).format(new Date(e));
}
function U(e, t) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: t,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(e);
}
function $e(e) {
	let [t, n, r] = e.split("-").map(Number);
	return Math.round(Date.UTC(t, n - 1, r) / 864e5);
}
function et(e, t, n) {
	let r = new Date(e), i = $e(U(r, n)) - $e(U(new Date(t), n)), a = H(e, n);
	return i === 0 ? `today ${a}` : i === 1 ? `tomorrow ${a}` : `${new Intl.DateTimeFormat("en-GB", {
		timeZone: n,
		weekday: "short",
		day: "numeric",
		month: "short"
	}).format(r)}, ${a}`;
}
function tt(e, t, n) {
	return U(new Date(e), n) === U(new Date(t), n);
}
function nt(e) {
	let t = Math.max(0, Math.round(e));
	if (t < 1) return "less than a minute";
	if (t < 60) return `${t} min`;
	let n = Math.floor(t / 60), r = t % 60;
	return r === 0 ? `${n}h` : `${n}h ${r}m`;
}
function rt(e, t) {
	let n = (new Date(e).getTime() - t) / 6e4;
	return n <= .5 ? "any moment now" : `in ${nt(n)}`;
}
function it(e, t) {
	return `since ${H(e, t)}`;
}
function at(e) {
	return e.length <= 2 ? e.join(" and ") : `${e.slice(0, -1).join(", ")} and ${e[e.length - 1]}`;
}
function ot(e) {
	let t = [], n = 0;
	for (; n < 7;) {
		let r = e[String(n)] ?? [];
		if (r.length === 0) {
			n++;
			continue;
		}
		let i = n;
		for (; i + 1 < 7 && (e[String(i + 1)] ?? []).join() === r.join();) i++;
		let a = n === i ? B[n] : i === n + 1 ? `${B[n]} and ${B[i]}` : `${B[n]} to ${B[i]}`;
		t.push(`${a} ${at(r)}`), n = i + 1;
	}
	return t.length ? t.join(", ") : "No days yet";
}
function W(e) {
	switch (e.type) {
		case "none": return "On demand";
		case "schedule": return ot(e.days);
		case "every_n_days": return e.every_n_days === 1 ? `Every day after you finish, at ${e.time}` : `${e.every_n_days} days after you finish, at ${e.time}`;
	}
}
// src/today.ts
function st(e, t) {
	let n = e.time_zone, r = e.runs.flatMap((e) => e.steps.filter((e) => e.status === "active").map((t) => ({
		run: e,
		step: t,
		done: e.steps.filter((e) => e.status === "done").length,
		total: e.steps.length
	}))).sort((e, t) => (e.step.active_at ? Date.parse(e.step.active_at) : Infinity) - (t.step.active_at ? Date.parse(t.step.active_at) : Infinity))[0] ?? null, i = [...e.runs].sort((e, t) => Date.parse(e.started_at) - Date.parse(t.started_at)).map((e) => ({
		run: e,
		steps: e.steps.filter((t) => t.status !== "done" && !(r && r.run.id === e.id && r.step.step_id === t.step_id)).map((e) => {
			let n = "";
			return e.status === "active" ? n = "ready now" : e.status === "waiting" && e.active_at ? n = rt(e.active_at, t) : e.wait_minutes > 0 && (n = `${nt(e.wait_minutes)} after the step before`), {
				title: e.title,
				status: e.status,
				hint: n
			};
		})
	})).filter((e) => e.steps.length > 0), a = new Set(e.runs.map((e) => e.chore_id));
	return {
		now: r,
		groups: i,
		dueToday: e.chores.filter((e) => e.enabled && e.next_due !== null && !a.has(e.id) && tt(e.next_due, t, n)).map((e) => ({
			chore: e,
			at: e.next_due
		})).sort((e, t) => Date.parse(e.at) - Date.parse(t.at))
	};
}
// src/styles.ts
var G = o`
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
`, ct = {
	happy: "✨",
	content: "",
	sleepy: "💤",
	sad: "💧",
	hibernating: "🌙💤"
}, lt = class extends A {
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
		return w`<span class="bear" aria-hidden="true">🐻</span>
      <span class="badge" aria-hidden="true">${ct[this.mood]}</span>`;
	}
	render() {
		return w`<div class="pet ${this.mood}" role="img" aria-label="Your pet is ${this.mood}">
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
customElements.define("boopli-pet", lt);
// src/boopli-today.ts
function ut(e) {
	return {
		happy: "Nice, you got things done today.",
		content: "Ready when you are.",
		sleepy: `${e.name} is a bit sleepy.`,
		sad: `${e.name} misses you. One step is enough.`,
		hibernating: `${e.name} is curled up, resting until you are back. One step wakes it.`
	}[e.mood];
}
var dt = class extends A {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			nowMs: { type: Number },
			_busy: { state: !0 },
			_error: { state: !0 },
			_toast: { state: !0 },
			_quick: { state: !0 }
		};
	}
	constructor() {
		super(), this._lastRunIds = [], this.nowMs = Date.now(), this._busy = !1, this._error = "", this._toast = "", this._quick = "";
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearTimeout(this._toastTimer);
	}
	willUpdate(e) {
		if (!e.has("snapshot") || !this.snapshot?.pet) return;
		let t = this.snapshot.pet, n = this._lastPet;
		this._lastPet = t;
		let r = this.snapshot.runs.map((e) => e.id), i = this._lastRunIds.filter((e) => !r.includes(e)).map((e) => this.snapshot.history.find((t) => t.kind === "chore_done" && t.run_id === e)?.chore_name).filter((e) => !!e);
		if (this._lastRunIds = r, !n || t.total_xp <= n.total_xp) return;
		let a = [`+${t.total_xp - n.total_xp} XP`];
		i.length && a.unshift(`🎉 ${i[0]} is done!`), t.level > n.level && a.push(`Level ${t.level}!`), (n.mood === "sad" || n.mood === "hibernating") && a.push(`${t.name} is awake. Welcome back!`), this._toast = a.join("  ·  "), window.clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => this._toast = "", 5e3);
	}
	_openBreakdown(e) {
		this.dispatchEvent(new CustomEvent("open-breakdown", {
			detail: {
				kind: e,
				task: this._quick.trim()
			},
			bubbles: !0,
			composed: !0
		})), this._quick = "";
	}
	_renderQuick() {
		return w`
      <section class="card quick">
        <h3>What do you want to get done?</h3>
        ${this.snapshot?.settings.ai?.enabled ? w`
              <textarea
                rows="2"
                placeholder="For example: clean the bathroom"
                .value=${this._quick}
                @input=${(e) => this._quick = e.target.value}
              ></textarea>
              <div class="quick-actions">
                <button class="primary" @click=${() => this._openBreakdown("now")}>✨ Break it down now</button>
                <button @click=${() => this._openBreakdown("recurring")}>🔁 Break down a recurring chore</button>
              </div>
            ` : w`
              <p class="muted small">
                Boopli can split a big task into tiny steps with your own AI agent. It is switched off until you set it up.
              </p>
              <button
                @click=${() => this.dispatchEvent(new CustomEvent("open-wizard", {
			detail: { wizard: "ai" },
			bubbles: !0,
			composed: !0
		}))}
              >
                🤖 Set up AI help
              </button>
            `}
      </section>
    `;
	}
	_renderPet() {
		let e = this.snapshot?.pet;
		if (!e) return E;
		let t = e.xp_for_level > 0 ? Math.round(e.xp_in_level / e.xp_for_level * 100) : 0;
		return w`
      <section class="card pet-card">
        <boopli-pet .mood=${e.mood} .level=${e.level}></boopli-pet>
        <div class="pet-info">
          <div class="pet-name">${e.name} <span class="muted">· Level ${e.level}</span></div>
          <div class="bar" role="progressbar" aria-valuenow=${t} aria-valuemin="0" aria-valuemax="100">
            <div class="fill" style="width:${t}%"></div>
          </div>
          <div class="muted small">${e.xp_in_level} / ${e.xp_for_level} XP to the next level</div>
          <div class="small">${ut(e)}</div>
        </div>
      </section>
      ${this._toast ? w`<div class="toast" role="status">${this._toast}</div>` : E}
    `;
	}
	async _done(e, t) {
		if (this.hass && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				await Je(this.hass, e, t);
			} catch (e) {
				this._error = z(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderAuto() {
		let e = this.snapshot;
		if (!e) return E;
		let t = this.nowMs - 864e5, n = e.history.filter((e) => e.kind === "step_done" && e.by === "auto" && Date.parse(e.ts) >= t).slice(-3).reverse();
		return n.length === 0 ? E : w`
      <section class="auto dim">
        <h3>Done by itself</h3>
        ${n.map((t) => w`<div class="row">
            <span>✓ ${t.chore_name}: ${t.step_title}</span>
            <span class="hint">${t.reason ? `${t.reason}, ` : ""}${H(t.ts, e.time_zone)}</span>
          </div>`)}
      </section>
    `;
	}
	render() {
		if (!this.snapshot) return w`<p class="muted">Loading…</p>`;
		let e = this.snapshot.time_zone, t = st(this.snapshot, this.nowMs), n = this.snapshot.chores.length > 0, r = this.snapshot.setup?.status;
		return w`
      <div class="cols"><div class="col">
      ${r === "skipped" || r === "in_progress" ? w`<section class="card banner">
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
          </section>` : E}
      ${this._renderPet()}
      ${t.now ? w`
            <section class="card now">
              <div class="muted small">
                ${t.now.run.chore_name}
                ${t.now.step.group ? w`<span class="tag">${t.now.step.group}</span>` : E}
              </div>
              <h2>${t.now.step.title}</h2>
              ${t.now.total > 1 ? w`<div class="progress">
                    <div class="bar" role="progressbar" aria-valuenow=${t.now.done} aria-valuemin="0" aria-valuemax=${t.now.total}>
                      <div class="fill" style="width:${t.now.done / t.now.total * 100}%"></div>
                    </div>
                    <div class="muted small">Step ${t.now.done + 1} of ${t.now.total}</div>
                  </div>` : E}
              ${t.now.step.active_at ? w`<div class="muted small">
                    ${it(t.now.step.active_at, e)}
                  </div>` : E}
              ${t.now.step.snoozed_until && Date.parse(t.now.step.snoozed_until) > this.nowMs ? w`<div class="muted small">
                    Snoozed until ${H(t.now.step.snoozed_until, e)}
                  </div>` : E}
              <button
                class="primary done"
                ?disabled=${this._busy}
                @click=${() => this._done(t.now.run.id, t.now.step.step_id)}
              >
                Done
              </button>
              ${this._error ? w`<div class="error">${this._error}</div>` : E}
            </section>
          ` : w`
            <section class="card empty">
              <h2>Nothing needs you right now</h2>
              <p class="muted">
                ${n ? "Enjoy the quiet. What is coming up shows below." : "Add your first chore in the Chores tab."}
              </p>
            </section>
          `}
      ${this._renderQuick()}
      </div><div class="col">
      ${this._renderAuto()}
      ${t.groups.length > 0 || t.dueToday.length > 0 ? w`
            <section class="later dim">
              <h3>Still to do today</h3>
              ${t.groups.map((e) => w`
                  <div class="group">
                    <div class="group-name">${e.run.chore_name}</div>
                    ${e.steps.map((e) => w`
                        <div class="row">
                          <span>${e.title}</span>
                          <span class="hint">${e.hint}</span>
                        </div>
                      `)}
                  </div>
                `)}
              ${t.dueToday.map((t) => w`
                  <div class="group">
                    <div class="row">
                      <span class="group-name">${t.chore.name}</span>
                      <span class="hint">at ${H(t.at, e)}</span>
                    </div>
                  </div>
                `)}
            </section>
          ` : E}
      </div></div>
    `;
	}
	static {
		this.styles = [G, o`
      .small {
        font-size: 14px;
      }
      .quick h3 {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 10px;
      }
      .quick textarea {
        font: inherit;
        width: 100%;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        resize: vertical;
      }
      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .tag {
        margin-left: 6px;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 12px;
        background: var(--secondary-background-color);
        color: var(--primary-color);
      }
      .progress {
        margin: 6px 0 0;
      }
      .progress .bar {
        margin: 4px 0;
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
customElements.define("boopli-today", dt);
// src/boopli-triggers.ts
var ft = {
	binary_sensor: ["on", "off"],
	switch: ["on", "off"],
	input_boolean: ["on", "off"],
	light: ["on", "off"],
	cover: ["open", "closed"],
	lock: ["locked", "unlocked"],
	person: ["home", "not_home"],
	device_tracker: ["home", "not_home"]
}, pt = [
	"event",
	"input_button",
	"button"
];
function mt(e) {
	return e.state ? "state" : e.above !== null && e.below !== null ? "between" : e.below === null ? e.above === null ? "state" : "above" : "below";
}
function ht(e) {
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
var gt = class extends A {
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
		this._emit([...this.triggers, ht(e)]);
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
				this._scanning = -1, this._note = `Scanning did not start (${z(e)}). Pick the tag from the list instead.`;
			}
		}
	}
	_renderState(e, t) {
		let n = e.entity_id.split(".")[0], r = this.hass?.states[e.entity_id], i = ft[n] ?? [], a = mt(e);
		return w`
      <div class="field">
        <label>Which entity?</label>
        <input
          list="states-list"
          placeholder="Start typing a name, for example door"
          .value=${e.entity_id}
          @change=${(e) => this._patch(t, { entity_id: e.target.value.trim() })}
        />
        ${e.entity_id ? r ? w`<div class="muted small">
                ${this._friendly(e.entity_id)}: now <b>${r.state}</b>
              </div>` : w`<div class="warn small">Not found right now. Check the name.</div>` : E}
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
      ${a === "state" ? w`<div class="field">
            <label>State</label>
            <input
              placeholder="for example on, off, open"
              .value=${e.state}
              @input=${(e) => this._patch(t, { state: e.target.value })}
            />
            <div class="chips">
              ${i.map((n) => w`<button
                  type="button"
                  class="chip ${e.state === n ? "on" : ""}"
                  @click=${() => this._patch(t, { state: n })}
                >
                  ${n}
                </button>`)}
              ${r && !i.includes(r.state) ? w`<button
                    type="button"
                    class="chip"
                    @click=${() => this._patch(t, { state: r.state })}
                  >
                    now: ${r.state}
                  </button>` : E}
            </div>
          </div>` : w`<div class="row2">
            ${a === "above" || a === "between" ? w`<div>
                  <label>Above</label>
                  <input
                    type="number"
                    step="any"
                    .value=${e.above === null ? "" : String(e.above)}
                    @input=${(e) => this._patch(t, { above: this._numberOrNull(e.target.value) })}
                  />
                </div>` : E}
            ${a === "below" || a === "between" ? w`<div>
                  <label>Below</label>
                  <input
                    type="number"
                    step="any"
                    .value=${e.below === null ? "" : String(e.below)}
                    @input=${(e) => this._patch(t, { below: this._numberOrNull(e.target.value) })}
                  />
                </div>` : E}
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
		return w`
      <div class="field">
        <label>Which NFC tag?</label>
        <div class="scan">
          <select
            @change=${(e) => this._patch(t, { tag_id: e.target.value })}
          >
            <option value="" .selected=${!e.tag_id}>Pick a tag…</option>
            ${this._tags.map((t) => w`<option value=${t.tag_id} .selected=${t.tag_id === e.tag_id}>
                ${t.name || t.tag_id}
              </option>`)}
            ${e.tag_id && !n ? w`<option value=${e.tag_id} .selected=${!0}>${e.tag_id}</option>` : E}
          </select>
          ${this._scanning === t ? w`<button type="button" @click=${() => this._cancelScan()}>Cancel</button>` : w`<button type="button" @click=${() => this._scan(t)}>Scan now</button>`}
        </div>
        ${this._scanning === t ? w`<div class="muted small">Hold your phone to the tag now…</div>` : E}
      </div>
    `;
	}
	_renderButton(e, t) {
		let n = this.hass?.states[e.entity_id], r = n?.attributes?.event_types;
		return w`
      <div class="field">
        <label>Which button?</label>
        <input
          list="buttons-list"
          placeholder="Start typing a name, for example button"
          .value=${e.entity_id}
          @change=${(e) => this._patch(t, { entity_id: e.target.value.trim() })}
        />
        ${e.entity_id && !n ? w`<div class="warn small">Not found right now. Check the name.</div>` : E}
      </div>
      <div class="field">
        <label>Only this kind of press (empty = any press)</label>
        <input
          placeholder="for example single or double"
          .value=${e.press}
          @input=${(e) => this._patch(t, { press: e.target.value })}
        />
        ${Array.isArray(r) && r.length ? w`<div class="chips">
              ${r.map((n) => w`<button
                  type="button"
                  class="chip ${e.press === n ? "on" : ""}"
                  @click=${() => this._patch(t, { press: n })}
                >
                  ${String(n)}
                </button>`)}
            </div>` : E}
      </div>
    `;
	}
	_title(e) {
		return e.kind === "tag" ? "An NFC tag is scanned" : e.kind === "button" ? "A button is pressed" : "An entity changes";
	}
	render() {
		return w`
      <datalist id="states-list">
        ${this._entityIds().map((e) => w`<option value=${e}>${this._friendly(e)}</option>`)}
      </datalist>
      <datalist id="buttons-list">
        ${this._entityIds(pt).map((e) => w`<option value=${e}>${this._friendly(e)}</option>`)}
      </datalist>
      ${this.triggers.length === 0 ? w`<div class="muted small">
            Nothing yet: only you finish this step (with Done). Add one below to let it finish by
            itself.
          </div>` : this.triggers.map((e, t) => w`
              ${t > 0 ? w`<div class="or muted small">or</div>` : E}
              <div class="trigger">
                <div class="trigger-head">
                  <b>${this._title(e)}</b>
                  <button type="button" aria-label="Remove" @click=${() => this._remove(t)}>✕</button>
                </div>
                ${e.kind === "tag" ? this._renderTag(e, t) : e.kind === "button" ? this._renderButton(e, t) : this._renderState(e, t)}
              </div>
            `)}
      ${this._note ? w`<div class="warn small">${this._note}</div>` : E}
      <div class="chips add">
        <button type="button" @click=${() => this._add("state")}>+ An entity changes</button>
        <button type="button" @click=${() => this._add("tag")}>+ NFC tag</button>
        <button type="button" @click=${() => this._add("button")}>+ Button</button>
      </div>
    `;
	}
	static {
		this.styles = [G, o`
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
customElements.define("boopli-triggers", gt);
// src/boopli-schedule-days.ts
var _t = [
	0,
	1,
	2,
	3,
	4,
	5,
	6
], vt = 6;
function yt(e) {
	if (e.length === 0) return "09:00";
	let [t, n] = e[e.length - 1].split(":").map(Number);
	return `${String(Math.min(23, (t || 0) + 4)).padStart(2, "0")}:${String(n || 0).padStart(2, "0")}`;
}
var bt = class extends A {
	static {
		this.properties = {
			days: { attribute: !1 },
			onlyActive: { type: Boolean }
		};
	}
	constructor() {
		super(), this.days = {}, this.onlyActive = !1;
	}
	_emit(e) {
		let t = Object.fromEntries(Object.entries(e).filter(([, e]) => e.length > 0));
		this.dispatchEvent(new CustomEvent("days-change", {
			detail: t,
			bubbles: !0,
			composed: !0
		}));
	}
	_times(e) {
		return this.days[String(e)] ?? [];
	}
	_setDay(e, t) {
		this._emit({
			...this.days,
			[String(e)]: t
		});
	}
	_setTime(e, t, n) {
		n && this._setDay(e, this._times(e).map((e, r) => r === t ? n : e));
	}
	_shownDays() {
		return this.onlyActive ? _t.filter((e) => this._times(e).length > 0) : _t;
	}
	render() {
		let e = this._shownDays();
		return w`
      <div class="rows">
        ${e.map((t, n) => {
			let r = this._times(t), i = n > 0 ? e[n - 1] : null, a = r.length > 0;
			return w`<div class="row ${a ? "" : "off"}">
            <span class="dayname">${V[t]}</span>
            ${this.onlyActive ? E : w`<label class="inline small">
                  <input
                    type="checkbox"
                    .checked=${a}
                    @change=${(e) => this._setDay(t, e.target.checked ? [yt([])] : [])}
                  />
                  Runs
                </label>`}
            ${a ? w`<div class="times">
                  ${r.map((e, n) => w`<span class="time">
                      <input
                        type="time"
                        aria-label="${V[t]} time ${n + 1}"
                        .value=${e}
                        @change=${(e) => this._setTime(t, n, e.target.value)}
                      />
                      ${r.length > 1 ? w`<button
                            type="button"
                            class="x"
                            aria-label="Remove this time"
                            @click=${() => this._setDay(t, r.filter((e, t) => t !== n))}
                          >
                            ✕
                          </button>` : E}
                    </span>`)}
                  ${r.length < vt ? w`<button type="button" class="chip" @click=${() => this._setDay(t, [...r, yt(r)])}>+ time</button>` : E}
                </div>` : w`<span class="muted small">No run this day</span>`}
            ${i === null ? E : w`<button
                  type="button"
                  class="chip same"
                  @click=${() => this._setDay(t, [...this._times(i)])}
                >
                  Same as ${V[i]}
                </button>`}
          </div>`;
		})}
      </div>
    `;
	}
	static {
		this.styles = [G, o`
      .rows {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
      }
      .row.off {
        opacity: 0.75;
      }
      .dayname {
        width: 40px;
        font-weight: 500;
      }
      .times {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .time {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .time input {
        width: 130px;
      }
      .x {
        padding: 2px 8px;
        min-height: 32px;
      }
      .small {
        font-size: 13px;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--primary-text-color);
        margin: 0;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      .same {
        margin-left: auto;
      }
    `];
	}
};
customElements.define("boopli-schedule-days", bt);
// src/boopli-schedule-wizard.ts
var xt = {
	none: ["how", "done"],
	schedule: [
		"how",
		"days",
		"times",
		"preview",
		"done"
	],
	every_n_days: [
		"how",
		"interval",
		"preview",
		"done"
	]
}, St = {
	how: "How often",
	days: "Which days",
	times: "What time on each day",
	interval: "Every how many days",
	preview: "The next runs",
	done: "All set"
}, Ct = [
	{
		value: "none",
		label: "On demand",
		text: "I start it myself, when I want."
	},
	{
		value: "schedule",
		label: "On certain days and times",
		text: "Pick the days. Each day gets its own time, or several (for example pills in the morning and evening)."
	},
	{
		value: "every_n_days",
		label: "Every few days, after I finish",
		text: "It comes back a number of days after you finished it, for example every 90 days for a filter."
	}
], wt = [
	0,
	1,
	2,
	3,
	4,
	5,
	6
], Tt = class extends A {
	static {
		this.properties = {
			hass: { attribute: !1 },
			repeat: { attribute: !1 },
			choreName: { type: String },
			timeZone: { type: String },
			saves: { type: Boolean },
			_draft: { state: !0 },
			_index: { state: !0 },
			_preview: { state: !0 },
			_error: { state: !0 },
			_busy: { state: !0 }
		};
	}
	constructor() {
		super(), this.choreName = "", this.timeZone = "UTC", this.saves = !1, this._index = 0, this._preview = null, this._error = "", this._busy = !1;
	}
	willUpdate() {
		!this._draft && this.repeat && (this._before = structuredClone(this.repeat), this._draft = structuredClone(this.repeat));
	}
	get _steps() {
		return xt[this._draft?.type ?? "none"];
	}
	get _step() {
		return this._steps[Math.min(this._index, this._steps.length - 1)];
	}
	_patch(e) {
		this._draft &&= {
			...this._draft,
			...e
		}, this._preview = null, this._error = "";
	}
	_toggleDay(e) {
		if (!this._draft) return;
		let t = { ...this._draft.days };
		(t[String(e)] ?? []).length > 0 ? delete t[String(e)] : t[String(e)] = ["09:00"], this._patch({ days: t });
	}
	_activeDays() {
		return wt.filter((e) => (this._draft?.days[String(e)] ?? []).length > 0);
	}
	async _next() {
		if (!this.hass || !this._draft || this._busy) return;
		if (this._error = "", this._step === "days" && this._activeDays().length === 0) {
			this._error = "Pick at least one day.";
			return;
		}
		let e = this._index + 1;
		if (this._steps[e] === "preview") {
			this._busy = !0;
			try {
				this._preview = await We(this.hass, this._draft, 5);
			} catch (e) {
				this._error = z(e);
				return;
			} finally {
				this._busy = !1;
			}
		}
		this._index = e;
	}
	_back() {
		this._error = "", this._index = Math.max(0, this._index - 1);
	}
	_apply() {
		this._draft && this.dispatchEvent(new CustomEvent("schedule-apply", {
			detail: this._draft,
			bubbles: !0,
			composed: !0
		}));
	}
	_cancel() {
		this.dispatchEvent(new CustomEvent("schedule-cancel", {
			bubbles: !0,
			composed: !0
		}));
	}
	_renderHow(e) {
		return w`
      <p>How often should ${this.choreName ? w`<b>${this.choreName}</b>` : "this chore"} come up?</p>
      ${Ct.map((t) => w`<label class="inline option">
          <input
            type="radio"
            name="how"
            .checked=${e.type === t.value}
            @change=${() => this._patch({ type: t.value })}
          />
          <span><b>${t.label}</b><br /><span class="muted small">${t.text}</span></span>
        </label>`)}
    `;
	}
	_renderDays(e) {
		let t = this._activeDays();
		return w`
      <p>Tap the days it should come up. You set the time for each day in the next step.</p>
      <div class="chips">
        ${wt.map((e) => w`<button
            type="button"
            class="chip big ${t.includes(e) ? "on" : ""}"
            aria-pressed=${t.includes(e)}
            @click=${() => this._toggleDay(e)}
          >
            ${V[e]}
          </button>`)}
      </div>
      <div class="chips quick">
        <button
          type="button"
          class="chip"
          @click=${() => this._patch({ days: Object.fromEntries(wt.map((t) => [String(t), e.days[String(t)]?.length ? e.days[String(t)] : ["09:00"]])) })}
        >
          Every day
        </button>
        <button type="button" class="chip" @click=${() => this._patch({ days: {} })}>Clear</button>
      </div>
    `;
	}
	_renderTimes(e) {
		return w`
      <p>
        What time on each day? A day can have more than one time. "Same as …" copies the day above.
      </p>
      <boopli-schedule-days
        .onlyActive=${!0}
        .days=${e.days}
        @days-change=${(e) => this._patch({ days: e.detail })}
      ></boopli-schedule-days>
    `;
	}
	_renderInterval(e) {
		return w`
      <p>It comes back this many days after you finished it:</p>
      <div class="chips">
        ${[
			2,
			3,
			7,
			14,
			30,
			90
		].map((t) => w`<button type="button" class="chip ${e.every_n_days === t ? "on" : ""}" @click=${() => this._patch({ every_n_days: t })}>${t} days</button>`)}
        <input
          class="short"
          type="number"
          min="1"
          max="365"
          aria-label="Number of days"
          .value=${String(e.every_n_days)}
          @input=${(e) => this._patch({ every_n_days: Number(e.target.value) || 1 })}
        />
      </div>
      <div class="field">
        <label for="time">At what time of day?</label>
        <input
          id="time"
          type="time"
          .value=${e.time}
          @input=${(e) => this._patch({ time: e.target.value })}
        />
      </div>
    `;
	}
	_renderPreview(e) {
		let t = this._preview ?? [], n = Date.now();
		return w`
      <p>
        ${e.type === "every_n_days" ? "The first time, and then every time after you finish:" : "This is when it comes up next:"}
      </p>
      ${t.length === 0 ? w`<p class="muted">Nothing is scheduled.</p>` : w`<ul>${t.map((e) => w`<li>${et(e, n, this.timeZone)}</li>`)}</ul>`}
      ${e.type === "every_n_days" ? w`<p class="muted small">After that: ${e.every_n_days} days after you finish it, at ${e.time}.</p>` : E}
    `;
	}
	_renderDone(e) {
		let t = this._before ? W(this._before) : "", n = W(e), r = JSON.stringify(this._before) === JSON.stringify(e);
		return w`
      <p><b>What changed</b> for ${this.choreName ? w`<b>${this.choreName}</b>` : "this chore"}:</p>
      ${r ? w`<p class="muted">Nothing changed. ${n}.</p>` : w`<ul><li>Schedule: ${t} → ${n}</li></ul>`}
      <p class="muted small">
        ${this.saves ? "Saving applies it to the chore right away." : "Using it fills in the chore's form. Save the chore to keep it."}
      </p>
    `;
	}
	_renderStep(e) {
		switch (this._step) {
			case "how": return this._renderHow(e);
			case "days": return this._renderDays(e);
			case "times": return this._renderTimes(e);
			case "interval": return this._renderInterval(e);
			case "preview": return this._renderPreview(e);
			default: return this._renderDone(e);
		}
	}
	render() {
		let e = this._draft;
		if (!e) return E;
		let t = this._steps, n = this._step, r = n === "done";
		return w`
      <div class="shell">
        <nav class="rail" aria-label="Steps">
          <div class="rail-title">Schedule${this.choreName ? `: ${this.choreName}` : ""}</div>
          ${t.map((e, t) => w`<div class="rail-item ${t === this._index ? "current" : ""} ${t < this._index ? "past" : ""}">
              <span class="mark">${t < this._index ? "✓" : t + 1}</span>
              <span>${St[e]}</span>
            </div>`)}
        </nav>
        <section class="card main">
          <div class="top">
            <span class="muted small">Step ${this._index + 1} of ${t.length}</span>
            <button type="button" class="link" @click=${() => this._cancel()}>Close</button>
          </div>
          <div class="bar"><div class="fill" style="width:${(this._index + 1) / t.length * 100}%"></div></div>
          <h2>${St[n]}</h2>
          ${this._renderStep(e)}
          ${this._error ? w`<div class="error">${this._error}</div>` : E}
          <div class="actions">
            ${this._index > 0 ? w`<button type="button" ?disabled=${this._busy} @click=${() => this._back()}>Back</button>` : E}
            <span class="spacer"></span>
            ${r ? w`<button type="button" class="primary" @click=${() => this._apply()}>
                  ${this.saves ? "Save schedule" : "Use this schedule"}
                </button>` : w`<button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._next()}>Next</button>`}
          </div>
        </section>
      </div>
    `;
	}
	static {
		this.styles = [G, o`
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
        border-radius: 10px;
        padding: 8px 10px;
        color: var(--secondary-text-color);
      }
      .rail-item.current {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
        font-weight: 500;
      }
      .rail-item.past {
        color: var(--primary-text-color);
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
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 15px;
        color: var(--primary-text-color);
        margin: 0;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      label.option {
        padding: 12px 14px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        margin: 8px 0;
        max-width: 760px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .chips.quick {
        margin-top: 14px;
      }
      button.chip.big {
        min-width: 64px;
        min-height: 48px;
        font-size: 16px;
      }
      input.short {
        width: 90px;
      }
      .field {
        margin: 16px 0;
        max-width: 260px;
      }
      ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      li {
        margin: 6px 0;
      }
      .actions {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 24px;
      }
      .actions button {
        min-width: 84px;
        min-height: 46px;
      }
      .spacer {
        flex: 1;
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
customElements.define("boopli-schedule-wizard", Tt);
// src/boopli-breakdown.ts
var Et = [
	{
		value: "small",
		letter: "S",
		label: "Small: quick and easy",
		xp: 10
	},
	{
		value: "medium",
		letter: "M",
		label: "Medium: takes some effort",
		xp: 15
	},
	{
		value: "big",
		letter: "B",
		label: "Big: hard or long",
		xp: 20
	}
], Dt = {
	small: 10,
	medium: 15,
	big: 20
}, Ot = 20, kt = 50, At = class extends A {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			kind: { type: String },
			task: { type: String },
			notes: { type: String },
			mode: { type: String },
			hasSteps: { type: Boolean },
			externalError: { type: String },
			_phase: { state: !0 },
			_task: { state: !0 },
			_answers: { state: !0 },
			_questions: { state: !0 },
			_picked: { state: !0 },
			_typed: { state: !0 },
			_extra: { state: !0 },
			_steps: { state: !0 },
			_notes: { state: !0 },
			_busy: { state: !0 },
			_error: { state: !0 },
			_round: { state: !0 },
			_rooms: { state: !0 },
			_preview: { state: !0 }
		};
	}
	constructor() {
		super(), this._roomsTouched = !1, this._guessedFor = null, this._started = !1, this.kind = "now", this.task = "", this.notes = "", this.mode = "page", this.hasSteps = !1, this.externalError = "", this._phase = "task", this._task = "", this._answers = [], this._questions = [], this._picked = [], this._typed = [], this._extra = "", this._steps = [], this._notes = "", this._busy = !1, this._error = "", this._round = 0, this._rooms = [], this._preview = null;
	}
	willUpdate() {
		this._started || (this._started = !0, this._task = this.task, this._notes = this.notes);
	}
	firstUpdated() {
		this._task.trim() && this._aiOn() ? this._begin() : this._guess();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearTimeout(this._guessTimer);
	}
	_homeOn() {
		return !!this.snapshot?.home?.enabled;
	}
	_notedRooms() {
		return (this.snapshot?.home?.rooms ?? []).filter((e) => !e.hidden && e.notes.trim());
	}
	_guess() {
		window.clearTimeout(this._guessTimer);
		let e = this._task.trim();
		return !this.hass || !e || this._roomsTouched || !this._homeOn() ? Promise.resolve() : (this._guessedFor === e && this._guessing || (this._guessedFor = e, this._guessing = (async () => {
			try {
				let t = await Le(this.hass, e);
				if (this._roomsTouched || this._task.trim() !== e) return;
				let n = new Set(this._notedRooms().map((e) => e.id));
				this._rooms = t.filter((e) => n.has(e)), this._preview = null;
			} catch {
				this._rooms = [];
			}
		})()), this._guessing);
	}
	_onTaskInput(e) {
		this._task = e, window.clearTimeout(this._guessTimer), this._guessTimer = window.setTimeout(() => void this._guess(), 400);
	}
	_toggleRoom(e) {
		this._roomsTouched = !0, this._rooms = this._rooms.includes(e) ? this._rooms.filter((t) => t !== e) : [...this._rooms, e], this._preview = null;
	}
	async _showPreview() {
		if (this.hass) {
			if (this._preview) this._preview = null;
			else try {
				this._preview = await Ie(this.hass, this._task.trim() || "(your task)", this.kind, this._answers, this._notes, this._rooms);
			} catch (e) {
				this._error = z(e);
			}
		}
	}
	_renderRooms() {
		if (!this._homeOn()) return E;
		let e = this._notedRooms();
		if (e.length === 0) return w`<p class="muted small roomtip">
        Tip: tell Boopli about your rooms and the steps will fit them.
        <button type="button" class="link" @click=${() => this._fire("open-home")}>Open My home</button>
      </p>`;
		let t = e.filter((e) => this._rooms.includes(e.id));
		return w`<div class="rooms">
      <div class="roomline">
        <span class="muted small">Room notes the AI will see:</span>
        ${e.map((e) => w`<button
            type="button"
            class="chip ${this._rooms.includes(e.id) ? "on" : ""}"
            aria-pressed=${this._rooms.includes(e.id)}
            @click=${() => this._toggleRoom(e.id)}
          >
            ${e.name}
          </button>`)}
        ${t.length === 0 ? w`<span class="muted small">none</span>` : E}
        <button type="button" class="link" @click=${() => this._showPreview()}>
          ${this._preview ? "Hide what is sent" : "What will the AI see?"}
        </button>
      </div>
      ${this._preview ? w`<div class="preview">
            ${this._preview.shortened ? w`<div class="muted small">A long note was shortened to keep the request small.</div>` : E}
            <pre>${this._preview.instructions}</pre>
          </div>` : E}
    </div>`;
	}
	_aiOn() {
		return !!this.snapshot?.settings.ai?.enabled;
	}
	_fire(e, t) {
		this.dispatchEvent(new CustomEvent(e, {
			detail: t,
			bubbles: !0,
			composed: !0
		}));
	}
	async _ask(e, t) {
		this._busy = !0, this._error = "";
		try {
			return await e();
		} catch (e) {
			return this._error = z(e), this._phase = t, null;
		} finally {
			this._busy = !1;
		}
	}
	async _begin() {
		if (!this.hass || !this._task.trim()) return;
		this._answers = [], this._round = 0, this._phase = "working", await this._guess();
		let e = await this._ask(() => Fe(this.hass, this._task.trim(), this.kind, [], this._notes, this._rooms), "task");
		e && this._showQuestions(e.enough, e.questions);
	}
	_showQuestions(e, t) {
		e || t.length === 0 ? this._loadSteps() : (this._questions = t, this._picked = t.map(() => []), this._typed = t.map(() => ""), this._extra = "", this._round += 1, this._phase = "interview");
	}
	_currentAnswers() {
		let e = [];
		return this._questions.forEach((t, n) => {
			let r = [...this._picked[n], this._typed[n].trim()].filter(Boolean);
			r.length && e.push({
				question: t.text,
				answer: r.join(", ")
			});
		}), this._extra.trim() && e.push({
			question: "Anything else to know?",
			answer: this._extra.trim()
		}), e;
	}
	async _send() {
		if (!this.hass) return;
		let e = [...this._answers, ...this._currentAnswers()];
		this._answers = e, this._phase = "working";
		let t = await this._ask(() => Fe(this.hass, this._task.trim(), this.kind, e, this._notes, this._rooms), "interview");
		t && this._showQuestions(t.enough, t.questions);
	}
	async _enough() {
		this._answers = [...this._answers, ...this._currentAnswers()], await this._loadSteps();
	}
	async _loadSteps() {
		if (!this.hass) return;
		this._phase = "working", await this._guess();
		let e = await this._ask(() => M(this.hass, this._task.trim(), this.kind, this._answers, this._notes, this._rooms), this._questions.length ? "interview" : "task");
		e && (this._steps = e.steps.slice(0, kt), e.summary && !this._notes.includes(e.summary) && (this._notes = [this._notes, e.summary].filter(Boolean).join("\n")), this._phase = "review");
	}
	_patchStep(e, t) {
		this._steps = this._steps.map((n, r) => r === e ? {
			...n,
			...t
		} : n);
	}
	_move(e, t) {
		let n = e + t;
		if (n < 0 || n >= this._steps.length) return;
		let r = [...this._steps];
		[r[e], r[n]] = [r[n], r[e]], this._steps = r;
	}
	_remove(e) {
		this._steps = this._steps.filter((t, n) => n !== e);
	}
	_add(e) {
		let t = this._steps[e]?.group ?? "", n = [...this._steps];
		n.splice(e + 1, 0, {
			title: "",
			group: t,
			size: "small",
			wait_minutes: 0
		}), this._steps = n.slice(0, kt);
	}
	_finish(e) {
		let t = this._steps.filter((e) => e.title.trim()).map((e) => ({
			...e,
			title: e.title.trim()
		}));
		t.length === 0 ? this._error = "There is no step yet. Add one, or try again." : this._fire("breakdown-result", {
			action: e,
			task: this._task.trim(),
			steps: t,
			notes: this._notes.trim()
		});
	}
	_cancel() {
		this._fire("breakdown-cancel");
	}
	_renderOff() {
		return w`<section class="card main">
      <h2>AI help is switched off</h2>
      <p>
        To split tasks into small steps, switch on AI help and choose your Home Assistant AI agent.
        It takes a minute, and Boopli never sends anything before you do.
      </p>
      <div class="actions">
        <button class="primary" @click=${() => this._fire("open-wizard", { wizard: "ai" })}>Set up AI help</button>
        <button @click=${() => this._cancel()}>Close</button>
      </div>
    </section>`;
	}
	_renderTask() {
		return w`
      <p>
        ${this.kind === "recurring" ? "What is the chore? I will ask what it really involves, so we can break it into tiny steps once and reuse them every time." : "What do you want to get done? Write it the way you would say it."}
      </p>
      <textarea
        rows="3"
        placeholder=${this.kind === "recurring" ? "For example: clean my room" : "For example: clean the bathroom"}
        .value=${this._task}
        @input=${(e) => this._onTaskInput(e.target.value)}
      ></textarea>
      ${this._renderRooms()}
      <div class="actions">
        <button class="primary big" ?disabled=${!this._task.trim() || this._busy} @click=${() => this._begin()}>
          ${this.kind === "recurring" ? "Ask me about it" : "Break it down"}
        </button>
        <button ?disabled=${!this._task.trim() || this._busy} @click=${() => this._loadSteps()}>Skip the questions</button>
      </div>
    `;
	}
	_renderQuestion(e, t) {
		let n = this._picked[t] ?? [];
		return w`<div class="question">
      <div class="qtext">${e.text}</div>
      <div class="chips">
        ${e.options.map((r) => {
			let i = n.includes(r);
			return w`<button
            type="button"
            class="chip big ${i ? "on" : ""}"
            aria-pressed=${i}
            @click=${() => {
				let n = this._picked[t] ?? [], i = n.includes(r), a = e.multiple ? i ? n.filter((e) => e !== r) : [...n, r] : i ? [] : [r];
				this._picked = this._picked.map((e, n) => n === t ? a : e);
			}}
          >
            ${r}
          </button>`;
		})}
      </div>
      <textarea
        rows="1"
        class="own"
        placeholder="Or write it in your own words"
        .value=${this._typed[t] ?? ""}
        @input=${(e) => this._typed = this._typed.map((n, r) => r === t ? e.target.value : n)}
      ></textarea>
    </div>`;
	}
	_renderInterview() {
		return w`
      ${this._answers.length ? w`<details class="said">
            <summary>What you told me so far (${this._answers.length})</summary>
            <ul>
              ${this._answers.map((e) => w`<li><span class="muted">${e.question}</span> ${e.answer}</li>`)}
            </ul>
          </details>` : E}
      <p class="muted small">
        ${this._round > 1 ? "A few more things, so the steps fit." : "A few questions so the steps fit your situation."}
        Tap what fits, or write as much as you like. You can skip any question.
      </p>
      ${this._renderRooms()}
      ${this._questions.map((e, t) => this._renderQuestion(e, t))}
      <div class="question">
        <div class="qtext">Anything else I should know?</div>
        <textarea
          rows="2"
          class="own"
          placeholder="Optional. Long answers are welcome."
          .value=${this._extra}
          @input=${(e) => this._extra = e.target.value}
        ></textarea>
      </div>
      <div class="actions">
        <button class="primary big" ?disabled=${this._busy} @click=${() => this._send()}>Next questions</button>
        <button class="big" ?disabled=${this._busy} @click=${() => this._enough()}>Enough, go on</button>
      </div>
    `;
	}
	_renderWorking() {
		return w`<div class="working" role="status">
      <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span>${this._answers.length || this._steps.length ? "Writing the steps…" : "Thinking…"}</span>
    </div>`;
	}
	_xp() {
		return this._steps.reduce((e, t) => e + Dt[t.size], 0) + Ot;
	}
	_renderStep(e, t) {
		return w`
      ${(t === 0 || this._steps[t - 1].group !== e.group) && e.group ? w`<div class="group">${e.group}</div>` : E}
      <div class="step">
        <span class="num">${t + 1}</span>
        <input
          class="title"
          aria-label="Step ${t + 1}"
          placeholder="What to do"
          .value=${e.title}
          @input=${(e) => this._patchStep(t, { title: e.target.value })}
        />
        <span class="sizes" role="group" aria-label="Size">
          ${Et.map((n) => w`<button
              type="button"
              class="chip size ${e.size === n.value ? "on" : ""}"
              title="${n.label} (${n.xp} XP)"
              aria-pressed=${e.size === n.value}
              @click=${() => this._patchStep(t, { size: n.value })}
            >
              ${n.letter}
            </button>`)}
        </span>
        ${e.wait_minutes > 0 ? w`<span class="wait muted small" title="Time to wait before this step">⏳ ${e.wait_minutes} min</span>` : E}
        <span class="tools">
          <button type="button" aria-label="Move up" ?disabled=${t === 0} @click=${() => this._move(t, -1)}>↑</button>
          <button type="button" aria-label="Move down" ?disabled=${t === this._steps.length - 1} @click=${() => this._move(t, 1)}>↓</button>
          <button type="button" aria-label="Add a step after this" @click=${() => this._add(t)}>+</button>
          <button type="button" aria-label="Remove" @click=${() => this._remove(t)}>✕</button>
        </span>
      </div>
    `;
	}
	_renderReview() {
		let e = this._steps, t = this.mode === "editor";
		return w`
      <p>
        <b>${e.length} ${e.length === 1 ? "step" : "steps"}</b>
        <span class="muted"> · worth about ${this._xp()} XP when all are done. Check them, change what does not fit.</span>
      </p>
      <div class="steps">${e.map((e, t) => this._renderStep(e, t))}</div>
      <div class="inline-actions">
        <button type="button" @click=${() => this._add(e.length - 1)}>+ Add a step</button>
        <button type="button" ?disabled=${this._busy} @click=${() => this._loadSteps()}>Try again</button>
        ${this._answers.length || this._questions.length ? w`<button type="button" ?disabled=${this._busy} @click=${() => this._begin()}>Ask me again</button>` : E}
      </div>
      ${this.kind === "recurring" || t ? w`<div class="field">
            <label for="notes">Kept with the chore, for next time (you can edit it)</label>
            <textarea id="notes" rows="2" .value=${this._notes} @input=${(e) => this._notes = e.target.value}></textarea>
          </div>` : E}
      <div class="actions">
        ${t ? this.hasSteps ? w`<button class="primary big" @click=${() => this._finish("replace")}>Replace my steps</button>
                <button class="big" @click=${() => this._finish("append")}>Add to my steps</button>` : w`<button class="primary big" @click=${() => this._finish("replace")}>Use these steps</button>` : this.kind === "recurring" ? w`<button class="primary big" @click=${() => this._finish("schedule")}>Save and set the schedule</button>
                <button class="big" @click=${() => this._finish("save")}>Save without a schedule</button>` : w`<button class="primary big" @click=${() => this._finish("start")}>Start now</button>
                <button class="big" @click=${() => this._finish("save")}>Save as chore</button>`}
      </div>
    `;
	}
	render() {
		return this._aiOn() ? w`
      <section class="card main">
        <div class="top">
          <h2>${{
			task: this.kind === "recurring" ? "Break down a recurring chore" : "Break it down now",
			interview: "A few questions",
			working: this._task,
			review: this._task
		}[this._phase]}</h2>
          <button type="button" class="link" @click=${() => this._cancel()}>Close</button>
        </div>
        ${this.externalError ? w`<div class="error">${this.externalError}</div>` : E}
        ${this._error ? w`<div class="error">
              ${this._error}
              ${this._phase === "interview" || this._phase === "task" ? w`<div class="muted small">You can try again, or skip the questions.</div>` : E}
            </div>` : E}
        ${this._phase === "task" ? this._renderTask() : E}
        ${this._phase === "interview" ? this._renderInterview() : E}
        ${this._phase === "working" ? this._renderWorking() : E}
        ${this._phase === "review" ? this._renderReview() : E}
      </section>
    ` : this._renderOff();
	}
	static {
		this.styles = [G, o`
      .main {
        padding: 24px;
        max-width: 980px;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      h2 {
        font-size: 22px;
      }
      p {
        margin: 10px 0;
        line-height: 1.5;
        max-width: 760px;
      }
      .small {
        font-size: 13px;
      }
      .link {
        border: 0;
        background: none;
        color: var(--secondary-text-color);
        text-decoration: underline;
        min-height: 0;
        padding: 4px 6px;
      }
      textarea {
        font: inherit;
        width: 100%;
        max-width: 760px;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        resize: vertical;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 20px;
      }
      button.big {
        min-height: 48px;
        padding: 0 22px;
        font-size: 16px;
      }
      .question {
        padding: 14px 16px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        margin: 10px 0;
        max-width: 760px;
      }
      .qtext {
        font-weight: 500;
        margin-bottom: 10px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
      }
      .own {
        min-height: 40px;
      }
      .said {
        margin: 6px 0 12px;
        font-size: 14px;
      }
      .said summary {
        cursor: pointer;
        color: var(--secondary-text-color);
      }
      .said li {
        margin: 4px 0;
      }
      .working {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 28px 4px;
        font-size: 18px;
      }
      .dots {
        display: inline-flex;
        gap: 6px;
      }
      .dots i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--primary-color);
        animation: bounce 1s infinite ease-in-out;
      }
      .dots i:nth-child(2) {
        animation-delay: 0.15s;
      }
      .dots i:nth-child(3) {
        animation-delay: 0.3s;
      }
      @keyframes bounce {
        0%,
        80%,
        100% {
          opacity: 0.25;
          transform: scale(0.8);
        }
        40% {
          opacity: 1;
          transform: scale(1);
        }
      }
      .steps {
        margin: 10px 0;
      }
      .group {
        margin: 16px 0 6px;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--primary-color);
      }
      .step {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid var(--divider-color);
      }
      .num {
        width: 26px;
        text-align: right;
        color: var(--secondary-text-color);
        font-size: 13px;
        flex: 0 0 26px;
      }
      input.title {
        flex: 1;
        min-width: 0;
      }
      .sizes {
        display: inline-flex;
        gap: 4px;
      }
      button.size {
        min-width: 34px;
        min-height: 34px;
        padding: 0;
        font-weight: 600;
      }
      .wait {
        white-space: nowrap;
      }
      .tools {
        display: inline-flex;
        gap: 4px;
      }
      .tools button {
        min-width: 34px;
        min-height: 34px;
        padding: 0 6px;
      }
      .inline-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 12px 0;
      }
      .field {
        margin: 16px 0;
        max-width: 760px;
      }
      .rooms,
      .roomtip {
        margin: 12px 0;
        max-width: 760px;
      }
      .roomline {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .preview {
        margin-top: 8px;
      }
      .preview pre {
        white-space: pre-wrap;
        font: inherit;
        font-size: 13px;
        line-height: 1.45;
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        max-height: 320px;
        overflow: auto;
        margin: 6px 0 0;
      }
      @media (max-width: 700px) {
        .step {
          flex-wrap: wrap;
        }
        input.title {
          flex-basis: calc(100% - 40px);
        }
      }
    `];
	}
};
customElements.define("boopli-breakdown", At);
// src/boopli-chore-editor.ts
var jt = [
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
], Mt = [
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
], Nt = [
	{
		value: "none",
		label: "On demand (I start it)"
	},
	{
		value: "schedule",
		label: "On certain days and times"
	},
	{
		value: "every_n_days",
		label: "Every N days after I finish"
	}
], Pt = Object.fromEntries([
	0,
	1,
	2,
	3,
	4,
	5,
	6
].map((e) => [String(e), ["09:00"]])), Ft = class extends A {
	static {
		this.properties = {
			hass: { attribute: !1 },
			draft: { attribute: !1 },
			defaultStyle: { attribute: !1 },
			timeZone: { type: String },
			snapshot: { attribute: !1 },
			startSchedule: { type: Boolean },
			_error: { state: !0 },
			_busy: { state: !0 },
			_confirmDelete: { state: !0 },
			_sched: { state: !0 },
			_suggest: { state: !0 }
		};
	}
	constructor() {
		super(), this._lastDirty = !1, this.defaultStyle = "one", this.timeZone = "UTC", this.startSchedule = !1, this._error = "", this._busy = !1, this._confirmDelete = !1, this._sched = "off", this._suggest = !1;
	}
	willUpdate() {
		this._base === void 0 && this.draft && (this._base = JSON.stringify(this.draft), this.startSchedule && (this._sched = "direct"));
	}
	async _applySchedule(e) {
		if (this._update({ repeat: e }), this._sched === "direct") {
			if (this._sched = "off", await this.updateComplete, !await this._save()) return;
		} else this._sched = "off";
	}
	_cancelSchedule() {
		this._sched === "direct" ? this._close() : this._sched = "off";
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
			wait_minutes: 0,
			size: "small",
			group: ""
		}] });
	}
	_applySuggestion(e) {
		let t = e.steps.map((e) => ({
			title: e.title,
			wait_minutes: e.wait_minutes,
			size: e.size,
			group: e.group
		})), n = this.draft.steps.filter((e) => e.title.trim() !== ""), r = e.action === "append" ? [...n, ...t] : t;
		this._update({
			steps: r.slice(0, 50),
			notes: e.notes
		}), this._suggest = !1;
	}
	_openSuggest() {
		this.draft.name.trim() ? (this._error = "", this._suggest = !0) : this._error = "Give the chore a name first, so the AI knows what to split up.";
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
			return await R(this.hass, {
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
			return this._error = z(e), !1;
		} finally {
			this._busy = !1;
		}
	}
	async _delete() {
		if (this.hass && this.draft.id && !this._busy) {
			this._busy = !0;
			try {
				await Ke(this.hass, this.draft.id), this._close();
			} catch (e) {
				this._error = z(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderRepeat() {
		let e = this.draft.repeat;
		return w`
      <div class="field">
        <label for="repeat">Repeats</label>
        <select
          id="repeat"
          .value=${e.type}
          @change=${(t) => {
			let n = t.target.value, r = n === "schedule" && Object.keys(e.days).length === 0 ? Pt : e.days;
			this._updateRepeat({
				type: n,
				days: r
			});
		}}
        >
          ${Nt.map((t) => w`<option value=${t.value} ?selected=${t.value === e.type}>${t.label}</option>`)}
        </select>
      </div>
      ${e.type === "schedule" ? w`<div class="field">
            <label>Each day has its own times. Untick a day that has none.</label>
            <boopli-schedule-days
              .days=${e.days}
              @days-change=${(e) => this._updateRepeat({ days: e.detail })}
            ></boopli-schedule-days>
            <div class="muted small summary">${W(e)}</div>
          </div>` : E}
      ${e.type === "every_n_days" ? w`<div class="field">
              <label for="n">Number of days</label>
              <input
                id="n"
                type="number"
                min="1"
                max="365"
                .value=${String(e.every_n_days)}
                @input=${(e) => this._updateRepeat({ every_n_days: Number(e.target.value) || 1 })}
              />
            </div>
            <div class="field">
              <label for="time">At</label>
              <input
                id="time"
                type="time"
                .value=${e.time}
                @input=${(e) => this._updateRepeat({ time: e.target.value })}
              />
            </div>` : E}
      <div class="field">
        <button type="button" @click=${() => this._sched = "inline"}>Set the schedule step by step</button>
      </div>
    `;
	}
	_renderStep(e) {
		let t = this.draft.steps[e], n = this.draft.steps.length - 1;
		return w`
      <div class="step">
        <div class="step-head">
          <span class="num">${e + 1}</span>
          <input
            aria-label="Step ${e + 1} title"
            placeholder="What to do"
            .value=${t.title}
            @input=${(t) => this._updateStep(e, { title: t.target.value })}
          />
          ${t.group ? w`<span class="tag" title="Part of the task">${t.group}</span>` : E}
          <span class="sizes" role="group" aria-label="Size of step ${e + 1}">
            ${[
			"small",
			"medium",
			"big"
		].map((n) => w`<button
                type="button"
                class="chip size ${(t.size ?? "small") === n ? "on" : ""}"
                title="${n === "small" ? "Small: 10 XP" : n === "medium" ? "Medium: 15 XP" : "Big: 20 XP"}"
                aria-pressed=${(t.size ?? "small") === n}
                @click=${() => this._updateStep(e, { size: n })}
              >
                ${n === "small" ? "S" : n === "medium" ? "M" : "B"}
              </button>`)}
          </span>
          <button type="button" aria-label="Move up" ?disabled=${e === 0} @click=${() => this._moveStep(e, -1)}>↑</button>
          <button type="button" aria-label="Move down" ?disabled=${e === n} @click=${() => this._moveStep(e, 1)}>↓</button>
          <button type="button" aria-label="Remove step" ?disabled=${n === 0} @click=${() => this._removeStep(e)}>✕</button>
        </div>
        <div class="wait">
          <span class="muted small">Wait before this step:</span>
          <div class="chips">
            ${Mt.map((n) => w`<button
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
            ${(t.triggers ?? []).length > 0 ? w`<span class="muted small">(${(t.triggers ?? []).length} set)</span>` : E}
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
		return e ? this._suggest ? w`<boopli-breakdown
        mode="editor"
        .hass=${this.hass}
        .snapshot=${this.snapshot}
        .kind=${e.repeat.type === "none" ? "now" : "recurring"}
        .task=${e.name}
        .notes=${e.notes ?? ""}
        .hasSteps=${e.steps.some((e) => e.title.trim() !== "")}
        @breakdown-result=${(e) => this._applySuggestion(e.detail)}
        @breakdown-cancel=${() => this._suggest = !1}
      ></boopli-breakdown>` : this._sched === "off" ? w`
      <section class="card ${this._isDirty() ? "changed" : ""}">
        <h2>
          ${e.id ? "Edit chore" : "New chore"}
          ${this._isDirty() ? w`<span class="unsaved-badge">Unsaved</span>` : E}
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
            ${jt.map((t) => w`<option
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
        <div class="step-buttons">
          <button type="button" @click=${() => this._addStep()}>+ Add a step</button>
          <button type="button" @click=${() => this._openSuggest()}>✨ Suggest steps with AI</button>
        </div>
        </div>
        </div>

        ${this._error ? w`<div class="error">${this._error}</div>` : E}

        <div class="actions">
          <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
          <button ?disabled=${this._busy} @click=${() => this._close()}>Cancel</button>
          ${e.id ? this._confirmDelete ? w`<span class="muted small">Delete it, and anything in progress?</span>
                  <button class="danger" ?disabled=${this._busy} @click=${() => this._delete()}>Yes, delete</button>
                  <button @click=${() => this._confirmDelete = !1}>No</button>` : w`<button class="danger" @click=${() => this._confirmDelete = !0}>Delete</button>` : E}
        </div>
      </section>
      ${this._isDirty() ? w`<div class="savebar" role="status">
            <span><b>●</b> You have unsaved changes</span>
            <span class="spacer"></span>
            <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
            <button ?disabled=${this._busy} @click=${() => this._close()}>Discard</button>
          </div>` : E}
    ` : w`<boopli-schedule-wizard
        .hass=${this.hass}
        .repeat=${e.repeat}
        .choreName=${e.name}
        .timeZone=${this.timeZone}
        .saves=${this._sched === "direct"}
        @schedule-apply=${(e) => this._applySchedule(e.detail)}
        @schedule-cancel=${() => this._cancelSchedule()}
      ></boopli-schedule-wizard>` : E;
	}
	static {
		this.styles = [G, o`
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
      .summary {
        margin-top: 8px;
      }
      .tag {
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 12px;
        background: var(--secondary-background-color);
        color: var(--primary-color);
        white-space: nowrap;
      }
      .sizes {
        display: inline-flex;
        gap: 4px;
      }
      button.size {
        min-width: 32px;
        min-height: 32px;
        padding: 0;
        font-weight: 600;
      }
      .step-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
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
customElements.define("boopli-chore-editor", Ft);
// src/templates.ts
var It = {
	type: "none",
	time: "09:00",
	every_n_days: 1,
	days: {}
}, K = [
	{
		label: "Dishwasher",
		draft: {
			name: "Dishwasher",
			where: "home",
			enabled: !0,
			one_off: !1,
			repeat: {
				...It,
				days: {}
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
				...It,
				days: {}
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
				type: "schedule",
				time: "09:00",
				every_n_days: 1,
				days: { 3: ["19:00"] }
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
				type: "schedule",
				time: "09:00",
				every_n_days: 1,
				days: Object.fromEntries([
					0,
					1,
					2,
					3,
					4,
					5,
					6
				].map((e) => [String(e), ["08:00"]]))
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
function Lt() {
	return {
		name: "",
		where: "home",
		enabled: !0,
		one_off: !1,
		repeat: {
			type: "none",
			time: "09:00",
			every_n_days: 1,
			days: {}
		},
		steps: [{
			title: "",
			wait_minutes: 0
		}]
	};
}
// src/boopli-chores.ts
var Rt = class extends A {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			nowMs: { type: Number },
			openRequest: { attribute: !1 },
			_editing: { state: !0 },
			_openSchedule: { state: !0 },
			_error: { state: !0 }
		};
	}
	constructor() {
		super(), this.nowMs = Date.now(), this.openRequest = null, this._editing = null, this._openSchedule = !1, this._error = "";
	}
	willUpdate() {
		if (this.openRequest && !this._editing) {
			let e = this.openRequest;
			this._openSchedule = e.schedule, this._editing = e.draft, this.dispatchEvent(new CustomEvent("request-handled", {
				bubbles: !0,
				composed: !0
			}));
		}
	}
	_edit(e, t = !1) {
		this._openSchedule = t, this._editing = {
			id: e.id,
			name: e.name,
			where: e.where,
			enabled: e.enabled,
			one_off: e.one_off,
			repeat: {
				...e.repeat,
				days: Object.fromEntries(Object.entries(e.repeat.days ?? {}).map(([e, t]) => [e, [...t]]))
			},
			nudge_style: e.nudge_style,
			ignore_quiet_hours: e.ignore_quiet_hours,
			notes: e.notes ?? "",
			steps: e.steps.map((e) => ({
				id: e.id,
				title: e.title,
				wait_minutes: e.wait_minutes,
				triggers: (e.triggers ?? []).map((e) => ({ ...e })),
				size: e.size ?? "small",
				group: e.group ?? ""
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
				await qe(this.hass, e.id);
			} catch (e) {
				this._error = z(e);
			}
		}
	}
	render() {
		if (!this.snapshot) return w`<p class="muted">Loading…</p>`;
		if (this._editing) return w`<boopli-chore-editor
        .hass=${this.hass}
        .draft=${this._editing}
        .defaultStyle=${this.snapshot.settings.default_style}
        .timeZone=${this.snapshot.time_zone}
        .snapshot=${this.snapshot}
        .startSchedule=${this._openSchedule}
        @editor-close=${() => {
			this._editing = null, this._openSchedule = !1, this.dispatchEvent(new CustomEvent("dirty-change", {
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
		return w`
      <div class="toolbar">
        <button class="primary" @click=${() => this._editing = Lt()}>
          + New chore
        </button>
        <button
          @click=${() => this.dispatchEvent(new CustomEvent("open-breakdown", {
			detail: { kind: "recurring" },
			bubbles: !0,
			composed: !0
		}))}
        >
          ✨ New chore with AI
        </button>
      </div>

      <div class="templates">
        <span class="muted small">Start from a template:</span>
        ${K.map((e) => w`<button
            class="chip"
            @click=${() => this._editing = structuredClone(e.draft)}
          >
            ${e.label}
          </button>`)}
      </div>

      ${this._error ? w`<div class="error">${this._error}</div>` : E}
      ${n.length === 0 ? w`<p class="muted empty">
            No chores yet. Pick a template above or create your own.
          </p>` : w`<div class="chore-list">${n.map((n) => w`
              <section class="card chore">
                <div class="chore-main">
                  <div class="name">${n.name}</div>
                  <div class="muted small">
                    ${W(n.repeat)} · ${n.where === "home" ? "Home only" : "Anywhere"}
                    · ${n.steps.length} ${n.steps.length === 1 ? "step" : "steps"}
                  </div>
                  <div class="muted small">
                    ${t.has(n.id) ? "In progress" : n.enabled && n.next_due ? `Next: ${et(n.next_due, this.nowMs, e)}` : n.repeat.type === "none" ? "" : "Not scheduled"}
                  </div>
                </div>
                <div class="chore-actions">
                  ${t.has(n.id) ? E : w`<button @click=${() => this._start(n)}>Start now</button>`}
                  ${n.repeat.type === "none" ? w`<button @click=${() => this._edit(n, !0)}>Set a schedule</button>` : E}
                  <button @click=${() => this._edit(n)}>Edit</button>
                </div>
              </section>
            `)}</div>`}
    `;
	}
	static {
		this.styles = [G, o`
      .small {
        font-size: 13px;
      }
      .toolbar {
        margin-bottom: 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
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
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
        flex-shrink: 0;
      }
    `];
	}
};
customElements.define("boopli-chores", Rt);
// src/helpers.ts
var zt = "amzn_sfx_scifi_alarm_01", Bt = "amzn_sfx_doorbell_chime_01", Vt = [
	"siren",
	"switch",
	"input_boolean",
	"script"
], Ht = {
	start: "07:00",
	stop: "22:00"
};
function q(e, t) {
	let n = e?.states[t]?.attributes?.friendly_name;
	return typeof n == "string" && n ? n : t;
}
function J(e, t, n = []) {
	return Object.keys(e?.states ?? {}).filter((e) => t.includes(e.split(".")[0]) && !n.includes(e)).sort((t, n) => q(e, t).localeCompare(q(e, n)));
}
function Ut(e, t, n) {
	let r;
	return r = t === "alexa_media" ? Object.keys(e?.services?.notify ?? {}).filter((e) => e.startsWith("alexa_media_") && e !== "alexa_media").sort().map((e) => ({
		value: e,
		label: e.replace("alexa_media_", "")
	})) : t === "alexa_devices" ? Object.keys(e?.states ?? {}).filter((e) => e.startsWith("notify.") && /_(speak|announce)$/.test(e)).sort().map((t) => ({
		value: t,
		label: q(e, t)
	})) : J(e, ["tts"]).map((t) => ({
		value: t,
		label: q(e, t)
	})), n && !r.some((e) => e.value === n) && r.unshift({
		value: n,
		label: `${n} (not found)`
	}), r;
}
function Wt(e) {
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
function Gt(e) {
	return {
		entity_id: e,
		cue: {
			enabled: !1,
			kind: "alexa",
			sound: Bt,
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
			sound: zt,
			start_at: 4,
			seconds: 30,
			repeat_s: 5
		}
	};
}
function Kt(e) {
	return {
		entity_id: e,
		seconds: 30,
		start_at: 4
	};
}
function qt(e) {
	let t = parseInt(e.replace("#", ""), 16);
	return [
		t >> 16 & 255,
		t >> 8 & 255,
		t & 255
	];
}
function Jt(e) {
	return "#" + e.map((e) => e.toString(16).padStart(2, "0")).join("");
}
function Y(e) {
	return e.replace("mobile_app_", "");
}
var X = {
	normal: "normal",
	high: "high priority",
	alarm: "alarm volume",
	alarm_max: "max volume"
}, Yt = {
	quiet: "Quiet",
	one: "One nudge",
	escalating: "Escalating",
	persistent: "Persistent"
};
function Xt(e) {
	if (!e.enabled) return "Off: Boopli nudges at any time";
	let t = [], n = 0;
	for (; n < 7;) {
		let r = e.days[String(n)] ?? null, i = n;
		for (; i + 1 < 7 && (e.days[String(i + 1)] ?? null)?.start === r?.start && (e.days[String(i + 1)] ?? null)?.stop === r?.stop;) i++;
		let a = n === i ? V[n] : `${V[n]} to ${V[i]}`;
		t.push(r ? `${a} ${r.start} to ${r.stop}` : `${a} no limit`), n = i + 1;
	}
	return "Nudges allowed " + t.join(", ");
}
function Zt(e) {
	let t = [
		e.cue.enabled ? `ding (from nudge ${e.cue.start_at})` : "",
		e.speech.enabled ? `speech (from nudge ${e.speech.start_at})` : "",
		e.alarm.enabled ? `alarm (from nudge ${e.alarm.start_at})` : ""
	].filter(Boolean);
	return t.length ? t.join(", ") : "nothing switched on yet";
}
function Z(e) {
	return e.mode === "indicator" ? "status light (stays on until done)" : "blinks";
}
// src/boopli-speakers.ts
var Qt = "amzn_sfx_scifi_alarm_01", $t = "amzn_sfx_doorbell_chime_01", en = "https://developer.amazon.com/en-US/docs/alexa/custom-skills/ask-soundlibrary.html", tn = [
	"siren",
	"switch",
	"input_boolean",
	"script"
], nn = [{
	value: "alexa",
	label: "Alexa sound"
}, {
	value: "file",
	label: "File in my media folder"
}], rn = [
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
], an = class extends A {
	static {
		this.properties = {
			hass: { attribute: !1 },
			settings: { attribute: !1 },
			show: {
				type: String,
				reflect: !0
			},
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
				sound: $t,
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
				sound: Qt,
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
			this._note(n, (await I(this.hass, e, t)).note);
		} catch (e) {
			this._note(n, z(e));
		}
	}
	_startAt(e, t, n = "Starts at nudge #") {
		return w`
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
		return w`
      <div class="level">
        <label class="inline">
          <input
            type="checkbox"
            .checked=${n.enabled}
            @change=${(e) => this._setSound(r, t, { enabled: e.target.checked })}
          />
          ${o}
        </label>
        ${n.enabled ? w`
              <div class="fields">
                <label class="num wide">
                  Sound type
                  <select
                    .value=${n.kind}
                    @change=${(e) => this._setSound(r, t, { kind: e.target.value })}
                  >
                    ${nn.map((e) => w`<option value=${e.value} ?selected=${e.value === n.kind}>${e.label}</option>`)}
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
                ${n.kind === "alexa" ? w`<div class="muted small libhint">
                      Pick a sound from the
                      <a href=${en} target="_blank" rel="noopener noreferrer">Alexa sound library</a>.
                      The id is <code>amzn_sfx_</code> + the sound's name in lower case with underscores
                      + a two-digit number, for example "Doorbell Chime (1)" is
                      <code>amzn_sfx_doorbell_chime_01</code>. Press Test to hear it. Some ids stay silent.
                    </div>` : E}
                ${this._startAt(n.start_at, (e) => this._setSound(r, t, { start_at: e }))}
                ${a ? w`
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
                    ` : E}
                <button @click=${() => this._test(e, t)}>Test</button>
              </div>
            ` : E}
        ${this._notes[i] ? w`<div class="note muted small">${this._notes[i]}</div>` : E}
      </div>
    `;
	}
	_speechRow(e) {
		let t = e.speech, n = e.entity_id, r = `speaker:${n}:speech`, i = this._targets(t.route, t.target);
		return w`
      <div class="level">
        <label class="inline">
          <input
            type="checkbox"
            .checked=${t.enabled}
            @change=${(e) => this._setSpeech(n, { enabled: e.target.checked })}
          />
          Speak a sentence
        </label>
        ${t.enabled ? w`
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
                    ${rn.map((e) => w`<option value=${e.value} ?selected=${e.value === t.route}>${e.label}</option>`)}
                  </select>
                </label>
                <label class="num wide">
                  ${t.route === "tts" ? "Voice" : "Alexa device"}
                  <select
                    .value=${t.target}
                    @change=${(e) => this._setSpeech(n, { target: e.target.value })}
                  >
                    <option value="" ?selected=${t.target === ""}>Choose…</option>
                    ${i.map((e) => w`<option value=${e.value} ?selected=${e.value === t.target}>${e.label}</option>`)}
                  </select>
                </label>
                ${t.route === "alexa_media" ? w`
                      <label class="inline small">
                        <input
                          type="checkbox"
                          .checked=${t.announce}
                          @change=${(e) => this._setSpeech(n, { announce: e.target.checked })}
                        />
                        Announce (with chime). Some Alexas stay silent, so test it.
                      </label>
                    ` : E}
                ${this._startAt(t.start_at, (e) => this._setSpeech(n, { start_at: e }))}
                <button @click=${() => this._test(e, "speech")}>Test</button>
              </div>
            ` : E}
        ${this._notes[r] ? w`<div class="note muted small">${this._notes[r]}</div>` : E}
      </div>
    `;
	}
	_renderSpeakers(e) {
		let t = e.speakers.map((e) => e.entity_id), n = this._ids(["media_player"], t);
		return w`
      <section class="card">
        <h2>🔊 Speakers</h2>
        <p class="muted small">
          Each speaker can play a small ding, speak a sentence, and sound an
          alarm. A speaker plays the highest level that has been reached. Press
          Test on each one to hear it.
        </p>
        ${e.speakers.map((t) => w`
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
            ${n.map((e) => w`<option value=${e} ?selected=${e === this._addSpeaker}>${this._friendly(e)}</option>`)}
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
			this._note(t, (await L(this.hass, e)).note);
		} catch (e) {
			this._note(t, z(e));
		}
	}
	_renderDevices(e) {
		let t = e.alarm_devices.map((e) => e.entity_id), n = this._ids(tn, t);
		return w`
      <section class="card">
        <h2>🚨 Alarm devices</h2>
        <p class="muted small">
          A siren, switch or script that sounds the alarm. Boopli switches it on
          for the time you set and then off again, and off when you answer or
          when Home Assistant restarts.
        </p>
        ${e.alarm_devices.map((t) => {
			let n = `device:${t.entity_id}`;
			return w`
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
            ${this._notes[n] ? w`<div class="note muted small">${this._notes[n]}</div>` : E}
          `;
		})}
        <div class="row add">
          <select
            aria-label="Add an alarm device"
            .value=${this._addDevice}
            @change=${(e) => this._addDevice = e.target.value}
          >
            <option value="">Add a siren, switch or script…</option>
            ${n.map((e) => w`<option value=${e} ?selected=${e === this._addDevice}>${this._friendly(e)}</option>`)}
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
		if (!e) return E;
		let t = this.show || "all";
		return w`${t === "devices" ? E : this._renderSpeakers(e)}
    ${t === "speakers" ? E : this._renderDevices(e)}`;
	}
	static {
		this.styles = [G, o`
      :host {
        display: block;
      }
      section.card {
        margin: 0 0 16px;
      }
      :host([show]) section.card {
        margin: 0;
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
customElements.define("boopli-speakers", an);
// src/boopli-settings.ts
var on = "boopli.settings_mode";
function sn() {
	try {
		return localStorage.getItem(on) === "advanced" ? "advanced" : "simple";
	} catch {
		return "simple";
	}
}
var cn = [
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
], ln = [{
	value: "blink",
	label: "Blink"
}, {
	value: "indicator",
	label: "Indicator lamp (on until done)"
}], un = [
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
], dn = {
	start: "07:00",
	stop: "22:00"
}, fn = class extends A {
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
			_mode: { state: !0 },
			_defaults: { state: !0 },
			_aiNote: { state: !0 }
		};
	}
	constructor() {
		super(), this._justSaved = !1, this._lastDirty = !1, this._addLight = "", this._busy = !1, this._message = "", this._error = "", this._notes = {}, this._mode = sn(), this._defaults = null, this._aiNote = "";
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
		return this._changed(...e) ? w`<span class="unsaved-badge">Unsaved</span>` : E;
	}
	_cardClass(...e) {
		return this._changed(...e) ? "card changed" : "card";
	}
	async save() {
		if (!this.hass || !this._draft || this._busy) return !1;
		this._busy = !0, this._error = "", this._message = "";
		try {
			return await j(this.hass, this._draft), this._justSaved = !0, this._base = structuredClone(this._draft), this._message = "Saved.", !0;
		} catch (e) {
			return this._error = z(e), !1;
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
			localStorage.setItem(on, e);
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
		return w`
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
			let n = await F(this.hass, {
				service: e,
				level: t,
				start_at: 1
			});
			this._note(`phone:${e}`, n.note);
		} catch (t) {
			this._note(`phone:${e}`, z(t));
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
				let t = await P(this.hass, e);
				this._note(`light:${e.entity_id}`, t.note);
			} catch (t) {
				this._note(`light:${e.entity_id}`, z(t));
			}
		}
	}
	_setQuiet(e) {
		if (!this._draft) return;
		let t = this._draft.quiet_hours.days;
		e && Object.keys(t).length === 0 && (t = Object.fromEntries(V.map((e, t) => [String(t), { ...dn }]))), this._set({ quiet_hours: {
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
		let e = this._draft.quiet_hours, t = e.days[0], n = Object.fromEntries(V.map((e, n) => [String(n), t ? { ...t } : null]));
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
		return w`
      <section class=${this._cardClass("phones")}>
        <h2>📱 Phones ${this._badge("phones")}</h2>
        <p class="muted small">
          Boopli sends a notification with Done and Snooze buttons through the
          Home Assistant app on the phones you turn on.
        </p>
        ${t.length === 0 ? w`<p class="muted">No phones with the Home Assistant app found.</p>` : t.map((t) => {
			let n = e.phones.find((e) => e.service === t), r = this._notes[`phone:${t}`];
			return w`
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
                    ${cn.map((e) => w`<option value=${e.value} ?selected=${e.value === (n?.level ?? "normal")}>${e.label}</option>`)}
                  </select>
                  <button @click=${() => this._testPhone(t)}>Test</button>
                </div>
                ${n ? w`<div class="startrow">
                      ${this._startAtField(n.start_at ?? 1, (e) => this._setPhoneStart(t, e))}
                    </div>` : E}
                ${r ? w`<div class="note muted small">${r}</div>` : E}
              `;
		})}
      </section>
    `;
	}
	_renderLights(e) {
		let t = this._lightChoices();
		return w`
      <section class=${this._cardClass("lights")}>
        <h2>💡 Reminder lights ${this._badge("lights")}</h2>
        <p class="muted small">
          Boopli blinks a light itself and puts it back exactly as it was, or
          uses it as an indicator lamp that stays on in a color until you are
          done. Press Test to see what a light really does: lights differ a lot.
        </p>
        ${e.lights.map((e) => {
			let t = this._notes[`light:${e.entity_id}`], n = e.entity_id, r = e.mode === "blink";
			return w`
            <div class="row">
              <div class="grow">
                <div>${this._friendly(n)}</div>
                ${this.hass?.states[n] ? E : w`<div class="muted small">Not found right now</div>`}
              </div>
              <select
                aria-label="Light mode"
                .value=${e.mode}
                @change=${(e) => this._setLightMode(n, e.target.value)}
              >
                ${ln.map((t) => w`<option value=${t.value} ?selected=${t.value === e.mode}>${t.label}</option>`)}
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
            ${r ? w`
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
                ` : E}
            ${t ? w`<div class="note muted small">${t}</div>` : E}
          `;
		})}
        <div class="row add">
          <select
            aria-label="Add a light"
            .value=${this._addLight}
            @change=${(e) => this._addLight = e.target.value}
          >
            <option value="">Add a light…</option>
            ${t.map((e) => w`<option value=${e} ?selected=${e === this._addLight}>${this._friendly(e)}</option>`)}
          </select>
          <button ?disabled=${!this._addLight} @click=${() => this._addSelectedLight()}>Add</button>
        </div>
      </section>
    `;
	}
	_renderQuiet(e) {
		let t = e.quiet_hours;
		return w`
      <section class=${this._cardClass("quiet_hours")}>
        <h2>🌙 Quiet hours ${this._badge("quiet_hours")}</h2>
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
        ${t.enabled ? w`
              ${V.map((e, n) => {
			let r = t.days[String(n)] ?? null;
			return w`
                  <div class="row day">
                    <span class="dayname">${e}</span>
                    <label class="inline small">
                      <input
                        type="checkbox"
                        .checked=${r === null}
                        @change=${(e) => this._setDay(n, e.target.checked ? null : { ...dn })}
                      />
                      No limit
                    </label>
                    ${r ? w`
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
                        ` : E}
                  </div>
                `;
		})}
              <button class="chip" @click=${() => this._copyMondayToAll()}>Copy Monday to all days</button>
            ` : E}
      </section>
    `;
	}
	_renderOther(e) {
		return w`
      <section class=${this._cardClass("presence_entity", "pet_name", "snooze_minutes", "default_style")}>
        <h2>📍 Where you are, snooze and defaults ${this._badge("presence_entity", "pet_name", "snooze_minutes", "default_style")}</h2>
        <div class="field">
          <label for="presence">Where you are (optional)</label>
          <select
            id="presence"
            .value=${e.presence_entity}
            @change=${(e) => this._set({ presence_entity: e.target.value })}
          >
            <option value="" ?selected=${e.presence_entity === ""}>None (assume I am home)</option>
            ${this._persons().map((t) => w`<option value=${t} ?selected=${t === e.presence_entity}>${this._friendly(t)}</option>`)}
          </select>
          <div class="muted small">
            At home Boopli uses everything above. Away, it only uses your phone,
            and only for chores marked "anywhere".
            ${this.snapshot ? this.snapshot.is_home ? "Right now: home." : "Right now: away." : E}
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
            ${un.map((t) => w`<option value=${t.value} ?selected=${t.value === e.default_style}>${t.label}</option>`)}
          </select>
        </div>
      </section>
    `;
	}
	_setAi(e) {
		this._draft && (this._set({ ai: {
			...this._draft.ai,
			...e
		} }), this._aiNote = "");
	}
	async _loadDefaults() {
		if (!this._defaults && this.hass) try {
			this._defaults = await He(this.hass);
		} catch {
			this._defaults = {
				questions_prompt: "",
				steps_prompt: "",
				chat_room_prompt: "",
				chat_home_prompt: ""
			};
		}
	}
	async _testAi() {
		if (this.hass) {
			this._aiNote = "Asking the agent…";
			try {
				let e = await M(this.hass, "Make a cup of tea", "now", []);
				this._aiNote = `It works. The agent split "Make a cup of tea" into ${e.steps.length} steps, starting with: ${e.steps[0]?.title ?? "(none)"}`;
			} catch (e) {
				this._aiNote = z(e);
			}
		}
	}
	_renderAi(e) {
		let t = J(this.hass, ["ai_task"]), n = e.ai, r = this._defaults, i = this._changed("ai"), a = (e, t) => w`
      <div class="field">
        <label for="ai-${e}">${t}</label>
        <textarea
          id="ai-${e}"
          rows="10"
          .value=${n[e] || r?.[e] || ""}
          @input=${(t) => {
			let n = t.target.value;
			this._setAi({ [e]: r && n.trim() === r[e].trim() ? "" : n });
		}}
        ></textarea>
        <button type="button" class="chip" ?disabled=${!n[e]} @click=${() => this._setAi({ [e]: "" })}>
          Reset to the built-in prompt
        </button>
      </div>
    `;
		return w`
      <section class=${this._cardClass("ai")}>
        <h2>🤖 AI help ${this._badge("ai")}</h2>
        <p class="muted small">
          Boopli can split a task into tiny steps with your own Home Assistant AI agent. It is off until you
          switch it on. Boopli sends nothing by itself: when you use it, the text of the task and your answers
          go to the agent you choose, and nothing else (no device names, history or location). A cloud agent
          receives that text, and free models may keep or learn from what they get, so do not type private
          details. A local agent keeps everything at home.
        </p>
        <label class="inline">
          <input
            type="checkbox"
            .checked=${n.enabled}
            @change=${(e) => this._setAi({ enabled: e.target.checked })}
          />
          Switch AI help on
        </label>
        <div class="field">
          <label for="ai-agent">Which AI agent?</label>
          <select id="ai-agent" @change=${(e) => this._setAi({ entity_id: e.target.value })}>
            <option value="" .selected=${n.entity_id === ""}>Home Assistant default</option>
            ${t.map((e) => w`<option value=${e} .selected=${e === n.entity_id}>${q(this.hass, e)}</option>`)}
            ${n.entity_id && !t.includes(n.entity_id) ? w`<option value=${n.entity_id} selected>${n.entity_id} (not found)</option>` : E}
          </select>
          ${t.length === 0 ? w`<div class="muted small">No AI Task agent found in Home Assistant yet. Add one under Settings, Devices and services.</div>` : E}
        </div>
        <div class="row">
          <button type="button" ?disabled=${i || !n.enabled} @click=${() => this._testAi()}>Test the agent</button>
          ${i ? w`<span class="muted small">Save first to test.</span>` : E}
        </div>
        ${this._aiNote ? w`<div class="note muted small">${this._aiNote}</div>` : E}
        <details @toggle=${(e) => e.target.open && this._loadDefaults()}>
          <summary class="muted small">Advanced: agent for photos, and the prompts Boopli sends</summary>
          <div class="field">
            <label for="ai-photo-agent">Agent for room photos</label>
            <select
              id="ai-photo-agent"
              @change=${(e) => this._setAi({ photo_entity_id: e.target.value })}
            >
              <option value="" .selected=${(n.photo_entity_id ?? "") === ""}>The same agent as above</option>
              ${t.map((e) => w`<option value=${e} .selected=${e === n.photo_entity_id}>${q(this.hass, e)}</option>`)}
              ${n.photo_entity_id && !t.includes(n.photo_entity_id) ? w`<option value=${n.photo_entity_id} selected>${n.photo_entity_id} (not found)</option>` : E}
            </select>
            <div class="muted small">
              Only used when you describe a room from photos on the My home screen. Pick an agent whose model can
              read images. Your normal agent stays as it is.
            </div>
          </div>
          <p class="muted small">
            These are the instructions given to the agent. You can change them. Leave a prompt as it is to use the
            built-in one. The placeholders {task}, {kind}, {known} and {answers} are filled in by Boopli.
          </p>
          ${a("questions_prompt", "Questions prompt")} ${a("steps_prompt", "Steps prompt")}
          <h3>Prompts you copy into your own AI chat</h3>
          <p class="muted small">
            These are the texts the "In my own chat" buttons on My home give you to copy. Boopli fills in {room}
            (the room name), {names} (your rooms) and {known} (the notes so far, if you tick that). Keep the part that
            asks for the answer in the same shape: one short fact per line in one code block, and for the whole home
            a "## Room" heading line before each room. Boopli reads the pasted answer that way.
          </p>
          ${a("chat_room_prompt", "Chat prompt for one room")} ${a("chat_home_prompt", "Chat prompt for the whole home")}
        </details>
      </section>
    `;
	}
	_overviewCard(e, t, n, r, i, a = "Set up step by step") {
		return w`<section class="card overview">
      <h2><span class="emoji" aria-hidden="true">${e}</span> ${t}</h2>
      <div class="summary">
        ${r.length ? r.map((e) => w`<div>${e}</div>`) : w`<div class="muted">${i}</div>`}
      </div>
      <button type="button" class="primary" @click=${() => this._openWizard(n)}>${a}</button>
    </section>`;
	}
	_renderSimple() {
		let e = this.snapshot?.settings;
		if (!e) return E;
		let t = (e) => q(this.hass, e);
		return w`
      <div class="cards simple">
        ${this._overviewCard("🐻", "Your pet", "pet", [e.pet_name], "", "Rename")}
        ${this._overviewCard("📱", "Phone", "phone", e.phones.map((e) => `${Y(e.service)}: ${X[e.level] ?? e.level}, from nudge ${e.start_at}`), "No phone set up yet.")}
        ${this._overviewCard("🌙", "Quiet hours", "quiet", [Xt(e.quiet_hours)], "")}
        ${this._overviewCard("⏰", "Snooze and style", "nudging", [`Snooze ${e.snooze_minutes} minutes`, `New chores: ${Yt[e.default_style] ?? e.default_style}`], "")}
        ${this._overviewCard("💡", "Reminder lights", "lights", e.lights.map((e) => `${t(e.entity_id)}: ${Z(e)}`), "No reminder lights yet.")}
        ${this._overviewCard("🔊", "Speakers", "speakers", e.speakers.map((e) => `${t(e.entity_id)}: ${Zt(e)}`), "No speakers yet.")}
        ${this._overviewCard("🚨", "Alarm devices", "alarms", e.alarm_devices.map((e) => `${t(e.entity_id)}: on for ${e.seconds} s, from nudge ${e.start_at}`), "No alarm devices yet.")}
        ${this._overviewCard("🤖", "AI help", "ai", e.ai?.enabled ? [`On, using ${e.ai.entity_id ? t(e.ai.entity_id) : "the Home Assistant default agent"}`] : [], "Off. Splits big tasks into tiny steps with your own AI agent.")}
        ${this._overviewCard("📍", "Where you are", "presence", e.presence_entity ? [t(e.presence_entity)] : [], "Not set. Boopli assumes you are home.")}
      </div>
      <p class="muted small">
        Want to do all of it again from the start?
        <button type="button" class="chip" @click=${() => this._openWizard("first")}>Run the first setup again</button>
      </p>
    `;
	}
	_renderSaveBar() {
		return this._isDirty() ? w`<div class="savebar" role="status">
      <span><b>●</b> You have unsaved changes</span>
      <span class="spacer"></span>
      <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
      <button ?disabled=${this._busy} @click=${() => this.discard()}>Discard</button>
    </div>` : E;
	}
	render() {
		let e = this._draft;
		if (!e) return w`<p class="muted">Loading…</p>`;
		let t = this._mode === "simple";
		return w`
      <div class="toolbar">
        <h2 class="page-title">${t ? "Settings" : "Settings: advanced"}</h2>
        <button type="button" @click=${() => this._setMode(t ? "advanced" : "simple")}>
          ${t ? "Advanced settings" : "Back to the simple view"}
        </button>
      </div>
      ${t ? this._renderSimple() : w`
            <div class="cards advanced">
              <div class="slot s-speakers">
                <boopli-speakers
                  show="speakers"
                  class=${this._changed("speakers", "speech_template") ? "changed" : ""}
                  .hass=${this.hass}
                  .settings=${e}
                  @settings-patch=${(e) => this._set(e.detail)}
                ></boopli-speakers>
              </div>
              <div class="slot s-general">${this._renderOther(e)}</div>
              <div class="slot s-quiet">${this._renderQuiet(e)}</div>
              <div class="slot s-phones">${this._renderPhones(e)}</div>
              <div class="slot s-lights">${this._renderLights(e)}</div>
              <div class="slot s-alarms">
                <boopli-speakers
                  show="devices"
                  class=${this._changed("alarm_devices") ? "changed" : ""}
                  .hass=${this.hass}
                  .settings=${e}
                  @settings-patch=${(e) => this._set(e.detail)}
                ></boopli-speakers>
              </div>
              <div class="slot s-ai">${this._renderAi(e)}</div>
            </div>
            ${this._error ? w`<div class="error">${this._error}</div>` : E}
            <div class="save">
              <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save settings</button>
              ${this._message ? w`<span class="muted">${this._message}</span>` : E}
            </div>
          `}
      ${this._renderSaveBar()}
    `;
	}
	static {
		this.styles = [G, o`
      textarea {
        font: inherit;
        width: 100%;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        resize: vertical;
        margin-bottom: 6px;
      }
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
      .cards.advanced {
        /* The browser balances the columns, so they end at about the same height
           and a short card is never pushed far down. */
        display: block;
        column-count: 3;
        column-gap: 16px;
      }
      .slot {
        break-inside: avoid;
        margin: 0 0 16px;
      }
      /* Narrow screens: one column, the most used cards first. */
      @media (max-width: 1100px) {
        .cards.advanced {
          display: flex;
          flex-direction: column;
          column-count: auto;
          gap: 16px;
        }
        .slot {
          margin: 0;
        }
        .s-general { order: 1; }
        .s-quiet { order: 2; }
        .s-phones { order: 3; }
        .s-lights { order: 4; }
        .s-speakers { order: 5; }
        .s-alarms { order: 6; }
        .s-ai { order: 7; }
      }
      .cards.simple {
        /* Cards in a row are the same height, and none is smaller than this. */
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        grid-auto-rows: minmax(200px, auto);
        align-items: stretch;
      }
      .overview {
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 100%;
      }
      .overview h2 {
        margin: 0;
        font-size: 20px;
      }
      .emoji {
        display: inline-block;
        margin-right: 6px;
        font-size: 24px;
        vertical-align: -2px;
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
      boopli-speakers[show="speakers"].changed::before {
        content: "● Unsaved changes in speakers";
        display: block;
        color: var(--warning-color, #ffa600);
        font-size: 13px;
        font-weight: 500;
        padding: 0 0 6px 4px;
      }
      boopli-speakers[show="devices"].changed::before {
        content: "● Unsaved changes in alarm devices";
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
customElements.define("boopli-settings", fn);
// src/boopli-home.ts
var pn = 2e3, Q = 4, mn = 8e5;
async function hn(e) {
	let t = URL.createObjectURL(e);
	try {
		let e = await new Promise((e, n) => {
			let r = new Image();
			r.onload = () => e(r), r.onerror = () => n(/* @__PURE__ */ Error("This photo could not be opened. Try a JPEG or PNG photo.")), r.src = t;
		}), n = "";
		for (let [t, r] of [
			[1280, .8],
			[1024, .65],
			[800, .5]
		]) {
			let i = Math.min(1, t / Math.max(e.naturalWidth, e.naturalHeight)), a = document.createElement("canvas");
			a.width = Math.max(1, Math.round(e.naturalWidth * i)), a.height = Math.max(1, Math.round(e.naturalHeight * i));
			let o = a.getContext("2d");
			if (!o) throw Error("This browser cannot prepare photos.");
			if (o.drawImage(e, 0, 0, a.width, a.height), n = a.toDataURL("image/jpeg", r), n.length <= mn) break;
		}
		return n;
	} finally {
		URL.revokeObjectURL(t);
	}
}
function gn() {
	return `r${Math.random().toString(36).slice(2, 10)}`;
}
var _n = class extends A {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			_draft: { state: !0 },
			_base: { state: !0 },
			_newName: { state: !0 },
			_showHidden: { state: !0 },
			_iv: { state: !0 },
			_tool: { state: !0 },
			_busy: { state: !0 },
			_error: { state: !0 },
			_message: { state: !0 }
		};
	}
	constructor() {
		super(), this._justSaved = !1, this._lastDirty = !1, this._synced = !1, this._newName = "", this._showHidden = !1, this._iv = null, this._tool = null, this._busy = !1, this._error = "", this._message = "";
	}
	willUpdate() {
		let e = this.snapshot?.home;
		e && (!this._draft || !this._base ? (this._base = structuredClone(e), this._draft = structuredClone(e)) : this._justSaved && JSON.stringify(e) !== JSON.stringify(this._base) && (this._base = structuredClone(e), this._draft = structuredClone(e), this._justSaved = !1));
	}
	updated() {
		!this._synced && this.hass && (this._synced = !0, ze(this.hass).then((e) => {
			this._isDirty() || (this._base = structuredClone(e), this._draft = structuredClone(e));
		}).catch(() => void 0));
		let e = this._isDirty();
		e !== this._lastDirty && (this._lastDirty = e, this.dispatchEvent(new CustomEvent("dirty-change", {
			detail: {
				source: "home",
				dirty: e
			},
			bubbles: !0,
			composed: !0
		})));
	}
	_isDirty() {
		return !!this._draft && !!this._base && JSON.stringify(this._draft) !== JSON.stringify(this._base);
	}
	_roomChanged(e) {
		let t = this._draft?.rooms.find((t) => t.id === e), n = this._base?.rooms.find((t) => t.id === e);
		return JSON.stringify(t) !== JSON.stringify(n);
	}
	async save() {
		if (!this.hass || !this._draft || this._busy) return !1;
		this._busy = !0, this._error = "", this._message = "";
		try {
			return await Re(this.hass, this._draft), this._justSaved = !0, this._base = structuredClone(this._draft), this._message = "Saved.", !0;
		} catch (e) {
			return this._error = z(e), !1;
		} finally {
			this._busy = !1;
		}
	}
	discard() {
		this._base && (this._draft = structuredClone(this._base)), this._iv = null, this._tool = null, this._message = "", this._error = "";
	}
	_patchRoom(e, t) {
		this._draft && (this._draft = {
			...this._draft,
			rooms: this._draft.rooms.map((n) => n.id === e ? {
				...n,
				...t
			} : n)
		}, this._message = "");
	}
	_addRoom() {
		let e = this._newName.trim();
		e && this._draft && (this._draft = {
			...this._draft,
			rooms: [...this._draft.rooms, {
				id: gn(),
				name: e,
				area_id: "",
				notes: "",
				hidden: !1
			}]
		}, this._newName = "", this._message = "");
	}
	_removeRoom(e) {
		this._draft && (e.area_id ? this._patchRoom(e.id, { hidden: !0 }) : this._draft = {
			...this._draft,
			rooms: this._draft.rooms.filter((t) => t.id !== e.id)
		});
	}
	_aiOn() {
		return !!this.snapshot?.settings.ai?.enabled;
	}
	_room(e) {
		return this._draft?.rooms.find((t) => t.id === e);
	}
	async _startInterview(e) {
		this.hass && (this._error = "", this._iv = {
			roomId: e.id,
			source: "ai",
			phase: "working",
			questions: [],
			picked: [],
			typed: [],
			extra: "",
			answers: [],
			result: "",
			round: 0
		}, await this._askQuestions([]));
	}
	_review(e, t, n) {
		this._tool = null, this._iv = {
			roomId: e,
			source: t,
			phase: "review",
			questions: [],
			picked: [],
			typed: [],
			extra: "",
			answers: [],
			result: n,
			round: 0
		};
	}
	_openPhotos(e) {
		this._error = "", this._message = "", this._tool = {
			kind: "photos",
			roomId: e.id,
			photos: [],
			working: !1,
			sending: !1
		};
	}
	_patchTool(e) {
		this._tool &&= {
			...this._tool,
			...e
		};
	}
	async _addPhotos(e) {
		let t = this._tool;
		if (!e || t?.kind !== "photos") return;
		let n = Math.max(0, Q - t.photos.length);
		this._error = "", this._patchTool({ working: !0 });
		try {
			let t = [];
			for (let r of Array.from(e).slice(0, n)) t.push(await hn(r));
			let r = this._tool;
			r?.kind === "photos" && this._patchTool({ photos: [...r.photos, ...t] }), e.length > n && (this._error = `Up to ${Q} photos per room. The rest were left out.`);
		} catch (e) {
			this._error = z(e);
		}
		this._patchTool({ working: !1 });
	}
	async _sendPhotos() {
		let e = this._tool, t = e?.kind === "photos" ? this._room(e.roomId) : void 0;
		if (this.hass && e?.kind === "photos" && t && e.photos.length) {
			this._error = "", this._patchTool({
				working: !0,
				sending: !0
			});
			try {
				let n = await Ye(this.hass, t.name, t.notes, e.photos);
				this._review(t.id, "photos", n.notes);
			} catch (e) {
				this._error = z(e), this._patchTool({
					working: !1,
					sending: !1
				});
			}
		}
	}
	_liveRooms() {
		return (this._draft?.rooms ?? []).filter((e) => !e.hidden);
	}
	_hasNotes(e) {
		return e ? !!this._room(e)?.notes.trim() : this._liveRooms().some((e) => e.notes.trim());
	}
	async _openChat(e) {
		this._error = "", this._message = "", this._tool = {
			kind: "chat",
			roomId: e?.id ?? "",
			prompt: "",
			include: !0,
			pasted: "",
			working: !1,
			copied: !1
		}, await this._loadPrompt();
	}
	async _loadPrompt() {
		let e = this._tool;
		if (!this.hass || e?.kind !== "chat") return;
		let t = e.roomId ? this._room(e.roomId) : void 0;
		try {
			let n = await Xe(this.hass, e.include, t?.name ?? "", t?.notes ?? "", t ? void 0 : this._liveRooms().map((e) => ({
				name: e.name,
				notes: e.notes
			})));
			this._patchTool({
				prompt: n,
				copied: !1
			});
		} catch (e) {
			this._error = z(e);
		}
	}
	async _copyPrompt() {
		let e = this._tool;
		if (e?.kind !== "chat") return;
		let t = !1;
		try {
			await navigator.clipboard.writeText(e.prompt), t = !0;
		} catch {
			let e = this.renderRoot.querySelector("#promptbox");
			e && (e.select(), t = document.execCommand("copy"));
		}
		this._patchTool({ copied: t }), t || (this._error = "Copying did not work here. Select the text in the box and copy it yourself.");
	}
	async _readPasted() {
		let e = this._tool;
		if (this.hass && e?.kind === "chat" && e.pasted.trim()) {
			this._error = "", this._patchTool({ working: !0 });
			try {
				if (e.roomId) {
					let t = await Ze(this.hass, e.pasted);
					this._review(e.roomId, "paste", t.notes);
				} else {
					let t = await Qe(this.hass, e.pasted, this._liveRooms().map((e) => ({
						id: e.id,
						name: e.name
					})));
					this._tool = {
						kind: "flat",
						items: t.map((e) => ({
							...e,
							on: !0
						}))
					};
				}
			} catch (e) {
				this._error = z(e), this._patchTool({ working: !1 });
			}
		}
	}
	_patchFlat(e, t) {
		let n = this._tool;
		n?.kind === "flat" && this._patchTool({ items: n.items.map((n, r) => r === e ? {
			...n,
			...t
		} : n) });
	}
	_applyFlat() {
		let e = this._tool;
		if (e?.kind !== "flat" || !this._draft) return;
		let t = [...this._draft.rooms], n = 0;
		for (let r of e.items) {
			let e = r.notes.trim().slice(0, pn);
			r.on && e && (n += 1, r.id && t.some((e) => e.id === r.id) ? t = t.map((t) => t.id === r.id ? {
				...t,
				notes: e
			} : t) : t.push({
				id: gn(),
				name: r.name,
				area_id: "",
				notes: e,
				hidden: !1
			}));
		}
		this._draft = {
			...this._draft,
			rooms: t
		}, this._tool = null, this._message = n ? `Notes for ${n} ${n === 1 ? "room" : "rooms"} are in. Press Save to keep them.` : "Nothing was used.";
	}
	async _askQuestions(e) {
		let t = this._iv, n = t && this._room(t.roomId);
		if (this.hass && t && n) {
			this._iv = {
				...t,
				phase: "working",
				answers: e
			};
			try {
				let r = await Be(this.hass, n.name, n.notes, e);
				if (r.enough || r.questions.length === 0) {
					await this._writeNotes(e);
					return;
				}
				this._iv = {
					...t,
					answers: e,
					phase: "questions",
					questions: r.questions,
					picked: r.questions.map(() => []),
					typed: r.questions.map(() => ""),
					extra: "",
					round: t.round + 1
				};
			} catch (e) {
				this._error = z(e), this._iv = null;
			}
		}
	}
	async _writeNotes(e) {
		let t = this._iv, n = t && this._room(t.roomId);
		if (this.hass && t && n) {
			this._iv = {
				...t,
				phase: "working",
				answers: e
			};
			try {
				let r = await Ve(this.hass, n.name, n.notes, e);
				this._iv = {
					...t,
					answers: e,
					phase: "review",
					result: r.notes
				};
			} catch (e) {
				this._error = z(e), this._iv = null;
			}
		}
	}
	_currentAnswers(e) {
		let t = [];
		return e.questions.forEach((n, r) => {
			let i = [...e.picked[r], e.typed[r].trim()].filter(Boolean);
			i.length && t.push({
				question: n.text,
				answer: i.join(", ")
			});
		}), e.extra.trim() && t.push({
			question: "Anything else about this room?",
			answer: e.extra.trim()
		}), t;
	}
	_patchIv(e) {
		this._iv &&= {
			...this._iv,
			...e
		};
	}
	_acceptNotes() {
		let e = this._iv;
		e && (this._patchRoom(e.roomId, { notes: e.result.trim().slice(0, pn) }), this._iv = null);
	}
	_renderQuestion(e, t, n) {
		let r = n.picked[t] ?? [];
		return w`<div class="question">
      <div class="qtext">${e.text}</div>
      <div class="chips">
        ${e.options.map((n) => {
			let i = r.includes(n);
			return w`<button
            type="button"
            class="chip big ${i ? "on" : ""}"
            aria-pressed=${i}
            @click=${() => {
				let r = this._iv?.picked[t] ?? [], i = r.includes(n), a = e.multiple ? i ? r.filter((e) => e !== n) : [...r, n] : i ? [] : [n];
				this._patchIv({ picked: (this._iv?.picked ?? []).map((e, n) => n === t ? a : e) });
			}}
          >
            ${n}
          </button>`;
		})}
      </div>
      <textarea
        rows="1"
        class="own"
        placeholder="Or write it in your own words"
        .value=${n.typed[t] ?? ""}
        @input=${(e) => this._patchIv({ typed: (this._iv?.typed ?? []).map((n, r) => r === t ? e.target.value : n) })}
      ></textarea>
    </div>`;
	}
	_renderInterview(e) {
		let t = this._room(e.roomId);
		return w`<section class="card interview">
      <div class="top">
        <h2>${t?.name ?? "Room"}: let me ask</h2>
        <button type="button" class="link" @click=${() => this._iv = null}>Cancel</button>
      </div>
      ${e.phase === "working" ? w`<div class="working" role="status">
            <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>${e.answers.length ? "Writing the notes…" : "Thinking…"}</span>
          </div>` : E}
      ${e.phase === "questions" ? w`
            <p class="muted small">
              ${e.round > 1 ? "A few more things." : "A few quick questions about this room."} Tap what fits, or write as
              much as you like. You can skip any question.
            </p>
            ${e.questions.map((t, n) => this._renderQuestion(t, n, e))}
            <div class="question">
              <div class="qtext">Anything else about this room?</div>
              <textarea
                rows="2"
                class="own"
                placeholder="Optional. Long answers are welcome."
                .value=${e.extra}
                @input=${(e) => this._patchIv({ extra: e.target.value })}
              ></textarea>
            </div>
            <div class="actions">
              <button class="primary big" @click=${() => this._askQuestions([...e.answers, ...this._currentAnswers(e)])}>
                Next questions
              </button>
              <button class="big" @click=${() => this._writeNotes([...e.answers, ...this._currentAnswers(e)])}>
                Enough, write the notes
              </button>
            </div>
          ` : E}
      ${e.phase === "review" ? w`
            <p>
              ${e.source === "paste" ? "This is what I read from what you pasted." : e.source === "photos" ? "This is what the AI saw in your photos. The photos are already gone." : "This is what I would write down."}
              Change anything that is wrong.
              ${t?.notes ? w`<b>It replaces the notes you have now.</b>` : E}
              Nothing is saved until you press Save afterwards.
            </p>
            <textarea
              rows="8"
              class="notes"
              aria-label="Proposed notes"
              .value=${e.result}
              @input=${(e) => this._patchIv({ result: e.target.value })}
            ></textarea>
            <div class="actions">
              <button class="primary big" ?disabled=${!e.result.trim()} @click=${() => this._acceptNotes()}>Use these notes</button>
              ${e.source !== "paste" && this._aiOn() ? w`<button class="big" @click=${() => this._askQuestions(e.answers)}>Ask me more</button>` : E}
              <button class="big" @click=${() => this._iv = null}>Throw away</button>
            </div>
          ` : E}
    </section>`;
	}
	_renderTool(e) {
		return e.kind === "photos" ? this._renderPhotos(e) : e.kind === "chat" ? this._renderChat(e) : this._renderFlat(e);
	}
	_renderPhotos(e) {
		let t = this._room(e.roomId), n = e.photos.length >= Q;
		return w`<section class="card interview">
      <div class="top">
        <h2>${t?.name ?? "Room"}: describe it from photos</h2>
        <button type="button" class="link" ?disabled=${e.sending} @click=${() => this._tool = null}>Cancel</button>
      </div>
      <p class="muted">
        Take or pick up to ${Q} photos of this room. They go once to your AI agent, which writes down what it
        sees. Boopli does not keep them: they are not saved anywhere, and later requests carry only the notes.
      </p>
      ${this._error ? w`<div class="error">${this._error}</div>` : E}
      ${e.sending ? w`<div class="working" role="status">
            <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>The AI is looking at your photos…</span>
          </div>` : w`
            <div class="thumbs">
              ${e.photos.map((t, n) => w`<div class="thumb">
                  <img src=${t} alt="Photo ${n + 1}" />
                  <button
                    type="button"
                    class="x"
                    aria-label="Remove photo ${n + 1}"
                    @click=${() => this._patchTool({ photos: e.photos.filter((e, t) => t !== n) })}
                  >
                    ×
                  </button>
                </div>`)}
            </div>
            <div class="actions">
              <label class="filebtn big ${n || e.working ? "off" : ""}">
                ${e.working ? "Preparing…" : e.photos.length ? "Add another photo" : "Take or pick photos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ?disabled=${n || e.working}
                  @change=${(e) => {
			let t = e.target;
			this._addPhotos(t.files).then(() => t.value = "");
		}}
                />
              </label>
              <button class="primary big" ?disabled=${!e.photos.length || e.working} @click=${() => this._sendPhotos()}>
                Describe the room
              </button>
            </div>
            <p class="muted small">
              The agent has to be able to read images. If it cannot, you can pick another one for photos in Settings
              under AI help, Advanced.
            </p>
          `}
    </section>`;
	}
	_renderChat(e) {
		let t = e.roomId ? this._room(e.roomId) : void 0, n = !e.roomId;
		return w`<section class="card interview">
      <div class="top">
        <h2>${n ? "My whole home" : t?.name ?? "Room"}: talk it out in your own AI chat</h2>
        <button type="button" class="link" @click=${() => this._tool = null}>Cancel</button>
      </div>
      <p class="muted">
        Use any chat you like, for example one you can talk to by voice. Boopli sends nothing: you copy and paste
        yourself, so this works even with AI help switched off.
      </p>
      ${this._error ? w`<div class="error">${this._error}</div>` : E}
      <ol class="stepslist">
        <li>
          <b>Copy this</b> and paste it into your chat.
          ${this._hasNotes(e.roomId) ? w`<label class="inline">
                <input
                  type="checkbox"
                  .checked=${e.include}
                  @change=${(e) => {
			this._patchTool({ include: e.target.checked }), this._loadPrompt();
		}}
                />
                Include what I have written so far
              </label>` : E}
          <textarea id="promptbox" class="promptbox" rows="7" readonly .value=${e.prompt}></textarea>
          <div class="actions">
            <button class="primary big" ?disabled=${!e.prompt} @click=${() => this._copyPrompt()}>
              ${e.copied ? "Copied ✓" : "Copy the prompt"}
            </button>
          </div>
        </li>
        <li>
          <b>Talk it through</b> with the chat. When you say you are done, it answers with the notes.
        </li>
        <li>
          <b>Copy the notes</b> it gives back and paste them here.
          <textarea
            class="pastebox"
            rows="6"
            aria-label="Pasted notes"
            placeholder=${n ? "## Kitchen\nDishwasher is under the counter\n## Bedroom\n…" : "Dishwasher is under the counter\nBalcony door sticks"}
            .value=${e.pasted}
            @input=${(e) => this._patchTool({ pasted: e.target.value })}
          ></textarea>
          <div class="actions">
            <button class="primary big" ?disabled=${!e.pasted.trim() || e.working} @click=${() => this._readPasted()}>
              ${e.working ? "Reading…" : "Read the notes"}
            </button>
          </div>
        </li>
      </ol>
    </section>`;
	}
	_renderFlat(e) {
		let t = e.items.filter((e) => e.on && e.notes.trim()).length;
		return w`<section class="card interview">
      <div class="top">
        <h2>My whole home: what I found</h2>
        <button type="button" class="link" @click=${() => this._tool = null}>Cancel</button>
      </div>
      <p>
        Here are the rooms in what you pasted. Change anything that is wrong, and untick a room you do not want.
        Nothing is saved until you press Save afterwards.
      </p>
      ${e.items.map((e, t) => {
			let n = e.id ? this._room(e.id) : void 0;
			return w`<div class="question">
          <label class="inline qtext">
            <input type="checkbox" .checked=${e.on} @change=${(e) => this._patchFlat(t, { on: e.target.checked })} />
            ${e.name}
            <span class="tag">${e.id ? "your room" : "new room"}</span>
          </label>
          ${n?.notes.trim() ? w`<div class="muted small">It replaces the notes this room has now.</div>` : E}
          <textarea
            class="notes"
            rows="5"
            aria-label="Notes for ${e.name}"
            .value=${e.notes}
            @input=${(e) => this._patchFlat(t, { notes: e.target.value })}
          ></textarea>
        </div>`;
		})}
      <div class="actions">
        <button class="primary big" ?disabled=${t === 0} @click=${() => this._applyFlat()}>
          Use ${t} ${t === 1 ? "room" : "rooms"}
        </button>
        <button class="big" @click=${() => this._tool = null}>Throw away</button>
      </div>
    </section>`;
	}
	_renderRoom(e) {
		let t = this._aiOn();
		return w`<section class="card room ${this._roomChanged(e.id) ? "changed" : ""}">
      <div class="head">
        <input
          class="name"
          aria-label="Room name"
          .value=${e.name}
          @input=${(t) => this._patchRoom(e.id, { name: t.target.value })}
        />
        ${this._roomChanged(e.id) ? w`<span class="unsaved-badge">Unsaved</span>` : E}
      </div>
      ${e.area_id ? w`<div class="muted small">From your Home Assistant areas</div>` : w`<div class="muted small">Added by you</div>`}
      <label for="n-${e.id}">What should the AI know about this room?</label>
      <textarea
        id="n-${e.id}"
        class="notes"
        rows="5"
        maxlength=${pn}
        placeholder="For example: Dishwasher is under the counter. The balcony door sticks."
        .value=${e.notes}
        @input=${(t) => this._patchRoom(e.id, { notes: t.target.value })}
      ></textarea>
      <div class="row-actions">
        ${t ? w`<button type="button" ?disabled=${!e.name.trim() || this._busy} @click=${() => this._startInterview(e)}>
                ✨ Let the AI ask me
              </button>
              <button type="button" ?disabled=${!e.name.trim() || this._busy} @click=${() => this._openPhotos(e)}>
                📷 From photos
              </button>` : E}
        <button type="button" ?disabled=${!e.name.trim() || this._busy} @click=${() => this._openChat(e)}>
          💬 In my own chat
        </button>
        <span class="spacer"></span>
        <button type="button" class="link" @click=${() => this._removeRoom(e)}>${e.area_id ? "Hide" : "Delete"}</button>
      </div>
    </section>`;
	}
	_renderSaveBar() {
		return this._isDirty() ? w`<div class="savebar" role="status">
      <span><b>●</b> You have unsaved changes</span>
      <span class="spacer"></span>
      <button class="primary" ?disabled=${this._busy} @click=${() => this.save()}>Save</button>
      <button ?disabled=${this._busy} @click=${() => this.discard()}>Discard</button>
    </div>` : E;
	}
	render() {
		let e = this._draft;
		if (!e) return w`<p class="muted">Loading…</p>`;
		if (this._iv) return w`${this._renderInterview(this._iv)}${this._renderSaveBar()}`;
		if (this._tool) return w`${this._renderTool(this._tool)}${this._renderSaveBar()}`;
		let t = e.rooms.filter((e) => !e.hidden), n = e.rooms.filter((e) => e.hidden);
		return w`
      <h2>My home</h2>
      <p class="intro">
        Tell Boopli about your rooms, so the AI's small steps fit your home. The notes stay in Boopli on your Home
        Assistant. They only leave inside a request to your own AI agent, and only the notes of the rooms a task is
        about. Before you send a task, you can see exactly what goes out.
      </p>
      <label class="switch">
        <input
          type="checkbox"
          .checked=${e.enabled}
          @change=${(t) => {
			this._draft = {
				...e,
				enabled: t.target.checked
			}, this._message = "";
		}}
        />
        <span>Send room notes to the AI with my tasks</span>
      </label>
      ${this._aiOn() ? E : w`<p class="muted small">
            AI help is off, so the notes are not used yet. Turn it on in Settings. Until then you can still write the
            notes yourself.
          </p>`}
      <div class="whole">
        <button type="button" @click=${() => this._openChat(null)}>💬 Talk through my whole home in my own chat</button>
        <span class="muted small">Copy a prompt, talk it out by voice or text, paste the result back.</span>
      </div>
      ${this._error ? w`<div class="error">${this._error}</div>` : E}
      ${this._message ? w`<div class="ok">${this._message}</div>` : E}
      <div class="grid">${t.map((e) => this._renderRoom(e))}</div>
      <div class="add card">
        <label for="newroom">Add a room or place</label>
        <div class="add-row">
          <input
            id="newroom"
            placeholder="For example: Balcony"
            .value=${this._newName}
            @input=${(e) => this._newName = e.target.value}
            @keydown=${(e) => {
			e.key === "Enter" && this._addRoom();
		}}
          />
          <button type="button" class="primary" ?disabled=${!this._newName.trim()} @click=${() => this._addRoom()}>Add</button>
        </div>
      </div>
      ${n.length ? w`<details class="hiddenrooms" ?open=${this._showHidden} @toggle=${(e) => this._showHidden = e.target.open}>
            <summary>${n.length} hidden ${n.length === 1 ? "room" : "rooms"}</summary>
            ${n.map((e) => w`<div class="hiddenrow">
                <span>${e.name}</span>
                <button type="button" @click=${() => this._patchRoom(e.id, { hidden: !1 })}>Show again</button>
              </div>`)}
          </details>` : E}
      ${this._renderSaveBar()}
    `;
	}
	static {
		this.styles = [G, o`
      h2 {
        font-size: 22px;
        margin-bottom: 8px;
      }
      .intro {
        max-width: 820px;
        line-height: 1.5;
        margin: 6px 0 14px;
      }
      .small {
        font-size: 13px;
      }
      .ok {
        color: var(--success-color, #43a047);
        margin: 8px 0;
      }
      .switch {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 15px;
        color: var(--primary-text-color);
        margin: 8px 0;
        cursor: pointer;
      }
      .switch input {
        width: 20px;
        min-height: 20px;
        height: 20px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 16px;
        margin: 16px 0;
        align-items: start;
      }
      .room.changed,
      .card.changed {
        border-color: var(--warning-color, #ffa600);
      }
      .head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }
      .name {
        font-size: 17px;
        font-weight: 500;
      }
      textarea {
        font: inherit;
        width: 100%;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        resize: vertical;
      }
      .room label {
        margin-top: 12px;
      }
      .row-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
      }
      .spacer {
        flex: 1;
      }
      .link {
        border: 0;
        background: none;
        color: var(--secondary-text-color);
        text-decoration: underline;
        min-height: 0;
        padding: 4px 6px;
      }
      .add {
        max-width: 520px;
      }
      .add-row {
        display: flex;
        gap: 8px;
      }
      .hiddenrooms {
        margin: 16px 0;
        max-width: 520px;
      }
      .hiddenrooms summary {
        cursor: pointer;
        color: var(--secondary-text-color);
      }
      .hiddenrow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid var(--divider-color);
      }
      .unsaved-badge {
        display: inline-block;
        padding: 1px 8px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        color: #000;
        background: var(--warning-color, #ffa600);
        white-space: nowrap;
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
      .interview {
        padding: 24px;
        max-width: 980px;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .question {
        padding: 14px 16px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        margin: 10px 0;
        max-width: 760px;
      }
      .qtext {
        font-weight: 500;
        margin-bottom: 10px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
      }
      .own {
        min-height: 40px;
      }
      .interview .notes {
        max-width: 760px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 20px;
      }
      button.big {
        min-height: 48px;
        padding: 0 22px;
        font-size: 16px;
      }
      .whole {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin: 6px 0 4px;
      }
      .row-actions {
        flex-wrap: wrap;
      }
      .thumbs {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin: 12px 0;
      }
      .thumb {
        position: relative;
        width: 140px;
        height: 105px;
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid var(--divider-color);
      }
      .thumb .x {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 28px;
        min-height: 28px;
        height: 28px;
        padding: 0;
        border-radius: 50%;
        font-size: 18px;
        line-height: 1;
      }
      .filebtn {
        display: inline-flex;
        align-items: center;
        position: relative;
        cursor: pointer;
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
      }
      .filebtn.off {
        opacity: 0.5;
        cursor: default;
      }
      .filebtn input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
        width: 100%;
        height: 100%;
      }
      .stepslist {
        max-width: 760px;
        padding-left: 22px;
        line-height: 1.5;
      }
      .stepslist li {
        margin: 0 0 18px;
      }
      .promptbox,
      .pastebox {
        display: block;
        margin-top: 8px;
      }
      .inline {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-left: 6px;
      }
      .inline input {
        width: 20px;
        min-height: 20px;
        height: 20px;
      }
      .tag {
        font-size: 12px;
        font-weight: 400;
        padding: 1px 8px;
        border-radius: 999px;
        border: 1px solid var(--divider-color);
        color: var(--secondary-text-color);
      }
      .working {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 28px 4px;
        font-size: 18px;
      }
      .dots {
        display: inline-flex;
        gap: 6px;
      }
      .dots i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--primary-color);
        animation: bounce 1s infinite ease-in-out;
      }
      .dots i:nth-child(2) {
        animation-delay: 0.15s;
      }
      .dots i:nth-child(3) {
        animation-delay: 0.3s;
      }
      @keyframes bounce {
        0%,
        80%,
        100% {
          opacity: 0.25;
          transform: scale(0.8);
        }
        40% {
          opacity: 1;
          transform: scale(1);
        }
      }
    `];
	}
};
customElements.define("boopli-home", _n);
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
function vn(e, t, n, r) {
	let i = [];
	return t.enabled !== n.enabled && i.push(`${e} ${n.enabled ? "on" : "off"}`), n.enabled && (t.sound !== n.sound && i.push(`${e} sound ${t.sound} → ${n.sound}`), t.start_at !== n.start_at && i.push(`${e} starts at nudge ${t.start_at} → ${n.start_at}`), r && t.seconds !== n.seconds && i.push(`${e} lasts ${t.seconds} → ${n.seconds} s`), r && t.repeat_s !== n.repeat_s && i.push(`${e} repeats every ${t.repeat_s} → ${n.repeat_s} s`)), i;
}
function yn(e, t) {
	let n = [...vn("ding", e.cue, t.cue, !1), ...vn("alarm", e.alarm, t.alarm, !0)];
	return e.speech.enabled !== t.speech.enabled && n.push(`speech ${t.speech.enabled ? "on" : "off"}`), t.speech.enabled && ((e.speech.target !== t.speech.target || e.speech.route !== t.speech.route) && n.push(`speech goes to ${t.speech.target || "nothing"}`), e.speech.start_at !== t.speech.start_at && n.push(`speech starts at nudge ${e.speech.start_at} → ${t.speech.start_at}`)), n;
}
function bn(e, t, n) {
	let r = (e) => q(n, e), i = [];
	e.pet_name !== t.pet_name && i.push(`Pet name: ${e.pet_name} → ${t.pet_name}`);
	let a = $(e.phones, t.phones, (e) => e.service);
	a.added.forEach((e) => i.push(`Phone added: ${Y(e.service)} (${X[e.level] ?? e.level})`)), a.removed.forEach((e) => i.push(`Phone removed: ${Y(e.service)}`)), a.kept.forEach(({ before: e, after: t }) => {
		e.level !== t.level && i.push(`${Y(t.service)}: level ${X[e.level]} → ${X[t.level]}`), e.start_at !== t.start_at && i.push(`${Y(t.service)}: starts at nudge ${e.start_at} → ${t.start_at}`);
	});
	let o = e.quiet_hours, s = t.quiet_hours;
	if (o.enabled !== s.enabled && i.push(`Quiet hours: ${o.enabled ? "on" : "off"} → ${s.enabled ? "on" : "off"}`), s.enabled) {
		let e = (e, t) => {
			let n = e.days[String(t)] ?? null;
			return n ? `${n.start} to ${n.stop}` : "no limit";
		};
		V.forEach((t, n) => {
			let r = o.enabled ? e(o, n) : "any time", a = e(s, n);
			r !== a && i.push(`${t}: ${r} → ${a}`);
		});
	}
	e.snooze_minutes !== t.snooze_minutes && i.push(`Snooze: ${e.snooze_minutes} → ${t.snooze_minutes} min`), e.default_style !== t.default_style && i.push(`Default style: ${Yt[e.default_style]} → ${Yt[t.default_style]}`);
	let c = $(e.lights, t.lights, (e) => e.entity_id);
	c.added.forEach((e) => i.push(`Reminder light added: ${r(e.entity_id)} (${Z(e)})`)), c.removed.forEach((e) => i.push(`Reminder light removed: ${r(e.entity_id)}`)), c.kept.forEach(({ before: e, after: t }) => {
		let n = r(t.entity_id);
		e.mode !== t.mode && i.push(`${n}: ${Z(e)} → ${Z(t)}`), e.color.join() !== t.color.join() && i.push(`${n}: color changed`), e.blink_ms !== t.blink_ms && i.push(`${n}: blink length ${e.blink_ms} → ${t.blink_ms} ms`), e.repeats !== t.repeats && i.push(`${n}: blinks ${e.repeats} → ${t.repeats}`), e.gap_ms !== t.gap_ms && i.push(`${n}: pause ${e.gap_ms} → ${t.gap_ms} ms`), e.start_at !== t.start_at && i.push(`${n}: starts at nudge ${e.start_at} → ${t.start_at}`);
	});
	let l = $(e.speakers, t.speakers, (e) => e.entity_id);
	l.added.forEach((e) => i.push(`Speaker added: ${r(e.entity_id)}`)), l.removed.forEach((e) => i.push(`Speaker removed: ${r(e.entity_id)}`)), l.kept.forEach(({ before: e, after: t }) => yn(e, t).forEach((e) => i.push(`${r(t.entity_id)}: ${e}`))), e.speech_template !== t.speech_template && i.push(`Spoken sentence: ${e.speech_template} → ${t.speech_template}`);
	let u = $(e.alarm_devices, t.alarm_devices, (e) => e.entity_id);
	if (u.added.forEach((e) => i.push(`Alarm device added: ${r(e.entity_id)}`)), u.removed.forEach((e) => i.push(`Alarm device removed: ${r(e.entity_id)}`)), u.kept.forEach(({ before: e, after: t }) => {
		e.seconds !== t.seconds && i.push(`${r(t.entity_id)}: on for ${e.seconds} → ${t.seconds} s`), e.start_at !== t.start_at && i.push(`${r(t.entity_id)}: starts at nudge ${e.start_at} → ${t.start_at}`);
	}), e.ai.enabled !== t.ai.enabled && i.push(`AI help: ${e.ai.enabled ? "on" : "off"} → ${t.ai.enabled ? "on" : "off"}`), e.ai.entity_id !== t.ai.entity_id) {
		let n = (e) => e ? r(e) : "the Home Assistant default";
		i.push(`AI agent: ${n(e.ai.entity_id)} → ${n(t.ai.entity_id)}`);
	}
	if ((e.ai.photo_entity_id ?? "") !== (t.ai.photo_entity_id ?? "")) {
		let n = (e) => e ? r(e) : "the same agent";
		i.push(`Agent for photos: ${n(e.ai.photo_entity_id ?? "")} → ${n(t.ai.photo_entity_id ?? "")}`);
	}
	if (e.ai.questions_prompt !== t.ai.questions_prompt && i.push("AI questions prompt changed"), e.ai.steps_prompt !== t.ai.steps_prompt && i.push("AI steps prompt changed"), (e.ai.chat_room_prompt ?? "") !== (t.ai.chat_room_prompt ?? "") && i.push("Chat prompt for one room changed"), (e.ai.chat_home_prompt ?? "") !== (t.ai.chat_home_prompt ?? "") && i.push("Chat prompt for the whole home changed"), e.presence_entity !== t.presence_entity) {
		let n = (e) => e ? r(e) : "not set";
		i.push(`Where you are: ${n(e.presence_entity)} → ${n(t.presence_entity)}`);
	}
	return i;
}
// src/boopli-wizard.ts
var xn = {
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
	pet: ["pet", "done"],
	ai: [
		"ai_intro",
		"ai_agent",
		"done"
	]
}, Sn = [
	"spk_pick",
	"spk_ding",
	"spk_speech",
	"spk_alarm",
	"alarm_devices"
], Cn = {
	first: "First setup",
	phone: "Phone setup",
	quiet: "Quiet hours setup",
	lights: "Reminder lights setup",
	speakers: "Speaker setup",
	alarms: "Alarm devices setup",
	presence: "Where you are",
	nudging: "Snooze and style",
	pet: "Your pet",
	ai: "AI help setup"
}, wn = {
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
	ai_intro: "AI help",
	ai_agent: "Your AI agent",
	chores: "First chores",
	done: "All set"
}, Tn = [
	"phone_detail",
	"lights_detail",
	"spk_when",
	"alarm_detail"
], En = [
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
], Dn = [
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
], On = [
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
], kn = [{
	value: "alexa",
	label: "Alexa sound"
}, {
	value: "file",
	label: "File in my media folder"
}], An = "https://developer.amazon.com/en-US/docs/alexa/custom-skills/ask-soundlibrary.html", jn = [
	0,
	1,
	2,
	3,
	4,
	5,
	6
], Mn = class extends A {
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
		this._started = !0, this._saved = structuredClone(this.snapshot.settings), this._baseline = structuredClone(this.snapshot.settings), this._draft = structuredClone(this.snapshot.settings), this._steps = [...xn[this.wizard]];
		let e = this.startAt;
		if (this._first && Sn.includes(e)) {
			let e = this._steps.indexOf("speaker_gate");
			this._steps.splice(e + 1, 0, ...Sn);
		}
		let t = this._steps.indexOf(e);
		this._index = t >= 0 ? t : 0, this._picked = K.filter((e) => !this.snapshot.chores.some((t) => t.name === e.draft.name)).map((e) => e.label), this.snapshot.settings.speakers.length === 1 && (this._speaker = this.snapshot.settings.speakers[0].entity_id), this._enter();
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
		return q(this.hass, e);
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
		return w`<label class="num">
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
					await j(this.hass, this._draft), this._saved = structuredClone(this._draft);
				}
				e === 1 && t === "skip" && (this._draft = structuredClone(this._saved), this._step === "chores" && (this._picked = [])), t === "gate" && (this._steps = [
					...this._steps.slice(0, this._index + 1),
					...Sn,
					...this._steps.slice(this._index + 1)
				]);
				let n = Math.max(0, Math.min(this._index + e, this._steps.length - 1));
				this._first && await N(this.hass, "in_progress", this._steps[n]), this._index = n, this._enter();
			} catch (e) {
				this._error = z(e);
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
				this._first && await N(this.hass, "skipped", this._step), this._close();
			} catch (e) {
				this._error = z(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	async _finish() {
		if (this.hass && this._draft && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				if (await j(this.hass, this._draft), this._first) {
					for (let e of K.filter((e) => this._picked.includes(e.label))) await R(this.hass, {
						...e.draft,
						repeat: {
							type: "none",
							time: "09:00",
							every_n_days: 1,
							days: {}
						}
					});
					await N(this.hass, "done", "");
				}
				this._close();
			} catch (e) {
				this._error = z(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_setQuiet(e) {
		if (!this._draft) return;
		let t = this._draft.quiet_hours.days;
		e && Object.keys(t).length === 0 && (t = Object.fromEntries(jn.map((e) => [String(e), { ...Ht }]))), this._set({ quiet_hours: {
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
			days: Object.fromEntries(jn.map((e) => [String(e), t ? { ...t } : null]))
		} });
	}
	async _try(e, t) {
		this._note(e, "Testing…");
		try {
			this._note(e, (await t()).note);
		} catch (t) {
			this._note(e, z(t));
		}
	}
	_noteLine(e) {
		let t = this._notes[e];
		return t ? w`<div class="muted small note">${t}</div>` : E;
	}
	_renderWelcome(e) {
		return w`
      <p>
        Boopli breaks chores into small steps and nudges you with the lights, speakers and phone
        you already have. A few quick questions, and you can skip any of them. Nothing leaves your
        home, and nothing is sent to a device until you press a Test button.
      </p>
      ${this._renderPet(e)}
    `;
	}
	_renderPet(e) {
		return w`<div class="field">
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
		return w`
      <p>
        Which phone should get Boopli's notifications? They have <b>Done</b> and <b>Snooze</b>
        buttons, so you can answer without opening anything.
      </p>
      ${t.length === 0 ? w`<p class="muted">
            No phone with the Home Assistant app found. Install the app and sign in, then come back.
            You can skip this for now.
          </p>` : w`<div class="list">
            ${t.map((t) => {
			let n = e.phones.find((e) => e.service === t);
			return w`<div class="choice">
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
                  ${Y(t)}
                </label>
                <button type="button" @click=${() => this._try(`phone:${t}`, () => F(this.hass, {
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
		return e.phones.length === 0 ? w`<p class="muted">No phone is set up yet. Skip this.</p>` : w`
      <p>
        How loud should each phone be, and from which nudge on? Nudge 1 is the first one for a step.
        You can leave the defaults.
      </p>
      <div class="list">
        ${e.phones.map((t) => w`<div class="choice col">
            <b>${Y(t.service)}</b>
            <label class="num">
              Notification level
              <select
                @change=${(n) => this._set({ phones: e.phones.map((e) => e.service === t.service ? {
			...e,
			level: n.target.value
		} : e) })}
              >
                ${Dn.map((e) => w`<option value=${e.value} .selected=${e.value === t.level}>${e.label}</option>`)}
              </select>
            </label>
            ${this._numField("Starts at nudge #", t.start_at ?? 1, 1, 20, (n) => this._set({ phones: e.phones.map((e) => e.service === t.service ? {
			...e,
			start_at: n
		} : e) }))}
            <button type="button" @click=${() => this._try(`phone:${t.service}`, () => F(this.hass, t))}>Send a test</button>
            ${this._noteLine(`phone:${t.service}`)}
          </div>`)}
      </div>
    `;
	}
	_renderQuiet(e) {
		let t = e.quiet_hours;
		return w`
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
      ${t.enabled ? w`
            <div class="days">
              ${jn.map((e) => {
			let n = t.days[String(e)] ?? null;
			return w`<div class="dayrow">
                  <span class="dayname">${V[e]}</span>
                  <label class="inline small">
                    <input
                      type="checkbox"
                      .checked=${n === null}
                      @change=${(t) => this._setDay(e, t.target.checked ? null : { ...Ht })}
                    />
                    No limit
                  </label>
                  ${n ? w`<span class="muted small">from</span>
                        <input
                          type="time"
                          aria-label="${V[e]} from"
                          .value=${n.start}
                          @input=${(t) => this._setDay(e, {
				...n,
				start: t.target.value
			})}
                        />
                        <span class="muted small">until</span>
                        <input
                          type="time"
                          aria-label="${V[e]} until"
                          .value=${n.stop}
                          @input=${(t) => this._setDay(e, {
				...n,
				stop: t.target.value
			})}
                        />` : E}
                  ${e > 0 ? w`<button type="button" class="chip" @click=${() => this._copyDayAbove(e)}>Same as ${V[e - 1]}</button>` : E}
                </div>`;
		})}
            </div>
            <button type="button" class="chip" @click=${() => this._copyMondayToAll()}>Copy Monday to all days</button>
          ` : E}
    `;
	}
	_renderNudging(e) {
		return w`
      <div class="field">
        <label for="snooze">When you press Snooze, how many minutes until the next nudge?</label>
        <div class="chips">
          ${[
			5,
			10,
			15,
			30
		].map((t) => w`<button type="button" class="chip ${e.snooze_minutes === t ? "on" : ""}" @click=${() => this._set({ snooze_minutes: t })}>${t} min</button>`)}
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
      ${En.map((t) => w`<label class="inline option">
          <input type="radio" name="style" .checked=${e.default_style === t.value} @change=${() => this._set({ default_style: t.value })} />
          <span><b>${t.label}</b> <span class="muted small">${t.text}</span></span>
        </label>`)}
    `;
	}
	_renderLights(e) {
		let t = J(this.hass, ["light"]);
		return w`
      <p>
        Which lights should remind you? Each one either <b>blinks</b> when a step is your turn, or
        is a <b>status light</b> that turns on and stays on until you are done. This is optional.
      </p>
      ${t.length === 0 ? w`<p class="muted">No lights found.</p>` : w`<div class="list grid">
            ${t.map((t) => {
			let n = e.lights.find((e) => e.entity_id === t);
			return w`<div class="choice col">
                <label class="inline">
                  <input
                    type="checkbox"
                    .checked=${!!n}
                    @change=${(n) => {
				let r = n.target.checked, i = e.lights.filter((e) => e.entity_id !== t);
				this._set({ lights: r ? [...i, Wt(t)] : i });
			}}
                  />
                  ${this._fn(t)}
                </label>
                ${n ? w`<div class="radios">
                      ${["blink", "indicator"].map((r) => w`<label class="inline small">
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
                      <button type="button" @click=${() => this._try(`light:${t}`, () => P(this.hass, n))}>Test</button>
                    </div>
                    ${this._noteLine(`light:${t}`)}` : E}
              </div>`;
		})}
          </div>`}
    `;
	}
	_renderLightDetail(e) {
		return e.lights.length === 0 ? w`<p class="muted">No reminder light is set up yet. Skip this.</p>` : w`
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
			return w`<div class="choice col">
            <b>${this._fn(t.entity_id)}</b>
            <label class="num">
              Color
              <input type="color" class="swatch" .value=${Jt(t.color)} @input=${(e) => n({ color: qt(e.target.value) })} />
            </label>
            ${t.mode === "blink" ? w`${this._numField("Blink length (ms)", t.blink_ms, 100, 3e4, (e) => n({ blink_ms: e }), 100)}
                ${this._numField("Number of blinks", t.repeats, 1, 5, (e) => n({ repeats: e }))}
                ${this._numField("Pause between blinks (ms)", t.gap_ms, 0, 3e4, (e) => n({ gap_ms: e }), 100)}` : w`<span class="muted small">A status light has no blink settings.</span>`}
            ${this._numField("Starts at nudge #", t.start_at ?? 1, 1, 20, (e) => n({ start_at: e }))}
            <button type="button" @click=${() => this._try(`light:${t.entity_id}`, () => P(this.hass, t))}>Test</button>
            ${this._noteLine(`light:${t.entity_id}`)}
          </div>`;
		})}
      </div>
    `;
	}
	_renderGate() {
		return w`
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
		let t = J(this.hass, ["media_player"]);
		return w`
      <p>Which speaker do you want to set up? You can add more speakers afterwards.</p>
      ${t.length === 0 ? w`<p class="muted">No speakers (media players) found.</p>` : w`<div class="list grid">
            ${t.map((t) => {
			let n = e.speakers.find((e) => e.entity_id === t);
			return w`<label class="inline option card-choice">
                <input
                  type="radio"
                  name="speaker"
                  .checked=${this._speaker === t}
                  @change=${() => {
				this._speaker = t, n || this._set({ speakers: [...e.speakers, Gt(t)] });
			}}
                />
                <span>
                  ${this._fn(t)}
                  ${n ? w`<span class="muted small"><br />set up: ${Zt(n)}</span>` : E}
                </span>
              </label>`;
		})}
          </div>`}
    `;
	}
	_noSpeaker() {
		return w`<p class="muted">Pick a speaker first. Press Back.</p>`;
	}
	_soundBlock(e, t, n, r) {
		let i = t[e];
		return w`
      <p>${n}</p>
      <label class="inline option">
        <input type="checkbox" .checked=${i.enabled} @change=${(t) => this._patchSound(e, { enabled: t.target.checked })} />
        Use this on ${this._fn(t.entity_id)}
      </label>
      ${i.enabled ? w`<div class="fields">
            <label class="num">
              Sound type
              <select @change=${(t) => this._patchSound(e, { kind: t.target.value })}>
                ${kn.map((e) => w`<option value=${e.value} .selected=${e.value === i.kind}>${e.label}</option>`)}
              </select>
            </label>
            <label class="num wide">
              ${i.kind === "alexa" ? "Alexa sound id" : "File in the media folder (or a URL)"}
              <input .value=${i.sound} @input=${(t) => this._patchSound(e, { sound: t.target.value })} />
            </label>
            ${i.kind === "alexa" ? w`<div class="muted small">
                  Pick a sound from the <a href=${An} target="_blank" rel="noreferrer">Amazon sound library</a>. The id is
                  <code>amzn_sfx_</code> plus the sound's name in lower case with underscores and a two-digit number, for example
                  <code>amzn_sfx_doorbell_chime_01</code>. Some sounds stay silent on some Echo devices, so press Test.
                </div>` : w`<div class="muted small">For example <code>boopli/ding.mp3</code> in your Home Assistant media folder.</div>`}
            ${e === "alarm" ? w`${this._numField("Lasts (seconds)", i.seconds, 3, 600, (e) => this._patchSound("alarm", { seconds: e }))}
                ${this._numField("Repeats every (seconds, 0 = once)", i.repeat_s, 0, 60, (e) => this._patchSound("alarm", { repeat_s: e }))}` : E}
            <div><button type="button" @click=${() => this._try(`spk:${r}`, () => I(this.hass, t, r))}>Test</button></div>
            ${this._noteLine(`spk:${r}`)}
          </div>` : E}
    `;
	}
	_renderSpkSpeech(e, t) {
		let n = e.speech, r = (e) => this._patchSpeaker((t) => ({
			...t,
			speech: {
				...t.speech,
				...e
			}
		})), i = Ut(this.hass, n.route, n.target);
		return w`
      <p>The speaker says the step out loud, for example "Dishwasher: Empty it".</p>
      <label class="inline option">
        <input type="checkbox" .checked=${n.enabled} @change=${(e) => r({ enabled: e.target.checked })} />
        Say it on ${this._fn(e.entity_id)}
      </label>
      ${n.enabled ? w`<div class="fields">
            <label class="num">
              How
              <select @change=${(e) => r({
			route: e.target.value,
			target: ""
		})}>
                ${On.map((e) => w`<option value=${e.value} .selected=${e.value === n.route}>${e.label}</option>`)}
              </select>
            </label>
            <label class="num">
              ${n.route === "tts" ? "Voice" : "Alexa device"}
              <select @change=${(e) => r({ target: e.target.value })}>
                <option value="" .selected=${n.target === ""}>Choose…</option>
                ${i.map((e) => w`<option value=${e.value} .selected=${e.value === n.target}>${e.label}</option>`)}
              </select>
            </label>
            ${n.route === "alexa_media" ? w`<label class="inline small">
                  <input type="checkbox" .checked=${n.announce} @change=${(e) => r({ announce: e.target.checked })} />
                  Announce with a chime (some Alexas stay silent, so test it)
                </label>` : E}
            <label class="num wide">
              The sentence ({chore} and {step} are filled in)
              <input .value=${t.speech_template} @input=${(e) => this._set({ speech_template: e.target.value })} />
            </label>
            <div><button type="button" @click=${() => this._try("spk:speech", () => I(this.hass, e, "speech"))}>Test</button></div>
            ${this._noteLine("spk:speech")}
          </div>` : E}
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
		return w`
      <p>
        From which nudge does each thing join in on ${this._fn(e.entity_id)}? Nudge 1 is the first
        for a step. A speaker plays the highest one reached.
      </p>
      ${t.length === 0 ? w`<p class="muted">Nothing is switched on for this speaker yet.</p>` : w`<div class="fields">${t.map((e) => this._numField(`${e.label} starts at nudge #`, e.value, 1, 20, e.set))}</div>`}
      <div class="actions inline-actions">
        <button type="button" ?disabled=${this._busy} @click=${() => this._addAnotherSpeaker()}>Add another speaker</button>
      </div>
    `;
	}
	async _addAnotherSpeaker() {
		if (this.hass && this._draft && !this._busy) {
			this._busy = !0;
			try {
				await j(this.hass, this._draft), this._saved = structuredClone(this._draft), this._speaker = "", this._index = this._steps.indexOf("spk_pick"), this._enter();
			} catch (e) {
				this._error = z(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderAlarmDevices(e) {
		let t = J(this.hass, Vt, e.alarm_devices.map((e) => e.entity_id));
		return w`
      <p>
        Optional: a siren, switch or script that Boopli switches on for a while if you keep ignoring
        a step, and off again. It also stops when you answer.
      </p>
      <div class="list">
        ${e.alarm_devices.map((t) => w`<div class="choice">
            <span class="grow">${this._fn(t.entity_id)}</span>
            <button type="button" @click=${() => this._try(`alarm:${t.entity_id}`, () => L(this.hass, t))}>Test (3 s)</button>
            <button type="button" aria-label="Remove" @click=${() => this._set({ alarm_devices: e.alarm_devices.filter((e) => e.entity_id !== t.entity_id) })}>✕</button>
            ${this._noteLine(`alarm:${t.entity_id}`)}
          </div>`)}
      </div>
      <div class="choice">
        <select class="grow" @change=${(e) => this._addDevice = e.target.value}>
          <option value="" .selected=${this._addDevice === ""}>Add a siren, switch or script…</option>
          ${t.map((e) => w`<option value=${e} .selected=${e === this._addDevice}>${this._fn(e)}</option>`)}
        </select>
        <button
          type="button"
          ?disabled=${!this._addDevice}
          @click=${() => {
			this._set({ alarm_devices: [...e.alarm_devices, Kt(this._addDevice)] }), this._addDevice = "";
		}}
        >
          Add
        </button>
      </div>
    `;
	}
	_renderAlarmDetail(e) {
		return e.alarm_devices.length === 0 ? w`<p class="muted">No alarm device is set up yet. Skip this.</p>` : w`
      <p>How long should each device stay on, and from which nudge on?</p>
      <div class="list grid">
        ${e.alarm_devices.map((t) => {
			let n = (n) => this._set({ alarm_devices: e.alarm_devices.map((e) => e.entity_id === t.entity_id ? {
				...e,
				...n
			} : e) });
			return w`<div class="choice col">
            <b>${this._fn(t.entity_id)}</b>
            ${this._numField("On for (seconds)", t.seconds, 1, 600, (e) => n({ seconds: e }))}
            ${this._numField("Starts at nudge #", t.start_at ?? 4, 1, 20, (e) => n({ start_at: e }))}
            <button type="button" @click=${() => this._try(`alarm:${t.entity_id}`, () => L(this.hass, t))}>Test (3 s)</button>
            ${this._noteLine(`alarm:${t.entity_id}`)}
          </div>`;
		})}
      </div>
    `;
	}
	_renderPresence(e) {
		let t = J(this.hass, ["person"]);
		return w`
      <p>
        If Boopli knows where you are, it reminds you with lights and speakers only when you are
        home, and only on your phone when you are away. This is optional. Without it, Boopli assumes
        you are home.
      </p>
      <div class="field">
        <label for="presence">Which person are you?</label>
        <select id="presence" @change=${(e) => this._set({ presence_entity: e.target.value })}>
          <option value="" .selected=${e.presence_entity === ""}>Skip (assume I am home)</option>
          ${t.map((t) => w`<option value=${t} .selected=${t === e.presence_entity}>${this._fn(t)}</option>`)}
        </select>
      </div>
    `;
	}
	_renderChores() {
		let e = new Set(this.snapshot?.chores.map((e) => e.name));
		return w`
      <p>
        Some chores to start with. Untick what you do not want. They are added without a schedule,
        so nothing nudges you until you set a time (in the Chores tab) or start one yourself.
      </p>
      <div class="list">
        ${K.map((t) => {
			let n = e.has(t.draft.name);
			return w`<label class="inline option">
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
	_renderAiIntro(e) {
		return w`
      <p>
        Boopli can split a big task, like "clean my room", into tiny steps. It asks you a few questions first, so
        the steps fit your situation. This uses <b>your own</b> Home Assistant AI agent.
      </p>
      <p class="muted">
        Boopli sends nothing by itself. When you use it, the text of the task and your answers go to the agent you
        choose, and nothing else: no device names, no history, no location. A cloud agent receives that text, and
        free models may keep or learn from what they get, so do not type private details. A local agent keeps
        everything at home.
      </p>
      <label class="inline option">
        <input
          type="checkbox"
          .checked=${e.ai.enabled}
          @change=${(t) => this._set({ ai: {
			...e.ai,
			enabled: t.target.checked
		} })}
        />
        Switch AI help on
      </label>
    `;
	}
	_renderAiAgent(e) {
		let t = J(this.hass, ["ai_task"]);
		return e.ai.enabled ? w`
      <p>Which AI agent should Boopli use?</p>
      <div class="field">
        <select @change=${(t) => this._set({ ai: {
			...e.ai,
			entity_id: t.target.value
		} })}>
          <option value="" .selected=${e.ai.entity_id === ""}>Home Assistant default</option>
          ${t.map((t) => w`<option value=${t} .selected=${t === e.ai.entity_id}>${this._fn(t)}</option>`)}
        </select>
        ${t.length === 0 ? w`<div class="muted small">No AI Task agent found yet. Add one in Home Assistant under Settings, Devices and services, then come back.</div>` : E}
      </div>
      <p class="muted small">Press the button to save and test it, or Next to only save it.</p>
      <div class="actions inline-actions">
        <button
          type="button"
          ?disabled=${this._busy}
          @click=${() => this._testAiAgent(e)}
        >
          Save and test the agent
        </button>
      </div>
      ${this._noteLine("ai:test")}
    ` : w`<p class="muted">AI help is off. Go back to switch it on, or skip this.</p>`;
	}
	async _testAiAgent(e) {
		if (this.hass) {
			this._note("ai:test", "Saving and asking the agent…");
			try {
				await j(this.hass, e), this._saved = structuredClone(e);
				let t = await M(this.hass, "Make a cup of tea", "now", []);
				this._note("ai:test", `It works. The agent split "Make a cup of tea" into ${t.steps.length} steps, starting with: ${t.steps[0]?.title ?? "(none)"}`);
			} catch (e) {
				this._note("ai:test", z(e));
			}
		}
	}
	_renderDone(e) {
		let t = this._baseline ? bn(this._baseline, e, this.hass) : [], n = K.filter((e) => this._picked.includes(e.label)).map((e) => e.draft.name);
		return this._first && n.length && t.push(`Chores added: ${n.join(", ")}`), w`
      <p><b>What changed</b> ${this._first ? "from before this setup" : "in this setup"}:</p>
      ${t.length === 0 ? w`<p class="muted">Nothing changed.</p>` : w`<ul>${t.map((e) => w`<li>${e}</li>`)}</ul>`}
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
			case "ai_intro": return this._renderAiIntro(e);
			case "ai_agent": return this._renderAiAgent(e);
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
		if (!e) return w`<p class="muted">Loading…</p>`;
		let t = this._step, n = t === "done", r = t === "speaker_gate", i = this._steps.length - 1;
		return w`
      <div class="shell">
        <nav class="rail" aria-label="Steps">
          <div class="rail-title">${Cn[this.wizard]}</div>
          ${this._steps.map((e, t) => w`<button
              type="button"
              class="rail-item ${t === this._index ? "current" : ""} ${t < this._index ? "past" : ""}"
              ?disabled=${t >= this._index}
              @click=${() => this._jump(t)}
            >
              <span class="mark">${t < this._index ? "✓" : t + 1}</span>
              <span>${wn[e]}</span>
            </button>`)}
        </nav>
        <section class="card main">
          <div class="top">
            <span class="muted small">Step ${this._index + 1} of ${this._steps.length}</span>
            ${n && this._first ? E : w`<button type="button" class="link" ?disabled=${this._busy} @click=${() => this._leave()}>
                  ${this._first ? "Skip for now" : "Close"}
                </button>`}
          </div>
          <div class="bar"><div class="fill" style="width:${(this._index + 1) / this._steps.length * 100}%"></div></div>
          <h2>${wn[t]}</h2>
          ${Tn.includes(t) ? w`<div class="muted small optional">Optional details. Skip if the defaults are fine.</div>` : E}
          ${this._renderStep(e)}
          ${this._error ? w`<div class="error">${this._error}</div>` : E}
          <div class="actions">
            ${this._index > 0 ? w`<button type="button" ?disabled=${this._busy} @click=${() => this._go(-1)}>Back</button>` : E}
            <span class="spacer"></span>
            ${n ? w`<button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._finish()}>
                  ${this._first ? "Finish" : "Save and close"}
                </button>` : r ? E : w`<button type="button" ?disabled=${this._busy} @click=${() => this._go(1, "skip")}>Skip</button>
                    <button type="button" class="primary" ?disabled=${this._busy || this._index >= i} @click=${() => this._go(1)}>Next</button>`}
          </div>
        </section>
      </div>
    `;
	}
	static {
		this.styles = [G, o`
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
customElements.define("boopli-wizard", Mn);
// src/boopli-panel.ts
var Nn = {
	today: "Today",
	chores: "Chores",
	home: "My home",
	settings: "Settings"
}, Pn = class extends A {
	static {
		this.properties = {
			hass: { attribute: !1 },
			narrow: { type: Boolean },
			_snapshot: { state: !0 },
			_tab: { state: !0 },
			_nowMs: { state: !0 },
			_connectionError: { state: !0 },
			_wizard: { state: !0 },
			_breakdown: { state: !0 },
			_breakdownError: { state: !0 },
			_choresRequest: { state: !0 },
			_dirty: { state: !0 },
			_confirm: { state: !0 }
		};
	}
	constructor() {
		super(), this._requestId = 0, this._subscribing = !1, this._autoChecked = !1, this._onDirty = (e) => {
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
		}, this._onOpenBreakdown = async (e) => {
			let t = e.detail ?? {};
			await this._guard() && (this._wizard = null, this._breakdownError = "", this._breakdown = {
				kind: t.kind ?? "now",
				task: t.task ?? ""
			});
		}, this._onBreakdownResult = async (e) => {
			if (!this.hass) return;
			let t = e.detail;
			this._breakdownError = "";
			try {
				t.action === "start" ? (await Ue(this.hass, t.task, t.steps, t.notes), this._breakdown = null, this._tab = "today") : t.action === "save" ? (await R(this.hass, this._draftFrom(t)), this._breakdown = null, this._tab = "chores") : t.action === "schedule" && (this._choresRequest = {
					id: ++this._requestId,
					draft: this._draftFrom(t),
					schedule: !0
				}, this._breakdown = null, this._tab = "chores");
			} catch (e) {
				this._breakdownError = e && typeof e == "object" && "message" in e ? String(e.message) : "Something went wrong.";
			}
		}, this.narrow = !1, this._tab = "today", this._nowMs = Date.now(), this._connectionError = "", this._wizard = null, this._breakdown = null, this._breakdownError = "", this._choresRequest = null, this._dirty = {
			settings: !1,
			chore: !1,
			home: !1
		}, this._confirm = null;
	}
	get _hasUnsaved() {
		return this._dirty.settings || this._dirty.chore || this._dirty.home;
	}
	_editable() {
		let e = this._tab === "settings" ? "boopli-settings" : this._tab === "chores" ? "boopli-chores" : this._tab === "home" ? "boopli-home" : "";
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
			chore: !1,
			home: !1
		}, !0;
	}
	async _selectTab(e) {
		(e !== this._tab || this._wizard) && await this._guard() && (this._wizard = null, this._breakdown = null, this._tab = e);
	}
	_openWizard(e) {
		this._breakdown = null, this._wizard = e, this.hass && e.wizard === "first" && N(this.hass, "in_progress", e.startAt).catch(() => void 0);
	}
	_draftFrom(e) {
		return {
			name: e.task,
			where: "home",
			enabled: !0,
			one_off: !1,
			repeat: {
				type: "none",
				time: "09:00",
				every_n_days: 1,
				days: {}
			},
			notes: e.notes,
			steps: e.steps.map((e) => ({
				title: e.title,
				wait_minutes: e.wait_minutes,
				size: e.size,
				group: e.group
			}))
		};
	}
	connectedCallback() {
		super.connectedCallback(), this._timer = window.setInterval(() => this._nowMs = Date.now(), 3e4), window.addEventListener("beforeunload", this._beforeUnload);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearInterval(this._timer), window.removeEventListener("beforeunload", this._beforeUnload), this._unsub?.(), this._unsub = void 0, this._subscribing = !1;
	}
	updated() {
		this.hass && !this._unsub && !this._subscribing && (this._subscribing = !0, Ge(this.hass, (e) => {
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
		if (!this._confirm) return E;
		let e = (e) => () => this._confirm?.(e);
		return w`<div class="backdrop" role="dialog" aria-modal="true" aria-label="Unsaved changes">
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
			home: this._dirty.home,
			settings: this._dirty.settings
		};
		return w`
      <header>
        ${this.narrow ? w`<button class="menu" aria-label="Open sidebar" @click=${this._toggleSidebar}>☰</button>` : E}
        <h1>Boopli</h1>
        <nav>
          ${Object.keys(Nn).map((t) => w`<button
              class="tab ${this._tab === t && !this._wizard ? "on" : ""}"
              @click=${() => this._selectTab(t)}
            >
              ${Nn[t]}
              ${e[t] ? w`<span class="dot" title="Unsaved changes" aria-label="Unsaved changes"></span>` : E}
            </button>`)}
        </nav>
      </header>
      <main
        @open-wizard=${this._onOpenWizard}
        @open-breakdown=${this._onOpenBreakdown}
        @open-home=${() => this._selectTab("home")}
        @dirty-change=${this._onDirty}
      >
        ${this._connectionError ? w`<p class="error">${this._connectionError}</p>` : this._wizard ? w`<boopli-wizard
                .hass=${this.hass}
                .snapshot=${this._snapshot}
                .wizard=${this._wizard.wizard}
                .startAt=${this._wizard.startAt}
                @wizard-close=${() => this._wizard = null}
              ></boopli-wizard>` : this._breakdown ? w`<boopli-breakdown
                  .hass=${this.hass}
                  .snapshot=${this._snapshot}
                  .kind=${this._breakdown.kind}
                  .task=${this._breakdown.task}
                  .externalError=${this._breakdownError}
                  @breakdown-result=${this._onBreakdownResult}
                  @breakdown-cancel=${() => this._breakdown = null}
                ></boopli-breakdown>` : this._tab === "today" ? w`<boopli-today .hass=${this.hass} .snapshot=${this._snapshot} .nowMs=${this._nowMs}></boopli-today>` : this._tab === "chores" ? w`<boopli-chores
                      .hass=${this.hass}
                      .snapshot=${this._snapshot}
                      .nowMs=${this._nowMs}
                      .openRequest=${this._choresRequest}
                      @request-handled=${() => this._choresRequest = null}
                    ></boopli-chores>` : this._tab === "home" ? w`<boopli-home .hass=${this.hass} .snapshot=${this._snapshot}></boopli-home>` : w`<boopli-settings .hass=${this.hass} .snapshot=${this._snapshot}></boopli-settings>`}
      </main>
      ${this._renderConfirm()}
    `;
	}
	static {
		this.styles = [G, o`
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
customElements.define("boopli-panel", Pn);
export { Pn as BoopliPanel };

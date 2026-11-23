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
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: ee, getOwnPropertySymbols: te, getPrototypeOf: ne } = Object, re = globalThis, ie = re.trustedTypes, ae = ie ? ie.emptyScript : "", oe = re.reactiveElementPolyfillSupport, f = (e, t) => e, se = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? ae : null;
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
}, ce = (e, t) => !l(e, t), le = {
	attribute: !0,
	type: String,
	converter: se,
	reflect: !1,
	useDefault: !1,
	hasChanged: ce
};
Symbol.metadata ??= Symbol("metadata"), re.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var p = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = le) {
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
		return this.elementProperties.get(e) ?? le;
	}
	static _$Ei() {
		if (this.hasOwnProperty(f("elementProperties"))) return;
		let e = ne(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(f("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(f("properties"))) {
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
			let i = (n.converter?.toAttribute === void 0 ? se : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? se : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? ce)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
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
p.elementStyles = [], p.shadowRootOptions = { mode: "open" }, p[f("elementProperties")] = /* @__PURE__ */ new Map(), p[f("finalized")] = /* @__PURE__ */ new Map(), oe?.({ ReactiveElement: p }), (re.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var ue = globalThis, de = (e) => e, fe = ue.trustedTypes, pe = fe ? fe.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, me = "$lit$", m = `lit$${Math.random().toFixed(9).slice(2)}$`, he = "?" + m, ge = `<${he}>`, h = document, _e = () => h.createComment(""), ve = (e) => e === null || typeof e != "object" && typeof e != "function", ye = Array.isArray, be = (e) => ye(e) || typeof e?.[Symbol.iterator] == "function", xe = "[ 	\n\f\r]", g = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Se = /-->/g, Ce = />/g, _ = RegExp(`>|${xe}(?:([^\\s"'>=/]+)(${xe}*=${xe}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), we = /'/g, Te = /"/g, Ee = /^(?:script|style|textarea|title)$/i, De = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), v = De(1), y = De(2), b = Symbol.for("lit-noChange"), x = Symbol.for("lit-nothing"), Oe = /* @__PURE__ */ new WeakMap(), S = h.createTreeWalker(h, 129);
function ke(e, t) {
	if (!ye(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return pe === void 0 ? t : pe.createHTML(t);
}
var Ae = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = g;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === g ? c[1] === "!--" ? o = Se : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = _) : (Ee.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = _) : o = Ce : o === _ ? c[0] === ">" ? (o = i ?? g, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? _ : c[3] === "\"" ? Te : we) : o === Te || o === we ? o = _ : o === Se || o === Ce ? o = g : (o = _, i = void 0);
		let d = o === _ && e[t + 1].startsWith("/>") ? " " : "";
		a += o === g ? n + ge : l >= 0 ? (r.push(s), n.slice(0, l) + me + n.slice(l) + m + d) : n + m + (l === -2 ? t : d);
	}
	return [ke(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, je = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = Ae(t, n);
		if (this.el = e.createElement(l, r), S.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = S.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(me)) {
					let t = u[o++], n = i.getAttribute(e).split(m), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Fe : r[1] === "?" ? Ie : r[1] === "@" ? Le : Pe
					}), i.removeAttribute(e);
				} else e.startsWith(m) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (Ee.test(i.tagName)) {
					let e = i.textContent.split(m), t = e.length - 1;
					if (t > 0) {
						i.textContent = fe ? fe.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], _e()), S.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], _e());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === he) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(m, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += m.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = h.createElement("template");
		return n.innerHTML = e, n;
	}
};
function C(e, t, n = e, r) {
	if (t === b) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = ve(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = C(e, i._$AS(e, t.values), i, r)), t;
}
var Me = class {
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? h).importNode(t, !0);
		S.currentNode = r;
		let i = S.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new Ne(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Re(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = S.nextNode(), a++);
		}
		return S.currentNode = h, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, Ne = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = x, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = C(this, e, t), ve(e) ? e === x || e == null || e === "" ? (this._$AH !== x && this._$AR(), this._$AH = x) : e !== this._$AH && e !== b && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? be(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== x && ve(this._$AH) ? this._$AA.nextSibling.data = e : this.T(h.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = je.createElement(ke(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Me(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = Oe.get(e.strings);
		return t === void 0 && Oe.set(e.strings, t = new je(e)), t;
	}
	k(t) {
		ye(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(_e()), this.O(_e()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = de(e).nextSibling;
			de(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, Pe = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = x, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = x;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = C(this, e, t, 0), a = !ve(e) || e !== this._$AH && e !== b, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = C(this, r[n + o], t, o), s === b && (s = this._$AH[o]), a ||= !ve(s) || s !== this._$AH[o], s === x ? e = x : e !== x && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === x ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Fe = class extends Pe {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === x ? void 0 : e;
	}
}, Ie = class extends Pe {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== x);
	}
}, Le = class extends Pe {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = C(this, e, t, 0) ?? x) === b) return;
		let n = this._$AH, r = e === x && n !== x || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== x && (n === x || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Re = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		C(this, e);
	}
}, ze = ue.litHtmlPolyfillSupport;
ze?.(je, Ne), (ue.litHtmlVersions ??= []).push("3.3.3");
var Be = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new Ne(t.insertBefore(_e(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Ve = globalThis, w = class extends p {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Be(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return b;
	}
};
w._$litElement$ = !0, w.finalized = !0, Ve.litElementHydrateSupport?.({ LitElement: w });
var He = Ve.litElementPolyfillSupport;
He?.({ LitElement: w }), (Ve.litElementVersions ??= []).push("4.2.2");
// src/api.ts
function Ue(e, t) {
	return e.callWS({
		type: "boopli/settings_save",
		settings: t
	});
}
function We(e, t, n, r, i = "", a, o = "") {
	return e.callWS({
		type: "boopli/ai_questions",
		task: t,
		kind: n,
		answers: r,
		notes: i,
		scene: o,
		...a ? { rooms: a } : {}
	});
}
function Ge(e, t, n, r, i = "", a, o = "") {
	return e.callWS({
		type: "boopli/ai_steps",
		task: t,
		kind: n,
		answers: r,
		notes: i,
		scene: o,
		...a ? { rooms: a } : {}
	});
}
function Ke(e, t, n, r, i, a, o = "") {
	return e.callWS({
		type: "boopli/ai_preview",
		task: t,
		kind: n,
		answers: r,
		notes: i,
		rooms: a,
		scene: o
	});
}
async function qe(e, t) {
	return (await e.callWS({
		type: "boopli/rooms_guess",
		task: t
	})).rooms;
}
function Je(e, t) {
	return e.callWS({
		type: "boopli/home_save",
		home: t
	});
}
function Ye(e) {
	return e.callWS({ type: "boopli/home_sync" });
}
function Xe(e, t, n, r) {
	return e.callWS({
		type: "boopli/room_questions",
		room: t,
		notes: n,
		answers: r
	});
}
function Ze(e, t, n, r) {
	return e.callWS({
		type: "boopli/room_notes",
		room: t,
		notes: n,
		answers: r
	});
}
function Qe(e) {
	return e.callWS({ type: "boopli/ai_defaults" });
}
function $e(e, t, n, r = "") {
	return e.callWS({
		type: "boopli/task_add",
		title: t,
		steps: n,
		notes: r
	});
}
async function et(e, t, n = 5) {
	return (await e.callWS({
		type: "boopli/schedule_preview",
		repeat: t,
		count: n
	})).times;
}
function tt(e, t, n = "") {
	return e.callWS({
		type: "boopli/setup_save",
		status: t,
		step: n
	});
}
function nt(e, t, n) {
	return e.callWS({
		type: "boopli/step_on_it",
		run_id: t,
		step_id: n
	});
}
function rt(e, t, n) {
	return e.callWS({
		type: "boopli/step_not_on_it",
		run_id: t,
		step_id: n
	});
}
function it(e, t) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "light",
		light: t
	});
}
function at(e, t) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "phone",
		phone: t
	});
}
function ot(e, t, n) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "speaker",
		speaker: t,
		level: n
	});
}
function st(e, t) {
	return e.callWS({
		type: "boopli/test_channel",
		kind: "alarm_device",
		alarm_device: t
	});
}
function ct(e, t) {
	return e.connection.subscribeMessage(t, { type: "boopli/subscribe" });
}
function lt(e, t) {
	return e.callWS({
		type: "boopli/chore_save",
		chore: t
	});
}
function ut(e, t) {
	return e.callWS({
		type: "boopli/chore_delete",
		chore_id: t
	});
}
function dt(e, t, n) {
	return e.callWS({
		type: "boopli/chore_start",
		chore_id: t,
		...n ? { answers: n } : {}
	});
}
function ft(e, t, n, r) {
	return e.callWS({
		type: "boopli/away_set",
		start: t,
		until: n,
		keep_going: r
	});
}
function pt(e) {
	return e.callWS({ type: "boopli/away_end" });
}
function mt(e, t, n) {
	return e.callWS({
		type: "boopli/questions_answer",
		run_id: t,
		answers: n
	});
}
function ht(e, t, n) {
	return e.callWS({
		type: "boopli/step_complete",
		run_id: t,
		step_id: n
	});
}
function T(e) {
	return e && typeof e == "object" && "message" in e ? String(e.message) : "Something went wrong.";
}
function gt(e, t, n, r) {
	return e.callWS({
		type: "boopli/room_photos",
		room: t,
		notes: n,
		photos: r
	});
}
async function _t(e, t, n = "", r = "", i) {
	return (await e.callWS({
		type: "boopli/chat_prompt",
		room: n,
		notes: r,
		include_notes: t,
		...i ? { rooms: i } : {}
	})).prompt;
}
function vt(e, t) {
	return e.callWS({
		type: "boopli/paste_notes",
		text: t
	});
}
async function yt(e, t, n) {
	return (await e.callWS({
		type: "boopli/paste_notes",
		text: t,
		whole_home: !0,
		rooms: n
	})).rooms;
}
function bt(e, t, n, r, i = "") {
	return e.callWS({
		type: "boopli/part_park",
		run_id: t,
		group: n,
		when: r,
		at: i
	});
}
function xt(e, t, n, r = "") {
	return e.callWS({
		type: "boopli/part_time",
		chore_id: t,
		when: n,
		at: r
	});
}
function St(e, t, n, r) {
	return e.callWS({
		type: "boopli/scene_photos",
		task: t,
		photos: n,
		...r ? { rooms: r } : {}
	});
}
function Ct(e) {
	return e.callWS({ type: "boopli/egg_found" });
}
// src/styles.ts
var E = o`
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
`, wt = class extends w {
	static {
		this.properties = {
			questions: { attribute: !1 },
			label: { type: String },
			allLabel: { type: String },
			busy: { type: Boolean },
			cancelable: { type: Boolean },
			_answers: { state: !0 }
		};
	}
	constructor() {
		super(), this.questions = [], this.label = "Start", this.allLabel = "", this.busy = !1, this.cancelable = !0, this._answers = {};
	}
	_yes(e) {
		return this._answers[e] ?? !0;
	}
	_set(e, t) {
		this._answers = {
			...this._answers,
			[e]: t
		};
	}
	_emit(e, t = {}) {
		this.dispatchEvent(new CustomEvent(e, {
			detail: t,
			bubbles: !0,
			composed: !0
		}));
	}
	_submit() {
		let e = {};
		for (let t of this.questions) e[t.id] = this._yes(t.id);
		this._emit("answered", { answers: e });
	}
	render() {
		return v`
      <div class="list">
        ${this.questions.map((e) => v`<div class="q" role="group" aria-label=${e.text}>
            <div class="text">${e.text}</div>
            <div class="yn">
              <button
                type="button"
                class="yes ${this._yes(e.id) ? "on" : ""}"
                aria-pressed=${this._yes(e.id)}
                @click=${() => this._set(e.id, !0)}
              >
                <span aria-hidden="true">✓</span> Yes
              </button>
              <button
                type="button"
                class="no ${this._yes(e.id) ? "" : "on"}"
                aria-pressed=${!this._yes(e.id)}
                @click=${() => this._set(e.id, !1)}
              >
                <span aria-hidden="true">✕</span> No
              </button>
            </div>
          </div>`)}
      </div>
      <div class="actions">
        <button type="button" class="primary" ?disabled=${this.busy} @click=${() => this._submit()}>${this.label}</button>
        ${this.allLabel ? v`<button type="button" ?disabled=${this.busy} @click=${() => this._emit("all-steps")}>${this.allLabel}</button>` : ""}
        ${this.cancelable ? v`<button type="button" class="link" @click=${() => this._emit("cancel")}>Cancel</button>` : ""}
      </div>
    `;
	}
	static {
		this.styles = [E, o`
      :host {
        display: block;
      }
      .list {
        display: grid;
        gap: 12px;
      }
      .q {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 12px;
      }
      .text {
        flex: 1 1 200px;
        min-width: 0;
        font-size: 16px;
      }
      .yn {
        display: flex;
        gap: 8px;
      }
      .yn button {
        min-width: 84px;
        font-weight: 500;
        background: transparent;
      }
      .yes {
        color: var(--success-color, #2e9e5b);
        border-color: var(--success-color, #2e9e5b);
      }
      .no {
        color: var(--error-color, #d93f3f);
        border-color: var(--error-color, #d93f3f);
      }
      .yes.on {
        background: var(--success-color, #2e9e5b);
        border-color: var(--success-color, #2e9e5b);
        color: #fff;
      }
      .no.on {
        background: var(--error-color, #d93f3f);
        border-color: var(--error-color, #d93f3f);
        color: #fff;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-top: 14px;
      }
    `];
	}
};
customElements.define("boopli-questions", wt);
// src/time.ts
var D = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun"
], O = D;
function k(e, t) {
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: t,
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).format(new Date(e));
}
function A(e, t) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: t,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(e);
}
function Tt(e) {
	let [t, n, r] = e.split("-").map(Number);
	return Math.round(Date.UTC(t, n - 1, r) / 864e5);
}
function j(e, t, n) {
	let r = new Date(e), i = Tt(A(r, n)) - Tt(A(new Date(t), n)), a = k(e, n);
	return i === 0 ? `today ${a}` : i === 1 ? `tomorrow ${a}` : `${new Intl.DateTimeFormat("en-GB", {
		timeZone: n,
		weekday: "short",
		day: "numeric",
		month: "short"
	}).format(r)}, ${a}`;
}
function Et(e, t, n) {
	return A(new Date(e), n) === A(new Date(t), n);
}
function Dt(e) {
	let t = Math.max(0, Math.round(e));
	if (t < 1) return "less than a minute";
	if (t < 60) return `${t} min`;
	let n = Math.floor(t / 60), r = t % 60;
	return r === 0 ? `${n}h` : `${n}h ${r}m`;
}
function Ot(e, t) {
	let n = (new Date(e).getTime() - t) / 6e4;
	return n <= .5 ? "any moment now" : `in ${Dt(n)}`;
}
function kt(e, t) {
	return `since ${k(e, t)}`;
}
function At(e) {
	return e.length <= 2 ? e.join(" and ") : `${e.slice(0, -1).join(", ")} and ${e[e.length - 1]}`;
}
function jt(e) {
	let t = [], n = 0;
	for (; n < 7;) {
		let r = e[String(n)] ?? [];
		if (r.length === 0) {
			n++;
			continue;
		}
		let i = n;
		for (; i + 1 < 7 && (e[String(i + 1)] ?? []).join() === r.join();) i++;
		let a = n === i ? D[n] : i === n + 1 ? `${D[n]} and ${D[i]}` : `${D[n]} to ${D[i]}`;
		t.push(`${a} ${At(r)}`), n = i + 1;
	}
	return t.length ? t.join(", ") : "No days yet";
}
function Mt(e) {
	switch (e.type) {
		case "none": return "On demand";
		case "schedule": return jt(e.days);
		case "every_n_days": return e.every_n_days === 1 ? `Every day after you finish, at ${e.time}` : `${e.every_n_days} days after you finish, at ${e.time}`;
	}
}
// src/boopli-away.ts
function Nt(e, t, n) {
	let [r, i, a] = A(/* @__PURE__ */ new Date(), n).split("-").map(Number);
	return `${new Date(Date.UTC(r, i - 1, a + e)).toISOString().slice(0, 10)}T${String(t).padStart(2, "0")}:00`;
}
function Pt(e, t) {
	let n = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
		timeZone: t,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).formatToParts(new Date(e)).map((e) => [e.type, e.value]));
	return `${n.year}-${n.month}-${n.day}T${n.hour}:${n.minute}`;
}
function Ft(e, t, n, r) {
	let i = e.until ? `until ${j(e.until, t, n)}` : "until you turn it off";
	return r || !e.start ? i : `from ${j(e.start, t, n)} ${i}`;
}
var It = class extends w {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			nowMs: { type: Number },
			_changing: { state: !0 },
			_expanded: { state: !0 },
			_later: { state: !0 },
			_start: { state: !0 },
			_open: { state: !0 },
			_until: { state: !0 },
			_keep: { state: !0 },
			_busy: { state: !0 },
			_error: { state: !0 }
		};
	}
	constructor() {
		super(), this._seeded = !1, this.nowMs = Date.now(), this._changing = !1, this._expanded = !1, this._later = !1, this._start = Nt(1, 8, "UTC"), this._open = !1, this._until = Nt(7, 18, "UTC"), this._keep = {}, this._busy = !1, this._error = "";
	}
	willUpdate() {
		!this._seeded && this.snapshot && (this._seeded = !0, this._start = Nt(1, 8, this.snapshot.time_zone), this._until = Nt(7, 18, this.snapshot.time_zone), this._seedKeep());
	}
	_seedKeep() {
		this._keep = Object.fromEntries(this._chores().map((e) => [e.id, e.keeps_going ?? !1]));
	}
	_chores() {
		return (this.snapshot?.chores ?? []).filter((e) => !e.parked).sort((e, t) => e.name.localeCompare(t.name));
	}
	_change(e) {
		let t = this.snapshot?.time_zone ?? "UTC";
		this._later = !!e.start && new Date(e.start).getTime() > Date.now(), e.start && (this._start = Pt(e.start, t)), this._open = !e.until, e.until && (this._until = Pt(e.until, t)), this._seedKeep(), this._error = "", this._changing = !0, this._expanded = !0;
	}
	_toggle() {
		let e = this._expanded || this._changing;
		this._changing = !1, this._expanded = !e, this._error = "";
	}
	async _submit() {
		if (this.hass && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				await ft(this.hass, this._later ? this._start : "", this._open ? "" : this._until, this._keep), this._changing = !1, this._expanded = !1;
			} catch (e) {
				this._error = T(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	async _back() {
		if (this.hass && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				await pt(this.hass), this._changing = !1, this._expanded = !1;
			} catch (e) {
				this._error = T(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderOn(e) {
		let t = !!this.snapshot?.away_now, n = this.snapshot?.time_zone ?? "UTC";
		return v`
      <p>${Ft(e, this.nowMs, n, t)}</p>
      <p class="muted small">
        ${t ? "Nothing starts and nothing nudges you, except the chores that keep going." : "Boopli carries on as usual until then."}
      </p>
      ${this._error ? v`<div class="error">${this._error}</div>` : x}
      <div class="actions">
        <button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._back()}>
          ${t ? "Back now" : "Cancel it"}
        </button>
        <button type="button" ?disabled=${this._busy} @click=${() => this._change(e)}>Change</button>
      </div>
    `;
	}
	_renderForm(e) {
		let t = this._chores();
		return v`
      <p class="muted small">
        Boopli rests: nothing starts and nothing nudges you, except the chores you tick below. Your pet stays just as
        it is, and when you are back it carries on from there.
      </p>

      <div class="field">
        <div class="label">From</div>
        <div class="chips">
          <button type="button" class="chip ${this._later ? "" : "on"}" @click=${() => this._later = !1}>Now</button>
          <button type="button" class="chip ${this._later ? "on" : ""}" @click=${() => this._later = !0}>A date…</button>
        </div>
        ${this._later ? v`<input
              type="datetime-local"
              aria-label="Away from"
              .value=${this._start}
              @input=${(e) => this._start = e.target.value}
            />` : x}
      </div>

      <div class="field">
        <div class="label">Until</div>
        <div class="chips">
          <button type="button" class="chip ${this._open ? "" : "on"}" @click=${() => this._open = !1}>A date…</button>
          <button type="button" class="chip ${this._open ? "on" : ""}" @click=${() => this._open = !0}>
            Until I turn it off
          </button>
        </div>
        ${this._open ? x : v`<input
              type="datetime-local"
              aria-label="Away until"
              .value=${this._until}
              @input=${(e) => this._until = e.target.value}
            />`}
      </div>

      ${t.length ? v`<div class="field">
            <div class="label">These keep going while I'm away</div>
            <div class="muted small">Tick what you still want to be nudged about, like pills.</div>
            <div class="keep">
              ${t.map((e) => v`<label class="inline">
                  <input
                    type="checkbox"
                    .checked=${this._keep[e.id] ?? !1}
                    @change=${(t) => this._keep = {
			...this._keep,
			[e.id]: t.target.checked
		}}
                  />
                  ${e.name}
                </label>`)}
            </div>
          </div>` : x}

      ${this._error ? v`<div class="error">${this._error}</div>` : x}
      <div class="actions">
        <button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._submit()}>
          ${e?.active ? "Save away mode" : "Start away mode"}
        </button>
        ${e?.active ? v`<button type="button" class="link" @click=${() => this._changing = !1}>Cancel</button>` : x}
      </div>
    `;
	}
	render() {
		let e = this.snapshot?.away, t = this.snapshot?.time_zone ?? "UTC", n = !!this.snapshot?.away_now, r = this._expanded || this._changing, i = e?.active ? `${n ? "On" : "Planned"}: ${Ft(e, this.nowMs, t, n)}` : "Off";
		return v`
      <div class="head-row">
        <button type="button" class="head" aria-expanded=${r} @click=${() => this._toggle()}>
          <span class="title">🧳 Away mode</span>
          <span class="status ${e?.active ? "on" : ""}">${i}</span>
          <span class="chev" aria-hidden="true">${r ? "▾" : "▸"}</span>
        </button>
        ${e?.active && !r ? v`<button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._back()}>
              ${n ? "Back now" : "Cancel it"}
            </button>` : x}
      </div>
      ${!r && this._error ? v`<div class="error" role="alert">${this._error}</div>` : x}
      ${r ? v`<div class="body">${e?.active && !this._changing ? this._renderOn(e) : this._renderForm(e)}</div>` : x}
    `;
	}
	static {
		this.styles = [E, o`
      :host {
        display: block;
      }
      .head-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .head {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 0;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .title {
        font-size: 18px;
        font-weight: 500;
        white-space: nowrap;
      }
      .status {
        flex: 1;
        min-width: 0;
        font-size: 14px;
        color: var(--secondary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .status.on {
        color: var(--warning-color, #ffa600);
        font-weight: 600;
      }
      .chev {
        color: var(--secondary-text-color);
      }
      .body {
        margin-top: 8px;
      }
      .field {
        margin: 14px 0;
      }
      .label {
        font-weight: 500;
        margin-bottom: 6px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
      }
      input[type="datetime-local"] {
        max-width: 100%;
      }
      .keep {
        display: grid;
        gap: 8px;
        margin-top: 8px;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-top: 16px;
      }
      .small {
        font-size: 14px;
      }
    `];
	}
};
customElements.define("boopli-away", It);
// src/today.ts
function Lt(e, t) {
	let n = e.time_zone, r = e.runs.flatMap((e) => e.steps.filter((e) => e.status === "active").map((t) => ({
		run: e,
		step: t,
		done: e.steps.filter((e) => e.status === "done").length,
		total: e.steps.length
	}))).sort((e, t) => (e.step.active_at ? Date.parse(e.step.active_at) : Infinity) - (t.step.active_at ? Date.parse(t.step.active_at) : Infinity))[0] ?? null, i = [...e.runs].sort((e, t) => Date.parse(e.started_at) - Date.parse(t.started_at)), a = (e, t) => !(r && r.run.id === e.id && r.step.step_id === t.step_id), o = (e) => {
		let n = "";
		return e.status === "active" ? n = "ready now" : e.status === "waiting" && e.active_at ? n = Ot(e.active_at, t) : e.status === "waiting" && (e.wait_for ?? []).length > 0 ? n = "waits for something to happen" : e.wait_minutes > 0 && (n = `${Dt(e.wait_minutes)} after the step before`), {
			title: e.title,
			status: e.status,
			hint: n
		};
	}, s = i.map((e) => ({
		run: e,
		steps: e.steps.filter((t) => t.status === "active" && a(e, t)).map(o)
	})).filter((e) => e.steps.length > 0), c = i.map((e) => ({
		run: e,
		steps: e.steps.filter((e) => e.status !== "done" && e.status !== "active").map(o)
	})).filter((e) => e.steps.length > 0), l = new Set(e.runs.map((e) => e.chore_id)), u = e.chores.filter((e) => e.enabled && !e.parked && e.next_due !== null && !l.has(e.id)).map((e) => ({
		chore: e,
		at: e.next_due
	})).sort((e, t) => Date.parse(e.at) - Date.parse(t.at));
	return {
		now: r,
		ready: s,
		groups: c,
		dueToday: u.filter((e) => Et(e.at, t, n)),
		upcoming: u.filter((e) => !Et(e.at, t, n) && Date.parse(e.at) > t)
	};
}
// src/pet-work.ts
var M = "#101010", Rt = {
	levelup: 2800,
	wake: 2600,
	tap: 700,
	done: 1700
};
function zt() {
	return y`
    <ellipse class="smudge" cx="26" cy="191" rx="20" ry="4.5" fill="#6B4A2E" opacity="0.85"/>
    <g class="tub"><ellipse cx="24" cy="178" rx="22" ry="6" fill="#BFE9FF" stroke=${M} stroke-width="3"/></g>
    <g transform="translate(198 144)"><g class="bagfall">${Vt()}</g></g>`;
}
function Bt() {
	return y`<g class="tub">
    <path d="M2 178 Q4 199 24 199 Q44 199 46 178 Q24 187 2 178 Z" fill="#5B8DEF" stroke=${M} stroke-width="3" stroke-linejoin="round"/>
    <path d="M9 186 Q10 193 18 195" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
    <circle class="suds s1" cx="11" cy="177" r="5" fill="#fff" stroke=${M} stroke-width="1.6"/>
    <circle class="suds s2" cx="22" cy="173" r="6.5" fill="#fff" stroke=${M} stroke-width="1.6"/>
    <circle class="suds s3" cx="35" cy="176" r="5" fill="#fff" stroke=${M} stroke-width="1.6"/>
    <circle class="suds s4" cx="28" cy="179" r="3.6" fill="#fff" stroke=${M} stroke-width="1.4"/>
  </g>`;
}
function Vt() {
	return y`<circle r="9" fill="#3F4A5A" stroke=${M} stroke-width="2.5"/>
    <path d="M-4 -7 L0 -15 L4 -7 Z" fill="#3F4A5A" stroke=${M} stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M-5 -2 Q-3 2 -5 5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.4"/>`;
}
function Ht(e) {
	let t = e.shoulders?.l ?? [46, 150], n = e.shoulders?.r ?? [154, 150], r = e.armD?.l ?? "M46 150 Q28 160 22 180", i = e.armD?.r ?? "M154 150 Q168 158 170 176";
	return y`
    <g class="arm armL" style="transform-origin:${t[0]}px ${t[1]}px">
      <path d=${r} fill="none" stroke=${e.ink ?? M} stroke-width=${13 * e.thick} stroke-linecap="round"/>
      <path d=${r} fill="none" stroke=${e.color} stroke-width=${7 * e.thick} stroke-linecap="round"/>
      <circle cx="22" cy="180" r=${7.5 * e.thick} fill=${e.color} stroke=${e.ink ?? M} stroke-width="3"/>
      <g class="cloth"><rect x="10" y="177" width="24" height="14" rx="4" transform="rotate(-8 22 184)" fill="#FFD84D" stroke=${M} stroke-width="2.5"/>
        <path d="M14 184 Q22 181 30 184" fill="none" stroke="#fff" stroke-width="2" opacity="0.6"/></g>
      <g class="sock" transform="translate(22 174)">
        <path d="M-5 -14 h10 v14 q0 8 -9 8 h-8 q-5 0 -5 -5 q0 -5 5 -5 h7 z" fill="#fff" stroke=${M} stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M-5 -9 h10 M-5 -5 h10" stroke="#E5484D" stroke-width="2"/>
      </g>
      <circle class="pop p1" cx="8" cy="172" r="4" fill="#fff" fill-opacity="0.5" stroke="#fff" stroke-width="1.6"/>
      <circle class="pop p2" cx="36" cy="170" r="3" fill="#fff" fill-opacity="0.5" stroke="#fff" stroke-width="1.6"/>
      <circle class="pop p3" cx="24" cy="164" r="5" fill="#fff" fill-opacity="0.5" stroke="#fff" stroke-width="1.6"/>
      <path class="clean" d="M22 160 l2.4 5 5 2.4 -5 2.4 -2.4 5 -2.4 -5 -5 -2.4 5 -2.4 z" fill="#FFE45C" stroke=${M} stroke-width="1.2" stroke-linejoin="round"/>
    </g>
    <g class="arm armR" style="transform-origin:${n[0]}px ${n[1]}px">
      <path d=${i} fill="none" stroke=${e.ink ?? M} stroke-width=${13 * e.thick} stroke-linecap="round"/>
      <path d=${i} fill="none" stroke=${e.color} stroke-width=${7 * e.thick} stroke-linecap="round"/>
      <circle cx="170" cy="177" r=${7.5 * e.thick} fill=${e.color} stroke=${e.ink ?? M} stroke-width="3"/>
      <g class="bagarm" transform="translate(170 176)">${Vt()}</g>
    </g>`;
}
function Ut() {
	return y`${Bt()}<g class="bin" transform="translate(184 160)">
    <path d="M0 6 L26 6 L23 32 L3 32 Z" fill="#9AA7B5" stroke=${M} stroke-width="3" stroke-linejoin="round"/>
    <path d="M8 11 L9 28 M13 11 V28 M18 11 L17 28" stroke=${M} stroke-width="1.6" opacity="0.45" stroke-linecap="round"/>
    <g class="lid"><rect x="-2" y="0" width="30" height="7" rx="3" fill="#7D8A99" stroke=${M} stroke-width="2.5"/></g>
  </g>`;
}
function Wt(e) {
	let t = y`<circle class="hand h1" cx="68" cy="152" r=${7 * e.thick} fill=${e.color} stroke=${e.ink ?? M} stroke-width="3"/>
    <circle class="hand h2" cx="132" cy="152" r=${7 * e.thick} fill=${e.color} stroke=${e.ink ?? M} stroke-width="3"/>`;
	return y`
    ${e.typingBehind ? t : y``}
    <g class="laptop">
      <rect x="56" y="184" width="88" height="7" rx="3.5" fill="#6B7486" stroke=${M} stroke-width="2.5"/>
      <rect x="62" y="150" width="76" height="36" rx="6" fill="#3A4150" stroke=${M} stroke-width="3"/>
      <path d="M100 160 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.9 -5.2 -2.8 -5.2 2.8 1 -5.9 -4.3 -4.1 5.9 -.8 z" fill="#8FA3BF" opacity="0.9"/>
    </g>
    ${e.typingBehind ? y`` : t}
    <g class="code" transform="translate(${e.codeAt?.[0] ?? 0} ${e.codeAt?.[1] ?? 0})">
      <text class="c1" x="84" y="60">&lt;/&gt;</text>
      <text class="c2" x="104" y="52">{ }</text>
      <text class="c3" x="122" y="62">01</text>
    </g>`;
}
function Gt(e) {
	return e === "housework" ? zt() : y``;
}
function N(e, t) {
	return e === "housework" ? Ht(t) : y``;
}
function Kt(e, t) {
	return e === "housework" ? Ut() : e === "typing" ? Wt(t) : y``;
}
var qt = "M0 -9 l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6 z";
function Jt(e, t, n = {}) {
	let r = n.mouth ?? [100, 153];
	switch (e) {
		case "levelup": return y`${[
			[
				-70,
				-52,
				"#FFE45C"
			],
			[
				0,
				-86,
				"#fff"
			],
			[
				70,
				-52,
				"#FF9EC0"
			],
			[
				-92,
				4,
				"#7CD7FF"
			],
			[
				92,
				4,
				"#FFE45C"
			],
			[
				-44,
				-84,
				"#B79CFF"
			],
			[
				44,
				-84,
				"#7CFF5B"
			]
		].map(([e, t, n], r) => y`<g transform="translate(100 110)"><g class="burst" style="--dx:${e}px;--dy:${t}px;animation-delay:${.45 + r * .04}s"><path d=${qt} fill=${n} stroke=${M} stroke-width="1.6" stroke-linejoin="round"/></g></g>`)}
      <g transform="translate(0 ${n.badgeDy ?? 0})"><g class="badge"><rect x="100" y="16" width="96" height="28" rx="14" fill="#FFD166" stroke=${M} stroke-width="3"/>
        <text x="148" y="35" text-anchor="middle">${t || "Level up!"}</text></g></g>`;
		case "done": return y`<path class="spark d1" d="M30 90 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#FFE45C"/>
        <path class="spark d2" d="M170 80 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#FFE45C"/>
        <g transform="translate(0 ${n.xpDy ?? 0})"><text class="xp" x="100" y="70" text-anchor="middle">${t}</text></g>`;
		case "tap": return y`<g transform="translate(0 ${n.heartDy ?? 0})"><path class="heart" d="M100 70 c-6 -9 -18 -2 -10 8 l10 9 l10 -9 c8 -10 -4 -17 -10 -8 z" fill="#FF6B8A" stroke=${M} stroke-width="2" stroke-linejoin="round"/></g>`;
		case "wake": return y`<ellipse class="yawn" cx=${r[0]} cy=${r[1]} rx="9" ry="11" fill=${M}/>
        <g transform="translate(${r[0] - 100} ${r[1] - 153})"><path class="yawn tongue" d="M93 160 Q100 152 107 160 Q100 168 93 160 Z" fill="#FF6B8A"/></g>`;
		default: return y``;
	}
}
var P = 12;
function F(e, t) {
	return `@keyframes ${e}{${t.map(([e, t]) => `${e}%{${t}}`).join("")}}`;
}
function Yt(e, t, n, r, i) {
	let a = [], o = 0;
	for (let s = e; s <= t + .001; s += n) a.push([Math.round(s * 100) / 100, o++ % 2 ? i : r]);
	return a;
}
var I = "transform:translate(0px,0px) rotate(0deg)", Xt = [
	[0, I],
	...Yt(2, 30, 2, "transform:translate(-5px,0px) rotate(-8deg)", "transform:translate(8px,0px) rotate(8deg)"),
	[32, I],
	[34, I],
	...Yt(36, 62, 3.4, "transform:translate(0px,-5px) rotate(0deg)", "transform:translate(0px,6px) rotate(0deg)"),
	[64, I],
	[100, I]
], Zt = [
	[0, `${I};opacity:0`],
	[64, `${I};opacity:0`],
	[66, `${I};opacity:1`],
	[72, `${I};opacity:1`],
	[78, "transform:translate(14px,-4px) rotate(-62deg);opacity:1"],
	[84, "transform:translate(14px,-4px) rotate(-62deg);opacity:1"],
	[90, `${I};opacity:1`],
	[98, `${I};opacity:1`],
	[100, `${I};opacity:0`]
];
function Qt(e, t) {
	return [
		[0, "opacity:0"],
		[Math.max(.1, e - 1), "opacity:0"],
		[e, "opacity:1"],
		[t, "opacity:1"],
		[Math.min(99.9, t + 1.5), "opacity:0"],
		[100, "opacity:0"]
	];
}
function $t(e) {
	return [
		[0, "opacity:0;transform:scale(0.3) translate(0px,0px)"],
		[e, "opacity:0;transform:scale(0.3) translate(0px,0px)"],
		[e + 2, "opacity:1;transform:scale(1) translate(0px,-2px)"],
		[e + 5, "opacity:0;transform:scale(1.5) translate(0px,-9px)"],
		[100, "opacity:0;transform:scale(1.5) translate(0px,-9px)"]
	];
}
var en = o`
  ${a([
	F("arm-l", Xt),
	F("arm-r", Zt),
	F("vis-cloth", Qt(1, 31)),
	F("vis-sock", Qt(35, 63)),
	F("vis-bagarm", Qt(66, 79.5)),
	F("vis-bin", Qt(63, 98)),
	F("vis-tub", [
		[0, "opacity:0;transform:scale(0.6)"],
		[32, "opacity:0;transform:scale(0.6)"],
		[34, "opacity:1;transform:scale(1)"],
		[64, "opacity:1;transform:scale(1)"],
		[66, "opacity:0;transform:scale(0.6)"],
		[100, "opacity:0;transform:scale(0.6)"]
	]),
	F("vis-smudge", [
		[0, "opacity:0.85"],
		[8, "opacity:0.85"],
		[30, "opacity:0"],
		[97, "opacity:0"],
		[99, "opacity:0.85"],
		[100, "opacity:0.85"]
	]),
	F("pop-1", $t(4)),
	F("pop-2", $t(12)),
	F("pop-3", $t(20)),
	F("clean-star", [
		[0, "opacity:0;transform:scale(0.2)"],
		[59, "opacity:0;transform:scale(0.2)"],
		[61, "opacity:1;transform:scale(1.1)"],
		[64, "opacity:0;transform:scale(0.6)"],
		[100, "opacity:0;transform:scale(0.2)"]
	]),
	F("bag-fall", [
		[0, "opacity:0;transform:translateY(0px)"],
		[79.4, "opacity:0;transform:translateY(0px)"],
		[79.5, "opacity:1;transform:translateY(0px)"],
		[83, "opacity:1;transform:translateY(24px)"],
		[84, "opacity:0;transform:translateY(24px)"],
		[100, "opacity:0;transform:translateY(24px)"]
	]),
	F("lid", [
		[0, "transform:rotate(0deg)"],
		[76, "transform:rotate(0deg)"],
		[79, "transform:rotate(-38deg)"],
		[86, "transform:rotate(-38deg)"],
		[89, "transform:rotate(0deg)"],
		[100, "transform:rotate(0deg)"]
	]),
	F("look-work", [
		[0, "transform:translateX(-4px)"],
		[64, "transform:translateX(-4px)"],
		[67, "transform:translateX(4px)"],
		[98, "transform:translateX(4px)"],
		[100, "transform:translateX(-4px)"]
	]),
	F("work-bounce", [
		[0, "transform:scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)))"],
		[31, "transform:scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)))"],
		[33, "transform:scale(calc(1 + -0.05 * var(--k, 1)), calc(1 + 0.07 * var(--k, 1)))"],
		[35, "transform:scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)))"],
		[63, "transform:scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)))"],
		[65, "transform:scale(calc(1 + -0.05 * var(--k, 1)), calc(1 + 0.07 * var(--k, 1)))"],
		[67, "transform:scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)))"],
		[97, "transform:scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)))"],
		[99, "transform:scale(calc(1 + -0.05 * var(--k, 1)), calc(1 + 0.07 * var(--k, 1)))"],
		[100, "transform:scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)))"]
	])
].join("\n"))}

  .arm {
    transform-box: view-box;
  }
  .armL {
    transform-origin: 46px 150px;
  }
  .armR {
    transform-origin: 154px 150px;
  }
  .cloth,
  .sock,
  .bagarm,
  .tub,
  .smudge,
  .bin,
  .bagfall,
  .pop,
  .clean,
  .lid {
    transform-box: view-box;
    opacity: 0;
  }
  .tub {
    transform-origin: 24px 199px;
  }
  .lid {
    opacity: 1;
    transform-origin: -2px 3px;
  }
  .pop,
  .clean {
    transform-box: fill-box;
    transform-origin: 50% 50%;
  }
  .smudge {
    opacity: 0.85;
  }

  /* The housework routine: every part runs on the same 12 second loop. */
  .housework .armL {
    animation: arm-l ${a(String(P))}s ease-in-out infinite;
  }
  .housework .armR {
    animation: arm-r ${a(String(P))}s ease-in-out infinite;
  }
  .housework .cloth {
    animation: vis-cloth ${a(String(P))}s linear infinite;
  }
  .housework .sock {
    animation: vis-sock ${a(String(P))}s linear infinite;
  }
  .housework .bagarm {
    animation: vis-bagarm ${a(String(P))}s linear infinite;
  }
  .housework .bin {
    animation: vis-bin ${a(String(P))}s linear infinite;
  }
  .housework .tub {
    animation: vis-tub ${a(String(P))}s ease-out infinite;
  }
  .housework .smudge {
    animation: vis-smudge ${a(String(P))}s linear infinite;
  }
  .housework .pop.p1 {
    animation: pop-1 ${a(String(P))}s linear infinite;
  }
  .housework .pop.p2 {
    animation: pop-2 ${a(String(P))}s linear infinite;
  }
  .housework .pop.p3 {
    animation: pop-3 ${a(String(P))}s linear infinite;
  }
  .housework .clean {
    animation: clean-star ${a(String(P))}s linear infinite;
  }
  .housework .bagfall {
    animation: bag-fall ${a(String(P))}s linear infinite;
  }
  .housework .lid {
    animation: lid ${a(String(P))}s ease-in-out infinite;
  }
  .housework .eyes {
    animation: look-work ${a(String(P))}s ease-in-out infinite;
  }
  .housework .jelly {
    animation: work-bounce ${a(String(P))}s ease-in-out infinite;
  }
  .suds {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: suds 1.6s ease-in-out infinite;
  }
  .suds.s2 {
    animation-delay: 0.4s;
  }
  .suds.s3 {
    animation-delay: 0.8s;
  }
  .suds.s4 {
    animation-delay: 1.2s;
  }
  @keyframes suds {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.18);
    }
  }

  /* Typing: it looks down at the screen, the hands tap, symbols rise. */
  .typing .eyes {
    animation: none;
    transform: translateY(4px);
  }
  .typing .jelly {
    animation: type-bob 0.64s ease-in-out infinite;
  }
  @keyframes type-bob {
    0%,
    100% {
      transform: scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)));
    }
    50% {
      transform: scale(calc(1 + 0.01 * var(--k, 1)), calc(1 + -0.015 * var(--k, 1)));
    }
  }
  .hand {
    transform-box: fill-box;
    transform-origin: 50% 50%;
    animation: tap-hand 0.32s ease-in-out infinite alternate;
  }
  .hand.h2 {
    animation-delay: 0.16s;
  }
  @keyframes tap-hand {
    from {
      transform: translateY(0px);
    }
    to {
      transform: translateY(5px);
    }
  }
  .code text {
    font: 700 13px ui-monospace, monospace;
    fill: var(--primary-text-color, #fff);
    opacity: 0;
    transform-box: fill-box;
    animation: code-rise 3.2s ease-out infinite;
  }
  .code .c2 {
    animation-delay: 1.05s;
  }
  .code .c3 {
    animation-delay: 2.1s;
  }
  @keyframes code-rise {
    0% {
      opacity: 0;
      transform: translateY(12px);
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(-22px);
    }
  }

  /* The one-shot moments. They play once and win over the mood's own motion. */
  .pet-art.levelup .jelly {
    animation: lv-jump 2.6s ease-out 1 both;
  }
  @keyframes lv-jump {
    0% {
      transform: translateY(0) scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)));
    }
    14% {
      transform: translateY(0) scale(calc(1 + 0.16 * var(--k, 1)), calc(1 + -0.2 * var(--k, 1)));
    }
    38% {
      transform: translateY(-46px) scale(calc(1 + -0.14 * var(--k, 1)), calc(1 + 0.2 * var(--k, 1)));
    }
    56% {
      transform: translateY(0) scale(calc(1 + 0.18 * var(--k, 1)), calc(1 + -0.18 * var(--k, 1)));
    }
    70% {
      transform: translateY(-14px) scale(calc(1 + -0.05 * var(--k, 1)), calc(1 + 0.07 * var(--k, 1)));
    }
    84% {
      transform: translateY(0) scale(calc(1 + 0.06 * var(--k, 1)), calc(1 + -0.06 * var(--k, 1)));
    }
    100% {
      transform: translateY(0) scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)));
    }
  }
  .burst {
    transform-box: fill-box;
    transform-origin: 50% 50%;
    opacity: 0;
    animation: burst 1.5s ease-out 1 both;
  }
  @keyframes burst {
    0% {
      opacity: 0;
      transform: translate(0, 0) scale(0.3);
    }
    25% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(var(--dx), var(--dy)) scale(1.1) rotate(80deg);
    }
  }
  .badge {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: badge 2.6s ease-out 1 both;
  }
  .badge text {
    font: 800 17px system-ui, sans-serif;
    fill: ${a(M)};
  }
  @keyframes badge {
    0% {
      opacity: 0;
      transform: translateY(14px) scale(0.5);
    }
    18% {
      opacity: 1;
      transform: translateY(0) scale(1.1);
    }
    26%,
    80% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-8px) scale(1);
    }
  }

  .pet-art.done .jelly {
    animation: done-hop 1.4s ease-out 1 both;
  }
  @keyframes done-hop {
    0% {
      transform: translateY(0) scale(calc(1 + 0.1 * var(--k, 1)), calc(1 + -0.12 * var(--k, 1)));
    }
    25% {
      transform: translateY(-30px) scale(calc(1 + -0.08 * var(--k, 1)), calc(1 + 0.12 * var(--k, 1)));
    }
    50% {
      transform: translateY(0) scale(calc(1 + 0.12 * var(--k, 1)), calc(1 + -0.14 * var(--k, 1)));
    }
    70% {
      transform: translateY(-8px) scale(calc(1 + -0.02 * var(--k, 1)), calc(1 + 0.03 * var(--k, 1)));
    }
    100% {
      transform: translateY(0) scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)));
    }
  }
  .xp {
    font: 800 19px system-ui, sans-serif;
    fill: #fff;
    stroke: ${a(M)};
    stroke-width: 4px;
    paint-order: stroke;
    animation: xp-rise 1.6s ease-out 1 both;
  }
  @keyframes xp-rise {
    0% {
      opacity: 0;
      transform: translateY(18px);
    }
    20% {
      opacity: 1;
    }
    75% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(-26px);
    }
  }

  .pet-art.tap .jelly {
    animation: tap-squish 0.6s ease-out 1 both;
  }
  @keyframes tap-squish {
    0% {
      transform: scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)));
    }
    22% {
      transform: scale(calc(1 + 0.2 * var(--k, 1)), calc(1 + -0.22 * var(--k, 1)));
    }
    50% {
      transform: scale(calc(1 + -0.1 * var(--k, 1)), calc(1 + 0.14 * var(--k, 1)));
    }
    75% {
      transform: scale(calc(1 + 0.05 * var(--k, 1)), calc(1 + -0.04 * var(--k, 1)));
    }
    100% {
      transform: scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)));
    }
  }
  .heart {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: heart 0.7s ease-out 1 both;
  }
  @keyframes heart {
    0% {
      opacity: 0;
      transform: translateY(10px) scale(0.4);
    }
    35% {
      opacity: 1;
      transform: translateY(-2px) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-18px) scale(1.1);
    }
  }

  .pet-art.wake .jelly {
    animation: wake-stretch 2.4s ease-in-out 1 both;
  }
  @keyframes wake-stretch {
    0% {
      transform: scale(calc(1 + 0.12 * var(--k, 1)), calc(1 + -0.18 * var(--k, 1)));
    }
    30% {
      transform: scale(calc(1 + -0.08 * var(--k, 1)), calc(1 + 0.2 * var(--k, 1)));
    }
    55% {
      transform: scale(calc(1 + -0.04 * var(--k, 1)), calc(1 + 0.14 * var(--k, 1)));
    }
    80% {
      transform: scale(calc(1 + 0.04 * var(--k, 1)), calc(1 + -0.03 * var(--k, 1)));
    }
    100% {
      transform: scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)));
    }
  }
  .yawn {
    transform-box: fill-box;
    transform-origin: 50% 50%;
    animation: yawn 1.8s ease-in-out 1 both;
  }
  @keyframes yawn {
    0% {
      transform: scale(0.1);
    }
    35%,
    65% {
      transform: scale(1);
    }
    100% {
      transform: scale(0.1);
    }
  }
  .d1,
  .d2 {
    transform-box: fill-box;
    transform-origin: 50% 50%;
    animation: twinkle 0.9s ease-out 2;
  }
  .d2 {
    animation-delay: 0.2s;
  }
`, tn = "#101010";
function L(e, t = {}) {
	let n = t.z ?? [0, 0], r = t.tear ?? [0, 0];
	switch (e) {
		case "sleepy": return y`<g class="zzz" transform="translate(${n[0]} ${n[1]})"><text class="z z1" x="146" y="84">z</text><text class="z z2" x="158" y="64">z</text></g>`;
		case "hibernating": return y`<g class="zzz slow" transform="translate(${n[0]} ${n[1]})"><text class="z z1" x="146" y="84">z</text><text class="z z2" x="158" y="64">z</text><text class="z z3" x="170" y="42">Z</text></g>`;
		case "sad": return y`<g transform="translate(${r[0]} ${r[1]})"><path class="tear" d="M130 150 q-6 9 0 14 q6 -5 0 -14 z" fill="#5CC8FF" stroke=${tn} stroke-width="2" stroke-linejoin="round"/></g>`;
		case "happy": return y`<path class="spark s1" d="M26 84 l3.5 8 8 3.5 -8 3.5 -3.5 8 -3.5 -8 -8 -3.5 8 -3.5 z" fill="#FFE45C"/>
        <path class="spark s2" d="M176 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#FFE45C"/>
        <path class="spark s3" d="M168 118 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2 z" fill="#fff"/>`;
		default: return y``;
	}
}
var nn = o`
  .pet-art {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }
  .jelly,
  .shadow,
  .puddle,
  .eye,
  .eyes,
  .z,
  .tear,
  .spark,
  .bubble,
  .snore {
    transform-box: fill-box;
  }
  .jelly {
    transform-origin: 50% 100%;
  }
  .shadow,
  .puddle {
    transform-origin: 50% 50%;
  }
  .eye {
    transform-origin: 50% 50%;
    animation: blink 4.6s infinite;
  }
  @keyframes blink {
    0%,
    93%,
    100% {
      transform: scaleY(1);
    }
    96% {
      transform: scaleY(0.1);
    }
  }
  /* content: the eyes drift to one side and the other, as if it is looking around. */
  .look {
    animation: look 9s ease-in-out infinite;
  }
  @keyframes look {
    0%,
    30%,
    100% {
      transform: translateX(0);
    }
    40%,
    55% {
      transform: translateX(-4px);
    }
    68%,
    82% {
      transform: translateX(4px);
    }
  }
  /* The bubbles inside rise a little and settle again. */
  .bubble {
    animation: bubble 6s ease-in-out infinite;
  }
  .bubble.b2 {
    animation-delay: 2s;
  }
  .bubble.b3 {
    animation-delay: 4s;
  }
  @keyframes bubble {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-9px);
    }
  }

  /* happy: it is the mood for most of a good day, so it stays calm: a slow breath, and one small
     hop every 8 seconds or so. The big hops are for the moments that earn them (level up, step done). */
  .happy .jelly {
    animation: happy-idle 8s ease-in-out infinite;
  }
  .happy .shadow {
    animation: happy-shadow 8s ease-in-out infinite;
  }
  .happy .puddle {
    animation: happy-ripple 8s ease-in-out infinite;
  }
  @keyframes happy-idle {
    0%,
    78%,
    100% {
      transform: translateY(0) scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)));
    }
    22% {
      transform: translateY(0) scale(calc(1 + -0.015 * var(--k, 1)), calc(1 + 0.04 * var(--k, 1)));
    }
    44% {
      transform: translateY(0) scale(calc(1 + 0.01 * var(--k, 1)), calc(1 + -0.01 * var(--k, 1)));
    }
    62% {
      transform: translateY(0) scale(calc(1 + -0.015 * var(--k, 1)), calc(1 + 0.04 * var(--k, 1)));
    }
    84% {
      transform: translateY(0) scale(calc(1 + 0.08 * var(--k, 1)), calc(1 + -0.08 * var(--k, 1)));
    }
    90% {
      transform: translateY(-14px) scale(calc(1 + -0.05 * var(--k, 1)), calc(1 + 0.08 * var(--k, 1)));
    }
    95% {
      transform: translateY(0) scale(calc(1 + 0.07 * var(--k, 1)), calc(1 + -0.07 * var(--k, 1)));
    }
  }
  @keyframes happy-shadow {
    0%,
    84%,
    100% {
      transform: scale(1);
      opacity: 0.22;
    }
    90% {
      transform: scale(0.85);
      opacity: 0.14;
    }
  }
  @keyframes happy-ripple {
    0%,
    88%,
    100% {
      transform: scale(1);
      opacity: 0.35;
    }
    95% {
      transform: scale(1.12);
      opacity: 0.45;
    }
  }
  .spark {
    transform-origin: 50% 50%;
    animation: twinkle 1.6s infinite;
  }
  .spark.s2 {
    animation-delay: 0.5s;
  }
  .spark.s3 {
    animation-delay: 1s;
  }
  @keyframes twinkle {
    0%,
    100% {
      transform: scale(0.4) rotate(0deg);
      opacity: 0;
    }
    50% {
      transform: scale(1) rotate(20deg);
      opacity: 1;
    }
  }

  /* content: it breathes, with a tiny sway. */
  .content .jelly {
    animation: breathe 3.6s ease-in-out infinite;
  }
  @keyframes breathe {
    0%,
    100% {
      transform: scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1))) skewX(0deg);
    }
    35% {
      transform: scale(calc(1 + -0.015 * var(--k, 1)), calc(1 + 0.04 * var(--k, 1))) skewX(0.8deg);
    }
    70% {
      transform: scale(calc(1 + 0.01 * var(--k, 1)), calc(1 + -0.01 * var(--k, 1))) skewX(-0.8deg);
    }
  }

  /* sleepy: slower and lower, a little tilted, with z's. */
  .sleepy .jelly {
    transform: rotate(-3deg);
    animation: breathe-slow 5.2s ease-in-out infinite;
  }
  @keyframes breathe-slow {
    0%,
    100% {
      transform: rotate(-3deg) scale(calc(1 + 0.04 * var(--k, 1)), calc(1 + -0.05 * var(--k, 1)));
    }
    50% {
      transform: rotate(-3deg) scale(calc(1 + -0.01 * var(--k, 1)), calc(1 + 0.02 * var(--k, 1)));
    }
  }

  /* sad: it sags, and a tear rolls. */
  .sad .jelly {
    transform: scale(calc(1 + 0.06 * var(--k, 1)), calc(1 + -0.08 * var(--k, 1)));
    animation: sag 5.5s ease-in-out infinite;
  }
  @keyframes sag {
    0%,
    100% {
      transform: scale(calc(1 + 0.06 * var(--k, 1)), calc(1 + -0.08 * var(--k, 1)));
    }
    50% {
      transform: scale(calc(1 + 0.04 * var(--k, 1)), calc(1 + -0.06 * var(--k, 1)));
    }
  }
  .tear {
    transform-origin: 50% 0%;
    animation: tear 2.8s infinite;
  }
  @keyframes tear {
    0% {
      opacity: 0;
      transform: translateY(0);
    }
    20% {
      opacity: 1;
    }
    80% {
      opacity: 1;
      transform: translateY(20px);
    }
    100% {
      opacity: 0;
      transform: translateY(24px);
    }
  }

  /* hibernating: flat and dim, a very slow breath, a sleep bubble, z's. Never gone, just asleep. */
  .hibernating .jelly {
    transform: scale(calc(1 + 0.12 * var(--k, 1)), calc(1 + -0.2 * var(--k, 1)));
    animation: deep 7s ease-in-out infinite;
  }
  .hibernating .body {
    filter: saturate(0.7) brightness(0.9);
  }
  @keyframes deep {
    0%,
    100% {
      transform: scale(calc(1 + 0.12 * var(--k, 1)), calc(1 + -0.2 * var(--k, 1)));
    }
    50% {
      transform: scale(calc(1 + 0.09 * var(--k, 1)), calc(1 + -0.15 * var(--k, 1)));
    }
  }
  .snore {
    transform-origin: 0% 100%;
    animation: snore 7s ease-in-out infinite;
  }
  @keyframes snore {
    0%,
    100% {
      transform: scale(0.35);
      opacity: 0.4;
    }
    45% {
      transform: scale(1.25);
      opacity: 1;
    }
    55% {
      transform: scale(1.3);
      opacity: 1;
    }
    60% {
      transform: scale(0.2);
      opacity: 0;
    }
  }

  .z {
    font: 700 22px system-ui, sans-serif;
    fill: var(--primary-text-color, #fff);
    transform-origin: 50% 50%;
    animation: zfloat 3s infinite;
    opacity: 0;
  }
  .z.z2 {
    animation-delay: 1s;
  }
  .z.z3 {
    animation-delay: 2s;
  }
  .slow .z {
    animation-duration: 5s;
  }
  @keyframes zfloat {
    0% {
      opacity: 0;
      transform: translate(0, 8px) scale(0.7);
    }
    25% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(8px, -16px) scale(1.1);
    }
  }
`, R = "#3A1204", z = "#8A2A0B", rn = "#6E1F07", B = "#D79563", V = "#190703", an = {
	l: "M54 130 C40 138 38 158 46 170",
	r: "M146 130 C160 138 162 158 154 170"
};
function on(e) {
	return y`<path d=${e} fill="none" stroke=${R} stroke-width="19.5" stroke-linecap="round"/>
    <path d=${e} fill="none" stroke=${z} stroke-width="10.5" stroke-linecap="round"/>`;
}
var sn = {
	color: z,
	thick: 1.5,
	shoulders: {
		l: [54, 130],
		r: [146, 130]
	},
	armD: {
		l: "M54 130 C28 130 16 156 22 180",
		r: "M146 130 C172 132 178 154 170 176"
	},
	typingBehind: !0,
	codeAt: [66, 34]
}, cn = "M54 182 C40 182 36 160 44 138 C52 118 74 110 100 110 C126 110 148 118 156 138 C164 160 160 182 146 182 Z", ln = "M52 80 C52 56 70 42 100 42 C130 42 148 56 148 80 C148 104 130 118 100 118 C70 118 52 104 52 80 Z";
function un(e) {
	switch (e) {
		case "happy": return y`<path d="M72 72 Q80 61 88 72" fill="none" stroke=${V} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M112 72 Q120 61 128 72" fill="none" stroke=${V} stroke-width="4.5" stroke-linecap="round"/>`;
		case "sleepy": return y`<path d="M73 70 Q80 74 87 70" fill="none" stroke=${V} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M113 70 Q120 74 127 70" fill="none" stroke=${V} stroke-width="4.5" stroke-linecap="round"/>`;
		case "hibernating": return y`<path d="M73 68 Q80 76 87 68" fill="none" stroke=${V} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M113 68 Q120 76 127 68" fill="none" stroke=${V} stroke-width="4.5" stroke-linecap="round"/>`;
		case "sad": return y`<g class="eyes">
          <g class="eye"><ellipse cx="80" cy="72" rx="5.6" ry="7" fill=${V}/><circle cx="78.2" cy="68.8" r="2.1" fill="#fff"/><circle cx="82" cy="75" r="1" fill="#fff"/></g>
          <g class="eye"><ellipse cx="120" cy="72" rx="5.6" ry="7" fill=${V}/><circle cx="118.2" cy="68.8" r="2.1" fill="#fff"/><circle cx="122" cy="75" r="1" fill="#fff"/></g>
        </g>
        <path d="M71 61 L88 55" stroke=${V} stroke-width="3.4" stroke-linecap="round"/>
        <path d="M129 61 L112 55" stroke=${V} stroke-width="3.4" stroke-linecap="round"/>`;
		default: return y`<g class="eyes look">
        <g class="eye"><circle cx="80" cy="70" r="5.6" fill=${V}/><circle cx="78.2" cy="67.8" r="1.9" fill="#fff"/></g>
        <g class="eye"><circle cx="120" cy="70" r="5.6" fill=${V}/><circle cx="118.2" cy="67.8" r="1.9" fill="#fff"/></g>
      </g>`;
	}
}
function dn(e) {
	let t = e === "sad" || e === "hibernating" ? .4 : .75;
	return y`<ellipse cx="66" cy="88" rx="6" ry="3.6" fill="#FF8FB0" opacity=${t}/>
    <ellipse cx="134" cy="88" rx="6" ry="3.6" fill="#FF8FB0" opacity=${t}/>`;
}
function fn(e) {
	let t = y`<path d="M100 93 V98" stroke=${V} stroke-width="3.2" stroke-linecap="round"/>`;
	switch (e) {
		case "happy": return y`${t}<path d="M90 98 Q100 118 110 98 Z" fill=${V} stroke=${V} stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M95 108 Q100 102 105 108 Q100 113 95 108 Z" fill="#FF6B8A"/>`;
		case "sleepy": return y`${t}<ellipse cx="100" cy="104" rx="3.8" ry="3.2" fill=${V}/>`;
		case "sad": return y`${t}<path d="M92 107 Q100 98 108 107" fill="none" stroke=${V} stroke-width="3.6" stroke-linecap="round"/>`;
		case "hibernating": return y`${t}<path d="M94 101 Q100 105 106 101" fill="none" stroke=${V} stroke-width="3.4" stroke-linecap="round"/>`;
		default: return y`${t}<path d="M91 98 Q100 108 109 98" fill="none" stroke=${V} stroke-width="3.6" stroke-linecap="round"/>`;
	}
}
function pn(e) {
	return e === "hibernating" ? y`<g class="snore"><circle cx="112" cy="94" r="7" fill="#FFF1DD" fill-opacity="0.55" stroke="#fff" stroke-width="2"/><circle cx="109.5" cy="91.5" r="1.8" fill="#fff"/></g>` : y``;
}
function mn(e, t = {}) {
	let n = t.activity ?? "", r = t.moment ?? "";
	return e = n ? "content" : e, y`<svg class="pet-art bear ${e} ${n ? `work ${n}` : ""} ${r}" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <clipPath id="bear-body-clip"><path d=${cn}/></clipPath>
    </defs>
    <ellipse class="shadow" cx="100" cy="187" rx="62" ry="8" fill="#000" opacity="0.22"/>
    ${Gt(n)} ${N(n, sn)}
    <g class="jelly">
      <g class="ear earL"><circle cx="62" cy="48" r="17" fill=${z} stroke=${R} stroke-width="4"/><circle cx="63" cy="49" r="9" fill=${B}/></g>
      <g class="ear earR"><circle cx="138" cy="48" r="17" fill=${z} stroke=${R} stroke-width="4"/><circle cx="137" cy="49" r="9" fill=${B}/></g>
      ${n ? y`` : y`${on(an.l)}${on(an.r)}`}
      <path d=${cn} fill=${z}/>
      <g clip-path="url(#bear-body-clip)">
        <ellipse cx="100" cy="196" rx="86" ry="30" fill=${rn} opacity="0.55"/>
        <ellipse cx="100" cy="152" rx="29" ry="32" fill=${B}/>
      </g>
      <path d=${cn} fill="none" stroke=${R} stroke-width="4" stroke-linejoin="round"/>
      <g class="foot"><ellipse cx="72" cy="178" rx="19" ry="10" fill=${z} stroke=${R} stroke-width="4"/><ellipse cx="72" cy="180" rx="10" ry="5" fill=${B}/></g>
      <g class="foot"><ellipse cx="128" cy="178" rx="19" ry="10" fill=${z} stroke=${R} stroke-width="4"/><ellipse cx="128" cy="180" rx="10" ry="5" fill=${B}/></g>
      <path d=${ln} fill=${z} stroke=${R} stroke-width="4" stroke-linejoin="round"/>
      <path d="M60 70 C60 58 70 50 82 48" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.16"/>
      <ellipse cx="100" cy="96" rx="25" ry="19" fill=${B}/>
      ${dn(e)} ${un(e)}
      <rect x="88" y="80" width="24" height="14" rx="7" fill=${V}/>
      <ellipse cx="94" cy="84" rx="4.5" ry="2" fill="#fff" opacity="0.8"/>
      ${r === "wake" ? y`<path d="M100 93 V98" stroke=${V} stroke-width="3.2" stroke-linecap="round"/>` : fn(e)}
      ${pn(e)}
    </g>
    ${Kt(n, sn)}
    ${n ? y`` : L(e, {
		z: [10, -30],
		tear: [-8, -68]
	})}
    ${Jt(r, t.text ?? "", {
		mouth: [100, 106],
		badgeDy: -16,
		xpDy: -42,
		heartDy: -34
	})}
  </svg>`;
}
var hn = o`
  /* A bear is heavy: it only squashes a third as much as the slime. */
  .bear {
    --k: 0.3;
  }
  .bear .ear,
  .bear .foot {
    transform-box: fill-box;
  }
  .bear .ear {
    transform-origin: 50% 70%;
    animation: ear-twitch 9s ease-in-out infinite;
  }
  .bear .earR {
    animation-delay: 3.5s;
  }
  @keyframes ear-twitch {
    0%,
    90%,
    100% {
      transform: rotate(0deg);
    }
    93% {
      transform: rotate(-9deg);
    }
    96% {
      transform: rotate(4deg);
    }
  }
  .bear.hibernating .ear,
  .bear.sad .ear {
    animation: none;
  }
`, H = "#8C78CC", U = "#1B1133", gn = "#2F2054", _n = "#170E2E", vn = "#3C2C70", W = "#C4B6F0", yn = "#D69AE8", bn = "#1F9C7C", xn = "#0E5C48", Sn = {
	color: "#2A1B4A",
	ink: H,
	thick: 1.4,
	shoulders: {
		l: [80, 130],
		r: [120, 130]
	},
	armD: {
		l: "M78 130 C40 130 16 152 22 180",
		r: "M122 130 C160 132 176 154 170 176"
	},
	typingBehind: !0,
	codeAt: [66, 34]
}, Cn = "M72 182 C66 162 68 134 80 120 C88 112 112 112 120 120 C132 134 134 162 128 182 Z", wn = "M54 78 C54 54 74 46 100 46 C126 46 146 54 146 78 C146 102 126 118 100 118 C74 118 54 102 54 78 Z", Tn = "M124 176 C168 184 182 156 164 144 C150 135 154 116 174 112";
function En(e) {
	switch (e) {
		case "happy": return y`<path d="M71 84 Q80 71 89 84" fill="none" stroke=${W} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M111 84 Q120 71 129 84" fill="none" stroke=${W} stroke-width="4.5" stroke-linecap="round"/>`;
		case "sleepy": return y`<path d="M72 81 Q80 86 88 81" fill="none" stroke=${W} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M112 81 Q120 86 128 81" fill="none" stroke=${W} stroke-width="4.5" stroke-linecap="round"/>`;
		case "hibernating": return y`<path d="M72 79 Q80 88 88 79" fill="none" stroke=${W} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M112 79 Q120 88 128 79" fill="none" stroke=${W} stroke-width="4.5" stroke-linecap="round"/>`;
		case "sad": return y`<g class="eyes">
          <g class="eye"><circle cx="80" cy="82" r="9.5" fill=${W}/><ellipse cx="80" cy="83" rx="5.4" ry="6.6" fill=${U}/><circle cx="78" cy="80" r="2.2" fill="#fff"/></g>
          <g class="eye"><circle cx="120" cy="82" r="9.5" fill=${W}/><ellipse cx="120" cy="83" rx="5.4" ry="6.6" fill=${U}/><circle cx="118" cy="80" r="2.2" fill="#fff"/></g>
        </g>
        <path d="M69 69 L90 63" stroke=${W} stroke-width="3.4" stroke-linecap="round"/>
        <path d="M131 69 L110 63" stroke=${W} stroke-width="3.4" stroke-linecap="round"/>`;
		default: return y`<g class="eyes look">
        <g class="eye"><circle cx="80" cy="80" r="9.5" fill=${W}/><circle cx="80" cy="80" r="5" fill=${U}/><circle cx="82" cy="78" r="1.9" fill="#fff"/></g>
        <g class="eye"><circle cx="120" cy="80" r="9.5" fill=${W}/><circle cx="120" cy="80" r="5" fill=${U}/><circle cx="122" cy="78" r="1.9" fill="#fff"/></g>
      </g>`;
	}
}
function Dn(e) {
	let t = y`<path d="M100 95 V98" stroke=${W} stroke-width="2.8" stroke-linecap="round"/>`;
	switch (e) {
		case "happy": return y`${t}<path d="M91 99 Q100 114 109 99 Z" fill=${U} stroke=${W} stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M95 106 Q100 101 105 106 Q100 111 95 106 Z" fill="#FF7FA3"/>`;
		case "sleepy": return y`${t}<ellipse cx="100" cy="104" rx="3.2" ry="2.6" fill=${W}/>`;
		case "sad": return y`${t}<path d="M92 107 Q100 99 108 107" fill="none" stroke=${W} stroke-width="3" stroke-linecap="round"/>`;
		case "hibernating": return y`${t}<path d="M95 101 Q100 105 105 101" fill="none" stroke=${W} stroke-width="3" stroke-linecap="round"/>`;
		default: return y`${t}<path d="M92 100 Q96 106 100 98 Q104 106 108 100" fill="none" stroke=${W} stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
	}
}
function On() {
	return y`<g class="whiskers" fill="none" stroke=${W} stroke-width="2" stroke-linecap="round" opacity="0.85">
    <path d="M68 92 L34 84"/><path d="M68 97 L32 98"/><path d="M70 102 L38 112"/>
    <path d="M132 92 L166 84"/><path d="M132 97 L168 98"/><path d="M130 102 L162 112"/>
  </g>`;
}
function kn(e) {
	return e === "hibernating" ? y`<g class="snore"><circle cx="113" cy="98" r="7" fill="#E9E0FF" fill-opacity="0.45" stroke="#fff" stroke-width="2"/><circle cx="110.5" cy="95.5" r="1.8" fill="#fff"/></g>` : y``;
}
function An(e, t = {}) {
	let n = t.activity ?? "", r = t.moment ?? "";
	return e = n ? "content" : e, y`<svg class="pet-art cat ${e} ${n ? `work ${n}` : ""} ${r}" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <linearGradient id="cat-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color=${gn}/>
        <stop offset="1" stop-color=${_n}/>
      </linearGradient>
      <clipPath id="cat-body-clip"><path d=${Cn}/></clipPath>
    </defs>
    <ellipse class="shadow" cx="100" cy="187" rx="56" ry="8" fill="#000" opacity="0.3"/>
    ${Gt(n)} ${N(n, Sn)}
    <g class="jelly">
      <g class="tail">
        <path d=${Tn} fill="none" stroke=${H} stroke-width="17" stroke-linecap="round"/>
        <path d=${Tn} fill="none" stroke=${U} stroke-width="10.5" stroke-linecap="round"/>
      </g>
      <g class="ear earL"><path d="M56 72 C52 52 52 36 56 22 C70 28 84 38 92 50 Z" fill="url(#cat-fill)" stroke=${H} stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M63 58 C61 48 61 40 63 33 C70 37 77 42 81 48 Z" fill="#6E5AA8"/></g>
      <g class="ear earR"><path d="M144 72 C148 52 148 36 144 22 C130 28 116 38 108 50 Z" fill="url(#cat-fill)" stroke=${H} stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M137 58 C139 48 139 40 137 33 C130 37 123 42 119 48 Z" fill="#6E5AA8"/></g>
      <path d=${Cn} fill="url(#cat-fill)"/>
      <g clip-path="url(#cat-body-clip)">
        <path d="M86 116 L100 128 L114 116 L117 176 L83 176 Z" fill=${vn}/>
        <path d="M100 128 V176" stroke="#2A1C52" stroke-width="2.4"/>
        <ellipse cx="100" cy="198" rx="70" ry="22" fill="#000" opacity="0.25"/>
      </g>
      <path d=${Cn} fill="none" stroke=${H} stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="86" cy="180" rx="13" ry="7.5" fill=${vn} stroke=${H} stroke-width="3.5"/>
      <ellipse cx="114" cy="180" rx="13" ry="7.5" fill=${vn} stroke=${H} stroke-width="3.5"/>
      <path d=${wn} fill="url(#cat-fill)" stroke=${H} stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M62 70 C62 60 70 54 82 52" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.14"/>
      ${On()} ${En(e)}
      <path d="M94.5 89 L105.5 89 L100 96 Z" fill=${yn} stroke=${yn} stroke-width="2" stroke-linejoin="round"/>
      ${r === "wake" ? y`<path d="M100 95 V98" stroke=${W} stroke-width="2.8" stroke-linecap="round"/>` : Dn(e)}
      ${kn(e)}
      <g><path d="M100 121 L80 112 L80 130 Z" fill=${bn} stroke=${xn} stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M100 121 L120 112 L120 130 Z" fill=${bn} stroke=${xn} stroke-width="2.4" stroke-linejoin="round"/>
        <circle cx="100" cy="121" r="5" fill="#27B592" stroke=${xn} stroke-width="2.4"/></g>
    </g>
    ${Kt(n, Sn)}
    ${n ? y`` : L(e, {
		z: [10, -30],
		tear: [-10, -62]
	})}
    ${Jt(r, t.text ?? "", {
		mouth: [100, 106],
		badgeDy: -18,
		xpDy: -46,
		heartDy: -44
	})}
  </svg>`;
}
var jn = o`
  /* A cat is graceful: it squashes a bit less than the slime. */
  .cat {
    --k: 0.4;
  }
  .cat .ear,
  .cat .tail,
  .cat .whiskers {
    transform-box: fill-box;
  }
  .cat .ear {
    transform-origin: 50% 100%;
    animation: cat-ear 8s ease-in-out infinite;
  }
  .cat .earR {
    animation-delay: 3.5s;
  }
  @keyframes cat-ear {
    0%,
    88%,
    100% {
      transform: rotate(0deg);
    }
    91% {
      transform: rotate(-9deg);
    }
    94% {
      transform: rotate(3deg);
    }
  }
  .cat .tail {
    transform-origin: 0% 100%;
    animation: cat-swish 3.6s ease-in-out infinite alternate;
  }
  .cat.happy .tail {
    animation-duration: 1.6s;
  }
  .cat.work .tail {
    animation-duration: 2s;
  }
  .cat.sleepy .tail,
  .cat.hibernating .tail,
  .cat.sad .tail {
    animation: none;
  }
  .cat.sleepy .ear,
  .cat.hibernating .ear,
  .cat.sad .ear {
    animation: none;
  }
  .cat.sad .earL {
    transform: rotate(-12deg);
  }
  .cat.sad .earR {
    transform: rotate(12deg);
  }
  @keyframes cat-swish {
    from {
      transform: rotate(-5deg);
    }
    to {
      transform: rotate(6deg);
    }
  }
  .cat .whiskers {
    transform-origin: 50% 50%;
    animation: whisker 6s ease-in-out infinite;
  }
  @keyframes whisker {
    0%,
    90%,
    100% {
      transform: scaleY(1);
    }
    94% {
      transform: scaleY(1.12);
    }
  }
`, G = "#2F2E5C", Mn = "#F9A03B", Nn = "#E0821F", Pn = "#FFF4E2", Fn = "#9C6A57", In = "#B8826C", Ln = "#FF8FA3", Rn = "#FF6B8A", zn = {
	color: Mn,
	thick: 1.4,
	shoulders: {
		l: [80, 130],
		r: [120, 130]
	},
	armD: {
		l: "M78 130 C40 130 16 152 22 180",
		r: "M122 130 C160 132 176 154 170 176"
	},
	typingBehind: !0,
	codeAt: [66, 34]
}, Bn = "M122 185 C158 190 186 168 184 136 C183 108 154 98 141 115 C133 128 143 137 151 141 C156 147 150 163 137 167 C129 169 121 167 115 163 Z", Vn = "M72 182 C66 160 68 130 78 116 C86 106 114 106 122 116 C132 130 134 160 128 182 Z", Hn = "M50 80 C50 54 72 40 100 40 C128 40 150 54 150 80 C150 106 128 118 100 118 C72 118 50 106 50 80 Z", Un = "M51 82 Q100 62 149 82 C150 106 128 118 100 118 C72 118 50 106 51 82 Z";
function Wn(e) {
	switch (e) {
		case "happy": return y`<path d="M73 85 Q82 72 91 85" fill="none" stroke=${G} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M109 85 Q118 72 127 85" fill="none" stroke=${G} stroke-width="4.5" stroke-linecap="round"/>`;
		case "sleepy": return y`<path d="M74 82 Q82 87 90 82" fill="none" stroke=${G} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M110 82 Q118 87 126 82" fill="none" stroke=${G} stroke-width="4.5" stroke-linecap="round"/>`;
		case "hibernating": return y`<path d="M74 80 Q82 89 90 80" fill="none" stroke=${G} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M110 80 Q118 89 126 80" fill="none" stroke=${G} stroke-width="4.5" stroke-linecap="round"/>`;
		case "sad": return y`<g class="eyes">
          <g class="eye"><ellipse cx="82" cy="83" rx="6.6" ry="8.2" fill=${G}/><circle cx="79.8" cy="79.5" r="2.5" fill="#fff"/><circle cx="84.4" cy="86.5" r="1.2" fill="#fff"/></g>
          <g class="eye"><ellipse cx="118" cy="83" rx="6.6" ry="8.2" fill=${G}/><circle cx="115.8" cy="79.5" r="2.5" fill="#fff"/><circle cx="120.4" cy="86.5" r="1.2" fill="#fff"/></g>
        </g>
        <path d="M72 71 L91 65" stroke=${G} stroke-width="3.6" stroke-linecap="round"/>
        <path d="M128 71 L109 65" stroke=${G} stroke-width="3.6" stroke-linecap="round"/>`;
		default: return y`<g class="eyes look">
        <g class="eye"><circle cx="82" cy="82" r="7.4" fill=${G}/><circle cx="84.6" cy="79" r="2.7" fill="#fff"/><circle cx="79.6" cy="85" r="1.3" fill="#fff"/></g>
        <g class="eye"><circle cx="118" cy="82" r="7.4" fill=${G}/><circle cx="120.6" cy="79" r="2.7" fill="#fff"/><circle cx="115.6" cy="85" r="1.3" fill="#fff"/></g>
      </g>`;
	}
}
function Gn(e) {
	let t = e === "sad" || e === "hibernating" ? .55 : .9;
	return y`<ellipse cx="65" cy="98" rx="10" ry="7" fill=${Ln} opacity=${t}/>
    <ellipse cx="135" cy="98" rx="10" ry="7" fill=${Ln} opacity=${t}/>`;
}
function Kn(e) {
	let t = y`<path d="M100 97 V101" stroke=${G} stroke-width="3" stroke-linecap="round"/>`;
	switch (e) {
		case "happy": return y`${t}<path d="M88 101 Q100 122 112 101 Z" fill=${G} stroke=${G} stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M94 112 Q100 104 106 112 Q100 119 94 112 Z" fill=${Rn}/>`;
		case "sleepy": return y`${t}<ellipse cx="100" cy="106" rx="3.6" ry="3" fill=${G}/>`;
		case "sad": return y`${t}<path d="M91 110 Q100 101 109 110" fill="none" stroke=${G} stroke-width="3.6" stroke-linecap="round"/>`;
		case "hibernating": return y`${t}<path d="M94 104 Q100 108 106 104" fill="none" stroke=${G} stroke-width="3.4" stroke-linecap="round"/>`;
		default: return y`${t}<path d="M90 102 Q95 109 100 101 Q105 109 110 102" fill="none" stroke=${G} stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
	}
}
function qn(e) {
	return e === "hibernating" ? y`<g class="snore"><circle cx="112" cy="97" r="7" fill="#FFF1DD" fill-opacity="0.55" stroke="#fff" stroke-width="2"/><circle cx="109.5" cy="94.5" r="1.8" fill="#fff"/></g>` : y``;
}
function Jn(e, t = {}) {
	let n = t.activity ?? "", r = t.moment ?? "";
	return e = n ? "content" : e, y`<svg class="pet-art dog ${e} ${n ? `work ${n}` : ""} ${r}" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <clipPath id="dog-body-clip"><path d=${Vn}/></clipPath>
      <clipPath id="dog-tail-clip"><path d=${Bn}/></clipPath>
      <clipPath id="dog-head-clip"><path d=${Hn}/></clipPath>
    </defs>
    <ellipse class="shadow" cx="100" cy="187" rx="56" ry="8" fill="#000" opacity="0.22"/>
    ${Gt(n)} ${N(n, zn)}
    <g class="jelly">
      <g class="tail">
        <path d=${Bn} fill=${Mn}/>
        <g clip-path="url(#dog-tail-clip)">
          <circle cx="158" cy="118" r="15" fill=${Pn}/>
          <path d="M122 182 C150 182 168 168 170 150" fill="none" stroke=${Nn} stroke-width="8" opacity="0.45"/>
        </g>
        <path d=${Bn} fill="none" stroke=${G} stroke-width="4" stroke-linejoin="round"/>
      </g>
      <g class="ear earL"><path d="M64 50 C44 40 24 56 26 86 C27 100 42 104 50 92 C58 80 66 66 64 50 Z" fill=${Fn} stroke=${G} stroke-width="4" stroke-linejoin="round"/>
        <path d="M44 56 C34 62 32 78 36 90" fill="none" stroke=${In} stroke-width="4" stroke-linecap="round" opacity="0.7"/></g>
      <g class="ear earR"><path d="M136 50 C156 40 176 56 174 86 C173 100 158 104 150 92 C142 80 134 66 136 50 Z" fill=${Fn} stroke=${G} stroke-width="4" stroke-linejoin="round"/>
        <path d="M156 56 C166 62 168 78 164 90" fill="none" stroke=${In} stroke-width="4" stroke-linecap="round" opacity="0.7"/></g>
      <path d=${Vn} fill=${Mn}/>
      <g clip-path="url(#dog-body-clip)">
        <ellipse cx="100" cy="196" rx="70" ry="26" fill=${Nn} opacity="0.5"/>
        <path d="M86 108 Q100 130 114 108 L118 170 Q100 178 82 170 Z" fill=${Pn}/>
      </g>
      <path d=${Vn} fill="none" stroke=${G} stroke-width="4" stroke-linejoin="round"/>
      ${n ? y`` : y`<path d="M97 140 V178 M103 140 V178" stroke=${G} stroke-width="3" stroke-linecap="round"/>`}
      <ellipse cx="86" cy="180" rx="13" ry="7.5" fill="#fff" stroke=${G} stroke-width="4"/>
      <ellipse cx="114" cy="180" rx="13" ry="7.5" fill="#fff" stroke=${G} stroke-width="4"/>
      <path d=${Hn} fill=${Mn}/>
      <g clip-path="url(#dog-head-clip)">
        <path d=${Un} fill=${Pn}/>
        <ellipse cx="100" cy="53" rx="7" ry="4" fill="#FFD9A0"/>
      </g>
      <path d=${Hn} fill="none" stroke=${G} stroke-width="4" stroke-linejoin="round"/>
      ${Gn(e)} ${Wn(e)}
      <ellipse cx="100" cy="93" rx="6" ry="4.4" fill=${G}/>
      <ellipse cx="98" cy="91.6" rx="1.8" ry="1" fill="#fff" opacity="0.7"/>
      ${r === "wake" ? y`<path d="M100 97 V101" stroke=${G} stroke-width="3" stroke-linecap="round"/>` : Kn(e)}
      ${qn(e)}
    </g>
    ${Kt(n, zn)}
    ${n ? y`` : L(e, {
		z: [10, -30],
		tear: [-8, -58]
	})}
    ${Jt(r, t.text ?? "", {
		mouth: [100, 110],
		badgeDy: -14,
		xpDy: -42,
		heartDy: -40
	})}
  </svg>`;
}
var Yn = o`
  /* A puppy is lively: it squashes about half as much as the slime. */
  .dog {
    --k: 0.5;
  }
  .dog .ear,
  .dog .tail {
    transform-box: fill-box;
  }
  .dog .earL {
    transform-origin: 90% 10%;
    animation: ear-flop-l 6s ease-in-out infinite;
  }
  .dog .earR {
    transform-origin: 10% 10%;
    animation: ear-flop-r 6s ease-in-out 2s infinite;
  }
  @keyframes ear-flop-l {
    0%,
    80%,
    100% {
      transform: rotate(0deg);
    }
    88% {
      transform: rotate(7deg);
    }
    94% {
      transform: rotate(-3deg);
    }
  }
  @keyframes ear-flop-r {
    0%,
    80%,
    100% {
      transform: rotate(0deg);
    }
    88% {
      transform: rotate(-7deg);
    }
    94% {
      transform: rotate(3deg);
    }
  }
  .dog .tail {
    transform-origin: 0% 90%;
    animation: wag 2.4s ease-in-out infinite alternate;
  }
  .dog.happy .tail {
    animation-duration: 0.45s;
  }
  .dog.work .tail {
    animation-duration: 0.9s;
  }
  .dog.sleepy .tail,
  .dog.hibernating .tail,
  .dog.sad .tail {
    animation: none;
  }
  .dog.sad .earL {
    animation: none;
    transform: rotate(8deg);
  }
  .dog.sad .earR {
    animation: none;
    transform: rotate(-8deg);
  }
  .dog.hibernating .earL,
  .dog.hibernating .earR,
  .dog.sleepy .earL,
  .dog.sleepy .earR {
    animation: none;
  }
  @keyframes wag {
    from {
      transform: rotate(-9deg);
    }
    to {
      transform: rotate(9deg);
    }
  }
`, K = "#3B2A3F", q = "#F28A30", Xn = "#D96E1B", Zn = "#F6EDD6", Qn = "#4B2E3A", $n = "#FF6B8A", er = {
	color: q,
	thick: 1.4,
	shoulders: {
		l: [80, 130],
		r: [120, 130]
	},
	armD: {
		l: "M78 130 C40 130 16 152 22 180",
		r: "M122 130 C160 132 176 154 170 176"
	},
	typingBehind: !0,
	codeAt: [66, 34]
}, tr = "M70 182 C64 160 66 132 78 118 C86 108 114 108 122 118 C134 132 136 160 130 182 Z", nr = "M100 44 C124 44 146 52 154 68 L162 90 C142 102 128 116 100 124 C72 116 58 102 38 90 L46 68 C54 52 76 44 100 44 Z", rr = "M38 90 C60 98 82 82 100 100 C118 82 140 98 162 90 C142 102 128 116 100 124 C72 116 58 102 38 90 Z", ir = "M120 186 C162 194 198 164 192 122 C188 92 170 74 154 84 C146 96 158 108 160 124 C162 148 146 166 120 168 Z";
function ar(e) {
	switch (e) {
		case "happy": return y`<path d="M70 84 Q78 72 86 84" fill="none" stroke=${K} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M114 84 Q122 72 130 84" fill="none" stroke=${K} stroke-width="4.5" stroke-linecap="round"/>`;
		case "sleepy": return y`<path d="M71 81 Q78 86 85 81" fill="none" stroke=${K} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M115 81 Q122 86 129 81" fill="none" stroke=${K} stroke-width="4.5" stroke-linecap="round"/>`;
		case "hibernating": return y`<path d="M71 79 Q78 88 85 79" fill="none" stroke=${K} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M115 79 Q122 88 129 79" fill="none" stroke=${K} stroke-width="4.5" stroke-linecap="round"/>`;
		case "sad": return y`<g class="eyes">
          <g class="eye"><ellipse cx="78" cy="82" rx="6" ry="7.6" fill=${K}/><circle cx="76" cy="78.8" r="2.3" fill="#fff"/><circle cx="80.2" cy="85.4" r="1.1" fill="#fff"/></g>
          <g class="eye"><ellipse cx="122" cy="82" rx="6" ry="7.6" fill=${K}/><circle cx="120" cy="78.8" r="2.3" fill="#fff"/><circle cx="124.2" cy="85.4" r="1.1" fill="#fff"/></g>
        </g>
        <path d="M68 70 L87 64" stroke=${K} stroke-width="3.4" stroke-linecap="round"/>
        <path d="M132 70 L113 64" stroke=${K} stroke-width="3.4" stroke-linecap="round"/>`;
		default: return y`<g class="eyes look">
        <g class="eye"><circle cx="78" cy="80" r="6.6" fill=${K}/><circle cx="80.2" cy="77.4" r="2.4" fill="#fff"/><circle cx="75.8" cy="83" r="1.2" fill="#fff"/></g>
        <g class="eye"><circle cx="122" cy="80" r="6.6" fill=${K}/><circle cx="124.2" cy="77.4" r="2.4" fill="#fff"/><circle cx="119.8" cy="83" r="1.2" fill="#fff"/></g>
      </g>`;
	}
}
function or(e) {
	let t = e === "sad" || e === "hibernating" ? .4 : .7;
	return y`<ellipse cx="66" cy="97" rx="7" ry="4.4" fill="#FFA08A" opacity=${t}/>
    <ellipse cx="134" cy="97" rx="7" ry="4.4" fill="#FFA08A" opacity=${t}/>`;
}
function sr(e) {
	let t = y`<path d="M100 109 V112" stroke=${K} stroke-width="3" stroke-linecap="round"/>`;
	switch (e) {
		case "happy": return y`${t}<path d="M92 112 Q100 126 108 112 Z" fill=${K} stroke=${K} stroke-width="3" stroke-linejoin="round"/>
        <path d="M96 118 Q100 114 104 118 Q100 123 96 118 Z" fill=${$n}/>`;
		case "sleepy": return y`${t}<ellipse cx="100" cy="117" rx="3.4" ry="2.8" fill=${K}/>`;
		case "sad": return y`${t}<path d="M93 119 Q100 112 107 119" fill="none" stroke=${K} stroke-width="3.4" stroke-linecap="round"/>`;
		case "hibernating": return y`${t}<path d="M95 115 Q100 119 105 115" fill="none" stroke=${K} stroke-width="3.2" stroke-linecap="round"/>`;
		default: return y`${t}<path d="M92 114 Q96 120 100 112 Q104 120 108 114" fill="none" stroke=${K} stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
	}
}
function cr(e) {
	return e === "hibernating" ? y`<g class="snore"><circle cx="113" cy="108" r="7" fill="#FFF1DD" fill-opacity="0.55" stroke="#fff" stroke-width="2"/><circle cx="110.5" cy="105.5" r="1.8" fill="#fff"/></g>` : y``;
}
function lr(e, t = {}) {
	let n = t.activity ?? "", r = t.moment ?? "";
	return e = n ? "content" : e, y`<svg class="pet-art fox ${e} ${n ? `work ${n}` : ""} ${r}" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <clipPath id="fox-body-clip"><path d=${tr}/></clipPath>
      <clipPath id="fox-head-clip"><path d=${nr}/></clipPath>
      <clipPath id="fox-tail-clip"><path d=${ir}/></clipPath>
    </defs>
    <ellipse class="shadow" cx="100" cy="187" rx="56" ry="8" fill="#000" opacity="0.22"/>
    ${Gt(n)} ${N(n, er)}
    <g class="jelly">
      <g class="tail">
        <path d=${ir} fill=${q}/>
        <g clip-path="url(#fox-tail-clip)">
          <circle cx="166" cy="86" r="20" fill=${Zn}/>
          <path d="M120 188 C166 196 200 164 194 122" fill="none" stroke=${Xn} stroke-width="9" opacity="0.5"/>
        </g>
        <path d=${ir} fill="none" stroke=${K} stroke-width="4" stroke-linejoin="round"/>
      </g>
      <g class="ear earL"><path d="M56 64 L50 18 C64 20 84 34 92 50 Z" fill=${q} stroke=${K} stroke-width="4" stroke-linejoin="round"/>
        <path d="M60 54 L57 30 C66 34 76 42 80 50 Z" fill=${Qn}/></g>
      <g class="ear earR"><path d="M144 64 L150 18 C136 20 116 34 108 50 Z" fill=${q} stroke=${K} stroke-width="4" stroke-linejoin="round"/>
        <path d="M140 54 L143 30 C134 34 124 42 120 50 Z" fill=${Qn}/></g>
      <path d=${tr} fill=${q}/>
      <g clip-path="url(#fox-body-clip)">
        <ellipse cx="100" cy="196" rx="70" ry="26" fill=${Xn} opacity="0.5"/>
        <path d="M86 110 Q100 132 114 110 L118 170 Q100 178 82 170 Z" fill=${Zn}/>
      </g>
      <path d=${tr} fill="none" stroke=${K} stroke-width="4" stroke-linejoin="round"/>
      ${n ? y`` : y`<path d="M97 144 V166 M103 144 V166" stroke=${K} stroke-width="3" stroke-linecap="round"/>`}
      <ellipse cx="86" cy="180" rx="13" ry="7.5" fill=${Qn} stroke=${K} stroke-width="4"/>
      <ellipse cx="114" cy="180" rx="13" ry="7.5" fill=${Qn} stroke=${K} stroke-width="4"/>
      <path d=${nr} fill=${q}/>
      <g clip-path="url(#fox-head-clip)">
        <path d=${rr} fill=${Zn}/>
      </g>
      <path d=${nr} fill="none" stroke=${K} stroke-width="4" stroke-linejoin="round"/>
      ${or(e)} ${ar(e)}
      <ellipse cx="100" cy="105" rx="6.4" ry="4.6" fill=${K}/>
      <ellipse cx="98" cy="103.4" rx="1.9" ry="1" fill="#fff" opacity="0.7"/>
      ${r === "wake" ? y`<path d="M100 109 V112" stroke=${K} stroke-width="3" stroke-linecap="round"/>` : sr(e)}
      ${cr(e)}
    </g>
    ${Kt(n, er)}
    ${n ? y`` : L(e, {
		z: [14, -30],
		tear: [-8, -60]
	})}
    ${Jt(r, t.text ?? "", {
		mouth: [100, 118],
		badgeDy: -16,
		xpDy: -46,
		heartDy: -44
	})}
  </svg>`;
}
var ur = o`
  /* A fox is light and quick: it squashes a bit less than the slime. */
  .fox {
    --k: 0.4;
  }
  .fox .ear,
  .fox .tail {
    transform-box: fill-box;
  }
  .fox .ear {
    transform-origin: 50% 100%;
    animation: fox-ear 7s ease-in-out infinite;
  }
  .fox .earR {
    animation-delay: 3s;
  }
  @keyframes fox-ear {
    0%,
    88%,
    100% {
      transform: rotate(0deg);
    }
    91% {
      transform: rotate(-8deg);
    }
    94% {
      transform: rotate(3deg);
    }
  }
  .fox .tail {
    transform-origin: 0% 90%;
    animation: fox-sway 3s ease-in-out infinite alternate;
  }
  .fox.happy .tail {
    animation-duration: 0.9s;
  }
  .fox.work .tail {
    animation-duration: 1.4s;
  }
  .fox.sleepy .tail,
  .fox.hibernating .tail,
  .fox.sad .tail {
    animation: none;
  }
  .fox.sad .ear,
  .fox.sleepy .ear,
  .fox.hibernating .ear {
    animation: none;
  }
  .fox.sad .earL {
    transform: rotate(-10deg);
  }
  .fox.sad .earR {
    transform: rotate(10deg);
  }
  @keyframes fox-sway {
    from {
      transform: rotate(-6deg);
    }
    to {
      transform: rotate(6deg);
    }
  }
`, J = "#101010", dr = {
	color: "#4DFF2B",
	thick: 1,
	typingBehind: !0
}, fr = "M100 64 C106 64 108 70 114 73 C146 80 166 108 166 138 C166 164 146 182 118 182 L82 182 C54 182 34 164 34 138 C34 108 54 80 86 73 C92 70 94 64 100 64 Z";
function pr(e) {
	switch (e) {
		case "happy": return y`<path d="M70 137 Q80 119 90 137" fill="none" stroke=${J} stroke-width="5" stroke-linecap="round"/>
        <path d="M110 137 Q120 119 130 137" fill="none" stroke=${J} stroke-width="5" stroke-linecap="round"/>`;
		case "sleepy": return y`<path d="M71 134 Q80 138 89 134" fill="none" stroke=${J} stroke-width="5" stroke-linecap="round"/>
        <path d="M111 134 Q120 138 129 134" fill="none" stroke=${J} stroke-width="5" stroke-linecap="round"/>`;
		case "hibernating": return y`<path d="M71 132 Q80 141 89 132" fill="none" stroke=${J} stroke-width="5" stroke-linecap="round"/>
        <path d="M111 132 Q120 141 129 132" fill="none" stroke=${J} stroke-width="5" stroke-linecap="round"/>`;
		case "sad": return y`<g class="eyes">
          <g class="eye"><ellipse cx="80" cy="134" rx="6.5" ry="12.5" fill=${J}/><circle cx="77.8" cy="128.5" r="2.8" fill="#fff"/><circle cx="82" cy="140" r="1.3" fill="#fff"/></g>
          <g class="eye"><ellipse cx="120" cy="134" rx="6.5" ry="12.5" fill=${J}/><circle cx="117.8" cy="128.5" r="2.8" fill="#fff"/><circle cx="122" cy="140" r="1.3" fill="#fff"/></g>
        </g>
        <path d="M68 121 L89 113" stroke=${J} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M132 121 L111 113" stroke=${J} stroke-width="4.5" stroke-linecap="round"/>`;
		default: return y`<g class="eyes look">
        <g class="eye"><ellipse cx="80" cy="132" rx="6.5" ry="12.5" fill=${J}/><circle cx="77.8" cy="126.5" r="2.8" fill="#fff"/><circle cx="82" cy="138" r="1.3" fill="#fff"/></g>
        <g class="eye"><ellipse cx="120" cy="132" rx="6.5" ry="12.5" fill=${J}/><circle cx="117.8" cy="126.5" r="2.8" fill="#fff"/><circle cx="122" cy="138" r="1.3" fill="#fff"/></g>
      </g>`;
	}
}
function mr(e) {
	let t = e === "sad" || e === "hibernating" ? .45 : .85;
	return y`<ellipse cx="61" cy="151" rx="7" ry="4.2" fill="#FF9EC0" opacity=${t}/>
    <ellipse cx="139" cy="151" rx="7" ry="4.2" fill="#FF9EC0" opacity=${t}/>`;
}
function hr(e) {
	switch (e) {
		case "happy": return y`<path d="M87 147 Q100 176 113 147 Z" fill=${J} stroke=${J} stroke-width="4" stroke-linejoin="round"/>
        <path d="M93 162 Q100 154 107 162 Q100 170 93 162 Z" fill="#FF6B8A"/>`;
		case "sleepy": return y`<ellipse cx="100" cy="155" rx="4.5" ry="3.6" fill=${J}/>`;
		case "sad": return y`<path d="M91 160 Q100 149 109 160" fill="none" stroke=${J} stroke-width="5" stroke-linecap="round"/>`;
		case "hibernating": return y`<path d="M93 155 Q100 159 107 155" fill="none" stroke=${J} stroke-width="4.5" stroke-linecap="round"/>`;
		default: return y`<path d="M90 150 Q100 161 110 150" fill="none" stroke=${J} stroke-width="5" stroke-linecap="round"/>`;
	}
}
function gr(e) {
	return e === "hibernating" ? y`<g class="snore"><circle cx="113" cy="152" r="7" fill="#D8FFE2" fill-opacity="0.55" stroke="#fff" stroke-width="2"/><circle cx="110.5" cy="149.5" r="1.8" fill="#fff"/></g>` : y``;
}
function _r(e, t = {}) {
	let n = t.activity ?? "", r = t.moment ?? "";
	return e = n ? "content" : e, y`<svg class="pet-art slime ${e} ${n ? `work ${n}` : ""} ${r}" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <radialGradient id="slime-fill" cx="0.36" cy="0.3" r="0.9">
        <stop offset="0" stop-color="#D4FFC2"/>
        <stop offset="0.28" stop-color="#7CFF5B"/>
        <stop offset="0.62" stop-color="#39FF14"/>
        <stop offset="1" stop-color="#10B83A"/>
      </radialGradient>
      <clipPath id="slime-clip"><path d=${fr}/></clipPath>
    </defs>
    <ellipse class="shadow" cx="100" cy="187" rx="58" ry="8" fill="#000" opacity="0.22"/>
    <ellipse class="puddle" cx="100" cy="184" rx="66" ry="9" fill="#39FF14" opacity="0.35"/>
    ${Gt(n)} ${N(n, dr)}
    <g class="jelly">
      <path class="body" d=${fr} fill="url(#slime-fill)"/>
      <g clip-path="url(#slime-clip)">
        <ellipse cx="100" cy="196" rx="84" ry="34" fill="#047A28" opacity="0.38"/>
        <ellipse cx="160" cy="132" rx="14" ry="48" fill="#fff" opacity="0.13"/>
        <circle class="bubble b1" cx="146" cy="168" r="6" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.38" stroke-width="1.8"/>
        <circle class="bubble b2" cx="132" cy="176" r="3" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.38" stroke-width="1.5"/>
        <circle class="bubble b3" cx="54" cy="172" r="4" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.38" stroke-width="1.6"/>
      </g>
      <path class="body-line" d=${fr} fill="none" stroke=${J} stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="76" cy="100" rx="17" ry="9" transform="rotate(-32 76 100)" fill="#fff" opacity="0.4"/>
      <path d="M50 128 C49 108 60 92 78 86" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.7"/>
      <circle cx="49" cy="143" r="3.6" fill="#fff" opacity="0.65"/>
      ${mr(e)} ${pr(e)}
      ${r === "wake" ? y`` : hr(e)} ${gr(e)}
    </g>
    ${Kt(n, dr)}
    ${n ? y`` : L(e)}
    ${Jt(r, t.text ?? "")}
  </svg>`;
}
// src/pets.ts
var vr = [
	{
		kind: "slime",
		label: "Slime",
		emoji: "🟢",
		art: !0
	},
	{
		kind: "bear",
		label: "Bear",
		emoji: "🐻",
		art: !0
	},
	{
		kind: "cat",
		label: "Cat",
		emoji: "🐱",
		art: !0
	},
	{
		kind: "dog",
		label: "Dog",
		emoji: "🐶",
		art: !0
	},
	{
		kind: "fox",
		label: "Fox",
		emoji: "🦊",
		art: !0
	}
], yr = [
	"happy",
	"content",
	"sleepy",
	"sad",
	"hibernating"
];
function br(e) {
	return vr.find((t) => t.kind === e) ?? vr[0];
}
// src/boopli-pet.ts
var xr = {
	happy: "✨",
	content: "",
	sleepy: "💤",
	sad: "💧",
	hibernating: "🌙💤"
}, Sr = class extends w {
	static {
		this.properties = {
			kind: { type: String },
			mood: { type: String },
			level: { type: Number },
			away: { type: Boolean },
			still: {
				type: Boolean,
				reflect: !0
			},
			activity: { type: String },
			moment: { type: String },
			momentSeq: { type: Number },
			momentText: { type: String },
			_playing: { state: !0 },
			_text: { state: !0 }
		};
	}
	constructor() {
		super(), this._momentTimer = 0, this._momentLeft = 0, this._momentSince = 0, this._onVisibility = () => {
			this.toggleAttribute("paused", document.hidden), document.hidden ? this._momentTimer && (window.clearTimeout(this._momentTimer), this._momentTimer = 0, this._momentLeft = Math.max(0, this._momentLeft - (Date.now() - this._momentSince))) : this._playing && !this._momentTimer && this._startMomentTimer();
		}, this._taps = [], this.kind = "slime", this.mood = "content", this.level = 1, this.away = !1, this.still = !1, this.activity = "", this.moment = "", this.momentSeq = 0, this.momentText = "", this._playing = "", this._text = "";
	}
	_startMomentTimer() {
		this._momentSince = Date.now(), this._momentTimer = window.setTimeout(() => {
			this._momentTimer = 0, this._momentLeft = 0, this._playing = "", this.dispatchEvent(new CustomEvent("moment-end", {
				bubbles: !0,
				composed: !0
			}));
		}, this._momentLeft);
	}
	connectedCallback() {
		super.connectedCallback(), document.addEventListener("visibilitychange", this._onVisibility), this._onVisibility();
	}
	disconnectedCallback() {
		document.removeEventListener("visibilitychange", this._onVisibility), window.clearTimeout(this._momentTimer), super.disconnectedCallback();
	}
	updated(e) {
		e.has("momentSeq") && this.moment && this._play(this.moment, this.momentText);
	}
	async _play(e, t = "") {
		window.clearTimeout(this._momentTimer), this._momentTimer = 0, this._playing = "", await this.updateComplete, this.offsetWidth, this._text = t, this._playing = e, this._momentLeft = Rt[e], document.hidden || this._startMomentTimer();
	}
	_art() {
		let e = br(this.kind), t = {
			activity: this.activity,
			moment: this._playing,
			text: this._text
		};
		return e.art && e.kind === "slime" ? _r(this.mood, t) : e.art && e.kind === "bear" ? mn(this.mood, t) : e.art && e.kind === "dog" ? Jn(this.mood, t) : e.art && e.kind === "cat" ? An(this.mood, t) : e.art && e.kind === "fox" ? lr(this.mood, t) : v`<span class="emoji" aria-hidden="true">${e.emoji}</span>
      <span class="badge" aria-hidden="true">${this.away ? "🧳" : xr[this.mood]}</span>`;
	}
	_tap() {
		!this._playing && !this.still && this._play("tap");
		let e = Date.now();
		this._taps = [...this._taps.filter((t) => e - t < 4e3), e], this._taps.length >= 7 && (this._taps = [], this.dispatchEvent(new CustomEvent("egg-found", {
			bubbles: !0,
			composed: !0
		})));
	}
	render() {
		return v`<div
      class="pet ${this.mood}"
      role="img"
      aria-label="Your pet is ${this.mood}"
      @click=${() => this._tap()}
    >
      ${this._art()}
    </div>`;
	}
	static {
		this.styles = [
			nn,
			hn,
			jn,
			Yn,
			ur,
			en,
			o`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .pet {
        position: relative;
        width: 100%;
        height: 100%;
        container-type: size;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: visible;
      }
      .emoji {
        font-size: 62cqh;
        line-height: 1;
      }
      .badge {
        position: absolute;
        right: 8%;
        top: 4%;
        font-size: 24cqh;
      }
      .sad .emoji {
        filter: grayscale(0.5);
      }
      .hibernating .emoji {
        opacity: 0.55;
        filter: grayscale(0.7);
        transform: scale(0.85);
      }
      /* Nothing moves while the page is hidden, in a still preview, or when the system asks for less motion. */
      :host([paused]) *,
      :host([still]) * {
        animation-play-state: paused !important;
      }
      @media (prefers-reduced-motion: reduce) {
        * {
          animation: none !important;
        }
        .z,
        .spark {
          opacity: 1 !important;
        }
        .tear {
          opacity: 1 !important;
        }
      }
    `
		];
	}
};
customElements.define("boopli-pet", Sr);
// src/boopli-stage.ts
var Y = "#101010", Cr = y`<svg viewBox="0 0 72 48" aria-hidden="true">
  <ellipse cx="36" cy="43" rx="33" ry="5" fill="#7B5BD6" stroke=${Y} stroke-width="2.5"/>
  <path d="M9 19 Q9 41 36 41 Q63 41 63 19 Z" fill="#F4F1FF" stroke=${Y} stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M10 27 Q36 35 62 27 L61 32 Q36 40 11 32 Z" fill="#5B8DEF"/>
  <circle cx="36" cy="34" r="2.8" fill="#fff"/>
  <circle cx="31.5" cy="30.6" r="1.5" fill="#fff"/><circle cx="36" cy="29.3" r="1.5" fill="#fff"/><circle cx="40.5" cy="30.6" r="1.5" fill="#fff"/>
  <path d="M14 26 Q14 33 20 37" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
  <ellipse cx="36" cy="19" rx="27" ry="7" fill="#E6E0FF" stroke=${Y} stroke-width="2.5"/>
  <ellipse cx="36" cy="19.5" rx="22" ry="5" fill="#7FD8FF"/>
  <ellipse class="ripple" cx="36" cy="19.5" rx="7" ry="1.8" fill="none" stroke="#fff" stroke-width="1.4"/>
  <path d="M20 18.5 Q26 16.5 32 18" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
</svg>`, wr = y`<svg viewBox="0 0 72 48" aria-hidden="true">
  <ellipse cx="36" cy="43" rx="33" ry="5" fill="#C94F6D" stroke=${Y} stroke-width="2.5"/>
  <path d="M9 19 Q9 41 36 41 Q63 41 63 19 Z" fill="#FFF1E2" stroke=${Y} stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M10 27 Q36 35 62 27 L61 32 Q36 40 11 32 Z" fill="#FF9F5A"/>
  <path d="M30 31.5 a3 3 0 1 1 6 0 a3 3 0 1 1 6 0 q0 4 -6 7 q-6 -3 -6 -7 z" fill="#fff"/>
  <path d="M14 26 Q14 33 20 37" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
  <ellipse cx="36" cy="19" rx="27" ry="7" fill="#FFE3C7" stroke=${Y} stroke-width="2.5"/>
  <ellipse cx="36" cy="18" rx="22" ry="5" fill="#8A5A3A"/>
  <circle cx="22" cy="15.5" r="3" fill="#C98A5A" stroke=${Y} stroke-width="1.5"/>
  <circle cx="29" cy="12.5" r="3" fill="#B6784A" stroke=${Y} stroke-width="1.5"/>
  <circle cx="44" cy="12.8" r="3" fill="#C98A5A" stroke=${Y} stroke-width="1.5"/>
  <circle cx="50" cy="16" r="3" fill="#B6784A" stroke=${Y} stroke-width="1.5"/>
  <circle cx="36" cy="15" r="3" fill="#B6784A" stroke=${Y} stroke-width="1.5"/>
  <g transform="translate(36 8) rotate(-12)">
    <rect x="-9" y="-2.4" width="18" height="4.8" rx="2.4" fill="#F6E3B4" stroke=${Y} stroke-width="1.6"/>
    <circle cx="-9" cy="-2.8" r="2.8" fill="#F6E3B4" stroke=${Y} stroke-width="1.6"/><circle cx="-9" cy="2.8" r="2.8" fill="#F6E3B4" stroke=${Y} stroke-width="1.6"/>
    <circle cx="9" cy="-2.8" r="2.8" fill="#F6E3B4" stroke=${Y} stroke-width="1.6"/><circle cx="9" cy="2.8" r="2.8" fill="#F6E3B4" stroke=${Y} stroke-width="1.6"/>
  </g>
</svg>`, Tr = y`<svg viewBox="0 0 120 64" aria-hidden="true">
  <ellipse cx="60" cy="58" rx="56" ry="5" fill="#000" opacity="0.2"/>
  <path d="M6 42 Q2 6 60 6 Q118 6 114 42 L114 52 Q60 64 6 52 Z" fill="#A98BFF" stroke=${Y} stroke-width="3" stroke-linejoin="round"/>
  <path d="M14 34 Q18 14 60 13" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.45"/>
  <path d="M22 17 l1.6 3.4 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5 z" fill="#FFE45C" stroke=${Y} stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M60 9 l1.6 3.4 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5 z" fill="#FFE45C" stroke=${Y} stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M98 17 l1.6 3.4 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5 z" fill="#FFE45C" stroke=${Y} stroke-width="1.2" stroke-linejoin="round"/>
  <ellipse cx="60" cy="42" rx="47" ry="13" fill="#E3D6FF" stroke=${Y} stroke-width="2.5"/>
  <rect x="12" y="26" width="31" height="17" rx="8.5" fill="#FFF1B8" stroke=${Y} stroke-width="2.5"/>
  <path d="M18 34 H37" stroke=${Y} stroke-width="1.5" stroke-dasharray="3 3" stroke-linecap="round" opacity="0.4"/>
</svg>`, Er = y`<svg viewBox="0 0 120 64" aria-hidden="true">
  <g class="blanket">
    <path d="M18 38 Q24 33 30 38 Q36 33 42 38 Q48 33 54 38 Q60 33 66 38 Q72 33 78 38 Q84 33 90 38 Q96 33 102 38 L104 52 Q60 62 16 52 Z" fill="#FF9EC0" stroke=${Y} stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M22 44 Q60 52 98 44" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
    <path d="M28 49 Q60 57 92 49" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
  </g>
  <path d="M8 44 Q60 60 112 44 Q118 56 104 60 Q60 68 16 60 Q2 56 8 44 Z" fill="#8B5CF6" stroke=${Y} stroke-width="3" stroke-linejoin="round"/>
  <path d="M16 52 Q60 62 104 52" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/>
</svg>`, Dr = y`<svg viewBox="0 0 50 50" aria-hidden="true">
  <path d="M17 17 V11 Q17 7 21 7 H29 Q33 7 33 11 V17" fill="none" stroke=${Y} stroke-width="3" stroke-linecap="round"/>
  <rect x="5" y="16" width="40" height="30" rx="6" fill="#FF8A3D" stroke=${Y} stroke-width="3"/>
  <path d="M17 16 V46 M33 16 V46" stroke=${Y} stroke-width="2.5" opacity="0.55"/>
  <rect x="22" y="28" width="6" height="5" rx="1.5" fill="#FFD166" stroke=${Y} stroke-width="2"/>
</svg>`, Or = class extends w {
	static {
		this.properties = {
			kind: { type: String },
			mood: { type: String },
			level: { type: Number },
			away: { type: Boolean },
			activity: { type: String },
			moment: { type: String },
			momentSeq: { type: Number },
			momentText: { type: String }
		};
	}
	constructor() {
		super(), this._onVisibility = () => {
			this.toggleAttribute("paused", document.hidden);
		}, this.kind = "slime", this.mood = "content", this.level = 1, this.away = !1, this.activity = "", this.moment = "", this.momentSeq = 0, this.momentText = "";
	}
	connectedCallback() {
		super.connectedCallback(), document.addEventListener("visibilitychange", this._onVisibility), this._onVisibility();
	}
	disconnectedCallback() {
		document.removeEventListener("visibilitychange", this._onVisibility), super.disconnectedCallback();
	}
	render() {
		let e = this.level >= 3, t = this.away ? "hibernating" : this.mood, n = this.away ? "" : this.activity, r = e && !n && (t === "sleepy" || t === "hibernating");
		return v`<div class="scene ${r ? "sleeping" : ""} ${r && t === "hibernating" ? "deep" : ""}" role="group" aria-label="Your pet's room">
      <div class="floor"></div>
      <div class="prop water">${Cr}</div>
      ${this.level >= 2 ? v`<div class="prop food">${wr}</div>` : x}
      ${e ? v`<div class="prop bed">${Tr}</div>` : x}
      <div class="actor">
        <boopli-pet
          .kind=${this.kind}
          .mood=${t}
          .level=${this.level}
          .away=${this.away}
          .activity=${n}
          .moment=${this.moment}
          .momentSeq=${this.momentSeq}
          .momentText=${this.momentText}
        ></boopli-pet>
      </div>
      ${e ? v`<div class="prop bed front">${Er}</div>` : x}
      ${this.away ? v`<div class="prop suitcase">${Dr}</div>` : x}
    </div>`;
	}
	static {
		this.styles = [E, o`
      :host {
        display: block;
      }
      .scene {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 6; /* a third lower than 16:9 */
        container-type: size;
        border-radius: 14px;
        overflow: hidden;
        background: color-mix(in srgb, var(--primary-color, #03a9f4) 10%, var(--secondary-background-color, #2a2a2a));
      }
      .floor {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 24%;
        background: color-mix(in srgb, var(--primary-text-color, #888) 14%, var(--secondary-background-color, #2a2a2a));
        border-top: 2px solid color-mix(in srgb, var(--primary-text-color, #888) 22%, transparent);
      }
      .prop {
        position: absolute;
        pointer-events: none;
      }
      .prop svg {
        display: block;
        width: 100%;
        height: auto;
        overflow: visible;
      }
      /* Everything in the room is sized by the room's height, so the card can be as low as you want. */
      .water {
        left: 7%;
        bottom: 3cqh;
        width: 36cqh;
      }
      .food {
        left: calc(7% + 40cqh);
        bottom: 3cqh;
        width: 36cqh;
      }
      .bed {
        right: 3%;
        bottom: 3cqh;
        width: 80cqh;
      }
      .suitcase {
        left: calc(50% + 24cqh);
        bottom: 4cqh;
        width: 26cqh;
      }
      .actor {
        position: absolute;
        left: 50%;
        bottom: 4cqh;
        height: 86cqh;
        aspect-ratio: 1;
        transform: translateX(-50%);
        transform-origin: 50% 100%;
        transition: left 0.9s ease, bottom 0.9s ease, transform 0.9s ease;
      }
      /* Asleep: the pet is in the bed, a little smaller, with the blanket over part of it. */
      .sleeping .actor {
        left: calc(100% - 3% - 40cqh);
        bottom: 7cqh;
        transform: translateX(-50%) scale(0.82);
      }
      .blanket {
        transform-box: view-box;
        transform-origin: 60px 50px;
        transition: transform 0.9s ease;
        /* Awake: the blanket lies folded at the end of the bed. */
        transform: translate(34px, 2px) scale(0.5, 0.6);
      }
      .sleeping .blanket {
        transform: translate(0, 4px) scale(0.95, 0.85);
      }
      .deep .blanket {
        transform: translate(0, -1px) scale(0.95, 1);
      }
      /* The water in the bowl ripples. */
      .ripple {
        transform-box: fill-box;
        transform-origin: 50% 50%;
        animation: ripple 3.4s ease-out infinite;
      }
      :host([paused]) .ripple {
        animation-play-state: paused;
      }
      @keyframes ripple {
        0% {
          transform: scale(0.3);
          opacity: 0.9;
        }
        100% {
          transform: scale(2.4);
          opacity: 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .ripple {
          animation: none;
          opacity: 0.6;
        }
        .actor,
        .blanket {
          transition: none;
        }
      }
      /* A phone is narrower, so the room is a little taller there (still a third lower than before). */
      @media (max-width: 760px) {
        .scene {
          aspect-ratio: 2 / 1;
        }
        .actor {
          height: 72cqh;
        }
        .water {
          left: 3%;
          width: 30cqh;
        }
        .food {
          left: calc(3% + 33cqh);
          width: 30cqh;
        }
        .bed {
          right: 3%;
          width: 62cqh;
        }
        .sleeping .actor {
          left: calc(100% - 3% - 31cqh);
        }
        .suitcase {
          left: calc(50% + 22cqh);
          width: 20cqh;
        }
      }
    `];
	}
};
customElements.define("boopli-stage", Or);
// src/boopli-egg.ts
var kr = 30, Ar = 1.5, jr = .55, Mr = 6.1, Nr = 60 / 140, Pr = 260, Fr = 227, Ir = new URL("./easter-egg.mp3", "" + import.meta.url).href, Lr = new URL("./easter-egg-intro.webm", "" + import.meta.url).href, Rr = new URL("./easter-egg-loop.webm", "" + import.meta.url).href, zr = 12;
function Br() {
	let e = navigator.userAgent, t = /iPhone|iPad|iPod/.test(e) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1, n = /safari/i.test(e) && !/chrome|chromium|crios|fxios|edg|android/i.test(e);
	return t || n;
}
var Vr = class extends w {
	static {
		this.properties = {
			_muted: { state: !0 },
			_cat: { state: !0 },
			_note: { state: !0 }
		};
	}
	constructor() {
		super(), this._started = 0, this._lastHop = -1, this._hasSound = !1, this._over = !1, this._muted = !1, this._cat = !1, this._note = !1;
	}
	connectedCallback() {
		if (super.connectedCallback(), Br()) {
			this._note = !0, this._noteTimer = window.setTimeout(() => this._stop(!0), zr * 1e3);
			return;
		}
		let e = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? !1;
		this._cat = !e && document.createElement("video").canPlayType("video/webm; codecs=\"vp9\"") !== "", this._started = performance.now();
		try {
			let e = new Audio(Ir);
			e.volume = jr, e.muted = this._muted, this._audio = e, e.play().then(() => this._hasSound = !0, () => void 0);
		} catch {}
		this.dispatchEvent(new CustomEvent("egg-started", {
			bubbles: !0,
			composed: !0
		})), this.updateComplete.then(() => this._run());
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._stop(!1);
	}
	_time() {
		return this._hasSound && this._audio ? this._audio.currentTime : (performance.now() - this._started) / 1e3;
	}
	_run() {
		let e = this.renderRoot.querySelector("video.intro"), t = this.renderRoot.querySelector("video.loop"), n = this.renderRoot.querySelector(".egg-cat"), r = this.renderRoot.querySelector(".egg-layer");
		e && e.play().catch(() => void 0);
		let i = !1;
		if (n) {
			let e = (window.innerWidth - Pr) / 2, t = (window.innerHeight - Fr) / 2;
			n.style.transform = `translate(${e}px, ${t}px) scale(1)`;
		}
		let a = () => {
			let o = this._time(), s = kr - o, c = Math.max(0, Math.min(1, s / Ar));
			if (r && (r.style.opacity = String(c)), this._audio && (this._audio.volume = jr * c), s <= 0) this._stop(!0);
			else {
				if (e && t && !i && (this._hasSound && Math.abs(e.currentTime - o) > .15 && (e.currentTime = o), (e.ended || e.currentTime >= e.duration - .04) && (i = !0, t.hidden = !1, t.play().catch(() => void 0), e.hidden = !0)), n && o >= Mr) {
					let e = Math.floor((o - Mr) / Nr);
					if (e !== this._lastHop) {
						this._lastHop = e;
						let t = .75 + Math.random() * .7, r = Pr * t, i = Fr * t, a = Math.random() * Math.max(1, window.innerWidth - r), o = Math.random() * Math.max(1, window.innerHeight - i);
						n.style.transform = `translate(${a}px, ${o}px) scale(${t})`;
					}
				}
				this._frame = requestAnimationFrame(a);
			}
		};
		this._frame = requestAnimationFrame(a);
	}
	_stop(e) {
		this._frame && cancelAnimationFrame(this._frame), this._frame = void 0, this._noteTimer && window.clearTimeout(this._noteTimer), this._noteTimer = void 0, this._audio &&= (this._audio.pause(), void 0), e && !this._over && (this._over = !0, this.dispatchEvent(new CustomEvent("egg-done", {
			bubbles: !0,
			composed: !0
		})));
	}
	_toggleMute() {
		this._muted = !this._muted, this._audio && (this._audio.muted = this._muted);
	}
	render() {
		return this._note ? v`<div class="note" role="status">
        <span
          >Here would be an Easter egg. 🐱 But you're on Safari, so you get a sentence instead of a spinning cat. On an
          iPhone or iPad no browser can do it. On a Mac, Chrome or Firefox will. Or go all the way and switch to
          non-Apple products 😉</span
        >
        <button type="button" class="ctl" aria-label="Close" @click=${() => this._stop(!0)}>✕</button>
      </div>` : v`${this._cat ? v`<div class="egg-layer" aria-hidden="true">
            <div class="egg-cat">
              <video class="intro" src=${Lr} muted playsinline preload="auto"></video>
              <video class="loop" src=${Rr} muted playsinline loop preload="auto" hidden></video>
            </div>
          </div>` : ""}
      <div class="controls">
        <button
          type="button"
          class="ctl"
          aria-label=${this._muted ? "Turn the sound on" : "Turn the sound off"}
          @click=${() => this._toggleMute()}
        >
          ${this._muted ? "🔇" : "🔊"}
        </button>
        <button type="button" class="ctl" aria-label="Stop the Easter egg" @click=${() => this._stop(!0)}>⏹ Stop</button>
      </div>`;
	}
	static {
		this.styles = o`
    :host {
      display: contents;
    }
    /* The cat roams over the whole screen and never takes a click. */
    .egg-layer {
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      overflow: hidden;
    }
    .egg-cat {
      position: absolute;
      left: 0;
      top: 0;
      width: 260px;
      height: 227px;
      transform-origin: 0 0;
      transition: transform 0.32s cubic-bezier(0.25, 1.35, 0.5, 1);
      will-change: transform;
    }
    .egg-cat video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      pointer-events: none;
    }
    .controls {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 10000;
      display: flex;
      gap: 8px;
    }
    .note {
      position: fixed;
      right: 18px;
      bottom: 18px;
      left: 18px;
      max-width: 420px;
      margin-left: auto;
      z-index: 10000;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 12px 14px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      font-size: 15px;
      line-height: 1.4;
    }
    .ctl {
      border: 1px solid var(--divider-color);
      border-radius: 999px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      min-height: 0;
      padding: 6px 14px;
      font: inherit;
      font-size: 16px;
      cursor: pointer;
    }
  `;
	}
};
customElements.define("boopli-egg", Vr);
// src/boopli-today.ts
function Hr(e, t) {
	if (!t.group) return null;
	let n = e.steps.filter((e) => e.group === t.group), r = e.steps.some((e) => e.group !== t.group && e.status !== "done");
	return {
		done: n.filter((e) => e.status === "done").length,
		total: n.length,
		canPark: r
	};
}
function Ur(e) {
	return e.away ? `${e.name} is resting while you are away.` : {
		happy: "Nice, you got things done today.",
		content: "Ready when you are.",
		sleepy: `${e.name} is a bit sleepy.`,
		sad: `${e.name} misses you. One step is enough.`,
		hibernating: `${e.name} is curled up, resting until you are back. One step wakes it.`
	}[e.mood];
}
var Wr = class extends w {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			nowMs: { type: Number },
			_busy: { state: !0 },
			_error: { state: !0 },
			_toast: { state: !0 },
			_quick: { state: !0 },
			_park: { state: !0 },
			_removing: { state: !0 },
			_egg: { state: !0 },
			_moment: { state: !0 },
			_momentSeq: { state: !0 },
			_momentText: { state: !0 }
		};
	}
	constructor() {
		super(), this._lastRunIds = [], this.nowMs = Date.now(), this._busy = !1, this._error = "", this._toast = "", this._quick = "", this._park = null, this._removing = "", this._egg = !1, this._moment = "", this._momentSeq = 0, this._momentText = "";
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
		this._moment = "done", this._momentText = `+${t.total_xp - n.total_xp} XP`, (n.mood === "sleepy" || n.mood === "hibernating") && (this._moment = "wake", this._momentText = ""), t.level > n.level && (this._moment = "levelup", this._momentText = `Level ${t.level}!`), this._momentSeq += 1;
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
		return v`
      <section class="card quick">
        <h3>What do you want to get done?</h3>
        ${this.snapshot?.settings.ai?.enabled ? v`
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
            ` : v`
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
		if (!e) return x;
		let t = e.xp_for_level > 0 ? Math.round(e.xp_in_level / e.xp_for_level * 100) : 0, n = (this.snapshot?.runs ?? []).some((e) => e.steps.some((e) => e.status === "active" && !!e.on_it_until));
		return v`
      <section class="card pet-card stage-slot">
        <boopli-stage
          .kind=${this.snapshot?.settings?.pet_kind ?? "slime"}
          .mood=${e.mood}
          .level=${e.level}
          .away=${e.away ?? !1}
          .activity=${n && !e.away ? "housework" : ""}
          .moment=${this._moment}
          .momentSeq=${this._momentSeq}
          .momentText=${this._momentText}
          @egg-found=${() => this._egg = !0}
        ></boopli-stage>
        ${this._egg ? v`<boopli-egg @egg-done=${() => this._egg = !1}></boopli-egg>` : x}
        <div class="pet-info">
          <div class="pet-name">${e.name} <span class="muted">· Level ${e.level}</span></div>
          <div class="bar" role="progressbar" aria-valuenow=${t} aria-valuemin="0" aria-valuemax="100">
            <div class="fill" style="width:${t}%"></div>
          </div>
          <div class="muted small">${e.xp_in_level} / ${e.xp_for_level} XP to the next level</div>
          <div class="small">${Ur(e)}</div>
        </div>
      </section>
      ${this._toast ? v`<div class="toast" role="status">${this._toast}</div>` : x}
    `;
	}
	async _done(e, t) {
		if (this.hass && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				await ht(this.hass, e, t);
			} catch (e) {
				this._error = T(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	async _working(e, t, n) {
		if (this.hass && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				await (n ? nt : rt)(this.hass, e, t);
			} catch (e) {
				this._error = T(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_defaultPick() {
		let e = new Date(this.nowMs + 864e5), t = (e) => String(e).padStart(2, "0");
		return `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())}T09:00`;
	}
	_openPark(e) {
		this._error = "", this._park = {
			...e,
			picking: !1,
			at: this._defaultPick()
		};
	}
	async _choose(e) {
		let t = this._park;
		if (this.hass && t && !this._busy) {
			if (e === "at" && !t.picking) this._park = {
				...t,
				picking: !0
			};
			else {
				this._busy = !0, this._error = "";
				try {
					t.choreId ? await xt(this.hass, t.choreId, e, t.at) : await bt(this.hass, t.runId ?? "", t.group ?? "", e, t.at), this._park = null;
				} catch (e) {
					this._error = T(e);
				} finally {
					this._busy = !1;
				}
			}
		}
	}
	_renderParkAsk() {
		let e = this._park;
		return e ? v`<div class="park-ask" role="group" aria-label="When should this part come back?">
      <div class="small">${e.choreId ? "When should it come back?" : `Set “${e.group}” aside. When should it come back?`}</div>
      <div class="park-buttons">
        <button ?disabled=${this._busy} @click=${() => this._choose("any")}>When I want</button>
        <button ?disabled=${this._busy} @click=${() => this._choose("tomorrow")}>Tomorrow, 9:00</button>
        <button ?disabled=${this._busy} @click=${() => this._choose("at")}>Pick a time</button>
        <button class="link" @click=${() => this._park = null}>Cancel</button>
      </div>
      ${e.picking ? v`<div class="park-pick">
            <input
              type="datetime-local"
              aria-label="Date and time"
              .value=${e.at}
              @input=${(e) => this._park &&= {
			...this._park,
			at: e.target.value
		}}
            />
            <button class="primary" ?disabled=${this._busy || !e.at} @click=${() => this._choose("at")}>Set it</button>
          </div>` : x}
      <div class="muted small">Nothing is lost. The steps wait as their own small task under “Set aside for later”.</div>
    </div>` : x;
	}
	_renderAway(e) {
		let t = this.snapshot?.away;
		if (!t?.active) return x;
		let n = !!this.snapshot?.away_now;
		return v`<section class="away-banner ${n ? "on" : "planned"}" role="status">
      <div class="away-icon" aria-hidden="true">🧳</div>
      <div class="away-text">
        <div class="away-title">${n ? "AWAY MODE IS ON" : "AWAY MODE IS PLANNED"}</div>
        <div class="away-when">${Ft(t, this.nowMs, e, n)}</div>
        <div class="away-note">
          ${n ? "Nothing starts and nothing nudges you, except the chores that keep going." : "Boopli carries on as usual until then."}
        </div>
      </div>
      <div class="away-actions">
        <button class="primary big" ?disabled=${this._busy} @click=${() => this._partAction(() => pt(this.hass))}>
          ${n ? "Back now" : "Cancel it"}
        </button>
        <button class="link" @click=${() => this.dispatchEvent(new CustomEvent("goto-settings", {
			bubbles: !0,
			composed: !0
		}))}>
          Change in Settings
        </button>
      </div>
    </section>`;
	}
	_renderQuestions() {
		return (this.snapshot?.runs ?? []).filter((e) => e.questions_open && (e.questions ?? []).length > 0).map((e) => v`<section class="card ask">
        <div class="muted small">${e.chore_name}</div>
        <h2>Quick look first</h2>
        <p class="muted small">
          It started with all its steps. Answer, and the steps you do not need today disappear.
        </p>
        <boopli-questions
          .questions=${e.questions ?? []}
          .busy=${this._busy}
          .cancelable=${!1}
          label="Done"
          allLabel="Keep all steps"
          @answered=${(t) => this._partAction(() => mt(this.hass, e.id, t.detail.answers))}
          @all-steps=${() => this._partAction(() => mt(this.hass, e.id, {}))}
        ></boopli-questions>
      </section>`);
	}
	_parkedParts() {
		let e = new Set(this.snapshot?.runs.map((e) => e.chore_id) ?? []);
		return (this.snapshot?.chores ?? []).filter((t) => t.parked && !e.has(t.id));
	}
	async _partAction(e) {
		if (this.hass && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				await e();
			} catch (e) {
				this._error = T(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_heading(e, t) {
		return v`<h3 class="sec-title">${e}<span class="count">${t}</span></h3>`;
	}
	_renderReady(e) {
		let t = e.ready.reduce((e, t) => e + t.steps.length, 0);
		return t === 0 ? x : v`<section class="sec">
      ${this._heading("Ready now", t)}
      ${e.ready.map((e) => v`<div class="group">
          <div class="group-name strong">${e.run.chore_name}</div>
          ${e.steps.map((e) => v`<div class="row"><span>${e.title}</span></div>`)}
        </div>`)}
    </section>`;
	}
	_renderStill(e, t) {
		let n = e.groups.reduce((e, t) => e + t.steps.length, 0) + e.dueToday.length;
		return n === 0 ? x : v`<section class="sec soft">
      ${this._heading("Still to do today", n)}
      ${e.groups.map((e) => v`<div class="group">
          <div class="group-name">${e.run.chore_name}</div>
          ${e.steps.map((e) => v`<div class="row">
              <span>${e.title}</span>
              <span class="hint">${e.hint}</span>
            </div>`)}
        </div>`)}
      ${e.dueToday.map((e) => v`<div class="group">
          <div class="row">
            <span class="group-name">${e.chore.name}</span>
            <span class="hint">at ${k(e.at, t)}</span>
          </div>
        </div>`)}
    </section>`;
	}
	_renderUpcoming(e) {
		if (e.upcoming.length === 0) return x;
		let t = this.snapshot?.time_zone ?? "UTC", n = e.upcoming.slice(0, 8);
		return v`<section class="sec soft">
      ${this._heading("Upcoming", e.upcoming.length)}
      ${n.map((e) => v`<div class="group">
          <div class="row">
            <span class="group-name">${e.chore.name}</span>
            <span class="hint">${j(e.at, this.nowMs, t)}</span>
          </div>
        </div>`)}
      ${e.upcoming.length > n.length ? v`<div class="muted small more">and ${e.upcoming.length - n.length} more in the Chores tab</div>` : x}
    </section>`;
	}
	_renderParked() {
		let e = this._parkedParts();
		if (e.length === 0) return x;
		let t = this.snapshot?.time_zone ?? "UTC";
		return v`<section class="sec parked">
      ${this._heading("Set aside for later", e.length)}
      ${e.map((e) => v`<div class="part">
          <div class="part-name">${e.name}</div>
          <div class="muted small">
            ${e.steps.length} ${e.steps.length === 1 ? "step" : "steps"} ·
            ${e.next_due ? `comes back ${j(e.next_due, this.nowMs, t)}` : "waiting until you start it"}
          </div>
          ${this._park?.choreId === e.id ? this._renderParkAsk() : v`<div class="part-actions">
                <button class="primary" ?disabled=${this._busy} @click=${() => this._partAction(() => dt(this.hass, e.id))}>
                  Start now
                </button>
                <button ?disabled=${this._busy} @click=${() => this._openPark({ choreId: e.id })}>Change time</button>
                ${this._removing === e.id ? v`<span class="small">Remove it?</span>
                      <button
                        ?disabled=${this._busy}
                        @click=${() => this._partAction(async () => {
			await ut(this.hass, e.id), this._removing = "";
		})}
                      >
                        Yes, remove
                      </button>
                      <button class="link" @click=${() => this._removing = ""}>Keep</button>` : v`<button class="link" @click=${() => this._removing = e.id}>Remove</button>`}
              </div>`}
        </div>`)}
    </section>`;
	}
	_renderAuto() {
		let e = this.snapshot;
		if (!e) return x;
		let t = this.nowMs - 864e5, n = e.history.filter((e) => e.kind === "step_done" && e.by === "auto" && Date.parse(e.ts) >= t).slice(-3).reverse();
		return n.length === 0 ? x : v`
      <section class="sec auto soft">
        ${this._heading("Done by itself", n.length)}
        ${n.map((t) => v`<div class="row">
            <span>✓ ${t.chore_name}: ${t.step_title}</span>
            <span class="hint">${t.reason ? `${t.reason}, ` : ""}${k(t.ts, e.time_zone)}</span>
          </div>`)}
      </section>
    `;
	}
	render() {
		if (!this.snapshot) return v`<p class="muted">Loading…</p>`;
		let e = this.snapshot.time_zone, t = Lt(this.snapshot, this.nowMs), n = this.snapshot.chores.length > 0, r = this.snapshot.setup?.status;
		return v`
      ${this._renderAway(e)}
      <div class="cols"><div class="col">
      ${r === "skipped" || r === "in_progress" ? v`<section class="card banner">
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
          </section>` : x}
      ${this._renderQuestions()}
      ${t.now ? v`
            <section class=${t.now.step.on_it_until ? "card now working" : "card now"}>
              <div class="muted small">
                ${t.now.run.chore_name}
                ${t.now.step.group ? v`<span class="tag">${t.now.step.group}</span>` : x}
              </div>
              <h2>${t.now.step.title}</h2>
              ${t.now.total > 1 ? v`<div class="progress">
                    <div class="bar" role="progressbar" aria-valuenow=${t.now.done} aria-valuemin="0" aria-valuemax=${t.now.total}>
                      <div class="fill" style="width:${t.now.done / t.now.total * 100}%"></div>
                    </div>
                    <div class="muted small">Step ${t.now.done + 1} of ${t.now.total}</div>
                  </div>` : x}
              ${(() => {
			let e = Hr(t.now.run, t.now.step);
			return e && e.total > 1 ? v`<div class="muted small">${t.now.step.group}: step ${Math.min(e.done + 1, e.total)} of ${e.total}</div>` : x;
		})()}
              ${t.now.step.active_at ? v`<div class="muted small">
                    ${kt(t.now.step.active_at, e)}
                  </div>` : x}
              ${t.now.step.snoozed_until && Date.parse(t.now.step.snoozed_until) > this.nowMs ? v`<div class="muted small">
                    Snoozed until ${k(t.now.step.snoozed_until, e)}
                  </div>` : x}
              ${t.now.step.on_it_until ? v`<div class="in-progress">
                    ✅ In progress${t.now.step.on_it_since ? v` since ${k(t.now.step.on_it_since, e)}` : x}
                    <span class="muted small">· Boopli checks in at ${k(t.now.step.on_it_until, e)}</span>
                  </div>` : x}
              <div class="now-buttons">
                <button
                  class="primary done"
                  ?disabled=${this._busy}
                  @click=${() => this._done(t.now.run.id, t.now.step.step_id)}
                >
                  Done
                </button>
                ${t.now.step.on_it_until ? v`<button
                      class="link"
                      ?disabled=${this._busy}
                      @click=${() => this._working(t.now.run.id, t.now.step.step_id, !1)}
                    >
                      Not on it
                    </button>` : v`<button
                      class="on-it"
                      ?disabled=${this._busy}
                      @click=${() => this._working(t.now.run.id, t.now.step.step_id, !0)}
                    >
                      On it
                    </button>`}
              </div>
              ${Hr(t.now.run, t.now.step)?.canPark ? this._park && this._park.runId === t.now.run.id ? this._renderParkAsk() : v`<button
                  class="link later-btn"
                  ?disabled=${this._busy}
                  @click=${() => this._openPark({
			runId: t.now.run.id,
			group: t.now.step.group
		})}
                >
                  Do this part later
                </button>` : x}
              ${this._error ? v`<div class="error">${this._error}</div>` : x}
            </section>
          ` : v`
            <section class="card empty">
              <h2>Nothing needs you right now</h2>
              <p class="muted">
                ${n ? "Enjoy the quiet. What is coming up shows below." : "Add your first chore in the Chores tab."}
              </p>
            </section>
          `}
      ${this._renderQuick()}
      ${this._renderParked()}
      </div><div class="col">
      ${this._renderPet()}
      ${this._renderReady(t)}
      ${this._renderStill(t, e)}
      ${this._renderUpcoming(t)}
      ${this._renderAuto()}
      </div></div>
    `;
	}
	static {
		this.styles = [E, o`
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
      .away-banner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 16px;
        margin-bottom: 16px;
        padding: 16px 18px;
        border-radius: 16px;
        background: var(--warning-color, #ffa600);
        color: #1a1200;
      }
      .away-banner.planned {
        background: transparent;
        color: var(--primary-text-color);
        border: 2px solid var(--warning-color, #ffa600);
      }
      .away-icon {
        font-size: 40px;
        line-height: 1;
      }
      .away-text {
        flex: 1 1 220px;
        min-width: 0;
      }
      .away-title {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.04em;
      }
      .away-when {
        font-size: 17px;
        font-weight: 500;
        margin-top: 2px;
      }
      .away-note {
        margin-top: 4px;
        font-size: 14px;
        opacity: 0.85;
      }
      .away-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        align-items: center;
      }
      .away-banner.on button.primary {
        background: #1a1200;
        color: #fff;
        border-color: #1a1200;
      }
      .away-banner.on button.link {
        color: #1a1200;
      }
      .pet-card {
        margin-bottom: 16px;
        padding: 12px;
      }
      .pet-info {
        margin-top: 12px;
        padding: 0 4px 2px;
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
        grid-template-columns: repeat(auto-fit, minmax(min(360px, 100%), 1fr));
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
      /* The cards in a column stand apart from each other, and from the list under them. */
      .now,
      .empty,
      .quick {
        margin-bottom: 16px;
      }
      .quick + .sec {
        margin-top: 24px;
      }
      .now h2 {
        font-size: 28px;
        margin: 8px 0;
      }
      .done {
        min-width: 180px;
        min-height: 56px;
        font-size: 20px;
        border-radius: 14px;
      }
      .now-buttons {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        margin-top: 20px;
      }
      .on-it {
        min-height: 56px;
        padding: 0 22px;
        font-size: 18px;
        border-radius: 14px;
        border: 2px solid var(--success-color, #2e7d32);
        color: var(--success-color, #2e7d32);
        background: transparent;
        cursor: pointer;
      }
      /* A step you said "On it" to: green, so it is clear it was noticed. */
      .now.working {
        border: 2px solid var(--success-color, #2e7d32);
        background: color-mix(in srgb, var(--success-color, #2e7d32) 12%, var(--card-background-color, transparent));
      }
      .in-progress {
        margin-top: 8px;
        font-weight: 600;
        color: var(--success-color, #2e7d32);
      }
      /* The lists next to the big step: a clear heading, a visible line, calm rows. */
      .sec {
        margin-bottom: 24px;
        --line: color-mix(in srgb, var(--primary-text-color) 20%, transparent);
      }
      .sec-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--primary-text-color);
        margin: 0 0 6px;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--line);
      }
      .count {
        margin-left: 8px;
        font-size: 14px;
        font-weight: 400;
        color: var(--secondary-text-color);
      }
      .soft .group,
      .soft .more {
        opacity: 0.7;
      }
      .strong {
        font-weight: 500;
      }
      .more {
        padding: 8px 0;
      }
      .part {
        padding: 10px 0;
        border-top: 1px solid var(--line);
      }
      .part:first-of-type {
        border-top: 0;
      }
      .part-name {
        font-size: 16px;
      }
      .part-actions,
      .park-buttons,
      .park-pick {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }
      .park-ask {
        margin-top: 14px;
        padding: 12px 14px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
      }
      .later-btn,
      .link {
        border: 0;
        background: none;
        color: var(--secondary-text-color);
        text-decoration: underline;
        min-height: 0;
        padding: 8px 4px;
        font-size: 15px;
      }
      .later-btn {
        display: block;
        margin-top: 10px;
      }
      .auto .row {
        padding-left: 0;
      }
      .auto .hint {
        white-space: normal;
        text-align: right;
      }
      .group {
        padding: 9px 0;
        border-top: 1px solid var(--line);
      }
      .group:first-of-type {
        border-top: 0;
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
      /* One column (a phone): the pet's room comes first, then your step. Last in the sheet, so it wins. */
      @media (max-width: 760px) {
        .cols {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0;
        }
        .col {
          display: contents;
        }
        .stage-slot {
          order: -1;
        }
      }
    `];
	}
};
customElements.define("boopli-today", Wr);
// src/helpers.ts
var Gr = "amzn_sfx_scifi_alarm_01", Kr = "amzn_sfx_doorbell_chime_01", qr = [
	"siren",
	"switch",
	"input_boolean",
	"script"
], Jr = {
	start: "07:00",
	stop: "22:00"
};
function X(e, t) {
	let n = e?.states[t]?.attributes?.friendly_name;
	return typeof n == "string" && n ? n : t;
}
function Z(e, t, n = []) {
	return Object.keys(e?.states ?? {}).filter((e) => t.includes(e.split(".")[0]) && !n.includes(e)).sort((t, n) => X(e, t).localeCompare(X(e, n)));
}
function Yr(e, t, n) {
	let r;
	return r = t === "alexa_media" ? Object.keys(e?.services?.notify ?? {}).filter((e) => e.startsWith("alexa_media_") && e !== "alexa_media").sort().map((e) => ({
		value: e,
		label: e.replace("alexa_media_", "")
	})) : t === "alexa_devices" ? Object.keys(e?.states ?? {}).filter((e) => e.startsWith("notify.") && /_(speak|announce)$/.test(e)).sort().map((t) => ({
		value: t,
		label: X(e, t)
	})) : Z(e, ["tts"]).map((t) => ({
		value: t,
		label: X(e, t)
	})), n && !r.some((e) => e.value === n) && r.unshift({
		value: n,
		label: `${n} (not found)`
	}), r;
}
function Xr(e) {
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
function Zr(e) {
	return {
		entity_id: e,
		cue: {
			enabled: !1,
			kind: "alexa",
			sound: Kr,
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
			sound: Gr,
			start_at: 4,
			seconds: 30,
			repeat_s: 5
		}
	};
}
function Qr(e) {
	return {
		entity_id: e,
		seconds: 30,
		start_at: 4
	};
}
function $r(e) {
	let t = parseInt(e.replace("#", ""), 16);
	return [
		t >> 16 & 255,
		t >> 8 & 255,
		t & 255
	];
}
function ei(e) {
	return "#" + e.map((e) => e.toString(16).padStart(2, "0")).join("");
}
function Q(e) {
	return e.replace("mobile_app_", "");
}
var ti = {
	normal: "normal",
	high: "high priority",
	alarm: "alarm volume",
	alarm_max: "max volume"
}, ni = {
	quiet: "Quiet",
	one: "One nudge",
	escalating: "Escalating",
	persistent: "Persistent"
};
function ri(e, t) {
	let n = e?.states[t]?.attributes?.supported_color_modes;
	return !Array.isArray(n) || n.some((e) => [
		"rgb",
		"rgbw",
		"rgbww",
		"xy",
		"hs"
	].includes(String(e)));
}
function ii() {
	try {
		return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
	} catch {
		return Math.random().toString(16).slice(2, 14).padEnd(12, "0");
	}
}
function ai(e, t) {
	return e.startsWith("ladder:") ? t?.find((t) => `ladder:${t.id}` === e)?.name ?? "A ladder that is gone" : ni[e] ?? e;
}
function oi(e) {
	if (!e.enabled) return "Off: Boopli nudges at any time";
	let t = [], n = 0;
	for (; n < 7;) {
		let r = e.days[String(n)] ?? null, i = n;
		for (; i + 1 < 7 && (e.days[String(i + 1)] ?? null)?.start === r?.start && (e.days[String(i + 1)] ?? null)?.stop === r?.stop;) i++;
		let a = n === i ? O[n] : `${O[n]} to ${O[i]}`;
		t.push(r ? `${a} ${r.start} to ${r.stop}` : `${a} no limit`), n = i + 1;
	}
	return "Nudges allowed " + t.join(", ");
}
function si(e) {
	let t = [
		e.cue.enabled ? `ding (from nudge ${e.cue.start_at})` : "",
		e.speech.enabled ? `speech (from nudge ${e.speech.start_at})` : "",
		e.alarm.enabled ? `alarm (from nudge ${e.alarm.start_at})` : ""
	].filter(Boolean);
	return t.length ? t.join(", ") : "nothing switched on yet";
}
function ci(e) {
	return e.mode === "indicator" ? "status light (stays on until done)" : "blinks";
}
// src/boopli-triggers.ts
var li = {
	binary_sensor: ["on", "off"],
	switch: ["on", "off"],
	input_boolean: ["on", "off"],
	light: ["on", "off"],
	cover: ["open", "closed"],
	lock: ["locked", "unlocked"],
	person: ["home", "not_home"],
	device_tracker: ["home", "not_home"]
}, ui = [
	"event",
	"input_button",
	"button"
];
function di(e) {
	return e.state ? "state" : e.above !== null && e.below !== null ? "between" : e.below === null ? e.above === null ? "state" : "above" : "below";
}
function fi(e) {
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
var pi = class extends w {
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
		this._emit([...this.triggers, fi(e)]);
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
				this._scanning = -1, this._note = `Scanning did not start (${T(e)}). Pick the tag from the list instead.`;
			}
		}
	}
	_renderState(e, t) {
		let n = e.entity_id.split(".")[0], r = this.hass?.states[e.entity_id], i = li[n] ?? [], a = di(e);
		return v`
      <div class="field">
        <label>Which entity?</label>
        <input
          list="states-list"
          placeholder="Start typing a name, for example door"
          .value=${e.entity_id}
          @change=${(e) => this._patch(t, { entity_id: e.target.value.trim() })}
        />
        ${e.entity_id ? r ? v`<div class="muted small">
                ${this._friendly(e.entity_id)}: now <b>${r.state}</b>
              </div>` : v`<div class="warn small">Not found right now. Check the name.</div>` : x}
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
      ${a === "state" ? v`<div class="field">
            <label>State</label>
            <input
              placeholder="for example on, off, open"
              .value=${e.state}
              @input=${(e) => this._patch(t, { state: e.target.value })}
            />
            <div class="chips">
              ${i.map((n) => v`<button
                  type="button"
                  class="chip ${e.state === n ? "on" : ""}"
                  @click=${() => this._patch(t, { state: n })}
                >
                  ${n}
                </button>`)}
              ${r && !i.includes(r.state) ? v`<button
                    type="button"
                    class="chip"
                    @click=${() => this._patch(t, { state: r.state })}
                  >
                    now: ${r.state}
                  </button>` : x}
            </div>
          </div>` : v`<div class="row2">
            ${a === "above" || a === "between" ? v`<div>
                  <label>Above</label>
                  <input
                    type="number"
                    step="any"
                    .value=${e.above === null ? "" : String(e.above)}
                    @input=${(e) => this._patch(t, { above: this._numberOrNull(e.target.value) })}
                  />
                </div>` : x}
            ${a === "below" || a === "between" ? v`<div>
                  <label>Below</label>
                  <input
                    type="number"
                    step="any"
                    .value=${e.below === null ? "" : String(e.below)}
                    @input=${(e) => this._patch(t, { below: this._numberOrNull(e.target.value) })}
                  />
                </div>` : x}
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
		return v`
      <div class="field">
        <label>Which NFC tag?</label>
        <div class="scan">
          <select
            @change=${(e) => this._patch(t, { tag_id: e.target.value })}
          >
            <option value="" .selected=${!e.tag_id}>Pick a tag…</option>
            ${this._tags.map((t) => v`<option value=${t.tag_id} .selected=${t.tag_id === e.tag_id}>
                ${t.name || t.tag_id}
              </option>`)}
            ${e.tag_id && !n ? v`<option value=${e.tag_id} .selected=${!0}>${e.tag_id}</option>` : x}
          </select>
          ${this._scanning === t ? v`<button type="button" @click=${() => this._cancelScan()}>Cancel</button>` : v`<button type="button" @click=${() => this._scan(t)}>Scan now</button>`}
        </div>
        ${this._scanning === t ? v`<div class="muted small">Hold your phone to the tag now…</div>` : x}
      </div>
    `;
	}
	_renderButton(e, t) {
		let n = this.hass?.states[e.entity_id], r = n?.attributes?.event_types;
		return v`
      <div class="field">
        <label>Which button?</label>
        <input
          list="buttons-list"
          placeholder="Start typing a name, for example button"
          .value=${e.entity_id}
          @change=${(e) => this._patch(t, { entity_id: e.target.value.trim() })}
        />
        ${e.entity_id && !n ? v`<div class="warn small">Not found right now. Check the name.</div>` : x}
      </div>
      <div class="field">
        <label>Only this kind of press (empty = any press)</label>
        <input
          placeholder="for example single or double"
          .value=${e.press}
          @input=${(e) => this._patch(t, { press: e.target.value })}
        />
        ${Array.isArray(r) && r.length ? v`<div class="chips">
              ${r.map((n) => v`<button
                  type="button"
                  class="chip ${e.press === n ? "on" : ""}"
                  @click=${() => this._patch(t, { press: n })}
                >
                  ${String(n)}
                </button>`)}
            </div>` : x}
      </div>
    `;
	}
	_title(e) {
		return e.kind === "tag" ? "An NFC tag is scanned" : e.kind === "button" ? "A button is pressed" : "An entity changes";
	}
	render() {
		return v`
      <datalist id="states-list">
        ${this._entityIds().map((e) => v`<option value=${e}>${this._friendly(e)}</option>`)}
      </datalist>
      <datalist id="buttons-list">
        ${this._entityIds(ui).map((e) => v`<option value=${e}>${this._friendly(e)}</option>`)}
      </datalist>
      ${this.triggers.length === 0 ? v`<div class="muted small">
            Nothing yet: only you finish this step (with Done). Add one below to let it finish by
            itself.
          </div>` : this.triggers.map((e, t) => v`
              ${t > 0 ? v`<div class="or muted small">or</div>` : x}
              <div class="trigger">
                <div class="trigger-head">
                  <b>${this._title(e)}</b>
                  <button type="button" aria-label="Remove" @click=${() => this._remove(t)}>✕</button>
                </div>
                ${e.kind === "tag" ? this._renderTag(e, t) : e.kind === "button" ? this._renderButton(e, t) : this._renderState(e, t)}
              </div>
            `)}
      ${this._note ? v`<div class="warn small">${this._note}</div>` : x}
      <div class="chips add">
        <button type="button" @click=${() => this._add("state")}>+ An entity changes</button>
        <button type="button" @click=${() => this._add("tag")}>+ NFC tag</button>
        <button type="button" @click=${() => this._add("button")}>+ Button</button>
      </div>
    `;
	}
	static {
		this.styles = [E, o`
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
customElements.define("boopli-triggers", pi);
// src/boopli-picture.ts
var mi = /\.(jpe?g|png|gif)$/i, hi = /^camera\.[a-z0-9_]+$/;
function gi(e) {
	return hi.test(e) && !mi.test(e);
}
var _i = class extends w {
	static {
		this.properties = {
			hass: { attribute: !1 },
			value: { type: String },
			_mode: { state: !0 },
			_src: { state: !0 },
			_note: { state: !0 }
		};
	}
	constructor() {
		super(), this._timer = 0, this._seq = 0, this._seeded = !1, this._emitted = null, this.value = "", this._mode = "none", this._src = "", this._note = "";
	}
	willUpdate(e) {
		this._seeded ? e.has("value") && this.value && this.value !== this._emitted && (this._mode = gi(this.value) ? "camera" : "file") : (this._seeded = !0, this._mode = this.value ? gi(this.value) ? "camera" : "file" : "none"), e.has("value") && this._preview();
	}
	disconnectedCallback() {
		window.clearTimeout(this._timer), super.disconnectedCallback();
	}
	_emit(e) {
		this._emitted = e, this.dispatchEvent(new CustomEvent("picture-change", {
			detail: e,
			bubbles: !0,
			composed: !0
		}));
	}
	_setMode(e) {
		this._mode = e, this._emit("");
	}
	_preview() {
		let e = ++this._seq;
		window.clearTimeout(this._timer), this._src = "", this._note = "";
		let t = (this.value ?? "").trim();
		if (t) {
			if (this._mode === "camera") {
				let e = this.hass?.states[t]?.attributes?.entity_picture;
				typeof e == "string" && e ? this._src = e : this._note = "This camera gives no picture right now.";
			} else mi.test(t) ? this._timer = window.setTimeout(async () => {
				try {
					let n = await this.hass?.callWS({
						type: "media_source/resolve_media",
						media_content_id: `media-source://media_source/local/${t}`,
						expires: 300
					});
					e === this._seq && n?.url && (this._src = n.url);
				} catch {
					e === this._seq && (this._note = "That file is not in the media folder.");
				}
			}, 500) : this._note = "Use a .jpg, .png or .gif file.";
		}
	}
	render() {
		let e = Z(this.hass, ["camera"]), t = e.length > 0 || gi(this.value);
		return v`
      <div class="row">
        <span class="muted small">Picture in the phone notification (optional):</span>
        <select
          aria-label="Kind of picture"
          @change=${(e) => this._setMode(e.target.value)}
        >
          <option value="none" ?selected=${this._mode === "none"}>None</option>
          ${t ? v`<option value="camera" ?selected=${this._mode === "camera"}>A camera</option>` : x}
          <option value="file" ?selected=${this._mode === "file"}>A picture file</option>
        </select>
      </div>
      ${this._mode === "camera" ? v`<div class="row">
            <select
              aria-label="Camera"
              @change=${(e) => this._emit(e.target.value)}
            >
              <option value="" ?selected=${!this.value}>Pick a camera…</option>
              ${this.value && !e.includes(this.value) ? v`<option value=${this.value} selected>${this.value} (not found)</option>` : x}
              ${e.map((e) => v`<option value=${e} ?selected=${this.value === e}>${X(this.hass, e)}</option>`)}
            </select>
            <span class="muted small">The phone shows a fresh snapshot when the nudge arrives.</span>
          </div>` : x}
      ${this._mode === "file" ? v`<div class="row">
            <input
              aria-label="Picture file"
              placeholder="boopli/pills.jpg"
              maxlength="120"
              .value=${this.value}
              @input=${(e) => this._emit(e.target.value.trim())}
            />
          </div>
          <div class="muted small">
            A file in Home Assistant's media folder (the one you see as "Media"), not the public www folder. Type its
            name with the folder, for example <code>boopli/pills.jpg</code>.
          </div>` : x}
      ${this._src ? v`<img
            class="preview"
            alt="Preview of the picture"
            src=${this._src}
            @error=${() => {
			this._src = "", this._note = this._mode === "camera" ? "The picture could not be loaded." : "That file is not in the media folder, or it is not a picture.";
		}}
          />` : x}
      ${this._note ? v`<div class="note small">${this._note}</div>` : x}
    `;
	}
	static {
		this.styles = [E, o`
      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }
      .row select,
      .row input {
        max-width: 260px;
        min-width: 0;
      }
      .small {
        font-size: 14px;
      }
      .preview {
        display: block;
        margin-top: 10px;
        max-width: 100%;
        max-height: 140px;
        border-radius: 10px;
        border: 1px solid var(--divider-color, #444);
      }
      .note {
        margin-top: 8px;
        color: var(--warning-color, #b26a00);
      }
      code {
        font-size: 13px;
      }
    `];
	}
};
customElements.define("boopli-picture", _i);
// src/boopli-schedule-days.ts
var vi = [
	0,
	1,
	2,
	3,
	4,
	5,
	6
], yi = 6;
function bi(e) {
	if (e.length === 0) return "09:00";
	let [t, n] = e[e.length - 1].split(":").map(Number);
	return `${String(Math.min(23, (t || 0) + 4)).padStart(2, "0")}:${String(n || 0).padStart(2, "0")}`;
}
var xi = class extends w {
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
		return this.onlyActive ? vi.filter((e) => this._times(e).length > 0) : vi;
	}
	render() {
		let e = this._shownDays();
		return v`
      <div class="rows">
        ${e.map((t, n) => {
			let r = this._times(t), i = n > 0 ? e[n - 1] : null, a = r.length > 0;
			return v`<div class="row ${a ? "" : "off"}">
            <span class="dayname">${O[t]}</span>
            ${this.onlyActive ? x : v`<label class="inline small">
                  <input
                    type="checkbox"
                    .checked=${a}
                    @change=${(e) => this._setDay(t, e.target.checked ? [bi([])] : [])}
                  />
                  Runs
                </label>`}
            ${a ? v`<div class="times">
                  ${r.map((e, n) => v`<span class="time">
                      <input
                        type="time"
                        aria-label="${O[t]} time ${n + 1}"
                        .value=${e}
                        @change=${(e) => this._setTime(t, n, e.target.value)}
                      />
                      ${r.length > 1 ? v`<button
                            type="button"
                            class="x"
                            aria-label="Remove this time"
                            @click=${() => this._setDay(t, r.filter((e, t) => t !== n))}
                          >
                            ✕
                          </button>` : x}
                    </span>`)}
                  ${r.length < yi ? v`<button type="button" class="chip" @click=${() => this._setDay(t, [...r, bi(r)])}>+ time</button>` : x}
                </div>` : v`<span class="muted small">No run this day</span>`}
            ${i === null ? x : v`<button
                  type="button"
                  class="chip same"
                  @click=${() => this._setDay(t, [...this._times(i)])}
                >
                  Same as ${O[i]}
                </button>`}
          </div>`;
		})}
      </div>
    `;
	}
	static {
		this.styles = [E, o`
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
customElements.define("boopli-schedule-days", xi);
// src/boopli-schedule-wizard.ts
var Si = {
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
}, Ci = {
	how: "How often",
	days: "Which days",
	times: "What time on each day",
	interval: "Every how many days",
	preview: "The next runs",
	done: "All set"
}, wi = [
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
], Ti = [
	0,
	1,
	2,
	3,
	4,
	5,
	6
], Ei = class extends w {
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
		return Si[this._draft?.type ?? "none"];
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
		return Ti.filter((e) => (this._draft?.days[String(e)] ?? []).length > 0);
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
				this._preview = await et(this.hass, this._draft, 5);
			} catch (e) {
				this._error = T(e);
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
		return v`
      <p>How often should ${this.choreName ? v`<b>${this.choreName}</b>` : "this chore"} come up?</p>
      ${wi.map((t) => v`<label class="inline option">
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
		return v`
      <p>Tap the days it should come up. You set the time for each day in the next step.</p>
      <div class="chips">
        ${Ti.map((e) => v`<button
            type="button"
            class="chip big ${t.includes(e) ? "on" : ""}"
            aria-pressed=${t.includes(e)}
            @click=${() => this._toggleDay(e)}
          >
            ${O[e]}
          </button>`)}
      </div>
      <div class="chips quick">
        <button
          type="button"
          class="chip"
          @click=${() => this._patch({ days: Object.fromEntries(Ti.map((t) => [String(t), e.days[String(t)]?.length ? e.days[String(t)] : ["09:00"]])) })}
        >
          Every day
        </button>
        <button type="button" class="chip" @click=${() => this._patch({ days: {} })}>Clear</button>
      </div>
    `;
	}
	_renderTimes(e) {
		return v`
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
		return v`
      <p>It comes back this many days after you finished it:</p>
      <div class="chips">
        ${[
			2,
			3,
			7,
			14,
			30,
			90
		].map((t) => v`<button type="button" class="chip ${e.every_n_days === t ? "on" : ""}" @click=${() => this._patch({ every_n_days: t })}>${t} days</button>`)}
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
		return v`
      <p>
        ${e.type === "every_n_days" ? "The first time, and then every time after you finish:" : "This is when it comes up next:"}
      </p>
      ${t.length === 0 ? v`<p class="muted">Nothing is scheduled.</p>` : v`<ul>${t.map((e) => v`<li>${j(e, n, this.timeZone)}</li>`)}</ul>`}
      ${e.type === "every_n_days" ? v`<p class="muted small">After that: ${e.every_n_days} days after you finish it, at ${e.time}.</p>` : x}
    `;
	}
	_renderDone(e) {
		let t = this._before ? Mt(this._before) : "", n = Mt(e), r = JSON.stringify(this._before) === JSON.stringify(e);
		return v`
      <p><b>What changed</b> for ${this.choreName ? v`<b>${this.choreName}</b>` : "this chore"}:</p>
      ${r ? v`<p class="muted">Nothing changed. ${n}.</p>` : v`<ul><li>Schedule: ${t} → ${n}</li></ul>`}
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
		if (!e) return x;
		let t = this._steps, n = this._step, r = n === "done";
		return v`
      <div class="shell">
        <nav class="rail" aria-label="Steps">
          <div class="rail-title">Schedule${this.choreName ? `: ${this.choreName}` : ""}</div>
          ${t.map((e, t) => v`<div class="rail-item ${t === this._index ? "current" : ""} ${t < this._index ? "past" : ""}">
              <span class="mark">${t < this._index ? "✓" : t + 1}</span>
              <span>${Ci[e]}</span>
            </div>`)}
        </nav>
        <section class="card main">
          <div class="top">
            <span class="muted small">Step ${this._index + 1} of ${t.length}</span>
            <button type="button" class="link" @click=${() => this._cancel()}>Close</button>
          </div>
          <div class="bar"><div class="fill" style="width:${(this._index + 1) / t.length * 100}%"></div></div>
          <h2>${Ci[n]}</h2>
          ${this._renderStep(e)}
          ${this._error ? v`<div class="error">${this._error}</div>` : x}
          <div class="actions">
            ${this._index > 0 ? v`<button type="button" ?disabled=${this._busy} @click=${() => this._back()}>Back</button>` : x}
            <span class="spacer"></span>
            ${r ? v`<button type="button" class="primary" @click=${() => this._apply()}>
                  ${this.saves ? "Save schedule" : "Use this schedule"}
                </button>` : v`<button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._next()}>Next</button>`}
          </div>
        </section>
      </div>
    `;
	}
	static {
		this.styles = [E, o`
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
customElements.define("boopli-schedule-wizard", Ei);
// src/boopli-wait.ts
var Di = 30;
function Oi(e) {
	let t = Math.max(0, Math.round(e));
	return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}
var ki = class extends w {
	static {
		this.properties = {
			label: { type: String },
			pet: { type: String },
			max: { type: Number },
			stoppable: { type: Boolean },
			_elapsed: { state: !0 },
			_egg: { state: !0 }
		};
	}
	constructor() {
		super(), this._since = 0, this._eggShown = !1, this.label = "Thinking…", this.pet = "", this.max = 180, this.stoppable = !0, this._elapsed = 0, this._egg = !1;
	}
	connectedCallback() {
		super.connectedCallback(), this._since = Date.now(), this._elapsed = 0, this._timer = window.setInterval(() => {
			this._elapsed = (Date.now() - this._since) / 1e3, !this._eggShown && this._elapsed >= Di && (this._eggShown = !0, this._egg = !0);
		}, 500);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), window.clearInterval(this._timer);
	}
	_hint() {
		let e = this._elapsed;
		return e < 20 ? "This usually takes under a minute." : e < 60 ? "Still working. Free models can be slow." : e < this.max * .85 ? "Still working. This one is slow, but it is not stuck." : "Nearly at the limit. If there is no answer, you can try again.";
	}
	render() {
		let e = Math.min(1, this._elapsed / Math.max(1, this.max));
		return v`<div class="wait" role="status" aria-live="polite">
      ${this._egg ? v`<boopli-egg @egg-done=${() => this._egg = !1}></boopli-egg>` : x}
      <div class="head">
        ${this.pet && br(this.pet).art ? v`<span class="typist"><boopli-pet kind=${this.pet} activity="typing"></boopli-pet></span>` : v`<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>`}
        <span class="label">${this.label}</span>
      </div>
      <div
        class="bar"
        role="progressbar"
        aria-label="Waiting time used"
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${Math.round(this._elapsed)}
      >
        <div class="fill" style="width:${e * 100}%"></div>
      </div>
      <div class="time">
        <span>${Oi(this._elapsed)} so far</span>
        <span>gives up after ${Oi(this.max)}</span>
      </div>
      <div class="hint">${this._hint()}</div>
      ${this.stoppable ? v`<button type="button" class="link" @click=${() => this.dispatchEvent(new CustomEvent("stop-waiting", {
			bubbles: !0,
			composed: !0
		}))}>
            Stop waiting
          </button>` : x}
    </div>`;
	}
	static {
		this.styles = o`
    :host {
      display: block;
    }
    .wait {
      max-width: 560px;
      padding: 18px 4px;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 18px;
      color: var(--primary-text-color);
    }
    .dots {
      display: inline-flex;
      gap: 6px;
    }
    .typist {
      display: block;
      flex: none;
      width: 92px;
      height: 92px;
      margin: -6px 0 -10px;
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
    .bar {
      height: 8px;
      margin: 14px 0 6px;
      border-radius: 999px;
      background: var(--secondary-background-color);
      border: 1px solid var(--divider-color);
      overflow: hidden;
    }
    .fill {
      height: 100%;
      border-radius: 999px;
      background: var(--primary-color);
      transition: width 0.5s linear;
    }
    .time {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .hint {
      margin-top: 10px;
      font-size: 14px;
      color: var(--secondary-text-color);
    }
    .link {
      margin-top: 8px;
      border: 0;
      background: none;
      color: var(--secondary-text-color);
      text-decoration: underline;
      font: inherit;
      font-size: 14px;
      padding: 8px 0;
      cursor: pointer;
    }
    @media (prefers-reduced-motion: reduce) {
      .dots i {
        animation: none;
        opacity: 0.8;
      }
    }
  `;
	}
};
customElements.define("boopli-wait", ki);
// src/photos.ts
var Ai = 8e5;
async function ji(e) {
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
			if (o.drawImage(e, 0, 0, a.width, a.height), n = a.toDataURL("image/jpeg", r), n.length <= Ai) break;
		}
		return n;
	} finally {
		URL.revokeObjectURL(t);
	}
}
// src/boopli-breakdown.ts
var Mi = [
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
], Ni = {
	small: 10,
	medium: 15,
	big: 20
}, Pi = 20, Fi = 50, Ii = class extends w {
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
			_checks: { state: !0 },
			_notes: { state: !0 },
			_busy: { state: !0 },
			_error: { state: !0 },
			_round: { state: !0 },
			_rooms: { state: !0 },
			_preview: { state: !0 },
			_scene: { state: !0 },
			_photos: { state: !0 },
			_photosOpen: { state: !0 },
			_looking: { state: !0 },
			_sending: { state: !0 }
		};
	}
	constructor() {
		super(), this._roomsTouched = !1, this._guessedFor = null, this._started = !1, this._askId = 0, this._backPhase = "task", this._lookId = 0, this.kind = "now", this.task = "", this.notes = "", this.mode = "page", this.hasSteps = !1, this.externalError = "", this._phase = "task", this._task = "", this._answers = [], this._questions = [], this._picked = [], this._typed = [], this._extra = "", this._steps = [], this._checks = [], this._notes = "", this._busy = !1, this._error = "", this._round = 0, this._rooms = [], this._preview = null, this._scene = "", this._photos = [], this._photosOpen = !1, this._looking = !1, this._sending = !1;
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
				let t = await qe(this.hass, e);
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
				this._preview = await Ke(this.hass, this._task.trim() || "(your task)", this.kind, this._answers, this._notes, this._rooms, this._scene);
			} catch (e) {
				this._error = T(e);
			}
		}
	}
	_renderRooms() {
		if (!this._homeOn()) return x;
		let e = this._notedRooms();
		if (e.length === 0) return v`<p class="muted small roomtip">
        Tip: tell Boopli about your rooms and the steps will fit them.
        <button type="button" class="link" @click=${() => this._fire("open-home")}>Open My home</button>
      </p>`;
		let t = e.filter((e) => this._rooms.includes(e.id));
		return v`<div class="rooms">
      <div class="roomline">
        <span class="muted small">Room notes the AI will see:</span>
        ${e.map((e) => v`<button
            type="button"
            class="chip ${this._rooms.includes(e.id) ? "on" : ""}"
            aria-pressed=${this._rooms.includes(e.id)}
            @click=${() => this._toggleRoom(e.id)}
          >
            ${e.name}
          </button>`)}
        ${t.length === 0 ? v`<span class="muted small">none</span>` : x}
        <button type="button" class="link" @click=${() => this._showPreview()}>
          ${this._preview ? "Hide what is sent" : "What will the AI see?"}
        </button>
      </div>
      ${this._preview ? v`<div class="preview">
            ${this._preview.shortened ? v`<div class="muted small">A long note was shortened to keep the request small.</div>` : x}
            <pre>${this._preview.instructions}</pre>
          </div>` : x}
    </div>`;
	}
	async _addPhotos(e) {
		if (!e) return;
		let t = Math.max(0, 4 - this._photos.length);
		this._error = "", this._looking = !0;
		try {
			let n = [];
			for (let r of Array.from(e).slice(0, t)) n.push(await ji(r));
			this._photos = [...this._photos, ...n], e.length > t && (this._error = "Up to 4 photos. The rest were left out.");
		} catch (e) {
			this._error = T(e);
		}
		this._looking = !1;
	}
	async _look() {
		if (!this.hass || !this._photos.length || !this._task.trim()) return;
		this._error = "";
		let e = ++this._lookId;
		this._sending = !0, this._looking = !0;
		try {
			if (await this._guess(), e !== this._lookId) return;
			let t = await St(this.hass, this._task.trim(), this._photos, this._rooms);
			if (e !== this._lookId) return;
			this._scene = t.scene, this._photos = [], this._photosOpen = !1, this._preview = null;
		} catch (t) {
			e === this._lookId && (this._error = T(t));
		}
		e === this._lookId && (this._looking = !1, this._sending = !1);
	}
	_stopLooking() {
		this._lookId++, this._looking = !1, this._sending = !1, this._error = "You stopped waiting. Your photos are still here, so you can try again.";
	}
	_renderScene() {
		if (!this._aiOn()) return x;
		if (this._scene) return v`<div class="scene">
        <label for="scene">What the AI sees today (from your photos). Change anything that is wrong:</label>
        <textarea
          id="scene"
          rows="5"
          maxlength="1500"
          .value=${this._scene}
          @input=${(e) => {
			this._scene = e.target.value, this._preview = null;
		}}
        ></textarea>
        <div class="muted small">The photos are already gone. This text goes with the questions and the steps, and is not saved afterwards.</div>
        <button type="button" class="link" @click=${() => (this._scene = "", this._preview = null)}>Remove it</button>
      </div>`;
		if (!this._photosOpen) return v`<div class="scene">
        <button type="button" @click=${() => this._photosOpen = !0}>📷 Add photos of how it looks now (optional)</button>
      </div>`;
		let e = this._photos.length >= 4;
		return v`<div class="scene">
      <p class="muted small">
        Take or pick up to ${4} photos. They go once to your AI agent, which writes down what is out of place.
        Boopli keeps no photo: you see the text it wrote, and only that text is used.
      </p>
      <div class="thumbs">
        ${this._photos.map((e, t) => v`<div class="thumb">
            <img src=${e} alt="Photo ${t + 1}" />
            <button type="button" class="x" aria-label="Remove photo ${t + 1}" @click=${() => this._photos = this._photos.filter((e, n) => n !== t)}>×</button>
          </div>`)}
      </div>
      ${this._sending ? v`<boopli-wait
            .label=${"The AI is looking at your photos…"}
            .pet=${this.snapshot?.settings?.pet_kind ?? "slime"}
            .max=${this.snapshot?.ai_timeout ?? 180}
            @stop-waiting=${() => this._stopLooking()}
          ></boopli-wait>` : this._looking ? v`<div class="muted" role="status">Preparing…</div>` : v`<div class="actions">
            <label class="filebtn ${e ? "off" : ""}">
              ${this._photos.length ? "Add another photo" : "Take or pick photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                ?disabled=${e}
                @change=${(e) => {
			let t = e.target;
			this._addPhotos(t.files).then(() => t.value = "");
		}}
              />
            </label>
            <button class="primary" ?disabled=${!this._photos.length || !this._task.trim()} @click=${() => this._look()}>
              Look at the photos
            </button>
            <button type="button" class="link" @click=${() => (this._photosOpen = !1, this._photos = [])}>Cancel</button>
          </div>`}
      <div class="muted small">The agent has to be able to read images. You can pick another one for photos in Settings, under AI help, Advanced.</div>
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
		let n = ++this._askId;
		this._backPhase = t, this._busy = !0, this._error = "";
		try {
			let t = await e();
			return n === this._askId ? t : null;
		} catch (e) {
			return n === this._askId && (this._error = T(e), this._phase = t), null;
		} finally {
			n === this._askId && (this._busy = !1);
		}
	}
	_stopWaiting() {
		this._askId++, this._busy = !1, this._phase = this._backPhase, this._error = "You stopped waiting. Your task and answers are still here, so you can try again.";
	}
	async _begin() {
		if (!this.hass || !this._task.trim()) return;
		this._answers = [], this._round = 0, this._phase = "working", await this._guess();
		let e = await this._ask(() => We(this.hass, this._task.trim(), this.kind, [], this._notes, this._rooms, this._scene), "task");
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
		let t = await this._ask(() => We(this.hass, this._task.trim(), this.kind, e, this._notes, this._rooms, this._scene), "interview");
		t && this._showQuestions(t.enough, t.questions);
	}
	async _enough() {
		this._answers = [...this._answers, ...this._currentAnswers()], await this._loadSteps();
	}
	async _loadSteps() {
		if (!this.hass) return;
		this._phase = "working", await this._guess();
		let e = await this._ask(() => Ge(this.hass, this._task.trim(), this.kind, this._answers, this._notes, this._rooms, this._scene), this._questions.length ? "interview" : "task");
		e && (this._steps = e.steps.slice(0, Fi), this._checks = this.kind === "recurring" ? e.questions ?? [] : [], e.summary && !this._notes.includes(e.summary) && (this._notes = [this._notes, e.summary].filter(Boolean).join("\n")), this._phase = "review");
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
		}), this._steps = n.slice(0, Fi);
	}
	_finish(e) {
		let t = this._steps.filter((e) => e.title.trim()).map((e) => ({
			...e,
			title: e.title.trim()
		}));
		if (t.length === 0) {
			this._error = "There is no step yet. Add one, or try again.";
			return;
		}
		let n = new Set(t.map((e) => e.only_if).filter(Boolean)), r = this._checks.filter((e) => e.text.trim() && n.has(e.id)).map((e) => ({
			...e,
			text: e.text.trim()
		})), i = new Set(r.map((e) => e.id));
		this._fire("breakdown-result", {
			action: e,
			task: this._task.trim(),
			steps: t.map((e) => e.only_if && !i.has(e.only_if) ? {
				...e,
				only_if: ""
			} : e),
			notes: this._notes.trim(),
			questions: r
		});
	}
	_patchCheck(e, t) {
		this._checks = this._checks.map((n) => n.id === e ? {
			...n,
			text: t
		} : n);
	}
	_removeCheck(e) {
		this._checks = this._checks.filter((t) => t.id !== e), this._steps = this._steps.map((t) => t.only_if === e ? {
			...t,
			only_if: ""
		} : t);
	}
	_cancel() {
		this._fire("breakdown-cancel");
	}
	_renderOff() {
		return v`<section class="card main">
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
		return v`
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
      ${this._renderScene()}
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
		return v`<div class="question">
      <div class="qtext">${e.text}</div>
      <div class="chips">
        ${e.options.map((r) => {
			let i = n.includes(r);
			return v`<button
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
		return v`
      ${this._answers.length ? v`<details class="said">
            <summary>What you told me so far (${this._answers.length})</summary>
            <ul>
              ${this._answers.map((e) => v`<li><span class="muted">${e.question}</span> ${e.answer}</li>`)}
            </ul>
          </details>` : x}
      <p class="muted small">
        ${this._round > 1 ? "A few more things, so the steps fit." : "A few questions so the steps fit your situation."}
        Tap what fits, or write as much as you like. You can skip any question.
      </p>
      ${this._renderRooms()}
      ${this._renderScene()}
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
		return v`<boopli-wait
      .label=${this._answers.length || this._steps.length ? "Writing the steps…" : "Thinking…"}
      .pet=${this.snapshot?.settings?.pet_kind ?? "slime"}
      .max=${this.snapshot?.ai_timeout ?? 180}
      @stop-waiting=${() => this._stopWaiting()}
    ></boopli-wait>`;
	}
	_xp() {
		return this._steps.reduce((e, t) => e + Ni[t.size], 0) + Pi;
	}
	_renderStep(e, t) {
		return v`
      ${(t === 0 || this._steps[t - 1].group !== e.group) && e.group ? v`<div class="group">${e.group}</div>` : x}
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
          ${Mi.map((n) => v`<button
              type="button"
              class="chip size ${e.size === n.value ? "on" : ""}"
              title="${n.label} (${n.xp} XP)"
              aria-pressed=${e.size === n.value}
              @click=${() => this._patchStep(t, { size: n.value })}
            >
              ${n.letter}
            </button>`)}
        </span>
        ${e.wait_minutes > 0 ? v`<span class="wait muted small" title="Time to wait before this step">⏳ ${e.wait_minutes} min</span>` : x}
        <span class="tools">
          <button type="button" aria-label="Move up" ?disabled=${t === 0} @click=${() => this._move(t, -1)}>↑</button>
          <button type="button" aria-label="Move down" ?disabled=${t === this._steps.length - 1} @click=${() => this._move(t, 1)}>↓</button>
          <button type="button" aria-label="Add a step after this" @click=${() => this._add(t)}>+</button>
          <button type="button" aria-label="Remove" @click=${() => this._remove(t)}>✕</button>
        </span>
      </div>
      ${this._checks.length ? v`<div class="only-if">
            <label>
              <span class="muted small">Only if</span>
              <select aria-label="Only if, for step ${t + 1}" @change=${(e) => this._patchStep(t, { only_if: e.target.value })}>
                <option value="" ?selected=${!e.only_if}>Always there</option>
                ${this._checks.map((t) => v`<option value=${t.id} ?selected=${e.only_if === t.id}>${t.text} → yes</option>`)}
              </select>
            </label>
          </div>` : x}
    `;
	}
	_renderChecks() {
		return this._checks.length ? v`<div class="checks">
      <b>Questions asked each time you start this chore</b>
      <div class="muted small">
        Today it may look different than next week. Steps that belong to a question only show up when you answer yes.
      </div>
      ${this._checks.map((e) => v`<div class="check">
          <input aria-label="Question" .value=${e.text} @input=${(t) => this._patchCheck(e.id, t.target.value)} />
          <button type="button" aria-label="Remove this question" @click=${() => this._removeCheck(e.id)}>✕</button>
        </div>`)}
    </div>` : x;
	}
	_renderReview() {
		let e = this._steps, t = this.mode === "editor";
		return v`
      <p>
        <b>${e.length} ${e.length === 1 ? "step" : "steps"}</b>
        <span class="muted"> · worth about ${this._xp()} XP when all are done. Check them, change what does not fit.</span>
      </p>
      ${this._renderChecks()}
      <div class="steps">${e.map((e, t) => this._renderStep(e, t))}</div>
      <div class="inline-actions">
        <button type="button" @click=${() => this._add(e.length - 1)}>+ Add a step</button>
        <button type="button" ?disabled=${this._busy} @click=${() => this._loadSteps()}>Try again</button>
        ${this._answers.length || this._questions.length ? v`<button type="button" ?disabled=${this._busy} @click=${() => this._begin()}>Ask me again</button>` : x}
      </div>
      ${this.kind === "recurring" || t ? v`<div class="field">
            <label for="notes">Kept with the chore, for next time (you can edit it)</label>
            <textarea id="notes" rows="2" .value=${this._notes} @input=${(e) => this._notes = e.target.value}></textarea>
          </div>` : x}
      <div class="actions">
        ${t ? this.hasSteps ? v`<button class="primary big" @click=${() => this._finish("replace")}>Replace my steps</button>
                <button class="big" @click=${() => this._finish("append")}>Add to my steps</button>` : v`<button class="primary big" @click=${() => this._finish("replace")}>Use these steps</button>` : this.kind === "recurring" ? v`<button class="primary big" @click=${() => this._finish("schedule")}>Save and set the schedule</button>
                <button class="big" @click=${() => this._finish("save")}>Save without a schedule</button>` : v`<button class="primary big" @click=${() => this._finish("start")}>Start now</button>
                <button class="big" @click=${() => this._finish("save")}>Save as chore</button>`}
      </div>
    `;
	}
	render() {
		return this._aiOn() ? v`
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
        ${this.externalError ? v`<div class="error">${this.externalError}</div>` : x}
        ${this._error ? v`<div class="error">
              ${this._error}
              ${this._phase === "interview" || this._phase === "task" ? v`<div class="muted small">You can try again, or skip the questions.</div>` : x}
            </div>` : x}
        ${this._phase === "task" ? this._renderTask() : x}
        ${this._phase === "interview" ? this._renderInterview() : x}
        ${this._phase === "working" ? this._renderWorking() : x}
        ${this._phase === "review" ? this._renderReview() : x}
      </section>
    ` : this._renderOff();
	}
	static {
		this.styles = [E, o`
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
      .only-if {
        padding: 2px 0 8px 34px;
        border-bottom: 1px solid var(--divider-color);
      }
      .only-if label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
      }
      .only-if select {
        flex: 1;
        min-width: 0;
        font-size: 13px;
      }
      .checks {
        margin: 12px 0;
        padding: 12px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        display: grid;
        gap: 8px;
      }
      .check {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .check input {
        flex: 1;
        min-width: 0;
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
      .scene {
        margin-top: 12px;
        max-width: 760px;
      }
      .scene textarea {
        font: inherit;
        width: 100%;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        resize: vertical;
      }
      .scene label {
        display: block;
        margin-bottom: 6px;
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
        min-height: 40px;
        padding: 0 16px;
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
customElements.define("boopli-breakdown", Ii);
// src/boopli-chore-editor.ts
var Li = 8, Ri = [
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
], zi = [
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
], Bi = [
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
], Vi = Object.fromEntries([
	0,
	1,
	2,
	3,
	4,
	5,
	6
].map((e) => [String(e), ["09:00"]])), Hi = class extends w {
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
		let t = e.action === "append", n = t ? this.draft.questions ?? [] : [], r = new Set(n.map((e) => e.id)), i = /* @__PURE__ */ new Map();
		for (let t of e.questions ?? []) i.set(t.id, r.has(t.id) ? `${t.id}-${Math.random().toString(36).slice(2, 6)}` : t.id);
		let a = e.steps.map((e) => ({
			title: e.title,
			wait_minutes: e.wait_minutes,
			size: e.size,
			group: e.group,
			only_if: e.only_if ? i.get(e.only_if) ?? "" : ""
		})), o = [...n, ...(e.questions ?? []).map((e) => ({
			...e,
			id: i.get(e.id) ?? e.id
		}))].slice(0, Li), s = this.draft.steps.filter((e) => e.title.trim() !== ""), c = t ? [...s, ...a] : a;
		this._update({
			steps: c.slice(0, 50),
			notes: e.notes,
			questions: o
		}), this._suggest = !1;
	}
	_addQuestion() {
		let e = [...this.draft.questions ?? []];
		e.length >= Li || (e.push({
			id: `q${Math.random().toString(36).slice(2, 8)}`,
			text: ""
		}), this._update({ questions: e }));
	}
	_setQuestion(e, t) {
		this._update({ questions: (this.draft.questions ?? []).map((n) => n.id === e ? {
			...n,
			text: t
		} : n) });
	}
	_removeQuestion(e) {
		this._update({
			questions: (this.draft.questions ?? []).filter((t) => t.id !== e),
			steps: this.draft.steps.map((t) => t.only_if === e ? {
				...t,
				only_if: ""
			} : t)
		});
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
			let e = (this.draft.questions ?? []).map((e) => ({
				...e,
				text: e.text.trim()
			})).filter((e) => e.text), t = new Set(e.map((e) => e.id));
			return await lt(this.hass, {
				...this.draft,
				nudge_style: this.draft.nudge_style ?? this.defaultStyle,
				ignore_quiet_hours: this.draft.ignore_quiet_hours ?? !1,
				keeps_going: this.draft.keeps_going ?? !1,
				name: this.draft.name.trim(),
				questions: e,
				steps: this.draft.steps.map((e) => ({
					...e,
					title: e.title.trim(),
					only_if: e.only_if && t.has(e.only_if) ? e.only_if : "",
					image: (e.image ?? "").trim()
				}))
			}), this._close(), !0;
		} catch (e) {
			return this._error = T(e), !1;
		} finally {
			this._busy = !1;
		}
	}
	async _delete() {
		if (this.hass && this.draft.id && !this._busy) {
			this._busy = !0;
			try {
				await ut(this.hass, this.draft.id), this._close();
			} catch (e) {
				this._error = T(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderRepeat() {
		let e = this.draft.repeat;
		return v`
      <div class="field">
        <label for="repeat">Repeats</label>
        <select
          id="repeat"
          .value=${e.type}
          @change=${(t) => {
			let n = t.target.value, r = n === "schedule" && Object.keys(e.days).length === 0 ? Vi : e.days;
			this._updateRepeat({
				type: n,
				days: r
			});
		}}
        >
          ${Bi.map((t) => v`<option value=${t.value} ?selected=${t.value === e.type}>${t.label}</option>`)}
        </select>
      </div>
      ${e.type === "schedule" ? v`<div class="field">
            <label>Each day has its own times. Untick a day that has none.</label>
            <boopli-schedule-days
              .days=${e.days}
              @days-change=${(e) => this._updateRepeat({ days: e.detail })}
            ></boopli-schedule-days>
            <div class="muted small summary">${Mt(e)}</div>
          </div>` : x}
      ${e.type === "every_n_days" ? v`<div class="field">
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
            </div>` : x}
      <div class="field">
        <button type="button" @click=${() => this._sched = "inline"}>Set the schedule step by step</button>
      </div>
    `;
	}
	_renderStep(e) {
		let t = this.draft.steps[e], n = this.draft.steps.length - 1;
		return v`
      <div class="step">
        <div class="step-head">
          <span class="num">${e + 1}</span>
          <input
            aria-label="Step ${e + 1} title"
            placeholder="What to do"
            .value=${t.title}
            @input=${(t) => this._updateStep(e, { title: t.target.value })}
          />
          <span class="sizes" role="group" aria-label="Size of step ${e + 1}">
            ${[
			"small",
			"medium",
			"big"
		].map((n) => v`<button
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
        <div class="part">
          <label class="muted small" for="part-${e}">Part of the task (optional):</label>
          <input
            id="part-${e}"
            class="part-input"
            list="parts-list"
            maxlength="40"
            placeholder="For example: Desk"
            .value=${t.group ?? ""}
            @input=${(t) => this._updateStep(e, { group: t.target.value })}
          />
        </div>
        ${(this.draft.questions ?? []).length ? v`<div class="part">
              <label class="muted small" for="only-if-${e}">Only if:</label>
              <select
                id="only-if-${e}"
                class="part-input"
                @change=${(t) => this._updateStep(e, { only_if: t.target.value })}
              >
                <option value="" ?selected=${!t.only_if}>Always there</option>
                ${(this.draft.questions ?? []).map((e) => v`<option value=${e.id} ?selected=${t.only_if === e.id}>${e.text || "(question without words)"} → yes</option>`)}
              </select>
            </div>` : x}
        <div class="wait">
          <span class="muted small">
            ${(t.wait_for ?? []).length > 0 ? "Longest it waits (0 = as long as it takes):" : "Wait before this step:"}
          </span>
          <div class="chips">
            ${zi.map((n) => v`<button
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
        <details class="auto" ?open=${(t.wait_for ?? []).length > 0}>
          <summary>
            Wait until this happens…
            ${(t.wait_for ?? []).length > 0 ? v`<span class="muted small">(${(t.wait_for ?? []).length} set)</span>` : x}
          </summary>
          <p class="muted small">
            The step stays quiet, with no nudges, until one of these happens, for example your washing machine's
            "cycle finished" event. Then it is your turn. The minutes above become the longest it waits.
          </p>
          <boopli-triggers
            .hass=${this.hass}
            .triggers=${t.wait_for ?? []}
            @triggers-change=${(t) => this._updateStep(e, { wait_for: t.detail })}
          ></boopli-triggers>
        </details>
        <details class="auto" ?open=${!!t.image}>
          <summary>
            📷 Picture…
            ${t.image ? v`<span class="muted small">(set)</span>` : x}
          </summary>
          <boopli-picture
            .hass=${this.hass}
            .value=${t.image ?? ""}
            @picture-change=${(t) => this._updateStep(e, { image: t.detail })}
          ></boopli-picture>
        </details>
        <details class="auto" ?open=${(t.triggers ?? []).length > 0}>
          <summary>
            Finishes by itself when…
            ${(t.triggers ?? []).length > 0 ? v`<span class="muted small">(${(t.triggers ?? []).length} set)</span>` : x}
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
		return e ? this._suggest ? v`<boopli-breakdown
        mode="editor"
        .hass=${this.hass}
        .snapshot=${this.snapshot}
        .kind=${e.repeat.type === "none" ? "now" : "recurring"}
        .task=${e.name}
        .notes=${e.notes ?? ""}
        .hasSteps=${e.steps.some((e) => e.title.trim() !== "")}
        @breakdown-result=${(e) => this._applySuggestion(e.detail)}
        @breakdown-cancel=${() => this._suggest = !1}
      ></boopli-breakdown>` : this._sched === "off" ? v`
      <section class="card ${this._isDirty() ? "changed" : ""}">
        <h2>
          ${e.id ? "Edit chore" : "New chore"}
          ${this._isDirty() ? v`<span class="unsaved-badge">Unsaved</span>` : x}
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
            ${[...Ri, ...(this.snapshot?.settings?.ladders ?? []).map((e) => ({
			value: `ladder:${e.id}`,
			label: `${e.name}: my own ladder`
		}))].map((t) => v`<option
                value=${t.value}
                ?selected=${t.value === (e.nudge_style ?? this.defaultStyle)}
              >
                ${t.label}
              </option>`)}
            ${(e.nudge_style ?? this.defaultStyle).startsWith("ladder:") && !(this.snapshot?.settings?.ladders ?? []).some((t) => `ladder:${t.id}` === (e.nudge_style ?? this.defaultStyle)) ? v`<option value=${e.nudge_style ?? this.defaultStyle} selected>A ladder that is gone</option>` : x}
          </select>
        </div>
        ${(this.snapshot?.settings?.lights ?? []).some((e) => ri(this.hass, e.entity_id)) ? v`<div class="field">
          <label for="lightcolor">Light color for this chore (optional)</label>
          <div class="colorrow">
            <input
              id="lightcolor"
              type="color"
              class="swatch"
              .value=${e.light_color ? ei(e.light_color) : ei(this.snapshot?.settings?.lights?.[0]?.color ?? [
			255,
			90,
			0
		])}
              @input=${(e) => this._update({ light_color: $r(e.target.value) })}
            />
            <button type="button" class="chip" ?disabled=${!e.light_color} @click=${() => this._update({ light_color: void 0 })}>
              Use the lights' own color
            </button>
          </div>
          <div class="muted small">
            A status light can mean something: pills red, laundry blue. This color wins over the colors set in ladders.
            Without one, the nudge's or the light's own color is used. Lights that cannot show colors ignore it.
          </div>
        </div>` : x}
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
        <div class="field check">
          <label class="inline">
            <input
              type="checkbox"
              .checked=${e.keeps_going ?? !1}
              @change=${(e) => this._update({ keeps_going: e.target.checked })}
            />
            Keeps going while I'm away (for example pills)
          </label>
        </div>

        </div>
        <div class="col-b">
        <details class="auto questions" ?open=${(e.questions ?? []).length > 0}>
          <summary>
            Questions before starting…
            ${(e.questions ?? []).length > 0 ? v`<span class="muted small">(${(e.questions ?? []).length})</span>` : x}
          </summary>
          <p class="muted small">
            Asked every time you start this chore, because things look different each time. A step you link to a
            question is only in the list when you answer yes.
          </p>
          ${(e.questions ?? []).map((e) => v`<div class="question">
              <input
                aria-label="Question"
                maxlength="120"
                placeholder="Does the table need decluttering?"
                .value=${e.text}
                @input=${(t) => this._setQuestion(e.id, t.target.value)}
              />
              <button type="button" aria-label="Remove this question" @click=${() => this._removeQuestion(e.id)}>✕</button>
            </div>`)}
          <button type="button" ?disabled=${(e.questions ?? []).length >= Li} @click=${() => this._addQuestion()}>
            + Add a question
          </button>
        </details>
        <h3 class="steps-title">Steps</h3>
        <datalist id="parts-list">
          ${[...new Set(e.steps.map((e) => (e.group ?? "").trim()).filter(Boolean))].map((e) => v`<option value=${e}></option>`)}
        </datalist>
        ${e.steps.map((e, t) => this._renderStep(t))}
        <div class="step-buttons">
          <button type="button" @click=${() => this._addStep()}>+ Add a step</button>
          <button type="button" @click=${() => this._openSuggest()}>✨ Suggest steps with AI</button>
        </div>
        </div>
        </div>

        ${this._error ? v`<div class="error">${this._error}</div>` : x}

        <div class="actions">
          <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
          <button ?disabled=${this._busy} @click=${() => this._close()}>Cancel</button>
          ${e.id ? this._confirmDelete ? v`<span class="muted small">Delete it, and anything in progress?</span>
                  <button class="danger" ?disabled=${this._busy} @click=${() => this._delete()}>Yes, delete</button>
                  <button @click=${() => this._confirmDelete = !1}>No</button>` : v`<button class="danger" @click=${() => this._confirmDelete = !0}>Delete</button>` : x}
        </div>
      </section>
      ${this._isDirty() ? v`<div class="savebar" role="status">
            <span><b>●</b> You have unsaved changes</span>
            <span class="spacer"></span>
            <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
            <button ?disabled=${this._busy} @click=${() => this._close()}>Discard</button>
          </div>` : x}
    ` : v`<boopli-schedule-wizard
        .hass=${this.hass}
        .repeat=${e.repeat}
        .choreName=${e.name}
        .timeZone=${this.timeZone}
        .saves=${this._sched === "direct"}
        @schedule-apply=${(e) => this._applySchedule(e.detail)}
        @schedule-cancel=${() => this._cancelSchedule()}
      ></boopli-schedule-wizard>` : x;
	}
	static {
		this.styles = [E, o`
      .colorrow {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .colorrow .swatch {
        width: 56px;
        min-height: 36px;
        padding: 2px;
        flex: 0 0 auto;
      }
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
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }
      .step-head > input {
        flex: 1 1 160px;
        min-width: 120px;
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
      .question {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;
      }
      .question input {
        flex: 1;
        min-width: 0;
      }
      details.questions {
        margin-bottom: 8px;
      }
      .part {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
      }
      .part-input {
        max-width: 220px;
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
customElements.define("boopli-chore-editor", Hi);
// src/templates.ts
var Ui = {
	type: "none",
	time: "09:00",
	every_n_days: 1,
	days: {}
}, Wi = [
	{
		label: "Dishwasher",
		draft: {
			name: "Dishwasher",
			where: "home",
			enabled: !0,
			one_off: !1,
			repeat: {
				...Ui,
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
				...Ui,
				days: {}
			},
			steps: [
				{
					title: "Start the washing machine",
					wait_minutes: 0
				},
				{
					title: "Hang the laundry up",
					wait_minutes: 60
				},
				{
					title: "Take the laundry down and put it away",
					wait_minutes: 240
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
			keeps_going: !0,
			steps: [{
				title: "Take your pills",
				wait_minutes: 0
			}]
		}
	}
];
function Gi() {
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
var Ki = class extends w {
	static {
		this.properties = {
			hass: { attribute: !1 },
			snapshot: { attribute: !1 },
			nowMs: { type: Number },
			openRequest: { attribute: !1 },
			_editing: { state: !0 },
			_openSchedule: { state: !0 },
			_error: { state: !0 },
			_asking: { state: !0 },
			_busy: { state: !0 }
		};
	}
	constructor() {
		super(), this.nowMs = Date.now(), this.openRequest = null, this._editing = null, this._openSchedule = !1, this._error = "", this._asking = null, this._busy = !1;
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
			keeps_going: e.keeps_going ?? !1,
			light_color: e.light_color ?? void 0,
			notes: e.notes ?? "",
			questions: (e.questions ?? []).map((e) => ({ ...e })),
			steps: e.steps.map((e) => ({
				id: e.id,
				title: e.title,
				wait_minutes: e.wait_minutes,
				triggers: (e.triggers ?? []).map((e) => ({ ...e })),
				wait_for: (e.wait_for ?? []).map((e) => ({ ...e })),
				size: e.size ?? "small",
				group: e.group ?? "",
				only_if: e.only_if ?? "",
				image: e.image ?? ""
			}))
		};
	}
	async save() {
		return await this.renderRoot.querySelector("boopli-chore-editor")?.save?.() ?? !1;
	}
	discard() {
		this._editing = null;
	}
	async _start(e, t) {
		if (this.hass) {
			if (this._error = "", !t && (e.questions ?? []).length > 0) this._asking = e;
			else {
				this._busy = !0;
				try {
					await dt(this.hass, e.id, t), this._asking = null;
				} catch (e) {
					this._error = T(e);
				} finally {
					this._busy = !1;
				}
			}
		}
	}
	render() {
		if (!this.snapshot) return v`<p class="muted">Loading…</p>`;
		if (this._editing) return v`<boopli-chore-editor
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
		if (this._asking) {
			let e = this._asking;
			return v`<section class="card">
        <h2>${e.name}</h2>
        <p class="muted">A quick look first, so the list only has what needs doing today.</p>
        <boopli-questions
          .questions=${e.questions ?? []}
          .busy=${this._busy}
          label="Start"
          @answered=${(t) => this._start(e, t.detail.answers)}
          @cancel=${() => this._asking = null}
        ></boopli-questions>
        ${this._error ? v`<div class="error">${this._error}</div>` : x}
      </section>`;
		}
		let e = this.snapshot.time_zone, t = new Set(this.snapshot.runs.map((e) => e.chore_id)), n = [...this.snapshot.chores].sort((e, t) => e.name.localeCompare(t.name));
		return v`
      <div class="toolbar">
        <button class="primary" @click=${() => this._editing = Gi()}>
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
        ${Wi.map((e) => v`<button
            class="chip"
            @click=${() => this._editing = structuredClone(e.draft)}
          >
            ${e.label}
          </button>`)}
      </div>

      ${this._error ? v`<div class="error">${this._error}</div>` : x}
      ${n.length === 0 ? v`<p class="muted empty">
            No chores yet. Pick a template above or create your own.
          </p>` : v`<div class="chore-list">${n.map((n) => v`
              <section class="card chore">
                <div class="chore-main">
                  <div class="name">${n.name}</div>
                  <div class="muted small">
                    ${Mt(n.repeat)} · ${n.where === "home" ? "Home only" : "Anywhere"}
                    · ${n.steps.length} ${n.steps.length === 1 ? "step" : "steps"}
                  </div>
                  <div class="muted small">
                    ${t.has(n.id) ? "In progress" : n.enabled && n.next_due ? `Next: ${j(n.next_due, this.nowMs, e)}` : n.repeat.type === "none" ? "" : "Not scheduled"}
                  </div>
                </div>
                <div class="chore-actions">
                  ${t.has(n.id) ? x : v`<button @click=${() => this._start(n)}>Start now</button>`}
                  ${n.repeat.type === "none" ? v`<button @click=${() => this._edit(n, !0)}>Set a schedule</button>` : x}
                  <button @click=${() => this._edit(n)}>Edit</button>
                </div>
              </section>
            `)}</div>`}
    `;
	}
	static {
		this.styles = [E, o`
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
        grid-template-columns: repeat(auto-fill, minmax(min(400px, 100%), 1fr));
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
      /* Phones: last, so it wins over the rules above. */
      @media (max-width: 520px) {
        .chore {
          flex-direction: column;
          align-items: stretch;
        }
        .chore-actions {
          justify-content: flex-start;
          flex-shrink: 1;
        }
      }
    `];
	}
};
customElements.define("boopli-chores", Ki);
// src/boopli-speakers.ts
var qi = "amzn_sfx_scifi_alarm_01", Ji = "amzn_sfx_doorbell_chime_01", Yi = "https://developer.amazon.com/en-US/docs/alexa/custom-skills/ask-soundlibrary.html", Xi = [
	"siren",
	"switch",
	"input_boolean",
	"script"
], Zi = [{
	value: "alexa",
	label: "Alexa sound"
}, {
	value: "file",
	label: "File in my media folder"
}], Qi = [
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
], $i = class extends w {
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
				sound: Ji,
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
				sound: qi,
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
			this._note(n, (await ot(this.hass, e, t)).note);
		} catch (e) {
			this._note(n, T(e));
		}
	}
	_setExtra(e, t, n) {
		this._updateSpeaker(e, (e) => ({
			...e,
			sounds: (e.sounds ?? []).map((e) => e.id === t ? {
				...e,
				...n
			} : e)
		}));
	}
	_addExtra(e) {
		this._updateSpeaker(e, (e) => {
			let t = new Set((e.sounds ?? []).map((e) => e.name.toLowerCase())), n = (e.sounds ?? []).length + 1;
			for (; t.has(`sound ${n}`);) n++;
			return {
				...e,
				sounds: [...e.sounds ?? [], {
					id: ii(),
					name: `Sound ${n}`,
					kind: "alexa",
					sound: ""
				}]
			};
		});
	}
	_removeExtra(e, t) {
		this._updateSpeaker(e, (e) => ({
			...e,
			sounds: (e.sounds ?? []).filter((e) => e.id !== t)
		}));
	}
	_moreSounds(e) {
		let t = e.entity_id, n = e.sounds ?? [];
		return v`
      <div class="level">
        <strong>More sounds</strong>
        <span class="muted small">
          For your ladders (Nudge it your way): as many as you like, each with a name. Not part of the built-in styles.
        </span>
        ${n.map((n) => {
			let r = `speaker:${t}:sound:${n.id}`;
			return v`
            <div class="fields">
              <label class="num wide">
                Name
                <input
                  type="text"
                  maxlength="30"
                  .value=${n.name}
                  @change=${(e) => this._setExtra(t, n.id, { name: e.target.value.trim() })}
                />
              </label>
              <label class="num wide">
                Sound type
                <select
                  .value=${n.kind}
                  @change=${(e) => this._setExtra(t, n.id, { kind: e.target.value })}
                >
                  ${Zi.map((e) => v`<option value=${e.value} ?selected=${e.value === n.kind}>${e.label}</option>`)}
                </select>
              </label>
              <label class="num wide">
                ${n.kind === "alexa" ? "Alexa sound id" : "File (for example boopli/fanfare.mp3)"}
                <input
                  type="text"
                  .value=${n.sound}
                  placeholder=${n.kind === "alexa" ? "amzn_sfx_…" : "boopli/fanfare.mp3"}
                  @change=${(e) => this._setExtra(t, n.id, { sound: e.target.value.trim() })}
                />
              </label>
              <button @click=${() => this._test(e, `sound:${n.id}`)}>Test</button>
              <button aria-label="Remove the sound ${n.name}" @click=${() => this._removeExtra(t, n.id)}>✕</button>
              ${this._notes[r] ? v`<div class="note muted small">${this._notes[r]}</div>` : x}
            </div>
          `;
		})}
        <div class="row">
          <button type="button" class="chip" ?disabled=${n.length >= 30} @click=${() => this._addExtra(t)}>+ Add a sound</button>
        </div>
      </div>
    `;
	}
	_startAt(e, t, n = "Starts at nudge #") {
		return v`
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
		return v`
      <div class="level">
        <label class="inline">
          <input
            type="checkbox"
            .checked=${n.enabled}
            @change=${(e) => this._setSound(r, t, { enabled: e.target.checked })}
          />
          ${o}
        </label>
        ${n.enabled ? v`
              <div class="fields">
                <label class="num wide">
                  Sound type
                  <select
                    .value=${n.kind}
                    @change=${(e) => this._setSound(r, t, { kind: e.target.value })}
                  >
                    ${Zi.map((e) => v`<option value=${e.value} ?selected=${e.value === n.kind}>${e.label}</option>`)}
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
                ${n.kind === "alexa" ? v`<div class="muted small libhint">
                      Pick a sound from the
                      <a href=${Yi} target="_blank" rel="noopener noreferrer">Alexa sound library</a>.
                      The id is <code>amzn_sfx_</code> + the sound's name in lower case with underscores
                      + a two-digit number, for example "Doorbell Chime (1)" is
                      <code>amzn_sfx_doorbell_chime_01</code>. Press Test to hear it. Some ids stay silent.
                    </div>` : x}
                ${this._startAt(n.start_at, (e) => this._setSound(r, t, { start_at: e }))}
                ${a ? v`
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
                    ` : x}
                <button @click=${() => this._test(e, t)}>Test</button>
              </div>
            ` : x}
        ${this._notes[i] ? v`<div class="note muted small">${this._notes[i]}</div>` : x}
      </div>
    `;
	}
	_speechRow(e) {
		let t = e.speech, n = e.entity_id, r = `speaker:${n}:speech`, i = this._targets(t.route, t.target);
		return v`
      <div class="level">
        <label class="inline">
          <input
            type="checkbox"
            .checked=${t.enabled}
            @change=${(e) => this._setSpeech(n, { enabled: e.target.checked })}
          />
          Speak a sentence
        </label>
        ${t.enabled ? v`
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
                    ${Qi.map((e) => v`<option value=${e.value} ?selected=${e.value === t.route}>${e.label}</option>`)}
                  </select>
                </label>
                <label class="num wide">
                  ${t.route === "tts" ? "Voice" : "Alexa device"}
                  <select
                    .value=${t.target}
                    @change=${(e) => this._setSpeech(n, { target: e.target.value })}
                  >
                    <option value="" ?selected=${t.target === ""}>Choose…</option>
                    ${i.map((e) => v`<option value=${e.value} ?selected=${e.value === t.target}>${e.label}</option>`)}
                  </select>
                </label>
                ${t.route === "alexa_media" ? v`
                      <label class="inline small">
                        <input
                          type="checkbox"
                          .checked=${t.announce}
                          @change=${(e) => this._setSpeech(n, { announce: e.target.checked })}
                        />
                        Announce (with chime). Some Alexas stay silent, so test it.
                      </label>
                    ` : x}
                ${this._startAt(t.start_at, (e) => this._setSpeech(n, { start_at: e }))}
                <button @click=${() => this._test(e, "speech")}>Test</button>
              </div>
            ` : x}
        ${this._notes[r] ? v`<div class="note muted small">${this._notes[r]}</div>` : x}
      </div>
    `;
	}
	_renderSpeakers(e) {
		let t = e.speakers.map((e) => e.entity_id), n = this._ids(["media_player"], t);
		return v`
      <section class="card">
        <h2>🔊 Speakers</h2>
        <p class="muted small">
          Each speaker can play a small ding, speak a sentence, and sound an
          alarm. In the built-in styles a speaker plays the highest level that has
          been reached. Your ladders can also use more sounds you add here, and
          "Speaks with chime" (an Alexa announcement). Press Test to hear each one.
        </p>
        ${e.speakers.map((t) => v`
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
              ${this._soundRow(t, "alarm")} ${this._moreSounds(t)}
            </div>
          `)}
        <div class="row add">
          <select
            aria-label="Add a speaker"
            .value=${this._addSpeaker}
            @change=${(e) => this._addSpeaker = e.target.value}
          >
            <option value="">Add a speaker…</option>
            ${n.map((e) => v`<option value=${e} ?selected=${e === this._addSpeaker}>${this._friendly(e)}</option>`)}
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
			this._note(t, (await st(this.hass, e)).note);
		} catch (e) {
			this._note(t, T(e));
		}
	}
	_renderDevices(e) {
		let t = e.alarm_devices.map((e) => e.entity_id), n = this._ids(Xi, t);
		return v`
      <section class="card">
        <h2>🚨 Alarm devices</h2>
        <p class="muted small">
          A siren, switch or script that sounds the alarm. Boopli switches it on
          for the time you set and then off again, and off when you answer or
          when Home Assistant restarts.
        </p>
        ${e.alarm_devices.map((t) => {
			let n = `device:${t.entity_id}`;
			return v`
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
            ${this._notes[n] ? v`<div class="note muted small">${this._notes[n]}</div>` : x}
          `;
		})}
        <div class="row add">
          <select
            aria-label="Add an alarm device"
            .value=${this._addDevice}
            @change=${(e) => this._addDevice = e.target.value}
          >
            <option value="">Add a siren, switch or script…</option>
            ${n.map((e) => v`<option value=${e} ?selected=${e === this._addDevice}>${this._friendly(e)}</option>`)}
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
		if (!e) return x;
		let t = this.show || "all";
		return v`${t === "devices" ? x : this._renderSpeakers(e)}
    ${t === "speakers" ? x : this._renderDevices(e)}`;
	}
	static {
		this.styles = [E, o`
      :host {
        display: block;
      }
      section.card {
        margin: 0 0 16px;
      }
      :host([show]) section.card {
        margin: 0;
      }
      :host([plain]) section.card {
        border: 0;
        box-shadow: none;
        background: none;
        padding: 0;
        margin: 0;
      }
      :host([plain]) h2 {
        display: none;
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
customElements.define("boopli-speakers", $i);
// src/boopli-rung.ts
var ea = 1, ta = 720, na = [
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
		label: "Max volume"
	}
];
function ra(e) {
	let t = [];
	e.cue?.enabled && t.push({
		value: "cue",
		label: "A ding"
	});
	for (let n of e.sounds ?? []) t.push({
		value: `sound:${n.id}`,
		label: `🔔 ${n.name}`
	});
	return e.speech?.enabled && (t.push({
		value: "speech",
		label: "Speaks"
	}), e.speech.route === "alexa_media" && t.push({
		value: "speech_chime",
		label: "Speaks with chime"
	})), e.alarm?.enabled && t.push({
		value: "alarm",
		label: "Alarm"
	}), t;
}
var ia = class extends w {
	static {
		this.properties = {
			hass: { attribute: !1 },
			settings: { attribute: !1 },
			rung: { attribute: !1 },
			index: { type: Number },
			gap: { type: Boolean }
		};
	}
	constructor() {
		super(), this.index = 0, this.gap = !1;
	}
	_change(e) {
		if (!this.rung) return;
		let t = structuredClone(this.rung);
		e(t), this.dispatchEvent(new CustomEvent("rung-change", {
			detail: t,
			bubbles: !0,
			composed: !0
		}));
	}
	_toggle(e, t) {
		this._change((n) => {
			let r = n.alarms.filter((t) => t !== e);
			n.alarms = t ? [...r, e] : r;
		});
	}
	_setPhone(e, t) {
		this._change((n) => {
			t ? n.phones[e] = t : delete n.phones[e];
		});
	}
	_setSpeaker(e, t) {
		this._change((n) => {
			t ? n.speakers[e] = t : delete n.speakers[e];
		});
	}
	_setLight(e, t) {
		this._change((n) => {
			if (!t) {
				delete n.lights[e];
				return;
			}
			let r = n.lights[e];
			n.lights[e] = {
				mode: t === "own" ? "" : t,
				color: r?.color ?? null
			};
		});
	}
	_setLightColor(e, t) {
		this._change((n) => {
			n.lights[e] && (n.lights[e].color = t);
		});
	}
	_setGap(e) {
		let t = Math.round(Number(e.value));
		if (e.value.trim() === "" || Number.isNaN(t)) {
			e.value = String(this.rung?.gap ?? ea);
			return;
		}
		let n = Math.min(ta, Math.max(ea, t));
		e.value = String(n), this._change((e) => e.gap = n);
	}
	render() {
		let e = this.settings, t = this.rung;
		if (!e || !t) return x;
		let n = this.index + 1, r = !e.phones.length && !e.lights.length && !e.speakers.length && !e.alarm_devices.length;
		return v`
      ${this.gap && this.index > 0 ? v`<label class="gap">
            Wait
            <input
              type="number"
              min=${ea}
              max=${ta}
              .value=${String(t.gap)}
              aria-label="Minutes before nudge ${n}"
              @change=${(e) => this._setGap(e.target)}
            />
            minutes after the previous nudge
          </label>` : x}
      ${r ? v`<p class="muted small">
            Set up a phone, light, speaker or alarm device in Settings first. They show up here.
          </p>` : x}
      <div class="devs">
        ${e.phones.map((e) => v`<label class="dev">
            <span>📱 ${Q(e.service)}</span>
            <select
              aria-label="${Q(e.service)} at nudge ${n}"
              @change=${(t) => this._setPhone(e.service, t.target.value)}
            >
              <option value="" ?selected=${!t.phones[e.service]}>Off</option>
              ${na.map((n) => v`<option value=${n.value} ?selected=${t.phones[e.service] === n.value}>${n.label}</option>`)}
            </select>
          </label>`)}
        ${e.lights.map((e) => {
			let r = t.lights[e.entity_id], i = X(this.hass, e.entity_id);
			return v`<div class="devblock">
            <label class="dev">
              <span>💡 ${i}</span>
              <select
                aria-label="${i} at nudge ${n}"
                @change=${(t) => this._setLight(e.entity_id, t.target.value)}
              >
                <option value="" ?selected=${!r}>Off</option>
                <option value="blink" ?selected=${r?.mode === "blink"}>Blink</option>
                <option value="indicator" ?selected=${r?.mode === "indicator"}>Status light (stays on until you answer)</option>
                <option value="own" ?selected=${r?.mode === ""}>As set for the light</option>
              </select>
            </label>
            ${r && ri(this.hass, e.entity_id) ? v`<div class="dev colorrow">
                  <span>Color</span>
                  <input
                    type="color"
                    class="swatch"
                    aria-label="${i} color at nudge ${n}"
                    .value=${ei(r.color ?? e.color)}
                    @input=${(t) => this._setLightColor(e.entity_id, $r(t.target.value))}
                  />
                  <button type="button" class="chip" ?disabled=${!r.color} @click=${() => this._setLightColor(e.entity_id, null)}>
                    Use the normal color
                  </button>
                </div>` : x}
          </div>`;
		})}
        ${e.speakers.map((e) => {
			let r = ra(e), i = t.speakers[e.entity_id], a = X(this.hass, e.entity_id);
			return v`<label class="dev">
            <span>🔊 ${a}</span>
            <select
              aria-label="${a} at nudge ${n}"
              ?disabled=${!r.length && !i}
              @change=${(t) => this._setSpeaker(e.entity_id, t.target.value)}
            >
              <option value="" ?selected=${!i}>${r.length ? "Off" : "No sound set up"}</option>
              ${r.map((e) => v`<option value=${e.value} ?selected=${i === e.value}>${e.label}</option>`)}
              ${i && !r.some((e) => e.value === i) ? v`<option value=${i} selected>(not available any more)</option>` : x}
            </select>
          </label>`;
		})}
        ${e.alarm_devices.map((e) => v`<label class="dev check">
            <input
              type="checkbox"
              .checked=${t.alarms.includes(e.entity_id)}
              @change=${(t) => this._toggle(e.entity_id, t.target.checked)}
            />
            <span>🚨 ${X(this.hass, e.entity_id)}</span>
          </label>`)}
      </div>
    `;
	}
	static {
		this.styles = [E, o`
      :host {
        display: block;
      }
      .small {
        font-size: 13px;
      }
      label.gap {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin: 0 0 10px;
        font-size: 14px;
        color: var(--primary-text-color);
      }
      label.gap input {
        width: 84px;
        min-height: 36px;
        padding: 4px 8px;
      }
      .devs {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      label.dev {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 10px;
        margin: 0;
        font-size: 14px;
        color: var(--primary-text-color);
      }
      label.dev > span {
        flex: 1 1 110px;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      label.dev select {
        flex: 1 1 170px;
        width: auto;
        min-width: 0;
      }
      .devblock {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .colorrow {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 10px;
        padding-left: 4px;
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .colorrow .swatch {
        width: 44px;
        min-height: 34px;
        padding: 2px;
      }
      label.dev.check {
        justify-content: flex-start;
      }
      label.dev.check input {
        width: auto;
        min-height: 0;
        flex: none;
      }
      label.dev.check span {
        flex: 1;
      }
    `];
	}
};
customElements.define("boopli-rung", ia);
// src/boopli-ladders.ts
var aa = 20, oa = 12, sa = 1, ca = 720, la = 40, ua = [
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
];
function da(e) {
	return structuredClone(e);
}
var fa = class extends w {
	static {
		this.properties = {
			hass: { attribute: !1 },
			settings: { attribute: !1 },
			snapshot: { attribute: !1 },
			_open: { state: !0 },
			_note: { state: !0 }
		};
	}
	constructor() {
		super(), this._open = "", this._note = "";
	}
	get _ladders() {
		return this.settings?.ladders ?? [];
	}
	_patch(e, t = {}) {
		this._note = "", this.dispatchEvent(new CustomEvent("settings-patch", {
			detail: {
				ladders: e,
				...t
			},
			bubbles: !0,
			composed: !0
		}));
	}
	_edit(e, t) {
		let n = structuredClone(this._ladders), r = n.find((t) => t.id === e);
		r && (t(r), this._patch(n));
	}
	_editRung(e, t, n) {
		this._edit(e, (e) => {
			e.rungs[t] && n(e.rungs[t]);
		});
	}
	_uniqueName(e) {
		let t = new Set(this._ladders.map((e) => e.name.toLowerCase()));
		if (!t.has(e.toLowerCase())) return e;
		for (let n = 2;; n++) {
			let r = `${e} ${n}`;
			if (!t.has(r.toLowerCase())) return r;
		}
	}
	_add() {
		let e = this.settings;
		if (!e || this._ladders.length >= aa) return;
		let t = {
			gap: 5,
			phones: Object.fromEntries(e.phones.map((e) => [e.service, e.level])),
			lights: {},
			speakers: {},
			alarms: []
		}, n = {
			id: ii(),
			name: this._uniqueName("My ladder"),
			rungs: [t],
			repeat_last: !1
		};
		this._patch([...this._ladders, n]), this._open = n.id;
	}
	_delete(e) {
		let t = `ladder:${e.id}`, n = (this.snapshot?.chores ?? []).filter((e) => e.nudge_style === t).map((e) => e.name);
		n.length ? this._note = `"${e.name}" is used by ${n.sort().join(", ")}. Pick another nudge style for them first.` : this.settings?.default_style === t ? this._note = `"${e.name}" is the style for new chores. Choose another one for new chores first.` : (this._patch(this._ladders.filter((t) => t.id !== e.id)), this._open === e.id && (this._open = ""));
	}
	_addRung(e) {
		this._edit(e, (e) => {
			if (e.rungs.length >= oa) return;
			let t = e.rungs[e.rungs.length - 1];
			e.rungs.push(t ? da(t) : {
				gap: 5,
				phones: {},
				lights: {},
				speakers: {},
				alarms: []
			});
		});
	}
	_duplicateRung(e, t) {
		this._edit(e, (e) => {
			e.rungs.length >= oa || e.rungs.splice(t + 1, 0, da(e.rungs[t]));
		});
	}
	_removeRung(e, t) {
		this._edit(e, (e) => {
			e.rungs.length > 1 && e.rungs.splice(t, 1);
		});
	}
	_moveRung(e, t, n) {
		this._edit(e, (e) => {
			let r = t + n;
			r < 0 || r >= e.rungs.length || ([e.rungs[t], e.rungs[r]] = [e.rungs[r], e.rungs[t]]);
		});
	}
	_setGap(e, t, n) {
		let r = Math.round(Number(n.value));
		if (n.value.trim() === "" || Number.isNaN(r)) {
			let r = this._ladders.find((t) => t.id === e)?.rungs[t];
			r && (n.value = String(r.gap));
			return;
		}
		let i = Math.min(ca, Math.max(sa, r));
		n.value = String(i), this._editRung(e, t, (e) => e.gap = i);
	}
	_who(e) {
		let t = [];
		for (let [n, r] of Object.entries(e.phones)) t.push(`${Q(n)} (${ti[r] ?? r})`);
		for (let [n, r] of Object.entries(e.lights)) {
			let e = r.mode === "indicator" ? "status light" : r.mode === "blink" ? "blink" : "";
			t.push(`${X(this.hass, n)}${e ? ` (${e}${r.color ? ", own color" : ""})` : ""}`);
		}
		for (let [n, r] of Object.entries(e.speakers)) {
			let e = this.settings?.speakers.find((e) => e.entity_id === n), i = ra(e ?? { entity_id: n }).find((e) => e.value === r)?.label ?? r;
			t.push(`${X(this.hass, n)} (${i.replace("🔔 ", "").toLowerCase()})`);
		}
		for (let n of e.alarms) t.push(`${X(this.hass, n)} (alarm)`);
		return t.length ? t.join(", ") : "nothing";
	}
	_lines(e) {
		let t = e.rungs.map((e, t) => t === 0 ? `Nudge 1, right away: ${this._who(e)}` : `Nudge ${t + 1}, ${e.gap} min later: ${this._who(e)}`), n = e.rungs[e.rungs.length - 1];
		return t.push(e.repeat_last && n ? `Then it repeats the last nudge every ${n.gap} min until you answer.` : "Then it stops."), t;
	}
	_renderRung(e, t, n) {
		let r = e.rungs.length > 1;
		return v`<div class="rung">
      <div class="rung-head">
        <b>Nudge ${n + 1}</b>
        ${n === 0 && !(e.rungs.length === 1 && e.repeat_last) ? v`<span class="muted small">right away</span>` : v`<label class="gap">
              ${n === 0 ? "Right away, then repeats every" : "Wait"}
              <input
                type="number"
                min=${sa}
                max=${ca}
                .value=${String(t.gap)}
                aria-label="Minutes before nudge ${n + 1}"
                @change=${(t) => this._setGap(e.id, n, t.target)}
              />
              min
            </label>`}
        <span class="spacer"></span>
        <button class="chip" title="Move up" aria-label="Move nudge ${n + 1} up" ?disabled=${n === 0}
          @click=${() => this._moveRung(e.id, n, -1)}>↑</button>
        <button class="chip" title="Move down" aria-label="Move nudge ${n + 1} down" ?disabled=${n === e.rungs.length - 1}
          @click=${() => this._moveRung(e.id, n, 1)}>↓</button>
        <button class="chip" title="Copy this nudge" aria-label="Copy nudge ${n + 1}" ?disabled=${e.rungs.length >= oa}
          @click=${() => this._duplicateRung(e.id, n)}>⧉</button>
        <button class="chip" title="Remove this nudge" aria-label="Remove nudge ${n + 1}" ?disabled=${!r}
          @click=${() => this._removeRung(e.id, n)}>✕</button>
      </div>
      <boopli-rung
        .hass=${this.hass}
        .settings=${this.settings}
        .rung=${t}
        .index=${n}
        @rung-change=${(t) => this._editRung(e.id, n, (e) => Object.assign(e, t.detail))}
      ></boopli-rung>
    </div>`;
	}
	_renderEditor(e) {
		return v`<div class="editor">
      <div class="field">
        <label for="name-${e.id}">Name</label>
        <input
          id="name-${e.id}"
          maxlength=${la}
          .value=${e.name}
          @input=${(t) => this._edit(e.id, (e) => e.name = t.target.value)}
        />
      </div>
      ${e.rungs.map((t, n) => this._renderRung(e, t, n))}
      <div class="row">
        <button ?disabled=${e.rungs.length >= oa} @click=${() => this._addRung(e.id)}>+ Add a nudge</button>
        <span class="muted small">${e.rungs.length} of ${oa}</span>
      </div>
      <div class="field">
        <label for="end-${e.id}">After the last nudge</label>
        <select
          id="end-${e.id}"
          @change=${(t) => this._edit(e.id, (e) => e.repeat_last = t.target.value === "repeat")}
        >
          <option value="stop" ?selected=${!e.repeat_last}>Stop</option>
          <option value="repeat" ?selected=${e.repeat_last}>Repeat the last nudge until I answer</option>
        </select>
      </div>
      <div class="summary">
        <b class="small">What it will do</b>
        ${this._lines(e).map((e) => v`<div class="small">${e}</div>`)}
      </div>
    </div>`;
	}
	render() {
		let e = this.settings;
		if (!e) return x;
		let t = this._ladders;
		return v`<section class="card">
      <h2>🪜 Nudge it your way</h2>
      <p class="muted small">
        Build your own ladder of nudges. For each nudge you choose how long Boopli waits, and exactly which phone,
        light, speaker or alarm acts, and how loud. A chore uses a ladder when you pick it as its nudge style.
      </p>
      <div class="field">
        <label for="default-style">Use for new chores</label>
        <select
          id="default-style"
          @change=${(e) => this._patch(t, { default_style: e.target.value })}
        >
          ${ua.map((t) => v`<option value=${t.value} ?selected=${t.value === e.default_style}>${t.label}</option>`)}
          ${t.map((t) => v`<option value=${`ladder:${t.id}`} ?selected=${`ladder:${t.id}` === e.default_style}>
              ${t.name || "(no name)"}
            </option>`)}
          ${e.default_style.startsWith("ladder:") && !t.some((t) => `ladder:${t.id}` === e.default_style) ? v`<option value=${e.default_style} selected>${ai(e.default_style, t)}</option>` : x}
        </select>
      </div>
      ${t.length === 0 ? v`<p class="muted">No ladders yet. The built-in styles work as before.</p>` : t.map((e) => {
			let t = this._open === e.id;
			return v`<div class="ladder">
              <div class="lhead">
                <b class="lname">${e.name || "(no name)"}</b>
                <span class="muted small">${e.rungs.length} ${e.rungs.length === 1 ? "nudge" : "nudges"}</span>
                <span class="spacer"></span>
                <button class="chip" aria-expanded=${t ? "true" : "false"} @click=${() => this._open = t ? "" : e.id}>
                  ${t ? "Close" : "Edit"}
                </button>
                <button class="chip danger" @click=${() => this._delete(e)}>Delete</button>
              </div>
              ${t ? this._renderEditor(e) : v`<div class="summary">${this._lines(e).map((e) => v`<div class="small">${e}</div>`)}</div>`}
            </div>`;
		})}
      ${this._note ? v`<div class="error" role="alert">${this._note}</div>` : x}
      <div class="row">
        <button class="primary" ?disabled=${t.length >= aa} @click=${() => this._add()}>+ New ladder</button>
      </div>
    </section>`;
	}
	static {
		this.styles = [E, o`
      :host {
        display: block;
      }
      :host([plain]) section.card {
        border: 0;
        box-shadow: none;
        background: none;
        padding: 0;
        margin: 0;
      }
      :host([plain]) h2 {
        display: none;
      }
      :host(.changed) section.card {
        border-color: var(--warning-color, #ffa600);
        box-shadow: inset 4px 0 0 var(--warning-color, #ffa600);
      }
      h2 {
        font-size: 18px;
        margin-bottom: 6px;
      }
      .small {
        font-size: 13px;
      }
      .spacer {
        flex: 1;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        padding: 6px 0;
      }
      .ladder {
        border-top: 1px solid var(--divider-color);
        padding: 10px 0 6px;
      }
      .lhead {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .lname {
        overflow-wrap: anywhere;
      }
      .summary {
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: 8px 0 2px;
        color: var(--secondary-text-color);
      }
      .editor {
        padding-top: 8px;
      }
      .rung {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 8px 10px;
        margin: 0 0 8px;
      }
      .rung-head {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        padding-bottom: 6px;
      }
      .rung-head button.chip {
        padding: 4px 10px;
        min-height: 32px;
      }
      label.gap {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
      }
      label.gap input {
        width: 76px;
        min-height: 34px;
        padding: 4px 8px;
      }
      .field {
        margin: 0 0 10px;
      }
    `];
	}
};
customElements.define("boopli-ladders", fa);
// src/boopli-pet-picker.ts
var pa = class extends w {
	static {
		this.properties = {
			value: { type: String },
			moods: { type: Boolean }
		};
	}
	constructor() {
		super(), this.value = "slime", this.moods = !1;
	}
	_pick(e) {
		this.dispatchEvent(new CustomEvent("pet-kind-change", {
			detail: e,
			bubbles: !0,
			composed: !0
		}));
	}
	_key(e, t) {
		let n = vr.length - 1, r = t;
		if (e.key === "ArrowRight" || e.key === "ArrowDown") r = t === n ? 0 : t + 1;
		else if (e.key === "ArrowLeft" || e.key === "ArrowUp") r = t === 0 ? n : t - 1;
		else if (e.key === "Home") r = 0;
		else if (e.key === "End") r = n;
		else return;
		e.preventDefault(), this._pick(vr[r].kind), (this.shadowRoot?.querySelectorAll("button.choice")[r])?.focus();
	}
	render() {
		let e = br(this.value);
		return v`
      <div class="grid" role="radiogroup" aria-label="Your pet">
        ${vr.map((t, n) => v`<button
            type="button"
            role="radio"
            class="choice ${t.kind === e.kind ? "on" : ""}"
            aria-checked=${t.kind === e.kind}
            tabindex=${t.kind === e.kind ? 0 : -1}
            @click=${() => this._pick(t.kind)}
            @keydown=${(e) => this._key(e, n)}
          >
            <span class="pic"><boopli-pet .kind=${t.kind} .mood=${"content"} still></boopli-pet></span>
            <span class="name">${t.label}</span>
            ${t.art ? "" : v`<span class="soon">art soon</span>`}
          </button>`)}
      </div>
      ${this.moods ? v`<div class="moods" aria-label="${e.label} in every mood">
            ${yr.map((t) => v`<div class="mood">
                <span class="pic"><boopli-pet .kind=${e.kind} .mood=${t} still></boopli-pet></span>
                <span class="small muted">${t}</span>
              </div>`)}
          </div>` : ""}
    `;
	}
	static {
		this.styles = [E, o`
      :host {
        display: block;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
        gap: 10px;
      }
      .choice {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 6px 8px;
        border-radius: 14px;
        border: 2px solid var(--divider-color, #444);
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
      }
      .choice.on {
        border-color: var(--primary-color, #03a9f4);
        background: color-mix(in srgb, var(--primary-color, #03a9f4) 14%, transparent);
      }
      .pic {
        display: block;
        width: 64px;
        height: 64px;
      }
      .name {
        font-weight: 500;
      }
      .soon {
        font-size: 12px;
        opacity: 0.65;
      }
      .moods {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 12px;
      }
      .mood {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 72px;
      }
      .mood .pic {
        width: 56px;
        height: 56px;
      }
      .small {
        font-size: 13px;
      }
    `];
	}
};
customElements.define("boopli-pet-picker", pa);
// src/boopli-pet-preview.ts
var ma = [
	{
		value: "levelup",
		label: "Level up"
	},
	{
		value: "wake",
		label: "Waking up"
	},
	{
		value: "tap",
		label: "Tap"
	},
	{
		value: "done",
		label: "Step done"
	}
], ha = [
	{
		value: "",
		label: "Nothing"
	},
	{
		value: "housework",
		label: "Housework"
	},
	{
		value: "typing",
		label: "Typing"
	}
], ga = class extends w {
	static {
		this.properties = {
			kind: { type: String },
			_mood: { state: !0 },
			_activity: { state: !0 },
			_level: { state: !0 },
			_away: { state: !0 },
			_moment: { state: !0 },
			_seq: { state: !0 },
			_text: { state: !0 }
		};
	}
	constructor() {
		super(), this.kind = "slime", this._mood = "content", this._activity = "", this._level = 4, this._away = !1, this._moment = "", this._seq = 0, this._text = "";
	}
	_dialog() {
		return this.renderRoot.querySelector("dialog");
	}
	_open() {
		this._dialog()?.showModal();
	}
	_close() {
		this._dialog()?.close();
	}
	_play(e) {
		this._moment = e, this._text = e === "levelup" ? `Level ${Math.min(this._level + 1, 99)}!` : e === "done" ? "+10 XP" : "", this._seq += 1;
	}
	_chip(e, t, n) {
		return v`<button type="button" class="chip ${t ? "on" : ""}" aria-pressed=${t} @click=${n}>${e}</button>`;
	}
	render() {
		let e = br(this.kind);
		return v`
      <button type="button" class="open" @click=${() => this._open()}>▶ Preview your pet</button>
      <dialog
        aria-label="Preview of your pet"
        @click=${(e) => {
			e.target === e.currentTarget && this._close();
		}}
      >
        <div class="win">
          <div class="head">
            <h3>${e.label}: preview</h3>
            <button type="button" class="close" aria-label="Close" @click=${() => this._close()}>✕</button>
          </div>
          <boopli-stage
            .kind=${this.kind}
            .mood=${this._mood}
            .level=${this._level}
            .away=${this._away}
            .activity=${this._activity}
            .moment=${this._moment}
            .momentSeq=${this._seq}
            .momentText=${this._text}
          ></boopli-stage>
          ${e.art ? "" : v`<p class="muted small">${e.label} has no animated art yet, so it shows its emoji.</p>`}

          <div class="group">
            <div class="label">Mood</div>
            <div class="chips">${yr.map((e) => this._chip(e, this._mood === e, () => this._mood = e))}</div>
          </div>
          <div class="group">
            <div class="label">Busy with</div>
            <div class="chips">
              ${ha.map((e) => this._chip(e.label, this._activity === e.value, () => this._activity = e.value))}
            </div>
          </div>
          <div class="group">
            <div class="label">Moments (they play once)</div>
            <div class="chips">
              ${ma.map((e) => v`<button type="button" class="chip" @click=${() => this._play(e.value)}>${e.label}</button>`)}
            </div>
          </div>
          <div class="group row">
            <label class="inline">
              Level ${this._level}
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                .value=${String(this._level)}
                aria-label="Level"
                @input=${(e) => this._level = Number(e.target.value)}
              />
            </label>
            <label class="inline">
              <input type="checkbox" .checked=${this._away} @change=${(e) => this._away = e.target.checked} />
              Away mode (suitcase)
            </label>
          </div>
          <p class="muted small">The room grows with the level: a water bowl at 1, a food bowl at 2, a bed at 3. Sleepy or hibernating, the pet sleeps in the bed.</p>
          <div class="actions"><button type="button" class="primary" @click=${() => this._close()}>Close</button></div>
        </div>
      </dialog>
    `;
	}
	static {
		this.styles = [E, o`
      :host {
        display: block;
      }
      .open {
        margin-top: 10px;
      }
      dialog {
        padding: 0;
        border: 1px solid var(--divider-color, #444);
        border-radius: 16px;
        width: min(94vw, 780px);
        max-height: 92vh;
        overflow: auto;
        background: var(--card-background-color, #1c1c1c);
        color: var(--primary-text-color, #fff);
      }
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.6);
      }
      .win {
        padding: 16px 18px 18px;
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }
      h3 {
        margin: 0;
        font-size: 18px;
      }
      .close {
        border: 0;
        background: transparent;
        color: inherit;
        font-size: 20px;
        min-width: 40px;
        min-height: 40px;
        cursor: pointer;
      }
      .group {
        margin-top: 14px;
      }
      .label {
        font-weight: 500;
        margin-bottom: 6px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 22px;
      }
      label.inline {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin: 0;
      }
      label.inline input[type="checkbox"] {
        width: auto;
        min-height: 0;
      }
      label.inline input[type="range"] {
        width: 160px;
        min-height: 0;
      }
      .actions {
        margin-top: 14px;
      }
      .small {
        font-size: 14px;
      }
      /* A phone: the window fills the screen. */
      @media (max-width: 760px) {
        dialog {
          width: 100vw;
          max-width: 100vw;
          height: 100vh;
          max-height: 100vh;
          border-radius: 0;
          border: 0;
        }
      }
    `];
	}
};
customElements.define("boopli-pet-preview", ga);
// src/boopli-settings.ts
var _a = {
	phone: {
		emoji: "📱",
		title: "Phone",
		wizard: "phone",
		keys: ["phones"]
	},
	lights: {
		emoji: "💡",
		title: "Reminder lights",
		wizard: "lights",
		keys: ["lights"]
	},
	speakers: {
		emoji: "🔊",
		title: "Speakers",
		wizard: "speakers",
		keys: ["speakers", "speech_template"]
	},
	alarms: {
		emoji: "🚨",
		title: "Alarm devices",
		wizard: "alarms",
		keys: ["alarm_devices"]
	},
	quiet: {
		emoji: "🌙",
		title: "Quiet hours",
		wizard: "quiet",
		keys: ["quiet_hours"]
	},
	timing: {
		emoji: "⏰",
		title: "Snooze and timing",
		wizard: "nudging",
		keys: [
			"snooze_minutes",
			"question_wait_minutes",
			"check_in_minutes"
		]
	},
	ladders: {
		emoji: "🪜",
		title: "Nudge it your way",
		wizard: "ladders",
		keys: ["ladders", "default_style"]
	},
	presence: {
		emoji: "📍",
		title: "Where you are",
		wizard: "presence",
		keys: ["presence_entity"]
	},
	pet: {
		emoji: "🐾",
		title: "Your pet",
		wizard: "pet",
		keys: ["pet_name", "pet_kind"]
	},
	ai: {
		emoji: "🤖",
		title: "AI help",
		wizard: "ai",
		keys: ["ai"]
	}
}, va = [
	{
		title: "Devices",
		areas: [
			"phone",
			"lights",
			"speakers",
			"alarms"
		]
	},
	{
		title: "Timing",
		areas: [
			"quiet",
			"timing",
			"ladders",
			"presence"
		]
	},
	{
		title: "Extras",
		areas: ["pet", "ai"]
	}
], ya = va.flatMap((e) => e.areas), ba = [
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
], xa = [{
	value: "blink",
	label: "Blink"
}, {
	value: "indicator",
	label: "Indicator lamp (on until done)"
}], Sa = {
	start: "07:00",
	stop: "22:00"
}, Ca = class extends w {
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
			_modal: { state: !0 },
			_flash: { state: !0 },
			_defaults: { state: !0 },
			_aiNote: { state: !0 }
		};
	}
	constructor() {
		super(), this._justSaved = !1, this._lastDirty = !1, this._flashTimer = 0, this._addLight = "", this._busy = !1, this._message = "", this._error = "", this._notes = {}, this._modal = "", this._flash = "", this._defaults = null, this._aiNote = "";
	}
	willUpdate() {
		let e = this.snapshot?.settings;
		if (e) {
			if (!this._draft || !this._base) this._base = structuredClone(e), this._draft = structuredClone(e);
			else if (this._justSaved && JSON.stringify(e) !== JSON.stringify(this._base)) {
				let t = JSON.stringify(this._draft) === JSON.stringify(this._base);
				this._base = structuredClone(e), t && (this._draft = structuredClone(e), this._modal && (this._modalBase = structuredClone(e))), this._justSaved = !1;
			}
		}
	}
	updated() {
		let e = this.renderRoot.querySelector("dialog");
		e && (this._modal && !e.open && e.showModal(), !this._modal && e.open && e.close());
		let t = this._isDirty();
		t !== this._lastDirty && (this._lastDirty = t, this.dispatchEvent(new CustomEvent("dirty-change", {
			detail: {
				source: "settings",
				dirty: t
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
		return this._changed(...e) ? v`<span class="unsaved-badge">Unsaved</span>` : x;
	}
	_cardClass(...e) {
		return this._changed(...e) ? "card changed" : "card";
	}
	async save() {
		if (!this.hass || !this._draft || this._busy) return !1;
		this._busy = !0, this._error = "", this._message = "";
		let e = structuredClone(this._draft);
		try {
			return await Ue(this.hass, e), this._justSaved = !0, this._base = e, this._message = "Saved.", !0;
		} catch (e) {
			return this._error = T(e), !1;
		} finally {
			this._busy = !1;
		}
	}
	discard() {
		this._base && (this._draft = structuredClone(this._base)), this._message = "", this._error = "";
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
		return v`
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
			let n = await at(this.hass, {
				service: e,
				level: t,
				start_at: 1
			});
			this._note(`phone:${e}`, n.note);
		} catch (t) {
			this._note(`phone:${e}`, T(t));
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
				let t = await it(this.hass, e);
				this._note(`light:${e.entity_id}`, t.note);
			} catch (t) {
				this._note(`light:${e.entity_id}`, T(t));
			}
		}
	}
	_setQuiet(e) {
		if (!this._draft) return;
		let t = this._draft.quiet_hours.days;
		e && Object.keys(t).length === 0 && (t = Object.fromEntries(O.map((e, t) => [String(t), { ...Sa }]))), this._set({ quiet_hours: {
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
		let e = this._draft.quiet_hours, t = e.days[0], n = Object.fromEntries(O.map((e, n) => [String(n), t ? { ...t } : null]));
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
		return v`
      <section class=${this._cardClass("phones")}>
        <h2>📱 Phones ${this._badge("phones")}</h2>
        <p class="muted small">
          Boopli sends a notification with Done and Snooze buttons through the
          Home Assistant app on the phones you turn on.
        </p>
        ${t.length === 0 ? v`<p class="muted">No phones with the Home Assistant app found.</p>` : t.map((t) => {
			let n = e.phones.find((e) => e.service === t), r = this._notes[`phone:${t}`];
			return v`
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
                    ${ba.map((e) => v`<option value=${e.value} ?selected=${e.value === (n?.level ?? "normal")}>${e.label}</option>`)}
                  </select>
                  <button @click=${() => this._testPhone(t)}>Test</button>
                </div>
                ${n ? v`<div class="startrow">
                      ${this._startAtField(n.start_at ?? 1, (e) => this._setPhoneStart(t, e))}
                    </div>` : x}
                ${r ? v`<div class="note muted small">${r}</div>` : x}
              `;
		})}
      </section>
    `;
	}
	_renderLights(e) {
		let t = this._lightChoices();
		return v`
      <section class=${this._cardClass("lights")}>
        <h2>💡 Reminder lights ${this._badge("lights")}</h2>
        <p class="muted small">
          Boopli blinks a light itself and puts it back exactly as it was, or
          uses it as an indicator lamp that stays on in a color until you are
          done. Press Test to see what a light really does: lights differ a lot.
        </p>
        ${e.lights.map((e) => {
			let t = this._notes[`light:${e.entity_id}`], n = e.entity_id, r = e.mode === "blink";
			return v`
            <div class="row">
              <div class="grow">
                <div>${this._friendly(n)}</div>
                ${this.hass?.states[n] ? x : v`<div class="muted small">Not found right now</div>`}
              </div>
              <select
                aria-label="Light mode"
                .value=${e.mode}
                @change=${(e) => this._setLightMode(n, e.target.value)}
              >
                ${xa.map((t) => v`<option value=${t.value} ?selected=${t.value === e.mode}>${t.label}</option>`)}
              </select>
              ${ri(this.hass, n) ? v`<input
                    type="color"
                    class="swatch"
                    aria-label="Color"
                    .value=${this._rgbToHex(e.color)}
                    @input=${(e) => this._patchLight(n, { color: this._hexToRgb(e.target.value) })}
                  />` : x}
              <button @click=${() => this._testLight(e)}>Test</button>
              <button aria-label="Remove light" @click=${() => this._removeLight(n)}>✕</button>
            </div>
            <div class="startrow">
              ${this._startAtField(e.start_at ?? 1, (e) => this._patchLight(n, { start_at: e }))}
            </div>
            ${r ? v`
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
                ` : x}
            ${t ? v`<div class="note muted small">${t}</div>` : x}
          `;
		})}
        <div class="row add">
          <select
            aria-label="Add a light"
            .value=${this._addLight}
            @change=${(e) => this._addLight = e.target.value}
          >
            <option value="">Add a light…</option>
            ${t.map((e) => v`<option value=${e} ?selected=${e === this._addLight}>${this._friendly(e)}</option>`)}
          </select>
          <button ?disabled=${!this._addLight} @click=${() => this._addSelectedLight()}>Add</button>
        </div>
      </section>
    `;
	}
	_renderQuiet(e) {
		let t = e.quiet_hours;
		return v`
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
        ${t.enabled ? v`
              ${O.map((e, n) => {
			let r = t.days[String(n)] ?? null;
			return v`
                  <div class="row day">
                    <span class="dayname">${e}</span>
                    <label class="inline small">
                      <input
                        type="checkbox"
                        .checked=${r === null}
                        @change=${(e) => this._setDay(n, e.target.checked ? null : { ...Sa })}
                      />
                      No limit
                    </label>
                    ${r ? v`
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
                        ` : x}
                  </div>
                `;
		})}
              <button class="chip" @click=${() => this._copyMondayToAll()}>Copy Monday to all days</button>
            ` : x}
      </section>
    `;
	}
	_renderPresence(e) {
		return v`
      <section class=${this._cardClass("presence_entity")}>
        <div class="field">
          <label for="presence">Where you are (optional)</label>
          <select
            id="presence"
            .value=${e.presence_entity}
            @change=${(e) => this._set({ presence_entity: e.target.value })}
          >
            <option value="" ?selected=${e.presence_entity === ""}>None (assume I am home)</option>
            ${this._persons().map((t) => v`<option value=${t} ?selected=${t === e.presence_entity}>${this._friendly(t)}</option>`)}
          </select>
          <div class="muted small">
            At home Boopli uses everything above. Away, it only uses your phone,
            and only for chores marked "anywhere".
            ${this.snapshot ? this.snapshot.is_home ? "Right now: home." : "Right now: away." : x}
          </div>
        </div>
      </section>
    `;
	}
	_renderPet(e) {
		return v`
      <section class=${this._cardClass("pet_name", "pet_kind")}>
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
          <label>Your pet</label>
          <boopli-pet-picker
            moods
            .value=${e.pet_kind ?? "slime"}
            @pet-kind-change=${(e) => this._set({ pet_kind: e.detail })}
          ></boopli-pet-picker>
          <boopli-pet-preview .kind=${e.pet_kind ?? "slime"}></boopli-pet-preview>
        </div>
      </section>
    `;
	}
	_renderTiming(e) {
		return v`
      <section class=${this._cardClass("snooze_minutes", "question_wait_minutes", "check_in_minutes")}>
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
          <label for="qwait">How long the first nudge waits for your answers (minutes)</label>
          <input
            id="qwait"
            type="number"
            min="5"
            max="720"
            .value=${String(e.question_wait_minutes ?? 30)}
            @input=${(e) => this._set({ question_wait_minutes: Number(e.target.value) || 30 })}
          />
          <div class="muted small">
            For chores that start by themselves and have questions. They start with all steps; this is how long Boopli
            waits for your answers before it nudges.
          </div>
        </div>
        <div class="field">
          <label for="checkin">After "On it", Boopli asks "still on it?" after (minutes)</label>
          <input
            id="checkin"
            type="number"
            min="5"
            max="720"
            .value=${String(e.check_in_minutes ?? 30)}
            @input=${(e) => this._set({ check_in_minutes: Number(e.target.value) || 30 })}
          />
          <div class="muted small">
            When you press "On it" on a nudge, Boopli stays quiet while you work and checks in once after this time.
          </div>
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
			this._defaults = await Qe(this.hass);
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
				let e = await Ge(this.hass, "Make a cup of tea", "now", []);
				this._aiNote = `It works. The agent split "Make a cup of tea" into ${e.steps.length} steps, starting with: ${e.steps[0]?.title ?? "(none)"}`;
			} catch (e) {
				this._aiNote = T(e);
			}
		}
	}
	_renderAi(e) {
		let t = Z(this.hass, ["ai_task"]), n = e.ai, r = this._defaults, i = this._changed("ai"), a = (e, t) => v`
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
		return v`
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
            ${t.map((e) => v`<option value=${e} .selected=${e === n.entity_id}>${X(this.hass, e)}</option>`)}
            ${n.entity_id && !t.includes(n.entity_id) ? v`<option value=${n.entity_id} selected>${n.entity_id} (not found)</option>` : x}
          </select>
          ${t.length === 0 ? v`<div class="muted small">No AI Task agent found in Home Assistant yet. Add one under Settings, Devices and services.</div>` : x}
        </div>
        <div class="row">
          <button type="button" ?disabled=${i || !n.enabled} @click=${() => this._testAi()}>Test the agent</button>
          ${i ? v`<span class="muted small">Save first to test.</span>` : x}
        </div>
        ${this._aiNote ? v`<div class="note muted small">${this._aiNote}</div>` : x}
        <details @toggle=${(e) => e.target.open && this._loadDefaults()}>
          <summary class="muted small">Advanced: agent for photos, and the prompts Boopli sends</summary>
          <div class="field">
            <label for="ai-photo-agent">Agent for room photos</label>
            <select
              id="ai-photo-agent"
              @change=${(e) => this._setAi({ photo_entity_id: e.target.value })}
            >
              <option value="" .selected=${(n.photo_entity_id ?? "") === ""}>The same agent as above</option>
              ${t.map((e) => v`<option value=${e} .selected=${e === n.photo_entity_id}>${X(this.hass, e)}</option>`)}
              ${n.photo_entity_id && !t.includes(n.photo_entity_id) ? v`<option value=${n.photo_entity_id} selected>${n.photo_entity_id} (not found)</option>` : x}
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
	_summary(e, t) {
		let n = (e) => X(this.hass, e);
		switch (e) {
			case "phone": return t.phones.length ? t.phones.map((e) => `${Q(e.service)}: ${ti[e.level] ?? e.level}, from nudge ${e.start_at}`) : ["No phone set up yet."];
			case "lights": return t.lights.length ? t.lights.map((e) => `${n(e.entity_id)}: ${ci(e)}`) : ["No reminder lights yet."];
			case "speakers": return t.speakers.length ? t.speakers.map((e) => `${n(e.entity_id)}: ${si(e)}`) : ["No speakers yet."];
			case "alarms": return t.alarm_devices.length ? t.alarm_devices.map((e) => `${n(e.entity_id)}: on for ${e.seconds} s, from nudge ${e.start_at}`) : ["No alarm devices yet."];
			case "quiet": return [oi(t.quiet_hours)];
			case "timing": return [
				`Snooze ${t.snooze_minutes} minutes`,
				`"Still on it?" after ${t.check_in_minutes ?? 30} minutes`,
				`First nudge waits ${t.question_wait_minutes ?? 30} minutes for your answers`
			];
			case "ladders": {
				let e = t.ladders ?? [];
				return [
					`New chores: ${ai(t.default_style, e)}`,
					...e.map((e) => `${e.name}: ${e.rungs.length} ${e.rungs.length === 1 ? "nudge" : "nudges"}`),
					...e.length ? [] : ["No ladders of your own yet."]
				];
			}
			case "presence": return [t.presence_entity ? n(t.presence_entity) : "Not set. Boopli assumes you are home."];
			case "pet": return [`${t.pet_name} the ${br(t.pet_kind).label.toLowerCase()}`];
			case "ai": return [t.ai?.enabled ? `On, using ${t.ai.entity_id ? n(t.ai.entity_id) : "the Home Assistant default agent"}` : "Off. Splits big tasks into tiny steps with your own AI agent."];
		}
	}
	_card(e, t) {
		let n = _a[e], r = this._changed(...n.keys);
		return v`<section id="card-${e}" class="card area ${r ? "changed" : ""} ${this._flash === e ? "flash" : ""}">
      <h3 tabindex="-1">
        <span class="emoji" aria-hidden="true">${n.emoji}</span> ${n.title}
        ${r ? v`<span class="unsaved-badge">Unsaved</span>` : x}
      </h3>
      <div class="summary">
        ${this._summary(e, t).map((e) => v`<div class=${e.startsWith("No ") || e.startsWith("Not ") || e.startsWith("Off") ? "muted" : ""}>${e}</div>`)}
      </div>
      <div class="buttons">
        <button type="button" class="primary" aria-label="Guide me: ${n.title}" @click=${() => this._openWizard(n.wizard)}>Guide me</button>
        <button type="button" aria-label="Advanced: ${n.title}" ?disabled=${this._busy} @click=${() => this._openArea(e)}>Advanced</button>
      </div>
    </section>`;
	}
	_openArea(e) {
		this._busy || (this._modalBase = this._draft ? structuredClone(this._draft) : void 0, this._error = "", this._message = "", this._modal = e);
	}
	_keep() {
		this._busy || (this._modal = "");
	}
	_discardClose() {
		this._modalBase && (this._draft = structuredClone(this._modalBase)), this._error = "", this._modal = "";
	}
	async _saveClose() {
		let e = this._modal;
		await this.save() && this._modal === e && (this._modal = "");
	}
	_areaContent(e, t) {
		let n = (e) => this._set(e.detail);
		switch (e) {
			case "phone": return this._renderPhones(t);
			case "lights": return this._renderLights(t);
			case "speakers": return v`<boopli-speakers plain show="speakers" .hass=${this.hass} .settings=${t} @settings-patch=${n}></boopli-speakers>`;
			case "alarms": return v`<boopli-speakers plain show="devices" .hass=${this.hass} .settings=${t} @settings-patch=${n}></boopli-speakers>`;
			case "quiet": return this._renderQuiet(t);
			case "timing": return this._renderTiming(t);
			case "ladders": return v`<boopli-ladders
          plain
          .hass=${this.hass}
          .settings=${t}
          .snapshot=${this.snapshot}
          @settings-patch=${n}
        ></boopli-ladders>`;
			case "presence": return this._renderPresence(t);
			case "pet": return this._renderPet(t);
			case "ai": return this._renderAi(t);
		}
	}
	_renderModal(e) {
		let t = this._modal ? _a[this._modal] : null;
		return v`<dialog
      aria-labelledby="win-title"
      @cancel=${(e) => {
			e.preventDefault(), this._keep();
		}}
      @click=${(e) => {
			e.target === e.currentTarget && this._keep();
		}}
    >
      ${t && this._modal ? v`<div class="win">
            <div class="win-head">
              <h2 id="win-title"><span aria-hidden="true">${t.emoji}</span> ${t.title}</h2>
              <button type="button" class="close" aria-label="Keep for later and close" ?disabled=${this._busy} @click=${() => this._keep()}>✕</button>
            </div>
            <div class="win-body plain">${this._areaContent(this._modal, e)}</div>
            ${this._error ? v`<div class="error" role="alert">${this._error}</div>` : x}
            <div class="win-foot">
              <button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._saveClose()}>Save and close</button>
              <button type="button" class="danger" ?disabled=${this._busy} @click=${() => this._discardClose()}>Discard and close</button>
              <button type="button" ?disabled=${this._busy} @click=${() => this._keep()}>Keep for later</button>
              <p class="muted small hint-line">
                "Keep for later" closes this window and keeps your changes. The card shows an orange "Unsaved" tag.
              </p>
            </div>
          </div>` : x}
    </dialog>`;
	}
	_show(e) {
		this._flash = e;
		let t = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, n = this.renderRoot.querySelector(`#card-${e}`);
		n?.querySelector("h3")?.focus({ preventScroll: !0 }), n?.scrollIntoView({
			block: "center",
			behavior: t ? "auto" : "smooth"
		}), window.clearTimeout(this._flashTimer), this._flashTimer = window.setTimeout(() => this._flash = "", 2600);
	}
	_renderSaveBar() {
		if (!this._isDirty()) return x;
		let e = ya.filter((e) => this._changed(..._a[e].keys));
		return v`${this._error && !this._modal ? v`<div class="error" role="alert">${this._error}</div>` : x}
      <div class="savebar" role="status">
        <div class="where">
          <b aria-hidden="true">●</b> Unsaved changes in:
          ${e.map((e) => v`<button type="button" class="chip where-chip" @click=${() => this._show(e)}>${_a[e].title}</button>`)}
        </div>
        <span class="spacer"></span>
        <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
        <button ?disabled=${this._busy} @click=${() => this.discard()}>Discard all</button>
      </div>`;
	}
	render() {
		let e = this._draft;
		return e ? v`
      <div class="toolbar"><h2 class="page-title">Settings</h2></div>
      <section class="card away-card ${this.snapshot?.away?.active ? "on" : ""}">
        <boopli-away .hass=${this.hass} .snapshot=${this.snapshot}></boopli-away>
      </section>
      ${va.map((t) => v`<h2 class="group">${t.title}</h2>
          <div class="cards">${t.areas.map((t) => this._card(t, e))}</div>`)}
      <p class="muted small">
        Want to do all of it again from the start?
        <button type="button" class="chip" @click=${() => this._openWizard("first")}>Run the first setup again</button>
      </p>
      ${this._renderModal(e)} ${this._renderSaveBar()}
    ` : v`<p class="muted">Loading…</p>`;
	}
	static {
		this.styles = [E, o`
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
        margin-bottom: 14px;
      }
      .page-title {
        font-size: 22px;
        margin: 0;
      }
      h2.group {
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
        margin: 26px 0 10px;
      }
      section.card.away-card {
        margin: 0 0 6px;
        padding-top: 8px;
        padding-bottom: 8px;
      }
      section.card.away-card.on {
        border: 2px solid var(--warning-color, #ffa600);
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
        gap: 16px;
        align-items: stretch;
      }
      section.card.area {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 150px;
      }
      section.card.area h3 {
        margin: 0;
        font-size: 18px;
      }
      .emoji {
        display: inline-block;
        margin-right: 6px;
        font-size: 22px;
        vertical-align: -2px;
      }
      .summary {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
        font-size: 15px;
        overflow-wrap: anywhere;
      }
      .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      /* The card with unsaved changes, and the one the bar points to. */
      section.card.area.flash {
        outline: 3px solid var(--warning-color, #ffa600);
        outline-offset: 2px;
        animation: look-here 0.7s ease-in-out 3;
      }
      @keyframes look-here {
        50% {
          transform: scale(1.025);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        section.card.area.flash {
          animation: none;
        }
      }

      /* The advanced window. */
      dialog {
        border: 0;
        padding: 0;
        border-radius: 16px;
        color: var(--primary-text-color);
        background: var(--card-background-color, var(--primary-background-color));
        width: min(760px, calc(100vw - 24px));
        max-width: none;
        max-height: calc(100vh - 24px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
      }
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.6);
      }
      .win {
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - 24px);
      }
      .win-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--divider-color);
      }
      .win-head h2 {
        margin: 0;
        font-size: 20px;
      }
      .close {
        padding: 4px 10px;
        min-height: 36px;
      }
      .win-body {
        padding: 14px 18px;
        overflow-y: auto;
        flex: 1;
      }
      .win > .error {
        margin: 0;
        padding: 8px 18px 0;
      }
      .win-foot {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        padding: 12px 18px 14px;
        border-top: 1px solid var(--divider-color);
      }
      .hint-line {
        flex: 1 1 100%;
        margin: 2px 0 0;
      }
      /* Inside the window the cards lose their frame and heading: the window has its own. */
      .plain section.card {
        border: 0;
        box-shadow: none;
        background: none;
        padding: 0;
        margin: 0;
      }
      .plain section.card > h2 {
        display: none;
      }
      @media (max-width: 600px) {
        dialog {
          width: 100vw;
          max-width: 100vw;
          height: 100vh;
          height: 100dvh;
          max-height: 100vh;
          max-height: 100dvh;
          border-radius: 0;
        }
        .win {
          height: 100vh;
          height: 100dvh;
          max-height: 100vh;
          max-height: 100dvh;
        }
        /* Save on its own line, the other two side by side; the hint goes (the orange tag says it). */
        .win-foot button.primary {
          flex: 1 1 100%;
        }
        .win-foot button:not(.primary) {
          flex: 1 1 calc(50% - 4px);
        }
        .hint-line {
          display: none;
        }
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
      .savebar {
        flex-wrap: wrap;
      }
      .savebar b {
        color: var(--warning-color, #ffa600);
      }
      .where {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 8px;
        flex: 1 1 260px;
      }
      .where-chip {
        border-color: var(--warning-color, #ffa600);
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
    `];
	}
};
customElements.define("boopli-settings", Ca);
// src/boopli-home.ts
var wa = 2e3;
function Ta() {
	return `r${Math.random().toString(36).slice(2, 10)}`;
}
var Ea = class extends w {
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
		super(), this._justSaved = !1, this._lastDirty = !1, this._synced = !1, this._run = 0, this._promptAsk = 0, this._newName = "", this._showHidden = !1, this._iv = null, this._tool = null, this._busy = !1, this._error = "", this._message = "";
	}
	willUpdate() {
		let e = this.snapshot?.home;
		e && (!this._draft || !this._base ? (this._base = structuredClone(e), this._draft = structuredClone(e)) : this._justSaved && JSON.stringify(e) !== JSON.stringify(this._base) && (this._base = structuredClone(e), this._draft = structuredClone(e), this._justSaved = !1));
	}
	updated() {
		!this._synced && this.hass && (this._synced = !0, Ye(this.hass).then((e) => {
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
			return await Je(this.hass, this._draft), this._justSaved = !0, this._base = structuredClone(this._draft), this._message = "Saved.", !0;
		} catch (e) {
			return this._error = T(e), !1;
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
				id: Ta(),
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
		let n = Math.max(0, 4 - t.photos.length);
		this._error = "";
		let r = t.roomId;
		this._patchTool({ working: !0 });
		try {
			let t = [];
			for (let r of Array.from(e).slice(0, n)) t.push(await ji(r));
			let i = this._tool;
			if (i?.kind !== "photos" || i.roomId !== r) return;
			this._patchTool({ photos: [...i.photos, ...t] }), e.length > n && (this._error = "Up to 4 photos per room. The rest were left out.");
		} catch (e) {
			this._error = T(e);
		}
		let i = this._tool;
		i?.kind === "photos" && i.roomId === r && this._patchTool({ working: !1 });
	}
	async _sendPhotos() {
		let e = this._tool, t = e?.kind === "photos" ? this._room(e.roomId) : void 0;
		if (!this.hass || e?.kind !== "photos" || !t || !e.photos.length) return;
		this._error = "";
		let n = ++this._run;
		this._patchTool({
			working: !0,
			sending: !0
		});
		try {
			let r = await gt(this.hass, t.name, t.notes, e.photos);
			if (n !== this._run) return;
			this._review(t.id, "photos", r.notes);
		} catch (e) {
			if (n !== this._run) return;
			this._error = T(e), this._patchTool({
				working: !1,
				sending: !1
			});
		}
	}
	_stopWaiting() {
		this._run++, this._tool?.kind === "photos" ? (this._patchTool({
			working: !1,
			sending: !1
		}), this._error = "You stopped waiting. Your photos are still here, so you can try again.") : (this._iv = null, this._error = "You stopped waiting. Nothing was changed, so you can try again.");
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
		let t = e.roomId ? this._room(e.roomId) : void 0, n = ++this._promptAsk;
		try {
			let r = await _t(this.hass, e.include, t?.name ?? "", t?.notes ?? "", t ? void 0 : this._liveRooms().map((e) => ({
				name: e.name,
				notes: e.notes
			})));
			if (n !== this._promptAsk) return;
			this._patchTool({
				prompt: r,
				copied: !1
			});
		} catch (e) {
			n === this._promptAsk && (this._error = T(e));
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
					let t = await vt(this.hass, e.pasted);
					this._review(e.roomId, "paste", t.notes);
				} else {
					let t = await yt(this.hass, e.pasted, this._liveRooms().map((e) => ({
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
				this._error = T(e), this._patchTool({ working: !1 });
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
			let e = r.notes.trim().slice(0, wa);
			r.on && e && (n += 1, r.id && t.some((e) => e.id === r.id) ? t = t.map((t) => t.id === r.id ? {
				...t,
				notes: e
			} : t) : t.push({
				id: Ta(),
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
		if (!this.hass || !t || !n) return;
		this._iv = {
			...t,
			phase: "working",
			answers: e
		};
		let r = ++this._run;
		try {
			let i = await Xe(this.hass, n.name, n.notes, e);
			if (r !== this._run) return;
			if (i.enough || i.questions.length === 0) {
				await this._writeNotes(e);
				return;
			}
			this._iv = {
				...t,
				answers: e,
				phase: "questions",
				questions: i.questions,
				picked: i.questions.map(() => []),
				typed: i.questions.map(() => ""),
				extra: "",
				round: t.round + 1
			};
		} catch (e) {
			if (r !== this._run) return;
			this._error = T(e), this._iv = null;
		}
	}
	async _writeNotes(e) {
		let t = this._iv, n = t && this._room(t.roomId);
		if (!this.hass || !t || !n) return;
		this._iv = {
			...t,
			phase: "working",
			answers: e
		};
		let r = ++this._run;
		try {
			let i = await Ze(this.hass, n.name, n.notes, e);
			if (r !== this._run) return;
			this._iv = {
				...t,
				answers: e,
				phase: "review",
				result: i.notes
			};
		} catch (e) {
			if (r !== this._run) return;
			this._error = T(e), this._iv = null;
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
		e && (this._patchRoom(e.roomId, { notes: e.result.trim().slice(0, wa) }), this._iv = null);
	}
	_renderQuestion(e, t, n) {
		let r = n.picked[t] ?? [];
		return v`<div class="question">
      <div class="qtext">${e.text}</div>
      <div class="chips">
        ${e.options.map((n) => {
			let i = r.includes(n);
			return v`<button
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
		return v`<section class="card interview">
      <div class="top">
        <h2>${t?.name ?? "Room"}: let me ask</h2>
        <button type="button" class="link" @click=${() => (this._run += 1, this._iv = null)}>Cancel</button>
      </div>
      ${e.phase === "working" ? v`<boopli-wait
            .label=${e.answers.length ? "Writing the notes…" : "Thinking…"}
            .pet=${this.snapshot?.settings?.pet_kind ?? "slime"}
            .max=${this.snapshot?.ai_timeout ?? 180}
            @stop-waiting=${() => this._stopWaiting()}
          ></boopli-wait>` : x}
      ${e.phase === "questions" ? v`
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
          ` : x}
      ${e.phase === "review" ? v`
            <p>
              ${e.source === "paste" ? "This is what I read from what you pasted." : e.source === "photos" ? "This is what the AI saw in your photos. The photos are already gone." : "This is what I would write down."}
              Change anything that is wrong.
              ${t?.notes ? v`<b>It replaces the notes you have now.</b>` : x}
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
              ${e.source !== "paste" && this._aiOn() ? v`<button class="big" @click=${() => this._askQuestions(e.answers)}>Ask me more</button>` : x}
              <button class="big" @click=${() => this._iv = null}>Throw away</button>
            </div>
          ` : x}
    </section>`;
	}
	_renderTool(e) {
		return e.kind === "photos" ? this._renderPhotos(e) : e.kind === "chat" ? this._renderChat(e) : this._renderFlat(e);
	}
	_renderPhotos(e) {
		let t = this._room(e.roomId), n = e.photos.length >= 4;
		return v`<section class="card interview">
      <div class="top">
        <h2>${t?.name ?? "Room"}: describe it from photos</h2>
        <button type="button" class="link" ?disabled=${e.sending} @click=${() => this._tool = null}>Cancel</button>
      </div>
      <p class="muted">
        Take or pick up to ${4} photos of this room. They go once to your AI agent, which writes down what it
        sees. Boopli does not keep them: they are not saved anywhere, and later requests carry only the notes.
      </p>
      ${this._error ? v`<div class="error">${this._error}</div>` : x}
      ${e.sending ? v`<boopli-wait
            .label=${"The AI is looking at your photos…"}
            .pet=${this.snapshot?.settings?.pet_kind ?? "slime"}
            .max=${this.snapshot?.ai_timeout ?? 180}
            @stop-waiting=${() => this._stopWaiting()}
          ></boopli-wait>` : v`
            <div class="thumbs">
              ${e.photos.map((t, n) => v`<div class="thumb">
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
		return v`<section class="card interview">
      <div class="top">
        <h2>${n ? "My whole home" : t?.name ?? "Room"}: talk it out in your own AI chat</h2>
        <button type="button" class="link" @click=${() => this._tool = null}>Cancel</button>
      </div>
      <p class="muted">
        Use any chat you like, for example one you can talk to by voice. Boopli sends nothing: you copy and paste
        yourself, so this works even with AI help switched off.
      </p>
      ${this._error ? v`<div class="error">${this._error}</div>` : x}
      <ol class="stepslist">
        <li>
          <b>Copy this</b> and paste it into your chat.
          ${this._hasNotes(e.roomId) ? v`<label class="inline">
                <input
                  type="checkbox"
                  .checked=${e.include}
                  @change=${(e) => {
			this._patchTool({
				include: e.target.checked,
				prompt: ""
			}), this._loadPrompt();
		}}
                />
                Include what I have written so far
              </label>` : x}
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
		return v`<section class="card interview">
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
			return v`<div class="question">
          <label class="inline qtext">
            <input type="checkbox" .checked=${e.on} @change=${(e) => this._patchFlat(t, { on: e.target.checked })} />
            ${e.name}
            <span class="tag">${e.id ? "your room" : "new room"}</span>
          </label>
          ${n?.notes.trim() ? v`<div class="muted small">It replaces the notes this room has now.</div>` : x}
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
		return v`<section class="card room ${this._roomChanged(e.id) ? "changed" : ""}">
      <div class="head">
        <input
          class="name"
          aria-label="Room name"
          .value=${e.name}
          @input=${(t) => this._patchRoom(e.id, { name: t.target.value })}
        />
        ${this._roomChanged(e.id) ? v`<span class="unsaved-badge">Unsaved</span>` : x}
      </div>
      ${e.area_id ? v`<div class="muted small">From your Home Assistant areas</div>` : v`<div class="muted small">Added by you</div>`}
      <label for="n-${e.id}">What should the AI know about this room?</label>
      <textarea
        id="n-${e.id}"
        class="notes"
        rows="5"
        maxlength=${wa}
        placeholder="For example: Dishwasher is under the counter. The balcony door sticks."
        .value=${e.notes}
        @input=${(t) => this._patchRoom(e.id, { notes: t.target.value })}
      ></textarea>
      <div class="row-actions">
        ${t ? v`<button type="button" ?disabled=${!e.name.trim() || this._busy} @click=${() => this._startInterview(e)}>
                ✨ Let the AI ask me
              </button>
              <button type="button" ?disabled=${!e.name.trim() || this._busy} @click=${() => this._openPhotos(e)}>
                📷 From photos
              </button>` : x}
        <button type="button" ?disabled=${!e.name.trim() || this._busy} @click=${() => this._openChat(e)}>
          💬 In my own chat
        </button>
        <span class="spacer"></span>
        <button type="button" class="link" @click=${() => this._removeRoom(e)}>${e.area_id ? "Hide" : "Delete"}</button>
      </div>
    </section>`;
	}
	_renderSaveBar() {
		return this._isDirty() ? v`<div class="savebar" role="status">
      <span><b>●</b> You have unsaved changes</span>
      <span class="spacer"></span>
      <button class="primary" ?disabled=${this._busy} @click=${() => this.save()}>Save</button>
      <button ?disabled=${this._busy} @click=${() => this.discard()}>Discard</button>
    </div>` : x;
	}
	render() {
		let e = this._draft;
		if (!e) return v`<p class="muted">Loading…</p>`;
		if (this._iv) return v`${this._renderInterview(this._iv)}${this._renderSaveBar()}`;
		if (this._tool) return v`${this._renderTool(this._tool)}${this._renderSaveBar()}`;
		let t = e.rooms.filter((e) => !e.hidden), n = e.rooms.filter((e) => e.hidden);
		return v`
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
      ${this._aiOn() ? x : v`<p class="muted small">
            AI help is off, so the notes are not used yet. Turn it on in Settings. Until then you can still write the
            notes yourself.
          </p>`}
      <div class="whole">
        <button type="button" @click=${() => this._openChat(null)}>💬 Talk through my whole home in my own chat</button>
        <span class="muted small">Copy a prompt, talk it out by voice or text, paste the result back.</span>
      </div>
      ${this._error ? v`<div class="error">${this._error}</div>` : x}
      ${this._message ? v`<div class="ok">${this._message}</div>` : x}
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
      ${n.length ? v`<details class="hiddenrooms" ?open=${this._showHidden} @toggle=${(e) => this._showHidden = e.target.open}>
            <summary>${n.length} hidden ${n.length === 1 ? "room" : "rooms"}</summary>
            ${n.map((e) => v`<div class="hiddenrow">
                <span>${e.name}</span>
                <button type="button" @click=${() => this._patchRoom(e.id, { hidden: !1 })}>Show again</button>
              </div>`)}
          </details>` : x}
      ${this._renderSaveBar()}
    `;
	}
	static {
		this.styles = [E, o`
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
        grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
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
customElements.define("boopli-home", Ea);
// src/diff.ts
function Da(e, t, n) {
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
function Oa(e, t, n, r) {
	let i = [];
	return t.enabled !== n.enabled && i.push(`${e} ${n.enabled ? "on" : "off"}`), n.enabled && (t.sound !== n.sound && i.push(`${e} sound ${t.sound} → ${n.sound}`), t.start_at !== n.start_at && i.push(`${e} starts at nudge ${t.start_at} → ${n.start_at}`), r && t.seconds !== n.seconds && i.push(`${e} lasts ${t.seconds} → ${n.seconds} s`), r && t.repeat_s !== n.repeat_s && i.push(`${e} repeats every ${t.repeat_s} → ${n.repeat_s} s`)), i;
}
function ka(e, t) {
	let n = [...Oa("ding", e.cue, t.cue, !1), ...Oa("alarm", e.alarm, t.alarm, !0)];
	return e.speech.enabled !== t.speech.enabled && n.push(`speech ${t.speech.enabled ? "on" : "off"}`), t.speech.enabled && ((e.speech.target !== t.speech.target || e.speech.route !== t.speech.route) && n.push(`speech goes to ${t.speech.target || "nothing"}`), e.speech.start_at !== t.speech.start_at && n.push(`speech starts at nudge ${e.speech.start_at} → ${t.speech.start_at}`)), n;
}
function Aa(e, t, n) {
	let r = (e) => X(n, e), i = [];
	e.pet_name !== t.pet_name && i.push(`Pet name: ${e.pet_name} → ${t.pet_name}`), (e.pet_kind ?? "slime") !== (t.pet_kind ?? "slime") && i.push(`Pet: ${e.pet_kind ?? "slime"} → ${t.pet_kind ?? "slime"}`);
	let a = Da(e.phones, t.phones, (e) => e.service);
	a.added.forEach((e) => i.push(`Phone added: ${Q(e.service)} (${ti[e.level] ?? e.level})`)), a.removed.forEach((e) => i.push(`Phone removed: ${Q(e.service)}`)), a.kept.forEach(({ before: e, after: t }) => {
		e.level !== t.level && i.push(`${Q(t.service)}: level ${ti[e.level]} → ${ti[t.level]}`), e.start_at !== t.start_at && i.push(`${Q(t.service)}: starts at nudge ${e.start_at} → ${t.start_at}`);
	});
	let o = e.quiet_hours, s = t.quiet_hours;
	if (o.enabled !== s.enabled && i.push(`Quiet hours: ${o.enabled ? "on" : "off"} → ${s.enabled ? "on" : "off"}`), s.enabled) {
		let e = (e, t) => {
			let n = e.days[String(t)] ?? null;
			return n ? `${n.start} to ${n.stop}` : "no limit";
		};
		O.forEach((t, n) => {
			let r = o.enabled ? e(o, n) : "any time", a = e(s, n);
			r !== a && i.push(`${t}: ${r} → ${a}`);
		});
	}
	e.snooze_minutes !== t.snooze_minutes && i.push(`Snooze: ${e.snooze_minutes} → ${t.snooze_minutes} min`), (e.question_wait_minutes ?? 30) !== (t.question_wait_minutes ?? 30) && i.push(`Wait for your answers: ${e.question_wait_minutes ?? 30} → ${t.question_wait_minutes ?? 30} min`), (e.check_in_minutes ?? 30) !== (t.check_in_minutes ?? 30) && i.push(`Check-in after "On it": ${e.check_in_minutes ?? 30} → ${t.check_in_minutes ?? 30} min`), e.default_style !== t.default_style && i.push(`Default style: ${ai(e.default_style, e.ladders)} → ${ai(t.default_style, t.ladders)}`);
	for (let n of t.speakers) {
		let t = e.speakers.find((e) => e.entity_id === n.entity_id), a = new Map((t?.sounds ?? []).map((e) => [e.id, e.name])), o = new Map((n.sounds ?? []).map((e) => [e.id, e.name]));
		for (let [e, t] of o) a.has(e) || i.push(`${r(n.entity_id)}: sound added (${t})`);
		for (let [e, t] of a) o.has(e) || i.push(`${r(n.entity_id)}: sound removed (${t})`);
		for (let e of n.sounds ?? []) {
			let a = (t?.sounds ?? []).find((t) => t.id === e.id);
			a && (a.name !== e.name || a.kind !== e.kind || a.sound !== e.sound) && i.push(`${r(n.entity_id)}: sound changed (${e.name})`);
		}
	}
	let c = Da(e.ladders ?? [], t.ladders ?? [], (e) => e.id);
	c.added.forEach((e) => i.push(`Nudge ladder added: ${e.name} (${e.rungs.length} nudges)`)), c.removed.forEach((e) => i.push(`Nudge ladder removed: ${e.name}`)), c.kept.forEach(({ before: e, after: t }) => {
		e.name !== t.name && i.push(`Nudge ladder renamed: ${e.name} → ${t.name}`), JSON.stringify({
			r: e.rungs,
			x: e.repeat_last
		}) !== JSON.stringify({
			r: t.rungs,
			x: t.repeat_last
		}) && i.push(`Nudge ladder changed: ${t.name}`);
	});
	let l = Da(e.lights, t.lights, (e) => e.entity_id);
	l.added.forEach((e) => i.push(`Reminder light added: ${r(e.entity_id)} (${ci(e)})`)), l.removed.forEach((e) => i.push(`Reminder light removed: ${r(e.entity_id)}`)), l.kept.forEach(({ before: e, after: t }) => {
		let n = r(t.entity_id);
		e.mode !== t.mode && i.push(`${n}: ${ci(e)} → ${ci(t)}`), e.color.join() !== t.color.join() && i.push(`${n}: color changed`), e.blink_ms !== t.blink_ms && i.push(`${n}: blink length ${e.blink_ms} → ${t.blink_ms} ms`), e.repeats !== t.repeats && i.push(`${n}: blinks ${e.repeats} → ${t.repeats}`), e.gap_ms !== t.gap_ms && i.push(`${n}: pause ${e.gap_ms} → ${t.gap_ms} ms`), e.start_at !== t.start_at && i.push(`${n}: starts at nudge ${e.start_at} → ${t.start_at}`);
	});
	let u = Da(e.speakers, t.speakers, (e) => e.entity_id);
	u.added.forEach((e) => i.push(`Speaker added: ${r(e.entity_id)}`)), u.removed.forEach((e) => i.push(`Speaker removed: ${r(e.entity_id)}`)), u.kept.forEach(({ before: e, after: t }) => ka(e, t).forEach((e) => i.push(`${r(t.entity_id)}: ${e}`))), e.speech_template !== t.speech_template && i.push(`Spoken sentence: ${e.speech_template} → ${t.speech_template}`);
	let d = Da(e.alarm_devices, t.alarm_devices, (e) => e.entity_id);
	if (d.added.forEach((e) => i.push(`Alarm device added: ${r(e.entity_id)}`)), d.removed.forEach((e) => i.push(`Alarm device removed: ${r(e.entity_id)}`)), d.kept.forEach(({ before: e, after: t }) => {
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
var ja = {
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
	],
	ladders: ["lad_start", "done"]
}, Ma = [
	"spk_pick",
	"spk_ding",
	"spk_speech",
	"spk_alarm",
	"alarm_devices"
], Na = {
	first: "First setup",
	phone: "Phone setup",
	quiet: "Quiet hours setup",
	lights: "Reminder lights setup",
	speakers: "Speaker setup",
	alarms: "Alarm devices setup",
	presence: "Where you are",
	nudging: "Snooze and style",
	pet: "Your pet",
	ai: "AI help setup",
	ladders: "Nudge it your way"
}, $ = 20, Pa = {
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
	lad_start: "What do you want to do?",
	lad_name: "Name your ladder",
	lad_nudge: "A nudge",
	lad_more: "Another nudge?",
	lad_end: "How it ends",
	lad_delete: "Delete a ladder",
	done: "All set"
}, Fa = [
	"phone_detail",
	"lights_detail",
	"spk_when",
	"alarm_detail"
], Ia = [
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
], La = [
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
], Ra = [
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
], za = [{
	value: "alexa",
	label: "Alexa sound"
}, {
	value: "file",
	label: "File in my media folder"
}], Ba = "https://developer.amazon.com/en-US/docs/alexa/custom-skills/ask-soundlibrary.html", Va = [
	0,
	1,
	2,
	3,
	4,
	5,
	6
], Ha = class extends w {
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
			_addDevice: { state: !0 },
			_ladderId: { state: !0 },
			_ladderName: { state: !0 },
			_ladderAction: { state: !0 },
			_ladderPick: { state: !0 }
		};
	}
	constructor() {
		super(), this._started = !1, this.wizard = "first", this.startAt = "", this._steps = [], this._index = 0, this._busy = !1, this._error = "", this._notes = {}, this._picked = [], this._speaker = "", this._addDevice = "", this._ladderId = "", this._ladderName = "", this._ladderAction = "create", this._ladderPick = "", this._createdId = "";
	}
	get _first() {
		return this.wizard === "first";
	}
	get _step() {
		return this._steps[Math.min(this._index, this._steps.length - 1)] ?? "done";
	}
	willUpdate() {
		if (this._started || !this.snapshot) return;
		this._started = !0, this._saved = structuredClone(this.snapshot.settings), this._baseline = structuredClone(this.snapshot.settings), this._draft = structuredClone(this.snapshot.settings), this._steps = [...ja[this.wizard]];
		let e = this.startAt;
		if (this._first && Ma.includes(e)) {
			let e = this._steps.indexOf("speaker_gate");
			this._steps.splice(e + 1, 0, ...Ma);
		}
		let t = this._steps.indexOf(e);
		this._index = t >= 0 ? t : 0, this._picked = Wi.filter((e) => !this.snapshot.chores.some((t) => t.name === e.draft.name)).map((e) => e.label), this.snapshot.settings.speakers.length === 1 && (this._speaker = this.snapshot.settings.speakers[0].entity_id), this._enter();
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
		return X(this.hass, e);
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
		return v`<label class="num">
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
					this._step === "lad_start" && this._startLadderWork(), this._step === "lad_name" && this._ensureLadder();
					let e = structuredClone(this._draft);
					await Ue(this.hass, e), this._saved = e;
				}
				e === 1 && t === "skip" && (this._draft = structuredClone(this._saved), this._step === "chores" && (this._picked = [])), t === "more" && (this._steps[this._index + 1] !== "lad_nudge" && (this._steps = [
					...this._steps.slice(0, this._index + 1),
					"lad_nudge",
					"lad_more",
					...this._steps.slice(this._index + 1)
				]), this._rungAt(this._nudgesBefore(this._index + 1))), t === "gate" && (this._steps = [
					...this._steps.slice(0, this._index + 1),
					...Ma,
					...this._steps.slice(this._index + 1)
				]);
				let n = Math.max(0, Math.min(this._index + e, this._steps.length - 1));
				this._steps[n] === "lad_nudge" && this._rungAt(this._nudgesBefore(n)), this._first && await tt(this.hass, "in_progress", this._steps[n]), this._index = n, this._enter();
			} catch (e) {
				this._error = T(e);
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
				this._first && await tt(this.hass, "skipped", this._step), this._close();
			} catch (e) {
				this._error = T(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	async _finish() {
		if (this.hass && this._draft && !this._busy) {
			this._busy = !0, this._error = "";
			try {
				if (await Ue(this.hass, this._draft), this._first) {
					for (let e of Wi.filter((e) => this._picked.includes(e.label))) await lt(this.hass, {
						...e.draft,
						repeat: {
							type: "none",
							time: "09:00",
							every_n_days: 1,
							days: {}
						}
					});
					await tt(this.hass, "done", "");
				}
				this._close();
			} catch (e) {
				this._error = T(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_ladder() {
		return this._draft?.ladders?.find((e) => e.id === this._ladderId);
	}
	_nudgesBefore(e) {
		return this._steps.slice(0, e).filter((e) => e === "lad_nudge").length;
	}
	_newRung() {
		return {
			gap: 5,
			phones: Object.fromEntries((this._draft?.phones ?? []).map((e) => [e.service, e.level])),
			lights: {},
			speakers: {},
			alarms: []
		};
	}
	_patchLadder(e) {
		let t = this._draft;
		t && this._set({ ladders: (t.ladders ?? []).map((t) => t.id === this._ladderId ? e(t) : t) });
	}
	_startLadderWork() {
		let e = this._draft?.ladders ?? [];
		if (this._ladderAction === "create") {
			let t = e.find((e) => e.id === this._createdId);
			if (t) {
				this._ladderId = t.id, this._ladderName = t.name, this._steps = [
					"lad_start",
					"lad_name",
					...t.rungs.map(() => "lad_nudge"),
					"lad_more",
					"lad_end",
					"done"
				];
				return;
			}
			if (e.length >= $) throw Error(`You have ${$} ladders, the most. Edit or delete one.`);
			this._ladderId = "", this._ladderName = "", this._steps = [
				"lad_start",
				"lad_name",
				"lad_nudge",
				"lad_more",
				"lad_end",
				"done"
			];
			return;
		}
		let t = this._ladderPick || (e.length === 1 ? e[0].id : ""), n = e.find((e) => e.id === t);
		if (!n) throw Error("Pick a ladder first.");
		this._ladderPick = n.id, this._ladderId = n.id, this._ladderName = n.name, this._steps = this._ladderAction === "edit" ? [
			"lad_start",
			"lad_name",
			...n.rungs.map(() => "lad_nudge"),
			"lad_more",
			"lad_end",
			"done"
		] : [
			"lad_start",
			"lad_delete",
			"done"
		];
	}
	_removeNudge(e) {
		let t = this._ladder();
		!t || t.rungs.length < 2 || (this._patchLadder((t) => ({
			...t,
			rungs: t.rungs.filter((t, n) => n !== e)
		})), this._steps = this._steps.filter((e, t) => t !== this._index), this._index = Math.min(this._index, this._steps.length - 1));
	}
	async _deleteLadder() {
		let e = this._ladder(), t = this._draft;
		if (!e || !t) return;
		let n = `ladder:${e.id}`, r = (this.snapshot?.chores ?? []).filter((e) => e.nudge_style === n).map((e) => e.name).sort();
		if (r.length) {
			this._error = `"${e.name}" is used by ${r.join(", ")}. Pick another nudge style for them first.`;
			return;
		}
		if (t.default_style === n) {
			this._error = `"${e.name}" is the style for new chores. Choose another one for new chores first.`;
			return;
		}
		let i = t;
		this._set({ ladders: (t.ladders ?? []).filter((t) => t.id !== e.id) }), await this._go(1), this._error && (this._draft = i);
	}
	_ensureLadder() {
		let e = this._draft;
		if (!e) return;
		let t = this._ladderName.trim();
		if (!t) throw Error("Give the ladder a name.");
		if (this._ladder()) {
			this._patchLadder((e) => ({
				...e,
				name: t
			}));
			return;
		}
		if ((e.ladders ?? []).length >= $) throw Error(`You have ${$} ladders, the most. Edit or delete one.`);
		let n = ii();
		this._ladderId = n, this._createdId = n, this._set({ ladders: [...e.ladders ?? [], {
			id: n,
			name: t,
			rungs: [this._newRung()],
			repeat_last: !1
		}] });
	}
	_rungAt(e) {
		let t = this._ladder();
		!t || e < t.rungs.length || this._patchLadder((t) => {
			let n = [...t.rungs];
			for (; n.length <= e;) n.push(structuredClone(n[n.length - 1] ?? this._newRung()));
			return {
				...t,
				rungs: n
			};
		});
	}
	_setRung(e, t) {
		this._patchLadder((n) => ({
			...n,
			rungs: n.rungs.map((n, r) => r === e ? t : n)
		}));
	}
	_title(e, t) {
		return e === "lad_nudge" ? `Nudge ${this._nudgesBefore(t) + 1}` : Pa[e];
	}
	_renderLadStart(e) {
		let t = e.ladders ?? [], n = t.length === 0, r = (e, t, n, r = !1) => v`<label class="inline option">
      <input
        type="radio"
        name="ladact"
        .checked=${this._ladderAction === e}
        ?disabled=${r}
        @change=${() => this._ladderAction = e}
      />
      <span><b>${t}</b> <span class="muted small">${n}</span></span>
    </label>`;
		return v`
      ${r("create", "Create a ladder", t.length >= $ ? `You have ${$} ladders, the most.` : "A new list of nudges.", t.length >= $)}
      ${r("edit", "Edit a ladder", n ? "You have no ladders yet." : "Change its name, its nudges or how it ends.", n)}
      ${r("delete", "Delete a ladder", n ? "You have no ladders yet." : "Remove one you do not need any more.", n)}
      ${this._ladderAction !== "create" && !n ? v`<div class="field">
            <label for="ladpick">Which ladder?</label>
            <select id="ladpick" .value=${this._ladderPick} @change=${(e) => this._ladderPick = e.target.value}>
              <option value="" ?selected=${!this._ladderPick}>Pick a ladder…</option>
              ${t.map((e) => v`<option value=${e.id} ?selected=${this._ladderPick === e.id}>
                  ${e.name} (${e.rungs.length} ${e.rungs.length === 1 ? "nudge" : "nudges"})
                </option>`)}
            </select>
          </div>` : x}
    `;
	}
	_renderLadDelete() {
		let e = this._ladder();
		if (!e) return v`<p class="muted">Pick a ladder first.</p>`;
		let t = `ladder:${e.id}`, n = (this.snapshot?.chores ?? []).filter((e) => e.nudge_style === t).map((e) => e.name).sort();
		return v`
      <p>Delete the ladder <b>${e.name}</b>? This cannot be undone.</p>
      ${n.length ? v`<p class="muted">It is used by ${n.join(", ")}. Pick another nudge style for them first, then come back.</p>` : x}
      <div class="gate">
        <button type="button" class="danger big" ?disabled=${this._busy || n.length > 0} @click=${() => this._deleteLadder()}>
          Delete this ladder
        </button>
      </div>
    `;
	}
	_renderLadName() {
		return v`
      <p>
        A ladder is a list of nudges. For each nudge you choose how long Boopli waits, and exactly which devices act
        and how loud. Start by giving it a name.
      </p>
      <div class="field">
        <label for="ladname">Name</label>
        <input
          id="ladname"
          maxlength="40"
          placeholder="For example: Pills"
          .value=${this._ladderName}
          @input=${(e) => this._ladderName = e.target.value}
        />
      </div>
    `;
	}
	_renderLadNudge(e) {
		let t = this._nudgesBefore(this._index), n = this._ladder()?.rungs[t];
		return n ? v`
      <p>
        ${t === 0 ? "The first nudge goes out right away. Which devices should act?" : "How long should Boopli wait for this nudge, and which devices should act?"}
      </p>
      <boopli-rung
        gap
        .hass=${this.hass}
        .settings=${e}
        .rung=${n}
        .index=${t}
        @rung-change=${(e) => this._setRung(t, e.detail)}
      ></boopli-rung>
      ${(this._ladder()?.rungs.length ?? 0) > 1 ? v`<p><button type="button" class="danger" ?disabled=${this._busy} @click=${() => this._removeNudge(t)}>Remove this nudge</button></p>` : x}
    ` : v`<p class="muted">Give the ladder a name first.</p>`;
	}
	_renderLadMore() {
		let e = this._ladder()?.rungs.length ?? 0;
		return v`
      <p>This ladder has ${e} ${e === 1 ? "nudge" : "nudges"} so far. Add another one, or are you done?</p>
      <div class="gate">
        <button type="button" class="primary big" ?disabled=${this._busy || e >= 12} @click=${() => this._go(1, "more")}>
          Add another nudge
        </button>
        <button type="button" class="big" ?disabled=${this._busy} @click=${() => this._go(1)}>That's all</button>
      </div>
      ${e >= 12 ? v`<p class="muted small">12 nudges is the most.</p>` : x}
    `;
	}
	_renderLadEnd(e) {
		let t = this._ladder();
		if (!t) return v`<p class="muted">Give the ladder a name first.</p>`;
		let n = `ladder:${t.id}`;
		return v`
      <p>What should happen after the last nudge?</p>
      <label class="inline option">
        <input type="radio" name="end" .checked=${!t.repeat_last} @change=${() => this._patchLadder((e) => ({
			...e,
			repeat_last: !1
		}))} />
        <span><b>Stop</b> <span class="muted small">No more nudges after the last one.</span></span>
      </label>
      <label class="inline option">
        <input type="radio" name="end" .checked=${t.repeat_last} @change=${() => this._patchLadder((e) => ({
			...e,
			repeat_last: !0
		}))} />
        <span><b>Repeat the last nudge</b> <span class="muted small">Until you answer.</span></span>
      </label>
      ${t.repeat_last && t.rungs.length === 1 ? this._numField("Repeat every (minutes)", t.rungs[0].gap, 1, 720, (e) => this._setRung(0, {
			...t.rungs[0],
			gap: e
		})) : x}
      <p>
        <label class="inline option">
          <input
            type="checkbox"
            .checked=${e.default_style === n}
            @change=${(e) => this._set({ default_style: e.target.checked ? n : this._baseline?.default_style && this._baseline.default_style !== n ? this._baseline.default_style : "escalating" })}
          />
          <span><b>Use it for new chores</b></span>
        </label>
      </p>
      <p class="muted small">You pick a ladder for a chore in the chore's nudge style.</p>
    `;
	}
	_setQuiet(e) {
		if (!this._draft) return;
		let t = this._draft.quiet_hours.days;
		e && Object.keys(t).length === 0 && (t = Object.fromEntries(Va.map((e) => [String(e), { ...Jr }]))), this._set({ quiet_hours: {
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
			days: Object.fromEntries(Va.map((e) => [String(e), t ? { ...t } : null]))
		} });
	}
	async _try(e, t) {
		this._note(e, "Testing…");
		try {
			this._note(e, (await t()).note);
		} catch (t) {
			this._note(e, T(t));
		}
	}
	_noteLine(e) {
		let t = this._notes[e];
		return t ? v`<div class="muted small note">${t}</div>` : x;
	}
	_renderWelcome(e) {
		return v`
      <p>
        Boopli breaks chores into small steps and nudges you with the lights, speakers and phone
        you already have. A few quick questions, and you can skip any of them. Nothing leaves your
        home, and nothing is sent to a device until you press a Test button.
      </p>
      ${this._renderPet(e)}
    `;
	}
	_renderPet(e) {
		return v`<div class="field">
      <label for="petname">What should your pet be called?</label>
      <input
        id="petname"
        maxlength="30"
        .value=${e.pet_name ?? "Boopli"}
        @input=${(e) => this._set({ pet_name: e.target.value })}
      />
    </div>
    <div class="field">
      <label>Pick your pet</label>
      <boopli-pet-picker
        .value=${e.pet_kind ?? "slime"}
        @pet-kind-change=${(e) => this._set({ pet_kind: e.detail })}
      ></boopli-pet-picker>
    </div>`;
	}
	_renderPhone(e) {
		let t = this._phones();
		return v`
      <p>
        Which phone should get Boopli's notifications? They have <b>Done</b> and <b>Snooze</b>
        buttons, so you can answer without opening anything.
      </p>
      ${t.length === 0 ? v`<p class="muted">
            No phone with the Home Assistant app found. Install the app and sign in, then come back.
            You can skip this for now.
          </p>` : v`<div class="list">
            ${t.map((t) => {
			let n = e.phones.find((e) => e.service === t);
			return v`<div class="choice">
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
                  ${Q(t)}
                </label>
                <button type="button" @click=${() => this._try(`phone:${t}`, () => at(this.hass, {
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
		return e.phones.length === 0 ? v`<p class="muted">No phone is set up yet. Skip this.</p>` : v`
      <p>
        How loud should each phone be, and from which nudge on? Nudge 1 is the first one for a step.
        You can leave the defaults.
      </p>
      <div class="list">
        ${e.phones.map((t) => v`<div class="choice col">
            <b>${Q(t.service)}</b>
            <label class="num">
              Notification level
              <select
                @change=${(n) => this._set({ phones: e.phones.map((e) => e.service === t.service ? {
			...e,
			level: n.target.value
		} : e) })}
              >
                ${La.map((e) => v`<option value=${e.value} .selected=${e.value === t.level}>${e.label}</option>`)}
              </select>
            </label>
            ${this._numField("Starts at nudge #", t.start_at ?? 1, 1, 20, (n) => this._set({ phones: e.phones.map((e) => e.service === t.service ? {
			...e,
			start_at: n
		} : e) }))}
            <button type="button" @click=${() => this._try(`phone:${t.service}`, () => at(this.hass, t))}>Send a test</button>
            ${this._noteLine(`phone:${t.service}`)}
          </div>`)}
      </div>
    `;
	}
	_renderQuiet(e) {
		let t = e.quiet_hours;
		return v`
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
      ${t.enabled ? v`
            <div class="days">
              ${Va.map((e) => {
			let n = t.days[String(e)] ?? null;
			return v`<div class="dayrow">
                  <span class="dayname">${O[e]}</span>
                  <label class="inline small">
                    <input
                      type="checkbox"
                      .checked=${n === null}
                      @change=${(t) => this._setDay(e, t.target.checked ? null : { ...Jr })}
                    />
                    No limit
                  </label>
                  ${n ? v`<span class="muted small">from</span>
                        <input
                          type="time"
                          aria-label="${O[e]} from"
                          .value=${n.start}
                          @input=${(t) => this._setDay(e, {
				...n,
				start: t.target.value
			})}
                        />
                        <span class="muted small">until</span>
                        <input
                          type="time"
                          aria-label="${O[e]} until"
                          .value=${n.stop}
                          @input=${(t) => this._setDay(e, {
				...n,
				stop: t.target.value
			})}
                        />` : x}
                  ${e > 0 ? v`<button type="button" class="chip" @click=${() => this._copyDayAbove(e)}>Same as ${O[e - 1]}</button>` : x}
                </div>`;
		})}
            </div>
            <button type="button" class="chip" @click=${() => this._copyMondayToAll()}>Copy Monday to all days</button>
          ` : x}
    `;
	}
	_renderNudging(e) {
		return v`
      <div class="field">
        <label for="snooze">When you press Snooze, how many minutes until the next nudge?</label>
        <div class="chips">
          ${[
			5,
			10,
			15,
			30
		].map((t) => v`<button type="button" class="chip ${e.snooze_minutes === t ? "on" : ""}" @click=${() => this._set({ snooze_minutes: t })}>${t} min</button>`)}
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
      ${[...Ia, ...(e.ladders ?? []).map((e) => ({
			value: `ladder:${e.id}`,
			label: e.name,
			text: `Your own ladder, ${e.rungs.length} ${e.rungs.length === 1 ? "nudge" : "nudges"}.`
		}))].map((t) => v`<label class="inline option">
          <input type="radio" name="style" .checked=${e.default_style === t.value} @change=${() => this._set({ default_style: t.value })} />
          <span><b>${t.label}</b> <span class="muted small">${t.text}</span></span>
        </label>`)}
    `;
	}
	_renderLights(e) {
		let t = Z(this.hass, ["light"]);
		return v`
      <p>
        Which lights should remind you? Each one either <b>blinks</b> when a step is your turn, or
        is a <b>status light</b> that turns on and stays on until you are done. This is optional.
      </p>
      ${t.length === 0 ? v`<p class="muted">No lights found.</p>` : v`<div class="list grid">
            ${t.map((t) => {
			let n = e.lights.find((e) => e.entity_id === t);
			return v`<div class="choice col">
                <label class="inline">
                  <input
                    type="checkbox"
                    .checked=${!!n}
                    @change=${(n) => {
				let r = n.target.checked, i = e.lights.filter((e) => e.entity_id !== t);
				this._set({ lights: r ? [...i, Xr(t)] : i });
			}}
                  />
                  ${this._fn(t)}
                </label>
                ${n ? v`<div class="radios">
                      ${["blink", "indicator"].map((r) => v`<label class="inline small">
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
                      <button type="button" @click=${() => this._try(`light:${t}`, () => it(this.hass, n))}>Test</button>
                    </div>
                    ${this._noteLine(`light:${t}`)}` : x}
              </div>`;
		})}
          </div>`}
    `;
	}
	_renderLightDetail(e) {
		return e.lights.length === 0 ? v`<p class="muted">No reminder light is set up yet. Skip this.</p>` : v`
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
			return v`<div class="choice col">
            <b>${this._fn(t.entity_id)}</b>
            ${ri(this.hass, t.entity_id) ? v`<label class="num">
                  Color
                  <input type="color" class="swatch" .value=${ei(t.color)} @input=${(e) => n({ color: $r(e.target.value) })} />
                </label>` : v`<span class="muted small">This light only goes on and off, so it has no color.</span>`}
            ${t.mode === "blink" ? v`${this._numField("Blink length (ms)", t.blink_ms, 100, 3e4, (e) => n({ blink_ms: e }), 100)}
                ${this._numField("Number of blinks", t.repeats, 1, 5, (e) => n({ repeats: e }))}
                ${this._numField("Pause between blinks (ms)", t.gap_ms, 0, 3e4, (e) => n({ gap_ms: e }), 100)}` : v`<span class="muted small">A status light has no blink settings.</span>`}
            ${this._numField("Starts at nudge #", t.start_at ?? 1, 1, 20, (e) => n({ start_at: e }))}
            <button type="button" @click=${() => this._try(`light:${t.entity_id}`, () => it(this.hass, t))}>Test</button>
            ${this._noteLine(`light:${t.entity_id}`)}
          </div>`;
		})}
      </div>
    `;
	}
	_renderGate() {
		return v`
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
		let t = Z(this.hass, ["media_player"]);
		return v`
      <p>Which speaker do you want to set up? You can add more speakers afterwards.</p>
      ${t.length === 0 ? v`<p class="muted">No speakers (media players) found.</p>` : v`<div class="list grid">
            ${t.map((t) => {
			let n = e.speakers.find((e) => e.entity_id === t);
			return v`<label class="inline option card-choice">
                <input
                  type="radio"
                  name="speaker"
                  .checked=${this._speaker === t}
                  @change=${() => {
				this._speaker = t, n || this._set({ speakers: [...e.speakers, Zr(t)] });
			}}
                />
                <span>
                  ${this._fn(t)}
                  ${n ? v`<span class="muted small"><br />set up: ${si(n)}</span>` : x}
                </span>
              </label>`;
		})}
          </div>`}
    `;
	}
	_noSpeaker() {
		return v`<p class="muted">Pick a speaker first. Press Back.</p>`;
	}
	_soundBlock(e, t, n, r) {
		let i = t[e];
		return v`
      <p>${n}</p>
      <label class="inline option">
        <input type="checkbox" .checked=${i.enabled} @change=${(t) => this._patchSound(e, { enabled: t.target.checked })} />
        Use this on ${this._fn(t.entity_id)}
      </label>
      ${i.enabled ? v`<div class="fields">
            <label class="num">
              Sound type
              <select @change=${(t) => this._patchSound(e, { kind: t.target.value })}>
                ${za.map((e) => v`<option value=${e.value} .selected=${e.value === i.kind}>${e.label}</option>`)}
              </select>
            </label>
            <label class="num wide">
              ${i.kind === "alexa" ? "Alexa sound id" : "File in the media folder (or a URL)"}
              <input .value=${i.sound} @input=${(t) => this._patchSound(e, { sound: t.target.value })} />
            </label>
            ${i.kind === "alexa" ? v`<div class="muted small">
                  Pick a sound from the <a href=${Ba} target="_blank" rel="noreferrer">Amazon sound library</a>. The id is
                  <code>amzn_sfx_</code> plus the sound's name in lower case with underscores and a two-digit number, for example
                  <code>amzn_sfx_doorbell_chime_01</code>. Some sounds stay silent on some Echo devices, so press Test.
                </div>` : v`<div class="muted small">For example <code>boopli/ding.mp3</code> in your Home Assistant media folder.</div>`}
            ${e === "alarm" ? v`${this._numField("Lasts (seconds)", i.seconds, 3, 600, (e) => this._patchSound("alarm", { seconds: e }))}
                ${this._numField("Repeats every (seconds, 0 = once)", i.repeat_s, 0, 60, (e) => this._patchSound("alarm", { repeat_s: e }))}` : x}
            <div><button type="button" @click=${() => this._try(`spk:${r}`, () => ot(this.hass, t, r))}>Test</button></div>
            ${this._noteLine(`spk:${r}`)}
          </div>` : x}
    `;
	}
	_renderSpkSpeech(e, t) {
		let n = e.speech, r = (e) => this._patchSpeaker((t) => ({
			...t,
			speech: {
				...t.speech,
				...e
			}
		})), i = Yr(this.hass, n.route, n.target);
		return v`
      <p>The speaker says the step out loud, for example "Dishwasher: Empty it".</p>
      <label class="inline option">
        <input type="checkbox" .checked=${n.enabled} @change=${(e) => r({ enabled: e.target.checked })} />
        Say it on ${this._fn(e.entity_id)}
      </label>
      ${n.enabled ? v`<div class="fields">
            <label class="num">
              How
              <select @change=${(e) => r({
			route: e.target.value,
			target: ""
		})}>
                ${Ra.map((e) => v`<option value=${e.value} .selected=${e.value === n.route}>${e.label}</option>`)}
              </select>
            </label>
            <label class="num">
              ${n.route === "tts" ? "Voice" : "Alexa device"}
              <select @change=${(e) => r({ target: e.target.value })}>
                <option value="" .selected=${n.target === ""}>Choose…</option>
                ${i.map((e) => v`<option value=${e.value} .selected=${e.value === n.target}>${e.label}</option>`)}
              </select>
            </label>
            ${n.route === "alexa_media" ? v`<label class="inline small">
                  <input type="checkbox" .checked=${n.announce} @change=${(e) => r({ announce: e.target.checked })} />
                  Announce with a chime (some Alexas stay silent, so test it)
                </label>` : x}
            <label class="num wide">
              The sentence ({chore} and {step} are filled in)
              <input .value=${t.speech_template} @input=${(e) => this._set({ speech_template: e.target.value })} />
            </label>
            <div><button type="button" @click=${() => this._try("spk:speech", () => ot(this.hass, e, "speech"))}>Test</button></div>
            ${this._noteLine("spk:speech")}
          </div>` : x}
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
		return v`
      <p>
        From which nudge does each thing join in on ${this._fn(e.entity_id)}? Nudge 1 is the first
        for a step. A speaker plays the highest one reached.
      </p>
      ${t.length === 0 ? v`<p class="muted">Nothing is switched on for this speaker yet.</p>` : v`<div class="fields">${t.map((e) => this._numField(`${e.label} starts at nudge #`, e.value, 1, 20, e.set))}</div>`}
      <div class="actions inline-actions">
        <button type="button" ?disabled=${this._busy} @click=${() => this._addAnotherSpeaker()}>Add another speaker</button>
      </div>
    `;
	}
	async _addAnotherSpeaker() {
		if (this.hass && this._draft && !this._busy) {
			this._busy = !0;
			try {
				let e = structuredClone(this._draft);
				await Ue(this.hass, e), this._saved = e, this._speaker = "", this._index = this._steps.indexOf("spk_pick"), this._enter();
			} catch (e) {
				this._error = T(e);
			} finally {
				this._busy = !1;
			}
		}
	}
	_renderAlarmDevices(e) {
		let t = Z(this.hass, qr, e.alarm_devices.map((e) => e.entity_id));
		return v`
      <p>
        Optional: a siren, switch or script that Boopli switches on for a while if you keep ignoring
        a step, and off again. It also stops when you answer.
      </p>
      <div class="list">
        ${e.alarm_devices.map((t) => v`<div class="choice">
            <span class="grow">${this._fn(t.entity_id)}</span>
            <button type="button" @click=${() => this._try(`alarm:${t.entity_id}`, () => st(this.hass, t))}>Test (3 s)</button>
            <button type="button" aria-label="Remove" @click=${() => this._set({ alarm_devices: e.alarm_devices.filter((e) => e.entity_id !== t.entity_id) })}>✕</button>
            ${this._noteLine(`alarm:${t.entity_id}`)}
          </div>`)}
      </div>
      <div class="choice">
        <select class="grow" @change=${(e) => this._addDevice = e.target.value}>
          <option value="" .selected=${this._addDevice === ""}>Add a siren, switch or script…</option>
          ${t.map((e) => v`<option value=${e} .selected=${e === this._addDevice}>${this._fn(e)}</option>`)}
        </select>
        <button
          type="button"
          ?disabled=${!this._addDevice}
          @click=${() => {
			this._set({ alarm_devices: [...e.alarm_devices, Qr(this._addDevice)] }), this._addDevice = "";
		}}
        >
          Add
        </button>
      </div>
    `;
	}
	_renderAlarmDetail(e) {
		return e.alarm_devices.length === 0 ? v`<p class="muted">No alarm device is set up yet. Skip this.</p>` : v`
      <p>How long should each device stay on, and from which nudge on?</p>
      <div class="list grid">
        ${e.alarm_devices.map((t) => {
			let n = (n) => this._set({ alarm_devices: e.alarm_devices.map((e) => e.entity_id === t.entity_id ? {
				...e,
				...n
			} : e) });
			return v`<div class="choice col">
            <b>${this._fn(t.entity_id)}</b>
            ${this._numField("On for (seconds)", t.seconds, 1, 600, (e) => n({ seconds: e }))}
            ${this._numField("Starts at nudge #", t.start_at ?? 4, 1, 20, (e) => n({ start_at: e }))}
            <button type="button" @click=${() => this._try(`alarm:${t.entity_id}`, () => st(this.hass, t))}>Test (3 s)</button>
            ${this._noteLine(`alarm:${t.entity_id}`)}
          </div>`;
		})}
      </div>
    `;
	}
	_renderPresence(e) {
		let t = Z(this.hass, ["person"]);
		return v`
      <p>
        If Boopli knows where you are, it reminds you with lights and speakers only when you are
        home, and only on your phone when you are away. This is optional. Without it, Boopli assumes
        you are home.
      </p>
      <div class="field">
        <label for="presence">Which person are you?</label>
        <select id="presence" @change=${(e) => this._set({ presence_entity: e.target.value })}>
          <option value="" .selected=${e.presence_entity === ""}>Skip (assume I am home)</option>
          ${t.map((t) => v`<option value=${t} .selected=${t === e.presence_entity}>${this._fn(t)}</option>`)}
        </select>
      </div>
    `;
	}
	_renderChores() {
		let e = new Set(this.snapshot?.chores.map((e) => e.name));
		return v`
      <p>
        Some chores to start with. Untick what you do not want. They are added without a schedule,
        so nothing nudges you until you set a time (in the Chores tab) or start one yourself.
      </p>
      <div class="list">
        ${Wi.map((t) => {
			let n = e.has(t.draft.name);
			return v`<label class="inline option">
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
		return v`
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
		let t = Z(this.hass, ["ai_task"]);
		return e.ai.enabled ? v`
      <p>Which AI agent should Boopli use?</p>
      <div class="field">
        <select @change=${(t) => this._set({ ai: {
			...e.ai,
			entity_id: t.target.value
		} })}>
          <option value="" .selected=${e.ai.entity_id === ""}>Home Assistant default</option>
          ${t.map((t) => v`<option value=${t} .selected=${t === e.ai.entity_id}>${this._fn(t)}</option>`)}
        </select>
        ${t.length === 0 ? v`<div class="muted small">No AI Task agent found yet. Add one in Home Assistant under Settings, Devices and services, then come back.</div>` : x}
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
    ` : v`<p class="muted">AI help is off. Go back to switch it on, or skip this.</p>`;
	}
	async _testAiAgent(e) {
		if (this.hass) {
			this._note("ai:test", "Saving and asking the agent…");
			try {
				let t = structuredClone(e);
				await Ue(this.hass, t), this._saved = t;
				let n = await Ge(this.hass, "Make a cup of tea", "now", []);
				this._note("ai:test", `It works. The agent split "Make a cup of tea" into ${n.steps.length} steps, starting with: ${n.steps[0]?.title ?? "(none)"}`);
			} catch (e) {
				this._note("ai:test", T(e));
			}
		}
	}
	_renderDone(e) {
		let t = this._baseline ? Aa(this._baseline, e, this.hass) : [], n = Wi.filter((e) => this._picked.includes(e.label)).map((e) => e.draft.name);
		return this._first && n.length && t.push(`Chores added: ${n.join(", ")}`), v`
      <p><b>What changed</b> ${this._first ? "from before this setup" : "in this setup"}:</p>
      ${t.length === 0 ? v`<p class="muted">Nothing changed.</p>` : v`<ul>${t.map((e) => v`<li>${e}</li>`)}</ul>`}
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
			case "lad_start": return this._renderLadStart(e);
			case "lad_name": return this._renderLadName();
			case "lad_delete": return this._renderLadDelete();
			case "lad_nudge": return this._renderLadNudge(e);
			case "lad_more": return this._renderLadMore();
			case "lad_end": return this._renderLadEnd(e);
			default: return this._renderDone(e);
		}
	}
	render() {
		let e = this._draft;
		if (!e) return v`<p class="muted">Loading…</p>`;
		let t = this._step, n = t === "done", r = t === "speaker_gate" || t === "lad_more" || t === "lad_delete", i = this._steps.length - 1;
		return v`
      <div class="shell">
        <nav class="rail" aria-label="Steps">
          <div class="rail-title">${Na[this.wizard]}</div>
          ${this._steps.map((e, t) => v`<button
              type="button"
              class="rail-item ${t === this._index ? "current" : ""} ${t < this._index ? "past" : ""}"
              ?disabled=${t >= this._index}
              @click=${() => this._jump(t)}
            >
              <span class="mark">${t < this._index ? "✓" : t + 1}</span>
              <span>${this._title(e, t)}</span>
            </button>`)}
        </nav>
        <section class="card main">
          <div class="top">
            <span class="muted small">Step ${this._index + 1} of ${this._steps.length}</span>
            ${n && this._first ? x : v`<button type="button" class="link" ?disabled=${this._busy} @click=${() => this._leave()}>
                  ${this._first ? "Skip for now" : "Close"}
                </button>`}
          </div>
          <div class="bar"><div class="fill" style="width:${(this._index + 1) / this._steps.length * 100}%"></div></div>
          <h2>${this._title(t, this._index)}</h2>
          ${Fa.includes(t) ? v`<div class="muted small optional">Optional details. Skip if the defaults are fine.</div>` : x}
          ${this._renderStep(e)}
          ${this._error ? v`<div class="error">${this._error}</div>` : x}
          <div class="actions">
            ${this._index > 0 ? v`<button type="button" ?disabled=${this._busy} @click=${() => this._go(-1)}>Back</button>` : x}
            <span class="spacer"></span>
            ${n ? v`<button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._finish()}>
                  ${this._first ? "Finish" : "Save and close"}
                </button>` : r ? x : v`${t === "lad_name" || t === "lad_start" || t === "lad_nudge" ? x : v`<button type="button" ?disabled=${this._busy} @click=${() => this._go(1, "skip")}>Skip</button>`}
                    <button type="button" class="primary" ?disabled=${this._busy || this._index >= i} @click=${() => this._go(1)}>Next</button>`}
          </div>
        </section>
      </div>
    `;
	}
	static {
		this.styles = [E, o`
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
        grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
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
customElements.define("boopli-wizard", Ha);
// src/boopli-panel.ts
var Ua = {
	today: "Today",
	chores: "Chores",
	home: "My home",
	settings: "Settings"
}, Wa = class extends w {
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
				t.action === "start" ? (await $e(this.hass, t.task, t.steps, t.notes), this._breakdown = null, this._tab = "today") : t.action === "save" ? (await lt(this.hass, this._draftFrom(t)), this._breakdown = null, this._tab = "chores") : t.action === "schedule" && (this._choresRequest = {
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
		this._breakdown = null, this._wizard = e, this.hass && e.wizard === "first" && tt(this.hass, "in_progress", e.startAt).catch(() => void 0);
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
			questions: e.questions,
			steps: e.steps.map((e) => ({
				title: e.title,
				wait_minutes: e.wait_minutes,
				size: e.size,
				group: e.group,
				only_if: e.only_if ?? ""
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
		this.hass && !this._unsub && !this._subscribing && (this._subscribing = !0, ct(this.hass, (e) => {
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
		if (!this._confirm) return x;
		let e = (e) => () => this._confirm?.(e);
		return v`<div class="backdrop" role="dialog" aria-modal="true" aria-label="Unsaved changes">
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
	_renderAwayBar() {
		let e = this._snapshot?.away;
		if (!e?.active || (this._tab === "today" || this._tab === "settings") && !this._wizard && !this._breakdown) return x;
		let t = !!this._snapshot?.away_now, n = this._snapshot?.time_zone ?? "UTC";
		return v`<div class="away-bar" role="status">
      <span>🧳 <b>${t ? "Away mode is on" : "Away mode is planned"}</b> ${Ft(e, this._nowMs, n, t)}</span>
      <button type="button" @click=${() => this._selectTab("settings")}>${t ? "Back now…" : "Change"}</button>
    </div>`;
	}
	render() {
		let e = {
			today: !1,
			chores: this._dirty.chore,
			home: this._dirty.home,
			settings: this._dirty.settings
		};
		return v`
      <header>
        ${this.narrow ? v`<button class="menu" aria-label="Open sidebar" @click=${this._toggleSidebar}>☰</button>` : x}
        <h1>Boopli</h1>
        <nav>
          ${Object.keys(Ua).map((t) => v`<button
              class="tab ${this._tab === t && !this._wizard ? "on" : ""}"
              @click=${() => this._selectTab(t)}
            >
              ${Ua[t]}
              ${e[t] ? v`<span class="dot" title="Unsaved changes" aria-label="Unsaved changes"></span>` : x}
            </button>`)}
        </nav>
      </header>
      ${this._renderAwayBar()}
      <main
        @goto-settings=${() => this._selectTab("settings")}
        @open-wizard=${this._onOpenWizard}
        @open-breakdown=${this._onOpenBreakdown}
        @open-home=${() => this._selectTab("home")}
        @egg-started=${() => this.hass && void Ct(this.hass).catch(() => void 0)}
        @dirty-change=${this._onDirty}
      >
        ${this._connectionError ? v`<p class="error">${this._connectionError}</p>` : this._wizard ? v`<boopli-wizard
                .hass=${this.hass}
                .snapshot=${this._snapshot}
                .wizard=${this._wizard.wizard}
                .startAt=${this._wizard.startAt}
                @wizard-close=${() => this._wizard = null}
              ></boopli-wizard>` : this._breakdown ? v`<boopli-breakdown
                  .hass=${this.hass}
                  .snapshot=${this._snapshot}
                  .kind=${this._breakdown.kind}
                  .task=${this._breakdown.task}
                  .externalError=${this._breakdownError}
                  @breakdown-result=${this._onBreakdownResult}
                  @breakdown-cancel=${() => this._breakdown = null}
                ></boopli-breakdown>` : this._tab === "today" ? v`<boopli-today .hass=${this.hass} .snapshot=${this._snapshot} .nowMs=${this._nowMs}></boopli-today>` : this._tab === "chores" ? v`<boopli-chores
                      .hass=${this.hass}
                      .snapshot=${this._snapshot}
                      .nowMs=${this._nowMs}
                      .openRequest=${this._choresRequest}
                      @request-handled=${() => this._choresRequest = null}
                    ></boopli-chores>` : this._tab === "home" ? v`<boopli-home .hass=${this.hass} .snapshot=${this._snapshot}></boopli-home>` : v`<boopli-settings .hass=${this.hass} .snapshot=${this._snapshot}></boopli-settings>`}
      </main>
      ${this._renderConfirm()}
    `;
	}
	static {
		this.styles = [E, o`
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
        min-width: 0;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .tab {
        white-space: nowrap;
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
      .away-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 6px 12px;
        padding: 8px 16px;
        background: var(--warning-color, #ffa600);
        color: #1a1200;
        font-size: 15px;
      }
      .away-bar button {
        min-height: 0;
        padding: 4px 12px;
        background: #1a1200;
        color: #fff;
        border: 0;
        border-radius: 999px;
      }
      /* Phones: these come last so they win over the rules above. */
      @media (max-width: 600px) {
        header {
          padding: 0 8px;
          gap: 6px;
        }
        header h1 {
          font-size: 18px;
          margin-right: 0;
        }
        .tab {
          padding: 8px 9px;
          font-size: 14px;
        }
        main {
          padding: 12px 12px 64px;
        }
      }
      @media (max-width: 480px) {
        header h1 {
          display: none;
        }
        nav {
          gap: 0;
        }
        .tab {
          padding: 8px 7px;
        }
      }
    `];
	}
};
customElements.define("boopli-panel", Wa);
export { Wa as BoopliPanel };

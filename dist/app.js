/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const directives = new WeakMap();
const isDirective = (o) => {
    return typeof o === 'function' && directives.has(o);
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * True if the custom elements polyfill is in use.
 */
const isCEPolyfill = typeof window !== 'undefined' &&
    window.customElements != null &&
    window.customElements.polyfillWrapFlushCallback !==
        undefined;
/**
 * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
 * `container`.
 */
const removeNodes = (container, start, end = null) => {
    while (start !== end) {
        const n = start.nextSibling;
        container.removeChild(start);
        start = n;
    }
};

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = {};
/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */
const nothing = {};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
/**
 * Suffix appended to all bound attribute names.
 */
const boundAttributeSuffix = '$lit$';
/**
 * An updatable Template that tracks the location of dynamic parts.
 */
class Template {
    constructor(result, element) {
        this.parts = [];
        this.element = element;
        const nodesToRemove = [];
        const stack = [];
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(element.content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
        // Keeps track of the last index associated with a part. We try to delete
        // unnecessary nodes, but we never want to associate two different parts
        // to the same index. They must have a constant node between.
        let lastPartIndex = 0;
        let index = -1;
        let partIndex = 0;
        const { strings, values: { length } } = result;
        while (partIndex < length) {
            const node = walker.nextNode();
            if (node === null) {
                // We've exhausted the content inside a nested template element.
                // Because we still have parts (the outer for-loop), we know:
                // - There is a template in the stack
                // - The walker will find a nextNode outside the template
                walker.currentNode = stack.pop();
                continue;
            }
            index++;
            if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                if (node.hasAttributes()) {
                    const attributes = node.attributes;
                    const { length } = attributes;
                    // Per
                    // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                    // attributes are not guaranteed to be returned in document order.
                    // In particular, Edge/IE can return them out of order, so we cannot
                    // assume a correspondence between part index and attribute index.
                    let count = 0;
                    for (let i = 0; i < length; i++) {
                        if (endsWith(attributes[i].name, boundAttributeSuffix)) {
                            count++;
                        }
                    }
                    while (count-- > 0) {
                        // Get the template literal section leading up to the first
                        // expression in this attribute
                        const stringForPart = strings[partIndex];
                        // Find the attribute name
                        const name = lastAttributeNameRegex.exec(stringForPart)[2];
                        // Find the corresponding attribute
                        // All bound attributes have had a suffix added in
                        // TemplateResult#getHTML to opt out of special attribute
                        // handling. To look up the attribute value we also need to add
                        // the suffix.
                        const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                        const attributeValue = node.getAttribute(attributeLookupName);
                        node.removeAttribute(attributeLookupName);
                        const statics = attributeValue.split(markerRegex);
                        this.parts.push({ type: 'attribute', index, name, strings: statics });
                        partIndex += statics.length - 1;
                    }
                }
                if (node.tagName === 'TEMPLATE') {
                    stack.push(node);
                    walker.currentNode = node.content;
                }
            }
            else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                const data = node.data;
                if (data.indexOf(marker) >= 0) {
                    const parent = node.parentNode;
                    const strings = data.split(markerRegex);
                    const lastIndex = strings.length - 1;
                    // Generate a new text node for each literal section
                    // These nodes are also used as the markers for node parts
                    for (let i = 0; i < lastIndex; i++) {
                        let insert;
                        let s = strings[i];
                        if (s === '') {
                            insert = createMarker();
                        }
                        else {
                            const match = lastAttributeNameRegex.exec(s);
                            if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                                s = s.slice(0, match.index) + match[1] +
                                    match[2].slice(0, -boundAttributeSuffix.length) + match[3];
                            }
                            insert = document.createTextNode(s);
                        }
                        parent.insertBefore(insert, node);
                        this.parts.push({ type: 'node', index: ++index });
                    }
                    // If there's no text, we must insert a comment to mark our place.
                    // Else, we can trust it will stick around after cloning.
                    if (strings[lastIndex] === '') {
                        parent.insertBefore(createMarker(), node);
                        nodesToRemove.push(node);
                    }
                    else {
                        node.data = strings[lastIndex];
                    }
                    // We have a part for each match found
                    partIndex += lastIndex;
                }
            }
            else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                if (node.data === marker) {
                    const parent = node.parentNode;
                    // Add a new marker node to be the startNode of the Part if any of
                    // the following are true:
                    //  * We don't have a previousSibling
                    //  * The previousSibling is already the start of a previous part
                    if (node.previousSibling === null || index === lastPartIndex) {
                        index++;
                        parent.insertBefore(createMarker(), node);
                    }
                    lastPartIndex = index;
                    this.parts.push({ type: 'node', index });
                    // If we don't have a nextSibling, keep this node so we have an end.
                    // Else, we can remove it to save future costs.
                    if (node.nextSibling === null) {
                        node.data = '';
                    }
                    else {
                        nodesToRemove.push(node);
                        index--;
                    }
                    partIndex++;
                }
                else {
                    let i = -1;
                    while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                        // Comment node has a binding marker inside, make an inactive part
                        // The binding won't work, but subsequent bindings will
                        // TODO (justinfagnani): consider whether it's even worth it to
                        // make bindings in comments work
                        this.parts.push({ type: 'node', index: -1 });
                        partIndex++;
                    }
                }
            }
        }
        // Remove text binding nodes after the walk to not disturb the TreeWalker
        for (const n of nodesToRemove) {
            n.parentNode.removeChild(n);
        }
    }
}
const endsWith = (str, suffix) => {
    const index = str.length - suffix.length;
    return index >= 0 && str.slice(index) === suffix;
};
const isTemplatePartActive = (part) => part.index !== -1;
// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
const createMarker = () => document.createComment('');
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-characters
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
 * space character except " ".
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex = 
// eslint-disable-next-line no-control-regex
/([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
class TemplateInstance {
    constructor(template, processor, options) {
        this.__parts = [];
        this.template = template;
        this.processor = processor;
        this.options = options;
    }
    update(values) {
        let i = 0;
        for (const part of this.__parts) {
            if (part !== undefined) {
                part.setValue(values[i]);
            }
            i++;
        }
        for (const part of this.__parts) {
            if (part !== undefined) {
                part.commit();
            }
        }
    }
    _clone() {
        // There are a number of steps in the lifecycle of a template instance's
        // DOM fragment:
        //  1. Clone - create the instance fragment
        //  2. Adopt - adopt into the main document
        //  3. Process - find part markers and create parts
        //  4. Upgrade - upgrade custom elements
        //  5. Update - set node, attribute, property, etc., values
        //  6. Connect - connect to the document. Optional and outside of this
        //     method.
        //
        // We have a few constraints on the ordering of these steps:
        //  * We need to upgrade before updating, so that property values will pass
        //    through any property setters.
        //  * We would like to process before upgrading so that we're sure that the
        //    cloned fragment is inert and not disturbed by self-modifying DOM.
        //  * We want custom elements to upgrade even in disconnected fragments.
        //
        // Given these constraints, with full custom elements support we would
        // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
        //
        // But Safari does not implement CustomElementRegistry#upgrade, so we
        // can not implement that order and still have upgrade-before-update and
        // upgrade disconnected fragments. So we instead sacrifice the
        // process-before-upgrade constraint, since in Custom Elements v1 elements
        // must not modify their light DOM in the constructor. We still have issues
        // when co-existing with CEv0 elements like Polymer 1, and with polyfills
        // that don't strictly adhere to the no-modification rule because shadow
        // DOM, which may be created in the constructor, is emulated by being placed
        // in the light DOM.
        //
        // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
        // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
        // in one step.
        //
        // The Custom Elements v1 polyfill supports upgrade(), so the order when
        // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
        // Connect.
        const fragment = isCEPolyfill ?
            this.template.element.content.cloneNode(true) :
            document.importNode(this.template.element.content, true);
        const stack = [];
        const parts = this.template.parts;
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
        let partIndex = 0;
        let nodeIndex = 0;
        let part;
        let node = walker.nextNode();
        // Loop through all the nodes and parts of a template
        while (partIndex < parts.length) {
            part = parts[partIndex];
            if (!isTemplatePartActive(part)) {
                this.__parts.push(undefined);
                partIndex++;
                continue;
            }
            // Progress the tree walker until we find our next part's node.
            // Note that multiple parts may share the same node (attribute parts
            // on a single element), so this loop may not run at all.
            while (nodeIndex < part.index) {
                nodeIndex++;
                if (node.nodeName === 'TEMPLATE') {
                    stack.push(node);
                    walker.currentNode = node.content;
                }
                if ((node = walker.nextNode()) === null) {
                    // We've exhausted the content inside a nested template element.
                    // Because we still have parts (the outer for-loop), we know:
                    // - There is a template in the stack
                    // - The walker will find a nextNode outside the template
                    walker.currentNode = stack.pop();
                    node = walker.nextNode();
                }
            }
            // We've arrived at our part's node.
            if (part.type === 'node') {
                const part = this.processor.handleTextExpression(this.options);
                part.insertAfterNode(node.previousSibling);
                this.__parts.push(part);
            }
            else {
                this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
            }
            partIndex++;
        }
        if (isCEPolyfill) {
            document.adoptNode(fragment);
            customElements.upgrade(fragment);
        }
        return fragment;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Our TrustedTypePolicy for HTML which is declared using the html template
 * tag function.
 *
 * That HTML is a developer-authored constant, and is parsed with innerHTML
 * before any untrusted expressions have been mixed in. Therefor it is
 * considered safe by construction.
 */
const policy = window.trustedTypes &&
    trustedTypes.createPolicy('lit-html', { createHTML: (s) => s });
const commentMarker = ` ${marker} `;
/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
class TemplateResult {
    constructor(strings, values, type, processor) {
        this.strings = strings;
        this.values = values;
        this.type = type;
        this.processor = processor;
    }
    /**
     * Returns a string of HTML used to create a `<template>` element.
     */
    getHTML() {
        const l = this.strings.length - 1;
        let html = '';
        let isCommentBinding = false;
        for (let i = 0; i < l; i++) {
            const s = this.strings[i];
            // For each binding we want to determine the kind of marker to insert
            // into the template source before it's parsed by the browser's HTML
            // parser. The marker type is based on whether the expression is in an
            // attribute, text, or comment position.
            //   * For node-position bindings we insert a comment with the marker
            //     sentinel as its text content, like <!--{{lit-guid}}-->.
            //   * For attribute bindings we insert just the marker sentinel for the
            //     first binding, so that we support unquoted attribute bindings.
            //     Subsequent bindings can use a comment marker because multi-binding
            //     attributes must be quoted.
            //   * For comment bindings we insert just the marker sentinel so we don't
            //     close the comment.
            //
            // The following code scans the template source, but is *not* an HTML
            // parser. We don't need to track the tree structure of the HTML, only
            // whether a binding is inside a comment, and if not, if it appears to be
            // the first binding in an attribute.
            const commentOpen = s.lastIndexOf('<!--');
            // We're in comment position if we have a comment open with no following
            // comment close. Because <-- can appear in an attribute value there can
            // be false positives.
            isCommentBinding = (commentOpen > -1 || isCommentBinding) &&
                s.indexOf('-->', commentOpen + 1) === -1;
            // Check to see if we have an attribute-like sequence preceding the
            // expression. This can match "name=value" like structures in text,
            // comments, and attribute values, so there can be false-positives.
            const attributeMatch = lastAttributeNameRegex.exec(s);
            if (attributeMatch === null) {
                // We're only in this branch if we don't have a attribute-like
                // preceding sequence. For comments, this guards against unusual
                // attribute values like <div foo="<!--${'bar'}">. Cases like
                // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
                // below.
                html += s + (isCommentBinding ? commentMarker : nodeMarker);
            }
            else {
                // For attributes we use just a marker sentinel, and also append a
                // $lit$ suffix to the name to opt-out of attribute-specific parsing
                // that IE and Edge do for style and certain SVG attributes.
                html += s.substr(0, attributeMatch.index) + attributeMatch[1] +
                    attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] +
                    marker;
            }
        }
        html += this.strings[l];
        return html;
    }
    getTemplateElement() {
        const template = document.createElement('template');
        let value = this.getHTML();
        if (policy !== undefined) {
            // this is secure because `this.strings` is a TemplateStringsArray.
            // TODO: validate this when
            // https://github.com/tc39/proposal-array-is-template-object is
            // implemented.
            value = policy.createHTML(value);
        }
        template.innerHTML = value;
        return template;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const isPrimitive = (value) => {
    return (value === null ||
        !(typeof value === 'object' || typeof value === 'function'));
};
const isIterable = (value) => {
    return Array.isArray(value) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !!(value && value[Symbol.iterator]);
};
/**
 * Writes attribute values to the DOM for a group of AttributeParts bound to a
 * single attribute. The value is only set once even if there are multiple parts
 * for an attribute.
 */
class AttributeCommitter {
    constructor(element, name, strings) {
        this.dirty = true;
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.parts = [];
        for (let i = 0; i < strings.length - 1; i++) {
            this.parts[i] = this._createPart();
        }
    }
    /**
     * Creates a single part. Override this to create a differnt type of part.
     */
    _createPart() {
        return new AttributePart(this);
    }
    _getValue() {
        const strings = this.strings;
        const l = strings.length - 1;
        const parts = this.parts;
        // If we're assigning an attribute via syntax like:
        //    attr="${foo}"  or  attr=${foo}
        // but not
        //    attr="${foo} ${bar}" or attr="${foo} baz"
        // then we don't want to coerce the attribute value into one long
        // string. Instead we want to just return the value itself directly,
        // so that sanitizeDOMValue can get the actual value rather than
        // String(value)
        // The exception is if v is an array, in which case we do want to smash
        // it together into a string without calling String() on the array.
        //
        // This also allows trusted values (when using TrustedTypes) being
        // assigned to DOM sinks without being stringified in the process.
        if (l === 1 && strings[0] === '' && strings[1] === '') {
            const v = parts[0].value;
            if (typeof v === 'symbol') {
                return String(v);
            }
            if (typeof v === 'string' || !isIterable(v)) {
                return v;
            }
        }
        let text = '';
        for (let i = 0; i < l; i++) {
            text += strings[i];
            const part = parts[i];
            if (part !== undefined) {
                const v = part.value;
                if (isPrimitive(v) || !isIterable(v)) {
                    text += typeof v === 'string' ? v : String(v);
                }
                else {
                    for (const t of v) {
                        text += typeof t === 'string' ? t : String(t);
                    }
                }
            }
        }
        text += strings[l];
        return text;
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            this.element.setAttribute(this.name, this._getValue());
        }
    }
}
/**
 * A Part that controls all or part of an attribute value.
 */
class AttributePart {
    constructor(committer) {
        this.value = undefined;
        this.committer = committer;
    }
    setValue(value) {
        if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
            this.value = value;
            // If the value is a not a directive, dirty the committer so that it'll
            // call setAttribute. If the value is a directive, it'll dirty the
            // committer if it calls setValue().
            if (!isDirective(value)) {
                this.committer.dirty = true;
            }
        }
    }
    commit() {
        while (isDirective(this.value)) {
            const directive = this.value;
            this.value = noChange;
            directive(this);
        }
        if (this.value === noChange) {
            return;
        }
        this.committer.commit();
    }
}
/**
 * A Part that controls a location within a Node tree. Like a Range, NodePart
 * has start and end locations and can set and update the Nodes between those
 * locations.
 *
 * NodeParts support several value types: primitives, Nodes, TemplateResults,
 * as well as arrays and iterables of those types.
 */
class NodePart {
    constructor(options) {
        this.value = undefined;
        this.__pendingValue = undefined;
        this.options = options;
    }
    /**
     * Appends this part into a container.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendInto(container) {
        this.startNode = container.appendChild(createMarker());
        this.endNode = container.appendChild(createMarker());
    }
    /**
     * Inserts this part after the `ref` node (between `ref` and `ref`'s next
     * sibling). Both `ref` and its next sibling must be static, unchanging nodes
     * such as those that appear in a literal section of a template.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterNode(ref) {
        this.startNode = ref;
        this.endNode = ref.nextSibling;
    }
    /**
     * Appends this part into a parent part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendIntoPart(part) {
        part.__insert(this.startNode = createMarker());
        part.__insert(this.endNode = createMarker());
    }
    /**
     * Inserts this part after the `ref` part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterPart(ref) {
        ref.__insert(this.startNode = createMarker());
        this.endNode = ref.endNode;
        ref.endNode = this.startNode;
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        if (this.startNode.parentNode === null) {
            return;
        }
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        const value = this.__pendingValue;
        if (value === noChange) {
            return;
        }
        if (isPrimitive(value)) {
            if (value !== this.value) {
                this.__commitText(value);
            }
        }
        else if (value instanceof TemplateResult) {
            this.__commitTemplateResult(value);
        }
        else if (value instanceof Node) {
            this.__commitNode(value);
        }
        else if (isIterable(value)) {
            this.__commitIterable(value);
        }
        else if (value === nothing) {
            this.value = nothing;
            this.clear();
        }
        else {
            // Fallback, will render the string representation
            this.__commitText(value);
        }
    }
    __insert(node) {
        this.endNode.parentNode.insertBefore(node, this.endNode);
    }
    __commitNode(value) {
        if (this.value === value) {
            return;
        }
        this.clear();
        this.__insert(value);
        this.value = value;
    }
    __commitText(value) {
        const node = this.startNode.nextSibling;
        value = value == null ? '' : value;
        // If `value` isn't already a string, we explicitly convert it here in case
        // it can't be implicitly converted - i.e. it's a symbol.
        const valueAsString = typeof value === 'string' ? value : String(value);
        if (node === this.endNode.previousSibling &&
            node.nodeType === 3 /* Node.TEXT_NODE */) {
            // If we only have a single text node between the markers, we can just
            // set its value, rather than replacing it.
            // TODO(justinfagnani): Can we just check if this.value is primitive?
            node.data = valueAsString;
        }
        else {
            this.__commitNode(document.createTextNode(valueAsString));
        }
        this.value = value;
    }
    __commitTemplateResult(value) {
        const template = this.options.templateFactory(value);
        if (this.value instanceof TemplateInstance &&
            this.value.template === template) {
            this.value.update(value.values);
        }
        else {
            // Make sure we propagate the template processor from the TemplateResult
            // so that we use its syntax extension, etc. The template factory comes
            // from the render function options so that it can control template
            // caching and preprocessing.
            const instance = new TemplateInstance(template, value.processor, this.options);
            const fragment = instance._clone();
            instance.update(value.values);
            this.__commitNode(fragment);
            this.value = instance;
        }
    }
    __commitIterable(value) {
        // For an Iterable, we create a new InstancePart per item, then set its
        // value to the item. This is a little bit of overhead for every item in
        // an Iterable, but it lets us recurse easily and efficiently update Arrays
        // of TemplateResults that will be commonly returned from expressions like:
        // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
        // If _value is an array, then the previous render was of an
        // iterable and _value will contain the NodeParts from the previous
        // render. If _value is not an array, clear this part and make a new
        // array for NodeParts.
        if (!Array.isArray(this.value)) {
            this.value = [];
            this.clear();
        }
        // Lets us keep track of how many items we stamped so we can clear leftover
        // items from a previous render
        const itemParts = this.value;
        let partIndex = 0;
        let itemPart;
        for (const item of value) {
            // Try to reuse an existing part
            itemPart = itemParts[partIndex];
            // If no existing part, create a new one
            if (itemPart === undefined) {
                itemPart = new NodePart(this.options);
                itemParts.push(itemPart);
                if (partIndex === 0) {
                    itemPart.appendIntoPart(this);
                }
                else {
                    itemPart.insertAfterPart(itemParts[partIndex - 1]);
                }
            }
            itemPart.setValue(item);
            itemPart.commit();
            partIndex++;
        }
        if (partIndex < itemParts.length) {
            // Truncate the parts array so _value reflects the current state
            itemParts.length = partIndex;
            this.clear(itemPart && itemPart.endNode);
        }
    }
    clear(startNode = this.startNode) {
        removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
    }
}
/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */
class BooleanAttributePart {
    constructor(element, name, strings) {
        this.value = undefined;
        this.__pendingValue = undefined;
        if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
            throw new Error('Boolean attributes can only contain a single expression');
        }
        this.element = element;
        this.name = name;
        this.strings = strings;
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const value = !!this.__pendingValue;
        if (this.value !== value) {
            if (value) {
                this.element.setAttribute(this.name, '');
            }
            else {
                this.element.removeAttribute(this.name);
            }
            this.value = value;
        }
        this.__pendingValue = noChange;
    }
}
/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */
class PropertyCommitter extends AttributeCommitter {
    constructor(element, name, strings) {
        super(element, name, strings);
        this.single =
            (strings.length === 2 && strings[0] === '' && strings[1] === '');
    }
    _createPart() {
        return new PropertyPart(this);
    }
    _getValue() {
        if (this.single) {
            return this.parts[0].value;
        }
        return super._getValue();
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.element[this.name] = this._getValue();
        }
    }
}
class PropertyPart extends AttributePart {
}
// Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the third
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.
let eventOptionsSupported = false;
// Wrap into an IIFE because MS Edge <= v41 does not support having try/catch
// blocks right into the body of a module
(() => {
    try {
        const options = {
            get capture() {
                eventOptionsSupported = true;
                return false;
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.addEventListener('test', options, options);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.removeEventListener('test', options, options);
    }
    catch (_e) {
        // event options not supported
    }
})();
class EventPart {
    constructor(element, eventName, eventContext) {
        this.value = undefined;
        this.__pendingValue = undefined;
        this.element = element;
        this.eventName = eventName;
        this.eventContext = eventContext;
        this.__boundHandleEvent = (e) => this.handleEvent(e);
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const newListener = this.__pendingValue;
        const oldListener = this.value;
        const shouldRemoveListener = newListener == null ||
            oldListener != null &&
                (newListener.capture !== oldListener.capture ||
                    newListener.once !== oldListener.once ||
                    newListener.passive !== oldListener.passive);
        const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
        if (shouldRemoveListener) {
            this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
        }
        if (shouldAddListener) {
            this.__options = getOptions(newListener);
            this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
        }
        this.value = newListener;
        this.__pendingValue = noChange;
    }
    handleEvent(event) {
        if (typeof this.value === 'function') {
            this.value.call(this.eventContext || this.element, event);
        }
        else {
            this.value.handleEvent(event);
        }
    }
}
// We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.
const getOptions = (o) => o &&
    (eventOptionsSupported ?
        { capture: o.capture, passive: o.passive, once: o.once } :
        o.capture);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Creates Parts when a template is instantiated.
 */
class DefaultTemplateProcessor {
    /**
     * Create parts for an attribute-position binding, given the event, attribute
     * name, and string literals.
     *
     * @param element The element containing the binding
     * @param name  The attribute name
     * @param strings The string literals. There are always at least two strings,
     *   event for fully-controlled bindings with a single expression.
     */
    handleAttributeExpressions(element, name, strings, options) {
        const prefix = name[0];
        if (prefix === '.') {
            const committer = new PropertyCommitter(element, name.slice(1), strings);
            return committer.parts;
        }
        if (prefix === '@') {
            return [new EventPart(element, name.slice(1), options.eventContext)];
        }
        if (prefix === '?') {
            return [new BooleanAttributePart(element, name.slice(1), strings)];
        }
        const committer = new AttributeCommitter(element, name, strings);
        return committer.parts;
    }
    /**
     * Create parts for a text-position binding.
     * @param templateFactory
     */
    handleTextExpression(options) {
        return new NodePart(options);
    }
}
const defaultTemplateProcessor = new DefaultTemplateProcessor();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */
function templateFactory(result) {
    let templateCache = templateCaches.get(result.type);
    if (templateCache === undefined) {
        templateCache = {
            stringsArray: new WeakMap(),
            keyString: new Map()
        };
        templateCaches.set(result.type, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== undefined) {
        return template;
    }
    // If the TemplateStringsArray is new, generate a key from the strings
    // This key is shared between all templates with identical content
    const key = result.strings.join(marker);
    // Check if we already have a Template for this key
    template = templateCache.keyString.get(key);
    if (template === undefined) {
        // If we have not seen this key before, create a new Template
        template = new Template(result, result.getTemplateElement());
        // Cache the Template for this key
        templateCache.keyString.set(key, template);
    }
    // Cache all future queries for this TemplateStringsArray
    templateCache.stringsArray.set(result.strings, template);
    return template;
}
const templateCaches = new Map();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const parts = new WeakMap();
/**
 * Renders a template result or other value to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result Any value renderable by NodePart - typically a TemplateResult
 *     created by evaluating a template tag like `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */
const render = (result, container, options) => {
    let part = parts.get(container);
    if (part === undefined) {
        removeNodes(container, container.firstChild);
        parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
        part.appendInto(container);
    }
    part.setValue(result);
    part.commit();
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
if (typeof window !== 'undefined') {
    (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.3.0');
}
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

let current;
let currentId = 0;
function setCurrent(state) {
    current = state;
}
function clear() {
    current = null;
    currentId = 0;
}
function notify() {
    return currentId++;
}

const phaseSymbol = Symbol('haunted.phase');
const hookSymbol = Symbol('haunted.hook');
const updateSymbol = Symbol('haunted.update');
const commitSymbol = Symbol('haunted.commit');
const effectsSymbol = Symbol('haunted.effects');
const layoutEffectsSymbol = Symbol('haunted.layoutEffects');
const contextEvent = 'haunted.context';

class State {
    constructor(update, host) {
        this.update = update;
        this.host = host;
        this[hookSymbol] = new Map();
        this[effectsSymbol] = [];
        this[layoutEffectsSymbol] = [];
    }
    run(cb) {
        setCurrent(this);
        let res = cb();
        clear();
        return res;
    }
    _runEffects(phase) {
        let effects = this[phase];
        setCurrent(this);
        for (let effect of effects) {
            effect.call(this);
        }
        clear();
    }
    runEffects() {
        this._runEffects(effectsSymbol);
    }
    runLayoutEffects() {
        this._runEffects(layoutEffectsSymbol);
    }
    teardown() {
        let hooks = this[hookSymbol];
        hooks.forEach(hook => {
            if (typeof hook.teardown === 'function') {
                hook.teardown();
            }
        });
    }
}

const defer = Promise.resolve().then.bind(Promise.resolve());
function runner() {
    let tasks = [];
    let id;
    function runTasks() {
        id = null;
        let t = tasks;
        tasks = [];
        for (var i = 0, len = t.length; i < len; i++) {
            t[i]();
        }
    }
    return function (task) {
        tasks.push(task);
        if (id == null) {
            id = defer(runTasks);
        }
    };
}
const read = runner();
const write = runner();
class BaseScheduler {
    constructor(renderer, host) {
        this.renderer = renderer;
        this.host = host;
        this.state = new State(this.update.bind(this), host);
        this[phaseSymbol] = null;
        this._updateQueued = false;
    }
    update() {
        if (this._updateQueued)
            return;
        read(() => {
            let result = this.handlePhase(updateSymbol);
            write(() => {
                this.handlePhase(commitSymbol, result);
                write(() => {
                    this.handlePhase(effectsSymbol);
                });
            });
            this._updateQueued = false;
        });
        this._updateQueued = true;
    }
    handlePhase(phase, arg) {
        this[phaseSymbol] = phase;
        switch (phase) {
            case commitSymbol:
                this.commit(arg);
                this.runEffects(layoutEffectsSymbol);
                return;
            case updateSymbol: return this.render();
            case effectsSymbol: return this.runEffects(effectsSymbol);
        }
        this[phaseSymbol] = null;
    }
    render() {
        return this.state.run(() => this.renderer.call(this.host, this.host));
    }
    runEffects(phase) {
        this.state._runEffects(phase);
    }
    teardown() {
        this.state.teardown();
    }
}

const toCamelCase = (val = '') => val.replace(/-+([a-z])?/g, (_, char) => char ? char.toUpperCase() : '');
function makeComponent(render) {
    class Scheduler extends BaseScheduler {
        constructor(renderer, frag, host) {
            super(renderer, host || frag);
            this.frag = frag;
        }
        commit(result) {
            render(result, this.frag);
        }
    }
    function component(renderer, baseElementOrOptions, options) {
        const BaseElement = (options || baseElementOrOptions || {}).baseElement || HTMLElement;
        const { observedAttributes = [], useShadowDOM = true, shadowRootInit = {} } = options || baseElementOrOptions || {};
        class Element extends BaseElement {
            constructor() {
                super();
                if (useShadowDOM === false) {
                    this._scheduler = new Scheduler(renderer, this);
                }
                else {
                    this.attachShadow({ mode: 'open', ...shadowRootInit });
                    this._scheduler = new Scheduler(renderer, this.shadowRoot, this);
                }
            }
            static get observedAttributes() {
                return renderer.observedAttributes || observedAttributes || [];
            }
            connectedCallback() {
                this._scheduler.update();
            }
            disconnectedCallback() {
                this._scheduler.teardown();
            }
            attributeChangedCallback(name, oldValue, newValue) {
                if (oldValue === newValue) {
                    return;
                }
                let val = newValue === '' ? true : newValue;
                Reflect.set(this, toCamelCase(name), val);
            }
        }
        function reflectiveProp(initialValue) {
            let value = initialValue;
            return Object.freeze({
                enumerable: true,
                configurable: true,
                get() {
                    return value;
                },
                set(newValue) {
                    value = newValue;
                    this._scheduler.update();
                }
            });
        }
        const proto = new Proxy(BaseElement.prototype, {
            getPrototypeOf(target) {
                return target;
            },
            set(target, key, value, receiver) {
                let desc;
                if (key in target) {
                    desc = Object.getOwnPropertyDescriptor(target, key);
                    if (desc && desc.set) {
                        desc.set.call(receiver, value);
                        return true;
                    }
                    Reflect.set(target, key, value);
                }
                if (typeof key === 'symbol' || key[0] === '_') {
                    desc = {
                        enumerable: true,
                        configurable: true,
                        writable: true,
                        value
                    };
                }
                else {
                    desc = reflectiveProp(value);
                }
                Object.defineProperty(receiver, key, desc);
                if (desc.set) {
                    desc.set.call(receiver, value);
                }
                return true;
            }
        });
        Object.setPrototypeOf(Element.prototype, proto);
        return Element;
    }
    return component;
}

class Hook {
    constructor(id, state) {
        this.id = id;
        this.state = state;
    }
}
function use(Hook, ...args) {
    let id = notify();
    let hooks = current[hookSymbol];
    let hook = hooks.get(id);
    if (!hook) {
        hook = new Hook(id, current, ...args);
        hooks.set(id, hook);
    }
    return hook.update(...args);
}
function hook(Hook) {
    return use.bind(null, Hook);
}

function createEffect(setEffects) {
    return hook(class extends Hook {
        constructor(id, state, ignored1, ignored2) {
            super(id, state);
            setEffects(state, this);
        }
        update(callback, values) {
            this.callback = callback;
            this.lastValues = this.values;
            this.values = values;
        }
        call() {
            if (!this.values || this.hasChanged()) {
                this.run();
            }
        }
        run() {
            this.teardown();
            this._teardown = this.callback.call(this.state);
        }
        teardown() {
            if (typeof this._teardown === 'function') {
                this._teardown();
            }
        }
        hasChanged() {
            return !this.lastValues || this.values.some((value, i) => this.lastValues[i] !== value);
        }
    });
}

function setEffects(state, cb) {
    state[effectsSymbol].push(cb);
}
const useEffect = createEffect(setEffects);

const useContext = hook(class extends Hook {
    constructor(id, state, _) {
        super(id, state);
        this._updater = this._updater.bind(this);
        this._ranEffect = false;
        this._unsubscribe = null;
        setEffects(state, this);
    }
    update(Context) {
        if (this.state.virtual) {
            throw new Error('can\'t be used with virtual components');
        }
        if (this.Context !== Context) {
            this._subscribe(Context);
            this.Context = Context;
        }
        return this.value;
    }
    call() {
        if (!this._ranEffect) {
            this._ranEffect = true;
            if (this._unsubscribe)
                this._unsubscribe();
            this._subscribe(this.Context);
            this.state.update();
        }
    }
    _updater(value) {
        this.value = value;
        this.state.update();
    }
    _subscribe(Context) {
        const detail = { Context, callback: this._updater };
        this.state.host.dispatchEvent(new CustomEvent(contextEvent, {
            detail,
            bubbles: true,
            cancelable: true,
            composed: true,
        }));
        const { unsubscribe, value } = detail;
        this.value = unsubscribe ? value : Context.defaultValue;
        this._unsubscribe = unsubscribe;
    }
    teardown() {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
    }
});

function makeContext(component) {
    return (defaultValue) => {
        const Context = {
            Provider: class extends HTMLElement {
                constructor() {
                    super();
                    this.listeners = new Set();
                    this.addEventListener(contextEvent, this);
                }
                disconnectedCallback() {
                    this.removeEventListener(contextEvent, this);
                }
                handleEvent(event) {
                    const { detail } = event;
                    if (detail.Context === Context) {
                        detail.value = this.value;
                        detail.unsubscribe = this.unsubscribe.bind(this, detail.callback);
                        this.listeners.add(detail.callback);
                        event.stopPropagation();
                    }
                }
                unsubscribe(callback) {
                    this.listeners.delete(callback);
                }
                set value(value) {
                    this._value = value;
                    for (let callback of this.listeners) {
                        callback(value);
                    }
                }
                get value() {
                    return this._value;
                }
            },
            Consumer: component(function ({ render }) {
                const context = useContext(Context);
                return render(context);
            }),
            defaultValue,
        };
        return Context;
    };
}

const useMemo = hook(class extends Hook {
    constructor(id, state, fn, values) {
        super(id, state);
        this.value = fn();
        this.values = values;
    }
    update(fn, values) {
        if (this.hasChanged(values)) {
            this.values = values;
            this.value = fn();
        }
        return this.value;
    }
    hasChanged(values = []) {
        return values.some((value, i) => this.values[i] !== value);
    }
});

function setLayoutEffects(state, cb) {
    state[layoutEffectsSymbol].push(cb);
}
const useLayoutEffect = createEffect(setLayoutEffects);

const useState = hook(class extends Hook {
    constructor(id, state, initialValue) {
        super(id, state);
        this.updater = this.updater.bind(this);
        if (typeof initialValue === 'function') {
            initialValue = initialValue();
        }
        this.makeArgs(initialValue);
    }
    update() {
        return this.args;
    }
    updater(value) {
        if (typeof value === 'function') {
            const updaterFn = value;
            const [previousValue] = this.args;
            value = updaterFn(previousValue);
        }
        this.makeArgs(value);
        this.state.update();
    }
    makeArgs(value) {
        this.args = Object.freeze([value, this.updater]);
    }
});

const useReducer = hook(class extends Hook {
    constructor(id, state, _, initialState, init) {
        super(id, state);
        this.dispatch = this.dispatch.bind(this);
        this.currentState = init !== undefined ? init(initialState) : initialState;
    }
    update(reducer) {
        this.reducer = reducer;
        return [this.currentState, this.dispatch];
    }
    dispatch(action) {
        this.currentState = this.reducer(this.currentState, action);
        this.state.update();
    }
});

const useRef = (initialValue) => useMemo(() => ({
    current: initialValue
}), []);

function haunted({ render }) {
    const component = makeComponent(render);
    const createContext = makeContext(component);
    return { component, createContext };
}

const { component, createContext } = haunted({ render });

const defineElement = (name, renderer, options = { useShadowDOM: true }) => {
    customElements.define(name, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component(renderer, options));
};

class StylesHook extends Hook {
    // For this app static styles are enough,
    // also updating them is prob not very efficient
    // especially on browsers where pollyfil is needed.
    /* eslint-disable-next-line class-methods-use-this */
    update() { }
    constructor(id, state, fn) {
        super(id, state);
        const { shadowRoot } = state.host;
        if (shadowRoot) {
            shadowRoot.adoptedStyleSheets = fn();
        }
        else {
            throw new Error('ShadowRoot needs to be enabled for styles to work.');
        }
    }
}
const useStyles = hook(StylesHook);

// =============================================================================
// Core.ts | Utility Functions
// (c) Mathigon
// =============================================================================
/** Creates a random UID string of a given length. */
function uid(n = 10) {
    return Math.random().toString(36).substr(2, n);
}

// =============================================================================
// Core.ts | Array Functions
// (c) Mathigon
// =============================================================================
/** Creates an array of size `n`, containing `value` at every entry. */
function repeat(value, n) {
    return new Array(n).fill(value);
}
/** Creates an array of size `n`, with the result of `fn(i)` at position i. */
function tabulate(fn, n) {
    const result = [];
    for (let i = 0; i < n; ++i) {
        result.push(fn(i));
    }
    return result;
}
/** Returns the last item in an array, or the ith item from the end. */
function last(array, i = 0) {
    return array[array.length - 1 - i];
}
/** Finds the sum of all elements in an numeric array. */
function total(array) {
    return array.reduce((t, v) => t + v, 0);
}
/** Flattens a nested array into a single list. */
function flatten(array) {
    return array.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
}
/** Converts an array to a linked list data structure. */
function toLinkedList(array) {
    const result = array.map(a => ({ val: a, next: undefined }));
    const n = result.length;
    for (let i = 0; i < n - 1; ++i) {
        result[i].next = result[i + 1];
    }
    result[n - 1].next = result[0];
    return result;
}

// ============================================================================
// Fermat.js | Utility Functions
// (c) Mathigon
// ============================================================================
const PRECISION = 0.000001;
// -----------------------------------------------------------------------------
// Checks and Comparisons
/** Checks if two numbers are nearly equals. */
function nearlyEquals(x, y, t = PRECISION) {
    if (isNaN(x) || isNaN(y))
        return false;
    return Math.abs(x - y) < t;
}
/** Checks if a number x is between two numbers a and b. */
function isBetween(x, a, b, t = PRECISION) {
    if (a > b)
        [a, b] = [b, a];
    return x > a + t && x < b - t;
}
/** Round a number `n` to the nearest multiple of `increment`. */
function roundTo(n, increment = 1) {
    return Math.round(n / increment) * increment;
}
// -----------------------------------------------------------------------------
// Simple Operations
/** Bounds a number between a lower and an upper limit. */
function clamp(x, min = -Infinity, max = Infinity) {
    return Math.min(max, Math.max(min, x));
}
/** Linear interpolation */
function lerp(a, b, t = 0.5) {
    return a + (b - a) * t;
}
/** Squares a number. */
function square(x) {
    return x * x;
}
/**
 * Calculates `a mod m`. The JS implementation of the % operator returns the
 * symmetric modulo. Both are identical if a >= 0 and m >= 0 but the results
 * differ if a or m < 0.
 */
function mod(a, m) {
    return ((a % m) + m) % m;
}
/**
 * Returns an array of all possible subsets of an input array (of given length).
 */
function subsets(array, length = 0) {
    const copy = array.slice(0);
    const results = subsetsHelper(copy);
    return length ? results.filter(x => x.length === length) : results;
}
function subsetsHelper(array) {
    if (array.length === 1)
        return [[], array];
    const last = array.pop();
    const subsets = subsetsHelper(array);
    const result = [];
    for (const s of subsets) {
        result.push(s, [...s, last]);
    }
    return result;
}

// ============================================================================
/** Randomly shuffles the elements in an array a. */
function shuffle(a) {
    a = a.slice(0); // create copy
    for (let i = a.length - 1; i > 0; --i) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
/** Generates a random integer between 0 and a, or between a and b. */
function integer(a, b) {
    const start = (b === undefined ? 0 : a);
    const length = (b === undefined ? a : b - a + 1);
    return start + Math.floor(length * Math.random());
}
/** Chooses a random index value from weights [2, 5, 3] */
function weighted(weights) {
    const x = Math.random() * total(weights);
    let cum = 0;
    return weights.findIndex((w) => (cum += w) >= x);
}
// ---------------------------------------------------------------------------
// Smart Random Number Generators
const SMART_RANDOM_CACHE = new Map();
/**
 * Returns a random number between 0 and n, but avoids returning the same
 * number multiple times in a row.
 */
function smart(n, id) {
    if (!id)
        id = uid();
    if (!SMART_RANDOM_CACHE.has(id))
        SMART_RANDOM_CACHE.set(id, repeat(1, n));
    const cache = SMART_RANDOM_CACHE.get(id);
    const x = weighted(cache.map(x => x * x));
    cache[x] -= 1;
    if (cache[x] <= 0)
        SMART_RANDOM_CACHE.set(id, cache.map(x => x + 1));
    return x;
}
// ---------------------------------------------------------------------------
// Probability Distribution
/** Generates a Bernoulli random variable. */
function bernoulli(p = 0.5) {
    return (Math.random() < p ? 1 : 0);
}
/** Generates a Binomial random variable. */
function binomial$1(n = 1, p = 0.5) {
    let t = 0;
    for (let i = 0; i < n; ++i)
        t += bernoulli(p);
    return t;
}
/** Generates a Poisson random variable. */
function poisson(l = 1) {
    if (l <= 0)
        return 0;
    const L = Math.exp(-l);
    let p = 1;
    let k = 0;
    for (; p > L; ++k)
        p *= Math.random();
    return k - 1;
}
/** Generates a uniform random variable. */
function uniform(a = 0, b = 1) {
    return a + (b - a) * Math.random();
}
/** Generates a normal random variable with mean m and variance v. */
function normal(m = 0, v = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const rand = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return rand * Math.sqrt(v) + m;
}
/** Generates an exponential random variable. */
function exponential(l = 1) {
    return l <= 0 ? 0 : -Math.log(Math.random()) / l;
}
/** Generates a geometric random variable. */
function geometric(p = 0.5) {
    if (p <= 0 || p > 1)
        return undefined;
    return Math.floor(Math.log(Math.random()) / Math.log(1 - p));
}
/** Generates an Cauchy random variable. */
function cauchy() {
    let rr;
    let v1;
    let v2;
    do {
        v1 = 2 * Math.random() - 1;
        v2 = 2 * Math.random() - 1;
        rr = v1 * v1 + v2 * v2;
    } while (rr >= 1);
    return v1 / v2;
}
// ---------------------------------------------------------------------------
// PDFs and CDFs
/** Generates pdf(x) for the normal distribution with mean m and variance v. */
function normalPDF(x, m = 1, v = 0) {
    return Math.exp(-((x - m) ** 2) / (2 * v)) / Math.sqrt(2 * Math.PI * v);
}
const G = 7;
const P = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
];
function gamma(z) {
    if (z < 0.5)
        return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1;
    let x = P[0];
    for (let i = 1; i < G + 2; i++)
        x += P[i] / (z + i);
    const t = z + G + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}
/** Riemann-integrates fn(x) from xMin to xMax with an interval size dx. */
function integrate(fn, xMin, xMax, dx = 1) {
    let result = 0;
    for (let x = xMin; x < xMax; x += dx) {
        result += (fn(x) * dx || 0);
    }
    return result;
}
/** The chi CDF function. */
function chiCDF(chi, deg) {
    const int = integrate(t => Math.pow(t, (deg - 2) / 2) * Math.exp(-t / 2), 0, chi);
    return 1 - int / Math.pow(2, deg / 2) / gamma(deg / 2);
}

var random = /*#__PURE__*/Object.freeze({
    __proto__: null,
    shuffle: shuffle,
    integer: integer,
    weighted: weighted,
    smart: smart,
    bernoulli: bernoulli,
    binomial: binomial$1,
    poisson: poisson,
    uniform: uniform,
    normal: normal,
    exponential: exponential,
    geometric: geometric,
    cauchy: cauchy,
    normalPDF: normalPDF,
    integrate: integrate,
    chiCDF: chiCDF
});

// =============================================================================
const TWO_PI = 2 * Math.PI;
function rad(p, c) {
    const a = Math.atan2(p.y - (c ? c.y : 0), p.x - (c ? c.x : 0));
    return mod(a, TWO_PI);
}

// =============================================================================
/** A single point class defined by two coordinates x and y. */
class Point {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.type = 'point';
    }
    get unitVector() {
        if (nearlyEquals(this.length, 0))
            return new Point(1, 0);
        return this.scale(1 / this.length);
    }
    get length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    get inverse() {
        return new Point(-this.x, -this.y);
    }
    get flip() {
        return new Point(this.y, this.x);
    }
    get perpendicular() {
        return new Point(-this.y, this.x);
    }
    get array() {
        return [this.x, this.y];
    }
    /** Finds the perpendicular distance between this point and a line. */
    distanceFromLine(l) {
        return Point.distance(this, l.project(this));
    }
    /** Clamps this point to specific bounds. */
    clamp(bounds, padding = 0) {
        const x = clamp(this.x, bounds.xMin + padding, bounds.xMax - padding);
        const y = clamp(this.y, bounds.yMin + padding, bounds.yMax - padding);
        return new Point(x, y);
    }
    changeCoordinates(originCoords, targetCoords) {
        const x = targetCoords.xMin + (this.x - originCoords.xMin) /
            (originCoords.dx) * (targetCoords.dx);
        const y = targetCoords.yMin + (this.y - originCoords.yMin) /
            (originCoords.dy) * (targetCoords.dy);
        return new Point(x, y);
    }
    add(p) {
        return Point.sum(this, p);
    }
    subtract(p) {
        return Point.difference(this, p);
    }
    round(inc = 1) {
        return new Point(roundTo(this.x, inc), roundTo(this.y, inc));
    }
    floor() {
        return new Point(Math.floor(this.x), Math.floor(this.y));
    }
    mod(x, y = x) {
        return new Point(this.x % x, this.y % y);
    }
    angle(c = ORIGIN) {
        return rad(this, c);
    }
    /** Calculates the average of multiple points. */
    static average(...points) {
        const x = total(points.map(p => p.x)) / points.length;
        const y = total(points.map(p => p.y)) / points.length;
        return new Point(x, y);
    }
    /** Calculates the dot product of two points p1 and p2. */
    static dot(p1, p2) {
        return p1.x * p2.x + p1.y * p2.y;
    }
    static sum(p1, p2) {
        return new Point(p1.x + p2.x, p1.y + p2.y);
    }
    static difference(p1, p2) {
        return new Point(p1.x - p2.x, p1.y - p2.y);
    }
    /** Returns the Euclidean distance between two points p1 and p2. */
    static distance(p1, p2) {
        return Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y));
    }
    /** Returns the Manhattan distance between two points p1 and p2. */
    static manhattan(p1, p2) {
        return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
    }
    /** Interpolates two points p1 and p2 by a factor of t. */
    static interpolate(p1, p2, t = 0.5) {
        return new Point(lerp(p1.x, p2.x, t), lerp(p1.y, p2.y, t));
    }
    /** Interpolates a list of multiple points. */
    static interpolateList(points, t = 0.5) {
        const n = points.length - 1;
        const a = Math.floor(clamp(t, 0, 1) * n);
        return Point.interpolate(points[a], points[a + 1], n * t - a);
    }
    /** Creates a point from polar coordinates. */
    static fromPolar(angle, r = 1) {
        return new Point(r * Math.cos(angle), r * Math.sin(angle));
    }
    static random(b) {
        const x = random.uniform(b.xMin, b.xMax);
        const y = random.uniform(b.yMin, b.yMax);
        return new Point(x, y);
    }
    // ---------------------------------------------------------------------------
    /** Transforms this point using a 2x3 matrix m. */
    transform(m) {
        const x = m[0][0] * this.x + m[0][1] * this.y + m[0][2];
        const y = m[1][0] * this.x + m[1][1] * this.y + m[1][2];
        return new Point(x, y);
    }
    /** Rotates this point by a given angle (in radians) around c. */
    rotate(angle, c = ORIGIN) {
        const x0 = this.x - c.x;
        const y0 = this.y - c.y;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = x0 * cos - y0 * sin + c.x;
        const y = x0 * sin + y0 * cos + c.y;
        return new Point(x, y);
    }
    /** Reflects this point across a line l. */
    reflect(l) {
        const v = l.p2.x - l.p1.x;
        const w = l.p2.y - l.p1.y;
        const x0 = this.x - l.p1.x;
        const y0 = this.y - l.p1.y;
        const mu = (v * y0 - w * x0) / (v * v + w * w);
        const x = this.x + 2 * mu * w;
        const y = this.y - 2 * mu * v;
        return new Point(x, y);
    }
    scale(sx, sy = sx) {
        return new Point(this.x * sx, this.y * sy);
    }
    shift(x, y = x) {
        return new Point(this.x + x, this.y + y);
    }
    translate(p) {
        return this.shift(p.x, p.y); // Alias for .add()
    }
    equals(other) {
        // TODO Fix type signature for `other`
        return nearlyEquals(this.x, other.x) && nearlyEquals(this.y, other.y);
    }
}
const ORIGIN = new Point(0, 0);

// =============================================================================
/** An arc segment of a circle, with given center, start point and angle. */
class Arc {
    constructor(c, start, angle) {
        this.c = c;
        this.start = start;
        this.angle = angle;
        this.type = 'arc';
    }
    get radius() {
        return Point.distance(this.c, this.start);
    }
    get end() {
        return this.start.rotate(this.angle, this.c);
    }
    get startAngle() {
        return rad(this.start, this.c);
    }
    contract(p) {
        return new this.constructor(this.c, this.at(p / 2), this.angle * (1 - p));
    }
    get minor() {
        if (this.angle <= Math.PI)
            return this;
        return new this.constructor(this.c, this.end, TWO_PI - this.angle);
    }
    get major() {
        if (this.angle >= Math.PI)
            return this;
        return new this.constructor(this.c, this.end, TWO_PI - this.angle);
    }
    get center() {
        return this.at(0.5);
    }
    // ---------------------------------------------------------------------------
    project(p) {
        const start = this.startAngle;
        const end = start + this.angle;
        let angle = rad(p, this.c);
        if (end > TWO_PI && angle < end - TWO_PI)
            angle += TWO_PI;
        angle = clamp(angle, start, end);
        return this.c.shift(this.radius, 0).rotate(angle, this.c);
    }
    at(t) {
        return this.start.rotate(this.angle * t, this.c);
    }
    contains(_p) {
        // TODO Implement
        return false;
    }
    // ---------------------------------------------------------------------------
    transform(m) {
        return new this.constructor(this.c.transform(m), this.start.transform(m), this.angle);
    }
    rotate(a, c = ORIGIN) {
        return new this.constructor(this.c.rotate(a, c), this.start.rotate(a, c), this.angle);
    }
    reflect(l) {
        return new this.constructor(this.c.reflect(l), this.start.reflect(l), this.angle);
    }
    scale(sx, sy = sx) {
        return new this.constructor(this.c.scale(sx, sy), this.start.scale(sx, sy), this.angle);
    }
    shift(x, y = x) {
        return new this.constructor(this.c.shift(x, y), this.start.shift(x, y), this.angle);
    }
    translate(p) {
        return this.shift(p.x, p.y);
    }
    equals() {
        // TODO Implement
        return false;
    }
}

// =============================================================================
/** An infinite straight line that goes through two points. */
class Line {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.type = 'line';
    }
    make(p1, p2) {
        return new Line(p1, p2);
    }
    /* The distance between the two points defining this line. */
    get length() {
        return Point.distance(this.p1, this.p2);
    }
    /* The squared distance between the two points defining this line. */
    get lengthSquared() {
        return (this.p1.x - this.p2.x) ** 2 + (this.p1.y - this.p2.y) ** 2;
    }
    /** The midpoint of this line. */
    get midpoint() {
        return Point.average(this.p1, this.p2);
    }
    /** The slope of this line. */
    get slope() {
        return (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x);
    }
    /** The y-axis intercept of this line. */
    get intercept() {
        return this.p1.y + this.slope * this.p1.x;
    }
    /** The angle formed between this line and the x-axis. */
    get angle() {
        return rad(this.p2, this.p1);
    }
    /** The point representing a unit vector along this line. */
    get unitVector() {
        return this.p2.subtract(this.p1).unitVector;
    }
    /** The point representing the perpendicular vector of this line. */
    get perpendicularVector() {
        return new Point(this.p2.y - this.p1.y, this.p1.x - this.p2.x).unitVector;
    }
    /** Finds the line parallel to this one, going though point p. */
    parallel(p) {
        const q = Point.sum(p, Point.difference(this.p2, this.p1));
        return new Line(p, q);
    }
    /** Finds the line perpendicular to this one, going though point p. */
    perpendicular(p) {
        return new Line(p, Point.sum(p, this.perpendicularVector));
    }
    /** The perpendicular bisector of this line. */
    get perpendicularBisector() {
        return this.perpendicular(this.midpoint);
    }
    /** Squared distance between a point and a line. */
    distanceSquared(p) {
        const proj = this.project(p);
        return (p.x - proj.x) ** 2 + (p.y - proj.y) ** 2;
    }
    // ---------------------------------------------------------------------------
    /** Projects a point `p` onto this line. */
    project(p) {
        const a = Point.difference(this.p2, this.p1);
        const b = Point.difference(p, this.p1);
        const proj = a.scale(Point.dot(a, b) / this.lengthSquared);
        return Point.sum(this.p1, proj);
    }
    /** Checks if a point p lies on this line. */
    contains(p) {
        // det([[p.x, p.y, 1],[p1.x, p1.y, 1],[p2.x, ,p2.y 1]])
        const det = p.x * (this.p1.y - this.p2.y) + this.p1.x * (this.p2.y - p.y) +
            this.p2.x * (p.y - this.p1.y);
        return nearlyEquals(det, 0);
    }
    at(t) {
        return Point.interpolate(this.p1, this.p2, t);
    }
    // ---------------------------------------------------------------------------
    transform(m) {
        return new this.constructor(this.p1.transform(m), this.p2.transform(m));
    }
    rotate(a, c = ORIGIN) {
        return new this.constructor(this.p1.rotate(a, c), this.p2.rotate(a, c));
    }
    reflect(l) {
        return new this.constructor(this.p1.reflect(l), this.p2.reflect(l));
    }
    scale(sx, sy = sx) {
        return this.make(this.p1.scale(sx, sy), this.p2.scale(sx, sy));
    }
    shift(x, y = x) {
        return this.make(this.p1.shift(x, y), this.p2.shift(x, y));
    }
    translate(p) {
        return this.shift(p.x, p.y);
    }
    equals(other) {
        return this.contains(other.p1) && this.contains(other.p2);
    }
}
/** A finite line segment defined by its two endpoints. */
class Segment extends Line {
    constructor() {
        super(...arguments);
        this.type = 'segment';
    }
    contains(p) {
        if (!Line.prototype.contains.call(this, p))
            return false;
        if (nearlyEquals(this.p1.x, this.p2.x)) {
            return isBetween(p.y, this.p1.y, this.p2.y);
        }
        else {
            return isBetween(p.x, this.p1.x, this.p2.x);
        }
    }
    make(p1, p2) {
        return new Segment(p1, p2);
    }
    project(p) {
        const a = Point.difference(this.p2, this.p1);
        const b = Point.difference(p, this.p1);
        const q = clamp(Point.dot(a, b) / this.lengthSquared, 0, 1);
        return Point.sum(this.p1, a.scale(q));
    }
    /** Contracts (or expands) a line by a specific ratio. */
    contract(x) {
        return new Segment(this.at(x), this.at(1 - x));
    }
    equals(other, oriented = false) {
        if (other.type !== 'segment')
            return false;
        return (this.p1.equals(other.p1) && this.p2.equals(other.p2)) ||
            (!oriented && this.p1.equals(other.p2) && this.p2.equals(other.p1));
    }
}

// =============================================================================
/** A circle with a given center and radius. */
class Circle {
    constructor(c = ORIGIN, r = 1) {
        this.c = c;
        this.r = r;
        this.type = 'circle';
    }
    /** The length of the circumference of this circle. */
    get circumference() {
        return TWO_PI * this.r;
    }
    /** The area of this circle. */
    get area() {
        return Math.PI * this.r ** 2;
    }
    get arc() {
        const start = this.c.shift(this.r, 0);
        return new Arc(this.c, start, TWO_PI);
    }
    tangentAt(t) {
        const p1 = this.at(t);
        const p2 = this.c.rotate(Math.PI / 2, p1);
        return new Line(p1, p2);
    }
    // ---------------------------------------------------------------------------
    project(p) {
        const proj = p.subtract(this.c).unitVector.scale(this.r);
        return Point.sum(this.c, proj);
    }
    at(t) {
        const a = TWO_PI * t;
        return this.c.shift(this.r * Math.cos(a), this.r * Math.sin(a));
    }
    contains(p) {
        return Point.distance(p, this.c) <= this.r;
    }
    // ---------------------------------------------------------------------------
    transform(m) {
        const scale = Math.abs(m[0][0]) + Math.abs(m[1][1]);
        return new Circle(this.c.transform(m), this.r * scale / 2);
    }
    rotate(a, c = ORIGIN) {
        return new Circle(this.c.rotate(a, c), this.r);
    }
    reflect(l) {
        return new Circle(this.c.reflect(l), this.r);
    }
    scale(sx, sy = sx) {
        return new Circle(this.c.scale(sx, sy), this.r * (sx + sy) / 2);
    }
    shift(x, y = x) {
        return new Circle(this.c.shift(x, y), this.r);
    }
    translate(p) {
        return this.shift(p.x, p.y);
    }
    equals(other) {
        return nearlyEquals(this.r, other.r) && this.c.equals(other.c);
    }
}

// =============================================================================
// Euclid.js | Type Checking
// (c) Mathigon
// =============================================================================
function isPolygonLike(shape) {
    return ['polygon', 'polyline', 'rectangle', 'triangle'].includes(shape.type);
}
function isLineLike(shape) {
    return ['line', 'ray', 'segment'].includes(shape.type);
}
function isCircle(shape) {
    return shape.type === 'circle';
}

// =============================================================================
function liesOnSegment(s, p) {
    if (nearlyEquals(s.p1.x, s.p2.x))
        return isBetween(p.y, s.p1.y, s.p2.y);
    return isBetween(p.x, s.p1.x, s.p2.x);
}
function liesOnRay(r, p) {
    if (nearlyEquals(r.p1.x, r.p2.x)) {
        return (p.y - r.p1.y) / (r.p2.y - r.p1.y) > 0;
    }
    return (p.x - r.p1.x) / (r.p2.x - r.p1.x) > 0;
}
function lineLineIntersection(l1, l2) {
    const d1x = l1.p1.x - l1.p2.x;
    const d1y = l1.p1.y - l1.p2.y;
    const d2x = l2.p1.x - l2.p2.x;
    const d2y = l2.p1.y - l2.p2.y;
    const d = d1x * d2y - d1y * d2x;
    if (nearlyEquals(d, 0))
        return []; // Colinear lines never intersect
    const q1 = l1.p1.x * l1.p2.y - l1.p1.y * l1.p2.x;
    const q2 = l2.p1.x * l2.p2.y - l2.p1.y * l2.p2.x;
    const x = q1 * d2x - d1x * q2;
    const y = q1 * d2y - d1y * q2;
    return [new Point(x / d, y / d)];
}
function circleCircleIntersection(c1, c2) {
    const d = Point.distance(c1.c, c2.c);
    // Circles are separate:
    if (d > c1.r + c2.r)
        return [];
    // One circles contains the other:
    if (d < Math.abs(c1.r - c2.r))
        return [];
    // Circles are the same:
    if (nearlyEquals(d, 0) && nearlyEquals(c1.r, c2.r))
        return [];
    // Circles touch:
    if (nearlyEquals(d, c1.r + c2.r))
        return [new Line(c1.c, c2.c).midpoint];
    const a = (square(c1.r) - square(c2.r) + square(d)) / (2 * d);
    const b = Math.sqrt(square(c1.r) - square(a));
    const px = (c2.c.x - c1.c.x) * a / d + (c2.c.y - c1.c.y) * b / d + c1.c.x;
    const py = (c2.c.y - c1.c.y) * a / d - (c2.c.x - c1.c.x) * b / d + c1.c.y;
    const qx = (c2.c.x - c1.c.x) * a / d - (c2.c.y - c1.c.y) * b / d + c1.c.x;
    const qy = (c2.c.y - c1.c.y) * a / d + (c2.c.x - c1.c.x) * b / d + c1.c.y;
    return [new Point(px, py), new Point(qx, qy)];
}
// From http://mathworld.wolfram.com/Circle-LineIntersection.html
function lineCircleIntersection(l, c) {
    const dx = l.p2.x - l.p1.x;
    const dy = l.p2.y - l.p1.y;
    const dr2 = square(dx) + square(dy);
    const cx = c.c.x;
    const cy = c.c.y;
    const D = (l.p1.x - cx) * (l.p2.y - cy) - (l.p2.x - cx) * (l.p1.y - cy);
    const disc = square(c.r) * dr2 - square(D);
    if (disc < 0)
        return []; // No solution
    const xa = D * dy / dr2;
    const ya = -D * dx / dr2;
    if (nearlyEquals(disc, 0))
        return [c.c.shift(xa, ya)]; // One solution
    const xb = dx * (dy < 0 ? -1 : 1) * Math.sqrt(disc) / dr2;
    const yb = Math.abs(dy) * Math.sqrt(disc) / dr2;
    return [c.c.shift(xa + xb, ya + yb), c.c.shift(xa - xb, ya - yb)];
}
/** Finds the intersection of two lines or circles. */
function simpleIntersection(a, b) {
    let results = [];
    // TODO Handle Arcs and Rays
    if (isLineLike(a) && isLineLike(b)) {
        results = lineLineIntersection(a, b);
    }
    else if (isLineLike(a) && isCircle(b)) {
        results = lineCircleIntersection(a, b);
    }
    else if (isCircle(a) && isLineLike(b)) {
        results = lineCircleIntersection(b, a);
    }
    else if (isCircle(a) && isCircle(b)) {
        results = circleCircleIntersection(a, b);
    }
    for (const x of [a, b]) {
        if (x.type === 'segment') {
            results = results.filter(i => liesOnSegment(x, i));
        }
        if (x.type === 'ray')
            results = results.filter(i => liesOnRay(x, i));
    }
    return results;
}
/** Returns the intersection of two or more geometry objects. */
function intersections(...elements) {
    if (elements.length < 2)
        return [];
    if (elements.length > 2) {
        return flatten(subsets(elements, 2).map(e => intersections(...e)));
    }
    let [a, b] = elements;
    if (isPolygonLike(b))
        [a, b] = [b, a];
    if (isPolygonLike(a)) {
        // This hack is necessary to capture intersections between a line and a
        // vertex of a polygon. There are more edge cases to consider!
        const results = isLineLike(b) ? a.points.filter(p => b.contains(p)) : [];
        for (const e of a.edges)
            results.push(...intersections(e, b));
        return results;
    }
    // TODO Handle arcs, sectors and angles!
    return simpleIntersection(a, b);
}

// =============================================================================
/** A polygon defined by its vertex points. */
class Polygon {
    constructor(...points) {
        this.type = 'polygon';
        this.points = points;
    }
    get circumference() {
        if (this.points.length <= 1)
            return 0;
        let length = Point.distance(this.points[0], last(this.points));
        for (let i = 1; i < this.points.length; ++i) {
            length += Point.distance(this.points[i - 1], this.points[i]);
        }
        return length;
    }
    /**
     * The (signed) area of this polygon. The result is positive if the vertices
     * are ordered clockwise, and negative otherwise.
     */
    get signedArea() {
        const p = this.points;
        const n = p.length;
        let A = p[n - 1].x * p[0].y - p[0].x * p[n - 1].y;
        for (let i = 1; i < n; ++i) {
            A += p[i - 1].x * p[i].y - p[i].x * p[i - 1].y;
        }
        return A / 2;
    }
    get area() {
        return Math.abs(this.signedArea);
    }
    get centroid() {
        const p = this.points;
        const n = p.length;
        let Cx = 0;
        for (let i = 0; i < n; ++i)
            Cx += p[i].x;
        let Cy = 0;
        for (let i = 0; i < n; ++i)
            Cy += p[i].y;
        return new Point(Cx / n, Cy / n);
    }
    get edges() {
        const p = this.points;
        const n = p.length;
        const edges = [];
        for (let i = 0; i < n; ++i)
            edges.push(new Segment(p[i], p[(i + 1) % n]));
        return edges;
    }
    get radius() {
        const c = this.centroid;
        const radii = this.points.map(p => Point.distance(p, c));
        return Math.max(...radii);
    }
    /** The oriented version of this polygon (vertices in clockwise order). */
    get oriented() {
        if (this.signedArea >= 0)
            return this;
        const points = [...this.points].reverse();
        return new this.constructor(...points);
    }
    /**
     * The intersection of this and another polygon, calculated using the
     * Weiler–Atherton clipping algorithm
     */
    intersect(polygon) {
        // TODO Support intersections with multiple disjoint overlapping areas.
        // TODO Support segments intersecting at their endpoints
        const points = [toLinkedList(this.oriented.points),
            toLinkedList(polygon.oriented.points)];
        const max = this.points.length + polygon.points.length;
        const result = [];
        let which = 0;
        let active = points[which].find(p => polygon.contains(p.val));
        if (!active)
            return undefined; // No intersection
        while (active.val !== result[0] && result.length < max) {
            result.push(active.val);
            const nextEdge = new Segment(active.val, active.next.val);
            active = active.next;
            for (const p of points[1 - which]) {
                const testEdge = new Segment(p.val, p.next.val);
                const intersect = intersections(nextEdge, testEdge)[0];
                if (intersect) {
                    which = 1 - which; // Switch active polygon
                    active = { val: intersect, next: p.next };
                    break;
                }
            }
        }
        return new Polygon(...result);
    }
    /** Checks if two polygons p1 and p2 collide. */
    static collision(p1, p2) {
        // Check if any of the edges overlap.
        for (const e1 of p1.edges) {
            for (const e2 of p2.edges) {
                if (intersections(e1, e2)[0])
                    return true;
            }
        }
        // Check if one of the vertices is in one of the polygons.
        return p2.contains(p1.points[0]) || p1.contains(p2.points[0]);
    }
    /** Creates a regular polygon. */
    static regular(n, radius = 1) {
        const da = TWO_PI / n;
        const a0 = Math.PI / 2 - da / 2;
        const points = tabulate((i) => Point.fromPolar(a0 + da * i, radius), n);
        return new Polygon(...points);
    }
    /** Interpolates the points of two polygons */
    static interpolate(p1, p2, t = 0.5) {
        // TODO support interpolating polygons with different numbers of points
        const points = p1.points.map((p, i) => Point.interpolate(p, p2.points[i], t));
        return new Polygon(...points);
    }
    // ---------------------------------------------------------------------------
    /**
     * Checks if a point p lies inside this polygon, by using a ray-casting
     * algorithm and calculating the number of intersections.
     */
    contains(p) {
        let inside = false;
        for (const e of this.edges) {
            // Exclude points lying *on* the edge.
            if (e.p1.equals(p) || e.contains(p))
                return false;
            if ((e.p1.y > p.y) === (e.p2.y > p.y))
                continue;
            const det = (e.p2.x - e.p1.x) / (e.p2.y - e.p1.y);
            if (p.x < det * (p.y - e.p1.y) + e.p1.x)
                inside = !inside;
        }
        return inside;
    }
    at(t) {
        return Point.interpolateList([...this.points, this.points[0]], t);
    }
    project(p) {
        let q = undefined;
        let d = Infinity;
        for (const e of this.edges) {
            const q1 = e.project(p);
            const d1 = Point.distance(p, q1);
            if (d1 < d) {
                q = q1;
                d = d1;
            }
        }
        return q || this.points[0];
    }
    // ---------------------------------------------------------------------------
    transform(m) {
        return new this.constructor(...this.points.map(p => p.transform(m)));
    }
    rotate(a, center = ORIGIN) {
        const points = this.points.map(p => p.rotate(a, center));
        return new this.constructor(...points);
    }
    reflect(line) {
        const points = this.points.map(p => p.reflect(line));
        return new this.constructor(...points);
    }
    scale(sx, sy = sx) {
        const points = this.points.map(p => p.scale(sx, sy));
        return new this.constructor(...points);
    }
    shift(x, y = x) {
        const points = this.points.map(p => p.shift(x, y));
        return new this.constructor(...points);
    }
    translate(p) {
        return this.shift(p.x, p.y);
    }
    equals(_other) {
        // TODO Implement
        return false;
    }
}
/** A triangle defined by its three vertices. */
class Triangle extends Polygon {
    constructor() {
        super(...arguments);
        this.type = 'triangle';
    }
    get circumcircle() {
        const [a, b, c] = this.points;
        const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
        const ux = (a.x ** 2 + a.y ** 2) * (b.y - c.y) +
            (b.x ** 2 + b.y ** 2) * (c.y - a.y) +
            (c.x ** 2 + c.y ** 2) * (a.y - b.y);
        const uy = (a.x ** 2 + a.y ** 2) * (c.x - b.x) +
            (b.x ** 2 + b.y ** 2) * (a.x - c.x) +
            (c.x ** 2 + c.y ** 2) * (b.x - a.x);
        const center = new Point(ux / d, uy / d);
        const radius = Point.distance(center, this.points[0]);
        return new Circle(center, radius);
    }
    get incircle() {
        const edges = this.edges;
        const sides = edges.map(e => e.length);
        const total = sides[0] + sides[1] + sides[2];
        const [a, b, c] = this.points;
        const ux = sides[1] * a.x + sides[2] * b.x + sides[0] * c.x;
        const uy = sides[1] * a.y + sides[2] * b.y + sides[0] * c.y;
        const center = new Point(ux / total, uy / total);
        const radius = center.distanceFromLine(edges[0]);
        return new Circle(center, radius);
    }
    get orthocenter() {
        const [a, b, c] = this.points;
        const h1 = new Line(a, b).perpendicular(c);
        const h2 = new Line(a, c).perpendicular(b);
        return intersections(h1, h2)[0];
    }
}

// =============================================================================
/** A rectangle, defined by its top left vertex, width and height. */
class Rectangle {
    constructor(p, w = 1, h = w) {
        this.p = p;
        this.w = w;
        this.h = h;
        this.type = 'rectangle';
    }
    /** Creates the smallest rectangle containing all given points. */
    static aroundPoints(...points) {
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        const x = Math.min(...xs);
        const w = Math.max(...xs) - x;
        const y = Math.min(...ys);
        const h = Math.max(...ys) - y;
        return new Rectangle(new Point(x, y), w, h);
    }
    get center() {
        return new Point(this.p.x + this.w / 2, this.p.y + this.h / 2);
    }
    get centroid() {
        return this.center;
    }
    get circumference() {
        return 2 * Math.abs(this.w) + 2 * Math.abs(this.h);
    }
    get area() {
        return Math.abs(this.w * this.h);
    }
    /** @returns {Segment[]} */
    get edges() {
        return this.polygon.edges;
    }
    /** @returns {Point[]} */
    get points() {
        return this.polygon.points;
    }
    /** A polygon class representing this rectangle. */
    get polygon() {
        const b = new Point(this.p.x + this.w, this.p.y);
        const c = new Point(this.p.x + this.w, this.p.y + this.h);
        const d = new Point(this.p.x, this.p.y + this.h);
        return new Polygon(this.p, b, c, d);
    }
    // ---------------------------------------------------------------------------
    contains(p) {
        return isBetween(p.x, this.p.x, this.p.x + this.w) &&
            isBetween(p.y, this.p.y, this.p.y + this.h);
    }
    project(p) {
        let q = undefined;
        for (const e of this.edges) {
            const q1 = e.project(p);
            if (!q || Point.distance(p, q1) < Point.distance(p, q))
                q = q1;
        }
        return q;
    }
    at(_t) {
        // TODO Implement
        return this.p;
    }
    // ---------------------------------------------------------------------------
    transform(m) {
        return this.polygon.transform(m);
    }
    rotate(a, c = ORIGIN) {
        return this.polygon.rotate(a, c);
    }
    reflect(l) {
        return this.polygon.reflect(l);
    }
    scale(sx, sy = sx) {
        return new Rectangle(this.p.scale(sx, sy), this.w * sx, this.h * sy);
    }
    shift(x, y = x) {
        return new Rectangle(this.p.shift(x, y), this.w, this.h);
    }
    translate(p) {
        return this.shift(p.x, p.y);
    }
    equals(_other) {
        // TODO Implement
        return false;
    }
}

// =============================================================================
class Bounds {
    constructor(xMin, xMax, yMin, yMax) {
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
    }
    contains(p) {
        return this.containsX(p) && this.containsY(p);
    }
    containsX(p) {
        return isBetween(p.x, this.xMin, this.xMax);
    }
    containsY(p) {
        return isBetween(p.y, this.yMin, this.yMax);
    }
    get dx() {
        return this.xMax - this.xMin;
    }
    get dy() {
        return this.yMax - this.yMin;
    }
    get xRange() {
        return [this.xMin, this.xMax];
    }
    get yRange() {
        return [this.yMin, this.yMax];
    }
    get rect() {
        return new Rectangle(new Point(this.xMin, this.xMin), this.dx, this.dy);
    }
}

const clamp$1 = (min, value, max) => (Math.min(Math.max(value, min), max));
const getVelocityFromDirection = (direction) => {
    switch (direction) {
        case 1 /* UP */: return new Point(0, -1);
        case 2 /* DOWN */: return new Point(0, 1);
        case 3 /* LEFT */: return new Point(-1, 0);
        case 4 /* RIGHT */: return new Point(1, 0);
        default: return new Point(0, 0);
    }
};

const BULLET_RADIUS = 0.20;
const BULLET_SPEED = 800;
class Bullet {
    constructor(direction, position, colors) {
        this.colors = colors;
        this.velocity = getVelocityFromDirection(direction);
        this.body = new Circle(position, BULLET_RADIUS);
    }
    update(secondsPassed) {
        this.body = this.body.shift(this.velocity.x * BULLET_SPEED * (secondsPassed ** 2), this.velocity.y * BULLET_SPEED * (secondsPassed ** 2));
    }
    intersects(shape) {
        return !!intersections(this.body, shape).length;
    }
}

class BasicWall {
    constructor(position) {
        this.colors = {
            fill: '#40390d',
            border: '#fffce5',
            shadow: 'transparent',
        };
        this.isDestroyed = false;
        this.body = new Rectangle(position, 1, 1);
    }
    markAsDestroyed() {
        this.isDestroyed = true;
    }
    collide(entity) {
        var _a;
        if (entity instanceof BaseTank
            && ((_a = entity.bullet) === null || _a === void 0 ? void 0 : _a.intersects(this.body))) {
            entity.destroyBullet();
            this.markAsDestroyed();
        }
    }
}

const TRIANGLE_WIDTH = 1;
const TRIANGLE_HEIGHT = 0.7;
const TANK_SPEED = 500;
class BaseTank {
    constructor(pos, colors) {
        this.pos = pos;
        this.colors = {
            fill: '#fff',
            border: '#fff',
            shadow: 'transparent',
        };
        this.body = new Triangle();
        this.bullet = null;
        this.positionInternal = new Point(0, 0);
        this.health = 1;
        this.velocity = new Point(0, 0);
        this.facing = 1 /* UP */;
        this.shouldIgnoreOneUpdate = false;
        this.spawnPoint = pos;
        this.position = pos;
        this.colors = colors;
    }
    get position() {
        return this.positionInternal;
    }
    set position(pos) {
        this.positionInternal = pos;
        const { facing } = this;
        const { x, y } = pos;
        const sizeX = TRIANGLE_WIDTH;
        const sizeY = TRIANGLE_HEIGHT;
        if (facing === 1 /* UP */) {
            this.body = new Triangle(new Point(x + sizeX / 2, y), new Point(x + sizeX, y + sizeY), new Point(x, y + sizeY));
        }
        else if (facing === 2 /* DOWN */) {
            this.body = new Triangle(new Point(x, y), new Point(x + sizeX, y), new Point(x + sizeX / 2, y + sizeY));
        }
        else if (facing === 4 /* RIGHT */) {
            this.body = new Triangle(new Point(x, y), new Point(x + sizeY, y + sizeX / 2), new Point(x, y + sizeX));
        }
        else if (facing === 3 /* LEFT */) {
            this.body = new Triangle(new Point(x + sizeY, y), new Point(x + sizeY, y + sizeX), new Point(x, y + sizeX / 2));
        }
    }
    getSizeAdjustedForDirection() {
        return this.facing === 1 /* UP */ || this.facing === 2 /* DOWN */
            ? new Point(TRIANGLE_WIDTH, TRIANGLE_HEIGHT)
            : new Point(TRIANGLE_HEIGHT, TRIANGLE_WIDTH);
    }
    getHealth() {
        return this.health;
    }
    fireBullet() {
        if (!this.bullet) {
            this.bullet = new Bullet(this.facing, this.body.orthocenter, this.colors);
        }
    }
    destroyBullet() {
        this.bullet = null;
    }
    gotHitByTheExternalBullet() {
        this.health -= 1;
        if (this.health > 0) {
            this.position = this.spawnPoint;
        }
    }
    move(direction) {
        if (direction !== 0 /* STILL */) {
            this.shouldIgnoreOneUpdate = this.facing !== direction;
            this.facing = direction;
        }
        this.velocity = getVelocityFromDirection(direction);
    }
    update(secondsPassed) {
        var _a;
        (_a = this.bullet) === null || _a === void 0 ? void 0 : _a.update(secondsPassed);
        if (this.shouldIgnoreOneUpdate) {
            return;
        }
        const { velocity } = this;
        const velocityIncrease = TANK_SPEED * (secondsPassed ** 2);
        this.position = this.position.shift(velocity.x * velocityIncrease, velocity.y * velocityIncrease);
    }
    collide(entity) {
        if (entity instanceof BaseTank && entity.bullet) {
            const { bullet: externalBullet } = entity;
            const hitBullet = this.bullet && externalBullet.intersects(this.bullet.body);
            const hitTank = !hitBullet && externalBullet.intersects(this.body);
            if (hitBullet || hitTank) {
                entity.destroyBullet();
            }
            if (hitBullet) {
                this.destroyBullet();
            }
            else if (hitTank) {
                this.gotHitByTheExternalBullet();
            }
        }
        if (entity instanceof BasicWall && intersections(this.body, entity.body).length) {
            this.velocity = new Point(this.velocity.x * -1, this.velocity.y * -1);
        }
    }
    collideMapBounds(bounds) {
        var _a;
        const size = this.getSizeAdjustedForDirection();
        this.position = new Point(clamp$1(bounds.xMin, this.position.x, bounds.xMax - size.x), clamp$1(bounds.yMin, this.position.y, bounds.yMax - size.y));
        if ((_a = this.bullet) === null || _a === void 0 ? void 0 : _a.intersects(bounds.rect)) {
            this.destroyBullet();
        }
    }
}

class PlayerTank extends BaseTank {
    constructor(controls, pos, colors) {
        super(pos, colors);
        this.controls = controls;
        this.health = 3;
    }
    keyboardAction(keyCode, isPressed) {
        Object.entries(this.controls).forEach(([key, value]) => {
            if (key !== keyCode) {
                return;
            }
            if (value !== 'fire') {
                this.move(isPressed ? value : 0 /* STILL */);
            }
            else if (isPressed) {
                this.fireBullet();
            }
        });
    }
}

class ArmoredWall extends BasicWall {
    constructor() {
        super(...arguments);
        this.colors = {
            fill: '#fffce5',
            border: 'transparent',
            shadow: 'transparent',
        };
    }
    markAsDestroyed() { }
}

const parsePlayers = (jsonPlayers) => {
    const playersData = new Map();
    jsonPlayers.forEach((player) => {
        const { colors, controls } = player;
        const value = {
            colors: {
                fill: colors.fill,
                border: colors.glow,
                shadow: colors.glow,
            },
            controls: {
                [controls.up]: 1 /* UP */,
                [controls.down]: 2 /* DOWN */,
                [controls.left]: 3 /* LEFT */,
                [controls.right]: 4 /* RIGHT */,
                [controls.fire]: 'fire',
            },
        };
        playersData.set(player.spawn, value);
    });
    return playersData;
};
const mapTileCodeToEntity = (tileCode) => {
    switch (tileCode) {
        case '#': return BasicWall;
        case '@': return ArmoredWall;
        case '0': return PlayerTank;
        case '1': return PlayerTank;
        default: return null;
    }
};
const createEntity = (tileCode, p, playersData) => {
    const EntityClass = mapTileCodeToEntity(tileCode);
    if (EntityClass === BasicWall || EntityClass === ArmoredWall) {
        return new EntityClass(p);
    }
    const playerData = playersData.get(tileCode);
    if (EntityClass === PlayerTank && playerData) {
        return new EntityClass(playerData.controls, p, playerData.colors);
    }
    return null;
};
const parseLevel = (levelJSON) => {
    const playersData = parsePlayers(levelJSON.players);
    const { map } = levelJSON;
    const parsedMapInRows = map.tiles.map((row, y) => {
        const parsedRow = [...row].map((tileCode, x) => (createEntity(tileCode, new Point(x, y), playersData)));
        return parsedRow.filter((e) => e !== null);
    });
    return {
        entities: parsedMapInRows.flat(),
        mapSize: new Point(map.size.x, map.size.y),
    };
};
const loadLevel = async (levelNumber) => {
    const response = await fetch(`/levels/${levelNumber}.json`);
    const result = await response.json();
    return {
        levelNumber,
        ...parseLevel(result),
    };
};

class Timer {
    constructor(tickFn) {
        this.tickFn = tickFn;
        this.prevTime = 0;
        this.isRunning = false;
        this.tick = this.tick.bind(this);
    }
    tick(now) {
        if (!this.isRunning) {
            return;
        }
        if (this.prevTime === -1) {
            this.prevTime = now;
        }
        const secondsPassed = (now - this.prevTime) / 1000;
        this.prevTime = now;
        this.tickFn(secondsPassed);
        window.requestAnimationFrame(this.tick);
    }
    start() {
        this.prevTime = -1;
        this.isRunning = true;
        window.requestAnimationFrame(this.tick);
    }
    stop() {
        this.isRunning = false;
    }
}

const CURRENT_LEVEL = 1;
class Game extends EventTarget {
    constructor(ctx, width = 500, height = 500) {
        super();
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.entities = [];
        this.isGameRunning = false;
        this.tileSize = 50;
        this.bounds = new Bounds(0, 0, 0, 0);
        this.prevGameState = {
            isRunning: false,
            playersHealth: [],
        };
        this.timer = new Timer(this.update.bind(this));
        const events = ['keydown', 'keyup'];
        events.forEach((eventName) => {
            window.addEventListener(eventName, (e) => {
                if (!this.isGameRunning) {
                    return;
                }
                const isKeyDown = e.type === 'keydown';
                const { code } = e;
                this.getPlayers().forEach((pl) => pl.keyboardAction(code, isKeyDown));
            });
        });
    }
    getPlayers() {
        return this.entities.filter((entity) => entity instanceof PlayerTank);
    }
    getPlayersHealth() {
        return this.getPlayers().map((pl) => pl.getHealth());
    }
    resize(w = this.width, h = this.height) {
        this.width = Math.min(w, h);
        this.height = this.width;
        this.tileSize = Math.min(this.width / this.bounds.xMax, this.height / this.bounds.yMax);
    }
    dispatchEventIfStateChanged() {
        const newState = {
            isRunning: this.isGameRunning,
            playersHealth: this.getPlayersHealth(),
        };
        const didStateChange = Object.entries(newState).some(([key, value]) => (this.prevGameState[key] !== value));
        if (didStateChange) {
            this.prevGameState = newState;
            this.dispatchEvent(new CustomEvent('game-state', {
                detail: newState,
            }));
        }
    }
    startGame() {
        loadLevel(CURRENT_LEVEL).then((levelData) => {
            const { entities, mapSize } = levelData;
            this.entities = entities;
            this.bounds = new Bounds(0, mapSize.x, 0, mapSize.y);
            this.resize();
            this.draw();
            this.isGameRunning = true;
            this.dispatchEventIfStateChanged();
            this.timer.start();
        }).catch(() => '');
    }
    stopGame() {
        this.isGameRunning = false;
        this.clearDrawScreen();
    }
    update(secondsPassed) {
        this.entities.forEach((entity) => {
            var _a, _b;
            (_a = entity.update) === null || _a === void 0 ? void 0 : _a.call(entity, secondsPassed);
            (_b = entity.collideMapBounds) === null || _b === void 0 ? void 0 : _b.call(entity, this.bounds);
        });
        this.entities.forEach((e1) => {
            this.entities.forEach((e2) => {
                var _a;
                const bothEntitiesAreWall = e1 instanceof BasicWall && e2 instanceof BasicWall;
                if (!bothEntitiesAreWall && e1 !== e2) {
                    (_a = e1.collide) === null || _a === void 0 ? void 0 : _a.call(e1, e2);
                }
            });
        });
        this.entities = this.entities.filter((entity) => (!(entity instanceof BasicWall) || !entity.isDestroyed));
        this.entities.forEach((entity) => {
            if (entity instanceof BaseTank
                && entity.getHealth() < 1) {
                this.stopGame();
            }
        });
        this.draw();
        this.dispatchEventIfStateChanged();
    }
    clearDrawScreen() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    setDrawEntityStyles(lineWidth, { colors }) {
        const { ctx } = this;
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = colors.border;
        ctx.fillStyle = colors.fill;
        ctx.shadowColor = colors.shadow;
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
    }
    draw() {
        this.clearDrawScreen();
        this.entities.forEach((entity) => {
            if (entity instanceof BasicWall) {
                this.drawWall(entity);
            }
            else if (entity instanceof BaseTank) {
                this.drawTank(entity);
                this.drawBullet(entity.bullet);
            }
        });
    }
    drawWall(wall) {
        const { ctx, tileSize } = this;
        const { p, w, h } = wall.body;
        this.setDrawEntityStyles(1, wall);
        ctx.beginPath();
        ctx.rect(p.x * tileSize, p.y * tileSize, w * tileSize, h * tileSize);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    drawTank(tank) {
        const { ctx, tileSize } = this;
        const { points } = tank.body;
        const { x, y } = points[0];
        this.setDrawEntityStyles(2, tank);
        ctx.moveTo(x * tileSize, y * tileSize);
        ctx.beginPath();
        points.forEach((point, i) => {
            if (i !== 0) {
                ctx.lineTo(point.x * tileSize, point.y * tileSize);
            }
        });
        ctx.lineTo(x * tileSize, y * tileSize);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    }
    drawBullet(bullet) {
        if (!bullet) {
            return;
        }
        const { ctx, tileSize } = this;
        const { body } = bullet;
        this.setDrawEntityStyles(2, bullet);
        ctx.beginPath();
        ctx.arc(body.c.x * tileSize, body.c.y * tileSize, body.r * tileSize, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();
    }
}

const createStyleSheetSync = (cssText) => {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(cssText);
            return sheet
          };

const styles = createStyleSheetSync(`:host{box-sizing:border-box;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;color:#fff}#game-state{display:flex;flex-direction:column;flex-shrink:0;width:120px;padding:24px 0;font-size:16px}h1{margin:0;font-size:22px;font-family:Roboto,sans-serif}canvas{background:#222}#controls-overlay{position:absolute;z-index:1;height:100%;width:100%;display:flex;justify-content:center;align-items:center;background:rgba(80,136,169,.19)}#controls-overlay[hidden]{visibility:hidden}#game-start-btn{-webkit-appearance:none;-moz-appearance:none;appearance:none;display:flex;align-items:center;padding:0 24px;height:48px;font-size:16px;font-weight:600;text-transform:uppercase;justify-content:center;border:none;border-radius:4px;color:#000;background:#e5faff;box-shadow:0 2px 8px 2px rgba(0,156,204,200%)}`);

const GameShell = (host) => {
    useStyles(() => [styles]);
    const gameRef = useRef(null);
    const [gameState, setGameState] = useState({
        isRunning: false,
        playersHealth: [],
    });
    const [canvasSize, setCanvasSize] = useState(0);
    useLayoutEffect(() => {
        var _a;
        const canvasEl = (_a = host.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('canvas');
        const ctx = canvasEl === null || canvasEl === void 0 ? void 0 : canvasEl.getContext('2d');
        if (!ctx) {
            return;
        }
        gameRef.current = new Game(ctx);
        gameRef.current.addEventListener('game-state', (e) => {
            const { detail } = e;
            setGameState(detail);
        });
        const ro = new ResizeObserver(([{ contentRect }]) => {
            const size = Math.min(Math.min(contentRect.width, contentRect.height));
            setCanvasSize(size);
        });
        ro.observe(document.documentElement);
    }, []);
    useLayoutEffect(() => {
        var _a;
        (_a = gameRef.current) === null || _a === void 0 ? void 0 : _a.resize(canvasSize, canvasSize);
    }, [canvasSize]);
    const onGameStartClickHandle = () => {
        var _a;
        (_a = gameRef.current) === null || _a === void 0 ? void 0 : _a.startGame();
    };
    return html `
    <div id='game-state' style=${`opacity: ${gameState.isRunning ? '1' : '0'}`}>
      <h1>Health</h1>
      <div>
        ${gameState.playersHealth.map((health, index) => html `
          <div>Player ${index + 1}: ${health}</div>
        `)}
      </div>
    </div>
    <canvas width=${canvasSize} height=${canvasSize}></canvas>
    <div id='controls-overlay' ?hidden=${gameState.isRunning}>
      <button
          id='game-start-btn'
          @click=${onGameStartClickHandle}
      >
        Start game
      </button>
    </div>
  `;
};
defineElement('game-shell', GameShell);

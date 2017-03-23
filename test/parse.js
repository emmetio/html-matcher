'use strict';

const assert = require('assert');
require('babel-register');
const parse = require('../index').default;

const html = `<ul>
	<li><a href="">text <img src="foo.png"><link rel="sample"> <b></b></a></li>
	<li><a href="">text <b></b></a></li>
</ul>`;

const xml = `<ul>
	<li><a href="">text
		<img src="foo.png">
			<link rel="sample" />
		</img>
		<b></b>
	</a></li>
	<li><a href="">text <b></b></a></li>
</ul>`;

describe('Parse', () => {
	it('html', () => {
		const doc = parse(html);
		assert(doc);
		assert.equal(doc.children.length, 1);

		assert.equal(doc.firstChild.name, 'ul');
		assert(doc.firstChild.open);
		assert(doc.firstChild.close);
		assert.equal(doc.firstChild.start, 0);
		assert.equal(doc.firstChild.end, 125);

		const li1 = doc.firstChild.firstChild;
		assert.equal(li1.name, 'li');
		assert(li1.open);
		assert(li1.close);
		assert.equal(li1.start, 6);
		assert.equal(li1.end, 81);

		const a1 = li1.firstChild;
		assert.equal(a1.name, 'a');
		assert.equal(a1.start, 10);
		assert.equal(a1.end, 76);
		assert.equal(a1.children.length, 3);

		const img = a1.firstChild;
		assert.equal(img.name, 'img');
		assert.equal(img.start, 26);
		assert.equal(img.end, 45);
		assert.equal(img.children.length, 0);

		const link = img.nextSibling;
		assert.equal(link.name, 'link');
		assert.equal(link.start, 45);
		assert.equal(link.end, 64);
		assert.equal(link.children.length, 0);

		const li2 = li1.nextSibling;
		assert.equal(li2.name, 'li');
		assert.equal(li2.start, 83);
		assert.equal(li2.end, 119);
	});

	it('xml', () => {
		const doc = parse(xml, { xml: true });

		const img = doc.firstChild.firstChild.firstChild.firstChild;
		assert.equal(img.name, 'img');
		assert.equal(img.start, 28);
		assert.equal(img.end, 81);
		assert.equal(img.children.length, 1);

		const link = img.firstChild;
		assert.equal(link.name, 'link');
		assert.equal(link.start, 51);
		assert.equal(link.end, 72);
		assert.equal(link.children.length, 0);
	});
});

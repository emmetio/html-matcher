'use strict';

const assert = require('assert');
require('babel-register');
const findPair = require('../index').findPair;

const findPairXML = (content, pos) => findPair(content, pos, { xml: true });
const range = token => [token.start.pos, token.end ? token.end.pos : token.start.pos];
const xmlRange = (content, pos) => range(findPairXML(content, pos));
const htmlRange = (content, pos) => range(findPair(content, pos));

describe('HTML Tag Matcher', () => {
	it.only('xml', () => {
		const xhtml1 = '<p><strong>Hello</strong> world <br /> to all <img src="/path/to/image.png" alt="" /> my <!-- enemies --> friends</p>';
		const xhtml2 = '<span><span><br /><img src="" alt="" /><span></span></span></span><strong><em>hello</em></strong> world';
		const xhtml3 = '<p>Lorem ipsum dolor sit <!-- Don\'t use <b> tag here --> <span>amet</span>, consectetur adipiscing elit. </p>';
		const xhtml4 = '<a><a/><a/></a>';

		const xsl1 = '<xsl:if test="@output"><xsl:value-of select="one" /></xsl:if> <xsl:value-of select="two" /> <xsl:call-template name="tmpl1"/> <div><xsl:call-template name="tmpl2"/></div>';
		const xsl2 = '<input type="text"><xsl:apply-templates select="." mode="form_input_value"/></input>';

		assert.deepEqual(xmlRange(xhtml1, 8),  [3, 25]);
		assert.deepEqual(xmlRange(xhtml1, 36), [32, 38]);
		assert.deepEqual(xmlRange(xhtml1, 70), [46, 85]);
		assert.deepEqual(xmlRange(xhtml1, 43), [0, 117]);
		assert.deepEqual(xmlRange(xhtml1, 99), [89, 105]);

		assert.deepEqual(xmlRange(xhtml2, 39), [6, 59]);
		assert.deepEqual(xmlRange(xhtml2, 52), [6, 59]);
		assert.deepEqual(xmlRange(xhtml2, 57), [6, 59]);
		assert.deepEqual(xmlRange(xhtml2, 3),  [0, 66]);
		assert.deepEqual(xmlRange(xhtml2, 45), [39, 52]);
		assert.deepEqual(xmlRange(xhtml2, 95), [66, 97]);

		assert.deepEqual(xmlRange(xhtml3, 77), [0, 109]);
		assert.deepEqual(xmlRange(xhtml3, 49), [25, 56]);

		assert.deepEqual(xmlRange(xhtml4, 11), [0, 15]);
	});
});

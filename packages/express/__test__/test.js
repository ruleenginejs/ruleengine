const http = require('http');
const request = require('supertest');
const path = require('path');
const ruleengine = require('..');
const rules = require('./fixtures/rules');

describe('ruleengine()', () => {
  describe('initialize', () => {
    it('bad args', async () => {
      expect(() => ruleengine(1)).toThrowError(
        /Rules argument must be an object or function/
      );
      expect(() => ruleengine(null)).toThrowError(
        /Rules argument must be an object or function/
      );
      expect(() => ruleengine(undefined)).toThrowError(
        /Rules argument must be an object or function/
      );
      expect(() => ruleengine(false)).toThrowError(
        /Rules argument must be an object or function/
      );
      expect(() => ruleengine('str')).toThrowError(
        /Rules argument must be an object or function/
      );
    });

    it('ok args', async () => {
      expect(() => ruleengine({})).not.toThrow();
      expect(() => ruleengine(() => {})).not.toThrow();
    });
  });

  describe('execute rules', () => {
    let server;
    beforeEach(() => {
      // eslint-disable-next-line no-unused-vars
      server = createServer(rules, {}, (req, res) => {
        req.params = { id: path.basename(req.url) };
      });
    });

    it('success execute', async () => {
      const response = await request(server).get('/rules/rule.get-users');

      expect(JSON.parse(response.text)).toEqual(require('./fixtures/db/users'));
    });

    it('rule not found', async () => {
      const ruleId = 'rule-not-exists';
      const response = await request(server).get(`/rules/${ruleId}`);

      expect(response.statusCode).toBe(404);
      expect(response.text).toMatch(`Rule '${ruleId}' not found`);
    });

    it('error execute', async () => {
      const ruleId = 'rule.throw-error';
      const response = await request(server).get(`/rules/${ruleId}`);

      expect(response.statusCode).toBe(500);
      expect(response.text).toMatch(`Rule '${ruleId}' execute error`);
    });
  });

  describe('custom id param', () => {
    let server;
    beforeEach(() => {
      // eslint-disable-next-line no-unused-vars
      server = createServer(rules, { idParam: 'ruleId' }, (req, res) => {
        req.params = { ruleId: path.basename(req.url) };
      });
    });

    it('success execute rule', async () => {
      const response = await request(server).get('/rules/rule.get-users');

      expect(JSON.parse(response.text)).toEqual(require('./fixtures/db/users'));
    });
  });

  describe('debug mode', () => {
    it('enable debug', async () => {
      const logger = jest.fn();

      // eslint-disable-next-line no-unused-vars
      const server = createServer(
        rules,
        { debug: true, logger },
        // eslint-disable-next-line no-unused-vars
        (req, res) => {
          req.params = { id: path.basename(req.url) };
        }
      );

      const response = await request(server).get('/rules/rule.get-users');
      expect(JSON.parse(response.text)).toEqual(require('./fixtures/db/users'));

      expect(logger.mock.calls.length).toBe(10);
    });
  });
});

function createServer(rules, opts, fn) {
  const _serve = ruleengine(rules, opts);

  return http.createServer(function (req, res) {
    fn && fn(req, res);
    _serve(req, res, function (err) {
      res.statusCode = err ? err.status || 500 : 404;
      res.end(err ? `${err.message}: ${err.stack}` : 'sorry!');
    });
  });
}

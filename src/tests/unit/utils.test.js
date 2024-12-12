import utils from '../../utils/index.js';
describe('JWT Utility Functions', () => {
  const mockTokenPayload = { userId: '123', role: 'user' };
  const mockJwtToken = `header.${Buffer.from(
    JSON.stringify(mockTokenPayload),
  ).toString('base64')}.signature`;

  const mockRequest = (authorizationHeader) => ({
    headers: {
      authorization: authorizationHeader,
    },
  });

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('parseJwt', () => {
    test('should parse and return the payload from a valid JWT', () => {
      const result = utils.parseJwt(mockJwtToken);
      expect(result).toEqual(mockTokenPayload);
    });

    test('should throw an error if the token is invalid', () => {
      const invalidJwtToken = `header.${Buffer.from('invalid-json').toString('base64')}.signature`;
      expect(() => utils.parseJwt(invalidJwtToken)).toThrow();
    });
  });

  describe('getUsersJwt', () => {
    test('should parse and return the payload from a valid Bearer token in the Authorization header', () => {
      const req = mockRequest(`Bearer ${mockJwtToken}`);
      const result = utils.getUsersJwt(req);
      expect(result).toEqual(mockTokenPayload);
    });

    test('should throw an error if the Authorization header is missing', () => {
      const req = mockRequest(null);
      expect(() => utils.getUsersJwt(req)).toThrow('JWT Authentication Error');
    });

    test('should throw an error if the Authorization header does not start with "Bearer"', () => {
      const req = mockRequest(`Invalid ${mockJwtToken}`);
      expect(() => utils.getUsersJwt(req)).toThrow('JWT Authentication Error');
    });

    test('should throw an error if the token is invalid', () => {
      const invalidJwtToken = `header.${Buffer.from('invalid-json').toString('base64')}.signature`;
      const req = mockRequest(`Bearer ${invalidJwtToken}`);
      expect(() => utils.getUsersJwt(req)).toThrow('JWT Authentication Error');
    });
  });

  describe('getJWT', () => {
    test('should correctly extract the JWT from the Authorization header', () => {
      const req = mockRequest(`Bearer ${mockJwtToken}`);
      const result = utils.getJWT(req);
      expect(result).toBe(mockJwtToken);
    });

    test('should return undefined if no Authorization header is present', () => {
      const req = mockRequest(null);
      const result = utils.getJWT(req);
      expect(result).toBeUndefined();
    });

    test('should return undefined if Authorization header is malformed (not starting with "Bearer")', () => {
      const req = mockRequest(`Invalid ${mockJwtToken}`);
      const result = utils.getJWT(req);
      expect(result).toBeUndefined();
    });
  });

  describe('isObjectEmpty', () => {
    test('should return true for an empty object', () => {
      const emptyObject = {};
      const result = utils.isObjectEmpty(emptyObject);
      expect(result).toBe(true);
    });

    test('should return false for a non-empty object', () => {
      const nonEmptyObject = { key: 'value' };
      const result = utils.isObjectEmpty(nonEmptyObject);
      expect(result).toBe(false);
    });

    test('should return false for non-object types', () => {
      expect(utils.isObjectEmpty(null)).toBe(false); // Null is not an object
      expect(utils.isObjectEmpty([])).toBe(false); // Arrays are not empty objects
    });
  });
});

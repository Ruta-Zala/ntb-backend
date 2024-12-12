import { findUserByEmail } from '../../controllers/search-user.js'; // Adjust the path if needed
import model from '../../models/users.js';
import utils from '../../utils/index.js';

jest.mock('../../models/users.js'); // Mock the user model
jest.mock('../../utils/index.js'); // Mock the utils

describe('findUserByEmail Unit Tests', () => {
  const mockEmail = 'user@example.com';
  const mockJwtEmail = 'user@example.com'; // Change this for different test scenarios

  beforeEach(() => {
    // Clear all mocks before each test to avoid interference
    model.findOne.mockClear();
    utils.getUsersJwt.mockClear();
  });

  it('should return user details if JWT email matches the requested email', async () => {
    // Arrange
    const mockUser = { email: mockEmail, name: 'John Doe' };

    // Mock database response
    model.findOne.mockResolvedValue(mockUser);

    // Mock JWT extraction
    utils.getUsersJwt.mockReturnValue({ email: mockJwtEmail });

    const req = { params: { email: mockEmail } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Act
    await findUserByEmail(req, res);

    // Assert
    expect(model.findOne).toHaveBeenCalledWith({ email: mockEmail });
    expect(utils.getUsersJwt).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(mockUser);
  });

  it('should return 403 if JWT email does not match the requested email', async () => {
    // Arrange
    const mockUser = { email: mockEmail, name: 'John Doe' };

    // Mock database response
    model.findOne.mockResolvedValue(mockUser);

    // Mock JWT extraction with a different email
    utils.getUsersJwt.mockReturnValue({ email: 'different@example.com' });

    const req = { params: { email: mockEmail } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Act
    await findUserByEmail(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith(
      'You do not have access to this resource',
    );
  });

  it('should return 404 if user is not found in the database', async () => {
    // Arrange
    model.findOne.mockResolvedValue(null); // Simulate no user found

    // Mock JWT extraction
    utils.getUsersJwt.mockReturnValue({ email: mockJwtEmail });

    const req = { params: { email: mockEmail } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Act
    await findUserByEmail(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      `No user found matching email ${mockEmail}`,
    );
  });

  it('should return 500 if there is an unexpected error', async () => {
    // Arrange
    model.findOne.mockRejectedValue(new Error('Unexpected error')); // Simulate an error in DB query

    // Mock JWT extraction
    utils.getUsersJwt.mockReturnValue({ email: mockJwtEmail });

    const req = { params: { email: mockEmail } };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Act
    await findUserByEmail(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('An unexpected error occurred.');
  });
});

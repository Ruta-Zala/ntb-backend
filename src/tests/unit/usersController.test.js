import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../../controllers/usersController.js';
import model from '../../models/users.js';
import utils from '../../utils/index.js';

jest.mock('../../models/users.js');
jest.mock('../../utils/index.js');

describe('User Controller', () => {
  let mockRequest, mockResponse;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users if found', async () => {
      const users = [{ email: 'test@test.com' }];
      model.find.mockResolvedValue(users); // Mock database query

      await getAllUsers(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(users);
    });

    it('should return 404 if no users found', async () => {
      model.find.mockResolvedValue([]); // No users

      await getAllUsers(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith('No users found');
    });

    it('should return 500 if there is a server error', async () => {
      model.find.mockRejectedValue(new Error('Database error'));

      await getAllUsers(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('Database error');
    });
  });

  describe('getUserById', () => {
    it('should return a user if found and authorized', async () => {
      const userId = '613b2e7b8a8c6e1b8b8c8c8c';
      const user = { email: 'test@test.com', _id: userId };
      mockRequest.params = { id: userId };
      mockRequest.body = { email: 'test@test.com' };
      utils.getUsersJwt.mockReturnValue({ email: 'test@test.com' });

      model.findOne.mockResolvedValue(user);

      await getUserById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(user);
    });

    it('should return 404 if no user found', async () => {
      mockRequest.params = { id: '613b2e7b8a8c6e1b8b8c8c8c' };
      mockRequest.body = { email: 'test@test.com' };
      utils.getUsersJwt.mockReturnValue({ email: 'test@test.com' });

      model.findOne.mockResolvedValue(null); // No user found

      await getUserById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'No user found matching id 613b2e7b8a8c6e1b8b8c8c8c',
      );
    });

    it('should return 403 if the user is not authorized', async () => {
      mockRequest.params = { id: '613b2e7b8a8c6e1b8b8c8c8c' };
      mockRequest.body = { email: 'otheremail@test.com' };
      utils.getUsersJwt.mockReturnValue({ email: 'test@test.com' });

      await getUserById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'You do not have access to this resource',
      );
    });

    it('should return 500 if there is a server error', async () => {
      mockRequest.params = { id: '613b2e7b8a8c6e1b8b8c8c8c' };
      mockRequest.body = { email: 'test@test.com' };
      utils.getUsersJwt.mockReturnValue({ email: 'test@test.com' });

      model.findOne.mockRejectedValue(new Error('Database error'));

      await getUserById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('Database error');
    });
  });

  describe('createUser', () => {
    it('should create a new user if authorized and data is valid', async () => {
      mockRequest.body = {
        email: 'newuser@test.com',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'johndoe',
        agreementAccepted: true,
        avatar: 'avatarurl',
        isEnabled: true,
        locale: 'en',
        accessLevel: 'user',
      };
      utils.getUsersJwt.mockReturnValue({ email: 'newuser@test.com' });

      model.insertOne.mockResolvedValue({ insertedId: 'newId' });

      await createUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 403 if the user is not authorized', async () => {
      mockRequest.body = { email: 'newuser@test.com' };
      utils.getUsersJwt.mockReturnValue({ email: 'otheremail@test.com' });

      await createUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'You do not have access to this resource',
      );
    });

    it('should return 400 if data is missing', async () => {
      mockRequest.body = {};
      utils.getUsersJwt.mockReturnValue({ email: 'newuser@test.com' });

      await createUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'Failed to create new User. Data missing.',
      );
    });

    it('should return 500 if there is a server error', async () => {
      mockRequest.body = {
        email: 'newuser@test.com',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'johndoe',
        agreementAccepted: true,
        avatar: 'avatarurl',
        isEnabled: true,
        locale: 'en',
        accessLevel: 'user',
      };
      utils.getUsersJwt.mockReturnValue({ email: 'newuser@test.com' });

      model.insertOne.mockRejectedValue(new Error('Database error'));

      await createUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'Failed to create new User: Database error',
      );
    });
  });

  describe('updateUser', () => {
    it('should update a user if authorized and data is valid', async () => {
      const userId = '613b2e7b8a8c6e1b8b8c8c8c';
      mockRequest.params = { id: userId };
      mockRequest.body = { email: 'test@test.com', firstName: 'Updated' };
      utils.getUsersJwt.mockReturnValue({ email: 'test@test.com' });

      model.updateOne.mockResolvedValue({ matchedCount: 1 });
      model.findOne.mockResolvedValue({
        _id: userId,
        email: 'test@test.com',
        firstName: 'Updated',
      });

      await updateUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: 'User updated successfully',
        updatedUser: {
          _id: userId,
          email: 'test@test.com',
          firstName: 'Updated',
        },
      });
    });

    it('should return 403 if the user is not authorized', async () => {
      mockRequest.params = { id: '613b2e7b8a8c6e1b8b8c8c8c' };
      mockRequest.body = { email: 'test@test.com', firstName: 'Updated' };
      utils.getUsersJwt.mockReturnValue({ email: 'otheremail@test.com' });

      await updateUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'You do not have access to this resource',
      );
    });

    it('should return 400 if user ID is invalid', async () => {
      mockRequest.params = { id: 'invalidId' };
      mockRequest.body = { email: 'test@test.com', firstName: 'Updated' };

      await updateUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'Invalid user ID: invalidId',
      );
    });

    it('should return 500 if there is a server error', async () => {
      mockRequest.params = { id: '613b2e7b8a8c6e1b8b8c8c8c' };
      mockRequest.body = { email: 'test@test.com', firstName: 'Updated' };
      utils.getUsersJwt.mockReturnValue({ email: 'test@test.com' });

      model.updateOne.mockRejectedValue(new Error('Database error'));

      await updateUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'Error updating user: Database error',
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete the user if authorized', async () => {
      const userId = '613b2e7b8a8c6e1b8b8c8c8c'; // Valid mock ID
      mockRequest.params = { id: userId };
      mockRequest.body = { email: 'test@test.com' };

      // Simulate a valid JWT user
      utils.getUsersJwt.mockReturnValue({ email: 'test@test.com' });

      // Mock removeOne to simulate successful deletion
      model.removeOne.mockResolvedValue({
        acknowledged: true,
        deletedCount: 1,
      });

      await deleteUser(mockRequest, mockResponse);

      // Expect 200 status and success message
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'user deleted successfully',
      );
    });

    it('should return 403 if the user is not authorized', async () => {
      mockRequest.params = { id: '613b2e7b8a8c6e1b8b8c8c8c' };
      mockRequest.body = { email: 'test@test.com' };
      utils.getUsersJwt.mockReturnValue({ email: 'otheremail@test.com' });

      await deleteUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'You do not have access to this resource',
      );
    });

    it('should return 500 if user ID is invalid', async () => {
      mockRequest.params = { id: 'invalidId' }; // invalid ObjectId format
      mockRequest.body = { email: 'test@test.com' };

      // Simulate a valid JWT user
      utils.getUsersJwt.mockReturnValue({ email: 'test@test.com' });

      // Simulate model behavior for delete
      model.removeOne.mockResolvedValue({
        acknowledged: true,
        deletedCount: 0,
      });

      await deleteUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'Error deleting user: Argument passed in must be a string of 12 bytes or a string of 24 hex characters or an integer',
      );
    });

    it('should return 500 if there is a server error', async () => {
      mockRequest.params = { id: '613b2e7b8a8c6e1b8b8c8c8c' };
      mockRequest.body = { email: 'test@test.com' };
      utils.getUsersJwt.mockReturnValue({ email: 'test@test.com' });

      model.removeOne.mockRejectedValue(new Error('Database error'));

      await deleteUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        'Error deleting user: Database error',
      );
    });
  });
});

import { DB } from '../doc-db/index.js';
import dotenv from 'dotenv';

dotenv.config();

// Sample user data to populate the database
const sampleUsers = [
  {
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    displayName: 'AdminUser',
    agreementAccepted: true,
    avatar: 'https://example.com/avatar/admin.png',
    isEnabled: true,
    locale: 'en-US',
    accessLevel: '4',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Database details
const DATABASE_NAME = process.env.MONGO_DATABASE;
const COLLECTION_NAME = 'users';

// Seeder function
const seedUsers = async () => {
  const db = new DB();

  try {
    // Get database connection
    const client = await db.getConnection(DATABASE_NAME);
    const usersCollection = client
      .db(DATABASE_NAME)
      .collection(COLLECTION_NAME);

    console.log('Seeding users...');
    const result = await usersCollection.insertMany(sampleUsers);

    console.log(`${result.insertedCount} users inserted successfully.`);
  } catch (error) {
    console.error('Error seeding users:', error.message);
  } finally {
    // Close database connection
    if (db.connections[DATABASE_NAME]) {
      db.connections[DATABASE_NAME].close();
    }
  }
};

seedUsers();

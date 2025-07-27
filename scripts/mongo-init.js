/* eslint-env mongo */
/* global db, print, process */
// MongoDB initialization script for Docker development environment
// This script creates the development database, users, and initial collections

// Get database name from environment or use default
const dbName = process.env.MONGO_INITDB_DATABASE || 'dnd_tracker';
db = db.getSiblingDB(dbName);

print(`Initializing database: ${dbName}`);

// Create application user with read/write permissions
try {
  db.createUser({
    user: 'app_user',
    pwd: 'app_password_2024',
    roles: [
      {
        role: 'readWrite',
        db: dbName
      }
    ]
  });
  print('✓ Application user created successfully');
} catch (e) {
  if (e.code === 51003) {
    print('→ Application user already exists, skipping...');
  } else {
    print(`✗ Error creating application user: ${e.message}`);
  }
}

// Create development user with additional permissions
try {
  db.createUser({
    user: 'dev_user',
    pwd: 'dev_password_2024',
    roles: [
      {
        role: 'readWrite',
        db: dbName
      },
      {
        role: 'dbAdmin',
        db: dbName
      }
    ]
  });
  print('✓ Development user created successfully');
} catch (e) {
  if (e.code === 51003) {
    print('→ Development user already exists, skipping...');
  } else {
    print(`✗ Error creating development user: ${e.message}`);
  }
}

// Create initial collections with proper schema validation
const collections = [
  {
    name: 'users',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['email', 'createdAt'],
        properties: {
          email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
          username: { bsonType: 'string', minLength: 3, maxLength: 50 },
          createdAt: { bsonType: 'date' },
          lastLoginAt: { bsonType: 'date' }
        }
      }
    }
  },
  {
    name: 'characters',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'level', 'createdAt'],
        properties: {
          name: { bsonType: 'string', minLength: 1, maxLength: 100 },
          level: { bsonType: 'int', minimum: 1, maximum: 20 },
          createdAt: { bsonType: 'date' }
        }
      }
    }
  },
  {
    name: 'encounters',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'createdAt'],
        properties: {
          name: { bsonType: 'string', minLength: 1, maxLength: 200 },
          status: { enum: ['planning', 'active', 'completed', 'paused'] },
          createdAt: { bsonType: 'date' }
        }
      }
    }
  },
  {
    name: 'sessions',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'token', 'createdAt', 'expiresAt'],
        properties: {
          userId: { bsonType: 'objectId' },
          token: { bsonType: 'string' },
          createdAt: { bsonType: 'date' },
          expiresAt: { bsonType: 'date' }
        }
      }
    }
  },
  {
    name: 'userStats',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'createdAt'],
        properties: {
          userId: { bsonType: 'objectId' },
          encounttersCreated: { bsonType: 'int', minimum: 0 },
          charactersCreated: { bsonType: 'int', minimum: 0 },
          createdAt: { bsonType: 'date' }
        }
      }
    }
  }
];

// Create collections with validation
collections.forEach(collectionConfig => {
  try {
    // Check if collection already exists
    const existingCollections = db.getCollectionNames();
    if (existingCollections.includes(collectionConfig.name)) {
      print(`→ Collection '${collectionConfig.name}' already exists, skipping...`);
      return;
    }

    // Create collection with validator
    db.createCollection(collectionConfig.name, {
      validator: collectionConfig.validator,
      validationLevel: 'strict',
      validationAction: 'error'
    });
    print(`✓ Collection '${collectionConfig.name}' created successfully`);
  } catch (e) {
    print(`✗ Error creating collection '${collectionConfig.name}': ${e.message}`);
  }
});

// Create indexes for performance
const indexes = [
  { collection: 'users', index: { email: 1 }, options: { unique: true } },
  { collection: 'users', index: { username: 1 }, options: { unique: true, sparse: true } },
  { collection: 'characters', index: { userId: 1 } },
  { collection: 'characters', index: { name: 1, userId: 1 } },
  { collection: 'encounters', index: { userId: 1 } },
  { collection: 'encounters', index: { status: 1 } },
  { collection: 'encounters', index: { createdAt: -1 } },
  { collection: 'sessions', index: { token: 1 }, options: { unique: true } },
  { collection: 'sessions', index: { userId: 1 } },
  { collection: 'sessions', index: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
  { collection: 'userStats', index: { userId: 1 }, options: { unique: true } }
];

// Create indexes
indexes.forEach(indexConfig => {
  try {
    const collection = db.getCollection(indexConfig.collection);
    const options = indexConfig.options || {};
    collection.createIndex(indexConfig.index, options);
    print(`✓ Index created on '${indexConfig.collection}': ${JSON.stringify(indexConfig.index)}`);
  } catch (e) {
    if (e.code === 85) {
      print(`→ Index on '${indexConfig.collection}' already exists, skipping...`);
    } else {
      print(`✗ Error creating index on '${indexConfig.collection}': ${e.message}`);
    }
  }
});

// Insert seed data for development
if (process.env.NODE_ENV === 'development' || process.env.DOCKER_ENV === 'true') {
  try {
    // Create a test user
    const testUser = {
      email: 'test@example.com',
      username: 'testuser',
      hashedPassword: '$2a$12$dummy.hash.for.development.only',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingTestUser = db.users.findOne({ email: testUser.email });
    if (!existingTestUser) {
      const userResult = db.users.insertOne(testUser);
      print(`✓ Test user created with ID: ${userResult.insertedId}`);

      // Create user stats for test user
      db.userStats.insertOne({
        userId: userResult.insertedId,
        encounttersCreated: 0,
        charactersCreated: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      print('✓ Test user stats created');
    } else {
      print('→ Test user already exists, skipping...');
    }
  } catch (e) {
    print(`✗ Error creating seed data: ${e.message}`);
  }
}

// Database configuration for optimal performance
try {
  // Set read preference for replica set
  db.getMongo().setReadPref('primaryPreferred');
  print('✓ Read preference set to primaryPreferred');
} catch (e) {
  print(`→ Could not set read preference: ${e.message}`);
}

print('=================================');
print(`Database '${dbName}' initialization completed!`);
print('=================================');

// Display summary
const stats = {
  collections: db.getCollectionNames().length,
  users: db.users.countDocuments(),
  characters: db.characters.countDocuments(),
  encounters: db.encounters.countDocuments()
};

print(`Collections: ${stats.collections}`);
print(`Users: ${stats.users}`);
print(`Characters: ${stats.characters}`);
print(`Encounters: ${stats.encounters}`);
// MongoDB initialization script for development
// This script creates the development database and a development user

db = db.getSiblingDB('dnd_tracker_dev');

// Create a development user with read/write permissions
db.createUser({
  user: 'dev_user',
  pwd: 'dev_password',
  roles: [
    {
      role: 'readWrite',
      db: 'dnd_tracker_dev'
    }
  ]
});

// Create initial collections (optional - Prisma will create these)
db.createCollection('users');
db.createCollection('characters');
db.createCollection('encounters');
db.createCollection('sessions');

print('Database initialized successfully');
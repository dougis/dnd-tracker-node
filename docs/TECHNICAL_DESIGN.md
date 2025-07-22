# Technical Design Document: D&D Encounter Tracker

## 1. Introduction

This document outlines the technical design and implementation plan for the D&D Encounter Tracker, a web application designed to help Dungeon Masters manage combat encounters. The application will be built using a Node.js backend, a React front-end, and MongoDB for the database.

## 2. Architecture

We will use a monolithic architecture for the initial MVP. This approach is simpler to develop, test, and deploy, making it ideal for a small team and a new product. The front-end and back-end will be developed as separate projects within the monorepo to allow for clear separation of concerns.

*   **Front-End:** A single-page application (SPA) built with React. It will communicate with the back-end via a RESTful API.
*   **Back-End:** A Node.js application using the Express framework to provide a RESTful API for the front-end.
*   **Database:** A MongoDB database to store all application data.

## 3. Data Model (MongoDB)

We will use Mongoose to define our schemas.

*   **User:**
    *   `email`: (String, required, unique)
    *   `password`: (String, required)
    *   `subscriptionTier`: (String, default: 'Free Adventurer')
    *   `parties`: [ObjectId, ref: 'Party']
*   **Party:**
    *   `name`: (String, required)
    *   `user`: (ObjectId, ref: 'User', required)
    *   `characters`: [ObjectId, ref: 'Character']
*   **Character:**
    *   `name`: (String, required)
    *   `race`: (String)
    *   `class`: (String)
    *   `dexterity`: (Number, default: 10)
    *   `ac`: (Number, default: 10)
    *   `maxHp`: (Number, default: 10)
    *   `currentHp`: (Number, default: 10)
*   **Encounter:**
    *   `name`: (String, required)
    *   `user`: (ObjectId, ref: 'User', required)
    *   `creatures`: [ObjectId, ref: 'Creature']
*   **Creature:**
    *   `name`: (String, required)
    *   `ac`: (Number, default: 10)
    *   `dexterity`: (Number, default: 10)
    *   `initiativeModifier`: (Number, default: 0)
    *   `hp`: (Number, default: 10)
    *   `legendaryActions`: (Number, default: 0)
    *   `lairActions`: (Boolean, default: false)

## 4. API Design (Node.js/Express)

The API will be organized by resource.

*   `/api/users`
    *   `POST /register`: Create a new user.
    *   `POST /login`: Log in a user and return a JWT.
*   `/api/parties`
    *   `GET /`: Get all parties for the logged-in user.
    *   `POST /`: Create a new party.
    *   `GET /:id`: Get a single party.
    *   `PUT /:id`: Update a party.
    *   `DELETE /:id`: Delete a party.
*   `/api/characters`
    *   `POST /`: Create a new character and add it to a party.
    *   `PUT /:id`: Update a character.
    *   `DELETE /:id`: Delete a character.
*   `/api/encounters`
    *   `GET /`: Get all encounters for the logged-in user.
    *   `POST /`: Create a new encounter.
    *   `GET /:id`: Get a single encounter.
    *   `PUT /:id`: Update an encounter.
    *   `DELETE /:id`: Delete an encounter.
*   `/api/creatures`
    *   `POST /`: Create a new creature and add it to an encounter.
    *   `PUT /:id`: Update a creature.
    *   `DELETE /:id`: Delete a creature.

## 5. Front-End (React)

The front-end will be structured into components.

*   **`components/`**: Reusable components (buttons, inputs, etc.).
*   **`pages/`**: Top-level pages (Dashboard, Encounter, etc.).
*   **`services/`**: API service for making requests to the back-end.
*   **`context/`**: React Context for state management.

We will use React Router for navigation and React Context for global state management (e.g., user authentication).

## 6. Authentication

We will use JSON Web Tokens (JWT) for authentication. When a user logs in, the back-end will generate a JWT and send it to the front-end. The front-end will store the JWT in local storage and send it in the `Authorization` header of every request.

## 7. Deployment

For the MVP, we will deploy the application to Heroku. The front-end and back-end will be deployed as separate applications. We will use a MongoDB Atlas free tier database.

## 8. Testing

*   **Unit Tests:** We will use Jest and React Testing Library to write unit tests for our React components and utility functions.
*   **Integration Tests:** We will use Supertest to write integration tests for our back-end API.

# Implementation Plan

## Phase 1: MVP (Free Adventurer Tier)

### Sprint 1: Project Setup & User Authentication (1 week)

*   **Task 1:** Set up a new Node.js project with Express and MongoDB.
*   **Task 2:** Set up a new React project with Create React App.
*   **Task 3:** Implement user registration and login on the back-end.
*   **Task 4:** Create the registration and login pages on the front-end.
*   **Task 5:** Implement JWT authentication.

### Sprint 2: Party & Character Management (2 weeks)

*   **Task 1:** Implement CRUD API endpoints for parties.
*   **Task 2:** Implement CRUD API endpoints for characters.
*   **Task 3:** Create front-end components for creating, viewing, updating, and deleting parties.
*   **Task 4:** Create front-end components for creating, viewing, updating, and deleting characters.

### Sprint 3: Encounter & Creature Management (2 weeks)

*   **Task 1:** Implement CRUD API endpoints for encounters.
*   **Task 2:** Implement CRUD API endpoints for creatures.
*   **Task 3:** Create front-end components for creating, viewing, updating, and deleting encounters.
*   **Task 4:** Create front-end components for creating, viewing, updating, and deleting creatures.

### Sprint 4: Combat Tracker (2 weeks)

*   **Task 1:** Implement the initiative tracker with sorting by initiative and dexterity.
*   **Task 2:** Implement HP tracking (damage and healing).
*   **Task 3:** Implement status effect tracking.
*   **Task 4:** Implement lair and legendary action tracking.
*   **Task 5:** Create the main combat tracker interface.

## Phase 2: Monetization & Paid Tiers (4 weeks)

*   **Task 1:** Integrate Stripe for payment processing.
*   **Task 2:** Implement a subscription management system.
*   **Task 3:** Implement feature gating based on subscription tiers.
*   **Task 4:** Create a pricing page and upgrade/downgrade functionality.

## Phase 3: Advanced Features (6 weeks)

*   **Task 1:** Implement cloud sync using WebSockets (e.g., Socket.io).
*   **Task 2:** Implement import/export functionality for parties and encounters (JSON and PDF).
*   **Task 3:** Implement a collaborative mode for sharing encounters with other users.

const Hapi = require('hapi');

// Create a new Hapi server instance
const server = Hapi.server({
  port: 3000,
  host: 'localhost'
});

// Define a route
server.route({
  method: 'GET',
  path: '/',
  handler: (request, h) => {
    return 'Hello, Hapi!';
  }
});

// Start the server
const startServer = async () => {
  try {
    await server.start();
    console.log('Server running on:', server.info.uri);
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startServer();

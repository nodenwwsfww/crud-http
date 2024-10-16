import http from 'node:http';
import UsersController from './users.controller.js';

const SERVER_PORT = 8080;

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/users' && req.method === 'GET') {
        UsersController.findMany(req, res);
    } else if (url.pathname.startsWith('/users/') && req.method === 'GET') {
        UsersController.findOne(req, res);
    } else if (url.pathname === '/users' && req.method === 'POST') {
        UsersController.createOne(req, res);
    } else if (url.pathname.startsWith('/users/') && req.method === 'PUT') {
        UsersController.updateOne(req, res);
    } else if (url.pathname.startsWith('/users/') && req.method === 'PATCH') {
        UsersController.patchOne(req, res);
    } else if (url.pathname.startsWith('/users/') && req.method === 'DELETE') {
        UsersController.deleteOne(req, res);
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    }
});

server.listen(SERVER_PORT, () => {
    console.log(`Server is listening on port ${SERVER_PORT}`);
});

import { parse } from 'node:url';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import http from 'node:http';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVER_PORT = 8080;

const filePath = path.join(__dirname, 'users.json');

function updateUserInFile(id, updates) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        let users = JSON.parse(data);
        const userIndex = users.findIndex(user => user.id === id);

        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return;
                }
                console.log('User updated successfully');
            });
        } else {
            console.error('User not found');
        }
    });
}

function handleRequest(req, res) {
    const url = parse(req.url, true);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error reading file' }));
            return;
        }

        let users = JSON.parse(data);

        switch(req.method) {
            case "GET": {
                if (url.pathname === '/users') {
                    const { name, minAge, maxAge } = url.query;
                    const filteredUsers = users.filter(user => {
                        return (!name || user.name === name) &&
                            (!minAge || user.age >= minAge) &&
                            (!maxAge || user.age <= maxAge);
                    });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ data: filteredUsers }));
                } else if (url.pathname.startsWith('/users/')) {
                    const id = parseInt(url.pathname.split('/')[2], 10);
                    const user = users.find(user => user.id === id);
                    if (user) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ data: user }));
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'User Not Found' }));
                    }
                }
                break;
            }
            case "PUT": {
                if (url.pathname.startsWith('/users/')) {
                    const id = parseInt(url.pathname.split('/')[2], 10);
                    const userIndex = users.findIndex(user => user.id === id);
                    if (userIndex !== -1) {
                        let body = '';
                        req.on('data', chunk => {
                            body += chunk.toString();
                        });
                        req.on('end', () => {
                            const updatedUser = JSON.parse(body);
                            if (updatedUser.name && updatedUser.age) {
                                users[userIndex] = { id, ...updatedUser };
                                updateUserInFile(id, updatedUser);
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ data: users[userIndex] }));
                            } else {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Request body must contain both name and age fields' }));
                            }
                        });
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'User Not Found' }));
                    }
                }
                break;
            }
            case "PATCH": {
                if (url.pathname.startsWith('/users/')) {
                    const id = parseInt(url.pathname.split('/')[2], 10);
                    const user = users.find(user => user.id === id);
                    if (user) {
                        let body = '';
                        req.on('data', chunk => {
                            body += chunk.toString();
                        });
                        req.on('end', () => {
                            const updates = JSON.parse(body);
                            if (updates.name || updates.age) {
                                if (updates.name) user.name = updates.name;
                                if (updates.age) user.age = updates.age;
                                updateUserInFile(id, updates);
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ data: user }));
                            } else {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Request body must contain at least one field to update' }));
                            }
                        });
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'User Not Found' }));
                    }
                }
                break;
            }
            case "POST": {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    const bodyParsed = JSON.parse(body);
                    if (bodyParsed.name && bodyParsed.age) {
                        const newUser = {
                            id: users[users.length - 1].id + 1,
                            name: bodyParsed.name,
                            age: bodyParsed.age
                        };
                        users.push(newUser);
                        fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8', (err) => {
                            if (err) {
                                console.error('Error writing file:', err);
                                return;
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ data: newUser }));
                        });
                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Request body must contain both name and age fields' }));
                    }
                });
                break;
            }
            case "DELETE": {
                if (url.pathname.startsWith('/users/')) {
                    const id = parseInt(url.pathname.split('/')[2], 10);
                    const user = users.find(user => user.id === id);
                    if (user) {
                        users = users.filter(user => user.id !== id);
                        fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8', (err) => {
                            if (err) {
                                console.error('Error writing file:', err);
                                return;
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ data: user }));
                        });
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'User Not Found' }));
                    }
                }
                break;
            }
            default: {
                res.writeHead(405, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            }
        }
    });
}

const server = http.createServer(handleRequest);
server.listen(SERVER_PORT);

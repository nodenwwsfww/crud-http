import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const filePath = path.join(__dirname, 'users.json');

class UsersController {
    static findMany(req, res) {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error reading file' }));
                return;
            }

            const users = JSON.parse(data);
            const { name, minAge, maxAge } = new URL(req.url, `http://${req.headers.host}`).searchParams;
            const filteredUsers = users.filter(user => {
                return (!name || user.name === name) &&
                    (!minAge || user.age >= minAge) &&
                    (!maxAge || user.age <= maxAge);
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ data: filteredUsers }));
        });
    }

    static findOne(req, res) {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error reading file' }));
                return;
            }

            const users = JSON.parse(data);
            const id = parseInt(req.url.split('/')[2], 10);
            const user = users.find(user => user.id === id);
            if (user) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ data: user }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'User Not Found' }));
            }
        });
    }

    static createOne(req, res) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const bodyParsed = JSON.parse(body);
            if (bodyParsed.name && bodyParsed.age) {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Error reading file' }));
                        return;
                    }

                    const users = JSON.parse(data);
                    const newUser = {
                        id: users[users.length - 1].id + 1,
                        name: bodyParsed.name,
                        age: bodyParsed.age
                    };
                    users.push(newUser);
                    fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8', (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Error writing file' }));
                            return;
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ data: newUser }));
                    });
                });
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Request body must contain both name and age fields' }));
            }
        });
    }

    static updateOne(req, res) {
        const id = parseInt(req.url.split('/')[2], 10);
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const updatedUser = JSON.parse(body);
            if (updatedUser.name && updatedUser.age) {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Error reading file' }));
                        return;
                    }

                    const users = JSON.parse(data);
                    const userIndex = users.findIndex(user => user.id === id);
                    if (userIndex !== -1) {
                        users[userIndex] = { id, ...updatedUser };
                        fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8', (err) => {
                            if (err) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Error writing file' }));
                                return;
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ data: users[userIndex] }));
                        });
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'User Not Found' }));
                    }
                });
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Request body must contain both name and age fields' }));
            }
        });
    }

    static patchOne(req, res) {
        const id = parseInt(req.url.split('/')[2], 10);
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const updates = JSON.parse(body);
            if (updates.name || updates.age) {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Error reading file' }));
                        return;
                    }

                    const users = JSON.parse(data);
                    const user = users.find(user => user.id === id);
                    if (user) {
                        if (updates.name) user.name = updates.name;
                        if (updates.age) user.age = updates.age;
                        fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8', (err) => {
                            if (err) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Error writing file' }));
                                return;
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ data: user }));
                        });
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'User Not Found' }));
                    }
                });
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Request body must contain at least one field to update' }));
            }
        });
    }

    static deleteOne(req, res) {
        const id = parseInt(req.url.split('/')[2], 10);
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error reading file' }));
                return;
            }

            let users = JSON.parse(data);
            const user = users.find(user => user.id === id);
            if (user) {
                users = users.filter(user => user.id !== id);
                fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8', (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Error writing file' }));
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ data: user }));
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'User Not Found' }));
            }
        });
    }
}

export default UsersController;

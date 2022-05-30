// my ip address: 10.0.0.154
import { URL, fileURLToPath } from 'url';
import express from 'express';
import serverTiming from 'server-timing';
import https from 'https';
import cors from 'cors';
import fs from 'fs';
import productsAPI from './api/products.routes.js';
import usersAPI from './api/users.routes.js';
import home from '../views/routes/home.routes.js';
import users from '../views/routes/users.routes.js';
import products from '../views/routes/products.routes.js';
import cookieParser from '../middleware/cookieParser.js';

const key = fs.readFileSync('../cert/CA/localhost/10.0.0.154+2-key.pem');
const cert = fs.readFileSync('../cert/CA/localhost/10.0.0.154+2.pem');
const __public = fileURLToPath(new URL('../public', import.meta.url));

const app = express();
const corsOptions = {
  origin: ['https://localhost', 'https://chris-desktop', 'https://10.0.0.154'],
  credentials: true,
  allowedHeaders: 'Content-Type,Authorization,Refresh',
};

app.use(cookieParser);
app.use(serverTiming());
app.use(cors(corsOptions));
app.use(express.static(__public));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(methodOverride('_method'));
// app.use(session(sessionConfig));

// Register api routes
app.use('/', home);
app.use('/users', users);
app.use('/products', products);
app.use('/api/v1/products', productsAPI);
app.use('/api/v1/users', usersAPI);
app.use('*', (req, res) => res.status(404).json({ error: 'not found' }));
const server = https.createServer({ key, cert }, app);

export default server;

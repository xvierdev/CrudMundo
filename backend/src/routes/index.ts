import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { ContinentController } from '../controllers/ContinentController';
import { isAuthenticated } from '../middlewares/isAuthenticated';

const routes = Router();
const userController = new UserController();
const authController = new AuthController();
const continentController = new ContinentController();

// rotas públicas
routes.post('/users', userController.create);
routes.get('/users', userController.list); // teste: remover no deploy
routes.post('/login', authController.login);

//rotas privadas
routes.get('/continents', isAuthenticated, continentController.list);
routes.post('/continents', isAuthenticated, continentController.create);

export { routes };
import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { ContinentController } from '../controllers/ContinentController';
import { CountryController } from '../controllers/CountryController';
import { StateController } from '../controllers/StateController';
import { CityController } from '../controllers/CityController';
import { isAuthenticated } from '../middlewares/isAuthenticated';

const routes = Router();
const userController = new UserController();
const continentController = new ContinentController();
const countryController = new CountryController();
const stateController = new StateController();
const cityController = new CityController();
const authController = new AuthController();

// rotas públicas
routes.post('/users', userController.create);
routes.get('/users', userController.list); // teste: remover no deploy
routes.post('/login', authController.login);

//rotas privadas (Autenticadas)

// Continents
routes.get('/continents', isAuthenticated, continentController.list);
routes.get('/continents/countries', isAuthenticated, continentController.listWithCountries);
routes.get('/continents/:id', isAuthenticated, continentController.show);
routes.post('/continents', isAuthenticated, continentController.create);
routes.put('/continents/:id', isAuthenticated, continentController.update);
routes.delete('/continents/:id', isAuthenticated, continentController.delete);

// Countries
routes.get('/countries', isAuthenticated, countryController.list);
routes.get('/countries/:id', isAuthenticated, countryController.show);
routes.post('/countries', isAuthenticated, countryController.create);
routes.put('/countries/:id', isAuthenticated, countryController.update);
routes.delete('/countries/:id', isAuthenticated, countryController.delete);

// States
routes.get('/states', isAuthenticated, stateController.list);
routes.get('/states/:id', isAuthenticated, stateController.show);
routes.post('/states', isAuthenticated, stateController.create);
routes.put('/states/:id', isAuthenticated, stateController.update);
routes.delete('/states/:id', isAuthenticated, stateController.delete);

// Cities
routes.get('/cities', isAuthenticated, cityController.list);
routes.get('/cities/:id', isAuthenticated, cityController.show);
routes.post('/cities', isAuthenticated, cityController.create);
routes.put('/cities/:id', isAuthenticated, cityController.update);
routes.delete('/cities/:id', isAuthenticated, cityController.delete);

export { routes };

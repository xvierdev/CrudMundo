import type { Request, Response } from 'express';
import { StateService } from '../services/StateService';

const stateService = new StateService();

export class StateController {
    list = async (req: Request, res: Response) => {
        try {
            const states = await stateService.executeList();
            return res.json(states);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    show = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const state = await stateService.executeFindById(id);
            return res.json(state);
        } catch (error: any) {
            return res.status(404).json({ error: error.message });
        }
    }

    create = async (req: Request, res: Response) => {
        try {
            const { name, countryId } = req.body;
            if (!name || !countryId) {
                return res.status(400).json({ error: "Nome e ID do país são obrigatórios." });
            }
            const state = await stateService.executeCreate({ name, countryId });
            return res.status(201).json(state);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, countryId } = req.body;
            const state = await stateService.executeUpdate(id, { name, countryId });
            return res.json(state);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await stateService.executeDelete(id);
            return res.status(204).send();
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}

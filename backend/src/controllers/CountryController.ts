import type { Request, Response } from 'express';
import { CountryService } from '../services/CountryService';

const countryService = new CountryService();

export class CountryController {
    list = async (req: Request, res: Response) => {
        try {
            const countries = await countryService.executeList();
            return res.json(countries);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    show = async (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const country = await countryService.executeFindById(id);
            return res.json(country);
        } catch (error: any) {
            return res.status(404).json({ error: error.message });
        }
    }

    create = async (req: Request, res: Response) => {
        try {
            const { name, continentId } = req.body;
            if (!name || !continentId) {
                return res.status(400).json({ error: "Nome do país ou ID do continente são obrigatórios" });
            }
            const country = await countryService.executeCreate({ name, continentId });
            return res.status(201).json(country);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            const { name, continentId } = req.body;
            const country = await countryService.executeUpdate(id, { name, continentId });
            return res.json(country);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params as { id: string };
            await countryService.executeDelete(id);
            return res.status(204).send();
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}

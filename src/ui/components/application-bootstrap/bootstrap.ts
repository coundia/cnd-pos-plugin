import { ChannelService, CustomerService, ShippingMethodService, Logger } from '@vendure/core';
import {AdminTokenService} from "../../../services/admin-token.service";
import {initShippingMethod} from "./init-shipping-method";
import {initAnonymCustomer} from "./init-anonym-customer";

/**
 * Initialise la configuration POS au démarrage :
 * 1) Génère un token admin si absent (ADMIN_USER_REMOTE / ADMIN_PASS_REMOTE doivent être définis)
 * 2) Initialise les méthodes de shipping et le client anonyme
 */
export async function bootstrapPos(
	channelService: ChannelService,
	shippingMethodService: ShippingMethodService,
	customerService: CustomerService,
	adminTokenService: AdminTokenService,
): Promise<void> {
	// 1️⃣ Génération du token si absent
	const existingToken = adminTokenService.getStoredToken();
	if (!existingToken) {
		const user = process.env.ADMIN_USER_REMOTE;
		const pass = process.env.ADMIN_PASS_REMOTE;
		if (!user || !pass) {
			Logger.error(
				'Pas de ADMIN_USER_REMOTE/ADMIN_PASS_REMOTE dans l’environnement – génération de token ignorée',
				'bootstrapPos',
			);
		} else {
			try {
				const token = await adminTokenService.generatePermanentToken(user, pass);
				Logger.info(`Token généré dans bootstrapPos: ${token}`, 'bootstrapPos');
			} catch (err: any) {
				Logger.error(`Échec génération token: ${err.message}`, 'bootstrapPos');
			}
		}
	} else {
		Logger.info('Token déjà présent, pas de nouvelle génération', 'bootstrapPos');
	}

	// 2️⃣ Initialisation shipping & customer
	try {
		await initShippingMethod(channelService, shippingMethodService);
		await initAnonymCustomer(channelService, customerService);
		Logger.info('CndPosPlugin bootstrap complete', 'bootstrapPos');
	} catch (err: any) {
		Logger.error(`Échec bootstrap POS: ${err.message}`, 'bootstrapPos');
	}
}

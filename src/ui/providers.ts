import {addActionBarItem, addNavMenuItem, addNavMenuSection, ModalService} from "@vendure/admin-ui/core";
import {PosOrderPrintModalComponent} from "./components/print/pos-order-print-modal.component";
import {PosOrderPaymentsModalComponent} from "./components/payments/pos-order-payments-modal.component";

import { registerPageTab } from '@vendure/admin-ui/core';

export default [
//menu section POS
	addNavMenuSection({
		items: [
		],
		id: 'pos-section',
		label: 'Point of Sale',
		icon: 'store'
	},
		'sales'
		),
	//btn POS in menu
	addNavMenuItem({
			id: 'pos-menu',
			label: 'POS (Saisir vente)',
			routerLink: ['/extensions/pos', 'sales'],
			icon: 'shopping-cart',
			requiresPermission: 'ReadCatalog',
		},
		'pos-section'
	),
	//btn greeter in menu
	addNavMenuItem({
			id: 'stock-movements',
			label: 'Inventaire',
			routerLink: ['/extensions/pos', 'mouvements'],
			icon: 'two-way-arrows',
			requiresPermission: 'ReadCatalog',
		},
		'pos-section'
	),

	addNavMenuItem(
		{
			id: 'stock-alert',
			label: 'Rupture de stock',
			routerLink: ['/extensions/pos', 'stock-alert'],
			icon: 'exclamation-triangle',
			requiresPermission: 'ReadCatalog',
		},
		'pos-section' // section du menu
	),
//btn invoices in order details
	addActionBarItem({
		id: 'print-order',
		label: 'Facture',
		locationId: 'order-detail',
		buttonColor:'warning',
		icon: 'download',
		onClick: (event, context) => {
			context.entity$.subscribe(order => {
				if (!order) {
					alert("No order");
					return;
				}
				PosOrderPrintModalComponent.orderData = order;
				context.injector.get(ModalService).fromComponent(PosOrderPrintModalComponent).subscribe();
			});
		},
	}),
	//btn payment in orders details
	addActionBarItem({
		id: 'view-payments-btn',
		label: 'Voir les paiements',
		locationId: 'order-detail',
		icon: 'credit-card',
		buttonColor:'success',
		onClick: (event, context) => {
			context.entity$.subscribe(order => {
				if (!order) {
					alert("No order");
					return;
				}
				PosOrderPaymentsModalComponent.orderData = order;
				context.injector.get(ModalService).fromComponent(PosOrderPaymentsModalComponent).subscribe();
			});
		},
		requiresPermission: 'ReadOrder',
	}),

	//btn POS in menu
	addNavMenuItem({
			id: 'pos-transactions',
			label: 'Transactions',
			routerLink: ['/extensions/pos', 'transactions'],
			icon: 'shopping-cart',
			requiresPermission: 'ReadCatalog',
		},
		'pos-section'
	),

	//btn POS in menu
	addNavMenuItem({
			id: 'pos-transaction-dashboard',
			label: 'Transactions dashboard',
			routerLink: ['/extensions/pos', 'transaction-dashboard'],
			icon: 'shopping-cart',
			requiresPermission: 'ReadCatalog',
		},
		'pos-section'
	),


	//end
];


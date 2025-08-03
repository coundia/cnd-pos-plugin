import {addNavMenuItem, registerRouteComponent} from "@vendure/admin-ui/core";
import {PosPageComponent} from "./components/pos-page/pos-page.component";
import {StockMovementsTabComponent} from "./components/stock‐movements-tab/stock‐movements-tab.component";
import {StockAlertTabComponent} from "./components/stock-alert/stock-alert-tab.component";
import {TransactionEntryListComponent} from "./components/transactions/list/transaction-entry-list.component";
import {TransactionIndexComponent} from "./components/transactions/index/transaction-index.component";
import {TransactionDashboardComponent} from "./components/transactions/dashboard/transaction-dashboard.component";


export default [
	registerRouteComponent({
		path: 'sales',
		component: PosPageComponent,
		breadcrumb: 'sales',
	}),

	registerRouteComponent({
		path: 'mouvements',
		component: StockMovementsTabComponent,
		breadcrumb: 'Stock Movements',
	}),

	registerRouteComponent({
		path: 'stock-alert',
		component: StockAlertTabComponent,
		breadcrumb: 'Rupture de stock',
	}),

	registerRouteComponent({
		path: 'transactions/list',
		component: TransactionEntryListComponent,
		breadcrumb: 'Transactions',
	}),


	registerRouteComponent({
		path: 'transactions',
		component: TransactionIndexComponent,
		breadcrumb: {
			link: ['/extensions', 'pos', 'transactions'],
			label: 'Transactions',
		},
		entityKey: ""
	}),

	registerRouteComponent({
		path: 'transaction-dashboard',
		component: TransactionDashboardComponent,
		breadcrumb: 'Transactions',
	}),


];

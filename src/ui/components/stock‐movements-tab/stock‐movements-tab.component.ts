import {Component, OnDestroy, OnInit} from '@angular/core';
import {SharedModule} from '@vendure/admin-ui/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {
	ClrDatagridModule,
	ClrDatagridNumericFilterInterface,
	ClrDatagridStringFilterInterface,
	ClrFormsModule,
	ClrIconModule,
	ClrLoadingModule,
} from '@clr/angular';
import {Apollo} from 'apollo-angular';
import {debounceTime, distinctUntilChanged, Subscription} from 'rxjs';
import {GET_STOCK_MOVEMENTS} from '../../constantes/constantes.graphql';

interface StockMovement {
	createdAt: string;
	updatedAt?: string;
	type: string;
	quantity: number;
}

interface StockLevel {
	stockLocation: { name: string };
	stockOnHand: number;
	stockAllocated: number;
}

interface Variant {
	id: string;
	name: string;
	outOfStockThreshold?: number;
	stockLevels: StockLevel[];
	stockMovements: { items: StockMovement[] };
}

@Component({
	selector: 'stock-movements-tab',
	templateUrl: './stock-movements-tab.component.html',
	styleUrls: ['./stock-movements-tab.component.scss'],
	standalone: true,
	imports: [
		SharedModule,
		ReactiveFormsModule,
		ClrDatagridModule,
		ClrFormsModule,
		ClrLoadingModule,
		ClrIconModule,
	],
})
export class StockMovementsTabComponent implements OnInit, OnDestroy {
	variants: Variant[] = [];
	loading = false;
	totalItems = 0;
	page = 1;
	pageSize = 10;
	private querySub?: Subscription;

	// Controls
	searchControl = new FormControl('');
	sortControl   = new FormControl('updatedAt-desc');
	movementSortControl = new FormControl<
		'createdAt-asc'|'createdAt-desc'|
		'updatedAt-asc'|'updatedAt-desc'|
		'type-asc'|'type-desc'|
		'quantity-asc'|'quantity-desc'
	>('updatedAt-desc');

	expandedVariants = new Set<string>();

	// Filters for the inner datagrid
	typeFilter: ClrDatagridStringFilterInterface<StockMovement> = {
		accepts: (m, s) => m.type.toLowerCase().includes(s.toLowerCase()),
	};
	qtyFilter: ClrDatagridNumericFilterInterface<StockMovement> = {
		accepts: (m, _i, v) => m.quantity === v,
	};


	constructor(private apollo: Apollo) {}

	ngOnInit(): void {
		// When the search term changes, reset to page 1 and reload
		this.searchControl.valueChanges
			.pipe(debounceTime(300), distinctUntilChanged())
			.subscribe(() => {
				this.page = 1;
				this.loadData();
			});

		// *** NEW: When the variant sort order changes, reset to page 1 and reload ***
		this.sortControl.valueChanges.subscribe(() => {
			this.page = 1;
			this.loadData();
		});

		// When movement sort changes, reapply the client‐side sort
		this.movementSortControl.valueChanges.subscribe(() => this.applyMovementSort());

		// Initial load
		this.loadData();
	}

	ngOnDestroy(): void {
		this.querySub?.unsubscribe();
	}

	expandAll(): void {
		this.expandedVariants = new Set(this.variants.map(v => v.id));
	}
	collapseAll(): void {
		this.expandedVariants.clear();
	}

	private loadData(): void {
		this.loading = true;
		const term = this.searchControl.value?.trim();
		const filter = term ? { name: { contains: term } } : undefined;
		const sortValue = this.sortControl.value ;

		let productVariantSortParameter= {};
		switch (sortValue) {
			case 'name-asc':
				productVariantSortParameter = { name: 'ASC' };
				break;
			case 'name-desc':
				productVariantSortParameter = { name: 'DESC' };
				break;
			case 'updatedAt-asc':
				productVariantSortParameter = { updatedAt: 'ASC' };
				break;
			case 'updatedAt-desc':
				productVariantSortParameter = { updatedAt: 'DESC' };
				break;
			default:
				productVariantSortParameter = { updatedAt: 'DESC' };
		}


		const options = {
			take: this.pageSize,
			skip: (this.page - 1) * this.pageSize,
			filter,
			sort: productVariantSortParameter,
		};

		this.querySub = this.apollo
			.query<{ productVariants: { items: Variant[]; totalItems: number } }>({
				query: GET_STOCK_MOVEMENTS,
				variables: { options },
				fetchPolicy: 'network-only',
			})
			.subscribe(({ data }) => {
				// Clone & sort the nested movements array
				this.variants = data.productVariants.items.map(v => ({
					...v,
					stockMovements: {
						items: [...v.stockMovements.items].sort(
							(a, b) =>
								new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
						),
					},
				}));
				this.totalItems = data.productVariants.totalItems;
				this.loading = false;
				this.movementSortControl.setValue('updatedAt-desc')
				this.applyMovementSort();


			});
	}

	private applyMovementSort() {
		this.variants = this.variants.map(v => {
			const clone = [...v.stockMovements.items];
			clone.sort((a, b) => {
				switch (this.movementSortControl.value) {
					case 'createdAt-asc':
						return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					case 'createdAt-desc':
						return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
					case 'updatedAt-asc':
						return (new Date(a.updatedAt||a.createdAt).getTime()
							- new Date(b.updatedAt||b.createdAt).getTime());
					case 'updatedAt-desc':
						return (new Date(b.updatedAt||b.createdAt).getTime()
							- new Date(a.updatedAt||a.createdAt).getTime());
					case 'type-asc':
						return a.type.localeCompare(b.type);
					case 'type-desc':
						return b.type.localeCompare(a.type);
					case 'quantity-asc':
						return a.quantity - b.quantity;
					case 'quantity-desc':
						return b.quantity - a.quantity;
					default:
						return 0;
				}
			});

			return { ...v, stockMovements: { items: clone } };
		});
	}

	get totalPages(): number {
		return Math.ceil(this.totalItems / this.pageSize);
	}
	goToPage(p: number): void {
		if (p < 1 || p > this.totalPages) return;
		this.page = p;
		this.loadData();
	}

	trackByVariant = (_: number, v: Variant) => v.id;
	trackByMovement = (_: number, m: StockMovement) =>
		`${m.createdAt}|${m.type}|${m.quantity}`;
}

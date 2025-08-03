import {ChangeDetectionStrategy, Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {
	BaseListComponent,
	DataService,
	DataTableFilterCollection,
	DataTableSortCollection,
	SharedModule,
} from '@vendure/admin-ui/core';
import {
	LogicalOperator,
	ProductVariantFilterParameter,
	ProductVariantListOptions,
	SortOrder,
} from '../../graphql/graphql';
import {FormControl} from '@angular/forms';
import {GET_VARIANTS_WITH_STOCK} from "../../constantes/constantes.graphql";

/* ---------- Interfaces ---------- */
interface Variant {
	id: string;
	name: string;
	sku: string;
	outOfStockThreshold: number;
	updatedAt: string;
	stockLevels: Array<{
		stockLocation: { name: string };
		stockOnHand: number;
		stockAllocated: number;
	}>;
	saleable: number;
}

interface VariantsResult {
	productVariants: { items: Variant[]; totalItems: number };
}


/* ---------- Types de tri ---------- */
type SortInput = { name?: SortOrder; updatedAt?: SortOrder; sku?: SortOrder };

@Component({
	selector: 'stock-alert-tab',
	templateUrl: './stock-alert-tab.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [CommonModule, SharedModule],
})
export class StockAlertTabComponent
	extends BaseListComponent<VariantsResult, Variant, { options: ProductVariantListOptions }>
{
	searchTermControl = new FormControl('', { nonNullable: true });

	sorts = new DataTableSortCollection<SortInput, any>(this.router);

	filters = new DataTableFilterCollection<ProductVariantFilterParameter>(this.router);

	constructor(
		router: Router,
		route: ActivatedRoute,
		private readonly dataService: DataService,
	) {
		super(router, route);

		this.sorts = new DataTableSortCollection<SortInput, []>(router)
			.addSort({ name: 'name' })
			.addSort({ name: 'updatedAt' })
			.addSort({ name: 'sku' })
			.defaultSort('updatedAt', 'DESC');

		this.filters = new DataTableFilterCollection<ProductVariantFilterParameter>(router);


		const queryFn = (take: number, skip: number, term: string) =>
			this.dataService.query<VariantsResult, { options: ProductVariantListOptions }>(
				GET_VARIANTS_WITH_STOCK,
				{ options: { skip, take, sort: this.sorts.createSortInput(), ...this.buildSearch(term) } },
			);

		this.setQueryFn(
			(t, s) => queryFn(t, s, this.searchTermControl.value),
			data => ({
				items: data.productVariants.items
					.map(v => {
						const onHand = v.stockLevels.reduce((tot, l) => tot + l.stockOnHand, 0);
						const allocated = v.stockLevels.reduce((tot, l) => tot + l.stockAllocated, 0);
						return { ...v, saleable: onHand - allocated - v.outOfStockThreshold };
					})
					.filter(v => v.saleable <= 0),
				totalItems: data.productVariants.totalItems,
			}),
			(skip, take) => ({
				options: {
					skip,
					take,
					sort: this.sorts.createSortInput(),
					...this.buildSearch(this.searchTermControl.value),
				},
			}),
			{ take: 100, skip: 0 },
		);

		this.sorts.valueChanges.subscribe(() => {
			this.setPageNumber(1);
			this.refresh();
		});
	}

	onSearch(): void {
		this.setPageNumber(1);
		this.refresh();
	}

	trackByVariant(_: number, v: Variant) {
		return v.id;
	}

	private buildSearch(term: string | null) {
		if (!term?.trim()) return {};
		return {
			filter: {
				name: { contains: term },
				sku:  { contains: term },
			},
			filterOperator: LogicalOperator.Or,
		};
	}
}
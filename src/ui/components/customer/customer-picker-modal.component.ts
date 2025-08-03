import {CommonModule} from '@angular/common';
import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Apollo} from 'apollo-angular';
import {debounceTime, filter, map, switchMap} from 'rxjs/operators';
import {CREATE_CUSTOMER, CUSTOMER_DETAIL_QUERY, GET_CUSTOMERS} from "../../constantes/constantes.graphql";
import {loadDefaultCustomer} from "./default-customer";

@Component({
	selector: 'app-customer-picker-modal',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './customer-picker-modal.component.html',
	styleUrls: ['./customer-picker-modal.component.scss'],
})
export class CustomerPickerModalComponent implements OnInit {
	@Input() visible = false;
	@Output() close = new EventEmitter<void>();
	@Output() customerSelected = new EventEmitter<any>();

	searchTerm = new FormControl('');
	customers: any[] = [];
	loading = false;
	currentPage = 1;
	pageSize = 10;
	totalItems = 0;
	totalPages = 1;
	selectedCustomerId: string | null = null;
	focusedIndex = 0;

	showNewForm = false;
	newCustomerForm!: FormGroup;

	constructor(private apollo: Apollo, private fb: FormBuilder) {}

	ngOnInit(): void {
		this.newCustomerForm = this.fb.group({
			firstName: [''],
			lastName: [''],
			emailAddress: [''],
		});
		this.loadDefaultCustomer();
		this.searchTerm.valueChanges.pipe(
			debounceTime(300),
			filter(v => (v && v.length >= 3) || v === '')
		).subscribe(() => {
			this.currentPage = 1;
			this.loadCustomers();
		});
	}

	private loadDefaultCustomer(): void {
		loadDefaultCustomer(this.apollo).pipe(
			map(result => result.data.customers.items),
			filter(items => items.length > 0),
			map(items => items[0].id),
			switchMap(id =>
				this.apollo.query<any>({
					query: CUSTOMER_DETAIL_QUERY,
					variables: {
						id,
						orderListOptions: { sort: { orderPlacedAt: 'DESC' } },
					},
				})
			)
		).subscribe(({ data }) => {
			const customer = data.customer;
			this.customers = [customer];
			this.selectedCustomerId = customer.id;
		});
	}

	private loadCustomers(): void {
		this.loading = true;
		const skip = (this.currentPage - 1) * this.pageSize;
		const take = this.pageSize;
		const term = this.searchTerm.value || '';
		this.apollo.watchQuery<any>({
			query: GET_CUSTOMERS,
			variables: {
				options: {
					skip,
					take,
					filter: {
						emailAddress: { contains: term },
						lastName: { contains: term },
					},
					filterOperator: 'OR',
				},
			},
		}).valueChanges.subscribe(({ data, loading }) => {
			this.loading = loading;
			this.customers = data.customers.items;
			this.totalItems = data.customers.totalItems;
			this.totalPages = Math.max(Math.ceil(this.totalItems / this.pageSize), 1);
			this.focusedIndex = 0;
		});
	}

	prevPage(): void {
		if (this.currentPage > 1) {
			this.currentPage--;
			this.loadCustomers();
		}
	}

	nextPage(): void {
		if (this.currentPage < this.totalPages) {
			this.currentPage++;
			this.loadCustomers();
		}
	}

	goTo(page: number): void {
		this.currentPage = page;
		this.loadCustomers();
	}

	changePageSize(size: number): void {
		this.pageSize = size;
		this.currentPage = 1;
		this.loadCustomers();
	}

	onCreateCustomer(): void {
		if (this.newCustomerForm.invalid) {
			return;
		}
		this.loading = true;
		this.apollo.mutate<any>({
			mutation: CREATE_CUSTOMER,
			variables: { input: this.newCustomerForm.value },
		}).subscribe(({ data }) => {
			this.loading = false;
			const result = data.createCustomer;
			if (result.errorCode) {
				return;
			}
			this.customerSelected.emit(result);
			this.close.emit();
		});
	}

	cancelNew(): void {
		this.showNewForm = false;
		this.newCustomerForm.reset();
	}

	selectCustomer(c: any): void {
		this.selectedCustomerId = c.id;
		this.customerSelected.emit(c);
		this.close.emit();
	}

	@HostListener('document:keydown.escape')
	onEscape(): void {
		this.close.emit();
	}

	@HostListener('keydown.arrowdown', ['$event'])
	onArrowDown(e: KeyboardEvent): void {
		e.preventDefault();
		if (this.focusedIndex < this.customers.length - 1) {
			this.focusedIndex++;
		}
	}

	@HostListener('keydown.arrowup', ['$event'])
	onArrowUp(e: KeyboardEvent): void {
		e.preventDefault();
		if (this.focusedIndex > 0) {
			this.focusedIndex--;
		}
	}

	@HostListener('keydown.enter')
	onEnter(): void {
		const c = this.customers[this.focusedIndex];
		if (c) {
			this.selectCustomer(c);
		}
	}
}

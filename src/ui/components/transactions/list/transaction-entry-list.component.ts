import {ChangeDetectionStrategy, Component, signal, effect, Input, inject} from '@angular/core';
import {TypedBaseListComponent, SharedModule, NotificationService} from '@vendure/admin-ui/core';
import { ClrSidePanelModule } from '@clr/angular';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {

	GetTransactionEntriesQuery,
	GetTransactionEntriesQueryVariables,
	TransactionEntry,
} from '../../../graphql/graphql';
import {FieldConfig} from "../../commun/variables/field-config";
import {GenericDetailComponent} from "../../commun/generic-detail/generic-detail.component";
import {deleteTransactionEntriesDocument, DeleteTransactionEntryDocument} from "../../../graphql/graphql.delete";
import {GenericExportComponent} from "../../commun/generic-export/generic-export.component";
import {GenericImportComponent} from "../../commun/generic-import/generic-import.component";
import {
	GetTransactionEntriesDocument,
	GetTransactionEntryDetailDocument,
	UpdateTransactionEntryDocument,
	CreateTransactionEntryDocument
} from "../../../graphql/transactions.graphql";

@Component({
	selector: 'transaction-entry-list',
	templateUrl: './transaction-entry-list.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [
		SharedModule,
		ClrSidePanelModule,
		GenericDetailComponent,
		GenericExportComponent,
		GenericImportComponent
	],
})
export class TransactionEntryListComponent
	extends TypedBaseListComponent<typeof GetTransactionEntriesDocument, 'transactionEntries'>
{

	dataTableListId = 'transaction-list';
	pageLocationId = 'transaction-list' as const;

	@Input() entityId?: string;
	@Input() closePanel!: () => void;
	@Input() refresh!: () => void;

	searchTermControl = new FormControl<string>('');

	readonly fields: FieldConfig[] = [
		{ name: 'amount',      label: 'Amount',      type: 'number', defaultValue: null, validators: [] },
		//{ name: 'typeEntry',   label: 'Type',        type: 'text',   defaultValue: 'DEBIT', validators: [] },
		{
			name: 'typeEntry',
			label: 'Type transaction',
			type: 'toggle',
			defaultValue: 'CREDIT',
			toggle: { on: 'CREDIT', off: 'DEBIT' }
		},
		{ name: 'dateTransaction', label: 'Date', type: 'datetime-local',   defaultValue: '' },
		{ name: 'description', label: 'Description', type: 'text',   defaultValue: '' },
		{ name: 'code',        label: 'Code',        type: 'text',   defaultValue: '' },

	];

	readonly filters = this.createFilterCollection()
		.addFilter({ name: 'code',     type: { kind: 'text'   }, label: 'Code',   filterField: 'code' })
		.addFilter({ name: 'amount',   type: { kind: 'number' }, label: 'Amount', filterField: 'amount' })
		.addFilter({ name: 'typeEntry',type: { kind: 'text'   }, label: 'Type',   filterField: 'typeEntry' })
		.connectToRoute(this.route);

	readonly sorts = this.createSortCollection()
		.defaultSort('createdAt', 'DESC')
		.addSort({ name: 'id' })
		.addSort({ name: 'code' })
		.addSort({ name: 'amount' })
		.addSort({ name: 'typeEntry' })
		.addSort({ name: 'createdAt' })
		.addSort({ name: 'dateTransaction' })
		.addSort({ name: 'updatedAt' })
		.connectToRoute(this.route);

 	readonly panelOpen       = signal(false);
	openPanelExport = signal(false);
	openPanelImport = signal(false);

	isDeleteEnabled = signal(true);

	readonly selectedEntry = signal<TransactionEntry | null>(null);

	readonly GetTransactionEntryDocument = GetTransactionEntriesDocument;
	readonly CreateTransactionEntryDocument = CreateTransactionEntryDocument;
	readonly UpdateTransactionEntryDocument = UpdateTransactionEntryDocument;
	readonly DeleteTransactionEntryDocument   = DeleteTransactionEntryDocument;

	notificationService = inject(NotificationService);

	constructor(protected route: ActivatedRoute) {
		super();
		effect(() => {
			if (!this.panelOpen()) {
				this.refresh();
			}
		});
		super.configure({
			document: GetTransactionEntriesDocument,
			getItems: (data: GetTransactionEntriesQuery) => data.transactionEntries,
			setVariables: (skip, take): GetTransactionEntriesQueryVariables => ({
				options: {
					skip,
					take,
					filter: this.filters.createFilterInput(),
					sort: this.sorts.createSortInput(),
				},
			}),
			refreshListOnChanges: [this.filters.valueChanges, this.sorts.valueChanges],
		});
	}

	onSearch(): void {
		this.refresh();
	}

	setPage(page: number): void {
		super.setPageNumber(page);
	}

	setItemsPerPage(size: number): void {
		super.setItemsPerPage(size);
	}

	create(): void {
		this.selectedEntry.set(null);
		this.panelOpen.set(true);
	}

	edit(entry: TransactionEntry): void {
		this.selectedEntry.set(entry);
		this.panelOpen.set(true);
	}

	onPanelClose(): void {
		this.panelOpen.set(false);
	}

	showConfirm(): void {
		if (!confirm('Are you sure to close?')) {
			return;
		}
		this.panelOpen.set(false);
	}

	importToggle(): void {
		if(this.openPanelImport()) {
			this.openPanelImport.set(false);
			return;
		}
		this.openPanelImport.set(true);
	}
	exportToggle(): void {
		if(this.openPanelExport()) {
			this.openPanelExport.set(false);
			return;
		}
		this.openPanelExport.set(true);
	}

	closeImport(){
		this.openPanelImport.set(false);
	}

	closeExport(){
		this.openPanelExport.set(false);

	}

	deleteAll(): void {

		const ok = confirm('Are you sure to delete?');
		if (!ok) {
			return;
		}
		const selected = this.selectionManager.selection;
		const ids = selected.map((item: { id: any; }) => item.id);

		if (ids.length === 0) {
			this.notificationService.error('Aucune entrée sélectionnée');
			return;
		}

		this.dataService
			.mutate(deleteTransactionEntriesDocument, { ids })
			.subscribe({
				next: (response) => {
					console.log(response);
					this.notificationService.success('Supprimé avec succès');
					this.refresh();
					this.selectionManager.clearSelection();

				},
				error: (error) => {
					this.notificationService.error(`Erreur: ${error.message}`);
				},
			})
	}


}

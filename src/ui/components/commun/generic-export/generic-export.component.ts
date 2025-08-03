import {
	Component,
	Input,
	ChangeDetectionStrategy,
	OnInit,
	OnChanges,
	SimpleChanges,
} from '@angular/core';
import { DataService, SharedModule } from '@vendure/admin-ui/core';
import { first } from 'rxjs/operators';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

export interface ExportField {
	name: string;
	label: string;
}

interface SelectableField extends ExportField {
	selected: boolean;
}

@Component({
	selector: 'generic-export',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './generic-export.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericExportComponent<T> implements OnInit, OnChanges {
	/** Requête GraphQL paginée (items + totalItems) */
	@Input() query!: TypedDocumentNode<
		{ [key: string]: { items: T[]; totalItems: number } },
		{ options: { skip: number; take: number } }
	>;
	/** Clé de l’objet retourné par la requête (ex. 'transactionEntries') */
	@Input() entityKey!: string;
	/** Liste initiale des colonnes exportables */
	@Input() fields: ExportField[] = [];
	/** Nom de fichier */
	@Input() filename = 'export.csv';
	/** Libellé du bouton */
	@Input() label = 'Exporter CSV';

	/** Liste interne avec état coché/décoché */
	selectableFields: SelectableField[] = [];

	ngOnInit(): void {
		this.initSelectableFields();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['fields']) {
			this.initSelectableFields();
		}
	}

	private initSelectableFields() {
		this.selectableFields = this.fields.map(f => ({
			...f,
			selected: true,
		}));
	}

	toggleField(index: number, checked: boolean) {
		this.selectableFields[index].selected = checked;
	}

	export(): void {
		// 1️⃣ Récupérer totalItems pour paginer
		this.data
			.query(this.query, { options: { skip: 0, take: 1 } })
			.stream$
			.pipe(first())
			.subscribe(res1 => {
				const list1 = (res1 as any)[this.entityKey] as {
					items: T[];
					totalItems: number;
				};
				const total = list1.totalItems;
				// 2️⃣ Re-fetch complet
				this.data
					.query(this.query, { options: { skip: 0, take: total } })
					.stream$
					.pipe(first())
					.subscribe(res2 => {
						const items = (res2 as any)[this.entityKey].items as T[];
						this.downloadCSV(items);
					});
			});
	}

	private downloadCSV(items: T[]): void {
		// Déterminer les colonnes sélectionnées
		const cols = this.selectableFields.filter(f => f.selected);
		// En-têtes
		const header = cols.map(f => `"${f.label}"`).join(',');
		// Lignes
		const rows = items.map(item =>
			cols
				.map(f => {
					const val = (item as any)[f.name];
					const cell = val != null ? String(val).replace(/"/g, '""') : '';
					return `"${cell}"`;
				})
				.join(',')
		);
		const csv = [header, ...rows].join('\r\n');
		// Téléchargement
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = this.filename;
		link.click();
		URL.revokeObjectURL(url);
	}

	constructor(private data: DataService) {}
}

import {
	Component,
	Input,
	Output,
	EventEmitter,
	ChangeDetectionStrategy,
	signal
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DataService, NotificationService, SharedModule } from '@vendure/admin-ui/core';
import { first } from 'rxjs/operators';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { FieldConfig } from '../variables/field-config';

@Component({
	selector: 'generic-import',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './generic-import.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericImportComponent<T, V = any> {
	@Input() createMutation!: TypedDocumentNode<{ [P in string]: T }, { input: V }>;
	@Input() fields: FieldConfig[] = [];
	@Input() customFields: Record<string, any> = {};
	@Input() translations: any[] = [];
	@Input() localizedName = '';
	@Input() label = 'Importer CSV';
	@Output() refresh = new EventEmitter<void>();
	@Output() close = new EventEmitter<void>();

	file?: File;
	rawCsv = '';
	previewRows: V[] = [];
	previewCols: Array<{ header: string; fieldName: string }> = [];
	loading = false;

	// Signaux pour logs, erreurs, affichage, et import unique
	logs = signal<string[]>([]);
	errors = signal<string[]>([]);
	showPreview = signal(false);
	imported = signal(false);

	constructor(
		private data: DataService,
		private notify: NotificationService,
	) {}

	onFileSelected(event: Event): void {
		this.resetInternal();
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) {
			this.file = undefined;
			return;
		}
		this.file = input.files[0];
		const reader = new FileReader();
		reader.onload = () => {
			this.rawCsv = reader.result as string;
		};
		reader.readAsText(this.file);
	}

	togglePreview(): void {
		this.errors.set([]);
		if (!this.rawCsv) {
			this.errors.set(['Aucun fichier sélectionné.']);
			return;
		}
		if (!this.showPreview() && this.previewRows.length === 0) {
			this.parseCSV(this.rawCsv);
			if (this.previewRows.length === 0) {
				this.errors.set(['Aucune donnée à afficher.']);
				return;
			}
		}
		this.showPreview.set(true)
	}

	generateTemplate(): void {
		const header = this.fields.map(f => `"${f.label}"`).join(',');
		const blank = this.fields.map(() => '""').join(',');
		const csv = [header, blank].join('\r\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'template.csv';
		link.click();
		URL.revokeObjectURL(url);
	}

	/** Bouton Reset */
	reset(): void {
		// this.file = undefined;
		this.rawCsv = '';
		this.resetInternal();
	}

	private resetInternal(): void {
		this.previewRows = [];
		this.previewCols = [];
		this.logs.set([]);
		this.errors.set([]);
		this.showPreview.set(false);
		this.imported.set(false);
		this.loading = false;
	}

	import(): void {
		if (this.imported() || this.previewRows.length === 0) {
			return;
		}
		this.loading = true;
		this.logs.set([]);
		this.errors.set([]);
		const total = this.previewRows.length;
		let done = 0;

		this.previewRows.forEach((row, idx) => {
			const input = {
				...row,
				customFields: this.customFields,
				translations: this.translations,
				localizedName: this.localizedName,
			} as V;

			this.data
				.mutate(this.createMutation, { input })
				.pipe(first())
				.subscribe({
					next: () => {
						done++;
						this.logs.update(l => [
							...l,
							`Ligne ${idx + 1}/${total} importée.`,
						]);
						if (done === total) {
							this.logs.update(l => [
								...l,
								`Import terminé (${done}/${total}).`,
							]);
							this.loading = false;
							this.imported.set(true);
							this.refresh.emit();
						}
					},
					error: err => {
						done++;
						this.errors.update(e => [
							...e,
							`Erreur ligne ${idx + 1}: ${err.message || err}`,
						]);
						if (done === total) {
							this.loading = false;
							this.imported.set(true);
						}
					},
				});
		});
	}

	private parseCSV(text: string): void {
		const lines = text.trim().split(/\r\n|\n/);
		if (!lines.length) return;

		const rawHeaders = this.splitCSVLine(lines[0]);
		this.previewCols = rawHeaders
			.map(h => {
				const fld = this.fields.find(f => f.label === h);
				return fld ? { header: h, fieldName: fld.name } : null;
			})
			.filter((c): c is { header: string; fieldName: string } => c !== null);

		this.previewRows = lines
			.slice(1)
			.filter(l => l.trim() !== '')
			.map(line => {
				const values = this.splitCSVLine(line);
				const obj: any = {};
				this.previewCols.forEach((col, i) => {
					const raw = values[i] ?? '';
					const cfg = this.fields.find(f => f.name === col.fieldName);
					obj[col.fieldName] =
						cfg?.type === 'number' && raw !== '' ? Number(raw) : raw;
				});
				return obj as V;
			});
	}

	private splitCSVLine(line: string): string[] {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			if (inQuotes) {
				if (char === '"') {
					if (i + 1 < line.length && line[i + 1] === '"') {
						current += '"';
						i++;
					} else {
						inQuotes = false;
					}
				} else {
					current += char;
				}
			} else {
				if (char === '"') {
					inQuotes = true;
				} else if (char === ',') {
					result.push(current);
					current = '';
				} else {
					current += char;
				}
			}
		}
		result.push(current);
		return result.map(c => c.trim());
	}

	onClose(){
		this.close.emit();
	}

}

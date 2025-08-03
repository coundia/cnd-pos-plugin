import {
	Component, Input, Output, EventEmitter,
	ChangeDetectionStrategy, OnInit, OnChanges, SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DataService, NotificationService, SharedModule } from '@vendure/admin-ui/core';
import { first } from 'rxjs/operators';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { FieldConfig } from '../variables/field-config';

@Component({
	selector: 'generic-detail',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './generic-detail.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericDetailComponent<T, V = any> implements OnInit, OnChanges {
	@Input() detailQuery?: TypedDocumentNode<{ [P in string]: T }, { id: string }>;
	@Input() createMutation!: TypedDocumentNode<{ [P in string]: T }, { input: V }>;
	@Input() updateMutation!: TypedDocumentNode<{ [P in string]: T }, { input: Partial<V> & { id: string } }>;
	/** NEW: the delete mutation */
	@Input() deleteMutation?: TypedDocumentNode<{ [P in string]: any }, { id: string }>;

	@Input() entityKey!: string;
	@Input() fields: FieldConfig[] = [];

	@Input() entity?: T | null;
	@Input() id?: string;

	@Input() customFields: Record<string, any> = {};
	@Input() translations: any[] = [];
	@Input() localizedName = '';

	@Output() closePanel = new EventEmitter<void>();
	@Output() refresh    = new EventEmitter<void>();

	form: FormGroup;

	constructor(
		private fb: FormBuilder,
		private data: DataService,
		private notify: NotificationService,
	) {
		this.form = this.fb.group({});
	}

	ngOnInit(): void {
		for (const f of this.fields) {
			this.form.addControl(
				f.name,
				this.fb.control(f.defaultValue ?? null, f.validators || [])
			);
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['entity']) {
			if (this.entity) {
				// assume T has `id`
				// @ts-ignore
				this.id = (this.entity as any).id;
				this.patchForm(this.entity);
			} else {
				this.id = undefined;
				this.resetForm();
			}
		} else if (changes['id'] && this.id && !this.entity && this.detailQuery) {
			this.loadById(this.id);
		}
	}

	private loadById(id: string) {
		this.data.query(this.detailQuery!, { id })
			.stream$
			.pipe(first())
			.subscribe(res => {
				const ent = (res as any)[this.entityKey] as T;
				if (ent) {
					this.patchForm(ent);
				}
			});
	}

	private patchForm(ent: T) {
		const patch: any = {};
		this.fields.forEach(f => {
			if ((ent as any)[f.name] !== undefined) {
				patch[f.name] = (ent as any)[f.name];
			}
		});
		this.form.patchValue(patch);
	}

	private resetForm() {
		const defaults = this.fields.reduce((acc, f) => ({
			...acc,
			[f.name]: f.defaultValue ?? null,
		}), {});
		this.form.reset(defaults);
	}

	save(stay = false): void {
		if (this.form.invalid) return;

		const raw = this.form.value as { [key: string]: any };
		const payload: any = {};

		this.fields.forEach(f => {
			const val = raw[f.name];
			payload[f.name] = val;

			if (f.type === 'datetime-local' && val) {
				payload[f.name] = new Date(val).toISOString();
			}

			if (f.type === 'number' && val) {
				payload[f.name] = Number(val);
			}

			if (val == '') {
				payload[f.name] = null;
			}
		});

		payload.customFields   = this.customFields;
		payload.translations   = this.translations;
		payload.localizedName  = this.localizedName;

		if (this.id) {
			const updateInput = { id: this.id, ...payload } as Partial<V> & { id: string };
			this.data.mutate(this.updateMutation, { input: updateInput })
				.pipe(first())
				.subscribe(() => {
					this.notify.success('Enregistrement mis à jour');
					this.refresh.emit();
					if (!stay) this.closePanel.emit();
				});
		} else {
			const createInput = payload as V;
			this.data.mutate(this.createMutation, { input: createInput })
				.pipe(first())
				.subscribe(() => {
					this.notify.success('Enregistrement créé');
					this.refresh.emit();
					if (!stay) this.closePanel.emit();
					else this.resetForm();
				});
		}
	}

	/** NEW: delete handler */
	delete(stay = false): void {
		if (!this.id || !this.deleteMutation) return;
		if (!confirm('Are you sure you want to delete this item?')) return;

		this.data.mutate(this.deleteMutation, { id: this.id })
			.pipe(first())
			.subscribe(() => {
				this.notify.success('Enregistrement supprimé');
				this.refresh.emit();
				this.closePanel.emit();
			});
	}

	onMultiToggleChange(field: string, event: Event) {
		const input = event.target as HTMLInputElement;
		const control = this.form.get(field);
		if (!control) return;

		const currentValues: string[] = control.value || [];
		if (input.checked) {
			control.setValue([...currentValues, input.value]);
		} else {
			control.setValue(currentValues.filter(v => v !== input.value));
		}
	}

	onSingleToggleChange(field: string, event: Event, f: any) {
		const input = event.target as HTMLInputElement;
		const control = this.form.get(field);
		const onValue = f.toggle?.on ?? 'YES';
		const offValue = f.toggle?.off ?? 'NO';
		control?.setValue(input.checked ? onValue : offValue);
	}


}

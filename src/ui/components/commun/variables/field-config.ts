export type FieldType = 'text' | 'number' | 'date' | 'select' | 'datetime-local' | 'multi-toggle' | 'toggle';

export interface FieldConfig {
	/** nom du champ tel qu’il apparaît dans le FormGroup */
	name: string;
	/** étiquette affichée */
	label: string;
	/** type de l’input */
	type: FieldType;
	/** valeur par défaut */
	defaultValue?: any;
	/** validateurs Angular */
	validators?: any[];
	/** options (pour select) */
	options?: Array<{ value: any; label: string }>;

	toggle?: { on: string; off: string };
}

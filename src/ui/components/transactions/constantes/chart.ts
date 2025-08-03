export interface ChartFormatOptions {
	formatValueAs: 'currency' | 'number';
	currencyCode?: string;
	locale?: string;
}

export interface ChartEntry {
	label: string;
	value: number;
	formatOptions: ChartFormatOptions;
}
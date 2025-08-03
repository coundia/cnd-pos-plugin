export function parseAmount(amount: any): number {
	const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;

	if (isNaN(parsed) || parsed <= 0) {
		return 0;
	}

	return Math.round(parsed * 100);
}

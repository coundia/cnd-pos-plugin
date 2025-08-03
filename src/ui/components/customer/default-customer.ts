import {GET_CUSTOMER_BY_EMAIL} from "../../constantes/constantes.graphql";
import {Apollo} from "apollo-angular";

export function  loadDefaultCustomer(apollo: Apollo){
	return apollo.query<any>({
		query: GET_CUSTOMER_BY_EMAIL,
		variables: {email: 'anonymous@domain.local'},
	})
}
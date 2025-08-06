# install cnd-pos-plugin

```bash
npm i cnd-pos-plugin

```

```
\\1) add import path from 'path';

import {CndPosPlugin} from "cnd-pos-plugin";

export const config: VendureConfig = {
		// .. config options
		plugins: [
		\\2) add plugin  
		  CndPosPlugin.init({}),
		 
		},
		app: compileUiExtensions({
					outputPath: path.join(__dirname, '../admin-ui'),
					extensions: [
					\\3) add extension
						CndPosPlugin.ui
					],
					devMode: IS_DEV,
				}),
			}),
		],
};```



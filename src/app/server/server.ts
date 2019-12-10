import { CustomModuleLoader } from './CustomModuleLoader';
let moduleLoader = new CustomModuleLoader('/dist-server/projects');
import * as express from 'express';
import { ExpressBridge } from '@remult/server';
import * as fs from 'fs';

import '../app.module';
import {serverInit} from './server-init';


serverInit().then(async (dataSource) => {

    let app = express();
    let eb = new ExpressBridge(app, dataSource, process.env.DISABLE_HTTPS == "true");
    

    app.use(express.static('dist/my-project'));

    app.use('/*', async (req, res) => {

        const index = 'dist/my-project/index.html';
        if (fs.existsSync(index)) {
            res.send(fs.readFileSync(index).toString());
        }
        else {
            res.send('No Result' + index);

        }
    });

    let port = process.env.PORT || 3000;
    app.listen(port);
});
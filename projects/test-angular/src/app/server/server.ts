import { CustomModuleLoader } from './CustomModuleLoader';
let moduleLoader = new CustomModuleLoader('/dist/test-angular');
import * as express from 'express';
import * as swaggerUi from 'swagger-ui-express';
import * as cors from 'cors';
import { initExpress } from 'remult/server';
import * as fs from 'fs';
//import '../app.module';
import { serverInit } from './server-init';


import { createPostgresConnection, preparePostgresQueueStorage } from 'remult/postgres';

import * as compression from 'compression';
import * as forceHttps from 'express-force-https';
import * as jwt from 'express-jwt';



const getDatabase = () => {
    if (1 + 1 == 3)
        return undefined;
    return createPostgresConnection({ configuration: "heroku" })
}


const d = new Date(2020, 1, 2, 3, 4, 5, 6);
serverInit().then(async (dataSource) => {

    let app = express();
    app.use(jwt({ secret: process.env.TOKEN_SIGN_KEY, credentialsRequired: false, algorithms: ['HS256'] }));
    app.use(cors());
    app.use(compression());
    if (process.env.DISABLE_HTTPS != "true")
        app.use(forceHttps);

    let api = initExpress(app, {
        dataProvider: getDatabase(),
        queueStorage: await preparePostgresQueueStorage(dataSource),

    });
    app.use('/api/docs', swaggerUi.serve,
        swaggerUi.setup(api.openApiDoc({ title: 'remult-angular-todo' })));

    app.use(express.static('dist/my-project'));
    app.get('/api/noam', async (req, res) => {
        let c = await api.getRemult(req);
        res.send('hello ' + JSON.stringify(c.user));
    });
    let r = await api.getRemult();
    console.log(r.user);

    app.use('/*', async (req, res) => {
        console.log(req.path);
        const index = 'dist/my-project/index.html';
        if (fs.existsSync(index)) {
            res.send(fs.readFileSync(index).toString());
        }
        else {
            res.send('No Result' + index);
        }
    });


    let port = process.env.PORT || 3001;
    app.listen(port);
});

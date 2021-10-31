//import { CustomModuleLoader } from '../../../../../../repos/radweb/src/app/server/CustomModuleLoader';
//let moduleLoader = new CustomModuleLoader('/dist-server/repos/radweb/projects/');
import * as express from 'express';
import { initExpress } from 'remult/server';
import { config } from 'dotenv';
import sslRedirect from 'heroku-ssl-redirect'
import { createPostgresConnection } from 'remult/postgres';
import * as swaggerUi from 'swagger-ui-express';
import { buildSchema } from 'graphql';
import { graphqlHTTP } from 'express-graphql';
import { remultGraphql } from 'remult/graphql';
import * as helmet from 'helmet';
import * as jwt from 'express-jwt';
import * as compression from 'compression';
import '../app/app.module';
import { getJwtTokenSignKey } from '../app/auth.service';

async function startup() {
    config(); //loads the configuration from the .env file
    const app = express();
    app.use(sslRedirect());
    app.use(jwt({ secret: getJwtTokenSignKey(), credentialsRequired: false, algorithms: ['HS256'] }));
    app.use(compression());
    app.use(
        helmet({
            contentSecurityPolicy: false,
        })
    );
    const dataProvider = async () => {
        if (process.env.NODE_ENV === "production")
            return createPostgresConnection({ configuration: "heroku" })
        return undefined;
    }
    let api = initExpress(app, {
        dataProvider
    });
    app.use('/api/docs', swaggerUi.serve,
        swaggerUi.setup(api.openApiDoc({ title: 'remult-react-todo' })));

    const { schema, rootValue } = remultGraphql(api);
    app.use('/api/graphql', graphqlHTTP({
        schema: buildSchema(schema),
        rootValue,
        graphiql: true,
    }));

    app.use(express.static('dist/my-project'));
    app.use('/*', async (req, res) => {
        try {
            res.sendFile('./dist/<%= project %>/index.html');
        } catch (err) {
            res.sendStatus(500);
        }
    });
    let port = process.env.PORT || 3000;
    app.listen(port);
}
startup();
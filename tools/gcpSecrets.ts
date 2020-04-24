// Import the Secret Manager client and instantiate it:
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as googleprotos from '@google-cloud/secret-manager/build/protos/protos';
import { appendFileSync } from 'fs-extra';
import dotenv from 'dotenv';
import { exit } from 'shelljs';

const client = new SecretManagerServiceClient();

const project = 'projects/pandemicparlour';

async function getProjectSecrets(parentPath = project): Promise<googleprotos.google.cloud.secretmanager.v1.ISecret[]> {
    const [secrets] = await client.listSecrets({
        parent: parentPath,
    });
    return secrets;
}

async function getSecretLatestEnabled(secret: string): Promise<string> {

    const [versions] = await client.listSecretVersions({
        parent: secret
    });

    let version: googleprotos.google.cloud.secretmanager.v1.ISecretVersion;

    for (const v of versions) {
        if (v.state === 'ENABLED') {
            version = v;
            break;
        }
    }

    if (version === undefined) {
        throw (Error("No enabled versions of " + secret));
    }

    const [secValue] = await client.accessSecretVersion({
        name: version.name
    })

    return (secValue.payload.data.toString());
}

const args = process.argv.slice(2);
const env = (args[0] ? args[0] : './.env');

dotenv.config({
    path: env
});

getProjectSecrets().
    then((secrets) => {
        secrets.forEach(secret => {
            getSecretLatestEnabled(secret.name).
                then(payload => {
                    const secretPath:string[] = secret.name.split('/');
                    const secretName = secretPath[3];
                    const value = payload;
                    // tslint:disable-next-line: no-console
                    console.info(`Env: ${secretName}=${payload.substr(0,1)}`);

                    if (secretName in process.env) {
                        // tslint:disable-next-line: no-console
                        console.log(`env already contains ${secretName}`);
                    } else {
                        appendFileSync(env, `${secretName}=${value}\n`);
                    }
                }).catch((error) => {
                    // tslint:disable-next-line: no-console
                    console.error("fetching secret failed:" + error);
                    exit(1);
                });
        });
    }).
    catch((error) => {
        // tslint:disable-next-line: no-console
        console.error("couldn't get project secrets:" + error)
        exit(2);
    });

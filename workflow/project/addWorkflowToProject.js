const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

exports.handler = async (event) => {
    const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' });
    const configuration = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: 'serverless/lambda/credintials' }));
    const dbConfig = JSON.parse(configuration.SecretString);
    
    const client = new Client({
        host: dbConfig.host,
        port: dbConfig.port,
        database: 'workflow',
        user: dbConfig.engine,
        password: dbConfig.password
    });
    try {
        await client
        .connect()
        .then(() => {
            console.log("Connected to the database");
        })
        .catch((err) => {
            console.log("Error connecting to the database. Error :" + err);
        });
        
        const projectId = event.queryStringParameters.project_id;
 
        // Fetch the existing JSON data from the database
        const result = await client.query('SELECT id, project FROM projects_table WHERE id = $1', [projectId]);
        const existingData = result.rows[0];
 
        // Parse the "workflows" object from the request body
        const workflowsObject = JSON.parse(event.body);
 
        // Update the JSON data with the provided "workflows" object
        existingData.project.workflows = workflowsObject;
 
        // Update the JSON data back to the database
        await client.query('UPDATE projects_table SET project = $1 WHERE id = $2', [existingData.project, projectId]);
 
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data updated successfully' }),
        };
    } catch (error) {
        console.error('Error updating data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        await client.end();
    }
};